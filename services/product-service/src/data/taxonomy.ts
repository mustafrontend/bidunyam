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

// Ortak seçenek setleri
const RENK = ['Siyah', 'Beyaz', 'Gri', 'Mavi', 'Kırmızı', 'Yeşil', 'Pembe', 'Mor', 'Sarı', 'Kahverengi', 'Bej', 'Lacivert', 'Turuncu', 'Çok Renkli'];
const BEDEN = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const NUMARA = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const CINSIYET = ['Kadın', 'Erkek', 'Unisex', 'Çocuk'];
const KALIP = ['Slim Fit', 'Regular Fit', 'Oversize', 'Dar Kesim', 'Bol Kesim'];
const MATERYAL = ['Pamuk', 'Polyester', 'Yün', 'Deri', 'Denim', 'Keten', 'Viskon', 'Karışım'];
const GARANTI = ['Yok', '3 Ay', '6 Ay', '1 Yıl', '2 Yıl', '3 Yıl'];
const RENK_F: FilterAttribute = { name: 'Renk', type: 'select', options: RENK };

export const TAXONOMY: CategoryDef[] = [
  // ─── ELEKTRONİK ──────────────────────────────────────────────
  {
    name: 'Elektronik',
    subCategories: [
      {
        name: 'Cep Telefonu',
        filters: [
          { name: 'Hafıza', type: 'select', options: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'], required: true },
          { name: 'RAM', type: 'select', options: ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB'] },
          RENK_F,
          { name: 'Ekran Boyutu', type: 'number', unit: 'inç' },
          { name: 'Batarya', type: 'number', unit: 'mAh' },
          { name: 'Garanti', type: 'select', options: GARANTI },
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
          { name: 'Bağlantı', type: 'select', options: ['Wi-Fi', 'Wi-Fi + Cellular'] },
          RENK_F,
          { name: 'Ekran Boyutu', type: 'number', unit: 'inç' },
        ],
      },
      {
        name: 'Kulaklık',
        filters: [
          { name: 'Tip', type: 'select', options: ['Kulak İçi', 'Kulak Üstü', 'Kulak Çevresi', 'TWS'], required: true },
          { name: 'Bağlantı', type: 'select', options: ['Kablolu', 'Bluetooth'] },
          { name: 'Gürültü Engelleme', type: 'boolean' },
          RENK_F,
        ],
      },
      {
        name: 'Akıllı Saat',
        filters: [
          { name: 'İşletim Sistemi', type: 'select', options: ['watchOS', 'Wear OS', 'Diğer'] },
          { name: 'Kasa Çapı', type: 'number', unit: 'mm' },
          { name: 'GPS', type: 'boolean' },
          RENK_F,
        ],
      },
      {
        name: 'Televizyon',
        filters: [
          { name: 'Ekran Boyutu', type: 'select', options: ['32"', '43"', '50"', '55"', '65"', '75"', '85"'], required: true },
          { name: 'Çözünürlük', type: 'select', options: ['HD', 'Full HD', '4K UHD', '8K'] },
          { name: 'Panel', type: 'select', options: ['LED', 'QLED', 'OLED'] },
          { name: 'Smart TV', type: 'boolean' },
        ],
      },
      {
        name: 'Oyun & Konsol',
        filters: [
          { name: 'Platform', type: 'select', options: ['PlayStation 5', 'Xbox Series X/S', 'Nintendo Switch', 'PC'] },
          { name: 'Tür', type: 'select', options: ['Konsol', 'Oyun', 'Aksesuar', 'Kumanda'] },
        ],
      },
      {
        name: 'Kamera',
        filters: [
          { name: 'Tip', type: 'select', options: ['DSLR', 'Aynasız', 'Kompakt', 'Aksiyon', 'Güvenlik'] },
          { name: 'Çözünürlük', type: 'number', unit: 'MP' },
          RENK_F,
        ],
      },
    ],
  },

  // ─── MODA ─────────────────────────────────────────────────────
  {
    name: 'Moda',
    subCategories: [
      {
        name: 'Tişört',
        filters: [
          { name: 'Beden', type: 'select', options: BEDEN, required: true },
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Materyal', type: 'select', options: MATERYAL },
          { name: 'Kalıp', type: 'select', options: KALIP },
          { name: 'Cinsiyet', type: 'select', options: CINSIYET },
        ],
      },
      {
        name: 'Gömlek',
        filters: [
          { name: 'Beden', type: 'select', options: BEDEN, required: true },
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Kalıp', type: 'select', options: KALIP },
          { name: 'Kol', type: 'select', options: ['Kısa Kol', 'Uzun Kol'] },
          { name: 'Cinsiyet', type: 'select', options: CINSIYET },
        ],
      },
      {
        name: 'Sweatshirt',
        filters: [
          { name: 'Beden', type: 'select', options: BEDEN, required: true },
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Kapüşon', type: 'boolean' },
          { name: 'Kalıp', type: 'select', options: KALIP },
        ],
      },
      {
        name: 'Pantolon',
        filters: [
          { name: 'Beden', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', '38', '40', '42', '44'], required: true },
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Tip', type: 'select', options: ['Jean', 'Kumaş', 'Eşofman', 'Chino', 'Kargo'] },
          { name: 'Kalıp', type: 'select', options: KALIP },
        ],
      },
      {
        name: 'Elbise',
        filters: [
          { name: 'Beden', type: 'select', options: ['34', '36', '38', '40', '42', '44', '46', '48'], required: true },
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Boy', type: 'select', options: ['Mini', 'Midi', 'Maxi'] },
          { name: 'Materyal', type: 'select', options: MATERYAL },
        ],
      },
      {
        name: 'Etek',
        filters: [
          { name: 'Beden', type: 'select', options: ['34', '36', '38', '40', '42', '44'], required: true },
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Boy', type: 'select', options: ['Mini', 'Midi', 'Maxi'] },
        ],
      },
      {
        name: 'Ceket & Mont',
        filters: [
          { name: 'Beden', type: 'select', options: BEDEN, required: true },
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Tip', type: 'select', options: ['Mont', 'Kaban', 'Ceket', 'Yağmurluk', 'Şişme Mont'] },
          { name: 'Cinsiyet', type: 'select', options: CINSIYET },
        ],
      },
      {
        name: 'Ayakkabı',
        filters: [
          { name: 'Numara', type: 'select', options: NUMARA, required: true },
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Tip', type: 'select', options: ['Spor', 'Klasik', 'Bot', 'Sandalet', 'Loafer', 'Terlik'] },
          { name: 'Cinsiyet', type: 'select', options: CINSIYET },
        ],
      },
      {
        name: 'Çanta',
        filters: [
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Tip', type: 'select', options: ['Sırt Çantası', 'El Çantası', 'Omuz Çantası', 'Cüzdan', 'Valiz'] },
          { name: 'Materyal', type: 'select', options: ['Deri', 'Suni Deri', 'Kumaş', 'Naylon'] },
        ],
      },
      {
        name: 'Aksesuar',
        filters: [
          { name: 'Tip', type: 'select', options: ['Kemer', 'Şapka', 'Atkı', 'Eldiven', 'Gözlük', 'Takı', 'Saat'] },
          RENK_F,
          { name: 'Cinsiyet', type: 'select', options: CINSIYET },
        ],
      },
    ],
  },

  // ─── EV & YAŞAM ───────────────────────────────────────────────
  {
    name: 'Ev & Yaşam',
    subCategories: [
      {
        name: 'Mobilya',
        filters: [
          { name: 'Tip', type: 'select', options: ['Koltuk', 'Masa', 'Sandalye', 'Dolap', 'Yatak', 'TV Ünitesi', 'Kitaplık'], required: true },
          { name: 'Materyal', type: 'select', options: ['Ahşap', 'Metal', 'MDF', 'Sunta', 'Cam', 'Kumaş'] },
          RENK_F,
        ],
      },
      {
        name: 'Su Isıtıcısı',
        filters: [
          { name: 'Kapasite', type: 'number', unit: 'L' },
          { name: 'Güç', type: 'number', unit: 'W' },
          RENK_F,
        ],
      },
      {
        name: 'Fritöz',
        filters: [
          { name: 'Tip', type: 'select', options: ['Airfryer', 'Yağlı Fritöz'] },
          { name: 'Kapasite', type: 'number', unit: 'L' },
          { name: 'Güç', type: 'number', unit: 'W' },
        ],
      },
      {
        name: 'Robot Süpürge',
        filters: [
          { name: 'Paspas Özelliği', type: 'boolean' },
          { name: 'Şarj Süresi', type: 'number', unit: 'dk' },
          { name: 'Haritalama', type: 'boolean' },
        ],
      },
      {
        name: 'Aydınlatma',
        filters: [
          { name: 'Tip', type: 'select', options: ['Avize', 'Aplik', 'Masa Lambası', 'Ayaklı Lamba', 'LED Şerit', 'Spot'] },
          { name: 'Ampul', type: 'select', options: ['LED', 'Halojen', 'Akkor'] },
        ],
      },
      {
        name: 'Ev Tekstili',
        filters: [
          { name: 'Tip', type: 'select', options: ['Nevresim', 'Havlu', 'Perde', 'Halı', 'Battaniye', 'Yastık'] },
          RENK_F,
          { name: 'Materyal', type: 'select', options: ['Pamuk', 'Polyester', 'Saten', 'Ranforce', 'Bambu'] },
        ],
      },
      {
        name: 'Mutfak Gereçleri',
        filters: [
          { name: 'Tip', type: 'select', options: ['Tencere', 'Tava', 'Çatal Bıçak', 'Saklama Kabı', 'Bardak', 'Tabak'] },
          { name: 'Materyal', type: 'select', options: ['Çelik', 'Granit', 'Döküm', 'Cam', 'Seramik', 'Plastik'] },
        ],
      },
      {
        name: 'Dekorasyon',
        filters: [
          { name: 'Tip', type: 'select', options: ['Tablo', 'Vazo', 'Ayna', 'Biblo', 'Mum', 'Saat'] },
          RENK_F,
        ],
      },
    ],
  },

  // ─── KOZMETİK ─────────────────────────────────────────────────
  {
    name: 'Kozmetik',
    subCategories: [
      {
        name: 'Erkek Parfüm',
        filters: [
          { name: 'Hacim', type: 'select', options: ['30 ml', '50 ml', '75 ml', '100 ml', '150 ml'], required: true },
          { name: 'Koku Ailesi', type: 'select', options: ['Odunsu', 'Baharatlı', 'Aromatik', 'Fresh', 'Oryantal'] },
        ],
      },
      {
        name: 'Kadın Parfüm',
        filters: [
          { name: 'Hacim', type: 'select', options: ['30 ml', '50 ml', '75 ml', '100 ml', '150 ml'], required: true },
          { name: 'Koku Ailesi', type: 'select', options: ['Çiçeksi', 'Meyvemsi', 'Oryantal', 'Fresh', 'Odunsu'] },
        ],
      },
      {
        name: 'Makyaj',
        filters: [
          { name: 'Ürün', type: 'select', options: ['Fondöten', 'Ruj', 'Maskara', 'Far', 'Allık', 'Kapatıcı', 'Aydınlatıcı'] },
          { name: 'Ton', type: 'text' },
        ],
      },
      {
        name: 'Cilt Bakımı',
        filters: [
          { name: 'Ürün', type: 'select', options: ['Nemlendirici', 'Temizleyici', 'Tonik', 'Güneş Kremi', 'Göz Kremi', 'Maske'] },
          { name: 'Cilt Tipi', type: 'select', options: ['Kuru', 'Yağlı', 'Karma', 'Hassas', 'Normal'] },
        ],
      },
      {
        name: 'Serum',
        filters: [
          { name: 'İçerik', type: 'select', options: ['Hyaluronik Asit', 'C Vitamini', 'Niacinamide', 'Retinol', 'Salisilik Asit'] },
          { name: 'Hacim', type: 'select', options: ['15 ml', '30 ml', '50 ml'] },
        ],
      },
      {
        name: 'Saç Bakımı',
        filters: [
          { name: 'Ürün', type: 'select', options: ['Şampuan', 'Saç Kremi', 'Maske', 'Serum', 'Sprey', 'Boya'] },
          { name: 'Saç Tipi', type: 'select', options: ['Normal', 'Yağlı', 'Kuru', 'Boyalı', 'Kıvırcık'] },
        ],
      },
    ],
  },

  // ─── SPOR & OUTDOOR ───────────────────────────────────────────
  {
    name: 'Spor & Outdoor',
    subCategories: [
      {
        name: 'Koşu',
        filters: [
          { name: 'Numara', type: 'select', options: NUMARA },
          { name: 'Cinsiyet', type: 'select', options: CINSIYET },
          RENK_F,
        ],
      },
      {
        name: 'Fitness',
        filters: [
          { name: 'Ekipman', type: 'select', options: ['Dambıl', 'Halter', 'Direnç Bandı', 'Kettlebell', 'Yoga Matı', 'Barfiks'] },
          { name: 'Ağırlık', type: 'number', unit: 'kg' },
        ],
      },
      {
        name: 'Kamp & Doğa',
        filters: [
          { name: 'Ürün', type: 'select', options: ['Çadır', 'Uyku Tulumu', 'Mat', 'Ocak', 'Termos', 'Sırt Çantası'] },
          { name: 'Kişi Kapasitesi', type: 'number' },
        ],
      },
      {
        name: 'Bisiklet',
        filters: [
          { name: 'Tip', type: 'select', options: ['Dağ', 'Yol', 'Şehir', 'Elektrikli', 'Katlanır', 'Çocuk'] },
          { name: 'Jant', type: 'select', options: ['20"', '24"', '26"', '27.5"', '28"', '29"'] },
        ],
      },
      {
        name: 'Spor Giyim',
        filters: [
          { name: 'Beden', type: 'select', options: BEDEN, required: true },
          { name: 'Renk', type: 'select', options: RENK, required: true },
          { name: 'Tip', type: 'select', options: ['Tişört', 'Şort', 'Tayt', 'Eşofman', 'Sporcu Sütyeni'] },
          { name: 'Cinsiyet', type: 'select', options: CINSIYET },
        ],
      },
      {
        name: 'Outdoor Ayakkabı',
        filters: [
          { name: 'Numara', type: 'select', options: NUMARA, required: true },
          { name: 'Tip', type: 'select', options: ['Trekking', 'Bot', 'Su Geçirmez', 'Trail'] },
          RENK_F,
        ],
      },
    ],
  },

  // ─── ANNE & BEBEK ─────────────────────────────────────────────
  {
    name: 'Anne & Bebek',
    subCategories: [
      {
        name: 'Bebek Bezi',
        filters: [
          { name: 'Beden', type: 'select', options: ['1 Numara (Yeni Doğan)', '2 Numara (Mini)', '3 Numara (Midi)', '4 Numara (Maxi)', '5 Numara (Junior)', '6 Numara (XL)'], required: true },
          { name: 'Adet', type: 'number' },
        ],
      },
      {
        name: 'Bebek Giyim',
        filters: [
          { name: 'Beden', type: 'select', options: ['0-3 Ay', '3-6 Ay', '6-9 Ay', '9-12 Ay', '12-18 Ay', '18-24 Ay', '2-3 Yaş'], required: true },
          RENK_F,
          { name: 'Cinsiyet', type: 'select', options: ['Kız', 'Erkek', 'Unisex'] },
        ],
      },
      {
        name: 'Oyuncak',
        filters: [
          { name: 'Yaş Grubu', type: 'select', options: ['0-1 Yaş', '1-3 Yaş', '3-6 Yaş', '6-9 Yaş', '9+ Yaş'] },
          { name: 'Tür', type: 'select', options: ['Eğitici', 'Peluş', 'Yapı/İnşa', 'Araç', 'Bebek', 'Puzzle'] },
        ],
      },
      {
        name: 'Bebek Bakım',
        filters: [
          { name: 'Ürün', type: 'select', options: ['Islak Mendil', 'Şampuan', 'Krem', 'Pişik Kremi', 'Termometre', 'Biberon'] },
        ],
      },
      {
        name: 'Emzirme & Beslenme',
        filters: [
          { name: 'Ürün', type: 'select', options: ['Biberon', 'Emzik', 'Mama Sandalyesi', 'Göğüs Pompası', 'Mama'] },
        ],
      },
      {
        name: 'Bebek Arabası',
        filters: [
          { name: 'Tip', type: 'select', options: ['Travel Sistem', 'Baston', 'Çift Yönlü', 'İkiz'] },
          RENK_F,
        ],
      },
    ],
  },

  // ─── KİTAP & KIRTASİYE ────────────────────────────────────────
  {
    name: 'Kitap & Kırtasiye',
    subCategories: [
      {
        name: 'Roman',
        filters: [
          { name: 'Tür', type: 'select', options: ['Klasik', 'Polisiye', 'Bilim Kurgu', 'Aşk', 'Tarih', 'Fantastik'] },
          { name: 'Dil', type: 'select', options: ['Türkçe', 'İngilizce', 'Diğer'] },
        ],
      },
      {
        name: 'Kişisel Gelişim',
        filters: [
          { name: 'Konu', type: 'select', options: ['Motivasyon', 'Psikoloji', 'İş & Kariyer', 'Finans', 'İletişim'] },
        ],
      },
      {
        name: 'Çocuk Kitapları',
        filters: [
          { name: 'Yaş Grubu', type: 'select', options: ['0-3 Yaş', '3-6 Yaş', '6-9 Yaş', '9-12 Yaş'] },
          { name: 'Tür', type: 'select', options: ['Masal', 'Boyama', 'Eğitici', 'Hikaye'] },
        ],
      },
      {
        name: 'Kırtasiye',
        filters: [
          { name: 'Ürün', type: 'select', options: ['Defter', 'Kalem', 'Silgi', 'Boya', 'Çanta', 'Cetvel'] },
          RENK_F,
        ],
      },
      {
        name: 'Ofis Malzemeleri',
        filters: [
          { name: 'Ürün', type: 'select', options: ['Dosya', 'Zımba', 'Yapıştırıcı', 'Post-it', 'Toner', 'Hesap Makinesi'] },
        ],
      },
    ],
  },

  // ─── SÜPERMARKET ──────────────────────────────────────────────
  {
    name: 'Süpermarket',
    subCategories: [
      {
        name: 'Atıştırmalık',
        filters: [
          { name: 'Tür', type: 'select', options: ['Cips', 'Çikolata', 'Bisküvi', 'Kuruyemiş', 'Kraker', 'Şekerleme'] },
          { name: 'Gramaj', type: 'number', unit: 'g' },
        ],
      },
      {
        name: 'İçecek',
        filters: [
          { name: 'Tür', type: 'select', options: ['Su', 'Meşrubat', 'Meyve Suyu', 'Kahve', 'Çay', 'Enerji İçeceği'] },
          { name: 'Hacim', type: 'select', options: ['200 ml', '330 ml', '500 ml', '1 L', '1.5 L', '5 L'] },
        ],
      },
      {
        name: 'Temizlik',
        filters: [
          { name: 'Ürün', type: 'select', options: ['Deterjan', 'Yumuşatıcı', 'Bulaşık', 'Yüzey Temizleyici', 'Çamaşır Suyu', 'Kağıt Ürünleri'] },
        ],
      },
      {
        name: 'Kahvaltılık',
        filters: [
          { name: 'Ürün', type: 'select', options: ['Reçel', 'Bal', 'Peynir', 'Zeytin', 'Gevrek', 'Fındık Ezmesi'] },
        ],
      },
      {
        name: 'Kişisel Bakım',
        filters: [
          { name: 'Ürün', type: 'select', options: ['Diş Macunu', 'Sabun', 'Duş Jeli', 'Deodorant', 'Tıraş Ürünleri', 'Ped'] },
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
