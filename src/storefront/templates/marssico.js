import './marssico.css';

/* ── State ── */
let store = {}, categories = [], products = [], combos = [];
let cart = [];
let activeCat = 'all';
let searchQ = '';
let imCurrentPid = null;
let imQty = 1;
const FREE_SHIP = 90;

function fmtR(v) {
  return 'R$\u00a0' + Number(v).toFixed(2).replace('.', ',');
}

let cfg = {}; // templateConfig com defaults

function loadDoc(doc) {
  store = doc;
  categories = doc.categories || [];
  products = doc.products || [];
  combos = doc.combos || [];
  // Configurações dinâmicas do template (o lojista pode personalizar no admin)
  cfg = Object.assign({
    showRating:     true,
    ratingValue:    doc.rating     || '4.9',
    ratingCount:    doc.ratingCount|| '2.140 pedidos',
    showDelivery:   true,
    deliveryTime:   doc.deliveryTime || '35min',
    showFreeShip:   true,
    freeShipFrom:   doc.freeShipFrom  || 'R$90',
    heroTitle:      doc.heroTitle     || null,
    heroSubtitle:   doc.heroSubtitle  || null,
    heroPill1:      doc.heroPill1     || 'Forno aceso agora',
    heroPill2:      doc.heroPill2     || 'Napoletana D.O.P.',
  }, doc.templateConfig || {});
}

/* ── Helpers ── */
function $(id) { return document.getElementById(id); }
function cartTotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
function cartCount() { return cart.reduce((s, i) => s + i.qty, 0); }
function remaining() { return Math.max(0, FREE_SHIP - cartTotal()); }
function isFree() { return cartTotal() >= FREE_SHIP && cartTotal() > 0; }
function deliveryFee() { return isFree() ? 0 : 8; }

/* ── SVG Icons ── */
const SVG = {
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l2.4 12.6a2 2 0 0 0 2 1.6h9.2a2 2 0 0 0 2-1.6L23 6H6"/><circle cx="9" cy="21" r="1.5"/><circle cx="18" cy="21" r="1.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.2 6.8.6-5.1 4.6 1.5 6.6L12 17l-6.1 3.5 1.5-6.6L2.3 9.3l6.8-.6L12 2.5z"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s4 4.5 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 9 8 11 8 13a5 5 0 0 0 10 0c0-4-3-7-6-11z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>',
};


