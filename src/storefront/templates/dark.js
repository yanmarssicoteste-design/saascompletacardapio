/**
 * dark.js — Template Notturno (Dark Forno)
 * Fundo carvão com 3 camadas: radiais ember+brand, grain SVG noise, halo blur-3xl hero.
 * Título com gradiente âmbar, badge "Forno aceso" pulsante, cards glassmorphism.
 * Fiel ao ZIP "Templates ideias/loja-dark (1).zip" e dossiê técnico.
 */

import '../../styles/templates/dark.css';

let store = {}, categories = [], products = [], combos = [], reviews = [];
let cart = [];
let activeCat = 'all';
let imCurrentPid = null;
let imQty = 1;

const fmtR = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
const $ = (id) => document.getElementById(id);

// ═══════════════════════════════════════════════
export async function init(container, doc) {
  loadDoc(doc);
  container.innerHTML = buildHTML();
  boot();
}

export function update(doc) {
  loadDoc(doc);
  populateStore();
  renderCats();
  renderMain();
}

function loadDoc(doc) {
  const { categories: c, products: p, combos: co, reviews: r, ...s } = doc;
  store = s; categories = c || []; products = p || []; combos = co || []; reviews = r || [];
}

// ═══════════════════════════════════════════════
// HTML SHELL
// ═══════════════════════════════════════════════
function buildHTML() {
  return `
  <div class="nt-root">

    <!-- GRAIN SVG — camada 2: noise texture em overlay -->
    <div class="nt-grain" aria-hidden="true"></div>

    <!-- NAV sticky top-0 -->
    <nav class="nt-nav">
      <div class="nt-nav-inner">
        <span class="nt-nav-logo" id="nt-nav-logo">Fornace</span>
        <div class="nt-nav-right">
          <div class="nt-nav-status">
            <span class="nt-ember-dot"></span>
            <div>
              <p class="nt-status-label">Forno aceso</p>
              <p class="nt-status-hours" id="nt-hours">18h–23h</p>
            </div>
          </div>
          <button class="nt-cart-pill" onclick="ntToggleCart()">
            Carrinho
            <span class="nt-cart-count" id="nt-cart-count">0</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- HERO split: texto esquerda + imagem com halo de fogo -->
    <header class="nt-hero">
      <div class="nt-hero-inner">
        <div class="nt-hero-text">
          <span class="nt-eyebrow" id="nt-eyebrow">Qualidade Premium</span>
          <h1 class="nt-h1">
            <span id="nt-name-line1"></span><br>
            <em class="nt-h1-grad" id="nt-name-line2"></em>
          </h1>
          <p class="nt-tagline" id="nt-tagline">Ingredientes selecionados e preparo cuidadoso para a melhor experiência.</p>
          <div class="nt-hero-meta">
            <a href="tel:" class="nt-phone" id="nt-phone">(11) 4002-8922</a>
            <span class="nt-sep">|</span>
            <span class="nt-delivery-info" id="nt-delivery-info">Entrega rápida e segura</span>
          </div>
        </div>
        <!-- IMAGEM com halo de fogo — camada 3 -->
        <div class="nt-hero-img-wrap">
          <div class="nt-halo" aria-hidden="true"></div>
          <img
            id="nt-hero-img"
            class="nt-hero-img"
            src=""
            alt=""
            style="display:none"
          >
        </div>
      </div>
    </header>

    <!-- CATEGORY STRIP sticky top-16 -->
    <section class="nt-cats-strip">
      <div class="nt-cats-inner" id="nt-cats-inner">
        <button class="nt-cat-chip active" onclick="ntSetCat('all', this)">Combos</button>
      </div>
    </section>

    <!-- MAIN CONTENT -->
    <main class="nt-main">

      <!-- COMBOS -->
      <section class="nt-combos-sec" id="nt-combos-sec">
        <h2 class="nt-sec-title">Combos em destaque</h2>
        <div class="nt-combos-grid" id="nt-combos-grid"></div>
      </section>

      <!-- PRODUTOS grid 3 colunas com foto quadrada + gradiente na base -->
      <section class="nt-products-sec">
        <h2 class="nt-sec-title" id="nt-products-title">Cardápio</h2>
        <div class="nt-products-grid" id="nt-products-grid"></div>
      </section>

      <!-- REVIEWS glassmorphism escuro -->
      <section class="nt-reviews-sec" id="nt-reviews-sec">
        <h2 class="nt-sec-title nt-reviews-title">O que dizem nossos clientes</h2>
        <div class="nt-reviews-grid" id="nt-reviews-grid"></div>
      </section>

    </main>

    <!-- FOOTER -->
    <footer class="nt-footer">
      <p class="nt-footer-logo" id="nt-footer-logo">Fornace</p>
      <p class="nt-footer-addr" id="nt-footer-addr"></p>
      <p class="nt-footer-copy" id="nt-footer-copy">© 2026 Fornace. Feito com fogo e carinho.</p>
    </footer>

    <!-- CART OVERLAY + DRAWER -->
    <div class="nt-cart-overlay" id="nt-cart-overlay" onclick="ntToggleCart()"></div>
    <div class="nt-cart-drawer" id="nt-cart-drawer">
      <div class="nt-drawer-handle"></div>
      <div class="nt-cart-head">
        <span class="nt-cart-title">🛒 Seu Pedido</span>
        <button class="nt-cart-close" onclick="ntToggleCart()">✕</button>
      </div>
      <div class="nt-cart-body" id="nt-cart-body">
        <div class="nt-cart-empty">
          <span>🍽️</span><p>Carrinho vazio.<br>Escolha seus itens!</p>
        </div>
      </div>
      <div class="nt-cart-footer" id="nt-cart-footer" style="display:none">
        <div class="nt-cart-row"><span>Subtotal</span><span id="nt-cart-sub">R$ 0,00</span></div>
        <div class="nt-cart-row"><span>Taxa de entrega</span><span id="nt-cart-fee">R$ 7,00</span></div>
        <div class="nt-cart-total"><span>Total</span><span id="nt-cart-ttl">R$ 0,00</span></div>
        <input class="nt-input" id="nt-name" type="text" placeholder="Seu nome">
        <input class="nt-input" id="nt-addr" type="text" placeholder="Endereço de entrega">
        <button class="nt-order-btn" onclick="ntCheckout()">Fechar pelo WhatsApp 🍕</button>
      </div>
    </div>

    <!-- ITEM MODAL -->
    <div class="nt-imbg" id="nt-imbg" onclick="ntCloseIM(event)">
      <div class="nt-imbox">
        <div class="nt-imimg">
          <img id="nt-im-img" src="" alt="" style="display:none">
          <div class="nt-imnoimg" id="nt-im-noimg">🍕</div>
          <button class="nt-imclose" onclick="document.getElementById('nt-imbg').classList.remove('on')">✕</button>
        </div>
        <div class="nt-imbody">
          <div class="nt-imcat" id="nt-imcat"></div>
          <div class="nt-imname" id="nt-imname"></div>
          <div class="nt-imdesc" id="nt-imdesc"></div>
          <div class="nt-imlbl" id="nt-imlbl">Escolha o tamanho</div>
          <div class="nt-imsizes" id="nt-imsizes"></div>
          <div class="nt-imlbl">Quantidade</div>
          <div class="nt-qty-stepper">
            <button class="nt-qty-btn" onclick="ntChangeImQty(-1)">−</button>
            <span class="nt-qty-num" id="nt-qty-num">1</span>
            <button class="nt-qty-btn" onclick="ntChangeImQty(1)">+</button>
          </div>
        </div>
        <div class="nt-imft">
          <div class="nt-imtotal" id="nt-imtotal">R$ 0,00</div>
          <button class="nt-imadd" id="nt-imadd" onclick="ntAddFromIM()">+ Adicionar ao pedido</button>
        </div>
      </div>
    </div>

    <!-- STICKY WHATSAPP CTA -->
    <div class="nt-wa-cta" id="nt-wa-cta" style="display:none" onclick="ntToggleCart()">
      <span class="nt-wa-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </span>
      <span class="nt-wa-txt">Fechar pelo WhatsApp</span>
      <span class="nt-wa-total" id="nt-wa-total">R$ 0,00</span>
    </div>

  </div>
  `;
}

