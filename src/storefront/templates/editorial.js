/**
 * editorial.js — Template Editorial (Conversão)
 * Fundo #f7f4ef quente, trust badges, stepper direto no card,
 * busca integrada sticky, progresso frete grátis e drawer lateral.
 * Fiel ao ZIP "Templates ideias/loja-editorial.zip".
 */

import '../../styles/templates/editorial.css';

let store = {}, categories = [], products = [], combos = [], reviews = [];
let cart       = [];
let activeCat  = 'all';
let searchQ    = '';
let cartOpen   = false;
let imCurrentPid = null;
let imQty = 1;

const fmtR = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
const $ = (id) => document.getElementById(id);

const FREE_SHIP = 90; // limiar para frete grátis

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
  renderProducts();
  renderCombos();
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
  <div class="ed2-root">

    <!-- TOP BAR sticky: logo + busca + carrinho -->
    <header class="ed2-topbar" id="ed2-topbar">
      <div class="ed2-topbar-inner">
        <div class="ed2-brand">
          <div class="ed2-brand-avatar">Fa</div>
          <div class="ed2-brand-info">
            <p class="ed2-brand-name" id="ed2-brand-name">Fornace</p>
            <p class="ed2-brand-status">
              <span class="ed2-status-dot"></span>
              Aberto · entrega 35–45min
            </p>
          </div>
        </div>
        <button class="ed2-cart-btn" id="ed2-cart-btn" onclick="edToggleCart()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l2.4 12.6a2 2 0 0 0 2 1.6h9.2a2 2 0 0 0 2-1.6L23 6H6"/><circle cx="9" cy="21" r="1.5"/><circle cx="18" cy="21" r="1.5"/></svg>
          <span class="ed2-cart-btn-txt">Ver pedido</span>
          <span class="ed2-cart-badge" id="ed2-cart-badge" style="display:none">0</span>
        </button>
      </div>
    </header>

    <!-- HERO persuasivo split + trust badges -->
    <section class="ed2-hero">
      <div class="ed2-hero-inner">
        <div class="ed2-hero-text">
          <p class="ed2-hero-eyebrow">
            <span class="ed2-eyebrow-dot"></span>
            Frete grátis acima de R$ 90
          </p>
          <h1 class="ed2-h1">
            Sabor de verdade,<br>
            <span class="ed2-h1-brand" id="ed2-h1-brand">no seu endereço</span>.
          </h1>
          <p class="ed2-hero-sub" id="ed2-hero-sub">
            Ingredientes selecionados, preparados com carinho. Peça agora e receba quentinho na sua casa.
          </p>
          <div class="ed2-hero-ctas">
            <a href="#ed2-menu" class="ed2-cta-primary">
              Ver cardápio
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
            <a href="#ed2-combos" class="ed2-cta-secondary">Combos com desconto</a>
          </div>
          <div class="ed2-trust-badges">
            <span class="ed2-trust" id="ed2-rating-badge" style="display:none"><span>⭐</span> <span id="ed2-rating-val"></span></span>
            <span class="ed2-trust"><span>🔥</span> Preparo na hora</span>
            <span class="ed2-trust"><span>🛵</span> Entrega rápida</span>
          </div>
        </div>
        <div class="ed2-hero-img-side">
          <div class="ed2-hero-img-wrap">
            <img
              id="ed2-hero-img"
              class="ed2-hero-img"
              src=""
              alt=""
              style="display:none"
            >
            <div class="ed2-hero-pill" id="ed2-hero-pill" style="display:none">
              <p class="ed2-hero-pill-label">Mais pedida</p>
              <p class="ed2-hero-pill-name" id="ed2-pill-name"></p>
              <p class="ed2-hero-pill-price" id="ed2-pill-price"></p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- COMBOS strip fundo #efeae2 -->
    <section class="ed2-combos-strip" id="ed2-combos">
      <div class="ed2-combos-inner">
        <div class="ed2-combos-head">
          <div>
            <p class="ed2-combos-eyebrow">Ofertas de hoje</p>
            <h2 class="ed2-combos-title">Combos com desconto</h2>
          </div>
          <p class="ed2-combos-valid">Válido até 23h30</p>
        </div>
        <div class="ed2-combos-grid" id="ed2-combos-grid"></div>
      </div>
    </section>

    <!-- STICKY NAV: busca + categorias (top-[64px]) -->
    <div class="ed2-sticky-nav" id="ed2-menu">
      <div class="ed2-sticky-inner">
        <div class="ed2-search-wrap">
          <svg class="ed2-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            class="ed2-search"
            id="ed2-search"
            type="text"
            placeholder="Buscar no cardápio..."
            oninput="edSearch(this.value)"
          >
        </div>
        <div class="ed2-cats" id="ed2-cats">
          <button class="ed2-cat active" onclick="edSetCat('all', this)">Tudo</button>
        </div>
      </div>
    </div>

    <!-- PRODUTOS GRID -->
    <section class="ed2-products-sec">
      <div class="ed2-products-inner" id="ed2-products-inner"></div>
    </section>

    <!-- TRUST SECTION -->
    <section class="ed2-trust-sec">
      <div class="ed2-trust-inner">
        <div class="ed2-trust-block">
          <span class="ed2-trust-icon">🔥</span>
          <p class="ed2-trust-title">Preparo Artesanal</p>
          <p class="ed2-trust-desc">Feito com atenção e qualidade, do preparo à entrega.</p>
        </div>
        <div class="ed2-trust-block">
          <span class="ed2-trust-icon">🌿</span>
          <p class="ed2-trust-title">Ingredientes Selecionados</p>
          <p class="ed2-trust-desc">Produtos frescos e selecionados todos os dias.</p>
        </div>
        <div class="ed2-trust-block">
          <span class="ed2-trust-icon">🛵</span>
          <p class="ed2-trust-title">Entrega em até 45min</p>
          <p class="ed2-trust-desc">Motoboys próprios com bag térmica de última geração.</p>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="ed2-footer">
      <div class="ed2-footer-inner">
        <div>
          <p class="ed2-footer-label">Endereço</p>
          <p class="ed2-footer-val" id="ed2-footer-addr">Rua das Flores, 123</p>
        </div>
        <div>
          <p class="ed2-footer-label">Funcionamento</p>
          <p class="ed2-footer-val" id="ed2-footer-hours">18h–23h</p>
          <p class="ed2-footer-val" id="ed2-footer-min">Pedido mínimo · R$ 30</p>
        </div>
        <div>
          <p class="ed2-footer-label">Fale com a gente</p>
          <p class="ed2-footer-phone" id="ed2-footer-phone">(11) 4002-8922</p>
        </div>
      </div>
    </footer>

    <!-- STICKY CART BAR (mobile / appears when cart > 0) -->
    <button class="ed2-sticky-cart" id="ed2-sticky-cart" style="display:none" onclick="edToggleCart()">
      <div class="ed2-sticky-cart-count" id="ed2-sticky-count">0</div>
      <div class="ed2-sticky-cart-info">
        <p class="ed2-sticky-cart-label">Seu pedido</p>
        <p class="ed2-sticky-cart-total" id="ed2-sticky-total">R$ 0,00</p>
      </div>
      <span class="ed2-sticky-cart-ver">
        Ver
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </span>
    </button>

    <!-- CART DRAWER -->
    <div class="ed2-drawer-overlay" id="ed2-drawer-overlay" onclick="edToggleCart()"></div>
    <aside class="ed2-cart-drawer" id="ed2-cart-drawer">
      <header class="ed2-drawer-head">
        <div>
          <p class="ed2-drawer-sublabel">Seu pedido</p>
          <p class="ed2-drawer-count" id="ed2-drawer-count">0 itens</p>
        </div>
        <button class="ed2-drawer-close" onclick="edToggleCart()">✕</button>
      </header>

      <!-- Free shipping progress -->
      <div class="ed2-freeship" id="ed2-freeship">
        <p class="ed2-freeship-txt" id="ed2-freeship-txt">Faltam R$ 90,00 para frete grátis</p>
        <div class="ed2-freeship-track">
          <div class="ed2-freeship-fill" id="ed2-freeship-fill" style="width:0%"></div>
        </div>
      </div>

      <div class="ed2-drawer-body" id="ed2-drawer-body">
        <div class="ed2-drawer-empty">
          <p class="ed2-drawer-empty-title">Carrinho vazio</p>
          <p class="ed2-drawer-empty-sub">Adicione itens para começar seu pedido.</p>
        </div>
      </div>

      <footer class="ed2-drawer-footer" id="ed2-drawer-footer" style="display:none">
        <div class="ed2-drawer-totals">
          <div class="ed2-drawer-row"><span>Subtotal</span><span id="ed2-sub">R$ 0,00</span></div>
          <div class="ed2-drawer-row"><span>Entrega</span><span id="ed2-fee" class="ed2-fee-val">R$ 8,00</span></div>
          <div class="ed2-drawer-total"><span>Total</span><span id="ed2-ttl">R$ 0,00</span></div>
        </div>
        <input class="ed2-input" id="ed2-name" type="text" placeholder="Seu nome">
        <input class="ed2-input" id="ed2-addr" type="text" placeholder="Endereço de entrega">
        <button class="ed2-whatsapp-btn" onclick="edCheckout()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Finalizar no WhatsApp
        </button>
        <p class="ed2-drawer-caption">Entrega em 35–45min · Pagamento na entrega ou Pix</p>
      </footer>
    </aside>

  </div>

  <!-- ITEM MODAL -->
  <div class="ed2-imbg" id="ed2-imbg" onclick="edCloseIM(event)">
    <div class="ed2-imbox">
      <div class="ed2-imimg">
        <img id="ed2-im-img" src="" alt="" style="display:none">
        <div class="ed2-imnoimg" id="ed2-im-noimg">🍕</div>
        <button class="ed2-imclose" onclick="document.getElementById('ed2-imbg').classList.remove('on')">✕</button>
      </div>
      <div class="ed2-imbody">
        <div class="ed2-imcat" id="ed2-imcat"></div>
        <div class="ed2-imname" id="ed2-imname"></div>
        <div class="ed2-imdesc" id="ed2-imdesc"></div>
        <div class="ed2-imlbl" id="ed2-imlbl">Escolha o tamanho</div>
        <div class="ed2-imsizes" id="ed2-imsizes"></div>
        <div class="ed2-imlbl">Quantidade</div>
        <div class="ed2-qty-stepper">
          <button class="ed2-qty-btn" onclick="edChangeImQty(-1)">−</button>
          <span class="ed2-qty-num" id="ed2-qty-num">1</span>
          <button class="ed2-qty-btn" onclick="edChangeImQty(1)">+</button>
        </div>
      </div>
      <div class="ed2-imft">
        <div class="ed2-imtotal" id="ed2-imtotal">R$ 0,00</div>
        <button class="ed2-imadd" id="ed2-imadd" onclick="edAddFromIM()">+ Adicionar ao pedido</button>
      </div>
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
  renderProducts();
  renderCombos();
  window.edToggleCart  = edToggleCart;
  window.edSetCat      = edSetCat;
  window.edSearch      = edSearch;
  window.edAdd         = edAdd;
  window.edDec         = edDec;
  window.edAddCombo    = edAddCombo;
  window.edCheckout    = edCheckout;
  window.edOpenIM      = edOpenIM;
  window.edCloseIM     = edCloseIM;
  window.edSelectSize  = edSelectSize;
  window.edChangeImQty = edChangeImQty;
  window.edAddFromIM   = edAddFromIM;
}