/* ── HTML Shell ── */
function buildHTML() {
  const s = store;
  const minPriceDisplay = (() => {
    if (!products.length) return 'R$\u00a042';
    const mins = products.map(p => Array.isArray(p.prices) && p.prices.length ? Math.min(...p.prices) : (p.price || 0));
    return fmtR(Math.min(...mins));
  })();
  const heroImg = products[0]?.img || products[0]?.image || '';
  const logoHtml = s.logo ? `<img src="${s.logo}" alt="${s.name}" class="m-brand-letter" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : `<span class="m-brand-letter">M</span>`;

  return `
<div class="m-root" style="padding-bottom:calc(88px + env(safe-area-inset-bottom))">

  <!-- HEADER -->
  <header class="m-header">
    <div class="m-header-inner">
      <a href="#m-top" class="m-brand">
        <div class="m-brand-av">${logoHtml}<span class="m-brand-dot"></span></div>
        <div class="m-brand-info">
          <span class="m-brand-name">${s.name || 'Marssico'} <span class="m-brand-badge">Napoletana</span></span>
          <div class="m-brand-status">
            <span class="m-live-wrap"><span class="m-live-ping"></span><span class="m-live-dot"></span></span>
            <span>Aberto &middot; ${s.hours || 'entrega em 35&ndash;45min'}</span>
          </div>
        </div>
      </a>
      <div class="m-header-actions">
        <button class="m-icon-btn" onclick="mSetTab('search')" aria-label="Buscar">${SVG.search}</button>
        <a href="tel:${(s.phone||'').replace(/\D/g,'')}" class="m-icon-btn" aria-label="Ligar">${SVG.phone}</a>
        <button class="m-cart-btn" id="m-cart-btn-hd" onclick="mToggleCart()" aria-label="Ver carrinho">
          ${SVG.cart}
          <span class="m-cart-txt-full" id="m-cart-txt">Carrinho</span>
          <span class="m-cart-badge" id="m-cart-badge-hd"></span>
        </button>
      </div>
    </div>
  </header>

  <!-- HERO -->
  <section class="m-hero" id="m-top">
    <div class="m-hero-card">
      <div class="m-hero-blur"><img src="${heroImg}" alt="" aria-hidden="true"></div>
      <div class="m-hero-radial"></div>
      <div class="m-hero-gradient"></div>
      <div class="m-hero-inner">
        <div class="m-hero-copy">
          <div class="m-hero-pills">
            <span class="m-pill-glass"><span class="m-live-wrap"><span class="m-live-ping"></span><span class="m-live-dot"></span></span> Forno aceso agora</span>
            <span class="m-pill-gold">${SVG.flame} Napoletana D.O.P.</span>
          </div>
          <h1 class="m-hero-h1">A pizza que<br>vira <span class="m-h1-highlight">momento<svg viewBox="0 0 220 12" class="m-h1-uline" preserveAspectRatio="none"><path d="M2 8 Q 60 2, 118 6 T 218 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>.</h1>
          <p class="m-hero-sub">Massa de fermentação lenta <strong>48h</strong>, mussarela fior di latte, tomate San Marzano e manjericão fresco &mdash; assadas a <strong>450°C</strong> em forno a lenha.</p>
          <div class="m-hero-meta">
            <div class="m-star-row">
              <div class="m-stars">${SVG.star.repeat(5)}</div>
              <span class="m-rating-val">4.9</span>
              <span class="m-rating-ct">&middot; 2.140 avaliações</span>
            </div>
            <div class="m-urgency">
              <div class="m-urg-icon">${SVG.flame}</div>
              <span><strong>27 pessoas</strong> pedindo agora</span>
            </div>
          </div>
          <div class="m-hero-ctas">
            <button class="m-cta-primary" onclick="mScrollToCat(null)">${SVG.arrow} Ver cardápio completo</button>
            <a href="#m-combos" class="m-cta-secondary">${SVG.tag} Combos <span class="m-cta-discount">&minus;25%</span></a>
          </div>
          <div class="m-ingredient-chips">
            <span class="m-chip">Massa 48h</span>
            <span class="m-chip">Forno a lenha 450°</span>
            <span class="m-chip">Tomate San Marzano</span>
            <span class="m-chip">Mussarela fior di latte</span>
          </div>
        </div>
        <div class="m-hero-img-col">
          <div class="m-pizza-disc">
            <div class="m-pizza-halo1"></div>
            <div class="m-pizza-halo2"></div>
            <svg viewBox="0 0 200 200" class="m-pizza-ring"><circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" stroke-width=".6" stroke-dasharray="1 4"/></svg>
            <div class="m-pizza-imgw">${heroImg ? `<img src="${heroImg}" alt="Pizza">` : '<div class="m-pizza-noimg">🍕</div>'}</div>
            <div class="m-price-tag"><p class="m-pt-from">A partir de</p><p class="m-pt-val">${minPriceDisplay}</p></div>
            <div class="m-delivery-tag">
              <div class="m-del-icon">${SVG.flame}</div>
              <div class="m-del-text"><p class="m-dt-label">Entrega</p><p class="m-dt-val">35&ndash;45 min</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Trust strip -->
    <div class="m-trust-strip">
      ${cfg.showRating ? `<div class="m-trust-card"><div class="m-trust-icon">${SVG.star}</div><div class="m-trust-text"><p class="m-trust-lbl">Avaliação</p><p class="m-trust-val">${cfg.ratingValue}</p><p class="m-trust-hint">${cfg.ratingCount}</p></div></div>` : ''}
      ${cfg.showDelivery ? `<div class="m-trust-card"><div class="m-trust-icon">${SVG.flame}</div><div class="m-trust-text"><p class="m-trust-lbl">Entrega</p><p class="m-trust-val">${cfg.deliveryTime}</p><p class="m-trust-hint">média hoje</p></div></div>` : ''}
      ${cfg.showFreeShip ? `<div class="m-trust-card"><div class="m-trust-icon">${SVG.tag}</div><div class="m-trust-text"><p class="m-trust-lbl">Frete grátis</p><p class="m-trust-val">${cfg.freeShipFrom}</p><p class="m-trust-hint">acima de</p></div></div>` : ''}
    </div>
  </section>

  <!-- COMBOS -->
  <section class="m-combos-sec" id="m-combos">
    <div><p class="m-sec-eyebrow">Só hoje</p><h2 class="m-sec-title">Combos que valem a pena</h2></div>
    <div class="m-combos-row" id="m-combos-grid"></div>
  </section>

  <!-- CATEGORY NAV -->
  <div class="m-cat-nav">
    <div class="m-cat-nav-inner">
      <div class="m-srch-wrap">
        <span class="m-srch-icon">${SVG.search}</span>
        <input id="m-search" class="m-search" type="search" placeholder="Buscar pizza..." oninput="mOnSearch(this.value)" value="">
      </div>
      <div class="m-cat-chips" id="m-chips"></div>
    </div>
  </div>

  <!-- MENU -->
  <main class="m-menu" id="m-menu"></main>

  <!-- FOOTER -->
  <footer class="m-footer">
    <div class="m-footer-grid">
      <div><p class="m-footer-label">Endereço</p><p class="m-footer-val">${s.address || ''}</p></div>
      <div><p class="m-footer-label">Funcionamento</p><p class="m-footer-val">${s.hours || ''}</p></div>
      <div><p class="m-footer-label">Contato</p><p class="m-footer-val">${s.phone || ''}</p></div>
    </div>
    <p class="m-footer-copy">${s.name || 'Marssico'} &mdash; Napoletana</p>
  </footer>

  <!-- DOCK -->
  <nav class="m-dock" aria-label="Navegação inferior">
    <button class="m-dock-btn active" id="m-dk-menu" onclick="mSetTab('menu')">${SVG.menu}<span>Cardápio</span></button>
    <button class="m-dock-btn" id="m-dk-combos" onclick="mSetTab('combos')">${SVG.tag}<span>Combos</span></button>
    <button class="m-dock-btn" id="m-dk-search" onclick="mSetTab('search')">${SVG.search}<span>Buscar</span></button>
    <button class="m-dock-btn" id="m-dk-cart" onclick="mSetTab('cart')">${SVG.cart}<span>Carrinho</span><span class="m-dock-bdg" id="m-dock-bdg"></span></button>
  </nav>

  <!-- FLOAT BAR -->
  <div class="m-float-bar" id="m-float-bar">
    <button class="m-float-inner" onclick="mToggleCart()">
      <div class="m-float-count" id="m-float-count">0</div>
      <div class="m-float-info"><p class="m-float-ship" id="m-float-ship"></p><p class="m-float-total" id="m-float-total"></p></div>
      <span class="m-float-cta">Finalizar ${SVG.arrow}</span>
    </button>
  </div>

  <!-- OVERLAY -->
  <div class="m-overlay" id="m-overlay" onclick="mToggleCart()"></div>

  <!-- CART DRAWER -->
  <aside class="m-drawer" id="m-drawer" role="dialog" aria-modal="true" aria-label="Carrinho">
    <div class="m-drawer-handle"></div>
    <header class="m-drawer-head">
      <div><p class="m-drawer-sub">Seu pedido</p><p class="m-drawer-title" id="m-drw-title">0 itens</p></div>
      <button class="m-drawer-close" onclick="mToggleCart()" aria-label="Fechar">&#x2715;</button>
    </header>
    <div class="m-freeship" id="m-freeship-box">
      <p class="m-freeship-txt" id="m-freeship-txt">Adicione itens para começar.</p>
      <div class="m-freeship-bar" id="m-fbar-wrap" style="display:none"><div class="m-freeship-fill" id="m-fbar" style="width:0%"></div></div>
    </div>
    <div class="m-drawer-body" id="m-drawer-body"></div>
    <footer class="m-drawer-footer" id="m-drawer-footer" style="display:none">
      <div class="m-cart-totals">
        <div class="m-cart-row"><span>Subtotal</span><span id="m-subtotal"></span></div>
        <div class="m-cart-row"><span>Entrega</span><span id="m-delivery-fee"></span></div>
        <div class="m-cart-row-total"><span>Total</span><span id="m-total"></span></div>
      </div>
      <input class="m-cart-input" id="m-client-name" type="text" placeholder="Seu nome (para o pedido)">
      <button class="m-checkout-btn" onclick="mCheckout()">${SVG.whatsapp} Finalizar no WhatsApp</button>
      <p class="m-drawer-caption">Entrega 35&ndash;45min &middot; Pix, cartão ou dinheiro</p>
    </footer>
  </aside>

  <!-- ITEM MODAL -->
  <div class="m-imbg" id="m-imbg" onclick="mCloseIM(event)">
    <div class="m-imbox">
      <div class="m-imimg"><img id="m-im-img" src="" alt="" style="display:none"><div class="m-imnoimg" id="m-im-noimg">🍕</div><button class="m-imclose" onclick="document.getElementById('m-imbg').classList.remove('on')">&#x2715;</button></div>
      <div class="m-imbody">
        <p class="m-imcat" id="m-imcat"></p>
        <p class="m-imname" id="m-imname"></p>
        <p class="m-imdesc" id="m-imdesc"></p>
        <p class="m-imlbl" id="m-imlbl" style="display:none">Escolha o tamanho</p>
        <div class="m-imsizes" id="m-imsizes"></div>
        <p class="m-imlbl">Quantidade</p>
        <div class="m-im-qty">
          <button class="m-im-qbtn" onclick="mChangeImQty(-1)">&#8722;</button>
          <span class="m-im-qnum" id="m-im-qnum">1</span>
          <button class="m-im-qbtn" onclick="mChangeImQty(1)">+</button>
        </div>
      </div>
      <div class="m-imft">
        <span class="m-imtotal" id="m-imtotal">R$ 0,00</span>
        <button class="m-imadd" id="m-imadd" onclick="mAddFromIM()">+ Adicionar ao pedido</button>
      </div>
    </div>
  </div>
</div>`;
}


/* ── Render Functions ── */
function renderCatChips() {
  const el = $('m-chips'); if (!el) return;
  el.innerHTML = categories.map(c =>
    `<button class="m-cat-chip${activeCat===c.id?' active':''}" onclick="mScrollToCat('${c.id}')">${c.emoji||''} ${c.name}</button>`
  ).join('');
}

function renderProducts() {
  const menuEl = $('m-menu'); if (!menuEl) return;
  const q = searchQ.trim().toLowerCase();
  const grouped = categories.map(c => ({
    ...c,
    items: products.filter(p =>
      (p.cat||p.category) === c.id &&
      (!q || (p.name||'').toLowerCase().includes(q) || (p.desc||p.description||'').toLowerCase().includes(q))
    )
  })).filter(c => c.items.length > 0);

  if (!grouped.length) {
    menuEl.innerHTML = `<div class="m-empty"><p class="m-empty-t">Nada encontrado</p><p class="m-empty-s">Tente outra busca.</p></div>`;
    return;
  }

  menuEl.innerHTML = grouped.map(c => {
    const itemsHtml = c.items.map(p => {
      const isMulti = Array.isArray(p.prices) && p.prices.length > 1;
      const price = isMulti ? Math.min(...p.prices) : (p.price || (p.prices?.[0]) || 0);
      const q = cart.find(i => i.id === p.id)?.qty || 0;
      const imgHtml = (p.img||p.image)
        ? `<img src="${p.img||p.image}" alt="${p.name}">`
        : `<div class="m-pcard-noimg">🍕</div>`;
      const badgeHtml = p.featured ? '<span class="m-pcard-badge">&#9733; Popular</span>' : '';
      const priceHtml = isMulti
        ? `<span class="m-pcard-from">a partir de</span>${fmtR(price)}`
        : fmtR(price);
      let actionHtml;
      if (isMulti) {
        actionHtml = `<button class="m-add-btn" onclick="mOpenIM('${p.id}')">${SVG.plus} Adicionar</button>`;
      } else if (q === 0) {
        actionHtml = `<button class="m-add-btn" onclick="mAdd('${p.id}')">${SVG.plus} Adicionar</button>`;
      } else {
        actionHtml = `<div class="m-stepper">
          <button class="m-step-btn" onclick="mDec('${p.id}')" aria-label="Remover">${SVG.minus}</button>
          <span class="m-step-qty">${q}</span>
          <button class="m-step-btn" onclick="mAdd('${p.id}')" aria-label="Adicionar">${SVG.plus}</button>
        </div>`;
      }
      return `<article class="m-pcard">
        <div class="m-pcard-imgw">${imgHtml}${badgeHtml}</div>
        <div class="m-pcard-body">
          <div>
            <h3 class="m-pcard-name">${p.name}</h3>
            <p class="m-pcard-desc">${p.desc||p.description||''}</p>
          </div>
          <div class="m-pcard-foot">
            <p class="m-pcard-price">${priceHtml}</p>
            ${actionHtml}
          </div>
        </div>
      </article>`;
    }).join('');
    return `<section class="m-cat-section" id="mcat-${c.id}" data-cat="${c.id}">
      <div class="m-cat-head">
        <h2 class="m-cat-title">${c.emoji||''} ${c.name}</h2>
        <span class="m-cat-count">${c.items.length} opções</span>
      </div>
      <div class="m-products-grid">${itemsHtml}</div>
    </section>`;
  }).join('');
}

function renderCart() {
  const body = $('m-drawer-body');
  const footer = $('m-drawer-footer');
  const cnt = cartCount();
  const tot = cartTotal();
  const free = isFree();
  const fee = deliveryFee();
  const rem = remaining();

  // Title
  const t = $('m-drw-title'); if (t) t.textContent = `${cnt} ${cnt===1?'item':'itens'}`;

  // Float bar
  const fb = $('m-float-bar');
  if (fb) { cnt > 0 ? fb.classList.add('on') : fb.classList.remove('on'); }
  const fcount = $('m-float-count'); if (fcount) fcount.textContent = cnt;
  const fship = $('m-float-ship');
  if (fship) fship.textContent = free ? 'Frete grátis ✓' : `Faltam ${fmtR(rem)} p/ frete grátis`;
  const ftot = $('m-float-total'); if (ftot) ftot.textContent = fmtR(tot + fee);

  // Cart badge
  const badge = $('m-cart-badge-hd');
  if (badge) { badge.textContent = cnt; cnt > 0 ? badge.classList.add('on') : badge.classList.remove('on'); }
  const dockBdg = $('m-dock-bdg');
  if (dockBdg) { dockBdg.textContent = cnt; cnt > 0 ? dockBdg.classList.add('on') : dockBdg.classList.remove('on'); }
  const cartTxt = $('m-cart-txt');
  if (cartTxt) cartTxt.textContent = cnt > 0 ? fmtR(tot) : 'Carrinho';

  // Freeship
  const fsBox = $('m-freeship-txt'), fbarWrap = $('m-fbar-wrap'), fbar = $('m-fbar');
  if (cnt === 0) {
    if (fsBox) { fsBox.textContent = 'Adicione itens para começar.'; fsBox.className = 'm-freeship-txt'; }
    if (fbarWrap) fbarWrap.style.display = 'none';
  } else if (free) {
    if (fsBox) { fsBox.innerHTML = '🎉 Você ganhou <strong>frete grátis!</strong>'; fsBox.className = 'm-freeship-txt ok'; }
    if (fbarWrap) fbarWrap.style.display = 'none';
  } else {
    if (fsBox) { fsBox.innerHTML = `Faltam <strong>${fmtR(rem)}</strong> para frete grátis`; fsBox.className = 'm-freeship-txt'; }
    if (fbarWrap) fbarWrap.style.display = 'block';
    if (fbar) fbar.style.width = Math.min(100, (tot / FREE_SHIP) * 100) + '%';
  }

  // Body
  if (!body) return;
  if (cart.length === 0) {
    body.innerHTML = `<div class="m-cart-empty">
      <div class="m-cart-empty-icon">${SVG.cart}</div>
      <p class="m-cart-empty-t">Carrinho vazio</p>
      <p class="m-cart-empty-s">Adicione uma pizza para começar.</p>
      <button class="m-cart-explore" onclick="mToggleCart()">🍕 Ver Cardápio</button>
    </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }
  body.innerHTML = `<ul class="m-cart-list">${cart.map(i => {
    const imgHtml = i.img ? `<div class="m-ci-img"><img src="${i.img}" alt="${i.name}"></div>` : `<div class="m-ci-noimg">🍕</div>`;
    return `<li class="m-ci">
      ${imgHtml}
      <div class="m-ci-info">
        <div class="m-ci-top"><p class="m-ci-name">${i.name}</p><p class="m-ci-total">${fmtR(i.price*i.qty)}</p></div>
        <div class="m-ci-bot">
          <div class="m-ci-stepper">
            <button class="m-ci-step" onclick="mDec('${i.id}')" aria-label="Remover">${SVG.minus}</button>
            <span class="m-ci-qty">${i.qty}</span>
            <button class="m-ci-step" onclick="mAddById('${i.id}','${i.name}',${i.price},'${i.img||''}')" aria-label="Adicionar">${SVG.plus}</button>
          </div>
          <span class="m-ci-unit">${fmtR(i.price)} un.</span>
        </div>
      </div>
    </li>`;
  }).join('')}</ul>`;

  if (footer) {
    footer.style.display = 'block';
    const sub = $('m-subtotal'); if (sub) sub.textContent = fmtR(tot);
    const df = $('m-delivery-fee');
    if (df) { df.textContent = free ? 'Grátis' : fmtR(fee); df.className = free ? 'm-fee-free' : ''; }
    const tt = $('m-total'); if (tt) tt.textContent = fmtR(tot + fee);
  }
}