// ═══════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════
function boot() {
  populateStore();
  renderCats();
  renderMain();
  window.ntToggleCart  = ntToggleCart;
  window.ntSetCat      = ntSetCat;
  window.ntCheckout    = ntCheckout;
  window.ntAdd         = ntAdd;
  window.ntAddCombo    = ntAddCombo;
  window.ntChangeQty   = ntChangeQty;
  window.ntOpenIM      = ntOpenIM;
  window.ntCloseIM     = ntCloseIM;
  window.ntSelectSize  = ntSelectSize;
  window.ntChangeImQty = ntChangeImQty;
  window.ntAddFromIM   = ntAddFromIM;
}

window.ntOpenIM = function(pid) {
  const p = products.find(x => x.id === pid);
  if (!p) return;
  imCurrentPid = pid;
  imQty = 1;
  if (!p.prices || p.prices.length <= 1) { ntAdd(pid); return; }
  const sizes = ['P', 'M', 'G', 'GG'];
  const img   = document.getElementById('nt-im-img');
  const noimg = document.getElementById('nt-im-noimg');
  if (p.img || p.image) {
    img.src = p.img || p.image; img.style.display = 'block'; noimg.style.display = 'none';
  } else {
    img.style.display = 'none'; noimg.style.display = 'flex';
  }
  const cat = categories.find(c => c.id === (p.cat || p.category));
  document.getElementById('nt-imcat').textContent  = cat ? (cat.emoji ? cat.emoji + ' ' : '') + cat.name : '';
  document.getElementById('nt-imname').textContent = p.name;
  document.getElementById('nt-imdesc').textContent = p.desc || p.description || '';
  document.getElementById('nt-imlbl').style.display = p.prices.length > 1 ? 'block' : 'none';
  document.getElementById('nt-qty-num').textContent = 1;
  const sizesEl = document.getElementById('nt-imsizes');
  sizesEl.innerHTML = p.prices.map((price, i) => {
    const label = p.sizeLabels?.[i] || sizes[i] || `Tam. ${i + 1}`;
    return `<button class="nt-size-btn ${i === 0 ? 'active' : ''}" onclick="ntSelectSize(this, ${price})" data-price="${price}">${label}<br><small>${fmtR(price)}</small></button>`;
  }).join('');
  const firstPrice = p.prices[0];
  document.getElementById('nt-imtotal').textContent    = fmtR(firstPrice);
  document.getElementById('nt-imadd').dataset.price    = firstPrice;
  document.getElementById('nt-imbg').classList.add('on');
};