function populateStore() {
  const n = store.name || 'Fornace';
  if ($('ed2-brand-name'))   $('ed2-brand-name').textContent   = n;
  if ($('ed2-h1-brand'))     $('ed2-h1-brand').textContent     = store.tagline ? store.tagline.split(',')[0] : 'no seu endereço';
  if ($('ed2-hero-sub'))     $('ed2-hero-sub').textContent     = store.tagline || '';
  if ($('ed2-footer-addr'))  $('ed2-footer-addr').textContent  = store.address || store.addr || '';
  if ($('ed2-footer-hours')) $('ed2-footer-hours').textContent = store.hours   || '';
  if ($('ed2-footer-min'))   $('ed2-footer-min').textContent   = `Pedido mínimo · ${fmtR(store.minOrder || 30)}`;
  if ($('ed2-footer-phone')) $('ed2-footer-phone').textContent = store.phone   || '';
}

// ═══════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════
function renderCats() {
  const el = $('ed2-cats');
  if (!el) return;
  const all = `<button class="ed2-cat ${activeCat === 'all' ? 'active' : ''}" onclick="edSetCat('all',this)">Tudo · ${products.length}</button>`;
  const cats = categories.map(c => {
    const count = products.filter(p => p.cat === c.id || p.category === c.id).length;
    if (!count) return '';
    return `<button class="ed2-cat ${activeCat === c.id ? 'active' : ''}" onclick="edSetCat('${c.id}',this)">${c.emoji ? c.emoji + ' ' : ''}${c.name}</button>`;
  }).join('');
  el.innerHTML = all + cats;
}

