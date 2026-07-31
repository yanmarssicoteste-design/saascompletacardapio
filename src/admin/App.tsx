import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Pizza, Tag, Sparkles, Star, Palette, ImageDown,
  Search, Plus, ArrowUpRight, Bell, Eye, MoreHorizontal,
  Grid3x3, List, Check, ChevronRight, CircleDot, Flame, Download,
  Filter, X, Upload, Loader2, Menu, Trash2, ToggleLeft, ToggleRight,
  ChevronDown,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';
import { saveStoreData, subscribeStoreByUid } from '../lib/store-repo.js';

// ─────────────────────────────────────────────
// Types — exatamente como salvo no Firestore (Vanilla JS schema)
// ─────────────────────────────────────────────
type TabId = 'dashboard' | 'produtos' | 'categorias' | 'combos' | 'reviews' | 'aparencia' | 'poster';

interface StoreData {
  name?: string;
  tagline?: string;
  phone?: string;
  addr?: string;
  hours?: string;
  closeTime?: string;
  fee?: number;
  minOrder?: number;
  minFreeShip?: number;
  deliveryTime?: string;
  rating?: string;
  promoTxt?: string;
  promoTag?: string;
  color?: string;
  template?: string;
  slug?: string;
  logo?: string;
  products?: Product[];
  categories?: Category[];
  combos?: Combo[];
  reviews?: Review[];
  features?: Record<string, boolean>;
  [key: string]: unknown;
}

interface Product {
  id: string;
  name: string;
  cat: string;         // campo correto do Firestore
  desc: string;        // campo correto do Firestore
  prices: number[];    // array de números simples [45, 55, 65]
  img?: string;        // campo correto do Firestore
  active?: boolean;
}

interface Category {
  id: string;
  name: string;
  emoji?: string;
  type?: string;   // 'sizes' | 'single'
  display?: string;
}

interface Combo {
  id: string;
  name: string;
  items: string;
  price: number;
  origPrice?: number;
  saving?: string;
  img?: string;
  active?: boolean;
}

interface Review {
  id: string;
  name: string;
  stars: number;
  text: string;
  product?: string;
  date?: string;
  avatar?: string;
}

interface AppProps {
  uid: string;
  initialStore: StoreData;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function genId(prefix: string): string {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

function compressImage(file: File, maxPx = 700, quality = 0.78): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
          else { w = Math.round(w * maxPx / h); h = maxPx; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const TEMPLATES = [
  { id: 'marssico',         group: '💎 Topo de Linha',      name: '💎 Marssico Supreme',    desc: 'Experiência premium: animações cinematográficas, modal de tamanhos, dock fixo e combos exclusivos.', bg: '#1a1512', emoji: '💎' },
  { id: 'classic-modern',   group: '🔥 Modernos & Premium', name: '🍕 Clássico Moderno',     desc: 'Design escuro e dramático com hero animado, countdown de urgência e prova social em tempo real.', bg: '#1a0a00', emoji: '🍕' },
  { id: 'dark-modern',      group: '🔥 Modernos & Premium', name: '🌙 Notturno',             desc: 'Estética noturna intensa com neon, glassmorphism e animações sofisticadas.', bg: '#0d0d0d', emoji: '🌙' },
  { id: 'editorial-modern', group: '🔥 Modernos & Premium', name: '🎯 Editorial Conversão',  desc: 'Layout persuasivo com barra de oferta, busca integrada e gatilhos de urgência.', bg: '#1a1a2e', emoji: '🎯' },
  { id: 'classic',          group: '☀️ Clean & Artesanal',  name: '🌾 Artisan Heritage',     desc: 'Visual claro e artesanal com tons bege e creme. Elegante e aconchegante.', bg: '#fdfbfa', emoji: '🌾' },
  { id: 'dark',             group: '☀️ Clean & Artesanal',  name: '🔥 Dark Forno',           desc: 'Estética noturna com efeito grain, gradiente ember e glassmorphism.', bg: '#0f0a08', emoji: '🔥' },
  { id: 'editorial',        group: '☀️ Clean & Artesanal',  name: '📰 Editorial Clean',      desc: 'Layout claro focado em conversão com hero persuasivo e frete grátis progressivo.', bg: '#f7f4ef', emoji: '📰' },
];

const PALETTES = [
  { name: 'San Marzano', color: '#941100' },
  { name: 'Basilico',    color: '#7fa650' },
  { name: 'Terra',       color: '#c2410c' },
  { name: 'Notte',       color: '#1c1917' },
  { name: 'Oro',         color: '#b8860b' },
];

const nav: { id: TabId; label: string; icon: typeof LayoutDashboard; badge?: (s: StoreData) => string }[] = [
  { id: 'dashboard',  label: 'Visão geral',    icon: LayoutDashboard },
  { id: 'produtos',   label: 'Produtos',        icon: Pizza,     badge: (s) => String(s.products?.length ?? 0) },
  { id: 'categorias', label: 'Categorias',      icon: Tag },
  { id: 'combos',     label: 'Combos',          icon: Sparkles,  badge: (s) => String(s.combos?.length ?? 0) },
  { id: 'reviews',    label: 'Avaliações',      icon: Star,      badge: (s) => String(s.reviews?.length ?? 0) },
  { id: 'aparencia',  label: 'Aparência',       icon: Palette },
  { id: 'poster',     label: 'Estúdio de arte', icon: ImageDown },
];

// ─────────────────────────────────────────────
// ImageUpload Component
// ─────────────────────────────────────────────
function ImageUpload({ value, onChange, label = 'Foto', maxPx = 700 }: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  maxPx?: number;
}) {
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);
    try {
      const compressed = await compressImage(f, maxPx);
      onChange(compressed);
    } finally {
      setLoading(false);
    }
    e.target.value = '';
  };

