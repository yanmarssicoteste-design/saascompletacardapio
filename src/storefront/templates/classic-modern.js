/**
 * classic.js — Template Clássico
 * Tema escuro dramático com hero animado, countdown de urgência,
 * prova social em tempo real, combos e carrinho drawer.
 * Portado da storefront.js da v4.
 */

import '../../styles/templates/classic-modern.css';

// ── Estado ──
let store = {}, categories = [], products = [], combos = [], reviews = [];
let cart = [];
let selectedSizes = {};

const fmtR = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
const $ = (id) => document.getElementById(id);

// ═══════════════════════════════════════════════
// INIT — monta o HTML e inicializa a lógica
// ═══════════════════════════════════════════════
export async function init(container, doc) {
  loadDoc(doc);
  container.innerHTML = buildHTML();
  boot();
}

export function update(doc) {
  loadDoc(doc);
  // Re-render sections sem recriar tudo
  renderSections();
  renderCombos();
  renderReviews();
  renderNav();
  populateHero();
}

function loadDoc(doc) {
  const { categories: c, products: p, combos: co, reviews: r, ...storeFields } = doc;
  store      = storeFields;
  categories = c  || [];
  products   = p  || [];
  combos     = co || [];
  reviews    = r  || [];
}

// ═══════════════════════════════════════════════
// HTML SHELL
// ═══════════════════════════════════════════════
function buildHTML() {
  return `
  <div class="mu" id="muBar">🔥 PEDIDOS ABERTOS ATÉ <span id="mcd">23h00</span> • FAÇA SEU PEDIDO ONLINE 🔥</div>
  <section class="mhero">
    <div class="mhero-bg"></div>
    <div class="porbit" id="porbit">🍕</div>
    <div class="mhc">
      <div class="mbadge">Sem taxas · Pedido direto</div>
      <img id="mhlogo" class="mhlogo" src="" alt="Logo">
      <h1 class="mhtitle"><span class="t1" id="mhN1">La Bella</span><span class="t2" id="mhN2">Pizza</span></h1>
      <p class="mhtagline" id="mhTag">Feita com amor, entregue com sabor</p>
      <div class="mdiv"><span>✦</span></div>
      <div class="mstats">
        <div class="mst"><span class="mi">⚡</span><span class="ml">Entrega</span><span class="mv" id="msTime">40–60 min</span></div>
        <div class="mst"><span class="mi">🛵</span><span class="ml">Frete</span><span class="mv" id="msFee">A partir R$5</span></div>
        <div class="mst"><span class="mi">⭐</span><span class="ml">Avaliação</span><span class="mv" id="msRating">4.9 (312)</span></div>
        <div class="mst"><span class="mi">⏰</span><span class="ml">Hoje</span><span class="mv" id="msHours">18h–23h</span></div>
      </div>
      <button class="mcta" onclick="document.getElementById('mNav').scrollIntoView({behavior:'smooth'})">🍕 Ver Cardápio</button>
    </div>
  </section>
  <nav class="mnav" id="mNav">
    <div class="mnav-inner">
      <div class="mnav-logo" id="mNavLogo">La <em>Bella</em></div>
      <div class="mnav-cats" id="mNavCats"></div>
      <button class="ctrig" onclick="toggleCart()">🛒<span class="cbadge" id="cbadge">0</span></button>
    </div>
  </nav>
  <main class="mmain">
    <div id="mSocial" class="sp-banner fi-anim">
      <div class="sp-avatars" id="spAvatars"></div>
      <div class="sp-txt"><strong id="spTxt">12 pessoas viram esse cardápio hoje</strong><span id="spSub">Última venda há 8 minutos</span></div>
      <div class="sp-live"><div class="sp-dot"></div>Ao vivo</div>
    </div>
    <div id="mPromo" class="mpromo fi-anim"><div class="mpt"><strong id="mPromoTxt">🔥 Promoção!</strong></div><div class="mppill" id="mPromoTag">SÓ HOJE</div></div>
    <div id="mCombosSection" class="combos-sec fi-anim">
      <div class="msec-head"><h2 class="msec-title">🎁 <em>Combos</em> Especiais</h2><span class="msec-count" id="combosCount"></span></div>
      <div class="combos-scroll" id="combosScroll"></div>
    </div>
    <div id="mMinBar" class="mbar fi-anim">
      <div class="mbar-top"><span id="minLbl">Pedido mínimo: R$ 30</span><span id="minVal">R$ 0 / R$ 30</span></div>
      <div class="pt"><div class="pf" id="pFill" style="width:0%"></div></div>
    </div>
    <div id="mSections"></div>
    <div id="mReviewsSec" class="reviews-sec fi-anim">
      <div class="reviews-header">
        <div class="reviews-avg">
          <span class="reviews-score" id="rvScore">4.9</span>
          <div><div class="reviews-stars-big">⭐⭐⭐⭐⭐</div><div class="reviews-total" id="rvTotal">312 avaliações</div></div>
        </div>
      </div>
      <div class="reviews-grid" id="rvGrid"></div>
    </div>
  </main>

  <!-- ITEM MODAL -->
  <div class="imbg" id="imbg" onclick="closeIM(event)">
    <div class="imbox">
      <div class="imimg" id="imImgWrap">
        <img id="imImg" src="" alt="" style="display:none">
        <div class="imnoimg" id="imNoImg">🍕</div>
        <div class="imimg-ov"></div>
        <button class="imclose" onclick="closeIMDirect()">✕</button>
      </div>
      <div class="imbody">
        <div class="im-cat" id="imCat"></div>
        <div class="im-name" id="imName"></div>
        <div class="im-social" id="imSocial"><div class="dot"></div><span id="imSocialTxt"></span></div>
        <div class="im-desc" id="imDesc"></div>
        <div class="im-lbl">Escolha o tamanho</div>
        <div class="im-sizes" id="imSizes"></div>
      </div>
      <div class="imft">
        <div class="im-total" id="imTotal">R$ 0</div>
        <button class="im-add" onclick="addFromIM()">+ Adicionar ao pedido</button>
      </div>
    </div>
  </div>

  <!-- CART -->
  <div class="cov" id="cov" onclick="toggleCart()"></div>
  <div class="cdr" id="cdr">
    <div class="chd"><div class="chd-t">🛒 Seu Pedido</div><button class="cx" onclick="toggleCart()">✕</button></div>
    <div class="cbody" id="cbody"><div class="cempty"><span>🍕</span><p>Carrinho vazio.<br>Escolha uma pizza!</p></div></div>
    <div class="cft" id="cft" style="display:none">
      <div id="upsellWrap"></div>
      <div class="crow2"><span>Subtotal</span><span id="cSub">R$ 0,00</span></div>
      <div class="crow2"><span>Taxa de entrega</span><span id="cFee">R$ 5,00</span></div>
      <div class="cttl"><span>Total</span><span id="cTtl">R$ 0,00</span></div>
      <div class="mwarn" id="cWarn" style="display:none">⚠️ Pedido mínimo R$<span id="cWarnMin">30</span>. Faltam R$<span id="cWarnDiff">30</span></div>
      <input class="fi2" type="text" id="cName" placeholder="Seu nome">
      <input class="fi2" type="text" id="cAddr" placeholder="Endereço de entrega">
      <button class="obtn" onclick="checkout()">Fazer Pedido 🍕</button>
    </div>
  </div>

  <footer class="mfoot">
    <div class="mfl" id="mFootName"></div>
    <div class="mfi2" id="mFootAddr"></div>
    <div class="mfi2" id="mFootPhone"></div>
    <div class="mpow">Powered by Pizzaria Cheia ✦</div>
  </footer>
  `;
}

