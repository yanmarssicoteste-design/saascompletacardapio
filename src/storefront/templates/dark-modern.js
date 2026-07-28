/**
 * dark.js — Template Dark Forno
 * Estética noturna premium: grain, gradiente ember,
 * glassmorphism e carrinho drawer com cores escuras.
 */

import '../../styles/templates/dark-modern.css';

let store = {}, categories = [], products = [], combos = [], reviews = [];
let cart = [];
let imCurrentPid = null;

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
  <div class="dk-topbar">🔥 Pedidos abertos por mais <span id="dk-countdown">--:--:--</span> 🔥</div>

  <section class="dk-hero">
    <div class="dk-hero-bg"></div>
    <div class="dk-orbit">🍕</div>
    <div class="dk-hero-inner">
      <div class="dk-badge"><span class="dk-badge-dot"></span>Sem taxas · Pedido direto</div>
      <img id="dk-logo" class="dk-logo" src="" alt="">
      <h1 class="dk-title"><span class="dk-t1" id="dk-t1">La Bella</span><span class="dk-t2" id="dk-t2">Pizza</span></h1>
      <p class="dk-tagline" id="dk-tagline">Feita com amor, entregue com sabor</p>
      <div class="dk-stats">
        <div class="dk-stat"><span class="dk-stat-icon">⚡</span><span class="dk-stat-label">Entrega</span><span class="dk-stat-val" id="dk-time">40–60 min</span></div>
        <div class="dk-stat"><span class="dk-stat-icon">🛵</span><span class="dk-stat-label">Frete</span><span class="dk-stat-val" id="dk-fee">R$5</span></div>
        <div class="dk-stat"><span class="dk-stat-icon">⭐</span><span class="dk-stat-label">Avaliação</span><span class="dk-stat-val" id="dk-rating">4.9</span></div>
        <div class="dk-stat"><span class="dk-stat-icon">⏰</span><span class="dk-stat-label">Hoje</span><span class="dk-stat-val" id="dk-hours">18h–23h</span></div>
      </div>
      <button class="dk-cta" onclick="document.getElementById('dk-nav').scrollIntoView({behavior:'smooth'})">🍕 Ver Cardápio</button>
    </div>
  </section>

  <nav class="dk-nav" id="dk-nav">
    <div class="dk-nav-inner">
      <div class="dk-nav-logo" id="dk-nav-logo">La <em>Bella</em></div>
      <div class="dk-nav-cats" id="dk-nav-cats"></div>
      <button class="dk-cart-btn" onclick="dkToggleCart()">🛒<span class="dk-cart-badge" id="dk-cart-badge">0</span></button>
    </div>
  </nav>

  <main class="dk-main">
    <div id="dk-social" class="dk-social dk-fi-anim">
      <div class="dk-social-dot"></div>
      <div class="dk-social-txt"><strong id="dk-social-txt">12 pessoas vendo agora</strong><span id="dk-social-sub">Última venda há 8 min</span></div>
      <span class="dk-social-live">🔴 Ao vivo</span>
    </div>
    <div id="dk-promo" class="dk-promo dk-fi-anim" style="display:none">
      <div><strong id="dk-promo-txt"></strong><div class="dk-promo-sub">Promoção por tempo limitado</div></div>
      <div class="dk-promo-pill" id="dk-promo-tag">SÓ HOJE</div>
    </div>
    <div id="dk-minbar" class="dk-minbar dk-fi-anim">
      <div class="dk-minbar-top"><span id="dk-min-lbl">Pedido mínimo: R$ 30</span><span id="dk-min-val">R$ 0 / R$ 30</span></div>
      <div class="dk-minbar-track"><div class="dk-minbar-fill" id="dk-min-fill" style="width:0%"></div></div>
    </div>
    <div id="dk-combos" class="dk-combos dk-fi-anim"></div>
    <div id="dk-sections"></div>
    <div id="dk-reviews" class="dk-reviews dk-fi-anim"></div>
  </main>

  <!-- ITEM MODAL -->
  <div class="dk-imbg" id="dk-imbg" onclick="dkCloseIM(event)">
    <div class="dk-imbox">
      <div class="dk-imimg">
        <img id="dk-im-img" src="" alt="" style="display:none">
        <div class="dk-imnoimg" id="dk-im-noimg">🍕</div>
        <button class="dk-imclose" onclick="document.getElementById('dk-imbg').classList.remove('on')">✕</button>
      </div>
      <div class="dk-imbody">
        <div class="dk-imcat" id="dk-imcat"></div>
        <div class="dk-imname" id="dk-imname"></div>
        <div class="dk-imdesc" id="dk-imdesc"></div>
        <div class="dk-imlbl">Escolha o tamanho</div>
        <div class="dk-imsizes" id="dk-imsizes"></div>
      </div>
      <div class="dk-imft">
        <div class="dk-imtotal" id="dk-imtotal">R$ 0</div>
        <button class="dk-imadd" onclick="dkAddFromIM()">+ Adicionar ao pedido</button>
      </div>
    </div>
  </div>

  <!-- CART DRAWER -->
  <div class="dk-cov" id="dk-cov" onclick="dkToggleCart()"></div>
  <div class="dk-cdr" id="dk-cdr">
    <div class="dk-chd"><div class="dk-chd-t">🛒 Seu Pedido</div><button class="dk-cx" onclick="dkToggleCart()">✕</button></div>
    <div class="dk-cbody" id="dk-cbody"><div class="dk-cempty">Carrinho vazio 🍕</div></div>
    <div class="dk-cft" id="dk-cft" style="display:none">
      <div class="dk-crow"><span>Subtotal</span><span id="dk-csub">R$ 0,00</span></div>
      <div class="dk-crow"><span>Taxa de entrega</span><span id="dk-cfee">R$ 5,00</span></div>
      <div class="dk-cttl"><span>Total</span><span id="dk-cttl">R$ 0,00</span></div>
      <div class="dk-cwarn" id="dk-cwarn" style="display:none">⚠️ Mínimo R$<span id="dk-cwarn-min">30</span>. Faltam R$<span id="dk-cwarn-diff">30</span></div>
      <input class="dk-fi" id="dk-cname" placeholder="Seu nome">
      <input class="dk-fi" id="dk-caddr" placeholder="Endereço de entrega">
      <button class="dk-obtn" onclick="dkCheckout()">Fazer Pedido 🍕</button>
    </div>
  </div>

  <footer class="dk-footer">
    <div class="dk-footer-name" id="dk-foot-name">La <em>Bella</em> Pizza</div>
    <div class="dk-footer-info" id="dk-foot-addr"></div>
    <div class="dk-footer-info" id="dk-foot-phone"></div>
    <div class="dk-footer-pow">Powered by Pizzaria Cheia ✦</div>
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

  window.dkToggleCart = dkToggleCart;
  window.dkCloseIM    = dkCloseIM;
  window.dkAddFromIM  = dkAddFromIM;
  window.dkCheckout   = dkCheckout;
  window.dkAddToCart  = dkAddToCart;
  window.dkAddCombo   = dkAddCombo;
  window.dkChangeQty  = dkChangeQty;
  window.dkOpenIM     = dkOpenIM;
  window.dkSelectSize = dkSelectSize;
}

