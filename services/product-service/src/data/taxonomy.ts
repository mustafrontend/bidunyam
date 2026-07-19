// ─────────────────────────────────────────────────────────────
// Kategori Taksonomisi + Kategoriye Özel Filtre Şablonları
// Her alt kategorinin kendi dinamik özellik/filtre seti vardır.
// (Laptop → İşlemci/RAM/Ekran Kartı, Cep Telefonu → Hafıza/Renk vb.)
// ─────────────────────────────────────────────────────────────

export type FilterType = 'select' | 'number' | 'text' | 'boolean';

export interface FilterAttribute {
  name: string;                 // Ürün üzerinde saklanan anahtar (categoryAttributes key)
  label?: string;               // Görünen etiket (yoksa name kullanılır)
  type: FilterType;
  options?: string[];           // select için seçenekler
  unit?: string;                // number için birim (inç, mAh, W ...)
  required?: boolean;
}

export interface SubCategoryDef {
  name: string;
  filters: FilterAttribute[];
}

export interface CategoryDef {
  name: string;
  subCategories: SubCategoryDef[];
}

const RENK = ['Siyah', 'Beyaz', 'Gri', 'Mavi', 'Kırmızı', 'Yeşil', 'Pembe', 'Mor', 'Sarı', 'Kahverengi', 'Çok Renkli'];
const BEDEN = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const NUMARA = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const CINSIYET = ['Kadın', 'Erkek', 'Unisex', 'Çocuk'];