// ═══════════════════════════════════════════════
// BOOT — bind events e render inicial
// ═══════════════════════════════════════════════
function boot() {
  populateHero();
  renderNav();
  renderSections();
  renderCombos();
  renderReviews();
  startSocialProof();
  startCountdown();
  initScrollObserver();
  hideDisabledFeatures();

  // Expose globals needed by inline handlers
  window.toggleCart    = toggleCart;
  window.openIM        = openIM;
  window.closeIM       = closeIM;
  window.closeIMDirect = closeIMDirect;
  window.addFromIM     = addFromIM;
  window.checkout      = checkout;
  window.addToCart     = addToCart;
  window.addComboToCart = addComboToCart;
  window.changeQty     = changeQty;
  window.showToast     = showToast;
}

// ═══════════════════════════════════════════════
// POPULATE
// ═══════════════════════════════════════════════
function populateHero() {
  const n = store.name || 'La Bella';
  const [p1, ...rest] = n.trim().split(' ');
  $('mhN1').textContent = p1 || n;
  $('mhN2').textContent = rest.join(' ') || '';
  $('mhTag').textContent = store.tagline || '';
  $('msTime').textContent   = store.deliveryTime || '40–60 min';
  $('msFee').textContent    = store.fee ? `A partir R$${store.fee}` : 'A partir R$5';
  $('msRating').textContent = store.rating || '4.9 ★';
  $('msHours').textContent  = store.hours || '';
  $('mFootName').innerHTML  = `${p1 || n} <em>${rest.join(' ')}</em>`;
  $('mFootAddr').textContent  = store.addr  || '';
  $('mFootPhone').textContent = `📞 ${store.phone || ''}`;

  const logo = $('mhlogo');
  if (store.logo) { logo.src = store.logo; logo.classList.add('show'); }
  else logo.classList.remove('show');

  $('mPromoTxt').textContent = store.promoTxt || '';
  $('mPromoTag').textContent = store.promoTag || 'SÓ HOJE';
  if (!store.promoTxt) $('mPromo').style.display = 'none';

  const minVal = store.minOrder || 30;
  $('minLbl').textContent = `Pedido mínimo: R$ ${minVal}`;
  $('minVal').textContent = `R$ 0 / R$ ${minVal}`;
}

