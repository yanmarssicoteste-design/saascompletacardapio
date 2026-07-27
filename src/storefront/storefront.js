/**
 * storefront.js — Pizzaria SaaS v5 — build: 2026-07-27-v2
 * Orquestrador: lê o slug da URL, busca dados no Firestore,
 * e delega a renderização para o template escolhido pelo lojista.
 * FIX: currentTemplateId — ES modules são imutáveis, não use mod.prop = x
 */

import '../styles/variables.css';
import '../styles/base.css';

import { subscribeStoreBySlug } from '../lib/store-repo.js';

// ── DOM ──
const $loading  = document.getElementById('loadingState');
const $notFound = document.getElementById('notFoundState');
const $vMenu    = document.getElementById('vMenu');

// ── Slug da URL ──
const params = new URLSearchParams(location.search);
const slug   = params.get('loja');

if (!slug) {
  showNotFound();
} else {
  startSubscription(slug);
}

// ── Subscription ──
let templateModule   = null;
let currentTemplateId = null;   // rastreamos o ID aqui (módulos ES são imutáveis)
let unsubscribe      = null;

async function startSubscription(slug) {
  unsubscribe = subscribeStoreBySlug(slug, async (doc) => {
    if (!doc) { showNotFound(); return; }

    // Apply brand color as CSS variable
    if (doc.color) {
      document.documentElement.style.setProperty('--brand-color', doc.color);
      document.documentElement.style.setProperty('--red', doc.color);
    }

    // Update page <title> and <meta description>
    document.title = `${doc.name} — Cardápio`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', `Peça sua ${doc.name.toLowerCase()} online direto pelo WhatsApp. ${doc.tagline || ''}`);

    const template = doc.template || 'classic';

    // Load template module if changed
    if (!templateModule || currentTemplateId !== template) {
      await loadTemplate(template, doc);
    } else {
      // Template already loaded — update live data
      templateModule.update(doc);
    }
  });
}

async function loadTemplate(templateId, doc) {
  // Show loading, hide menu while switching
  $loading.style.display = 'flex';
  $vMenu.style.display   = 'none';

  try {
    let mod;
    if (templateId === 'editorial') {
      mod = await import('./templates/editorial.js');
    } else if (templateId === 'dark') {
      mod = await import('./templates/dark.js');
    } else {
      mod = await import('./templates/classic.js');
    }
    currentTemplateId = templateId;   // salva na variável local, não no módulo
    templateModule    = mod;
    await mod.init($vMenu, doc);
    $loading.style.display = 'none';
    $vMenu.style.display   = 'block';
  } catch (err) {
    console.error('[storefront] failed to load template:', err);
    showNotFound();
  }
}

function showNotFound() {
  $loading.style.display   = 'none';
  $notFound.style.display  = 'flex';
  $vMenu.style.display     = 'none';
}