window.edSetCat = function(catId, btn) {
  activeCat = catId;
  document.querySelectorAll('.ed2-cat').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderProducts();
};

window.edSearch = function(val) {
  searchQ = val;
  renderProducts();
};

// ═══════════════════════════════════════════════
// COMBOS
// ═══════════════════════════════════════════════
function renderCombos() {
  const grid = $('ed2-combos-grid');
  const sec  = document.querySelector('.ed2-combos-strip');
  if (!grid) return;
  const active = combos.filter(c => c.active !== false);
  if (!active.length) { if (sec) sec.style.display = 'none'; return; }
  if (sec) sec.style.display = 'block';

  grid.innerHTML = active.map(c => {
    const disc = c.origPrice || c.originalPrice;
    const off  = disc ? Math.round(((disc - c.price) / disc) * 100) : 0;
    return `
    <article class="ed2-combo-card">
      <div class="ed2-combo-img-wrap">
        ${c.img || c.image
          ? `<img src="${c.img || c.image}" alt="${c.name}" class="ed2-combo-img">`
          : `<div class="ed2-combo-placeholder">🎁</div>`}
        ${off ? `<span class="ed2-combo-badge">-${off}%</span>` : ''}
      </div>
      <div class="ed2-combo-body">
        <h3 class="ed2-combo-name">${c.name}</h3>
        <p class="ed2-combo-desc">${c.desc || c.description || c.items || ''}</p>
        <div class="ed2-combo-foot">
          <div>
            ${disc ? `<p class="ed2-combo-old">${fmtR(disc)}</p>` : ''}
            <p class="ed2-combo-price">${fmtR(c.price)}</p>
          </div>
          <button class="ed2-combo-btn" onclick="edAddCombo('${c.id}')">Adicionar</button>
        </div>
      </div>
    </article>`;
  }).join('');
}