// ═══════════════════════════════════════════════
// POPULATE
// ═══════════════════════════════════════════════
function populateHero() {
  const n = store.name || 'La Bella Pizza';
  const [p1, ...rest] = n.trim().split(' ');
  $('dk-t1').textContent = p1;
  $('dk-t2').textContent = rest.join(' ');
  $('dk-tagline').textContent = store.tagline || '';
  $('dk-time').textContent    = store.deliveryTime || '40–60 min';
  $('dk-fee').textContent     = store.fee ? `R$${store.fee}` : 'R$5';
  $('dk-rating').textContent  = store.rating || '4.9 ★';
  $('dk-hours').textContent   = store.hours || '';
  $('dk-nav-logo').innerHTML  = `${p1} <em>${rest.join(' ')}</em>`;
  $('dk-foot-name').innerHTML = `${p1} <em>${rest.join(' ')}</em>`;
  $('dk-foot-addr').textContent  = store.addr  || '';
  $('dk-foot-phone').textContent = store.phone ? `📞 ${store.phone}` : '';
  const logo = $('dk-logo');
  if (store.logo) { logo.src = store.logo; logo.classList.add('show'); }
  if (store.promoTxt) {
    $('dk-promo-txt').textContent = store.promoTxt;
    $('dk-promo-tag').textContent = store.promoTag || 'SÓ HOJE';
    $('dk-promo').style.display   = 'flex';
  }
  const min = store.minOrder || 30;
  $('dk-min-lbl').textContent = `Pedido mínimo: R$ ${min}`;
  $('dk-min-val').textContent = `R$ 0 / R$ ${min}`;
}

