// ═══════════════════════════════════════════════════════════
// Camada de acesso a dados (Firestore) — multi-tenant.
// /stores/{uid}  -> 1 documento por pizzaria
// /slugs/{slug}  -> { uid }  mapeia URL amigável -> dono
// ═══════════════════════════════════════════════════════════
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { slugify } from './format.js';
import { seedStore } from './seed.js';

// IDs dos dados de demonstração legados injetados pelo seed antigo.
// Ao detectar qualquer um deles no documento, a loja é sanitizada automaticamente.
const LEGACY_PRODUCT_IDS  = new Set(['p1', 'p2', 'p3', 'p4', 'p5']);
const LEGACY_CATEGORY_IDS = new Set(['c1', 'c2', 'c3', 'c4']);
const LEGACY_COMBO_IDS    = new Set(['co1']);
const LEGACY_REVIEW_IDS   = new Set(['r1']);

/**
 * Verifica se o documento contém dados legados do seed antigo.
 * Se sim, remove-os silenciosamente e persiste a versão limpa no Firestore.
 * Retorna o documento (limpo ou original).
 */
export async function sanitizeLegacySeed(uid, storeDoc) {
  const hasLegacyProducts  = (storeDoc.products  || []).some(p  => LEGACY_PRODUCT_IDS.has(p.id));
  const hasLegacyCategories= (storeDoc.categories|| []).some(c  => LEGACY_CATEGORY_IDS.has(c.id));
  const hasLegacyCombos    = (storeDoc.combos    || []).some(co => LEGACY_COMBO_IDS.has(co.id));
  const hasLegacyReviews   = (storeDoc.reviews   || []).some(r  => LEGACY_REVIEW_IDS.has(r.id));

  if (!hasLegacyProducts && !hasLegacyCategories && !hasLegacyCombos && !hasLegacyReviews) {
    return storeDoc; // Nada a fazer
  }

  const cleaned = {
    ...storeDoc,
    products:   (storeDoc.products   || []).filter(p  => !LEGACY_PRODUCT_IDS.has(p.id)),
    categories: (storeDoc.categories || []).filter(c  => !LEGACY_CATEGORY_IDS.has(c.id)),
    combos:     (storeDoc.combos     || []).filter(co => !LEGACY_COMBO_IDS.has(co.id)),
    reviews:    (storeDoc.reviews    || []).filter(r  => !LEGACY_REVIEW_IDS.has(r.id)),
    // Limpa também campos de texto legados
    tagline:      storeDoc.tagline      === 'Feito com amor, entregue com sabor' ? '' : (storeDoc.tagline      || ''),
    rating:       storeDoc.rating       === '5.0 (novo)'                          ? '' : (storeDoc.rating       || ''),
    promoTxt:     storeDoc.promoTxt     && storeDoc.promoTxt.startsWith('🔥 Edite') ? '' : (storeDoc.promoTxt || ''),
    promoTag:     storeDoc.promoTag     === 'NOVIDADE'                            ? '' : (storeDoc.promoTag    || ''),
    deliveryTime: storeDoc.deliveryTime === '40–60 min'                          ? '' : (storeDoc.deliveryTime|| ''),
    hours:        storeDoc.hours        === '18h–23h'                            ? '' : (storeDoc.hours       || ''),
    closeTime:    storeDoc.closeTime    === '23:00'                               ? '' : (storeDoc.closeTime   || ''),
  };

  // Persiste silenciosamente em segundo plano, sem bloquear a UI
  setDoc(doc(db, 'stores', uid), cleaned, { merge: false }).catch(() => {});

  return cleaned;
}

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
