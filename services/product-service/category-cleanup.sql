-- ─────────────────────────────────────────────────────────────
-- Kategori temizliği ve birleştirme (tek seferlik, idempotent).
-- Ürünler kategoriye metinle (categoryName / categoryPath) bağlı;
-- FK (categoryId/subCategoryId) kullanılmıyor. Bu yüzden birleştirme
-- metin güncellemesiyle yapılır. Tekrar çalıştırılması güvenlidir.
-- ─────────────────────────────────────────────────────────────
BEGIN;

-- 1) Kopya/çöp ana kategorileri kanonik adlara eşle (source -> target)
CREATE TEMP TABLE cat_alias(src text PRIMARY KEY, dst text) ON COMMIT DROP;
INSERT INTO cat_alias(src, dst) VALUES
  ('Giyim',                                 'Moda'),
  ('Moda - Aksesuar',                       'Moda'),
  ('Saat Gözlük Aksesuarları',              'Moda'),
  ('Anne Bebek Ürünleri & Oyuncak',         'Anne & Bebek'),
  ('Kozmetik Kişisel Bakım',                'Kozmetik'),
  ('Spor Outdoor Ürünleri',                 'Spor & Outdoor'),
  ('Ev Dekorasyon',                         'Ev & Yaşam'),
  ('Ev Elektronik Ürünleri',               'Ev & Yaşam'),
  ('Beyaz Eşya Mutfak Ürünleri',            'Ev & Yaşam'),
  ('Yapı Market Bahçe Oto',                 'Ev & Yaşam'),
  ('Telefonlar & Aksesuarlar',              'Elektronik'),
  ('Bilgisayar Sistemleri ve Ekipmanları',  'Elektronik'),
  ('Foto Kameraları',                       'Elektronik'),
  ('Hobi Oyun Konsolları',                  'Elektronik'),
  ('Kitaplar Filmler Müzikler',             'Kitap & Kırtasiye'),
  ('Kırtasiye Ofis Ürünleri',               'Kitap & Kırtasiye');

-- 2) Ürünlerin categoryName ve categoryPath önekini kanonik ada taşı
UPDATE products p SET "categoryName" = a.dst
FROM cat_alias a WHERE p."categoryName" = a.src;

UPDATE products p SET "categoryPath" = a.dst || substring(p."categoryPath" from length(a.src) + 1)
FROM cat_alias a
WHERE p."categoryPath" = a.src OR p."categoryPath" LIKE a.src || ' >%';

-- 3) categoryName ile categoryPath ana segmenti çelişiyorsa yola göre düzelt
--    ("Nike" ürünü: categoryName=Elektronik ama path=Moda > Ayakkabı)
UPDATE products
SET "categoryName" = trim(split_part("categoryPath", '>', 1))
WHERE "categoryPath" <> '' AND "categoryName" <> trim(split_part("categoryPath", '>', 1));

-- 4) 3 kademeli/ara "Üst Giyim" gibi yolları sadeleştir:
--    "Moda > Üst Giyim > X" -> "Moda > X"
UPDATE products
SET "categoryPath" = regexp_replace("categoryPath", ' > Üst Giyim > ', ' > ')
WHERE "categoryPath" LIKE '% > Üst Giyim > %';
--    "Moda > Erkek > X" / "Moda > Kadın > X" -> "Moda > X" (cinsiyet ara kademesi)
UPDATE products
SET "categoryPath" = regexp_replace("categoryPath", ' > (Erkek|Kadın|Unisex) > ', ' > ')
WHERE "categoryPath" ~ ' > (Erkek|Kadın|Unisex) > ';

-- 4b) 2'den fazla kademeli tüm yolları "Ana > Yaprak" biçimine indir.
--     ("Elektronik > Telefon > Cep Telefonu" -> "Elektronik > Cep Telefonu";
--      böylece alt kategori doğru yaprak olur ve şablon eşleşir.)
UPDATE products
SET "categoryPath" =
      trim(split_part("categoryPath", '>', 1)) || ' > ' ||
      trim(reverse(split_part(reverse("categoryPath"), '>', 1)))
WHERE (length("categoryPath") - length(replace("categoryPath", '>', ''))) >= 2;

-- 5) Alias kaynak alt kategorilerini hedefe taşı (ad çakışması yoksa), sonra sil
--    Önce hedefte aynı ada sahip alt kategori varsa kaynaktakini sil
DELETE FROM sub_categories sc
USING cat_alias a, categories src, categories dst
WHERE sc."categoryId" = src.id AND src.name = a.src AND dst.name = a.dst
  AND EXISTS (SELECT 1 FROM sub_categories s2 WHERE s2."categoryId" = dst.id AND s2.name = sc.name);
--    Kalanları hedefe taşı
UPDATE sub_categories sc SET "categoryId" = dst.id
FROM cat_alias a, categories src, categories dst
WHERE sc."categoryId" = src.id AND src.name = a.src AND dst.name = a.dst;

-- 6) Alias kaynak ana kategorilerini sil
DELETE FROM categories c USING cat_alias a WHERE c.name = a.src;

-- 7) Kanonik OLMAYAN + hiç ürünü olmayan + alt kategorisi olmayan boş kategorileri sil
--    (Kanonik set korunur; XML Katalog gibi boş fallback'ler temizlenir)
DELETE FROM categories c
WHERE c.name NOT IN (
    'Elektronik','Moda','Ev & Yaşam','Kozmetik',
    'Anne & Bebek','Spor & Outdoor','Kitap & Kırtasiye','Süpermarket'
  )
  AND NOT EXISTS (SELECT 1 FROM sub_categories sc WHERE sc."categoryId" = c.id)
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p."categoryName" = c.name);

-- 8) Kanonik olmayan + hiç ürünü olmayan çöp/kopya alt kategorileri sil
--    (ör. Elektronik > Telefon → Cep Telefonu var; Kozmetik > Parfüm →
--     Erkek/Kadın Parfüm var; Moda > Üst Giyim belirsiz)
DELETE FROM sub_categories sc USING categories c
WHERE sc."categoryId" = c.id
  AND (c.name || ' > ' || sc.name) IN (
    'Elektronik > Telefon',
    'Kozmetik > Parfüm',
    'Moda > Üst Giyim'
  )
  AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p."categoryPath" = c.name || ' > ' || sc.name
  );

COMMIT;

-- Sonuç
SELECT c.name AS ana, count(sc.id) AS alt,
  (SELECT count(*) FROM products p WHERE p."categoryName" = c.name) AS urun
FROM categories c LEFT JOIN sub_categories sc ON sc."categoryId" = c.id
GROUP BY c.name ORDER BY c.name;
