// ─────────────────────────────────────────────────────────────
// Kategori adı normalleştirme.
// XML feed'leri ve manuel girişler serbest metin kategori adı gönderebiliyor
// ("Telefonlar & Aksesuarlar", "Giyim", "Beyaz Eşya..."). Bunları kanonik
// kategori ağacına eşleyip çöp/kopya kategori birikmesini önler.
// ─────────────────────────────────────────────────────────────

export const CANONICAL_CATEGORIES = [
  'Elektronik',
  'Moda',
  'Ev & Yaşam',
  'Kozmetik',
  'Anne & Bebek',
  'Spor & Outdoor',
  'Kitap & Kırtasiye',
  'Süpermarket',
] as const;

// Anahtar (küçük harf) → kanonik ad
const MAIN_ALIASES: Record<string, string> = {
  // Moda
  'giyim': 'Moda',
  'moda - aksesuar': 'Moda',
  'saat gözlük aksesuarları': 'Moda',
  'ayakkabı & çanta': 'Moda',
  'giyim & moda': 'Moda',
  'tekstil': 'Moda',
  // Elektronik
  'telefonlar & aksesuarlar': 'Elektronik',
  'telefon & aksesuar': 'Elektronik',
  'bilgisayar sistemleri ve ekipmanları': 'Elektronik',
  'bilgisayar': 'Elektronik',
  'foto kameraları': 'Elektronik',
  'hobi oyun konsolları': 'Elektronik',
  'elektronik & teknoloji': 'Elektronik',
  'beyaz eşya': 'Elektronik',
  // Ev & Yaşam
  'ev dekorasyon': 'Ev & Yaşam',
  'ev elektronik ürünleri': 'Ev & Yaşam',
  'beyaz eşya mutfak ürünleri': 'Ev & Yaşam',
  'yapı market bahçe oto': 'Ev & Yaşam',
  'ev & mobilya': 'Ev & Yaşam',
  'ev yaşam': 'Ev & Yaşam',
  // Kozmetik
  'kozmetik kişisel bakım': 'Kozmetik',
  'kişisel bakım': 'Kozmetik',
  'kozmetik & kişisel bakım': 'Kozmetik',
  // Anne & Bebek
  'anne bebek ürünleri & oyuncak': 'Anne & Bebek',
  'anne & bebek & oyuncak': 'Anne & Bebek',
  'oyuncak': 'Anne & Bebek',
  // Spor
  'spor outdoor ürünleri': 'Spor & Outdoor',
  'spor': 'Spor & Outdoor',
  // Kitap & Kırtasiye
  'kitaplar filmler müzikler': 'Kitap & Kırtasiye',
  'kırtasiye ofis ürünleri': 'Kitap & Kırtasiye',
  'kitap': 'Kitap & Kırtasiye',
  'kitap & hobi': 'Kitap & Kırtasiye',
  // Süpermarket
  'market': 'Süpermarket',
  'gıda': 'Süpermarket',
};

// Alt kategori düzeltmeleri (yaprak seviyesinde sık görülen kopyalar)
const SUB_ALIASES: Record<string, string> = {
  'telefon': 'Cep Telefonu',
  'cep telefonları': 'Cep Telefonu',
  'notebook': 'Laptop',
  'dizüstü': 'Laptop',
  'dizüstü bilgisayar': 'Laptop',
  'kulaklıklar': 'Kulaklık',
  'parfüm': 'Parfüm', // ana kategori tarafında ele alınır
  'üst giyim': '',    // boş → ara kademe olarak atılır
};

const canonSet = new Set(CANONICAL_CATEGORIES.map((c) => c.toLocaleLowerCase('tr')));

/** Ana kategori adını kanonik ada çevirir; eşleşme yoksa temizlenmiş hâlini döndürür. */
export function normalizeMainCategory(raw?: string): string {
  const name = (raw || '').trim();
  if (!name) return '';
  const key = name.toLocaleLowerCase('tr');
  if (canonSet.has(key)) {
    // Kanonik (büyük/küçük harf düzelt)
    return CANONICAL_CATEGORIES.find((c) => c.toLocaleLowerCase('tr') === key)!;
  }
  return MAIN_ALIASES[key] || name;
}

/** Alt kategori adını düzeltir; boş dönerse ara kademe olarak atılmalıdır. */
export function normalizeSubCategory(raw?: string): string {
  const name = (raw || '').trim();
  if (!name) return '';
  return SUB_ALIASES[name.toLocaleLowerCase('tr')] ?? name;
}

/**
 * "Ana > Ara > Yaprak" gibi bir yolu "Kanonik Ana > Yaprak" biçimine indirger.
 * Ara kademeler (cinsiyet, "Üst Giyim", tekrar eden ana ad) atılır.
 */
export function normalizeCategoryPath(raw?: string): string {
  const parts = (raw || '')
    .split('>')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';

  const main = normalizeMainCategory(parts[0]);
  if (parts.length === 1) return main;

  // Yaprak = son anlamlı segment (normalize sonrası boş değilse)
  let leaf = normalizeSubCategory(parts[parts.length - 1]);
  // Yaprak boşsa (ör. "Üst Giyim") bir önceki segmenti dene
  for (let i = parts.length - 2; i >= 1 && !leaf; i--) {
    leaf = normalizeSubCategory(parts[i]);
  }
  if (!leaf || leaf.toLocaleLowerCase('tr') === main.toLocaleLowerCase('tr')) return main;
  return `${main} > ${leaf}`;
}
