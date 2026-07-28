/**
 * classic.js — Template Artisan Heritage (Claro)
 * Fundo cream quente, tipografia Playfair Display,
 * Hero split, categorias sticky, grid 3 col, reviews e CTA WhatsApp.
 * Fiel ao dossiê técnico e ZIP "Templates ideias/loja.zip".
 */

import '../../styles/templates/classic.css';

let store = {}, categories = [], products = [], combos = [], reviews = [];
let cart = [];
let activeCat = 'all';
let searchQuery = '';

const fmtR = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
const $ = (id) => document.getElementById(id);

// ═══════════════════════════════════════════════
// INIT
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
  store      = s;
  categories = c  || [];
  products   = p  || [];
  combos     = co || [];
  reviews    = r  || [];
}

// ═══════════════════════════════════════════════
// HTML SHELL — layout Artisan Heritage
// ═══════════════════════════════════════════════
function buildHTML() {
  return `
  <div class="ah-root">
    <!-- NAV sticky top-0 h-16 -->
    <nav class="ah-nav" id="ah-nav">
      <div class="ah-nav-inner">
        <a href="#" class="ah-nav-logo" id="ah-nav-logo">Fornace</a>
        <div class="ah-nav-right">
          <div class="ah-nav-status">
            <span class="ah-status-dot"></span>
            <div>
              <p class="ah-status-label">Aberto agora</p>
              <p class="ah-status-hours" id="ah-hours">18h–23h</p>
            </div>
          </div>
          <button class="ah-cart-pill" onclick="ahToggleCart()">
            🛒 Carrinho
            <span class="ah-cart-count" id="ah-cart-count">0</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- HERO split: texto esquerda + imagem direita -->
    <header class="ah-hero">
      <div class="ah-hero-inner">
        <div class="ah-hero-text">
          <span class="ah-eyebrow">Forno a lenha · Massa 48h</span>
          <h1 class="ah-h1">
            <span id="ah-name-line1">A alma de</span><br>
            <em id="ah-name-line2">Nápoles antiga.</em>
          </h1>
          <p class="ah-tagline" id="ah-tagline">Massa 48h de fermentação natural, forno a lenha a 485°C.</p>
          <div class="ah-hero-meta">
            <a href="tel:" class="ah-phone" id="ah-phone">(11) 4002-8922</a>
            <span class="ah-sep">|</span>
            <span class="ah-delivery-info">Entrega grátis acima de R$ 90</span>
          </div>
        </div>
        <div class="ah-hero-img-wrap">
          <img
            id="ah-hero-img"
            class="ah-hero-img"
            src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80"
            alt="Pizza artesanal"
          >
        </div>
      </div>
    </header>

    <!-- CATEGORY STRIP sticky top-16 -->
    <section class="ah-cats-strip" id="ah-cats-strip">
      <div class="ah-cats-inner" id="ah-cats-inner">
        <button class="ah-cat-chip active" onclick="ahSetCat('all', this)">Combos</button>
      </div>
    </section>

    <!-- MAIN CONTENT -->
    <main class="ah-main" id="ah-menu">

      <!-- COMBOS -->
      <section class="ah-combos-sec" id="ah-combos-sec">
        <h2 class="ah-sec-title">Combos em destaque</h2>
        <div class="ah-combos-grid" id="ah-combos-grid"></div>
      </section>

      <!-- PRODUTOS -->
      <section class="ah-products-sec" id="ah-products-sec">
        <h2 class="ah-sec-title" id="ah-products-title">Le Pizze</h2>
        <div class="ah-products-grid" id="ah-products-grid"></div>
      </section>

      <!-- REVIEWS faixa stone-100 -->
      <section class="ah-reviews-sec" id="ah-reviews-sec">
        <h2 class="ah-sec-title ah-reviews-title">O que dizem nossos vizinhos</h2>
        <div class="ah-reviews-grid" id="ah-reviews-grid"></div>
      </section>

    </main>

    <!-- FOOTER -->
    <footer class="ah-footer">
      <p class="ah-footer-logo" id="ah-footer-logo">Fornace</p>
      <p class="ah-footer-addr" id="ah-footer-addr">R. Aspicuelta, 421 — Vila Madalena</p>
      <p class="ah-footer-copy" id="ah-footer-copy">© 2026 Fornace. Feito com carinho.</p>
    </footer>

    <!-- CART DRAWER -->
    <div class="ah-cart-overlay" id="ah-cart-overlay" onclick="ahToggleCart()"></div>
    <div class="ah-cart-drawer" id="ah-cart-drawer">
      <div class="ah-cart-head">
        <span class="ah-cart-title">🛒 Seu Pedido</span>
        <button class="ah-cart-close" onclick="ahToggleCart()">✕</button>
      </div>
      <div class="ah-cart-body" id="ah-cart-body">
        <div class="ah-cart-empty">
          <span>🍕</span>
          <p>Carrinho vazio.<br>Escolha uma pizza!</p>
        </div>
      </div>
      <div class="ah-cart-footer" id="ah-cart-footer" style="display:none">
        <div class="ah-cart-freebar" id="ah-freebar">
          🎉 Frete grátis acima de R$ 90
          <div class="ah-freebar-track"><div class="ah-freebar-fill" id="ah-freebar-fill" style="width:0%"></div></div>
        </div>
        <div class="ah-cart-row"><span>Subtotal</span><span id="ah-cart-sub">R$ 0,00</span></div>
        <div class="ah-cart-row"><span>Taxa de entrega</span><span id="ah-cart-fee">R$ 7,00</span></div>
        <div class="ah-cart-total"><span>Total</span><span id="ah-cart-ttl">R$ 0,00</span></div>
        <input class="ah-input" id="ah-name" type="text" placeholder="Seu nome">
        <input class="ah-input" id="ah-addr" type="text" placeholder="Endereço de entrega">
        <button class="ah-order-btn" onclick="ahCheckout()">Fechar pelo WhatsApp 🍕</button>
      </div>
    </div>

    <!-- STICKY WHATSAPP CTA (aparece quando tem itens) -->
    <div class="ah-wa-cta" id="ah-wa-cta" style="display:none" onclick="ahToggleCart()">
      <span class="ah-wa-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </span>
      <span class="ah-wa-txt">Fechar pelo WhatsApp</span>
      <span class="ah-wa-total" id="ah-wa-total">R$ 0,00</span>
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
  window.ahToggleCart  = ahToggleCart;
  window.ahSetCat      = ahSetCat;
  window.ahCheckout    = ahCheckout;
  window.ahAdd         = ahAdd;
  window.ahDec         = ahDec;
  window.ahChangeQty   = ahChangeQty;
}

function populateStore() {
  const n = store.name || 'Fornace';
  if ($('ah-nav-logo'))      $('ah-nav-logo').textContent      = n;
  if ($('ah-name-line1'))    $('ah-name-line1').textContent    = 'A alma de';
  if ($('ah-name-line2'))    $('ah-name-line2').textContent    = n;
  if ($('ah-tagline'))       $('ah-tagline').textContent       = store.tagline || '';
  if ($('ah-hours'))         $('ah-hours').textContent         = store.hours   || '';
  if ($('ah-phone'))         $('ah-phone').textContent         = store.phone   || '';
  if ($('ah-phone'))         $('ah-phone').href                = `tel:${store.phone || ''}`;
  if ($('ah-footer-logo'))   $('ah-footer-logo').textContent   = n;
  if ($('ah-footer-addr'))   $('ah-footer-addr').textContent   = store.address || store.addr || '';
  if ($('ah-footer-copy'))   $('ah-footer-copy').textContent   = `© 2026 ${n}. Feito com carinho.`;
  const fee = store.fee ?? 7;
  if ($('ah-cart-fee'))      $('ah-cart-fee').textContent      = fmtR(fee);
}

// ═══════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════
function renderCats() {
  const inner = $('ah-cats-inner');
  if (!inner) return;
  const combosBtn = `<button class="ah-cat-chip ${activeCat === 'all' ? 'active' : ''}" onclick="ahSetCat('all', this)">Combos</button>`;
  const catBtns = categories.map(c =>
    `<button class="ah-cat-chip ${activeCat === c.id ? 'active' : ''}" onclick="ahSetCat('${c.id}', this)">${c.emoji ? c.emoji + ' ' : ''}${c.name}</button>`
  ).join('');
  inner.innerHTML = combosBtn + catBtns;
}

window.ahSetCat = function(catId, btn) {
  activeCat = catId;
  document.querySelectorAll('.ah-cat-chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderMain();
};

// ═══════════════════════════════════════════════
// MAIN CONTENT RENDER
// ═══════════════════════════════════════════════
function renderMain() {
  renderCombos();
  renderProducts();
  renderReviews();
}

function renderCombos() {
  const sec  = $('ah-combos-sec');
  const grid = $('ah-combos-grid');
  if (!sec || !grid) return;
  if (activeCat !== 'all' || !combos.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  grid.innerHTML = combos.filter(c => c.active !== false).map(c => {
    const disc = c.origPrice || c.originalPrice;
    return `
    <article class="ah-combo-card">
      <div class="ah-combo-img-wrap">
        ${c.img || c.image
          ? `<img src="${c.img || c.image}" alt="${c.name}" class="ah-combo-img">`
          : `<div class="ah-combo-img-placeholder">🎁</div>`}
      </div>
      <div class="ah-combo-body">
        <div class="ah-combo-head">
          <h3 class="ah-combo-name">${c.name}</h3>
          <div class="ah-combo-price-wrap">
            ${disc ? `<span class="ah-combo-old">${fmtR(disc)}</span>` : ''}
            <span class="ah-combo-price">${fmtR(c.price)}</span>
          </div>
        </div>
        <p class="ah-combo-desc">${c.desc || c.description || c.items || ''}</p>
        <button class="ah-combo-btn" onclick="ahAddCombo('${c.id}')">Adicionar ao pedido</button>
      </div>
    </article>`;
  }).join('');
}

function renderProducts() {
  const grid  = $('ah-products-grid');
  const title = $('ah-products-title');
  if (!grid) return;
  let visible = activeCat === 'all'
    ? products
    : products.filter(p => p.cat === activeCat || p.category === activeCat);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    visible = visible.filter(p => p.name.toLowerCase().includes(q) || (p.desc || p.description || '').toLowerCase().includes(q));
  }
  visible = visible.filter(p => p.active !== false);
  if (title) {
    if (activeCat === 'all') {
      title.textContent = 'Le Pizze';
    } else {
      const cat = categories.find(c => c.id === activeCat);
      title.textContent = cat ? `${cat.emoji ? cat.emoji + ' ' : ''}${cat.name}` : '';
    }
  }
  grid.innerHTML = visible.map(p => {
    const price = p.prices?.[0] ?? p.price ?? 0;
    return `
    <article class="ah-product-card">
      <div class="ah-product-img-wrap">
        ${p.img || p.image
          ? `<img src="${p.img || p.image}" alt="${p.name}" class="ah-product-img">`
          : `<div class="ah-product-img-placeholder">🍕</div>`}
      </div>
      <div class="ah-product-meta">
        <h3 class="ah-product-name">${p.name}</h3>
        <span class="ah-product-price">${fmtR(price)}</span>
      </div>
      <p class="ah-product-desc">${p.desc || p.description || ''}</p>
      <button class="ah-product-add" onclick="ahAdd('${p.id}')">+ Adicionar ao pedido</button>
    </article>`;
  }).join('');
}

function renderReviews() {
  const sec  = $('ah-reviews-sec');
  const grid = $('ah-reviews-grid');
  if (!sec || !grid) return;
  const pub = (reviews || []).filter(r => r.published !== false);
  if (!pub.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  grid.innerHTML = pub.map(r => `
    <div class="ah-review-card">
      <div class="ah-review-stars">★★★★★</div>
      <p class="ah-review-text">"${r.text}"</p>
      <p class="ah-review-author">— ${r.name || r.author}</p>
      ${r.role ? `<p class="ah-review-role">${r.role}</p>` : ''}
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════
window.ahAdd = function(pid) {
  const p = products.find(x => x.id === pid);
  if (!p) return;
  const price = p.prices?.[0] ?? p.price ?? 0;
  const found = cart.find(i => i.id === pid);
  if (found) { found.qty++; } else { cart.push({ id: pid, name: p.name, price, img: p.img || p.image, qty: 1 }); }
  renderCart();
  showToastMsg('✅ Adicionado!');
};

window.ahAddCombo = function(cid) {
  const c = combos.find(x => x.id === cid);
  if (!c) return;
  const found = cart.find(i => i.id === cid);
  if (found) { found.qty++; } else { cart.push({ id: cid, name: c.name, price: c.price, img: c.img || c.image, qty: 1 }); }
  renderCart();
  showToastMsg('✅ Combo adicionado!');
};

window.ahDec = function(pid) {
  const idx = cart.findIndex(i => i.id === pid);
  if (idx === -1) return;
  cart[idx].qty--;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  renderCart();
};

window.ahChangeQty = function(pid, delta) {
  const item = cart.find(i => i.id === pid);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.splice(cart.indexOf(item), 1);
  renderCart();
};

function renderCart() {
  const count      = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const fee        = cartTotal >= 90 ? 0 : (store.fee ?? 7);
  const total      = cartTotal + fee;
  const freeThresh = 90;
  const remaining  = Math.max(0, freeThresh - cartTotal);

  // pill badge
  const pill = $('ah-cart-count');
  if (pill) pill.textContent = count;

  // sticky WA cta
  const waCta = $('ah-wa-cta');
  if (waCta) {
    waCta.style.display = count > 0 ? 'flex' : 'none';
    const waTotal = $('ah-wa-total');
    if (waTotal) waTotal.textContent = fmtR(cartTotal);
  }

  if (!count) {
    $('ah-cart-body').innerHTML = `<div class="ah-cart-empty"><span>🍕</span><p>Carrinho vazio.<br>Escolha uma pizza!</p></div>`;
    if ($('ah-cart-footer')) $('ah-cart-footer').style.display = 'none';
    return;
  }

  $('ah-cart-body').innerHTML = cart.map(item => `
    <div class="ah-ci">
      <div class="ah-ci-img">${item.img ? `<img src="${item.img}" alt="">` : '🍕'}</div>
      <div class="ah-ci-info">
        <div class="ah-ci-name">${item.name}</div>
        <div class="ah-ci-price">${fmtR(item.price)}</div>
        <div class="ah-ci-ctrl">
          <button class="ah-qb" onclick="ahChangeQty('${item.id}', -1)">−</button>
          <span class="ah-qn">${item.qty}</span>
          <button class="ah-qb" onclick="ahChangeQty('${item.id}', +1)">+</button>
        </div>
      </div>
    </div>
  `).join('');

  if ($('ah-cart-footer')) $('ah-cart-footer').style.display = 'block';
  if ($('ah-cart-sub'))    $('ah-cart-sub').textContent  = fmtR(cartTotal);
  if ($('ah-cart-fee'))    $('ah-cart-fee').textContent  = fee === 0 ? 'Grátis 🎉' : fmtR(fee);
  if ($('ah-cart-ttl'))    $('ah-cart-ttl').textContent  = fmtR(total);

  // free shipping bar
  const pct = Math.min(100, (cartTotal / freeThresh) * 100);
  if ($('ah-freebar-fill')) $('ah-freebar-fill').style.width = pct + '%';
  const freebar = $('ah-freebar');
  if (freebar) {
    freebar.innerHTML = cartTotal >= freeThresh
      ? '🎉 Frete grátis desbloqueado! <div class="ah-freebar-track"><div class="ah-freebar-fill" id="ah-freebar-fill" style="width:100%"></div></div>'
      : `🎉 Faltam ${fmtR(remaining)} para frete grátis <div class="ah-freebar-track"><div class="ah-freebar-fill" id="ah-freebar-fill" style="width:${pct}%"></div></div>`;
  }
}

window.ahToggleCart = function() {
  $('ah-cart-drawer')?.classList.toggle('open');
  $('ah-cart-overlay')?.classList.toggle('on');
};

window.ahCheckout = function() {
  const name = $('ah-name')?.value.trim();
  const addr = $('ah-addr')?.value.trim();
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