export const TAXONOMY: CategoryDef[] = [
  {
    name: 'Elektronik',
    subCategories: [
      {
        name: 'Cep Telefonu',
        filters: [
          { name: 'Hafıza', type: 'select', options: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'], required: true },
          { name: 'RAM', type: 'select', options: ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB'] },
          { name: 'Renk', type: 'select', options: RENK },
          { name: 'Ekran Boyutu', type: 'number', unit: 'inç' },
          { name: 'Batarya', type: 'number', unit: 'mAh' },
        ],
      },
      {
        name: 'Laptop',
        filters: [
          { name: 'İşlemci', type: 'select', options: ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M2', 'Apple M3'], required: true },
          { name: 'RAM', type: 'select', options: ['8 GB', '16 GB', '32 GB', '64 GB'], required: true },
          { name: 'Depolama', type: 'select', options: ['256 GB SSD', '512 GB SSD', '1 TB SSD', '2 TB SSD'] },
          { name: 'Ekran Kartı', type: 'select', options: ['Dahili Grafik', 'RTX 4050', 'RTX 4060', 'RTX 4070', 'Radeon Grafik', 'M2 GPU', 'M3 GPU'] },
          { name: 'Ekran Boyutu', type: 'number', unit: 'inç' },
        ],
      },
      {
        name: 'Tablet',
        filters: [
          { name: 'Hafıza', type: 'select', options: ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB'], required: true },
          { name: 'Renk', type: 'select', options: RENK },
          { name: 'Ekran Boyutu', type: 'number', unit: 'inç' },
          { name: 'Bağlantı', type: 'select', options: ['Wi-Fi', 'Wi-Fi + Cellular'] },
        ],
      },
      {
        name: 'Kulaklık',
        filters: [
          { name: 'Bağlantı', type: 'select', options: ['Bluetooth 5.0', 'Bluetooth 5.2', 'Bluetooth 5.3', 'Kablolu'], required: true },
          { name: 'Renk', type: 'select', options: RENK },
          { name: 'Gürültü Engelleme', type: 'select', options: ['Var', 'Yok'] },
          { name: 'Kullanım Süresi', type: 'number', unit: 'saat' },
        ],
      },
    ],
  },
  {
    name: 'Moda',
    subCategories: [
      {
        name: 'Tişört',
        filters: [
          { name: 'Beden', type: 'select', options: BEDEN, required: true },
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Materyal', type: 'select', options: ['%100 Pamuk', 'Pamuk Karışım', 'Polyester', 'Keten', 'Viskon'] },
          { name: 'Kalıp', type: 'select', options: ['Slim Fit', 'Regular Fit', 'Oversize'] },
          { name: 'Cinsiyet', type: 'select', options: CINSIYET },
        ],
      },
      {
        name: 'Pantolon',
        filters: [
          { name: 'Beden', type: 'select', options: ['34', '36', '38', '40', '42', '44', '46', '48'], required: true },
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Materyal', type: 'select', options: ['Denim', 'Pamuk', 'Keten', 'Kadife', 'Kumaş'] },
          { name: 'Kalıp', type: 'select', options: ['Skinny', 'Slim Fit', 'Regular', 'Mom Fit', 'Bol Kesim'] },
          { name: 'Cinsiyet', type: 'select', options: CINSIYET },
        ],
      },
      {
        name: 'Sweatshirt',
        filters: [
          { name: 'Beden', type: 'select', options: BEDEN, required: true },
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Materyal', type: 'select', options: ['Pamuk', 'Pamuk Karışım', 'Polyester'] },
          { name: 'Kalıp', type: 'select', options: ['Slim Fit', 'Regular Fit', 'Oversize'] },
          { name: 'Cinsiyet', type: 'select', options: CINSIYET },
        ],
      },
      {
        name: 'Ayakkabı',
        filters: [
          { name: 'Numara', type: 'select', options: NUMARA, required: true },
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Materyal', type: 'select', options: ['Deri', 'Süet', 'Tekstil', 'Deri/Tekstil', 'Sentetik'] },
          { name: 'Cinsiyet', type: 'select', options: CINSIYET },
        ],
      },
    ],
  },
  {
    name: 'Spor & Outdoor',
    subCategories: [
      {
        name: 'Koşu',
        filters: [
          { name: 'Numara', type: 'select', options: NUMARA, required: true },
          { name: 'Renk', type: 'select', options: RENK },
          { name: 'Cinsiyet', type: 'select', options: CINSIYET },
          { name: 'Taban', type: 'text' },
        ],
      },
    ],
  },
  {
    name: 'Kozmetik',
    subCategories: [
      {
        name: 'Erkek Parfüm',
        filters: [
          { name: 'Hacim', type: 'select', options: ['30 ml', '50 ml', '75 ml', '100 ml', '150 ml', '200 ml'], required: true },
          { name: 'Koku Tipi', type: 'select', options: ['Odunsu', 'Odunsu Aromatik', 'Çiçeksi', 'Oryantal', 'Fresh', 'Narenciye'] },
          { name: 'Konsantrasyon', type: 'select', options: ['EDT', 'EDP', 'Parfüm'] },
          { name: 'Cinsiyet', type: 'select', options: ['Erkek', 'Unisex'] },
        ],
      },
      {
        name: 'Kadın Parfüm',
        filters: [
          { name: 'Hacim', type: 'select', options: ['30 ml', '50 ml', '75 ml', '100 ml', '150 ml'], required: true },
          { name: 'Koku Tipi', type: 'select', options: ['Çiçeksi', 'Meyveli', 'Oryantal', 'Odunsu', 'Fresh'] },
          { name: 'Konsantrasyon', type: 'select', options: ['EDT', 'EDP', 'Parfüm'] },
          { name: 'Cinsiyet', type: 'select', options: ['Kadın', 'Unisex'] },
        ],
      },
      {
        name: 'Serum',
        filters: [
          { name: 'Hacim', type: 'select', options: ['15 ml', '30 ml', '50 ml', '100 ml'], required: true },
          { name: 'Cilt Tipi', type: 'select', options: ['Kuru', 'Yağlı', 'Karma', 'Normal', 'Hassas', 'Tüm Ciltler'] },
          { name: 'İçerik', type: 'text' },
          { name: 'Fayda', type: 'text' },
        ],
      },
    ],
  },
  {
    name: 'Ev & Yaşam',
    subCategories: [
      {
        name: 'Su Isıtıcısı',
        filters: [
          { name: 'Kapasite', type: 'select', options: ['1.0 L', '1.5 L', '1.7 L', '2.0 L'], required: true },
          { name: 'Renk', type: 'select', options: RENK },
          { name: 'Güç', type: 'number', unit: 'W' },
          { name: 'Malzeme', type: 'select', options: ['Cam', 'Çelik', 'Plastik'] },
        ],
      },
      {
        name: 'Fritöz',
        filters: [
          { name: 'Kapasite', type: 'select', options: ['3.0 L', '4.0 L', '5.0 L', '6.2 L', '8.0 L'], required: true },
          { name: 'Renk', type: 'select', options: RENK },
          { name: 'Güç', type: 'number', unit: 'W' },
          { name: 'Program Sayısı', type: 'number' },
        ],
      },
    ],
  },
  {
    name: 'Anne & Bebek',
    subCategories: [
      {
        name: 'Bebek Bezi',
        filters: [
          { name: 'Beden', type: 'select', options: ['1 Numara (Yeni Doğan)', '2 Numara (Mini)', '3 Numara (Midi)', '4 Numara (Maxi)', '5 Numara (Junior)', '6 Numara (XL)'], required: true },
          { name: 'Adet', type: 'number' },
          { name: 'Kilo Aralığı', type: 'text' },
          { name: 'Tip', type: 'select', options: ['Cırtlı', 'Külot'] },
        ],
      },
    ],
  },
];

// Alt kategori adı → filtre şablonu (hızlı erişim için düzleştirilmiş)
export function flattenTemplates(): Array<{ categoryName: string; filters: FilterAttribute[] }> {
  const out: Array<{ categoryName: string; filters: FilterAttribute[] }> = [];
  for (const cat of TAXONOMY) {
    for (const sub of cat.subCategories) {
      out.push({ categoryName: sub.name, filters: sub.filters });
    }
  }
  return out;
}