function renderCombos() {
  const el = $('m-combos-grid'); if (!el) return;
  if (!combos.length) { el.innerHTML = ''; return; }
  el.innerHTML = combos.map(c => {
    const off = c.oldPrice ? Math.round(((c.oldPrice - c.price) / c.oldPrice) * 100) : 0;
    const imgHtml = (c.img||c.image)
      ? `<div class="m-combo-imgw"><img src="${c.img||c.image}" alt="${c.name}"><span class="m-combo-bdg">-${off}%</span></div>`
      : `<div class="m-combo-noimg">🍕</div>`;
    return `<article class="m-combo-card">
      ${imgHtml}
      <div class="m-combo-body">
        <h3 class="m-combo-name">${c.name}</h3>
        <p class="m-combo-desc">${c.desc||c.description||''}</p>
        <div class="m-combo-foot">
          <div>${c.oldPrice ? `<p class="m-combo-old">${fmtR(c.oldPrice)}</p>` : ''}<p class="m-combo-price">${fmtR(c.price)}</p></div>
          <button class="m-combo-add" onclick="mAdd('${c.id||c.productId||''}')">Adicionar</button>
        </div>
      </div>
    </article>`;
  }).join('');
}


/* ── Actions ── */
function mCartBounce() {
  const btn = $('m-cart-btn-hd'); if (!btn) return;
  btn.classList.remove('m-bounce');
  void btn.offsetWidth;
  btn.classList.add('m-bounce');
}

