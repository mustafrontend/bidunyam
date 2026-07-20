// ─────────────────────────────────────────────────────────────
// Kanonik Kategori Ağacı (tek kaynak)
// MegaMenu, CategoryShowcase ve mobil menü buradan beslenir.
// Alt kategori adları backend filtre şablonlarıyla (taxonomy.ts) uyumludur;
// böylece "kategoriye özel filtre" akışı arama sayfasında doğru çalışır.
// ─────────────────────────────────────────────────────────────

export interface CategoryNode {
  name: string;
  icon: string;      // lucide icon adı (CategoryShowcase için)
  gradient: string;  // showcase kutusu rengi
  subCategories: string[];
}

export const CATEGORY_TREE: CategoryNode[] = [
  {
    name: "Elektronik",
    icon: "Smartphone",
    gradient: "from-blue-500 to-indigo-600",
    subCategories: ["Cep Telefonu", "Laptop", "Tablet", "Kulaklık", "Akıllı Saat", "Televizyon", "Oyun & Konsol", "Kamera"],
  },
  {
    name: "Moda",
    icon: "Shirt",
    gradient: "from-rose-500 to-pink-600",
    subCategories: ["Tişört", "Sweatshirt", "Pantolon", "Elbise", "Ayakkabı", "Çanta", "Ceket & Mont", "Aksesuar"],
  },
  {
    name: "Ev & Yaşam",
    icon: "Home",
    gradient: "from-amber-500 to-orange-600",
    subCategories: ["Mobilya", "Su Isıtıcısı", "Fritöz", "Aydınlatma", "Ev Tekstili", "Mutfak Gereçleri", "Dekorasyon"],
  },
  {
    name: "Kozmetik",
    icon: "Sparkles",
    gradient: "from-fuchsia-500 to-purple-600",
    subCategories: ["Erkek Parfüm", "Kadın Parfüm", "Serum", "Makyaj", "Cilt Bakımı", "Saç Bakımı"],
  },
  {
    name: "Anne & Bebek",
    icon: "Baby",
    gradient: "from-teal-500 to-emerald-600",
    subCategories: ["Bebek Bezi", "Bebek Giyim", "Oyuncak", "Bebek Bakım", "Emzirme & Beslenme"],
  },
  {
    name: "Spor & Outdoor",
    icon: "Dumbbell",
    gradient: "from-lime-500 to-green-600",
    subCategories: ["Koşu", "Fitness", "Kamp & Doğa", "Bisiklet", "Spor Giyim", "Outdoor Ayakkabı"],
  },
  {
    name: "Kitap & Kırtasiye",
    icon: "BookOpen",
    gradient: "from-cyan-500 to-sky-600",
    subCategories: ["Roman", "Kişisel Gelişim", "Çocuk Kitapları", "Ders Kitapları", "Kırtasiye", "Ofis Malzemeleri"],
  },
  {
    name: "Süpermarket",
    icon: "ShoppingBasket",
    gradient: "from-red-500 to-rose-600",
    subCategories: ["Atıştırmalık", "İçecek", "Temizlik", "Kişisel Bakım", "Kahvaltılık", "Ev Bakım"],
  },
];

export const CATEGORY_NAMES = CATEGORY_TREE.map((c) => c.name);

export function catHref(name: string) {
  return `/arama?kategori=${encodeURIComponent(name)}`;
}
export function subCatHref(cat: string, sub: string) {
  return `/arama?kategori=${encodeURIComponent(cat)}&altkategori=${encodeURIComponent(sub)}`;
}