// ═══════════════════════════════════════════════
// PRODUCTS — stepper direto no card
// ═══════════════════════════════════════════════
function renderProducts() {
  const inner = $('ed2-products-inner');
  if (!inner) return;

  let visible = activeCat === 'all'
    ? products
    : products.filter(p => p.cat === activeCat || p.category === activeCat);
  if (searchQ) {
    const q = searchQ.toLowerCase();
    visible = visible.filter(p => p.name.toLowerCase().includes(q) || (p.desc || p.description || '').toLowerCase().includes(q));
  }
  visible = visible.filter(p => p.active !== false);

  if (!visible.length) {
    inner.innerHTML = `<div class="ed2-empty"><p class="ed2-empty-title">Nada encontrado</p><p class="ed2-empty-sub">Tente outra busca ou categoria.</p></div>`;
    return;
  }

  inner.innerHTML = `<div class="ed2-grid">${visible.map(p => {
    const price = p.prices?.[0] ?? p.price ?? 0;
    const qty   = qtyOf(p.id);
    const hasMultipleSizes = p.prices && p.prices.length > 1;
    return `
    <article class="ed2-pcard">
      <div class="ed2-pcard-img-wrap">
        ${p.img || p.image
          ? `<img src="${p.img || p.image}" alt="${p.name}" class="ed2-pcard-img">`
          : `<div class="ed2-pcard-placeholder">🍕</div>`}
        ${p.featured ? `<span class="ed2-pcard-badge">⭐ Mais pedida</span>` : ''}
      </div>
      <div class="ed2-pcard-body">
        <div class="ed2-pcard-head">
          <h3 class="ed2-pcard-name">${p.name}</h3>
          <p class="ed2-pcard-price">${hasMultipleSizes ? `A partir de ${fmtR(price)}` : fmtR(price)}</p>
        </div>
        <p class="ed2-pcard-desc">${p.desc || p.description || ''}</p>
        <div class="ed2-pcard-ctrl" id="ctrl-${p.id}">
          ${hasMultipleSizes
            ? `<button class="ed2-pcard-add" onclick="edOpenIM('${p.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                Escolher tamanho
               </button>`
            : qty === 0
            ? `<button class="ed2-pcard-add" onclick="edAdd('${p.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                Adicionar
               </button>`
            : `<div class="ed2-stepper">
                <button class="ed2-step-btn" onclick="edDec('${p.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg></button>
                <span class="ed2-step-qty">${qty} no pedido</span>
                <button class="ed2-step-btn" onclick="edAdd('${p.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>
               </div>`
          }
        </div>
      </div>
    </article>`;
  }).join('')}</div>`;
}

