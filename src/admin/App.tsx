import { useMemo, useState, useCallback } from 'react';
import {
  LayoutDashboard, Pizza, Tag, Sparkles, Star, Palette, ImageDown,
  Search, Plus, ArrowUpRight, ArrowDownRight, Bell, Eye, MoreHorizontal,
  Grid3x3, List, TrendingUp, Clock, Users, DollarSign, Menu, X,
  Check, ChevronRight, CircleDot, Flame, Download, Filter,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';
import { saveStoreData, subscribeStoreByUid } from '../lib/store-repo.js';
import { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type TabId = 'dashboard' | 'produtos' | 'categorias' | 'combos' | 'reviews' | 'aparencia' | 'poster';

interface StoreData {
  name?: string;
  tagline?: string;
  phone?: string;
  address?: string;
  hours?: string;
  accentColor?: string;
  template?: string;
  slug?: string;
  products?: Product[];
  categories?: Category[];
  combos?: Combo[];
  reviews?: Review[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  prices: { label: string; value: number }[];
  image?: string;
  active?: boolean;
  featured?: boolean;
}

interface Category {
  id: string;
  name: string;
  emoji?: string;
  priceType?: string;
}

interface Combo {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  active?: boolean;
}

interface Review {
  id: string;
  author: string;
  text: string;
  rating: number;
  published?: boolean;
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

const nav: { id: TabId; label: string; icon: typeof LayoutDashboard; badge?: (s: StoreData) => string }[] = [
  { id: 'dashboard',  label: 'Visão geral',     icon: LayoutDashboard },
  { id: 'produtos',   label: 'Produtos',         icon: Pizza,         badge: (s) => String(s.products?.length ?? 0) },
  { id: 'categorias', label: 'Categorias',       icon: Tag },
  { id: 'combos',     label: 'Combos',           icon: Sparkles,      badge: (s) => String(s.combos?.length ?? 0) },
  { id: 'reviews',    label: 'Avaliações',       icon: Star,          badge: (s) => String(s.reviews?.length ?? 0) },
  { id: 'aparencia',  label: 'Aparência',        icon: Palette },
  { id: 'poster',     label: 'Estúdio de arte',  icon: ImageDown },
];

// ─────────────────────────────────────────────
// Main App Component
// ─────────────────────────────────────────────
export default function App({ uid, initialStore }: AppProps) {
  const [store, setStore]     = useState<StoreData>(initialStore);
  const [tab, setTab]         = useState<TabId>('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState('');

  // Subscribe to real-time Firestore updates
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
      showToast('✓ Salvo com sucesso!');
    } catch {
      showToast('Erro ao salvar. Tente novamente.');
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
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-cream/85 backdrop-blur-xl">
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
            <div className="absolute inset-y-0 left-0 w-72 bg-cream p-5 shadow-2xl">
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
          {tab === 'produtos'   && <ProdutosView store={store} onSave={persistStore} />}
          {tab === 'categorias' && <CategoriasView store={store} onSave={persistStore} />}
          {tab === 'combos'     && <CombosView store={store} onSave={persistStore} />}
          {tab === 'reviews'    && <ReviewsView store={store} onSave={persistStore} />}
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
function SidebarNav({
  tab, onSelect, store, onLogout, saving,
}: {
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
// Status Pill
// ─────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Preparando': 'bg-amber-50 text-amber-700',
    'Saiu p/ entrega': 'bg-blue-50 text-blue-700',
    'Entregue': 'bg-emerald-50 text-emerald-700',
  };
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${map[status] ?? 'bg-stone-100 text-stone-600'}`}>
      <CircleDot className="size-2.5" />{status}
    </span>
  );
}

// ─────────────────────────────────────────────
// Dashboard View
// ─────────────────────────────────────────────
function DashboardView({ onNav, store }: { onNav: (t: TabId) => void; store: StoreData }) {
  const kpis = [
    { label: 'Produtos', value: String(store.products?.length ?? 0), delta: 'no cardápio', up: true, icon: Pizza, sub: 'itens ativos' },
    { label: 'Categorias', value: String(store.categories?.length ?? 0), delta: 'organizadas', up: true, icon: Tag, sub: 'grupos' },
    { label: 'Combos', value: String(store.combos?.length ?? 0), delta: 'em destaque', up: true, icon: Sparkles, sub: 'ofertas ativas' },
    { label: 'Avaliações', value: String(store.reviews?.filter(r => r.published)?.length ?? 0), delta: 'publicadas', up: true, icon: Star, sub: 'depoimentos visíveis' },
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
              Gerencie seu cardápio, combos, avaliações e personalize a aparência da sua loja tudo em um lugar.
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
                { l: 'Produtos', v: store.products?.length ?? 0 },
                { l: 'Categorias', v: store.categories?.length ?? 0 },
                { l: 'Combos ativos', v: store.combos?.filter(c => c.active !== false)?.length ?? 0 },
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
          { label: 'Gerenciar produtos', desc: 'Adicionar, editar ou remover itens', tab: 'produtos' as TabId, icon: Pizza },
          { label: 'Personalizar aparência', desc: 'Cores, template e dados da loja', tab: 'aparencia' as TabId, icon: Palette },
          { label: 'Criar arte para Instagram', desc: 'Pôster automático com seus produtos', tab: 'poster' as TabId, icon: ImageDown },
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
// Produtos View
// ─────────────────────────────────────────────
function ProdutosView({ store, onSave }: { store: StoreData; onSave: (p: Partial<StoreData>) => void }) {
  const [q, setQ]           = useState('');
  const [catFilter, setCat] = useState('todas');
  const [view, setView]     = useState<'list' | 'grid'>('list');

  const products   = store.products ?? [];
  const categories = store.categories ?? [];

  const filtered = useMemo(() =>
    products.filter(p =>
      (catFilter === 'todas' || p.category === catFilter) &&
      (q === '' || p.name.toLowerCase().includes(q.toLowerCase()))
    ), [products, q, catFilter]);

  const toggleActive = (id: string) => {
    const updated = products.map(p => p.id === id ? { ...p, active: !(p.active ?? true) } : p);
    onSave({ products: updated });
  };

  const deleteProduct = (id: string) => {
    if (!confirm('Remover este produto?')) return;
    onSave({ products: products.filter(p => p.id !== id) });
  };

  return (
    <div>
      <SectionHead
        title="Produtos"
        subtitle={`${products.length} itens no cardápio. Edite qualquer item para atualizar em tempo real.`}
        cta="Novo produto"
      />

      {/* Toolbar */}
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nome…"
            className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-4 text-sm outline-none placeholder:text-stone-400 focus:border-brand/50 focus:ring-4 focus:ring-brand/5"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1">
          <button onClick={() => setCat('todas')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${catFilter === 'todas' ? 'bg-charcoal text-cream' : 'text-stone-500 hover:text-charcoal'}`}>Todas</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${catFilter === c.id ? 'bg-charcoal text-cream' : 'text-stone-500 hover:text-charcoal'}`}>
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
                const cat = categories.find(c => c.id === p.category);
                const mainPrice = p.prices?.[0]?.value ?? 0;
                const isActive = p.active !== false;
                return (
                  <tr key={p.id} className="border-t border-stone-100 transition hover:bg-stone-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                          {p.image
                            ? <img src={p.image} alt="" className="size-full object-cover" />
                            : <span className="flex size-full items-center justify-center text-xl">🍕</span>
                          }
                          {p.featured && (
                            <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-accent text-cream">
                              <Star className="size-2.5 fill-cream" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{p.name}</p>
                          <p className="max-w-md truncate text-xs text-stone-500">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
                        {cat?.name ?? p.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-serif text-base">{formatBRL(mainPrice)}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => toggleActive(p.id)} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition ${isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700' : 'bg-stone-100 text-stone-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                        <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                        {isActive ? 'Ativo' : 'Pausado'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="rounded-lg px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/5">Editar</button>
                        <button onClick={() => deleteProduct(p.id)} className="grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600">
                          <MoreHorizontal className="size-4" />
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
                {p.image
                  ? <img src={p.image} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                  : <span className="flex size-full items-center justify-center text-4xl">🍕</span>
                }
                {p.featured && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-cream">
                    <Star className="size-3 fill-cream" /> Destaque
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  {(store.categories ?? []).find(c => c.id === p.category)?.name}
                </p>
                <h4 className="mt-1 font-serif text-xl">{p.name}</h4>
                <p className="mt-1 line-clamp-2 text-xs text-stone-500">{p.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-serif text-2xl text-brand">{formatBRL(p.prices?.[0]?.value ?? 0)}</p>
                  <button className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-bold hover:border-brand hover:text-brand">Editar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Categorias View
// ─────────────────────────────────────────────
function CategoriasView({ store, onSave }: { store: StoreData; onSave: (p: Partial<StoreData>) => void }) {
  const categories = store.categories ?? [];
  const products   = store.products   ?? [];

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => { map[p.category] = (map[p.category] ?? 0) + 1; });
    return map;
  }, [products]);

  return (
    <div>
      <SectionHead title="Categorias" subtitle="Organize seu cardápio em seções." cta="Nova categoria" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <div key={c.id} className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5">
            <div className="mb-4 flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand/10 to-accent/10 font-serif text-lg italic text-brand">
                {c.emoji ?? (i + 1)}
              </span>
              <button className="opacity-0 transition group-hover:opacity-100">
                <MoreHorizontal className="size-4 text-stone-400" />
              </button>
            </div>
            <p className="font-serif text-2xl">{c.name}</p>
            <p className="mt-1 text-xs text-stone-500">{countByCategory[c.id] ?? 0} itens ativos</p>
            <div className="mt-4 flex items-center gap-2">
              <button className="text-xs font-bold text-brand hover:underline">Editar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Combos View
// ─────────────────────────────────────────────
function CombosView({ store, onSave }: { store: StoreData; onSave: (p: Partial<StoreData>) => void }) {
  const combos = store.combos ?? [];

  return (
    <div>
      <SectionHead title="Combos" subtitle="Ofertas que aparecem em destaque no topo do cardápio." cta="Novo combo" />
      {combos.length === 0 && (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-stone-300 p-16 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-stone-100 text-stone-400"><Sparkles className="size-5" /></div>
          <p className="text-sm text-stone-500">Nenhum combo criado ainda.</p>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {combos.map((c) => {
          const discount = c.originalPrice ? Math.round(((c.originalPrice - c.price) / c.originalPrice) * 100) : 0;
          return (
            <div key={c.id} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-charcoal/5">
              <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
                {c.image
                  ? <><img src={c.image} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-charcoal/70 to-transparent" /></>
                  : <span className="flex size-full items-center justify-center text-5xl">🍕</span>
                }
                {discount > 0 && (
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cream">-{discount}%</span>
                )}
                {c.image && (
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between text-cream">
                    <h3 className="font-serif text-3xl italic">{c.name}</h3>
                    <div className="text-right">
                      {c.originalPrice && <p className="text-[10px] line-through opacity-70">{formatBRL(c.originalPrice)}</p>}
                      <p className="font-serif text-2xl">{formatBRL(c.price)}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6">
                {!c.image && <><h3 className="font-serif text-2xl">{c.name}</h3><p className="font-serif text-xl text-brand mt-1">{formatBRL(c.price)}</p></>}
                <p className="mt-2 text-sm text-stone-500">{c.description}</p>
                <div className="mt-5 flex items-center gap-2">
                  <button className="rounded-full bg-charcoal px-4 py-2 text-xs font-semibold text-cream hover:bg-brand">Editar combo</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Reviews View
// ─────────────────────────────────────────────
function ReviewsView({ store, onSave }: { store: StoreData; onSave: (p: Partial<StoreData>) => void }) {
  const reviews = store.reviews ?? [];

  const togglePublished = (id: string) => {
    const updated = reviews.map(r => r.id === id ? { ...r, published: !r.published } : r);
    onSave({ reviews: updated });
  };

  return (
    <div>
      <SectionHead title="Avaliações" subtitle="Escolha quais depoimentos aparecem no cardápio público." cta="Novo depoimento" />
      {reviews.length === 0 && (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-stone-300 p-16 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-stone-100 text-stone-400"><Star className="size-5" /></div>
          <p className="text-sm text-stone-500">Nenhuma avaliação ainda.</p>
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {reviews.map((r) => (
          <div key={r.id} className={`rounded-2xl border p-6 transition ${r.published ? 'border-stone-200 bg-white' : 'border-dashed border-stone-300 bg-stone-50/50'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand/15 to-accent/15 font-serif text-lg font-bold text-brand">
                  {r.author?.[0]?.toUpperCase() ?? 'C'}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.author}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5 text-accent">
                {Array.from({ length: r.rating ?? 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-accent" />
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm italic leading-relaxed text-stone-600">"{r.text}"</p>
            <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
              <button onClick={() => togglePublished(r.id)} className="flex cursor-pointer items-center gap-2">
                <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${r.published ? 'bg-emerald-500' : 'bg-stone-300'}`}>
                  <span className={`inline-block size-4 rounded-full bg-white shadow transition ${r.published ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </span>
                <span className="text-xs font-semibold text-stone-600">{r.published ? 'Publicado' : 'Rascunho'}</span>
              </button>
              <button className="text-xs font-bold text-brand hover:underline">Editar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Aparência View
// ─────────────────────────────────────────────
function AparenciaView({ store, onSave }: { store: StoreData; onSave: (p: Partial<StoreData>) => void }) {
  const [local, setLocal] = useState({ name: store.name ?? '', tagline: store.tagline ?? '', phone: store.phone ?? '', address: store.address ?? '', hours: store.hours ?? '' });
  const [selectedColor, setSelectedColor]       = useState(store.accentColor ?? '#941100');
  const [selectedTemplate, setSelectedTemplate] = useState(store.template   ?? 'classic');

  const palettes = [
    { name: 'San Marzano', color: '#941100' },
    { name: 'Basilico',    color: '#7fa650' },
    { name: 'Terra',       color: '#c2410c' },
    { name: 'Notte',       color: '#1c1917' },
    { name: 'Oro',         color: '#b8860b' },
  ];

  // Grupo 0 — Premium dos Premiums
  const templateMarssico = [
    { id: 'marssico', name: '✨ Marssico Supreme', desc: 'O topo da plataforma. Design paper-warm Napoletana com hero cinématico, pizza disc animado, floating tags, combos horizontais e cart drawer com freeship progress. Design system próprio, sem poluir outros templates.' },
  ];

  // Grupo 1 — Modernos & Premium (templates originais dramáticos restaurados do git)
  const templatesModern = [
    { id: 'classic-modern',   name: '🍕 Clássico',   desc: 'Tema escuro dramático com hero animado, emoji orbitando, countdown de urgência e prova social em tempo real.' },
    { id: 'editorial-modern', name: '📰 Editorial',   desc: 'Layout premium com hero grande, efeito glassmorphism e stepper animado de quantidades.' },
    { id: 'dark-modern',      name: '🔥 Dark Forno',  desc: 'Estética noturna com efeito grain, gradiente ember e glassmorphism. Para pizzarias que querem se destacar.' },
  ];

  // Grupo 2 — Simples & Clean (baseados nos ZIPs Templates ideias)
  const templatesSimple = [
    { id: 'classic',   name: '☀️ Artisan',    desc: 'Visual claro cream com hero split, categorias Playfair italic e grid de produtos limpo.' },
    { id: 'editorial', name: '📋 Conversão',   desc: 'Focado em conversão: trust badges, barra de frete grátis, busca integrada e stepper no card.' },
    { id: 'dark',      name: '🌑 Notturno',    desc: 'Fundo carvão com 3 camadas (radiais + grain + halo), título com gradiente âmbar.' },
  ];

  const handleSave = () => {
    onSave({ ...local, accentColor: selectedColor, template: selectedTemplate });
  };

  return (
    <div>
      <SectionHead title="Aparência" subtitle="Personalize a identidade que aparece no seu cardápio público." />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <div className="grid gap-5 sm:grid-cols-2">
            {([
              ['Nome da pizzaria', 'name'],
              ['Slogan', 'tagline'],
              ['Endereço', 'address'],
              ['Horário de funcionamento', 'hours'],
              ['Telefone / WhatsApp', 'phone'],
            ] as [string, keyof typeof local][]).map(([label, key]) => (
              <div key={key} className={label === 'Endereço' ? 'sm:col-span-2' : ''}>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">{label}</label>
                <input
                  value={local[key]}
                  onChange={e => setLocal(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-brand/5"
                />
              </div>
            ))}
          </div>

          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Cor da marca</p>
            <div className="flex flex-wrap gap-3">
              {palettes.map(p => (
                <button
                  key={p.name}
                  onClick={() => setSelectedColor(p.color)}
                  className={`group flex items-center gap-3 rounded-2xl border p-3 pr-5 transition ${selectedColor === p.color ? 'border-charcoal bg-white shadow-sm' : 'border-stone-200 bg-white hover:border-charcoal/40'}`}
                >
                  <span className="grid size-10 place-items-center rounded-xl ring-2 ring-white" style={{ background: p.color }}>
                    {selectedColor === p.color && <Check className="size-4 text-white" />}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400">{p.color}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Template Picker em 2 Grupos ── */}
          <div className="space-y-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Template do Cardápio</p>

          {/* ── GRUPO 0 — Premium dos Premiums (Marssico) ── */}
            <div className="rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">✨ Premium dos Premiums</span>
                <span className="text-[11px] text-amber-700">Design system próprio &mdash; o melhor da plataforma</span>
              </div>
              <div className="grid gap-4">
                {templateMarssico.map(t => {
                  const active = selectedTemplate === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition ${active ? 'border-amber-500 bg-white shadow-lg' : 'border-amber-200 bg-white/70 hover:border-amber-400 hover:bg-white'}`}
                    >
                      <div className="mb-3 h-20 overflow-hidden rounded-xl bg-[#faf7f2] flex items-center justify-center">
                        <div style={{display:'flex',alignItems:'center',gap:'8px',fontFamily:'Georgia,serif'}}>
                          <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'linear-gradient(135deg,#b8321f,#8a2214)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'18px',fontStyle:'italic'}}>M</div>
                          <div style={{color:'#1a1512',fontWeight:500,fontSize:'14px'}}>Marssico <span style={{color:'#e8b667',fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.15em'}}>Napoletana</span></div>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-stone-800">{t.name}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-stone-500">{t.desc}</p>
                      {active && <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">Ativo</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GRUPO 1 — Modernos & Premium */}
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full bg-charcoal px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Modernos & Premium</span>
                <span className="text-[11px] text-stone-400">Animações, efeitos e hero dramático</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {templatesModern.map(t => {
                  const active = selectedTemplate === t.id;
                  const previewBg = t.id === 'editorial-modern' ? 'bg-[#1a1a2e]' : t.id === 'dark-modern' ? 'bg-[#0d0d0d]' : 'bg-[#1a0a00]';
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition ${
                        active ? 'border-charcoal shadow-md ring-1 ring-charcoal' : 'border-stone-200 bg-white hover:border-charcoal/50'
                      }`}
                    >
                      <div className={`relative flex h-24 w-full items-center justify-center ${previewBg}`}>
                        <span className="text-4xl">{t.name.split(' ')[0]}</span>
                        {active && (
                          <span className="absolute right-2 top-2 rounded-full bg-charcoal px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">Em uso</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 p-4">
                        <p className="font-serif text-base font-bold">{t.name}</p>
                        <p className="text-[11px] leading-relaxed text-stone-500">{t.desc}</p>
                        <span className={`mt-1 w-full rounded-lg py-2 text-center text-xs font-semibold transition ${
                          active ? 'bg-stone-100 text-stone-400 cursor-default' : 'bg-charcoal text-white group-hover:bg-brand'
                        }`}>
                          {active ? '✓ Ativo' : 'Usar este template'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GRUPO 2 — Simples & Clean */}
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full border border-stone-300 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-600">Simples & Clean</span>
                <span className="text-[11px] text-stone-400">Visual limpo e direto ao ponto</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {templatesSimple.map(t => {
                  const active = selectedTemplate === t.id;
                  const previewBg = t.id === 'editorial' ? 'bg-[#f7f4ef]' : t.id === 'dark' ? 'bg-[#0f0a08]' : 'bg-[#fdfbfa]';
                  const previewText = t.id === 'editorial' ? 'text-stone-800' : t.id === 'dark' ? 'text-[#ff5a1f]' : 'text-stone-800';
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition ${
                        active ? 'border-charcoal shadow-md ring-1 ring-charcoal' : 'border-stone-200 bg-white hover:border-charcoal/50'
                      }`}
                    >
                      <div className={`relative flex h-24 w-full items-center justify-center ${previewBg}`}>
                        <span className={`text-4xl ${previewText}`}>{t.name.split(' ')[0]}</span>
                        {active && (
                          <span className="absolute right-2 top-2 rounded-full bg-charcoal px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">Em uso</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 p-4">
                        <p className="font-serif text-base font-bold">{t.name}</p>
                        <p className="text-[11px] leading-relaxed text-stone-500">{t.desc}</p>
                        <span className={`mt-1 w-full rounded-lg py-2 text-center text-xs font-semibold transition ${
                          active ? 'bg-stone-100 text-stone-400 cursor-default' : 'bg-charcoal text-white group-hover:bg-brand'
                        }`}>
                          {active ? '✓ Ativo' : 'Usar este template'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-cream shadow-lg shadow-charcoal/10 hover:bg-brand">
              Salvar alterações
            </button>
            <button onClick={() => setLocal({ name: store.name ?? '', tagline: store.tagline ?? '', phone: store.phone ?? '', address: store.address ?? '', hours: store.hours ?? '' })} className="text-sm font-semibold text-stone-500 hover:text-charcoal">
              Descartar
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="sticky top-24 self-start">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Prévia ao vivo</p>
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-cream shadow-lg">
            <div className="border-b border-stone-200 bg-white p-4">
              <span className="inline-block size-2.5 rounded-full bg-stone-300 mr-1.5" />
              <span className="inline-block size-2.5 rounded-full bg-stone-300 mr-1.5" />
              <span className="inline-block size-2.5 rounded-full bg-stone-300" />
            </div>
            <div className="p-6 text-center">
              <span className="grid mx-auto size-10 place-items-center rounded-lg text-white" style={{ background: selectedColor }}>
                <Flame className="size-4" />
              </span>
              <h4 className="mt-3 font-serif text-2xl italic" style={{ color: selectedColor }}>{local.name || 'Minha Pizzaria'}</h4>
              <p className="mt-1 text-xs text-stone-500">{local.tagline || 'Seu slogan aqui'}</p>
              <button className="mt-4 rounded-full px-5 py-2 text-xs font-semibold text-white" style={{ background: selectedColor }}>
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
// Poster View
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
                  {prod.image
                    ? <img src={prod.image} alt="" className="size-full object-cover" />
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
            <div className={`mx-auto overflow-hidden rounded-2xl bg-cream shadow-2xl shadow-charcoal/10 ${format === 'feed' ? 'aspect-square max-w-[440px]' : 'aspect-[9/16] max-w-[320px]'}`}>
              {style === 'destaque' ? (
                <div className="relative flex h-full flex-col justify-between p-6">
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-brand px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-cream">Novidade</span>
                    <span className="font-serif text-xs italic text-brand">{store.name}</span>
                  </div>
                  <div className="my-4 flex-1 overflow-hidden rounded-xl">
                    {p.image
                      ? <img src={p.image} alt="" className="mx-auto aspect-square w-full object-cover shadow-lg" />
                      : <div className="flex aspect-square w-full items-center justify-center bg-stone-100 text-6xl">🍕</div>
                    }
                  </div>
                  <div>
                    <h4 className="font-serif text-2xl italic leading-tight">{p.name}</h4>
                    <p className="mt-2 line-clamp-2 text-[10px] text-stone-500">{p.description}</p>
                    <p className="mt-3 font-serif text-4xl text-brand">{formatBRL(p.prices?.[0]?.value ?? 0)}</p>
                  </div>
                </div>
              ) : (
                <div className="relative flex h-full flex-col text-cream">
                  {p.image && <img src={p.image} alt="" className="absolute inset-0 size-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent" />
                  <div className="relative mt-auto p-6">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-[9px] font-bold uppercase tracking-widest">-20% hoje</span>
                    <h4 className="mt-3 font-serif text-3xl italic">{p.name}</h4>
                    <div className="mt-2 flex items-baseline gap-2">
                      <p className="font-serif text-4xl text-accent">{formatBRL((p.prices?.[0]?.value ?? 0) * 0.8)}</p>
                      <p className="text-sm line-through opacity-60">{formatBRL(p.prices?.[0]?.value ?? 0)}</p>
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
