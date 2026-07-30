import './marssico.css';

/* -- State -- */
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

let cfg = {};

function loadDoc(doc) {
  store = doc;
  categories = doc.categories || [];
  products = doc.products || [];
  combos = doc.combos || [];
  cfg = Object.assign({
    ratingValue:    doc.rating        || '4.8',
    ratingSource:   doc.ratingSource  || 'Google',
    ratingCount:    doc.ratingCount   || '312',
    deliveryTime:   doc.deliveryTime  || '35\u201345 min',
    freeShipFrom:   doc.freeShipFrom  || 'R$\u00a090',
    guarantee:      doc.guarantee     || 'Chegou frio? Refazemos ou devolvemos o valor.',
    reviews:        doc.reviews       || [],
  }, doc.templateConfig || {});
}

/* -- Helpers -- */
function $(id) { return document.getElementById(id); }
function cartTotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
function cartCount() { return cart.reduce((s, i) => s + i.qty, 0); }
function remaining() { return Math.max(0, FREE_SHIP - cartTotal()); }
function isFree() { return cartTotal() >= FREE_SHIP && cartTotal() > 0; }
function deliveryFee() { return isFree() ? 0 : 8; }
function initials(name) {
  return (name || 'C').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}
function renderStars(n) {
  return Array.from({ length: 5 }).map((_, i) =>
    `<span class="m-star-sm${i < n ? '' : ' m-star-empty'}">${SVG.star}</span>`
  ).join('');
}

/* -- SVG Icons -- */
const SVG = {
  cart:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l2.4 12.6a2 2 0 0 0 2 1.6h9.2a2 2 0 0 0 2-1.6L23 6H6"/><circle cx="9" cy="21" r="1.5"/><circle cx="18" cy="21" r="1.5"/></svg>',
  plus:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  arrow:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
  search:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  menu:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  tag:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>',
  star:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.2 6.8.6-5.1 4.6 1.5 6.6L12 17l-6.1 3.5 1.5-6.6L2.3 9.3l6.8-.6L12 2.5z"/></svg>',
  flame:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s4 4.5 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 9 8 11 8 13a5 5 0 0 0 10 0c0-4-3-7-6-11z"/></svg>',
  phone:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  truck:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  shield:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  whatsapp:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>',
  close:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
};

const DEFAULT_REVIEWS = [
  { name: 'Marina R.', neighborhood: 'Pinheiros', rating: 5, date: 'h\u00e1 3 dias', text: 'A massa faz toda a diferen\u00e7a. Chegou quente e perfeita!', item: 'Pizza Especial' },
  { name: 'Rodrigo P.', neighborhood: 'Vila Madalena', rating: 5, date: 'h\u00e1 1 semana', text: 'Pedi num s\u00e1bado lotado e chegou antes do previsto. Recomendo demais!', item: 'Pizza da Casa' },
  { name: 'Camila S.', neighborhood: 'Perdizes', rating: 4, date: 'h\u00e1 2 semanas', text: 'Embalagem impec\u00e1vel. Com certeza voltarei mais vezes.', item: 'Pizza Premium' },
  { name: 'Eduardo L.', neighborhood: 'Sumar\u00e9', rating: 5, date: 'h\u00e1 3 semanas', text: 'Qualidade premium a um pre\u00e7o justo. Todo mundo amou!', item: 'Combo Fam\u00edlia' },
];
function getReviews() {
  return (cfg.reviews && cfg.reviews.length > 0) ? cfg.reviews : DEFAULT_REVIEWS;
}