function renderNav() {
  const n = store.name || 'La Bella';
  const [p1, ...rest] = n.trim().split(' ');
  $('mNavLogo').innerHTML = `${p1} <em>${rest.join(' ')}</em>`;
  $('mNavCats').innerHTML = categories.map((c) =>
    `<button class="mnc" onclick="scrollToSec('sec-${c.id}',this)">${c.emoji} ${c.name}</button>`
  ).join('');
  window.scrollToSec = (id, btn) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth' });
    document.querySelectorAll('.mnc').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  };
}

// ═══════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════
function renderSections() {
  $('mSections').innerHTML = categories.map((cat) => {
    const catProducts = products.filter((p) => p.cat === cat.id && p.active !== false);
    if (!catProducts.length) return '';
    if (cat.display === 'featured') return renderFeaturedSection(cat, catProducts);
    if (cat.display === 'list')     return renderListSection(cat, catProducts);
    return renderGridSection(cat, catProducts);
  }).join('');
}

function renderGridSection(cat, items) {
  return `<div class="msec fi-anim" id="sec-${cat.id}">
    <div class="msec-head"><h2 class="msec-title">${cat.emoji} <em>${cat.name}</em></h2><span class="msec-count">${items.length} itens</span></div>
    <div class="mgrid">${items.map((p) => cardHTML(p, cat)).join('')}</div>
  </div>`;
}

function renderFeaturedSection(cat, items) {
  const [feat, ...rest] = items;
  return `<div class="msec fi-anim" id="sec-${cat.id}">
    <div class="msec-head"><h2 class="msec-title">${cat.emoji} <em>${cat.name}</em></h2><span class="msec-count">${items.length} itens</span></div>
    ${featCardHTML(feat, cat)}
    ${rest.length ? `<div class="mgrid">${rest.map((p) => cardHTML(p, cat)).join('')}</div>` : ''}
  </div>`;
}

