// ═══════════════════════════════════════════════════════════
// Camada de acesso a dados (Firestore) — multi-tenant.
// /stores/{uid}  -> 1 documento por pizzaria
// /slugs/{slug}  -> { uid }  mapeia URL amigável -> dono
// ═══════════════════════════════════════════════════════════
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { slugify } from './format.js';
import { seedStore } from './seed.js';

export async function slugExists(slug) {
  const snap = await getDoc(doc(db, 'slugs', slug));
  return snap.exists();
}
export async function reserveUniqueSlug(baseName) {
  let base = slugify(baseName) || 'pizzaria';
  let candidate = base;
  let i = 2;
  while (await slugExists(candidate)) { candidate = `${base}-${i}`; i++; }
  return candidate;
}
export async function provisionStore({ uid, name, phone, email }) {
  const slug = await reserveUniqueSlug(name);
  const storeData = { ...seedStore({ name, phone, slug }), ownerUid: uid, ownerEmail: email, createdAt: serverTimestamp() };
  await setDoc(doc(db, 'slugs', slug), { uid });
  await setDoc(doc(db, 'stores', uid), storeData);
  return storeData;
}
export async function getStoreByUid(uid) {
  const snap = await getDoc(doc(db, 'stores', uid));
  return snap.exists() ? snap.data() : null;
}
export async function getUidBySlug(slug) {
  const snap = await getDoc(doc(db, 'slugs', slug));
  return snap.exists() ? snap.data().uid : null;
}
export async function getStoreBySlug(slug) {
  const uid = await getUidBySlug(slug);
  if (!uid) return null;
  const store = await getStoreByUid(uid);
  return store ? { uid, store } : null;
}
export function subscribeStoreByUid(uid, callback) {
  return onSnapshot(doc(db, 'stores', uid), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

/**
 * subscribeStoreBySlug — usado pelo storefront.js
 * Resolve slug → uid, depois abre onSnapshot no documento da loja.
 * callback(null) se loja não existir.
 * Retorna função de cancelamento.
 */
export function subscribeStoreBySlug(slug, callback) {
  let unsubStore = null;
  // primeiro resolve o slug de forma assíncrona
  getDoc(doc(db, 'slugs', slug)).then((slugSnap) => {
    if (!slugSnap.exists()) { callback(null); return; }
    const uid = slugSnap.data().uid;
    unsubStore = onSnapshot(doc(db, 'stores', uid), (snap) => {
      callback(snap.exists() ? snap.data() : null);
    });
  }).catch(() => callback(null));

  // retorna função que cancela a subscription quando chamada
  return () => { if (unsubStore) unsubStore(); };
}

export async function saveStoreData(uid, partialData) {
  await setDoc(doc(db, 'stores', uid), partialData, { merge: false });
}