window.ntCloseIM = function(e) {
  if (e.target.id === 'nt-imbg') document.getElementById('nt-imbg').classList.remove('on');
};

window.ntSelectSize = function(btn, price) {
  document.querySelectorAll('.nt-size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('nt-imadd').dataset.price    = price;
  document.getElementById('nt-imtotal').textContent    = fmtR(price * imQty);
};

window.ntChangeImQty = function(delta) {
  imQty = Math.max(1, imQty + delta);
  document.getElementById('nt-qty-num').textContent = imQty;
  const price = parseFloat(document.getElementById('nt-imadd').dataset.price || 0);
  document.getElementById('nt-imtotal').textContent   = fmtR(price * imQty);
};

window.ntAddFromIM = function() {
  const p = products.find(x => x.id === imCurrentPid);
  if (!p) return;
  const price    = parseFloat(document.getElementById('nt-imadd').dataset.price || p.prices?.[0] || 0);
  const sizeBtn  = document.querySelector('.nt-size-btn.active');
  const sizeLabel = sizeBtn ? sizeBtn.textContent.split('\n')[0] : '';
  const name     = sizeLabel ? `${p.name} (${sizeLabel})` : p.name;
  const key      = `${p.id}-${price}`;
  const found    = cart.find(i => i.id === key);
  if (found) { found.qty += imQty; } else { cart.push({ id: key, name, price, img: p.img || p.image, qty: imQty }); }
  renderCart();
  document.getElementById('nt-imbg').classList.remove('on');
  showToastMsg(`✅ ${name} adicionado!`);
  ntCartBounce();
};

function ntCartBounce() {
  const btn = document.querySelector('.nt-cart-pill');
  if (!btn) return;
  btn.classList.add('nt-bounce');
  setTimeout(() => btn.classList.remove('nt-bounce'), 600);
}

function populateStore() {
  const n = store.name || 'Fornace';
  if ($('nt-nav-logo'))    $('nt-nav-logo').textContent    = n;
  const parts = n.split(' ');
  if (parts.length > 1) {
    if ($('nt-name-line1')) $('nt-name-line1').textContent = parts[0];
    if ($('nt-name-line2')) $('nt-name-line2').textContent = parts.slice(1).join(' ');
  } else {
    if ($('nt-name-line1')) $('nt-name-line1').textContent = '';
    if ($('nt-name-line2')) $('nt-name-line2').textContent = n;
  }
  if ($('nt-tagline'))     $('nt-tagline').textContent     = store.tagline || 'Ingredientes selecionados e preparo cuidadoso para a melhor experiência.';
  if ($('nt-hours'))       $('nt-hours').textContent       = store.hours   || '';
  if ($('nt-phone'))       { $('nt-phone').textContent = store.phone || ''; $('nt-phone').href = `tel:${store.phone || ''}`; }
  if ($('nt-delivery-info')) $('nt-delivery-info').textContent = store.freeDeliveryThreshold ? `Entrega grátis acima de R$ ${store.freeDeliveryThreshold}` : 'Entrega rápida e segura';
  if ($('nt-footer-logo')) $('nt-footer-logo').textContent = n;
  if ($('nt-footer-addr')) $('nt-footer-addr').textContent = store.address || store.addr || '';
  if ($('nt-footer-copy')) $('nt-footer-copy').textContent = `© 2026 ${n}. Feito com carinho.`;
}

// ═══════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════
function renderCats() {
  const inner = $('nt-cats-inner');
  if (!inner) return;
  const combosBtn = `<button class="nt-cat-chip ${activeCat === 'all' ? 'active' : ''}" onclick="ntSetCat('all', this)">Combos</button>`;
  const catBtns   = categories.map(c =>
    `<button class="nt-cat-chip ${activeCat === c.id ? 'active' : ''}" onclick="ntSetCat('${c.id}', this)">${c.emoji ? c.emoji + ' ' : ''}${c.name}</button>`
  ).join('');
  inner.innerHTML = combosBtn + catBtns;
}

window.ntSetCat = function(catId, btn) {
  activeCat = catId;
  document.querySelectorAll('.nt-cat-chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderMain();
};

// ═══════════════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════════════
function renderMain() { renderCombos(); renderProducts(); renderReviews(); }

function renderCombos() {
  const sec  = $('nt-combos-sec');
  const grid = $('nt-combos-grid');
  if (!sec || !grid) return;
  if (activeCat !== 'all' || !combos.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  grid.innerHTML = combos.filter(c => c.active !== false).map(c => {
    const disc = c.origPrice || c.originalPrice;
    return `
    <article class="nt-combo-card">
      <div class="nt-combo-img-wrap">
        ${c.img || c.image
          ? `<img src="${c.img || c.image}" alt="${c.name}" class="nt-combo-img">`
          : `<div class="nt-combo-placeholder">🎁</div>`}
      </div>
      <div class="nt-combo-head">
        <h3 class="nt-combo-name">${c.name}</h3>
        <div class="nt-combo-price-wrap">
          ${disc ? `<span class="nt-combo-old">${fmtR(disc)}</span>` : ''}
          <span class="nt-combo-price">${fmtR(c.price)}</span>
        </div>
      </div>
      <p class="nt-combo-desc">${c.desc || c.description || c.items || ''}</p>
      <button class="nt-combo-btn" onclick="ntAddCombo('${c.id}')">Adicionar ao pedido</button>
    </article>`;
  }).join('');
}

function renderProducts() {
  const grid  = $('nt-products-grid');
  const title = $('nt-products-title');
  if (!grid) return;
  let visible = activeCat === 'all'
    ? products
    : products.filter(p => p.cat === activeCat || p.category === activeCat);
  visible = visible.filter(p => p.active !== false);
  if (title) {
    title.textContent = activeCat === 'all'
      ? 'Le Pizze'
      : (categories.find(c => c.id === activeCat)?.name || '');
  }
  grid.innerHTML = visible.map(p => {
    const price = p.prices?.[0] ?? p.price ?? 0;
    return `
    <article class="nt-product-card">
      <div class="nt-product-img-wrap">
        ${p.img || p.image
          ? `<img src="${p.img || p.image}" alt="${p.name}" class="nt-product-img"><div class="nt-product-grad"></div>`
          : `<div class="nt-product-placeholder">🍕</div>`}
      </div>
      <div class="nt-product-body">
        <div class="nt-product-meta">
          <h3 class="nt-product-name">${p.name}</h3>
          <span class="nt-product-price">${fmtR(price)}</span>
        </div>
        <p class="nt-product-desc">${p.desc || p.description || ''}</p>
        <button class="nt-product-add" onclick="ntOpenIM('${p.id}')">+ Adicionar ao pedido</button>
      </div>
    </article>`;
  }).join('');
}

function renderReviews() {
  const sec  = $('nt-reviews-sec');
  const grid = $('nt-reviews-grid');
  if (!sec || !grid) return;
  const pub = (reviews || []).filter(r => r.published !== false);
  if (!pub.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  grid.innerHTML = pub.map(r => `
    <div class="nt-review-card">
      <div class="nt-review-stars">★★★★★</div>
      <p class="nt-review-text">"${r.text}"</p>
      <p class="nt-review-author">— ${r.name || r.author}</p>
      ${r.role ? `<p class="nt-review-role">${r.role}</p>` : ''}
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════
window.ntAdd = function(pid) {
  const p = products.find(x => x.id === pid);
  if (!p) return;
  const price = p.prices?.[0] ?? p.price ?? 0;
  const found = cart.find(i => i.id === pid);
  if (found) { found.qty++; } else { cart.push({ id: pid, name: p.name, price, img: p.img || p.image, qty: 1 }); }
  renderCart();
  showToastMsg('✅ Adicionado!');
};

window.ntAddCombo = function(cid) {
  const c = combos.find(x => x.id === cid);
  if (!c) return;
  const found = cart.find(i => i.id === cid);
  if (found) { found.qty++; } else { cart.push({ id: cid, name: c.name, price: c.price, img: c.img || c.image, qty: 1 }); }
  renderCart();
  showToastMsg('✅ Combo adicionado!');
};

window.ntChangeQty = function(pid, delta) {
  const item = cart.find(i => i.id === pid);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.splice(cart.indexOf(item), 1);
  renderCart();
};

function renderCart() {
  const count     = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const fee       = cartTotal >= 90 ? 0 : (store.fee ?? 7);
  const total     = cartTotal + fee;

  const pill = $('nt-cart-count');
  if (pill) pill.textContent = count;

  const waCta = $('nt-wa-cta');
  if (waCta) {
    waCta.style.display = count > 0 ? 'flex' : 'none';
    const waTotal = $('nt-wa-total');
    if (waTotal) waTotal.textContent = fmtR(cartTotal);
  }

  if (!count) {
    $('nt-cart-body').innerHTML = `<div class="nt-cart-empty"><span>🍽️</span><p>Carrinho vazio.<br>Escolha seus itens!</p><button class="nt-explore-btn" onclick="ntToggleCart()">🍽️ Ver Cardápio</button></div>`;
    if ($('nt-cart-footer')) $('nt-cart-footer').style.display = 'none';
    return;
  }

  $('nt-cart-body').innerHTML = cart.map(item => `
    <div class="nt-ci">
      <div class="nt-ci-img">${item.img ? `<img src="${item.img}" alt="">` : '🍕'}</div>
      <div class="nt-ci-info">
        <div class="nt-ci-name">${item.name}</div>
        <div class="nt-ci-price">${fmtR(item.price)}</div>
        <div class="nt-ci-ctrl">
          <button class="nt-qb" onclick="ntChangeQty('${item.id}', -1)">−</button>
          <span class="nt-qn">${item.qty}</span>
          <button class="nt-qb" onclick="ntChangeQty('${item.id}', +1)">+</button>
        </div>
      </div>
    </div>
  `).join('');

  if ($('nt-cart-footer')) $('nt-cart-footer').style.display = 'block';
  if ($('nt-cart-sub'))    $('nt-cart-sub').textContent  = fmtR(cartTotal);
  if ($('nt-cart-fee'))    $('nt-cart-fee').textContent  = fee === 0 ? 'Grátis 🎉' : fmtR(fee);
  if ($('nt-cart-ttl'))    $('nt-cart-ttl').textContent  = fmtR(total);
}

window.ntToggleCart = function() {
  $('nt-cart-drawer')?.classList.toggle('open');
  $('nt-cart-overlay')?.classList.toggle('on');
};

window.ntCheckout = function() {
  const name = $('nt-name')?.value.trim();
  const addr = $('nt-addr')?.value.trim();
  if (!name || !addr) { showToastMsg('⚠️ Informe nome e endereço', 'red'); return; }
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const fee       = cartTotal >= 90 ? 0 : (store.fee ?? 7);
  const total     = cartTotal + fee;
  const lines     = cart.map(i => `• ${i.name} x${i.qty} — ${fmtR(i.price * i.qty)}`).join('\n');
  const msg       = encodeURIComponent(`🍕 *Novo Pedido*\n\n${lines}\n\n*Taxa:* ${fmtR(fee)}\n*Total:* ${fmtR(total)}\n\n*Nome:* ${name}\n*Endereço:* ${addr}`);
  const phone     = (store.phone || '').replace(/\D/g, '');
  window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
};

function showToastMsg(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = 'toast' + (type ? ' ' + type : '');
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2600);
}