/* -- HTML Shell -- */
function buildHTML() {
  const s = store;
  const minPrice = (() => {
    if (!products.length) return 0;
    const mins = products.map(p => Array.isArray(p.prices) && p.prices.length ? Math.min(...p.prices) : (p.price || 0));
    return Math.min(...mins.filter(v => v > 0));
  })();
  const heroImg = products[0]?.img || products[0]?.image || '';
  const logoHtml = s.logo
    ? `<img src="${s.logo}" alt="${s.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
    : `<span class="m-av-letter">${(s.name || 'P')[0].toUpperCase()}</span>`;

  return `
<div class="m-root" id="m-root">

  <!-- HEADER -->
  <header class="m-header">
    <div class="m-header-inner">
      <a href="#m-top" class="m-brand">
        <div class="m-brand-av">${logoHtml}<span class="m-brand-dot"></span></div>
        <div class="m-brand-info">
          <span class="m-brand-name">${s.name || 'Pizzaria'}</span>
          <div class="m-brand-status">
            <span class="m-live-wrap"><span class="m-live-ping"></span><span class="m-live-dot"></span></span>
            <span>Aberto &middot; ${s.hours || '18h\u201323h'}</span>
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
      <div class="m-hero-glow-gold"></div>
      <div class="m-hero-glow-red"></div>
      <div class="m-hero-inner">
        <div class="m-hero-img-col">
          <div class="m-hero-img-wrap">
            ${heroImg
              ? `<img src="${heroImg}" alt="Pizza" fetchpriority="high" class="m-hero-img">`
              : `<div class="m-hero-img-placeholder">\uD83C\uDF55</div>`}
            <div class="m-hero-img-fade"></div>
          </div>
        </div>
        <div class="m-hero-copy">
          <p class="m-hero-eyebrow">${s.name || 'Pizzaria'} &middot; ${s.tagline || 'Pizza Artesanal'}</p>
          <h1 class="m-hero-h1">A pizza que vira <em class="m-hero-em">momento</em>.</h1>
          <p class="m-hero-sub">Massa de fermenta\u00e7\u00e3o lenta, ingredientes selecionados &mdash; assadas no forno a lenha.</p>
          <div class="m-hero-rating">
            <span class="m-stars-row" aria-label="${cfg.ratingValue} de 5 estrelas">${renderStars(Math.round(parseFloat(cfg.ratingValue) || 5))}</span>
            <span class="m-rating-num">${cfg.ratingValue}</span>
            <span class="m-rating-src">no ${cfg.ratingSource} &middot; ${cfg.ratingCount} avalia\u00e7\u00f5es</span>
          </div>
          <div class="m-hero-ctas">
            <button class="m-cta-primary" onclick="mScrollToCat(null)">${SVG.arrow} Ver card\u00e1pio</button>
            <a href="#m-combos" class="m-cta-secondary">${SVG.tag} Combos <span class="m-cta-off">at\u00e9 &minus;25%</span></a>
          </div>
          ${minPrice > 0 ? `<p class="m-hero-data">A partir de <strong>${fmtR(minPrice)}</strong> &middot; entrega ${cfg.deliveryTime} &middot; frete gr\u00e1tis acima de ${cfg.freeShipFrom}</p>` : ''}
        </div>
      </div>
    </div>
    <div class="m-stats-strip">
      <div class="m-stat"><span class="m-stat-val">${SVG.star} ${cfg.ratingValue}</span><span class="m-stat-lbl">${cfg.ratingCount} avalia\u00e7\u00f5es</span></div>
      <div class="m-stat"><span class="m-stat-val">${SVG.truck} ${cfg.deliveryTime}</span><span class="m-stat-lbl">m\u00e9dia hoje</span></div>
      <div class="m-stat"><span class="m-stat-val">${SVG.tag} Frete gr\u00e1tis</span><span class="m-stat-lbl">acima de ${cfg.freeShipFrom}</span></div>
    </div>
  </section>

  <!-- COMBOS -->
  <section class="m-combos-sec" id="m-combos">
    <div><p class="m-sec-eyebrow">S\u00f3 hoje</p><h2 class="m-sec-title">Combos que valem a pena</h2></div>
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

  <!-- SOCIAL PROOF -->
  <section class="m-social" id="m-avaliacoes" aria-labelledby="m-social-title">
    <div class="m-social-inner">
      <div class="m-social-header">
        <p class="m-sec-eyebrow">Quem j\u00e1 pediu</p>
        <h2 class="m-sec-title" id="m-social-title">${cfg.ratingValue} de 5 no ${cfg.ratingSource}</h2>
        <p class="m-social-sub">${cfg.ratingCount} avalia\u00e7\u00f5es verificadas de clientes reais da regi\u00e3o.</p>
      </div>
      <div class="m-social-main" id="m-social-main"></div>
      <div class="m-social-cards" id="m-social-cards"></div>
      <div class="m-guarantee">
        <span class="m-guarantee-icon">${SVG.shield}</span>
        <p class="m-guarantee-txt"><strong>Garantia ${s.name || 'da Casa'}.</strong> ${cfg.guarantee}</p>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="m-footer">
    <div class="m-footer-grid">
      <div><p class="m-footer-label">Endere\u00e7o</p><p class="m-footer-val">${s.address || ''}</p></div>
      <div><p class="m-footer-label">Funcionamento</p><p class="m-footer-val">${s.hours || ''}</p></div>
      <div><p class="m-footer-label">Contato</p><p class="m-footer-val">${s.phone || ''}</p></div>
    </div>
    <p class="m-footer-copy">${s.name || 'Pizzaria'}</p>
  </footer>

  <!-- DOCK -->
  <nav class="m-dock" aria-label="Navega\u00e7\u00e3o inferior">
    <button class="m-dock-btn active" id="m-dk-menu" onclick="mSetTab('menu')">${SVG.menu}<span>Card\u00e1pio</span></button>
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

  <div class="m-overlay" id="m-overlay" onclick="mToggleCart()"></div>

  <!-- CART DRAWER -->
  <aside class="m-drawer" id="m-drawer" role="dialog" aria-modal="true" aria-label="Carrinho">
    <div class="m-drawer-handle"></div>
    <header class="m-drawer-head">
      <div><p class="m-drawer-sub">Seu pedido</p><p class="m-drawer-title" id="m-drw-title">0 itens</p></div>
      <button class="m-drawer-close" onclick="mToggleCart()" aria-label="Fechar">${SVG.close}</button>
    </header>
    <div class="m-freeship" id="m-freeship-box">
      <p class="m-freeship-txt" id="m-freeship-txt">Adicione itens para come\u00e7ar.</p>
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
      <p class="m-drawer-caption">Entrega ${cfg.deliveryTime || '35\u201345min'} &middot; Pix, cart\u00e3o ou dinheiro</p>
    </footer>
  </aside>

  <!-- ITEM MODAL -->
  <div class="m-imbg" id="m-imbg" onclick="mCloseIM(event)">
    <div class="m-imbox">
      <div class="m-imimg"><img id="m-im-img" src="" alt="" style="display:none"><div class="m-imnoimg" id="m-im-noimg">\uD83C\uDF55</div><button class="m-imclose" onclick="document.getElementById('m-imbg').classList.remove('on')" aria-label="Fechar">${SVG.close}</button></div>
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

/* -- Render Social Proof -- */
function renderSocialProof() {
  const reviews = getReviews();
  if (!reviews.length) return;
  const [featured, ...rest] = reviews;
  const dist = [5, 4, 3, 2, 1].map(s => ({
    star: s,
    pct: Math.round((reviews.filter(r => r.rating === s).length / reviews.length) * 100),
  }));
  const mainEl = $('m-social-main');
  if (mainEl) {
    mainEl.innerHTML = `
      <div class="m-dist-card">
        <div class="m-dist-top">
          <span class="m-dist-num">${cfg.ratingValue}</span>
          <div class="m-dist-meta">
            <span class="m-stars-row">${renderStars(Math.round(parseFloat(cfg.ratingValue) || 5))}</span>
            <span class="m-dist-src">${cfg.ratingSource} &middot; ${cfg.ratingCount} avalia\u00e7\u00f5es</span>
          </div>
        </div>
        <ul class="m-dist-bars">
          ${dist.map(d => `
          <li class="m-dist-row">
            <span class="m-dist-lbl">${d.star}</span>
            <span class="m-star-sm">${SVG.star}</span>
            <span class="m-dist-track"><span class="m-dist-fill" style="width:${d.pct}%"></span></span>
            <span class="m-dist-pct">${d.pct}%</span>
          </li>`).join('')}
        </ul>
      </div>
      <figure class="m-featured-review">
        <span class="m-review-quotemark" aria-hidden="true">&rdquo;</span>
        <div class="m-featured-stars">${renderStars(featured.rating)}</div>
        <blockquote class="m-featured-quote">&ldquo;${featured.text}&rdquo;</blockquote>
        <figcaption class="m-featured-caption">
          <span class="m-review-av">${initials(featured.name)}</span>
          <span class="m-review-info">
            <span class="m-review-name">${featured.name}</span>
            <span class="m-review-meta">${featured.neighborhood} &middot; ${featured.date} &middot; pediu ${featured.item}</span>
          </span>
        </figcaption>
      </figure>`;
  }
  const cardsEl = $('m-social-cards');
  if (cardsEl && rest.length) {
    cardsEl.innerHTML = rest.map(r => `
      <figure class="m-review-card">
        <div class="m-stars-row">${renderStars(r.rating)}</div>
        <blockquote class="m-review-text">&ldquo;${r.text}&rdquo;</blockquote>
        <figcaption class="m-review-cap">
          <span class="m-review-av m-review-av-sm">${initials(r.name)}</span>
          <span class="m-review-info">
            <span class="m-review-name">${r.name}</span>
            <span class="m-review-meta">${r.neighborhood} &middot; ${r.date} &middot; ${r.item}</span>
          </span>
        </figcaption>
      </figure>`).join('');
  }
}

/* -- Render Functions -- */
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
      const qInCart = cart.find(i => i.id === p.id)?.qty || 0;
      const imgHtml = (p.img||p.image)
        ? `<img src="${p.img||p.image}" alt="${p.name}" loading="lazy" decoding="async">`
        : `<div class="m-pcard-noimg">\uD83C\uDF55</div>`;
      const badgeHtml = p.badge ? `<span class="m-pcard-badge">${p.badge}</span>` : (p.featured ? `<span class="m-pcard-badge">&#9733; Popular</span>` : '');
      const priceHtml = isMulti ? `<span class="m-pcard-from">a partir de</span>${fmtR(price)}` : fmtR(price);
      let actionHtml;
      if (isMulti) {
        actionHtml = `<button class="m-add-btn" onclick="mOpenIM('${p.id}')">${SVG.plus} Adicionar</button>`;
      } else if (qInCart === 0) {
        actionHtml = `<button class="m-add-btn" onclick="mAdd('${p.id}')">${SVG.plus} Adicionar</button>`;
      } else {
        actionHtml = `<div class="m-stepper">
          <button class="m-step-btn" onclick="mDec('${p.id}')" aria-label="Remover">${SVG.minus}</button>
          <span class="m-step-qty">${qInCart}</span>
          <button class="m-step-btn" onclick="mAdd('${p.id}')" aria-label="Adicionar">${SVG.plus}</button>
        </div>`;
      }
      return `<article class="m-pcard">
        <div class="m-pcard-imgw">${imgHtml}${badgeHtml}</div>
        <div class="m-pcard-body">
          <div><h3 class="m-pcard-name">${p.name}</h3><p class="m-pcard-desc">${p.desc||p.description||''}</p></div>
          <div class="m-pcard-foot"><p class="m-pcard-price">${priceHtml}</p>${actionHtml}</div>
        </div>
      </article>`;
    }).join('');
    return `<section class="m-cat-section" id="mcat-${c.id}" data-cat="${c.id}">
      <div class="m-cat-head"><h2 class="m-cat-title">${c.emoji||''} ${c.name}</h2><span class="m-cat-count">${c.items.length} op\u00e7\u00f5es</span></div>
      <div class="m-products-grid">${itemsHtml}</div>
    </section>`;
  }).join('');
}

