/**
 * editorial.js — Template Editorial
 * Layout claro e clean: hero persuasivo, busca integrada,
 * barra de frete grátis, stepper de quantidade e carrinho drawer.
 */

import '../../styles/templates/editorial-modern.css';

let store = {}, categories = [], products = [], combos = [], reviews = [];
let cart = [];
let imCurrentPid = null;
let imQty = 1;
let searchQuery = '';

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
  renderSections();
  renderCombos();
  renderReviews();
  populateHero();
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
  <div class="ed-topbar" id="ed-topbar">🔥 Pedidos abertos • <span id="ed-countdown">--:--:--</span></div>
  <header class="ed-hero">
    <div class="ed-hero-inner">
      <img id="ed-logo" class="ed-logo" src="" alt="" style="display:none">
      <h1 class="ed-store-name" id="ed-store-name">La Bella Pizza</h1>
      <p class="ed-tagline" id="ed-tagline">Feita com amor, entregue com sabor</p>
      <div class="ed-stats">
        <div class="ed-stat">⏱ <strong id="ed-time">40–60 min</strong></div>
        <div class="ed-stat">🛵 <strong id="ed-fee">Frete R$5</strong></div>
        <div class="ed-stat">⭐ <strong id="ed-rating">4.9</strong></div>
        <div class="ed-stat">🕐 <strong id="ed-hours">18h–23h</strong></div>
      </div>
      <div class="ed-free-bar" id="ed-free-bar">
        🎉 Frete grátis acima de R$ <span id="ed-free-threshold">50</span>
        <div class="ed-progress"><div class="ed-progress-fill" id="ed-free-fill" style="width:0%"></div></div>
      </div>
    </div>
  </header>

  <nav class="ed-nav">
    <div class="ed-nav-inner">
      <div class="ed-nav-logo" id="ed-nav-logo">La Bella</div>
      <div class="ed-search">
        <span class="ed-search-icon">🔍</span>
        <input class="ed-search-inp" id="ed-search" type="text" placeholder="Buscar no cardápio…" oninput="onSearch(this.value)">
      </div>
      <div class="ed-cats" id="ed-cats"></div>
      <button class="ed-cart-btn" onclick="edToggleCart()">🛒<span class="ed-cart-badge" id="ed-cart-badge">0</span></button>
    </div>
  </nav>

  <main class="ed-main">
    <div id="ed-social" class="ed-social ed-fi-anim">
      <div class="ed-social-dot"></div>
      <div class="ed-social-txt"><strong id="ed-social-txt">12 pessoas vendo agora</strong><span id="ed-social-sub">Última venda há 8 min</span></div>
      <span class="ed-social-live">Ao vivo</span>
    </div>
    <div id="ed-promo" class="ed-promo ed-fi-anim" style="display:none">
      <div class="ed-promo-text"><strong id="ed-promo-txt"></strong><span>Promoção por tempo limitado</span></div>
      <div class="ed-promo-pill" id="ed-promo-tag">SÓ HOJE</div>
    </div>
    <div id="ed-minbar" class="ed-minbar ed-fi-anim">
      <div class="ed-minbar-top"><span id="ed-min-lbl">Pedido mínimo: R$ 30</span><span id="ed-min-val">R$ 0 / R$ 30</span></div>
      <div class="ed-minbar-track"><div class="ed-minbar-fill" id="ed-min-fill" style="width:0%"></div></div>
    </div>
    <div id="ed-combos" class="ed-combos ed-fi-anim"></div>
    <div id="ed-sections"></div>
    <div id="ed-reviews" class="ed-reviews ed-fi-anim"></div>
  </main>

  <!-- Item modal -->
  <div class="ed-imbg" id="ed-imbg" onclick="edCloseIM(event)">
    <div class="ed-imbox">
      <div class="ed-imimg" id="ed-imimg">
        <img id="ed-im-img" src="" alt="" style="display:none">
        <div class="ed-imnoimg" id="ed-im-noimg">🍕</div>
        <button class="ed-imclose" onclick="document.getElementById('ed-imbg').classList.remove('on')">✕</button>
      </div>
      <div class="ed-imbody">
        <div class="ed-imcat" id="ed-imcat"></div>
        <div class="ed-imname" id="ed-imname"></div>
        <div class="ed-imdesc" id="ed-imdesc"></div>
        <div class="ed-imlbl" id="ed-imlbl">Escolha o tamanho</div>
        <div class="ed-imsizes" id="ed-imsizes"></div>
        <div class="ed-imlbl">Quantidade</div>
        <div class="ed-qty-stepper">
          <button class="ed-qty-btn" onclick="edChangeImQty(-1)">−</button>
          <span class="ed-qty-num" id="ed-qty-num">1</span>
          <button class="ed-qty-btn" onclick="edChangeImQty(1)">+</button>
        </div>
      </div>
      <div class="ed-imft">
        <div class="ed-imtotal" id="ed-imtotal">R$ 0</div>
        <button class="ed-imadd" onclick="edAddFromIM()">+ Adicionar</button>
      </div>
    </div>
  </div>

  <!-- Cart drawer -->
  <div class="ed-cov" id="ed-cov" onclick="edToggleCart()"></div>
  <div class="ed-cdr" id="ed-cdr">
    <div class="ed-chd"><div class="ed-chd-t">🛒 Seu Pedido</div><button class="ed-cx" onclick="edToggleCart()">✕</button></div>
    <div class="ed-cbody" id="ed-cbody"><div class="ed-cempty">Carrinho vazio 🍕</div></div>
    <div class="ed-cft" id="ed-cft" style="display:none">
      <div class="ed-crow"><span>Subtotal</span><span id="ed-csub">R$ 0,00</span></div>
      <div class="ed-crow"><span>Taxa de entrega</span><span id="ed-cfee">R$ 5,00</span></div>
      <div class="ed-cttl"><span>Total</span><span id="ed-cttl">R$ 0,00</span></div>
      <div class="ed-cwarn" id="ed-cwarn" style="display:none">⚠️ Mínimo R$<span id="ed-cwarn-min">30</span>. Faltam R$<span id="ed-cwarn-diff">30</span></div>
      <input class="ed-fi" id="ed-cname" placeholder="Seu nome">
      <input class="ed-fi" id="ed-caddr" placeholder="Endereço de entrega">
      <button class="ed-obtn" onclick="edCheckout()">Fazer Pedido 🍕</button>
    </div>
  </div>

  <footer class="ed-footer">
    <div class="ed-footer-name" id="ed-foot-name">La Bella Pizza</div>
    <div class="ed-footer-info" id="ed-foot-addr"></div>
    <div class="ed-footer-info" id="ed-foot-phone"></div>
    <div class="ed-footer-pow">Powered by Pizzaria Cheia ✦</div>
  </footer>
  `;
}

// ═══════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════
function boot() {
  populateHero();
  renderNav();
  renderSections();
  renderCombos();
  renderReviews();
  startSocial();
  startCountdown();
  initScroll();

  window.onSearch      = onSearch;
  window.edToggleCart  = edToggleCart;
  window.edCloseIM     = edCloseIM;
  window.edAddFromIM   = edAddFromIM;
  window.edChangeImQty = edChangeImQty;
  window.edCheckout    = edCheckout;
  window.edAddToCart   = edAddToCart;
  window.edAddCombo    = edAddCombo;
  window.edChangeQty   = edChangeQty;
  window.edOpenIM      = edOpenIM;
  window.edSelectSize  = edSelectSize;
}

function populateHero() {
  $('ed-store-name').textContent = store.name || '';
  $('ed-tagline').textContent    = store.tagline || '';
  $('ed-time').textContent    = store.deliveryTime || '40–60 min';
  $('ed-fee').textContent     = store.fee ? `Frete R$${store.fee}` : 'Frete R$5';
  $('ed-rating').textContent  = store.rating || '4.9 ★';
  $('ed-hours').textContent   = store.hours || '';
  $('ed-foot-name').textContent  = store.name || '';
  $('ed-foot-addr').textContent  = store.addr || '';
  $('ed-foot-phone').textContent = store.phone ? `📞 ${store.phone}` : '';
  $('ed-nav-logo').textContent   = store.name || '';
  const logo = $('ed-logo');
  if (store.logo) { logo.src = store.logo; logo.style.display = 'block'; }
  if (store.promoTxt) {
    $('ed-promo-txt').textContent = store.promoTxt;
    $('ed-promo-tag').textContent = store.promoTag || 'SÓ HOJE';
    $('ed-promo').style.display   = 'flex';
  }
  const min = store.minOrder || 30;
  $('ed-min-lbl').textContent = `Pedido mínimo: R$ ${min}`;
  $('ed-min-val').textContent = `R$ 0 / R$ ${min}`;
  const freeThreshold = (store.fee ?? 5) * 10;
  $('ed-free-threshold').textContent = freeThreshold;
}

function renderNav() {
  $('ed-cats').innerHTML = categories.map((c) =>
    `<button class="ed-cat-btn" onclick="document.getElementById('ed-sec-${c.id}')?.scrollIntoView({behavior:'smooth'});document.querySelectorAll('.ed-cat-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">${c.emoji} ${c.name}</button>`
  ).join('');
}

function renderSections() {
  const q = (searchQuery || '').toLowerCase();
  const filteredProds = q
    ? products.filter((p) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
    : products;

  $('ed-sections').innerHTML = categories.map((cat) => {
    const items = filteredProds.filter((p) => p.cat === cat.id && p.active !== false);
    if (!items.length) return '';
    if (cat.display === 'list') return listSec(cat, items);
    return gridSec(cat, items);
  }).join('');
}

function gridSec(cat, items) {
  return `<div class="ed-sec ed-fi-anim" id="ed-sec-${cat.id}">
    <div class="ed-section-head"><h2 class="ed-section-title">${cat.emoji} ${cat.name}</h2><span class="ed-section-count">${items.length} itens</span></div>
    <div class="ed-grid">${items.map((p) => edCard(p, cat)).join('')}</div>
  </div>`;
}

function listSec(cat, items) {
  return `<div class="ed-sec ed-fi-anim" id="ed-sec-${cat.id}">
    <div class="ed-section-head"><h2 class="ed-section-title">${cat.emoji} ${cat.name}</h2><span class="ed-section-count">${items.length} itens</span></div>
    <div class="ed-list">${items.map((p) => edListItem(p)).join('')}</div>
  </div>`;
}

function edCard(p, cat) {
  return `<div class="ed-card" onclick="edOpenIM('${p.id}')">
    <div class="ed-card-img">${p.img ? `<img src="${p.img}" alt="${p.name}">` : '🍕'}</div>
    <div class="ed-card-body">
      <div class="ed-card-cat">${cat.name}</div>
      <div class="ed-card-name">${p.name}</div>
      <div class="ed-card-desc">${p.desc}</div>
      <div class="ed-card-foot">
        <div class="ed-card-price">R$ ${p.prices?.[0] ?? 0}</div>
        <button class="ed-card-add" onclick="event.stopPropagation();edAddToCart('${p.id}',0)">+</button>
      </div>
    </div>
  </div>`;
}

function edListItem(p) {
  return `<div class="ed-list-item" onclick="edOpenIM('${p.id}')">
    <div class="ed-list-img">${p.img ? `<img src="${p.img}" alt="">` : '🍕'}</div>
    <div class="ed-list-info"><div class="ed-list-name">${p.name}</div><div class="ed-list-desc">${p.desc}</div></div>
    <div class="ed-list-right">
      <div class="ed-list-price">R$ ${p.prices?.[0] ?? 0}</div>
      <button class="ed-list-add" onclick="event.stopPropagation();edAddToCart('${p.id}',0)">+</button>
    </div>
  </div>`;
}

function renderCombos() {
  const sec = $('ed-combos');
  if (!combos.length) { sec.style.display = 'none'; return; }
  sec.innerHTML = `<div class="ed-section-head"><h2 class="ed-section-title">🎁 Combos Especiais</h2><span class="ed-section-count">${combos.length} opções</span></div>
  <div class="ed-combos-scroll">${combos.filter((c) => c.active !== false).map((c) => `
    <div class="ed-combo-card" onclick="edAddCombo('${c.id}')">
      <div class="ed-combo-img">${c.img ? `<img src="${c.img}" alt="">` : '🎁'}${c.saving ? `<div class="ed-combo-save">${c.saving}</div>` : ''}</div>
      <div class="ed-combo-body">
        <div class="ed-combo-name">${c.name}</div>
        <div class="ed-combo-items">${c.items}</div>
        <div class="ed-combo-foot">
          <div>${c.origPrice ? `<span class="ed-combo-old">R$${c.origPrice}</span> ` : ''}<span class="ed-combo-price">R$${c.price}</span></div>
          <button class="ed-combo-add" onclick="event.stopPropagation();edAddCombo('${c.id}')">+ Pedir</button>
        </div>
      </div>
    </div>`).join('')}
  </div>`;
}

function renderReviews() {
  const sec = $('ed-reviews');
  if (!reviews.length) { sec.style.display = 'none'; return; }
  sec.innerHTML = `<div class="ed-section-head"><h2 class="ed-section-title">⭐ Avaliações</h2></div>
  <div class="ed-reviews-grid">${reviews.map((r) => `
    <div class="ed-review-card">
      <div class="ed-review-stars">${'★'.repeat(r.stars || 5)}</div>
      <div class="ed-review-text">${r.text}</div>
      <div class="ed-review-author">${r.name}</div>
      <div class="ed-review-date">${r.date || ''}</div>
    </div>`).join('')}
  </div>`;
}

// ── ITEM MODAL ──
window.edOpenIM = function edOpenIM(pid) {
  imCurrentPid = pid; imQty = 1;
  const p   = products.find((x) => x.id === pid);
  const cat = categories.find((c) => c.id === p?.cat);
  if (!p) return;
  $('ed-imcat').textContent  = cat?.name || '';
  $('ed-imname').textContent = p.name;
  $('ed-imdesc').textContent = p.desc;
  const imgEl = $('ed-im-img'); const noImg = $('ed-im-noimg');
  if (p.img) { imgEl.src = p.img; imgEl.style.display = 'block'; noImg.style.display = 'none'; }
  else { imgEl.style.display = 'none'; noImg.style.display = 'flex'; }
  const labels = ['Pequeno', 'Médio', 'Grande'];
  $('ed-imsizes').innerHTML = (p.prices || []).map((price, i) =>
    `<div class="ed-imsz ${i === 0 ? 'sel' : ''}" onclick="edSelectSize(this,${price})">
      <span class="ed-imsz-l">${cat?.type === 'sizes' ? labels[i] : 'Tamanho'}</span>
      <span class="ed-imsz-p">R$${price}</span>
    </div>`
  ).join('');
  $('ed-qty-num').textContent = '1';
  updateImTotal();
  $('ed-imbg').classList.add('on');
};
window.edSelectSize = function (el, price) {
  document.querySelectorAll('.ed-imsz').forEach((x) => x.classList.remove('sel'));
  el.classList.add('sel');
  updateImTotal();
};
window.edChangeImQty = function (delta) {
  imQty = Math.max(1, imQty + delta);
  $('ed-qty-num').textContent = imQty;
  updateImTotal();
};
function updateImTotal() {
  const sel = document.querySelector('.ed-imsz.sel');
  if (!sel) return;
  const price = parseFloat(sel.querySelector('.ed-imsz-p').textContent.replace('R$',''));
  $('ed-imtotal').textContent = fmtR(price * imQty);
}
window.edCloseIM = function (e) { if (e.target === $('ed-imbg')) $('ed-imbg').classList.remove('on'); };
window.edAddFromIM = function () {
  const sel = document.querySelector('.ed-imsz.sel');
  if (!sel) return;
  const price = parseFloat(sel.querySelector('.ed-imsz-p').textContent.replace('R$',''));
  const size  = sel.querySelector('.ed-imsz-l').textContent;
  const p     = products.find((x) => x.id === imCurrentPid);
  for (let i = 0; i < imQty; i++) cart.push({ id: Date.now() + i, name: p.name, size, price, img: p.img });
  $('ed-imbg').classList.remove('on');
  renderCart();
  showToast('✅ Adicionado!');
};

// ── CART ──
window.edAddToCart = function (pid, idx) {
  const p = products.find((x) => x.id === pid); if (!p) return;
  const cat = categories.find((c) => c.id === p.cat);
  cart.push({ id: Date.now(), name: p.name, size: cat?.type === 'sizes' ? ['P','M','G'][idx] : '', price: p.prices?.[idx] ?? p.prices?.[0] ?? 0, img: p.img });
  renderCart(); showToast('✅ Adicionado!');
};
window.edAddCombo = function (cid) {
  const c = combos.find((x) => x.id === cid); if (!c) return;
  cart.push({ id: Date.now(), name: c.name, size: 'Combo', price: c.price, img: c.img });
  renderCart(); showToast('✅ Combo adicionado!');
};
window.edChangeQty = function (cartId, delta) {
  const idx = cart.findIndex((x) => x.id === cartId); if (idx === -1) return;
  cart[idx].qty = (cart[idx].qty || 1) + delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  renderCart();
};
function renderCart() {
  const count = cart.length;
  const badge = $('ed-cart-badge');
  badge.textContent = count; badge.classList.toggle('on', count > 0);
  if (!count) { $('ed-cbody').innerHTML = '<div class="ed-cempty">Carrinho vazio 🍕</div>'; $('ed-cft').style.display = 'none'; return; }
  const sub = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const fee = store.fee ?? 5; const total = sub + fee;
  const min = store.minOrder ?? 30;
  $('ed-cbody').innerHTML = cart.map((item) => `
    <div class="ed-ci">
      <div class="ed-ci-img">${item.img ? `<img src="${item.img}" alt="">` : '🍕'}</div>
      <div class="ed-ci-info">
        <div class="ed-ci-nm">${item.name}</div>
        <div class="ed-ci-sz">${item.size}</div>
        <div class="ed-ci-pr">${fmtR(item.price)}</div>
        <div class="ed-ci-ctrl">
          <button class="ed-qb" onclick="edChangeQty(${item.id},-1)">−</button>
          <span class="ed-qn">${item.qty || 1}</span>
          <button class="ed-qb" onclick="edChangeQty(${item.id},+1)">+</button>
        </div>
      </div>
    </div>`).join('');
  $('ed-csub').textContent = fmtR(sub);
  $('ed-cfee').textContent = fmtR(fee);
  $('ed-cttl').textContent = fmtR(total);
  $('ed-cft').style.display = 'block';
  const warn = $('ed-cwarn');
  if (sub < min) { warn.style.display = 'block'; $('ed-cwarn-min').textContent = min; $('ed-cwarn-diff').textContent = (min - sub).toFixed(2); }
  else warn.style.display = 'none';
  // Free shipping bar
  const freeThreshold = (store.fee ?? 5) * 10;
  const pct = Math.min(100, (sub / freeThreshold) * 100);
  const fill = $('ed-free-fill'); if (fill) fill.style.width = pct + '%';
  // Min bar
  const minPct = Math.min(100, (sub / min) * 100);
  const minFill = $('ed-min-fill'); if (minFill) minFill.style.width = minPct + '%';
  const minVal = $('ed-min-val'); if (minVal) minVal.textContent = `R$ ${sub.toFixed(2)} / R$ ${min}`;
}
window.edToggleCart = function () { $('ed-cdr').classList.toggle('on'); $('ed-cov').classList.toggle('on'); };
window.edCheckout = function () {
  const name = $('ed-cname').value.trim(); const addr = $('ed-caddr').value.trim();
  if (!name || !addr) { showToast('⚠️ Informe nome e endereço', 'red'); return; }
  const sub = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const min = store.minOrder ?? 30;
  if (sub < min) { showToast(`⚠️ Mínimo R$${min}`, 'red'); return; }
  const fee = store.fee ?? 5; const total = sub + fee;
  const lines = cart.map((i) => `• ${i.name}${i.size ? ' (' + i.size + ')' : ''} — R$${(i.price*(i.qty||1)).toFixed(2)}`).join('\n');
  const msg = encodeURIComponent(`🍕 *Novo Pedido*\n\n${lines}\n\n*Frete:* R$${fee}\n*Total:* R$${total.toFixed(2)}\n\n*Nome:* ${name}\n*Endereço:* ${addr}`);
  const phone = (store.phone || '').replace(/\D/g, '');
  window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
};

// ── SEARCH ──
function onSearch(val) {
  searchQuery = val;
  renderSections();
  initScroll();
}

// ── SOCIAL ──
function startSocial() {
  const enabled = store.features?.social ?? true;
  const sec = $('ed-social'); if (!enabled) { sec.style.display = 'none'; return; }
  $('ed-social-txt').textContent = `${Math.floor(Math.random()*30+8)} pessoas vendo agora`;
  $('ed-social-sub').textContent = `Última venda há ${Math.floor(Math.random()*15+1)} minutos`;
}

function startCountdown() {
  const bar = $('ed-topbar');
  const closeTime = store.closeTime || '23:00';
  function tick() {
    const now = new Date(); const [h, m] = closeTime.split(':').map(Number);
    const close = new Date(); close.setHours(h, m, 0, 0);
    const diff = close - now;
    if (diff <= 0) { bar.style.display = 'none'; return; }
    const hh = String(Math.floor(diff/3600000)).padStart(2,'0');
    const mm = String(Math.floor((diff%3600000)/60000)).padStart(2,'0');
    const ss = String(Math.floor((diff%60000)/1000)).padStart(2,'0');
    $('ed-countdown').textContent = `${hh}:${mm}:${ss}`;
  }
  tick(); setInterval(tick, 1000);
}

function initScroll() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('vis'), i * 80); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.ed-fi-anim').forEach((el) => obs.observe(el));
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2600);
}