  return (
    <div
      onClick={() => ref.current?.click()}
      className="relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 transition hover:border-brand/50 hover:bg-brand/5"
      style={{ minHeight: 120 }}
    >
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      )}
      {value ? (
        <>
          <img src={value} alt={label} className="size-full max-h-40 object-contain" />
          <div className="absolute inset-0 flex items-center justify-center bg-charcoal/0 opacity-0 transition hover:bg-charcoal/30 hover:opacity-100">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-charcoal shadow">Trocar foto</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 p-6 text-stone-400">
          <Upload className="size-6" />
          <span className="text-xs font-medium">{label}</span>
          <span className="text-[10px] text-stone-300">Clique para enviar</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal wrapper
// ─────────────────────────────────────────────
function Modal({ open, onClose, title, children, footer }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-[#faf7f2] shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
          <h3 className="font-serif text-2xl">{title}</h3>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full border border-stone-200 text-stone-400 hover:bg-stone-100">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">{children}</div>
        {footer && (
          <div className="flex items-center gap-3 border-t border-stone-200 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-brand/5"
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-brand/5"
    />
  );
}

function BtnPrimary({ children, onClick, type = 'button', disabled = false }: {
  children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex-1 rounded-full bg-charcoal py-3 text-sm font-semibold text-cream shadow-lg shadow-charcoal/10 transition hover:bg-brand disabled:opacity-50"
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────
// Main App Component
// ─────────────────────────────────────────────
export default function App({ uid, initialStore }: AppProps) {
  const [store, setStore] = useState<StoreData>(initialStore);
  const [tab, setTab]     = useState<TabId>('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState('');

  useEffect(() => {
    const unsub = subscribeStoreByUid(uid, (data: StoreData) => setStore(data));
    return unsub;
  }, [uid]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const persistStore = useCallback(async (patch: Partial<StoreData>) => {
    const updated = { ...store, ...patch };
    setStore(updated);
    setSaving(true);
    try {
      await saveStoreData(uid, updated);
      showToast('✅ Salvo com sucesso!');
    } catch {
      showToast('⚠️ Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }, [store, uid, showToast]);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = './auth.html';
  };

  const liveMenuUrl = store.slug ? `${window.location.origin}/loja.html?loja=${store.slug}` : '';

  return (
    <div className="min-h-screen bg-[#faf7f2] text-charcoal">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream shadow-2xl animate-in fade-in slide-in-from-bottom-3">
          {toast}
        </div>
      )}

      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#faf7f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 md:px-8">
          <button
            onClick={() => setMobileNav(true)}
            className="grid size-9 place-items-center rounded-xl border border-stone-200 md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="size-4" />
          </button>

          <a href="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-brand text-cream">
              <Flame className="size-4" />
            </span>
            <span className="font-serif text-lg font-bold italic text-charcoal">
              {store.name || 'Minha Pizzaria'}
            </span>
          </a>

          <div className="mx-4 hidden h-6 w-px bg-stone-200 md:block" />
          <nav className="hidden items-center gap-1 text-xs text-stone-500 md:flex">
            <span>Painel</span>
            <ChevronRight className="size-3" />
            <span className="font-semibold text-charcoal">
              {nav.find((n) => n.id === tab)?.label}
            </span>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <input
                placeholder="Buscar em tudo…"
                className="h-10 w-64 rounded-xl border border-stone-200 bg-white/70 pl-9 pr-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-brand/50 focus:bg-white focus:ring-4 focus:ring-brand/5"
              />
            </div>
            <button className="relative grid size-10 place-items-center rounded-xl border border-stone-200 bg-white/70 hover:bg-white">
              <Bell className="size-4" />
            </button>
            {liveMenuUrl && (
              <a
                href={liveMenuUrl}
                target="_blank"
                rel="noopener"
                className="hidden items-center gap-1.5 rounded-xl border border-stone-200 bg-white/70 px-3.5 py-2.5 text-xs font-semibold hover:border-brand/40 hover:text-brand md:inline-flex"
              >
                <Eye className="size-3.5" />
                Ver cardápio
              </a>
            )}
            <button
              onClick={handleLogout}
              className="grid size-10 place-items-center rounded-xl bg-charcoal text-sm font-semibold text-cream hover:bg-brand transition"
              title="Sair"
            >
              {(store.name?.[0] ?? 'P').toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* ── GRID ── */}
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-8 md:px-8 md:py-10">
        {/* Sidebar desktop */}
        <aside className="hidden md:block">
          <SidebarNav tab={tab} onSelect={setTab} store={store} onLogout={handleLogout} saving={saving} />
        </aside>

        {/* Sidebar mobile drawer */}
        {mobileNav && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
            <div className="absolute inset-y-0 left-0 w-72 bg-[#faf7f2] p-5 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <span className="font-serif text-lg italic text-brand">{store.name}</span>
                <button onClick={() => setMobileNav(false)} className="grid size-8 place-items-center rounded-lg border border-stone-200">
                  <X className="size-4" />
                </button>
              </div>
              <SidebarNav tab={tab} onSelect={(t) => { setTab(t); setMobileNav(false); }} store={store} onLogout={handleLogout} saving={saving} />
            </div>
          </div>
        )}

        {/* ── CONTENT ── */}
        <section className="min-w-0">
          {tab === 'dashboard'  && <DashboardView onNav={setTab} store={store} />}
          {tab === 'produtos'   && <ProdutosView store={store} onSave={persistStore} showToast={showToast} />}
          {tab === 'categorias' && <CategoriasView store={store} onSave={persistStore} showToast={showToast} />}
          {tab === 'combos'     && <CombosView store={store} onSave={persistStore} showToast={showToast} />}
          {tab === 'reviews'    && <ReviewsView store={store} onSave={persistStore} showToast={showToast} />}
          {tab === 'aparencia'  && <AparenciaView store={store} onSave={persistStore} />}
          {tab === 'poster'     && <PosterView store={store} />}
        </section>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sidebar Nav
// ─────────────────────────────────────────────
function SidebarNav({ tab, onSelect, store, onLogout, saving }: {
  tab: TabId;
  onSelect: (t: TabId) => void;
  store: StoreData;
  onLogout: () => void;
  saving: boolean;
}) {
  const liveMenuUrl = store.slug ? `/loja.html?loja=${store.slug}` : '#';
  return (
    <div className="sticky top-24 space-y-1">
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">Gestão</p>
      {nav.map((n) => {
        const active = tab === n.id;
        const Icon = n.icon;
        const badge = n.badge?.(store);
        return (
          <button
            key={n.id}
            onClick={() => onSelect(n.id)}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              active ? 'bg-charcoal text-cream shadow-sm' : 'text-stone-600 hover:bg-white hover:text-charcoal'
            }`}
          >
            <Icon className={`size-4 shrink-0 ${active ? 'text-cream' : 'text-stone-500 group-hover:text-brand'}`} />
            <span className="flex-1 text-left">{n.label}</span>
            {badge && badge !== '0' && (
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-cream/15 text-cream' : 'bg-stone-100 text-stone-500'}`}>
                {badge}
              </span>
            )}
          </button>
        );
      })}

      {/* Live preview */}
      <div className="pt-4">
        <a
          href={liveMenuUrl}
          target="_blank"
          rel="noopener"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand/90"
        >
          <Eye className="size-4" />
          Ver cardápio ao vivo
        </a>
      </div>

      {/* Upsell card */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-stone-50 p-5">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand">
          <Sparkles className="size-3" /> Novidade
        </div>
        <p className="font-serif text-base leading-tight">Receba pedidos pelo WhatsApp</p>
        <p className="mt-1.5 text-xs text-stone-500">Configure o número no painel de Aparência.</p>
        <button onClick={() => onSelect('aparencia')} className="mt-4 w-full rounded-lg bg-charcoal py-2 text-xs font-semibold text-cream transition hover:bg-brand">
          Configurar agora
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-400 transition hover:bg-white hover:text-brand"
      >
        <X className="size-4" />
        {saving ? 'Salvando…' : 'Sair'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section Head
// ─────────────────────────────────────────────
function SectionHead({ title, subtitle, cta, onCta }: {
  title: string; subtitle: string; cta?: string; onCta?: () => void;
}) {
  return (
    <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-stone-200 pb-6">
      <div className="min-w-0">
        <h2 className="font-serif text-3xl md:text-4xl">{title}</h2>
        <p className="mt-2 text-sm text-stone-500">{subtitle}</p>
      </div>
      {cta && (
        <button
          onClick={onCta}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-charcoal px-4 py-2.5 text-xs font-semibold text-cream shadow-lg shadow-charcoal/10 transition hover:bg-brand md:px-5"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">{cta}</span>
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Dashboard View
// ─────────────────────────────────────────────
function DashboardView({ onNav, store }: { onNav: (t: TabId) => void; store: StoreData }) {
  const kpis = [
    { label: 'Produtos',    value: String(store.products?.length ?? 0),                                      delta: 'no cardápio',    icon: Pizza,    sub: 'itens ativos' },
    { label: 'Categorias',  value: String(store.categories?.length ?? 0),                                    delta: 'organizadas',    icon: Tag,      sub: 'grupos' },
    { label: 'Combos',      value: String(store.combos?.length ?? 0),                                        delta: 'em destaque',    icon: Sparkles, sub: 'ofertas ativas' },
    { label: 'Avaliações',  value: String(store.reviews?.length ?? 0),                                       delta: 'publicadas',     icon: Star,     sub: 'depoimentos' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-charcoal via-[#2a1815] to-charcoal p-8 text-cream md:p-10">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute -bottom-24 right-24 size-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cream/50">Bem-vindo ao painel</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
              {store.name || 'Sua Pizzaria'}<span className="italic text-accent"> está no ar.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm text-cream/70">
              Gerencie seu cardápio, combos, avaliações e personalize a aparência da sua loja — tudo em um lugar.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => onNav('produtos')} className="inline-flex items-center gap-1.5 rounded-full bg-cream px-4 py-2.5 text-xs font-semibold text-charcoal transition hover:scale-[1.02]">
                <Plus className="size-3.5" /> Adicionar produto
              </button>
              <button onClick={() => onNav('poster')} className="inline-flex items-center gap-1.5 rounded-full border border-cream/25 px-4 py-2.5 text-xs font-semibold text-cream transition hover:bg-cream/10">
                <ImageDown className="size-3.5" /> Gerar arte pro Instagram
              </button>
            </div>
          </div>
          {/* Quick stats */}
          <div className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5 backdrop-blur">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-cream/50">Resumo do cardápio</p>
            <div className="space-y-3">
              {[
                { l: 'Produtos',       v: store.products?.length ?? 0 },
                { l: 'Categorias',     v: store.categories?.length ?? 0 },
                { l: 'Combos ativos',  v: store.combos?.filter(c => c.active !== false)?.length ?? 0 },
              ].map(item => (
                <div key={item.l} className="flex items-center justify-between">
                  <span className="text-xs text-cream/60">{item.l}</span>
                  <span className="font-serif text-xl text-cream">{item.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5">
              <div className="flex items-start justify-between">
                <div className="grid size-10 place-items-center rounded-xl bg-stone-100 text-stone-500 transition group-hover:bg-brand/10 group-hover:text-brand">
                  <Icon className="size-4" />
                </div>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <ArrowUpRight className="size-3" />{k.delta}
                </span>
              </div>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500">{k.label}</p>
              <p className="mt-1 font-serif text-3xl">{k.value}</p>
              <p className="mt-0.5 text-xs text-stone-400">{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Gerenciar produtos',        desc: 'Adicionar, editar ou remover itens',       tab: 'produtos'  as TabId, icon: Pizza },
          { label: 'Personalizar aparência',    desc: 'Cores, template e dados da loja',          tab: 'aparencia' as TabId, icon: Palette },
          { label: 'Criar arte para Instagram', desc: 'Pôster automático com seus produtos',      tab: 'poster'    as TabId, icon: ImageDown },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => onNav(item.tab)}
              className="group flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 text-left transition hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-500 transition group-hover:bg-brand/10 group-hover:text-brand">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="font-semibold text-charcoal">{item.label}</p>
                <p className="mt-0.5 text-xs text-stone-500">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Produtos View — CRUD completo com modal
// ─────────────────────────────────────────────
function ProdutosView({ store, onSave, showToast }: {
  store: StoreData;
  onSave: (p: Partial<StoreData>) => void;
  showToast: (m: string) => void;
}) {
  const [q, setQ]           = useState('');
  const [catFilter, setCat] = useState('todas');
  const [view, setView]     = useState<'list' | 'grid'>('list');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);

  // Form state
  const [fName,  setFName]  = useState('');
  const [fCat,   setFCat]   = useState('');
  const [fDesc,  setFDesc]  = useState('');
  const [fImg,   setFImg]   = useState('');
  const [fPriceP, setFPriceP] = useState('');
  const [fPriceM, setFPriceM] = useState('');
  const [fPriceG, setFPriceG] = useState('');

  const products   = store.products ?? [];
  const categories = store.categories ?? [];

  const isSizeCat = useMemo(() => {
    const cat = categories.find(c => c.id === fCat);
    return !cat || cat.type === 'sizes';
  }, [fCat, categories]);

  const filtered = useMemo(() =>
    products.filter(p =>
      (catFilter === 'todas' || p.cat === catFilter) &&
      (q === '' || p.name.toLowerCase().includes(q.toLowerCase()))
    ), [products, q, catFilter]);

  const openNew = () => {
    setEditId(null);
    setFName(''); setFCat(categories[0]?.id ?? ''); setFDesc(''); setFImg('');
    setFPriceP(''); setFPriceM(''); setFPriceG('');
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    setEditId(id);
    setFName(p.name); setFCat(p.cat); setFDesc(p.desc); setFImg(p.img ?? '');
    setFPriceP(String(p.prices[0] ?? ''));
    setFPriceM(String(p.prices[1] ?? ''));
    setFPriceG(String(p.prices[2] ?? ''));
    setModalOpen(true);
  };

  const saveProd = () => {
    if (!fName.trim()) { showToast('⚠️ Informe o nome'); return; }
    const prices: number[] = isSizeCat
      ? [parseFloat(fPriceP) || 0, parseFloat(fPriceM) || 0, parseFloat(fPriceG) || 0].filter(x => x > 0)
      : [parseFloat(fPriceP) || 0].filter(x => x > 0);
    if (!prices.length) { showToast('⚠️ Informe pelo menos um preço'); return; }

    let updated: Product[];
    if (editId) {
      updated = products.map(p => p.id === editId ? { ...p, name: fName.trim(), cat: fCat, desc: fDesc.trim(), img: fImg, prices } : p);
    } else {
      updated = [...products, { id: genId('p'), name: fName.trim(), cat: fCat, desc: fDesc.trim(), img: fImg, prices, active: true }];
    }
    onSave({ products: updated });
    setModalOpen(false);
    showToast(editId ? '✅ Produto atualizado!' : '✅ Produto adicionado!');
  };

  const toggleActive = (id: string) => {
    const updated = products.map(p => p.id === id ? { ...p, active: !(p.active ?? true) } : p);
    onSave({ products: updated });
  };

  const deleteProd = (id: string) => {
    if (!confirm('Remover este produto?')) return;
    onSave({ products: products.filter(p => p.id !== id) });
    showToast('🗑 Produto removido');
  };

  return (
    <div>
      <SectionHead
        title="Produtos"
        subtitle={`${products.length} itens no cardápio.`}
        cta="Novo produto"
        onCta={openNew}
      />

      {/* Toolbar */}
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome…"
            className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-4 text-sm outline-none placeholder:text-stone-400 focus:border-brand/50 focus:ring-4 focus:ring-brand/5"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1 overflow-x-auto">
          <button onClick={() => setCat('todas')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${catFilter === 'todas' ? 'bg-charcoal text-cream' : 'text-stone-500 hover:text-charcoal'}`}>Todas</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${catFilter === c.id ? 'bg-charcoal text-cream' : 'text-stone-500 hover:text-charcoal'}`}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1">
          <button onClick={() => setView('list')} className={`grid size-8 place-items-center rounded-lg ${view === 'list' ? 'bg-stone-100 text-charcoal' : 'text-stone-400'}`}><List className="size-4" /></button>
          <button onClick={() => setView('grid')} className={`grid size-8 place-items-center rounded-lg ${view === 'grid' ? 'bg-stone-100 text-charcoal' : 'text-stone-400'}`}><Grid3x3 className="size-4" /></button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[10px] uppercase tracking-widest text-stone-500">
              <tr>
                <th className="p-4 text-left font-semibold">Produto</th>
                <th className="p-4 text-left font-semibold">Categoria</th>
                <th className="p-4 text-right font-semibold">Preço</th>
                <th className="p-4 text-right font-semibold">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const cat = categories.find(c => c.id === p.cat);
                const mainPrice = p.prices?.[0] ?? 0;
                const isActive = p.active !== false;
                return (
                  <tr key={p.id} className="border-t border-stone-100 transition hover:bg-stone-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                          {p.img ? <img src={p.img} alt="" className="size-full object-cover" /> : <span className="flex size-full items-center justify-center text-xl">🍕</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{p.name}</p>
                          <p className="max-w-md truncate text-xs text-stone-500">{p.desc}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
                        {cat?.name ?? p.cat}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-right">
                        <span className="font-serif text-base">{formatBRL(mainPrice)}</span>
                        {p.prices.length > 1 && <span className="ml-1 text-[10px] text-stone-400">+{p.prices.length - 1} tam.</span>}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => toggleActive(p.id)} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition ${isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700' : 'bg-stone-100 text-stone-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                        <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                        {isActive ? 'Ativo' : 'Pausado'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p.id)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/5">Editar</button>
                        <button onClick={() => deleteProd(p.id)} className="grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="grid place-items-center gap-3 p-16 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-stone-100 text-stone-400"><Filter className="size-5" /></div>
              <p className="text-sm text-stone-500">Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(p => (
            <div key={p.id} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-charcoal/5">
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                {p.img ? <img src={p.img} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" /> : <span className="flex size-full items-center justify-center text-4xl">🍕</span>}
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  {categories.find(c => c.id === p.cat)?.name}
                </p>
                <h4 className="mt-1 font-serif text-xl">{p.name}</h4>
                <p className="mt-1 line-clamp-2 text-xs text-stone-500">{p.desc}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-serif text-2xl text-brand">{formatBRL(p.prices?.[0] ?? 0)}</p>
                  <button onClick={() => openEdit(p.id)} className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-bold hover:border-brand hover:text-brand">Editar</button>
                </div>
              </div>
            </div>
          ))}
          {/* Add card */}
          <button onClick={openNew} className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-10 transition hover:border-brand/50 hover:bg-brand/5">
            <div className="grid size-12 place-items-center rounded-full bg-stone-100 text-stone-400 group-hover:bg-brand/10 group-hover:text-brand transition"><Plus className="size-5" /></div>
            <span className="text-sm font-semibold text-stone-500 group-hover:text-brand">Adicionar produto</span>
          </button>
        </div>
      )}

      {/* Modal de produto */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Produto' : 'Novo Produto'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-5 py-3 text-sm font-semibold text-stone-500 hover:text-charcoal">Cancelar</button>
            <BtnPrimary onClick={saveProd}>{editId ? 'Salvar alterações' : 'Adicionar produto'}</BtnPrimary>
          </>
        }
      >
        <FormRow label="Foto do produto">
          <ImageUpload value={fImg} onChange={setFImg} label="Foto do produto" maxPx={700} />
        </FormRow>
        <FormRow label="Nome">
          <Input value={fName} onChange={e => setFName(e.target.value)} placeholder="Ex: Pizza Margherita" />
        </FormRow>
        <FormRow label="Categoria">
          <div className="relative">
            <select
              value={fCat}
              onChange={e => setFCat(e.target.value)}
              className="w-full appearance-none rounded-xl border border-stone-200 bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-brand/5"
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          </div>
        </FormRow>
        <FormRow label="Descrição">
          <Textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Ingredientes, detalhes…" />
        </FormRow>
        {isSizeCat ? (
          <FormRow label="Preços por tamanho">
            <div className="grid grid-cols-3 gap-3">
              {[{ label: 'P', val: fPriceP, set: setFPriceP }, { label: 'M', val: fPriceM, set: setFPriceM }, { label: 'G', val: fPriceG, set: setFPriceG }].map(sz => (
                <div key={sz.label}>
                  <label className="mb-1 block text-center text-[10px] font-bold uppercase text-stone-500">{sz.label}</label>
                  <input
                    type="number"
                    min="0"
                    value={sz.val}
                    onChange={e => sz.set(e.target.value)}
                    placeholder="R$ 0"
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-center text-sm outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-brand/5"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-stone-400">💡 Preencha apenas os tamanhos que sua pizzaria oferece</p>
          </FormRow>
        ) : (
          <FormRow label="Preço (R$)">
            <Input type="number" min="0" value={fPriceP} onChange={e => setFPriceP(e.target.value)} placeholder="R$ 0" />
          </FormRow>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// Categorias View
// ─────────────────────────────────────────────
function CategoriasView({ store, onSave, showToast }: {
  store: StoreData; onSave: (p: Partial<StoreData>) => void; showToast: (m: string) => void;
}) {
  const categories = store.categories ?? [];
  const products   = store.products   ?? [];
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [fName, setFName]         = useState('');
  const [fEmoji, setFEmoji]       = useState('🍕');
  const [fType, setFType]         = useState('sizes');
  const [fDisplay, setFDisplay]   = useState('card');

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => { map[p.cat] = (map[p.cat] ?? 0) + 1; });
    return map;
  }, [products]);

  const openNew = () => {
    setEditId(null); setFName(''); setFEmoji('🍕'); setFType('sizes'); setFDisplay('card');
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const c = categories.find(x => x.id === id);
    if (!c) return;
    setEditId(id); setFName(c.name); setFEmoji(c.emoji ?? '🍕'); setFType(c.type ?? 'sizes'); setFDisplay(c.display ?? 'card');
    setModalOpen(true);
  };

  const saveCat = () => {
    if (!fName.trim()) { showToast('⚠️ Informe o nome'); return; }
    let updated: Category[];
    if (editId) {
      updated = categories.map(c => c.id === editId ? { ...c, name: fName.trim(), emoji: fEmoji, type: fType, display: fDisplay } : c);
    } else {
      updated = [...categories, { id: genId('c'), name: fName.trim(), emoji: fEmoji, type: fType, display: fDisplay }];
    }
    onSave({ categories: updated });
    setModalOpen(false);
    showToast(editId ? '✅ Categoria salva!' : '✅ Categoria criada!');
  };

  const delCat = (id: string) => {
    if (products.some(p => p.cat === id)) { showToast('⚠️ Mova os produtos antes de deletar'); return; }
    if (!confirm('Remover categoria?')) return;
    onSave({ categories: categories.filter(c => c.id !== id) });
    showToast('🗑 Categoria removida');
  };

  return (
    <div>
      <SectionHead title="Categorias" subtitle="Organize seu cardápio em seções." cta="Nova categoria" onCta={openNew} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <div key={c.id} className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5">
            <div className="mb-4 flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand/10 to-accent/10 font-serif text-lg italic text-brand">
                {c.emoji ?? (i + 1)}
              </span>
              <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => openEdit(c.id)} className="grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-brand/5 hover:text-brand">
                  <CircleDot className="size-4" />
                </button>
                <button onClick={() => delCat(c.id)} className="grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <p className="font-serif text-2xl">{c.name}</p>
            <p className="mt-1 text-xs text-stone-500">{countByCategory[c.id] ?? 0} produtos · {c.type === 'sizes' ? 'P/M/G' : 'Preço único'}</p>
            <button onClick={() => openEdit(c.id)} className="mt-4 text-xs font-bold text-brand hover:underline">Editar</button>
          </div>
        ))}
        <button onClick={openNew} className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-10 transition hover:border-brand/50 hover:bg-brand/5">
          <div className="grid size-12 place-items-center rounded-full bg-stone-100 text-stone-400 group-hover:bg-brand/10 group-hover:text-brand transition"><Plus className="size-5" /></div>
          <span className="text-sm font-semibold text-stone-500 group-hover:text-brand">Nova categoria</span>
        </button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Categoria' : 'Nova Categoria'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-5 py-3 text-sm font-semibold text-stone-500 hover:text-charcoal">Cancelar</button>
            <BtnPrimary onClick={saveCat}>{editId ? 'Salvar' : 'Criar categoria'}</BtnPrimary>
          </>
        }
      >
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <FormRow label="Nome da categoria">
            <Input value={fName} onChange={e => setFName(e.target.value)} placeholder="Ex: Pizzas Salgadas" />
          </FormRow>
          <FormRow label="Emoji">
            <Input value={fEmoji} onChange={e => setFEmoji(e.target.value)} placeholder="🍕" className="w-16 text-center text-xl" />
          </FormRow>
        </div>
        <FormRow label="Tipo de preço">
          <div className="grid grid-cols-2 gap-2">
            {[{ v: 'sizes', l: 'Tamanhos P/M/G' }, { v: 'single', l: 'Preço único' }].map(opt => (
              <button key={opt.v} onClick={() => setFType(opt.v)} className={`rounded-xl border-2 p-3 text-sm font-semibold transition ${fType === opt.v ? 'border-charcoal bg-charcoal text-cream' : 'border-stone-200 bg-white text-stone-500 hover:border-charcoal/40'}`}>
                {opt.l}
              </button>
            ))}
          </div>
        </FormRow>
        <FormRow label="Exibição no cardápio">
          <div className="grid grid-cols-2 gap-2">
            {[{ v: 'card', l: 'Cards' }, { v: 'list', l: 'Lista' }].map(opt => (
              <button key={opt.v} onClick={() => setFDisplay(opt.v)} className={`rounded-xl border-2 p-3 text-sm font-semibold transition ${fDisplay === opt.v ? 'border-charcoal bg-charcoal text-cream' : 'border-stone-200 bg-white text-stone-500 hover:border-charcoal/40'}`}>
                {opt.l}
              </button>
            ))}
          </div>
        </FormRow>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// Combos View
// ─────────────────────────────────────────────
function CombosView({ store, onSave, showToast }: {
  store: StoreData; onSave: (p: Partial<StoreData>) => void; showToast: (m: string) => void;
}) {
  const combos = store.combos ?? [];
  const [modalOpen, setModalOpen]   = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [fName, setFName]           = useState('');
  const [fPrice, setFPrice]         = useState('');
  const [fOrigPrice, setFOrigPrice] = useState('');
  const [fItems, setFItems]         = useState('');
  const [fSaving, setFSaving]       = useState('');
  const [fImg, setFImg]             = useState('');

  const openNew = () => {
    setEditId(null); setFName(''); setFPrice(''); setFOrigPrice(''); setFItems(''); setFSaving(''); setFImg('');
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const c = combos.find(x => x.id === id);
    if (!c) return;
    setEditId(id); setFName(c.name); setFPrice(String(c.price)); setFOrigPrice(String(c.origPrice ?? ''));
    setFItems(c.items); setFSaving(c.saving ?? ''); setFImg(c.img ?? '');
    setModalOpen(true);
  };

  const saveCombo = () => {
    if (!fName.trim() || !fPrice) { showToast('⚠️ Informe nome e preço'); return; }
    const obj: Omit<Combo, 'id'> = {
      name: fName.trim(), price: parseFloat(fPrice) || 0,
      origPrice: parseFloat(fOrigPrice) || 0,
      items: fItems.trim(), saving: fSaving.trim(),
      img: fImg, active: true,
    };
    let updated: Combo[];
    if (editId) {
      updated = combos.map(c => c.id === editId ? { ...c, ...obj } : c);
    } else {
      updated = [...combos, { id: genId('co'), ...obj }];
    }
    onSave({ combos: updated });
    setModalOpen(false);
    showToast(editId ? '✅ Combo atualizado!' : '✅ Combo criado!');
  };

  const delCombo = (id: string) => {
    if (!confirm('Remover este combo?')) return;
    onSave({ combos: combos.filter(c => c.id !== id) });
    showToast('🗑 Combo removido');
  };

  return (
    <div>
      <SectionHead title="Combos" subtitle="Ofertas que aparecem em destaque no topo do cardápio." cta="Novo combo" onCta={openNew} />

      {combos.length === 0 && (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-stone-300 p-16 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-stone-100 text-stone-400"><Sparkles className="size-5" /></div>
          <p className="text-sm text-stone-500">Nenhum combo criado ainda.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {combos.map((c) => {
          const discount = c.origPrice ? Math.round(((c.origPrice - c.price) / c.origPrice) * 100) : 0;
          return (
            <div key={c.id} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-charcoal/5">
              <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
                {c.img
                  ? <><img src={c.img} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-charcoal/70 to-transparent" /></>
                  : <span className="flex size-full items-center justify-center text-5xl">🍕</span>
                }
                {discount > 0 && <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cream">-{discount}%</span>}
                {c.img && (
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between text-cream">
                    <h3 className="font-serif text-3xl italic">{c.name}</h3>
                    <div className="text-right">
                      {c.origPrice ? <p className="text-[10px] line-through opacity-70">{formatBRL(c.origPrice)}</p> : null}
                      <p className="font-serif text-2xl">{formatBRL(c.price)}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6">
                {!c.img && <><h3 className="font-serif text-2xl">{c.name}</h3><p className="font-serif text-xl text-brand mt-1">{formatBRL(c.price)}</p></>}
                <p className="mt-2 text-sm text-stone-500">{c.items}</p>
                <div className="mt-5 flex items-center gap-2">
                  <button onClick={() => openEdit(c.id)} className="rounded-full bg-charcoal px-4 py-2 text-xs font-semibold text-cream hover:bg-brand">Editar combo</button>
                  <button onClick={() => delCombo(c.id)} className="grid size-8 place-items-center rounded-full border border-stone-200 text-stone-400 hover:border-red-200 hover:text-red-600"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Combo' : 'Novo Combo'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-5 py-3 text-sm font-semibold text-stone-500 hover:text-charcoal">Cancelar</button>
            <BtnPrimary onClick={saveCombo}>{editId ? 'Salvar alterações' : 'Criar combo'}</BtnPrimary>
          </>
        }
      >
        <FormRow label="Foto do combo">
          <ImageUpload value={fImg} onChange={setFImg} label="Foto do combo" maxPx={700} />
        </FormRow>
        <FormRow label="Nome">
          <Input value={fName} onChange={e => setFName(e.target.value)} placeholder="Ex: Combo Família" />
        </FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Preço (R$)">
            <Input type="number" min="0" value={fPrice} onChange={e => setFPrice(e.target.value)} placeholder="R$ 0" />
          </FormRow>
          <FormRow label="Preço original (R$)">
            <Input type="number" min="0" value={fOrigPrice} onChange={e => setFOrigPrice(e.target.value)} placeholder="R$ 0 (opcional)" />
          </FormRow>
        </div>
        <FormRow label="Itens do combo">
          <Textarea value={fItems} onChange={e => setFItems(e.target.value)} placeholder="2 Pizzas G + Refrigerante 2L…" />
        </FormRow>
        <FormRow label="Descrição da economia (opcional)">
          <Input value={fSaving} onChange={e => setFSaving(e.target.value)} placeholder="Ex: Economize R$ 20!" />
        </FormRow>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// Reviews View
// ─────────────────────────────────────────────
function ReviewsView({ store, onSave, showToast }: {
  store: StoreData; onSave: (p: Partial<StoreData>) => void; showToast: (m: string) => void;
}) {
  const reviews = store.reviews ?? [];
  const [modalOpen, setModalOpen] = useState(false);
  const [fName, setFName]         = useState('');
  const [fStars, setFStars]       = useState(5);
  const [fText, setFText]         = useState('');
  const [fProduct, setFProduct]   = useState('');
  const [fDate, setFDate]         = useState('');

  const saveReview = () => {
    if (!fName.trim() || !fText.trim()) { showToast('⚠️ Preencha nome e depoimento'); return; }
    const updated: Review[] = [...reviews, {
      id: genId('r'), name: fName.trim(), stars: fStars, text: fText.trim(),
      product: fProduct.trim(), date: fDate.trim() || 'recentemente', avatar: '',
    }];
    onSave({ reviews: updated });
    setModalOpen(false);
    setFName(''); setFText(''); setFProduct(''); setFDate(''); setFStars(5);
    showToast('✅ Avaliação adicionada!');
  };

  const delReview = (id: string) => {
    if (!confirm('Remover avaliação?')) return;
    onSave({ reviews: reviews.filter(r => r.id !== id) });
    showToast('🗑 Avaliação removida');
  };

  return (
    <div>
      <SectionHead title="Avaliações" subtitle="Depoimentos que aparecem no seu cardápio público." cta="Novo depoimento" onCta={() => setModalOpen(true)} />
      {reviews.length === 0 && (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-stone-300 p-16 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-stone-100 text-stone-400"><Star className="size-5" /></div>
          <p className="text-sm text-stone-500">Nenhuma avaliação ainda.</p>
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-stone-200 bg-white p-6 transition hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand/15 to-accent/15 font-serif text-lg font-bold text-brand">
                  {r.name?.[0]?.toUpperCase() ?? 'C'}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.name}</p>
                  {r.date && <p className="text-[11px] text-stone-400">{r.date}</p>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5 text-accent">
                {Array.from({ length: r.stars ?? 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-accent" />
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm italic leading-relaxed text-stone-600">"{r.text}"</p>
            {r.product && <p className="mt-2 text-[11px] text-stone-400">📍 {r.product}</p>}
            <div className="mt-4 flex items-center justify-end border-t border-stone-100 pt-4">
              <button onClick={() => delReview(r.id)} className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-red-600">
                <Trash2 className="size-3.5" /> Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Depoimento"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-5 py-3 text-sm font-semibold text-stone-500 hover:text-charcoal">Cancelar</button>
            <BtnPrimary onClick={saveReview}>Adicionar avaliação</BtnPrimary>
          </>
        }
      >
        <FormRow label="Nome do cliente">
          <Input value={fName} onChange={e => setFName(e.target.value)} placeholder="Ex: Maria S." />
        </FormRow>
        <FormRow label="Nota">
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setFStars(n)} className={`grid size-10 place-items-center rounded-xl text-xl transition ${n <= fStars ? 'bg-accent/10 text-accent' : 'bg-stone-100 text-stone-300'}`}>
                ⭐
              </button>
            ))}
          </div>
        </FormRow>
        <FormRow label="Depoimento">
          <Textarea value={fText} onChange={e => setFText(e.target.value)} placeholder="Ex: Melhor pizza da cidade!" />
        </FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Produto citado (opcional)">
            <Input value={fProduct} onChange={e => setFProduct(e.target.value)} placeholder="Pizza Margherita" />
          </FormRow>
          <FormRow label="Data (opcional)">
            <Input value={fDate} onChange={e => setFDate(e.target.value)} placeholder="há 2 dias" />
          </FormRow>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// Aparência View — com fee, minFreeShip, logo
// ─────────────────────────────────────────────
function AparenciaView({ store, onSave }: { store: StoreData; onSave: (p: Partial<StoreData>) => void }) {
  const [local, setLocal] = useState({
    name:         store.name         ?? '',
    tagline:      store.tagline      ?? '',
    phone:        store.phone        ?? '',
    addr:         store.addr         ?? '',
    hours:        store.hours        ?? '',
    closeTime:    store.closeTime    ?? '23:00',
    deliveryTime: store.deliveryTime ?? '',
    rating:       store.rating       ?? '',
    promoTxt:     store.promoTxt     ?? '',
    promoTag:     store.promoTag     ?? '',
    fee:          String(store.fee          ?? 5),
    minOrder:     String(store.minOrder     ?? 30),
    minFreeShip:  String(store.minFreeShip  ?? 90),
  });
  const [color, setColor]             = useState(store.color ?? '#941100');
  const [selectedTpl, setSelectedTpl] = useState(store.template ?? 'classic');
  const [logo, setLogo]               = useState(store.logo ?? '');

  const setField = (k: keyof typeof local, v: string) => setLocal(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    onSave({
      ...local,
      fee:         parseFloat(local.fee)         || 5,
      minOrder:    parseFloat(local.minOrder)     || 30,
      minFreeShip: parseFloat(local.minFreeShip)  || 90,
      color,
      template: selectedTpl,
      logo,
    });
  };

  // group templates
  const tplGroups = useMemo(() => {
    const groups: Record<string, typeof TEMPLATES> = {};
    TEMPLATES.forEach(t => { if (!groups[t.group]) groups[t.group] = []; groups[t.group].push(t); });
    return groups;
  }, []);

  return (
    <div>
      <SectionHead title="Aparência" subtitle="Personalize a identidade que aparece no seu cardápio público." />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">

          {/* Dados da loja */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Dados da loja</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormRow label="Nome da pizzaria"><Input value={local.name} onChange={e => setField('name', e.target.value)} /></FormRow>
              <FormRow label="Slogan"><Input value={local.tagline} onChange={e => setField('tagline', e.target.value)} /></FormRow>
              <FormRow label="Telefone / WhatsApp"><Input value={local.phone} onChange={e => setField('phone', e.target.value)} /></FormRow>
              <FormRow label="Horário de funcionamento"><Input value={local.hours} onChange={e => setField('hours', e.target.value)} placeholder="Ex: Seg–Sex 18h–23h" /></FormRow>
              <div className="sm:col-span-2">
                <FormRow label="Endereço"><Input value={local.addr} onChange={e => setField('addr', e.target.value)} /></FormRow>
              </div>
              <FormRow label="Tempo de entrega"><Input value={local.deliveryTime} onChange={e => setField('deliveryTime', e.target.value)} placeholder="Ex: 40–60 min" /></FormRow>
              <FormRow label="Nota (estrelas)"><Input value={local.rating} onChange={e => setField('rating', e.target.value)} placeholder="Ex: 4.9" /></FormRow>
              <FormRow label="Texto de promoção"><Input value={local.promoTxt} onChange={e => setField('promoTxt', e.target.value)} placeholder="Ex: 🎉 Frete grátis hoje!" /></FormRow>
              <FormRow label="Tag de promoção"><Input value={local.promoTag} onChange={e => setField('promoTag', e.target.value)} placeholder="Ex: PROMOÇÃO" /></FormRow>
            </div>
          </div>

          {/* Entrega e pagamentos */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Entrega & Pedido mínimo</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormRow label="Taxa de Entrega (R$)">
                <Input type="number" min="0" step="0.50" value={local.fee} onChange={e => setField('fee', e.target.value)} placeholder="5" />
              </FormRow>
              <FormRow label="Pedido mínimo (R$)">
                <Input type="number" min="0" value={local.minOrder} onChange={e => setField('minOrder', e.target.value)} placeholder="30" />
              </FormRow>
              <FormRow label="Frete grátis a partir de (R$)">
                <Input type="number" min="0" value={local.minFreeShip} onChange={e => setField('minFreeShip', e.target.value)} placeholder="90" />
              </FormRow>
            </div>
          </div>

          {/* Logo */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Logo da loja</p>
            <div className="max-w-[200px]">
              <ImageUpload value={logo} onChange={(v) => { setLogo(v); onSave({ logo: v }); }} label="Logo" maxPx={400} />
            </div>
          </div>

          {/* Cor */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Cor da marca</p>
            <div className="flex flex-wrap gap-3">
              {PALETTES.map(p => (
                <button
                  key={p.name}
                  onClick={() => setColor(p.color)}
                  className={`group flex items-center gap-3 rounded-2xl border p-3 pr-5 transition ${color === p.color ? 'border-charcoal bg-white shadow-sm' : 'border-stone-200 bg-white hover:border-charcoal/40'}`}
                >
                  <span className="grid size-10 place-items-center rounded-xl ring-2 ring-white" style={{ background: p.color }}>
                    {color === p.color && <Check className="size-4 text-white" />}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400">{p.color}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Template picker */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Template do cardápio</p>
            {Object.entries(tplGroups).map(([groupName, templates]) => (
              <div key={groupName}>
                <p className="mb-3 text-xs font-bold text-stone-400">{groupName}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {templates.map(t => {
                    const active = selectedTpl === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTpl(t.id)}
                        className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition ${active ? 'border-charcoal shadow-md ring-1 ring-charcoal' : 'border-stone-200 bg-white hover:border-charcoal/50'}`}
                      >
                        <div className="relative flex h-20 w-full items-center justify-center text-3xl" style={{ background: t.bg }}>
                          {t.emoji}
                          {active && <span className="absolute right-2 top-2 rounded-full bg-charcoal px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">Em uso</span>}
                        </div>
                        <div className="flex flex-col gap-1.5 p-3">
                          <p className="text-sm font-bold leading-tight">{t.name}</p>
                          <p className="text-[10px] leading-relaxed text-stone-500 line-clamp-2">{t.desc}</p>
                          <span className={`mt-1 w-full rounded-lg py-1.5 text-center text-xs font-semibold transition ${active ? 'bg-stone-100 text-stone-400' : 'bg-charcoal text-white group-hover:bg-brand'}`}>
                            {active ? '✓ Ativo' : 'Usar'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-cream shadow-lg shadow-charcoal/10 hover:bg-brand">
              Salvar todas as alterações
            </button>
            <button onClick={() => setLocal({
              name: store.name ?? '', tagline: store.tagline ?? '', phone: store.phone ?? '',
              addr: store.addr ?? '', hours: store.hours ?? '', closeTime: store.closeTime ?? '23:00',
              deliveryTime: store.deliveryTime ?? '', rating: store.rating ?? '',
              promoTxt: store.promoTxt ?? '', promoTag: store.promoTag ?? '',
              fee: String(store.fee ?? 5), minOrder: String(store.minOrder ?? 30), minFreeShip: String(store.minFreeShip ?? 90),
            })} className="text-sm font-semibold text-stone-500 hover:text-charcoal">
              Descartar
            </button>
          </div>
        </div>

        {/* Preview ao vivo */}
        <div className="sticky top-24 self-start">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Prévia ao vivo</p>
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-[#faf7f2] shadow-lg">
            <div className="border-b border-stone-200 bg-white p-4 flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-red-400" />
              <span className="inline-block size-2.5 rounded-full bg-amber-400" />
              <span className="inline-block size-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="p-6 text-center">
              {logo ? (
                <img src={logo} alt="Logo" className="mx-auto mb-3 size-16 rounded-full object-cover shadow-sm" />
              ) : (
                <span className="grid mx-auto size-12 place-items-center rounded-xl text-white mb-3" style={{ background: color }}>
                  <Flame className="size-5" />
                </span>
              )}
              <h4 className="mt-2 font-serif text-2xl italic" style={{ color }}>{local.name || 'Minha Pizzaria'}</h4>
              <p className="mt-1 text-xs text-stone-500">{local.tagline || 'Seu slogan aqui'}</p>
              <p className="mt-2 text-[11px] text-stone-400">🚗 Entrega: R$ {local.fee} · Grátis acima de R$ {local.minFreeShip}</p>
              <button className="mt-4 rounded-full px-5 py-2 text-xs font-semibold text-white" style={{ background: color }}>
                Ver cardápio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Poster View (mantido original)
// ─────────────────────────────────────────────
function PosterView({ store }: { store: StoreData }) {
  const products = store.products ?? [];
  const [selected, setSelected] = useState(0);
  const [style, setStyle]       = useState<'destaque' | 'promo'>('destaque');
  const [format, setFormat]     = useState<'feed' | 'story'>('feed');
  const p = products[selected];

  if (!p) return (
    <div>
      <SectionHead title="Estúdio de arte" subtitle="Crie posts prontos para o Instagram em segundos." />
      <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-stone-300 p-16 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-stone-100 text-stone-400"><ImageDown className="size-5" /></div>
        <p className="text-sm text-stone-500">Adicione produtos para criar artes.</p>
      </div>
    </div>
  );

  return (
    <div>
      <SectionHead title="Estúdio de arte" subtitle="Crie posts prontos para o Instagram em segundos." />
      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Produto em destaque</label>
            <div className="grid grid-cols-3 gap-2">
              {products.slice(0, 6).map((prod, i) => (
                <button
                  key={prod.id}
                  onClick={() => setSelected(i)}
                  className={`relative aspect-square overflow-hidden rounded-xl ring-2 transition ${selected === i ? 'ring-brand' : 'ring-transparent hover:ring-stone-300'}`}
                >
                  {prod.img
                    ? <img src={prod.img} alt="" className="size-full object-cover" />
                    : <span className="flex size-full items-center justify-center bg-stone-100 text-2xl">🍕</span>
                  }
                  {selected === i && <span className="absolute inset-0 grid place-items-center bg-brand/40"><Check className="size-5 text-cream" /></span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Modelo</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ id: 'destaque' as const, t: 'Destaque' }, { id: 'promo' as const, t: 'Promoção' }].map(m => (
                <button key={m.id} onClick={() => setStyle(m.id)} className={`rounded-xl border-2 p-4 text-left text-sm font-semibold transition ${style === m.id ? 'border-charcoal bg-charcoal text-cream' : 'border-stone-200 bg-white text-stone-500 hover:border-charcoal/40'}`}>{m.t}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Formato</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ id: 'feed' as const, t: 'Feed', d: '1080×1080' }, { id: 'story' as const, t: 'Stories', d: '1080×1920' }].map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)} className={`rounded-xl border-2 p-4 text-left transition ${format === f.id ? 'border-charcoal bg-charcoal text-cream' : 'border-stone-200 bg-white text-stone-500 hover:border-charcoal/40'}`}>
                  <p className="text-sm font-semibold">{f.t}</p>
                  <p className={`text-[10px] ${format === f.id ? 'text-cream/60' : 'text-stone-400'}`}>{f.d}</p>
                </button>
              ))}
            </div>
          </div>

          <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-semibold text-cream shadow-lg shadow-brand/20 transition hover:scale-[1.01]">
            <Download className="size-4" /> Baixar arte (PNG)
          </button>
        </div>

        {/* Preview */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Prévia</p>
          <div className="rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-100 to-stone-200 p-6 md:p-10">
            <div className={`mx-auto overflow-hidden rounded-2xl bg-[#faf7f2] shadow-2xl shadow-charcoal/10 ${format === 'feed' ? 'aspect-square max-w-[440px]' : 'aspect-[9/16] max-w-[320px]'}`}>
              {style === 'destaque' ? (
                <div className="relative flex h-full flex-col justify-between p-6">
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-brand px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-cream">Novidade</span>
                    <span className="font-serif text-xs italic text-brand">{store.name}</span>
                  </div>
                  <div className="my-4 flex-1 overflow-hidden rounded-xl">
                    {p.img
                      ? <img src={p.img} alt="" className="mx-auto aspect-square w-full object-cover shadow-lg" />
                      : <div className="flex aspect-square w-full items-center justify-center bg-stone-100 text-6xl">🍕</div>
                    }
                  </div>
                  <div>
                    <h4 className="font-serif text-2xl italic leading-tight">{p.name}</h4>
                    <p className="mt-2 line-clamp-2 text-[10px] text-stone-500">{p.desc}</p>
                    <p className="mt-3 font-serif text-4xl text-brand">{formatBRL(p.prices?.[0] ?? 0)}</p>
                  </div>
                </div>
              ) : (
                <div className="relative flex h-full flex-col text-cream">
                  {p.img && <img src={p.img} alt="" className="absolute inset-0 size-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent" />
                  <div className="relative mt-auto p-6">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-[9px] font-bold uppercase tracking-widest">-20% hoje</span>
                    <h4 className="mt-3 font-serif text-3xl italic">{p.name}</h4>
                    <div className="mt-2 flex items-baseline gap-2">
                      <p className="font-serif text-4xl text-accent">{formatBRL((p.prices?.[0] ?? 0) * 0.8)}</p>
                      <p className="text-sm line-through opacity-60">{formatBRL(p.prices?.[0] ?? 0)}</p>
                    </div>
                    <p className="mt-3 text-[10px] uppercase tracking-widest opacity-70">{store.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
