export function brl(n) {
  return 'R$ ' + Number(n || 0).toFixed(2).replace('.', ',');
}
export function onlyDigits(s) {
  return (s || '').replace(/\D/g, '');
}
export function hex2rgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
export function lighten(hex, p) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return '#' + [Math.min(255, r + p), Math.min(255, g + p), Math.min(255, b + p)]
    .map((x) => x.toString(16).padStart(2, '0')).join('');
}
export function slugify(text) {
  return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
export function uid(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