function renderListSection(cat, items) {
  return `<div class="msec fi-anim" id="sec-${cat.id}">
    <div class="msec-head"><h2 class="msec-title">${cat.emoji} <em>${cat.name}</em></h2><span class="msec-count">${items.length} itens</span></div>
    <div class="mlist">${items.map((p) => listItemHTML(p, cat)).join('')}</div>
  </div>`;
}

function cardHTML(p, cat) {
  const price = p.prices?.[0] ?? 0;
  return `<div class="mcard" onclick="openIM('${p.id}')">
    <div class="mcard-img">
      ${p.img ? `<img src="${p.img}" alt="${p.name}">` : `<div class="mcard-noimg">🍕</div>`}
      <div class="mcard-ov"></div>
    </div>
    <div class="mcard-body">
      <div class="mcard-cat">${cat.name}</div>
      <div class="mcard-name">${p.name}</div>
      <div class="mcard-desc">${p.desc}</div>
      ${cat.type === 'sizes' ? sizeTagsHTML(p) : ''}
      <div class="mcard-foot">
        <div class="mcard-pr"><sup>R$</sup>${price}</div>
        <button class="miadd" onclick="event.stopPropagation();addToCart('${p.id}',0)">+</button>
      </div>
    </div>
  </div>`;
}

function featCardHTML(p, cat) {
  const price = p.prices?.[0] ?? 0;
  return `<div class="mfeat" onclick="openIM('${p.id}')">
    <div class="mfi">
      ${p.img ? `<img src="${p.img}" alt="${p.name}"><div class="mfi-tag">Destaque</div>` : `<div class="mcard-noimg" style="height:100%">🍕</div>`}
    </div>
    <div class="mfb">
      <div class="mfcat">${cat.name}</div>
      <div class="mfname">${p.name}</div>
      <div class="mfdesc">${p.desc}</div>
      <div class="item-social"><div class="dot"></div>${Math.floor(Math.random()*30+5)} pessoas pediram hoje</div>
      <div class="mff">
        <div class="mpr"><sup>R$</sup>${price}</div>
        <button class="madd-btn" onclick="event.stopPropagation();addToCart('${p.id}',0)">+ Adicionar</button>
      </div>
    </div>
  </div>`;
}

function listItemHTML(p, cat) {
  const price = p.prices?.[0] ?? 0;
  return `<div class="mlist-item" onclick="openIM('${p.id}')">
    <div class="mlist-img">${p.img ? `<img src="${p.img}" alt="${p.name}">` : '🍕'}</div>
    <div class="mlist-info"><div class="mlist-name">${p.name}</div><div class="mlist-desc">${p.desc}</div></div>
    <div class="mlist-right">
      <div class="mlist-pr">R$ ${price}</div>
      <button class="mlist-add" onclick="event.stopPropagation();addToCart('${p.id}',0)">+</button>
    </div>
  </div>`;
}

function sizeTagsHTML(p) {
  const labels = ['P', 'M', 'G'];
  return `<div class="mcard-sizes">${(p.prices || []).map((pr, i) => `<span class="msz">${labels[i]}: R$${pr}</span>`).join('')}</div>`;
}