function renderNav() {
  $('dk-nav-cats').innerHTML = categories.map((c) =>
    `<button class="dk-cat-btn" onclick="document.getElementById('dk-sec-${c.id}')?.scrollIntoView({behavior:'smooth'});document.querySelectorAll('.dk-cat-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">${c.emoji} ${c.name}</button>`
  ).join('');
}

// ═══════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════
function renderSections() {
  $('dk-sections').innerHTML = categories.map((cat) => {
    const items = products.filter((p) => p.cat === cat.id && p.active !== false);
    if (!items.length) return '';
    if (cat.display === 'list') return dkListSec(cat, items);
    return dkGridSec(cat, items);
  }).join('');
}

function dkGridSec(cat, items) {
  return `<div class="dk-sec dk-fi-anim" id="dk-sec-${cat.id}">
    <div class="dk-sec-head"><h2 class="dk-sec-title">${cat.emoji} <em>${cat.name}</em></h2><span class="dk-sec-count">${items.length} itens</span></div>
    <div class="dk-grid">${items.map((p) => dkCard(p, cat)).join('')}</div>
  </div>`;
}

function dkListSec(cat, items) {
  return `<div class="dk-sec dk-fi-anim" id="dk-sec-${cat.id}">
    <div class="dk-sec-head"><h2 class="dk-sec-title">${cat.emoji} <em>${cat.name}</em></h2><span class="dk-sec-count">${items.length} itens</span></div>
    <div class="dk-list">${items.map((p) => dkListItem(p)).join('')}</div>
  </div>`;
}

function dkCard(p, cat) {
  return `<div class="dk-card" onclick="dkOpenIM('${p.id}')">
    <div class="dk-card-img">${p.img ? `<img src="${p.img}" alt="${p.name}">` : '🍕'}</div>
    <div class="dk-card-body">
      <div class="dk-card-cat">${cat.name}</div>
      <div class="dk-card-name">${p.name}</div>
      <div class="dk-card-desc">${p.desc}</div>
      <div class="dk-card-foot">
        <div class="dk-card-price">R$ ${p.prices?.[0] ?? 0}</div>
        <button class="dk-card-add" onclick="event.stopPropagation();dkAddToCart('${p.id}',0)">+</button>
      </div>
    </div>
  </div>`;
}