function renderCart() {
  const body = $('m-drawer-body');
  const footer = $('m-drawer-footer');
  const cnt = cartCount(), tot = cartTotal(), free = isFree(), fee = deliveryFee(), rem = remaining();

  const t = $('m-drw-title'); if (t) t.textContent = `${cnt} ${cnt===1?'item':'itens'}`;
  const fb = $('m-float-bar');
  if (fb) { cnt > 0 ? fb.classList.add('on') : fb.classList.remove('on'); }
  const fcount = $('m-float-count'); if (fcount) fcount.textContent = cnt;
  const fship = $('m-float-ship');
  if (fship) fship.textContent = free ? 'Frete gr\u00e1tis \u2713' : `Faltam ${fmtR(rem)} p/ frete gr\u00e1tis`;
  const ftot = $('m-float-total'); if (ftot) ftot.textContent = fmtR(tot + fee);
  const badge = $('m-cart-badge-hd');
  if (badge) { badge.textContent = cnt; cnt > 0 ? badge.classList.add('on') : badge.classList.remove('on'); }
  const dockBdg = $('m-dock-bdg');
  if (dockBdg) { dockBdg.textContent = cnt; cnt > 0 ? dockBdg.classList.add('on') : dockBdg.classList.remove('on'); }
  const cartTxt = $('m-cart-txt');
  if (cartTxt) cartTxt.textContent = cnt > 0 ? fmtR(tot) : 'Carrinho';

  const fsBox = $('m-freeship-txt'), fbarWrap = $('m-fbar-wrap'), fbar = $('m-fbar');
  if (cnt === 0) {
    if (fsBox) { fsBox.textContent = 'Adicione itens para come\u00e7ar.'; fsBox.className = 'm-freeship-txt'; }
    if (fbarWrap) fbarWrap.style.display = 'none';
  } else if (free) {
    if (fsBox) { fsBox.innerHTML = '\uD83C\uDF89 Voc\u00ea ganhou <strong>frete gr\u00e1tis!</strong>'; fsBox.className = 'm-freeship-txt ok'; }
    if (fbarWrap) fbarWrap.style.display = 'none';
  } else {
    if (fsBox) { fsBox.innerHTML = `Faltam <strong>${fmtR(rem)}</strong> para frete gr\u00e1tis`; fsBox.className = 'm-freeship-txt'; }
    if (fbarWrap) fbarWrap.style.display = 'block';
    if (fbar) fbar.style.width = Math.min(100, (tot / FREE_SHIP) * 100) + '%';
  }

  if (!body) return;
  if (cart.length === 0) {
    body.innerHTML = `<div class="m-cart-empty">
      <div class="m-cart-empty-icon">${SVG.cart}</div>
      <p class="m-cart-empty-t">Carrinho vazio</p>
      <p class="m-cart-empty-s">Adicione uma pizza para come\u00e7ar.</p>
      <button class="m-cart-explore" onclick="mToggleCart()">\uD83C\uDF55 Ver Card\u00e1pio</button>
    </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }
  body.innerHTML = `<ul class="m-cart-list">${cart.map(i => {
    const imgHtml = i.img ? `<div class="m-ci-img"><img src="${i.img}" alt="${i.name}"></div>` : `<div class="m-ci-noimg">\uD83C\uDF55</div>`;
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
    if (df) { df.textContent = free ? 'Gr\u00e1tis' : fmtR(fee); df.className = free ? 'm-fee-free' : ''; }
    const tt = $('m-total'); if (tt) tt.textContent = fmtR(tot + fee);
  }
}

function renderCombos() {
  const el = $('m-combos-grid'); if (!el) return;
  if (!combos.length) { el.innerHTML = ''; return; }
  el.innerHTML = combos.map(c => {
    const off = c.oldPrice ? Math.round(((c.oldPrice - c.price) / c.oldPrice) * 100) : 0;
    const imgHtml = (c.img||c.image)
      ? `<div class="m-combo-imgw"><img src="${c.img||c.image}" alt="${c.name}" loading="lazy" decoding="async"><span class="m-combo-bdg">-${off}%</span></div>`
      : `<div class="m-combo-noimg">\uD83C\uDF55</div>`;
    return `<article class="m-combo-card">
      ${imgHtml}
      <div class="m-combo-body">
        <h3 class="m-combo-name">${c.name}</h3>
        <p class="m-combo-desc">${c.desc||c.description||''}</p>
        <div class="m-combo-foot">
          <div>${c.oldPrice ? `<p class="m-combo-old">${fmtR(c.oldPrice)}</p>` : ''}<p class="m-combo-price">${fmtR(c.price)}</p></div>
          <button class="m-combo-add" data-id="${c.id}" data-name="${(c.name||'').replace(/"/g,'&quot;')}" data-price="${c.price}" data-img="${c.img||c.image||''}" onclick="mAddCombo(this.dataset.id,this.dataset.name,this.dataset.price,this.dataset.img)">Adicionar</button>
        </div>
      </div>
    </article>`;
  }).join('');
}

function mCartBounce() {
  const btn = $('m-cart-btn-hd'); if (!btn) return;
  btn.classList.remove('m-bounce'); void btn.offsetWidth; btn.classList.add('m-bounce');
}

function boot(container, doc) {
  window.mToggleCart = () => {
    const d = $('m-drawer'), o = $('m-overlay'), body = document.body;
    const open = d.classList.toggle('on');
    o.classList.toggle('on', open); body.classList.toggle('m-no-scroll', open);
    if (open) renderCart();
  };
  window.mOpenIM = (pid) => {
    const p = products.find(x => x.id === pid); if (!p) return;
    const isMulti = Array.isArray(p.prices) && p.prices.length > 1;
    if (!isMulti) { mAdd(pid); return; }
    imCurrentPid = pid; imQty = 1;
    const img = p.img || p.image || '';
    const imImgEl = $('m-im-img'), imNoImg = $('m-im-noimg');
    if (img) { imImgEl.src = img; imImgEl.style.display = 'block'; imNoImg.style.display = 'none'; }
    else { imImgEl.style.display = 'none'; imNoImg.style.display = 'block'; }
    const imcat = $('m-imcat'); if (imcat) { const cat = categories.find(c => c.id === (p.cat||p.category)); imcat.textContent = cat?.name || ''; }
    const imname = $('m-imname'); if (imname) imname.textContent = p.name;
    const imdesc = $('m-imdesc'); if (imdesc) imdesc.textContent = p.desc || p.description || '';
    const imlbl = $('m-imlbl'); if (imlbl) imlbl.style.display = 'block';
    const qnum = $('m-im-qnum'); if (qnum) qnum.textContent = 1;
    const sizes = $('m-imsizes'); if (sizes) {
      const labels = (p.sizes && p.sizes.length) ? p.sizes : ['P', 'M', 'G'];
      sizes.innerHTML = p.prices.map((pr, i) =>
        `<button class="m-size-btn${i===0?' active':''}" data-price="${pr}" onclick="mSelectSize(this,${pr})">${labels[i]||'Tam. '+(i+1)}<small>${fmtR(pr)}</small></button>`
      ).join('');
    }
    const tot = $('m-imtotal'); if (tot) tot.textContent = fmtR((p.prices[0]||0));
    $('m-imbg').classList.add('on'); document.body.classList.add('m-no-scroll');
  };
  window.mCloseIM = (e) => {
    if (e.target === $('m-imbg')) { $('m-imbg').classList.remove('on'); document.body.classList.remove('m-no-scroll'); }
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
    const activeSize = document.querySelector('.m-size-btn.active'); if (!activeSize) return;
    const price = parseFloat(activeSize.dataset.price);
    const sizeLabel = activeSize.textContent.replace(fmtR(price), '').trim();
    const name = `${p.name} (${sizeLabel})`;
    const existing = cart.find(i => i.id === `${p.id}_${sizeLabel}`);
    if (existing) { existing.qty += imQty; } else { cart.push({ id: `${p.id}_${sizeLabel}`, name, price, qty: imQty, img: p.img||p.image||'' }); }
    $('m-imbg').classList.remove('on'); document.body.classList.remove('m-no-scroll');
    mCartBounce(); renderProducts(); renderCart();
    if (typeof window.showToastMsg === 'function') window.showToastMsg(`${name} adicionada!`);
  };
  window.mAdd = (pid) => {
    const p = products.find(x => x.id === pid); if (!p) return;
    if (Array.isArray(p.prices) && p.prices.length > 1) { window.mOpenIM(pid); return; }
    const price = p.price || (p.prices?.[0]) || 0;
    const existing = cart.find(i => i.id === pid);
    if (existing) { existing.qty++; } else { cart.push({ id: pid, name: p.name, price, qty: 1, img: p.img||p.image||'' }); }
    mCartBounce(); renderProducts(); renderCart();
    if (typeof window.showToastMsg === 'function') window.showToastMsg(`${p.name} adicionada!`);
  };
  window.mAddCombo = (id, name, price, img) => {
    const existing = cart.find(i => i.id === `combo_${id}`);
    if (existing) { existing.qty++; } else { cart.push({ id: `combo_${id}`, name, price: Number(price), qty: 1, img }); }
    mCartBounce(); renderCart();
    if (typeof window.showToastMsg === 'function') window.showToastMsg(`${name} adicionado!`);
  };
  window.mAddById = (id, name, price, img) => {
    const existing = cart.find(i => i.id === id);
    if (existing) { existing.qty++; } else { cart.push({ id, name, price, qty: 1, img }); }
    mCartBounce(); renderProducts(); renderCart();
  };
  window.mDec = (pid) => {
    const idx = cart.findIndex(i => i.id === pid); if (idx === -1) return;
    cart[idx].qty--;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    renderProducts(); renderCart();
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
  window.mOnSearch = (val) => { searchQ = val; renderProducts(); };
  window.mCheckout = () => {
    if (cart.length === 0) return;
    const name = ($('m-client-name')?.value || '').trim();
    const lines = cart.map(i => `\u2022 ${i.qty}x ${i.name} \u2014 ${fmtR(i.price * i.qty)}`).join('\n');
    const fee = deliveryFee(); const tot = cartTotal() + fee;
    const msg = `Ol\u00e1 ${store.name || ''}!\n\n*Pedido${name ? ` de ${name}` : ''}:*\n${lines}\n\nSubtotal: ${fmtR(cartTotal())}\nEntrega: ${isFree() ? 'Gr\u00e1tis' : fmtR(fee)}\n*Total: ${fmtR(tot)}*`;
    const phone = (store.phone || store.whatsapp || '').replace(/\D/g, '');
    if (!phone) { alert('WhatsApp n\u00e3o configurado.'); return; }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };
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

export async function init(container, doc) {
  loadDoc(doc);
  container.innerHTML = buildHTML();
  boot(container, doc);
  renderCatChips();
  renderProducts();
  renderCombos();
  renderSocialProof();
}

export function update(doc) {
  loadDoc(doc);
  renderCatChips();
  renderProducts();
  renderCombos();
  renderCart();
  renderSocialProof();
}