function qtyOf(pid) { return cart.find(i => i.id === pid)?.qty ?? 0; }

// ═══════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════
window.edAdd = function(pid) {
  const p = products.find(x => x.id === pid) || combos.find(x => x.id === pid);
  if (!p) return;
  const price = p.prices?.[0] ?? p.price ?? 0;
  const found = cart.find(i => i.id === pid);
  if (found) { found.qty++; } else { cart.push({ id: pid, name: p.name, price, img: p.img || p.image, qty: 1 }); }
  renderCart();
  renderProducts();
  showToastMsg('✅ Adicionado!');
};

window.edDec = function(pid) {
  const item = cart.find(i => i.id === pid);
  if (!item) return;
  item.qty--;
  if (item.qty <= 0) cart.splice(cart.indexOf(item), 1);
  renderCart();
  renderProducts();
};

window.edAddCombo = function(cid) {
  const c = combos.find(x => x.id === cid);
  if (!c) return;
  const found = cart.find(i => i.id === cid);
  if (found) { found.qty++; } else { cart.push({ id: cid, name: c.name, price: c.price, img: c.img || c.image, qty: 1 }); }
  renderCart();
  showToastMsg('✅ Combo adicionado!');
};

function renderCart() {
  const count     = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const freeShip  = cartTotal >= FREE_SHIP;
  const fee       = freeShip ? 0 : 8;
  const total     = cartTotal + fee;
  const remaining = Math.max(0, FREE_SHIP - cartTotal);
  const pct       = Math.min(100, (cartTotal / FREE_SHIP) * 100);

  // top bar badge
  const badge = $('ed2-cart-badge');
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }

  // sticky bar
  const stickyCart = $('ed2-sticky-cart');
  if (stickyCart) {
    stickyCart.style.display = (count > 0 && !cartOpen) ? 'flex' : 'none';
    if ($('ed2-sticky-count')) $('ed2-sticky-count').textContent = count;
    if ($('ed2-sticky-total')) $('ed2-sticky-total').textContent = fmtR(cartTotal);
  }

  // free shipping progress
  const freeTxt  = $('ed2-freeship-txt');
  const freeFill = $('ed2-freeship-fill');
  if (freeTxt) freeTxt.textContent = freeShip ? '🎉 Você ganhou frete grátis!' : `Faltam ${fmtR(remaining)} para frete grátis`;
  if (freeFill) freeFill.style.width = pct + '%';
  if ($('ed2-fee')) { $('ed2-fee').textContent = freeShip ? 'Grátis' : fmtR(fee); $('ed2-fee').className = freeShip ? 'ed2-fee-val ed2-fee-free' : 'ed2-fee-val'; }

  // drawer count
  if ($('ed2-drawer-count')) $('ed2-drawer-count').textContent = `${count} ${count === 1 ? 'item' : 'itens'}`;

  if (!count) {
    $('ed2-drawer-body').innerHTML = `<div class="ed2-drawer-empty"><p class="ed2-drawer-empty-title">Carrinho vazio</p><p class="ed2-drawer-empty-sub">Adicione itens ao carrinho para começar.</p><button class="ed2-explore-btn" onclick="edToggleCart()">🍽️ Ver Cardápio</button></div>`;
    if ($('ed2-drawer-footer')) $('ed2-drawer-footer').style.display = 'none';
    return;
  }

  // drawer items
  $('ed2-drawer-body').innerHTML = `<ul class="ed2-drawer-list">${cart.map(i => `
    <li class="ed2-drawer-item">
      <div class="ed2-drawer-img">${i.img ? `<img src="${i.img}" alt="">` : '🍕'}</div>
      <div class="ed2-drawer-item-info">
        <div class="ed2-drawer-item-top">
          <p class="ed2-drawer-item-name">${i.name}</p>
          <p class="ed2-drawer-item-total">${fmtR(i.price * i.qty)}</p>
        </div>
        <div class="ed2-drawer-item-bot">
          <div class="ed2-drawer-stepper">
            <button class="ed2-drawer-step" onclick="edDec('${i.id}')">−</button>
            <span class="ed2-drawer-qty">${i.qty}</span>
            <button class="ed2-drawer-step" onclick="edAdd('${i.id}')">+</button>
          </div>
          <p class="ed2-drawer-item-price">${fmtR(i.price)} un.</p>
        </div>
      </div>
    </li>
  `).join('')}</ul>`;

  if ($('ed2-drawer-footer')) $('ed2-drawer-footer').style.display = 'block';
  if ($('ed2-sub')) $('ed2-sub').textContent = fmtR(cartTotal);
  if ($('ed2-ttl')) $('ed2-ttl').textContent = fmtR(total);
}