function dkListItem(p) {
  return `<div class="dk-list-item" onclick="dkOpenIM('${p.id}')">
    <div class="dk-list-img">${p.img ? `<img src="${p.img}" alt="">` : '🍕'}</div>
    <div style="flex:1">
      <div class="dk-list-name">${p.name}</div>
      <div class="dk-list-desc">${p.desc}</div>
    </div>
    <div style="display:flex;align-items:center;gap:.65rem;flex-shrink:0">
      <div class="dk-list-price">R$ ${p.prices?.[0] ?? 0}</div>
      <button class="dk-list-add" onclick="event.stopPropagation();dkAddToCart('${p.id}',0)">+</button>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════
// COMBOS
// ═══════════════════════════════════════════════
function renderCombos() {
  const sec = $('dk-combos');
  if (!combos.length) { sec.style.display = 'none'; return; }
  sec.innerHTML = `<div class="dk-sec-head"><h2 class="dk-sec-title">🎁 <em>Combos</em> Especiais</h2><span class="dk-sec-count">${combos.length} opções</span></div>
  <div class="dk-combos-scroll">${combos.filter((c) => c.active !== false).map((c) => `
    <div class="dk-combo-card" onclick="dkAddCombo('${c.id}')">
      <div class="dk-combo-img">${c.img ? `<img src="${c.img}" alt="">` : '🎁'}${c.saving ? `<div class="dk-combo-save">${c.saving}</div>` : ''}</div>
      <div class="dk-combo-body">
        <div class="dk-combo-name">${c.name}</div>
        <div class="dk-combo-items">${c.items}</div>
        <div class="dk-combo-foot">
          <div>${c.origPrice ? `<span class="dk-combo-old">R$${c.origPrice}</span> ` : ''}<span class="dk-combo-price">R$${c.price}</span></div>
          <button class="dk-combo-add" onclick="event.stopPropagation();dkAddCombo('${c.id}')">+ Pedir</button>
        </div>
      </div>
    </div>`).join('')}
  </div>`;
}

// ═══════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════
function renderReviews() {
  const sec = $('dk-reviews');
  if (!reviews.length) { sec.style.display = 'none'; return; }
  const avg = (reviews.reduce((s, r) => s + (r.stars || 5), 0) / reviews.length).toFixed(1);
  sec.innerHTML = `<div class="dk-sec-head"><h2 class="dk-sec-title">⭐ <em>Avaliações</em></h2></div>
  <div class="dk-reviews-avg"><span class="dk-score">${avg}</span><div><div style="color:var(--dk-gold)">${'⭐'.repeat(5)}</div><div style="font-size:.72rem;color:var(--dk-muted)">${reviews.length} avaliações</div></div></div>
  <div class="dk-reviews-grid">${reviews.map((r) => `
    <div class="dk-review-card">
      <div class="dk-rc-top">
        <div class="dk-rc-av">👤</div>
        <div><div class="dk-rc-name">${r.name}</div><div class="dk-rc-stars">${'⭐'.repeat(r.stars || 5)}</div></div>
      </div>
      <div class="dk-rc-text">${r.text}</div>
      ${r.product ? `<div class="dk-rc-product">📦 ${r.product}</div>` : ''}
    </div>`).join('')}
  </div>`;
}

// ═══════════════════════════════════════════════
// ITEM MODAL
// ═══════════════════════════════════════════════
window.dkOpenIM = function (pid) {
  imCurrentPid = pid;
  const p   = products.find((x) => x.id === pid);
  const cat = categories.find((c) => c.id === p?.cat);
  if (!p) return;
  $('dk-imcat').textContent  = cat?.name || '';
  $('dk-imname').textContent = p.name;
  $('dk-imdesc').textContent = p.desc;
  const imgEl = $('dk-im-img'); const noImg = $('dk-im-noimg');
  if (p.img) { imgEl.src = p.img; imgEl.style.display = 'block'; noImg.style.display = 'none'; }
  else { imgEl.style.display = 'none'; noImg.style.display = 'flex'; }
  const labels = ['Pequeno', 'Médio', 'Grande'];
  $('dk-imsizes').innerHTML = (p.prices || []).map((price, i) =>
    `<div class="dk-imsz ${i === 0 ? 'sel' : ''}" onclick="dkSelectSize(this,${price})">
      <span class="dk-imsz-l">${cat?.type === 'sizes' ? labels[i] : 'Tamanho'}</span>
      <span class="dk-imsz-p">R$${price}</span>
    </div>`
  ).join('');
  $('dk-imtotal').textContent = `R$ ${p.prices?.[0] ?? 0}`;
  $('dk-imbg').classList.add('on');
};
window.dkSelectSize = function (el, price) {
  document.querySelectorAll('.dk-imsz').forEach((x) => x.classList.remove('sel'));
  el.classList.add('sel');
  $('dk-imtotal').textContent = `R$ ${price}`;
};
window.dkCloseIM = function (e) { if (e.target === $('dk-imbg')) $('dk-imbg').classList.remove('on'); };
window.dkAddFromIM = function () {
  const sel = document.querySelector('.dk-imsz.sel'); if (!sel) return;
  const price = parseFloat(sel.querySelector('.dk-imsz-p').textContent.replace('R$', ''));
  const size  = sel.querySelector('.dk-imsz-l').textContent;
  const p = products.find((x) => x.id === imCurrentPid);
  cart.push({ id: Date.now(), name: p.name, size, price, img: p.img });
  $('dk-imbg').classList.remove('on');
  renderCart(); showToast('✅ Adicionado!');
};

// ═══════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════
window.dkAddToCart = function (pid, idx) {
  const p = products.find((x) => x.id === pid); if (!p) return;
  const cat = categories.find((c) => c.id === p.cat);
  cart.push({ id: Date.now(), name: p.name, size: cat?.type === 'sizes' ? ['P','M','G'][idx] : '', price: p.prices?.[idx] ?? p.prices?.[0] ?? 0, img: p.img });
  renderCart(); showToast('✅ Adicionado!');
};
window.dkAddCombo = function (cid) {
  const c = combos.find((x) => x.id === cid); if (!c) return;
  cart.push({ id: Date.now(), name: c.name, size: 'Combo', price: c.price, img: c.img });
  renderCart(); showToast('✅ Combo adicionado!');
};
window.dkChangeQty = function (cartId, delta) {
  const idx = cart.findIndex((x) => x.id === cartId); if (idx === -1) return;
  cart[idx].qty = (cart[idx].qty || 1) + delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  renderCart();
};
function renderCart() {
  const count = cart.length;
  const badge = $('dk-cart-badge');
  badge.textContent = count; badge.classList.toggle('on', count > 0);
  if (!count) { $('dk-cbody').innerHTML = '<div class="dk-cempty">Carrinho vazio 🍕</div>'; $('dk-cft').style.display = 'none'; return; }
  const sub = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const fee = store.fee ?? 5; const total = sub + fee;
  const min = store.minOrder ?? 30;
  $('dk-cbody').innerHTML = cart.map((item) => `
    <div class="dk-ci">
      <div class="dk-ci-img">${item.img ? `<img src="${item.img}" alt="">` : '🍕'}</div>
      <div style="flex:1">
        <div class="dk-ci-nm">${item.name}</div>
        <div class="dk-ci-sz">${item.size}</div>
        <div class="dk-ci-pr">${fmtR(item.price)}</div>
        <div class="dk-ci-ctrl">
          <button class="dk-qb" onclick="dkChangeQty(${item.id},-1)">−</button>
          <span class="dk-qn">${item.qty || 1}</span>
          <button class="dk-qb" onclick="dkChangeQty(${item.id},+1)">+</button>
        </div>
      </div>
    </div>`).join('');
  $('dk-csub').textContent = fmtR(sub);
  $('dk-cfee').textContent = fmtR(fee);
  $('dk-cttl').textContent = fmtR(total);
  $('dk-cft').style.display = 'block';
  const warn = $('dk-cwarn');
  if (sub < min) { warn.style.display = 'block'; $('dk-cwarn-min').textContent = min; $('dk-cwarn-diff').textContent = (min - sub).toFixed(2); }
  else warn.style.display = 'none';
  const minPct = Math.min(100, (sub / min) * 100);
  const mf = $('dk-min-fill'); if (mf) mf.style.width = minPct + '%';
  const mv = $('dk-min-val');  if (mv) mv.textContent = `R$ ${sub.toFixed(2)} / R$ ${min}`;
}
window.dkToggleCart = function () { $('dk-cdr').classList.toggle('on'); $('dk-cov').classList.toggle('on'); };
window.dkCheckout = function () {
  const name = $('dk-cname').value.trim(); const addr = $('dk-caddr').value.trim();
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

// ═══════════════════════════════════════════════
// SOCIAL + COUNTDOWN
// ═══════════════════════════════════════════════
function startSocial() {
  const sec = $('dk-social');
  if (!(store.features?.social ?? true)) { sec.style.display = 'none'; return; }
  $('dk-social-txt').textContent = `${Math.floor(Math.random()*30+8)} pessoas vendo agora`;
  $('dk-social-sub').textContent = `Última venda há ${Math.floor(Math.random()*15+1)} minutos`;
}

function startCountdown() {
  const closeTime = store.closeTime || '23:00';
  function tick() {
    const now = new Date(); const [h, m] = closeTime.split(':').map(Number);
    const close = new Date(); close.setHours(h, m, 0, 0);
    const diff = close - now; if (diff <= 0) return;
    const hh = String(Math.floor(diff/3600000)).padStart(2,'0');
    const mm = String(Math.floor((diff%3600000)/60000)).padStart(2,'0');
    const ss = String(Math.floor((diff%60000)/1000)).padStart(2,'0');
    const el = $('dk-countdown'); if (el) el.textContent = `${hh}:${mm}:${ss}`;
  }
  tick(); setInterval(tick, 1000);
}

function initScroll() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('vis'), i*80); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.dk-fi-anim').forEach((el) => obs.observe(el));
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2600);
}
