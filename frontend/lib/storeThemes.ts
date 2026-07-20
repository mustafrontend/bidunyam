// ─────────────────────────────────────────────────────────────
// Bireysel Mağaza Temaları (Shopier tarzı; her satıcı kendi teması)
// Hem yönetim önizlemesi hem public /magaza/[slug] sayfası kullanır.
// ─────────────────────────────────────────────────────────────

export interface StoreTheme {
  id: string;
  name: string;
  desc: string;
  // Sayfa
  page: string;          // arka plan
  headerText: string;    // başlık metin rengi
  subText: string;       // ikincil metin
  // Kart
  card: string;          // ürün kartı sınıfları
  cardTitle: string;
  price: string;
  chip: string;          // durum rozeti
  // Hero/başlık bloğu
  hero: string;
  font: string;          // font ailesi sınıfı
  rounded: string;       // köşe yuvarlaklığı
}

export const STORE_THEMES: StoreTheme[] = [
  {
    id: "minimal",
    name: "Minimal",
    desc: "Bol beyaz alan, sade ve modern",
    page: "bg-white text-slate-900",
    headerText: "text-slate-900",
    subText: "text-slate-400",
    card: "bg-white border border-slate-100 hover:shadow-lg",
    cardTitle: "text-slate-800",
    price: "text-slate-900",
    chip: "bg-slate-100 text-slate-600",
    hero: "bg-slate-50 border border-slate-100",
    font: "font-sans",
    rounded: "rounded-2xl",
  },
  {
    id: "dark",
    name: "Karanlık",
    desc: "Koyu tema, neon vurgu, iddialı",
    page: "bg-slate-950 text-slate-100",
    headerText: "text-white",
    subText: "text-slate-400",
    card: "bg-slate-900 border border-slate-800 hover:border-[var(--accent)]",
    cardTitle: "text-slate-100",
    price: "text-white",
    chip: "bg-slate-800 text-slate-300",
    hero: "bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800",
    font: "font-sans",
    rounded: "rounded-2xl",
  },
  {
    id: "elegant",
    name: "Zarif",
    desc: "Krem tonlar, serif başlıklar, butik hava",
    page: "bg-[#faf7f2] text-stone-800",
    headerText: "text-stone-900",
    subText: "text-stone-400",
    card: "bg-white border border-stone-200 hover:shadow-md",
    cardTitle: "text-stone-800 font-serif",
    price: "text-stone-900",
    chip: "bg-stone-100 text-stone-500",
    hero: "bg-white border border-stone-200",
    font: "font-serif",
    rounded: "rounded-lg",
  },
  {
    id: "bold",
    name: "Canlı",
    desc: "Renkli gradyan, oynak ve enerjik",
    page: "bg-gradient-to-b from-white to-[var(--accent-soft)] text-slate-900",
    headerText: "text-slate-900",
    subText: "text-slate-500",
    card: "bg-white border-2 border-transparent hover:border-[var(--accent)] shadow-sm",
    cardTitle: "text-slate-800",
    price: "text-[var(--accent)]",
    chip: "bg-[var(--accent-soft)] text-[var(--accent)]",
    hero: "bg-gradient-to-r from-[var(--accent)] to-fuchsia-500 text-white",
    font: "font-sans",
    rounded: "rounded-3xl",
  },
  {
    id: "pastel",
    name: "Pastel",
    desc: "Yumuşak pastel tonlar, sıcak ve şirin",
    page: "bg-[#fdf2f8] text-slate-800",
    headerText: "text-slate-800",
    subText: "text-slate-400",
    card: "bg-white/80 backdrop-blur border border-pink-100 hover:shadow-md",
    cardTitle: "text-slate-700",
    price: "text-pink-600",
    chip: "bg-pink-100 text-pink-600",
    hero: "bg-white/70 backdrop-blur border border-pink-100",
    font: "font-sans",
    rounded: "rounded-3xl",
  },
];

export function getTheme(id?: string): StoreTheme {
  return STORE_THEMES.find((t) => t.id === id) || STORE_THEMES[0];
}