// ═══════════════════════════════════════════════
// COMBOS
// ═══════════════════════════════════════════════
function renderCombos() {
  const sec = $('mCombosSection');
  if (!combos.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  $('combosCount').textContent = `${combos.length} opção${combos.length > 1 ? 'ões' : ''}`;
  $('combosScroll').innerHTML = combos.filter((c) => c.active !== false).map((c) => `
    <div class="combo-card" onclick="addComboToCart('${c.id}')">
      <div class="combo-card-img">
        ${c.img ? `<img src="${c.img}" alt="${c.name}">` : `<div class="mcard-noimg" style="height:100%">🎁</div>`}
        ${c.saving ? `<div class="combo-save-badge">${c.saving}</div>` : ''}
      </div>
      <div class="combo-card-body">
        <div class="combo-card-name">${c.name}</div>
        <div class="combo-card-items">${c.items}</div>
        <div class="combo-card-foot">
          <div>${c.origPrice ? `<span class="combo-old-price">R$${c.origPrice}</span>` : ''}<span class="combo-new-price">R$${c.price}</span></div>
          <button class="combo-add-btn" onclick="event.stopPropagation();addComboToCart('${c.id}')">+ Pedir</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════
function renderReviews() {
  const sec = $('mReviewsSec');
  if (!reviews.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  const avg = (reviews.reduce((s, r) => s + (r.stars || 5), 0) / reviews.length).toFixed(1);
  $('rvScore').textContent = avg;
  $('rvTotal').textContent = `${reviews.length} avaliações`;
  $('rvGrid').innerHTML = reviews.map((r) => `
    <div class="review-card">
      <div class="rc-top">
        <div class="rc-av">${r.avatar ? `<img src="${r.avatar}">` : '👤'}</div>
        <div>
          <div class="rc-name">${r.name}</div>
          <div class="rc-stars">${'⭐'.repeat(r.stars || 5)}</div>
          <div class="rc-date">${r.date || ''}</div>
        </div>
      </div>
      <div class="rc-text">${r.text}</div>
      ${r.product ? `<div class="rc-product">📦 ${r.product}</div>` : ''}
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════
// ITEM MODAL
// ═══════════════════════════════════════════════
let imCurrentPid = null;

window.openIM = function openIM(pid) {
  imCurrentPid = pid;
  const p   = products.find((x) => x.id === pid);
  const cat = categories.find((c) => c.id === p?.cat);
  if (!p) return;

  $('imCat').textContent  = cat?.name || '';
  $('imName').textContent = p.name;
  $('imDesc').textContent = p.desc;
  $('imSocialTxt').textContent = `${Math.floor(Math.random()*20+3)} pessoas pediram hoje`;

  const imgEl = $('imImg'); const noImg = $('imNoImg');
  if (p.img) { imgEl.src = p.img; imgEl.style.display = 'block'; noImg.style.display = 'none'; }
  else { imgEl.style.display = 'none'; noImg.style.display = 'flex'; }

  const isSizes = cat?.type === 'sizes';
  const labels  = ['Pequeno', 'Médio', 'Grande'];
  $('imSizes').innerHTML = (p.prices || []).map((price, i) => `
    <div class="imsz ${i === 0 ? 'sel' : ''}" onclick="selectSize(this, ${price})">
      <span class="imsz-l">${isSizes ? labels[i] : 'Tamanho'}</span>
      <span class="imsz-d">${isSizes ? ['P', 'M', 'G'][i] : '—'}</span>
      <span class="imsz-p">R$${price}</span>
    </div>
  `).join('');

  $('imTotal').textContent = `R$ ${p.prices?.[0] || 0}`;
  $('imbg').classList.add('on');

  window.selectSize = (el, price) => {
    document.querySelectorAll('.imsz').forEach((x) => x.classList.remove('sel'));
    el.classList.add('sel');
    $('imTotal').textContent = `R$ ${price}`;
  };
};

window.closeIM = function closeIM(e) {
  if (e.target === $('imbg')) $('imbg').classList.remove('on');
};
window.closeIMDirect = function () { $('imbg').classList.remove('on'); };

window.addFromIM = function addFromIM() {
  const sel = document.querySelector('.imsz.sel');
  if (!sel) return;
  const price = parseFloat(sel.querySelector('.imsz-p').textContent.replace('R$', ''));
  const sizeLabel = sel.querySelector('.imsz-l').textContent;
  const p = products.find((x) => x.id === imCurrentPid);
  cart.push({ id: Date.now(), name: p.name, size: sizeLabel, price, img: p.img });
  $('imbg').classList.remove('on');
  renderCart();
  showToast('✅ Adicionado ao pedido!');
};

// ═══════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════
window.addToCart = function addToCart(pid, sizeIdx) {
  const p = products.find((x) => x.id === pid);
  if (!p) return;
  const price = p.prices?.[sizeIdx] ?? p.prices?.[0] ?? 0;
  const cat   = categories.find((c) => c.id === p.cat);
  const labels = ['P', 'M', 'G'];
  const size  = cat?.type === 'sizes' ? labels[sizeIdx] : '';
  cart.push({ id: Date.now(), name: p.name, size, price, img: p.img });
  renderCart();
  showToast('✅ Adicionado!');
};

window.addComboToCart = function addComboToCart(cid) {
  const c = combos.find((x) => x.id === cid);
  if (!c) return;
  cart.push({ id: Date.now(), name: c.name, size: 'Combo', price: c.price, img: c.img });
  renderCart();
  showToast('✅ Combo adicionado!');
};

window.changeQty = function changeQty(cartId, delta) {
  const idx = cart.findIndex((x) => x.id === cartId);
  if (idx === -1) return;
  cart[idx].qty = (cart[idx].qty || 1) + delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  renderCart();
};

function renderCart() {
  const count = cart.length;
  const badge = $('cbadge');
  badge.textContent = count;
  badge.classList.toggle('on', count > 0);

  if (!count) {
    $('cbody').innerHTML = `<div class="cempty"><span>🍕</span><p>Carrinho vazio.<br>Escolha uma pizza!</p><button class="cempty-btn" onclick="toggleCart()">🍕 Ver Cardápio</button></div>`;
    $('cft').style.display = 'none';
    return;
  }

  const sub  = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const fee  = store.fee ?? 5;
  const total = sub + fee;
  const min  = store.minOrder ?? 30;

  $('cbody').innerHTML = cart.map((item) => `
    <div class="ci">
      <div class="ci-img">${item.img ? `<img src="${item.img}" alt="">` : '🍕'}</div>
      <div class="ci-info">
        <div class="ci-nm">${item.name}</div>
        <div class="ci-sz">${item.size}</div>
        <div class="ci-pr">${fmtR(item.price)}</div>
        <div class="ci-ctrl">
          <button class="qb" onclick="changeQty(${item.id}, -1)">−</button>
          <span class="qn">${item.qty || 1}</span>
          <button class="qb" onclick="changeQty(${item.id}, +1)">+</button>
        </div>
      </div>
    </div>
  `).join('');

  $('cSub').textContent = fmtR(sub);
  $('cFee').textContent = fmtR(fee);
  $('cTtl').textContent = fmtR(total);
  $('cft').style.display = 'block';

  const warn = $('cWarn');
  if (sub < min) {
    warn.style.display = 'block';
    $('cWarnMin').textContent  = min;
    $('cWarnDiff').textContent = (min - sub).toFixed(2);
  } else {
    warn.style.display = 'none';
  }

  updateMinBar(sub);
  renderUpsell();
}

function updateMinBar(sub) {
  const min = store.minOrder ?? 30;
  const pct = Math.min(100, (sub / min) * 100);
  const fill = $('pFill');
  if (fill) fill.style.width = pct + '%';
  const valEl = $('minVal');
  if (valEl) valEl.textContent = `R$ ${sub.toFixed(2)} / R$ ${min}`;
}

function renderUpsell() {
  const wrap = $('upsellWrap');
  if (!wrap || !(store.features?.upsell ?? true)) return;
  const cartNames = cart.map((i) => i.name);
  const suggestions = products.filter((p) => p.active !== false && !cartNames.includes(p.name)).slice(0, 2);
  if (!suggestions.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = `<div class="upsell">
    <div class="upsell-title">✨ Adicionar ao pedido</div>
    <div class="upsell-items">${suggestions.map((p) => `
      <div class="upsell-item">
        <div class="upsell-item-img">${p.img ? `<img src="${p.img}" alt="">` : '🍕'}</div>
        <div class="upsell-item-info">
          <div class="upsell-item-name">${p.name}</div>
          <div class="upsell-item-price">R$ ${p.prices?.[0] ?? 0}</div>
        </div>
        <button class="upsell-add" onclick="addToCart('${p.id}',0)">+ Add</button>
      </div>`).join('')}
    </div>
  </div>`;
}

window.toggleCart = function toggleCart() {
  $('cdr').classList.toggle('on');
  $('cov').classList.toggle('on');
};

window.checkout = function checkout() {
  const name = $('cName').value.trim();
  const addr = $('cAddr').value.trim();
  if (!name || !addr) { showToast('⚠️ Informe nome e endereço', 'red'); return; }
  const sub = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const min = store.minOrder ?? 30;
  if (sub < min) { showToast(`⚠️ Mínimo R$${min}`, 'red'); return; }
  const fee   = store.fee ?? 5;
  const total = sub + fee;
  const lines = cart.map((i) => `• ${i.name}${i.size ? ' (' + i.size + ')' : ''} — R$${(i.price*(i.qty||1)).toFixed(2)}`).join('\n');
  const msg   = encodeURIComponent(`🍕 *Novo Pedido*\n\n${lines}\n\n*Taxa:* R$${fee}\n*Total:* R$${total.toFixed(2)}\n\n*Nome:* ${name}\n*Endereço:* ${addr}`);
  const phone = (store.phone || '').replace(/\D/g, '');
  window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
};

// ═══════════════════════════════════════════════
// COUNTDOWN
// ═══════════════════════════════════════════════
function startCountdown() {
  const urgencyEnabled = store.features?.urgency ?? true;
  const bar = $('muBar');
  if (!urgencyEnabled) { if (bar) bar.style.display = 'none'; return; }
  const closeTime = store.closeTime || '23:00';
  const formattedClose = closeTime.replace(':', 'h');
  const cdEl = $('mcd');
  if (cdEl) cdEl.textContent = formattedClose;

  function tick() {
    const now    = new Date();
    const [h, m] = closeTime.split(':').map(Number);
    const close  = new Date(); close.setHours(h, m, 0, 0);
    const diff   = close - now;
    if (diff <= 0) { if (bar) bar.style.display = 'none'; return; }
  }
  tick(); setInterval(tick, 60000);
}

// ═══════════════════════════════════════════════
// SOCIAL PROOF
// ═══════════════════════════════════════════════
function startSocialProof() {
  const enabled = store.features?.social ?? true;
  const sec = $('mSocial');
  if (!enabled) { sec.style.display = 'none'; return; }
  const count = Math.floor(Math.random() * 30 + 10);
  $('spTxt').textContent = `${count} pessoas viram esse cardápio hoje`;
  $('spSub').textContent = `Última venda há ${Math.floor(Math.random()*20+1)} minutos`;
  const avatarEmojis = ['👩', '👨', '🧔', '👩‍🦱', '👩‍🦰', '🧑', '🧑‍🍳'];
  $('spAvatars').innerHTML = avatarEmojis.slice(0, 5).map((e) =>
    `<div class="sp-av">${e}</div>`
  ).join('');
}

// ═══════════════════════════════════════════════
// FEATURES
// ═══════════════════════════════════════════════
function hideDisabledFeatures() {
  const f = store.features || {};
  if (!(f.promo   ?? true)) $('mPromo').style.display   = 'none';
  if (!(f.combos  ?? true)) $('mCombosSection').style.display = 'none';
  if (!(f.minbar  ?? true)) $('mMinBar').style.display  = 'none';
  if (!(f.reviews ?? true)) $('mReviewsSec').style.display = 'none';
  if (!(f.orbit   ?? true)) $('porbit').style.display   = 'none';
}

// ═══════════════════════════════════════════════
// SCROLL OBSERVER (fade-in)
// ═══════════════════════════════════════════════
function initScrollObserver() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('vis'), i * 80);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fi-anim').forEach((el) => obs.observe(el));
}

// ═══════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════
function showToast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className   = 'toast' + (type ? ' ' + type : '');
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2600);
}