function boot(container, doc) {
  // ── Public window functions ──
  window.mToggleCart = () => {
    const d = $('m-drawer'), o = $('m-overlay'), body = document.body;
    const open = d.classList.toggle('on');
    o.classList.toggle('on', open);
    body.classList.toggle('m-no-scroll', open);
    if (open) renderCart();
  };

  window.mOpenIM = (pid) => {
    const p = products.find(x => x.id === pid); if (!p) return;
    const isMulti = Array.isArray(p.prices) && p.prices.length > 1;
    if (!isMulti) { mAdd(pid); return; }
    imCurrentPid = pid;
    imQty = 1;

    // Fill modal
    const img = p.img || p.image || '';
    const imImgEl = $('m-im-img'), imNoImg = $('m-im-noimg');
    if (img) { imImgEl.src = img; imImgEl.style.display = 'block'; imNoImg.style.display = 'none'; }
    else { imImgEl.style.display = 'none'; imNoImg.style.display = 'block'; }
    const imcat = $('m-imcat'); if (imcat) { const c = categories.find(c => c.id === (p.cat||p.category)); imcat.textContent = c?.name || ''; }
    const imname = $('m-imname'); if (imname) imname.textContent = p.name;
    const imdesc = $('m-imdesc'); if (imdesc) imdesc.textContent = p.desc || p.description || '';
    const imlbl = $('m-imlbl'); if (imlbl) imlbl.style.display = 'block';
    const qnum = $('m-im-qnum'); if (qnum) qnum.textContent = 1;

    // Size buttons
    const sizes = $('m-imsizes'); if (sizes) {
      const labels = (p.sizes && p.sizes.length) ? p.sizes : ['P', 'M', 'G'];
      sizes.innerHTML = p.prices.map((pr, i) =>
        `<button class="m-size-btn${i===0?' active':''}" data-price="${pr}" onclick="mSelectSize(this,${pr})">${labels[i]||`Tamanho ${i+1}`}<small>${fmtR(pr)}</small></button>`
      ).join('');
    }
    const tot = $('m-imtotal'); if (tot) tot.textContent = fmtR((p.prices[0]||0) * 1);
    $('m-imbg').classList.add('on');
    document.body.classList.add('m-no-scroll');
  };

  window.mCloseIM = (e) => {
    if (e.target === $('m-imbg')) {
      $('m-imbg').classList.remove('on');
      document.body.classList.remove('m-no-scroll');
    }
  };

  window.mSelectSize = (btn, price) => {
    document.querySelectorAll('.m-size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tot = $('m-imtotal'); if (tot) tot.textContent = fmtR(price * imQty);
  };

  window.mChangeImQty = (delta) => {
    imQty = Math.max(1, imQty + delta);
    const qnum = $('m-im-qnum'); if (qnum) qnum.textContent = imQty;
    const activeSize = document.querySelector('.m-size-btn.active');
    const price = activeSize ? parseFloat(activeSize.dataset.price) : 0;
    const tot = $('m-imtotal'); if (tot) tot.textContent = fmtR(price * imQty);
  };

  window.mAddFromIM = () => {
    const p = products.find(x => x.id === imCurrentPid); if (!p) return;
    const activeSize = document.querySelector('.m-size-btn.active');
    if (!activeSize) return;
    const price = parseFloat(activeSize.dataset.price);
    const sizeLabel = activeSize.textContent.replace(fmtR(price), '').trim();
    const name = `${p.name} (${sizeLabel})`;
    const existing = cart.find(i => i.id === `${p.id}_${sizeLabel}`);
    if (existing) { existing.qty += imQty; }
    else { cart.push({ id: `${p.id}_${sizeLabel}`, name, price, qty: imQty, img: p.img||p.image||'' }); }
    $('m-imbg').classList.remove('on');
    document.body.classList.remove('m-no-scroll');
    mCartBounce();
    renderProducts();
    renderCart();
    if (typeof window.showToastMsg === 'function') window.showToastMsg(`${name} adicionada! 🍕`);
  };

  window.mAdd = (pid) => {
    const p = products.find(x => x.id === pid); if (!p) return;
    const isMulti = Array.isArray(p.prices) && p.prices.length > 1;
    if (isMulti) { window.mOpenIM(pid); return; }
    const price = p.price || (p.prices?.[0]) || 0;
    const existing = cart.find(i => i.id === pid);
    if (existing) { existing.qty++; } else { cart.push({ id: pid, name: p.name, price, qty: 1, img: p.img||p.image||'' }); }
    mCartBounce();
    renderProducts();
    renderCart();
    if (typeof window.showToastMsg === 'function') window.showToastMsg(`${p.name} adicionada! 🍕`);
  };

  window.mAddById = (id, name, price, img) => {
    const existing = cart.find(i => i.id === id);
    if (existing) { existing.qty++; } else { cart.push({ id, name, price, qty: 1, img }); }
    mCartBounce();
    renderProducts();
    renderCart();
  };

  window.mDec = (pid) => {
    const idx = cart.findIndex(i => i.id === pid);
    if (idx === -1) return;
    cart[idx].qty--;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    renderProducts();
    renderCart();
  };

  window.mScrollToCat = (catId) => {
    if (catId) {
      const el = document.getElementById(`mcat-${catId}`);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); activeCat = catId; renderCatChips(); }
    } else {
      const catNav = document.querySelector('.m-cat-nav');
      if (catNav) catNav.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  window.mSetTab = (tab) => {
    document.querySelectorAll('.m-dock-btn').forEach(b => b.classList.remove('active'));
    if (tab === 'menu') { $('m-dk-menu')?.classList.add('active'); mScrollToCat(null); }
    else if (tab === 'combos') { $('m-dk-combos')?.classList.add('active'); document.getElementById('m-combos')?.scrollIntoView({behavior:'smooth'}); }
    else if (tab === 'search') { $('m-dk-search')?.classList.add('active'); $('m-search')?.focus(); $('m-search')?.scrollIntoView({behavior:'smooth'}); }
    else if (tab === 'cart') { $('m-dk-cart')?.classList.add('active'); window.mToggleCart(); }
  };

  window.mOnSearch = (val) => {
    searchQ = val;
    renderProducts();
  };

  window.mCheckout = () => {
    if (cart.length === 0) return;
    const name = ($('m-client-name')?.value || '').trim();
    const lines = cart.map(i => `• ${i.qty}x ${i.name} — ${fmtR(i.price * i.qty)}`).join('\n');
    const fee = deliveryFee();
    const tot = cartTotal() + fee;
    const msg = `Olá ${store.name || ''}!\n\n*Pedido${name ? ` de ${name}` : ''}:*\n${lines}\n\nSubtotal: ${fmtR(cartTotal())}\nEntrega: ${isFree() ? 'Grátis' : fmtR(fee)}\n*Total: ${fmtR(tot)}*`;
    const phone = (store.phone || store.whatsapp || '').replace(/\D/g, '');
    if (!phone) { alert('WhatsApp não configurado.'); return; }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Scroll spy
  window.addEventListener('scroll', () => {
    if (searchQ) return;
    const sections = document.querySelectorAll('.m-cat-section[data-cat]');
    const navH = 140;
    sections.forEach(sec => {
      const r = sec.getBoundingClientRect();
      if (r.top <= navH && r.bottom >= navH) {
        const id = sec.dataset.cat;
        if (id !== activeCat) { activeCat = id; renderCatChips(); }
      }
    });
  }, { passive: true });
}

/* ── Public API ── */
export async function init(container, doc) {
  loadDoc(doc);
  container.innerHTML = buildHTML();
  boot(container, doc);
  renderCatChips();
  renderProducts();
  renderCombos();
}

export function update(doc) {
  loadDoc(doc);
  renderCatChips();
  renderProducts();
  renderCombos();
  renderCart();
}