window.edToggleCart = function() {
  cartOpen = !cartOpen;
  $('ed2-cart-drawer')?.classList.toggle('open', cartOpen);
  $('ed2-drawer-overlay')?.classList.toggle('on', cartOpen);
  // hide/show sticky bar
  const stickyCart = $('ed2-sticky-cart');
  if (stickyCart) stickyCart.style.display = (!cartOpen && cart.reduce((s,i)=>s+i.qty,0) > 0) ? 'flex' : 'none';
};

window.edCheckout = function() {
  const name = $('ed2-name')?.value.trim();
  const addr = $('ed2-addr')?.value.trim();
  if (!name || !addr) { showToastMsg('⚠️ Informe nome e endereço', 'red'); return; }
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const fee       = cartTotal >= FREE_SHIP ? 0 : 8;
  const total     = cartTotal + fee;
  const lines     = cart.map(i => `• ${i.name} x${i.qty} — ${fmtR(i.price * i.qty)}`).join('\n');
  const msg       = encodeURIComponent(`🍕 *Novo Pedido*\n\n${lines}\n\n*Entrega:* ${fee === 0 ? 'Grátis' : fmtR(fee)}\n*Total:* ${fmtR(total)}\n\n*Nome:* ${name}\n*Endereço:* ${addr}`);
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

// ── ITEM MODAL ──
window.edOpenIM = function(pid) {
  const p = products.find(x => x.id === pid);
  if (!p) return;
  imCurrentPid = pid;
  imQty = 1;
  if (!p.prices || p.prices.length <= 1) { edAdd(pid); return; }
  const sizes = ['P', 'M', 'G', 'GG'];
  const img = $('ed2-im-img');
  const noimg = $('ed2-im-noimg');
  if (p.img || p.image) { img.src = p.img || p.image; img.style.display = 'block'; noimg.style.display = 'none'; }
  else { img.style.display = 'none'; noimg.style.display = 'flex'; }
  const cat = categories.find(c => c.id === (p.cat || p.category));
  $('ed2-imcat').textContent = cat ? (cat.emoji ? cat.emoji + ' ' : '') + cat.name : '';
  $('ed2-imname').textContent = p.name;
  $('ed2-imdesc').textContent = p.desc || p.description || '';
  $('ed2-imlbl').style.display = p.prices.length > 1 ? 'block' : 'none';
  $('ed2-qty-num').textContent = 1;
  const sizesEl = $('ed2-imsizes');
  sizesEl.innerHTML = p.prices.map((price, i) => {
    const label = p.sizeLabels?.[i] || sizes[i] || `Tam. ${i+1}`;
    return `<button class="ed2-size-btn ${i === 0 ? 'active' : ''}" onclick="edSelectSize(this, ${price})" data-price="${price}">${label}<br><small>${fmtR(price)}</small></button>`;
  }).join('');
  const firstPrice = p.prices[0];
  $('ed2-imtotal').textContent = fmtR(firstPrice);
  $('ed2-imadd').dataset.price = firstPrice;
  $('ed2-imbg').classList.add('on');
};

window.edCloseIM = function(e) {
  if (e.target.id === 'ed2-imbg') $('ed2-imbg').classList.remove('on');
};

window.edSelectSize = function(btn, price) {
  document.querySelectorAll('.ed2-size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  $('ed2-imadd').dataset.price = price;
  $('ed2-imtotal').textContent = fmtR(price * imQty);
};

window.edChangeImQty = function(delta) {
  imQty = Math.max(1, imQty + delta);
  $('ed2-qty-num').textContent = imQty;
  const price = parseFloat($('ed2-imadd').dataset.price || 0);
  $('ed2-imtotal').textContent = fmtR(price * imQty);
};

window.edAddFromIM = function() {
  const p = products.find(x => x.id === imCurrentPid);
  if (!p) return;
  const price = parseFloat($('ed2-imadd').dataset.price || p.prices?.[0] || 0);
  const sizeBtn = document.querySelector('.ed2-size-btn.active');
  const sizeLabel = sizeBtn ? sizeBtn.textContent.split('\n')[0] : '';
  const name = sizeLabel ? `${p.name} (${sizeLabel})` : p.name;
  const key = `${p.id}-${price}`;
  const found = cart.find(i => i.id === key);
  if (found) { found.qty += imQty; } else { cart.push({ id: key, name, price, img: p.img || p.image, qty: imQty }); }
  renderCart();
  renderProducts();
  $('ed2-imbg').classList.remove('on');
  showToastMsg(`✅ ${name} adicionado!`);
  edCartBounce();
};

function edCartBounce() {
  const btn = $('ed2-cart-btn');
  if (!btn) return;
  btn.classList.add('ed2-bounce');
  setTimeout(() => btn.classList.remove('ed2-bounce'), 600);
}
