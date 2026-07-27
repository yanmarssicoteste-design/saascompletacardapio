// poster.js — copiado integralmente da v4
import { lighten, hex2rgba } from './format.js';

const SIZES = {
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
};

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('900 60px "Playfair Display"'),
      document.fonts.load('italic 700 60px "Playfair Display"'),
      document.fonts.load('700 30px "Inter"'),
      document.fonts.load('400 30px "Inter"'),
    ]);
  } catch (_) {}
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const r = w / h;
  let sx, sy, sw, sh;
  if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderPoster(canvas, opts) {
  const { format, template, item, store } = opts;
  const { w, h } = SIZES[format] || SIZES.square;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  await ensureFonts();
  const img = await loadImage(item.img);
  const color = store.color || '#c0392b';
  const colorLight = lighten(color, 25);
  ctx.clearRect(0, 0, w, h);
  if (template === 'promo') {
    await renderPromo(ctx, { w, h, img, item, store, color, colorLight, promoTag: opts.promoTag });
  } else {
    await renderDestaque(ctx, { w, h, img, item, store, color, colorLight });
  }
}

function priceTag(ctx, { x, y, price, color }) {
  const text = 'R$ ' + Number(price).toFixed(2).replace('.', ',');
  ctx.font = '900 54px "Playfair Display"';
  const tw = ctx.measureText(text).width;
  const padX = 34;
  const boxW = tw + padX * 2;
  const bx = x - boxW;
  roundRect(ctx, bx, y, boxW, 76, 12);
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + padX, y + 38);
  return { bx, boxW, boxH: 76 };
}

async function renderDestaque(ctx, { w, h, img, item, store, color, colorLight }) {
  const photoH = Math.round(h * (h > w ? 0.56 : 0.64));
  if (img) drawCover(ctx, img, 0, 0, w, photoH);
  else {
    const g = ctx.createLinearGradient(0, 0, w, photoH);
    g.addColorStop(0, colorLight); g.addColorStop(1, color);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, photoH);
    ctx.font = `${Math.round(w * 0.28)}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🍕', w / 2, photoH / 2);
  }
  const fade = ctx.createLinearGradient(0, photoH - 220, 0, photoH);
  fade.addColorStop(0, 'rgba(7,5,10,0)'); fade.addColorStop(1, 'rgba(7,5,10,1)');
  ctx.fillStyle = fade; ctx.fillRect(0, photoH - 220, w, 220);
  ctx.fillStyle = '#07050A'; ctx.fillRect(0, photoH, w, h - photoH);
  const padX = w * 0.06;
  let cy = photoH + 70;
  ctx.font = '700 28px "Inter"';
  ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('★ DO NOSSO CARDÁPIO', padX, cy); cy += 66;
  ctx.font = '900 64px "Playfair Display"';
  ctx.fillStyle = '#f2e8d8';
  const nameLines = wrapText(ctx, item.name, w - padX * 2 - 260);
  nameLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, padX, cy + i * 72));
  cy += nameLines.slice(0, 2).length * 72 + 10;
  if (item.desc) {
    ctx.font = '400 30px "Inter"'; ctx.fillStyle = '#a8998f';
    const descLines = wrapText(ctx, item.desc, w - padX * 2 - 260);
    descLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, padX, cy + i * 40));
  }
  priceTag(ctx, { x: w - padX, y: photoH + 66, price: item.price, color });
  const ctaH = Math.round(h * 0.09);
  ctx.fillStyle = color; ctx.fillRect(0, h - ctaH, w, ctaH);
  ctx.font = '700 34px "Inter"'; ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('📲 PEÇA PELO WHATSAPP — LINK NA BIO', w / 2, h - ctaH / 2);
}

async function renderPromo(ctx, { w, h, img, item, store, color, colorLight, promoTag }) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#07050A'); bg.addColorStop(0.45, color); bg.addColorStop(1, '#07050A');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const padX = w * 0.08;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '900 46px "Inter"'; ctx.fillStyle = '#fff';
  ctx.fillText((promoTag || 'PROMOÇÃO ESPECIAL').toUpperCase(), w / 2, h * 0.1);
  const boxSize = Math.min(w, h) * 0.62;
  const bx = (w - boxSize) / 2;
  const by = h * 0.16;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
  roundRect(ctx, bx, by, boxSize, boxSize, 28);
  ctx.fillStyle = '#171320'; ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, bx, by, boxSize, boxSize, 28);
  ctx.clip();
  if (img) drawCover(ctx, img, bx, by, boxSize, boxSize);
  else { ctx.fillStyle = colorLight; ctx.fillRect(bx, by, boxSize, boxSize); ctx.font = `${Math.round(boxSize * 0.4)}px serif`; ctx.fillStyle = '#fff'; ctx.fillText('🍕', bx + boxSize / 2, by + boxSize / 2); }
  ctx.restore();
  let cy = by + boxSize + 110;
  ctx.font = '900 58px "Playfair Display"'; ctx.fillStyle = '#f2e8d8';
  const nameLines = wrapText(ctx, item.name, w - padX * 2);
  nameLines.slice(0, 2).forEach((line, i) => { ctx.fillText(line, w / 2, cy + i * 66); });
  cy += nameLines.slice(0, 2).length * 66 + 30;
  if (item.origPrice) {
    ctx.font = '400 34px "Inter"'; ctx.fillStyle = 'rgba(255,255,255,.6)';
    const oldText = 'de R$ ' + Number(item.origPrice).toFixed(2).replace('.', ',');
    ctx.fillText(oldText, w / 2, cy);
    const tw = ctx.measureText(oldText).width;
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w / 2 - tw / 2, cy); ctx.lineTo(w / 2 + tw / 2, cy); ctx.stroke();
    cy += 60;
  }
  ctx.font = '900 88px "Playfair Display"'; ctx.fillStyle = '#fff';
  ctx.fillText('R$ ' + Number(item.price).toFixed(2).replace('.', ','), w / 2, cy + 20);
  cy += 130;
  if (item.saving) {
    ctx.font = '700 30px "Inter"'; ctx.fillStyle = '#f2e8d8';
    ctx.fillText('✨ ' + item.saving, w / 2, cy);
  }
  ctx.font = '700 32px "Inter"'; ctx.fillStyle = '#fff';
  ctx.fillText('🍕 ' + (store.name || 'Sua Pizzaria') + ' · Peça no WhatsApp', w / 2, h - 60);
}
