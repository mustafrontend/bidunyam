import { XMLParser, XMLValidator } from 'fast-xml-parser';
import fs from 'fs';
import sax from 'sax';
import { Readable } from 'stream';

export interface ProductXML {
  urunKodu?: string;
  urunAdi?: string;
  kategori?: string;
  altKategori?: string;
  fiyat?: string | number;
  listeFiyati?: string | number;
  alisFiyati?: string | number;
  stok?: string | number;
  aciklama?: string;
  resim?: string;
  marka?: string;
  tax?: string | number;
  desi?: string | number;
  categoryAttributes?: Record<string, string>;
}

export function normalizeKeys(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(normalizeKeys);
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = key.toLowerCase().replace(/[-_ ]/g, '');
    result[normalizedKey] = typeof value === 'object' && value !== null ? normalizeKeys(value) : value;
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// Dinamik alan sözlüğü — anahtarlar normalize edilmiş haldedir
// (küçük harf, "-_ " karakterleri atılmış). Sıra önceliği belirler.
// ─────────────────────────────────────────────────────────────
export const FIELD_ALIASES: Record<string, string[]> = {
  urunKodu: [
    'barkod', 'barkodno', 'barcode', 'gtin', 'ean', 'productcode', 'urunkodu',
    'stokkodu', 'sku', 'kod', 'code', 'productid', 'urunid', 'id',
  ],
  urunAdi: [
    'urunadi', 'urunismi', 'urunad', 'name', 'productname', 'title', 'baslik',
    'ad', 'urun', 'productitle', 'stokadi',
  ],
  kategori: [
    'kategori', 'kategoriadi', 'kategoriismi', 'category', 'categoryname',
    'anakategori', 'maincategory', 'kategoriler', 'categories', 'kategoriyolu',
    'categorypath', 'kategoritree', 'cat',
  ],
  altKategori: [
    'altkategori', 'altkategoriadi', 'subcategory', 'subcategoryname', 'altkat',
  ],
  fiyat: [
    'satisfiyati', 'satisfiyat', 'indirimlifiyat', 'kampanyalifiyat', 'fiyat',
    'fiyati', 'price', 'saleprice', 'urunfiyati', 'tutar', 'perakendefiyati',
  ],
  listeFiyati: [
    'listefiyati', 'listefiyat', 'piyasafiyati', 'etiketfiyati', 'oldprice',
    'listprice', 'marketprice', 'psf',
  ],
  alisFiyati: ['alisfiyati', 'bayifiyat', 'bayifiyati', 'costprice', 'maliyet'],
  stok: [
    'stok', 'stokadedi', 'stokadet', 'stokmiktari', 'stock', 'quantity', 'qty',
    'adet', 'miktar', 'stockquantity', 'stokdurumu',
  ],
  aciklama: [
    'aciklama', 'urunaciklamasi', 'detay', 'detail', 'description', 'aciklamasi',
    'icerik', 'content', 'info', 'ozellik',
  ],
  resim: [
    'resim', 'resim1', 'resimlink', 'resimurl', 'image', 'image1', 'imageurl',
    'gorsel', 'gorsel1', 'picture', 'photo', 'img', 'anaresim', 'resimler', 'images',
  ],
  marka: ['marka', 'markaadi', 'brand', 'brandname', 'manufacturer', 'uretici'],
  tax: ['kdv', 'kdvorani', 'kdvoran', 'tax', 'taxrate', 'vergi', 'vat'],
  desi: ['desi', 'agirlik', 'weight', 'kg', 'hacim', 'volume'],
};

/**
 * Türkçe/İngiliz sayı formatlarını doğru çözer.
 *  "1.299,00" → 1299     "1,299.00" → 1299
 *  "1299,50"  → 1299.5   "1.299"    → 1299 (binlik)
 *  "149,90 TL"→ 149.9
 * Son görülen ayraç ondalık kabul edilir; diğerleri binlik olarak atılır.
 */
export function parseDecimal(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined) return 0;

  let s = String(value).trim().replace(/[^\d.,-]/g, '');
  if (!s) return 0;

  const negative = s.startsWith('-');
  s = s.replace(/-/g, '');

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    // İki ayraç da var → sonuncusu ondalık
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (lastComma > -1) {
    // Sadece virgül: 3 hane takip ediyorsa binlik ("1,299"), değilse ondalık ("149,90")
    const decimals = s.length - lastComma - 1;
    s = decimals === 3 && s.indexOf(',') === lastComma
      ? s.replace(/,/g, '')
      : s.replace(',', '.');
  } else if (lastDot > -1) {
    // Sadece nokta: 3 hane takip ediyorsa binlik ("1.299"), değilse ondalık ("149.90")
    const decimals = s.length - lastDot - 1;
    if (decimals === 3 && s.indexOf('.') === lastDot) s = s.replace(/\./g, '');
  }

  const parsed = parseFloat(s);
  if (!Number.isFinite(parsed)) return 0;
  return negative ? -parsed : parsed;
}

export class XMLParserService {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      parseTagValue: true,
      removeNSPrefix: false,
      stopNodes: ['urun.content'],
    });
  }

  /**
   * Büyük XML'ler (MEY İTHALAT vb.) için SAX Stream tabanlı parser
   * Belleği şişirmeden tag bazlı okuma yapar.
   * Ek olarak, dinamik alan eşleştirme (fieldMapping) destekler.
   */
  async parseXMLStream(stream: Readable, fieldMapping?: Record<string, string>): Promise<ProductXML[]> {
    return new Promise((resolve, reject) => {
      const saxStream = sax.createStream(true, { trim: false, normalize: false });
      const products: ProductXML[] = [];

      let currentProduct: Record<string, string> | null = null;
      let currentTag: string | null = null;
      let tagText: string = '';

      const isProductTag = (name: string) => {
        const lower = name.toLowerCase();
        return lower === 'product' || lower === 'urun' || lower === 'item';
      };

      saxStream.on('opentag', (node) => {
        if (isProductTag(node.name)) {
          currentProduct = {};
        }
        currentTag = node.name;
        tagText = '';
      });

      saxStream.on('text', (text) => {
        if (currentTag && currentProduct) {
          tagText += text;
        }
      });

      saxStream.on('cdata', (text) => {
        if (currentTag && currentProduct) {
          tagText += text;
        }
      });

      saxStream.on('closetag', (name) => {
        if (isProductTag(name)) {
          if (currentProduct) {
            const mapped = this.applyFieldMapping(currentProduct, fieldMapping);
            if (products.length === 0) {
              // Attach raw product to the very first product for UI preview
              (mapped as any)._rawProduct = currentProduct;
            }
            products.push(mapped);
          }
          currentProduct = null;
        } else if (currentProduct && currentTag === name) {
          const key = currentTag.toLowerCase().replace(/[-_ ]/g, '');
          const cleanText = tagText.trim();
          
          // Çoklu resim desteği (image1, image2, image3 vb.)
          if (key.startsWith('image') || key.startsWith('resim')) {
            if (!currentProduct['resim']) {
              currentProduct['resim'] = cleanText;
            } else {
              // Resimleri virgülle ayırarak ekleyelim
              currentProduct['resim'] += ',' + cleanText;
            }
          } else if (!currentProduct[key]) {
            currentProduct[key] = cleanText;
          }
        }
        currentTag = null;
        tagText = '';
      });

      saxStream.on('error', (e) => {
        reject(new Error(`XML Stream Parse Hatası: ${e.message}`));
      });

      saxStream.on('end', () => {
        resolve(products);
      });

      stream.pipe(saxStream);
    });
  }

  private cleanImageUrl(val: string | undefined): string | undefined {
    if (!val) return undefined;
    // Split by comma and take the first valid URL, then remove any trailing non-url characters
    const firstUrl = val.split(',')[0].trim();
    return firstUrl || undefined;
  }

  private extractAttributes(raw: Record<string, string>, consumedKeys: string[]): Record<string, string> {
    // Bilinen tüm alan alias'ları özellik olarak sızmamalı (fiyat/isim/stok varyantları vb.)
    const knownKeys = new Set<string>([...consumedKeys, ...Object.values(FIELD_ALIASES).flat()]);
    // Teknik/gürültü alanlar
    const noise = /^(_|xml|link|url|guid|updated|created|tarih|date|sira|order|active|aktif|durum)/i;

    const attributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (knownKeys.has(key)) continue;
      if (noise.test(key)) continue;
      if (typeof value !== 'string') continue;
      const v = value.trim();
      // Kısa ve anlamlı değerler özellik olabilir (Renk, Beden, Materyal…)
      if (v.length === 0 || v.length > 60) continue;
      if (/^https?:\/\//i.test(v)) continue;
      const cleanKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      attributes[cleanKey] = v;
    }
    return attributes;
  }

  /**
   * Stream dışı (tüm dosyayı okuyan) parse yolu için eşleme.
   * Aynı dinamik alan sözlüğünü kullanır — tek kaynak.
   */
  private mapProduct(raw: Record<string, string>, fieldMapping?: Record<string, string>): ProductXML {
    return this.applyFieldMapping(raw, fieldMapping);
  }

  /**
   * Dinamik eşleştirmeleri uygular
   */
  /**
   * Tek dinamik eşleme yolu: önce kullanıcının seçtiği alan, yoksa alias sözlüğü.
   * (Eşleme verilse de verilmese de aynı mantık çalışır.)
   */
  private applyFieldMapping(raw: Record<string, string>, fieldMapping?: Record<string, string>): ProductXML {
    const consumedKeys: string[] = [];
    const mapping = fieldMapping || {};

    const resolve = (field: string): string | undefined => {
      // 1) Kullanıcının açıkça seçtiği XML etiketi
      const chosen = mapping[field];
      if (chosen && String(chosen).trim() !== '') {
        const normKey = String(chosen).toLowerCase().replace(/[-_ ]/g, '');
        if (raw[normKey] !== undefined && String(raw[normKey]).trim() !== '') {
          consumedKeys.push(normKey);
          return String(raw[normKey]).trim();
        }
      }
      // 2) Alias sözlüğünden otomatik tespit
      for (const alias of FIELD_ALIASES[field] || []) {
        if (raw[alias] !== undefined && String(raw[alias]).trim() !== '') {
          consumedKeys.push(alias);
          return String(raw[alias]).trim();
        }
      }
      return undefined;
    };

    // Kategori: "Ana > Alt" yolu ya da ayrı alt kategori alanı desteklenir
    const kategoriRaw = resolve('kategori');
    const altKategori = resolve('altKategori');

    return {
      urunKodu: resolve('urunKodu'),
      urunAdi: resolve('urunAdi'),
      kategori: kategoriRaw,
      altKategori,
      fiyat: resolve('fiyat'),
      listeFiyati: resolve('listeFiyati'),
      alisFiyati: resolve('alisFiyati'),
      stok: resolve('stok'),
      aciklama: resolve('aciklama'),
      resim: this.cleanImageUrl(resolve('resim')),
      marka: resolve('marka'),
      tax: resolve('tax'),
      desi: resolve('desi'),
      categoryAttributes: this.extractAttributes(raw, consumedKeys),
    };
  }

  validateXML(xmlContent: string): { isValid: boolean; error?: string } {
    const validation = XMLValidator.validate(xmlContent);
    if (validation !== true) {
      return { isValid: false, error: `XML Validation Error: ${JSON.stringify(validation)}` };
    }
    return { isValid: true };
  }

  async parseXMLFile(filePath: string): Promise<ProductXML[]> {
    try {
      const stream = fs.createReadStream(filePath);
      const products = await this.parseXMLStream(stream);
      if (products.length === 0) {
        throw new Error('XML dosyasında ürün bulunamadı');
      }
      return products;
    } catch (error: any) {
      throw new Error(`XML Parse Error: ${error.message}`);
    }
  }

  parseXMLString(xmlContent: string): ProductXML[] {
    try {
      const validation = this.validateXML(xmlContent);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      const parsed = this.parser.parse(xmlContent);
      const products = this.extractProducts(parsed);
      if (products.length === 0) {
        throw new Error('XML dosyasında ürün bulunamadı');
      }
      return products;
    } catch (error: any) {
      throw new Error(`XML Parse Error: ${error.message}`);
    }
  }

  private extractProducts(parsed: any): ProductXML[] {
    // Geriye dönük uyumluluk için eski metodu koruyoruz
    const toArray = (val: any) => val ? (Array.isArray(val) ? val : [val]) : [];
    const looksLikeProduct = (val: any) => {
      const n = normalizeKeys(val);
      return Boolean(n.urunkodu || n.urunadi || n.barkodno || n.fiyat || n.price || n.stock || n.stok);
    };

    const rootCandidates = [parsed, parsed.root, parsed.ROOT, parsed.catalog, parsed.urunler, parsed.products].filter(Boolean);
    for (const root of rootCandidates) {
      const nestedUrun = toArray(root.urunler?.urun || root.urunler?.Urun);
      if (nestedUrun.length > 0) return nestedUrun.map((p: any) => this.mapProduct(normalizeKeys(p)));

      const nestedProduct = toArray(root.products?.product || root.products?.Product);
      if (nestedProduct.length > 0) return nestedProduct.map((p: any) => this.mapProduct(normalizeKeys(p)));

      for (const key of Object.keys(root)) {
        const val = root[key];
        if (Array.isArray(val) && val.length > 0 && looksLikeProduct(val[0])) {
          return val.map((p: any) => this.mapProduct(normalizeKeys(p)));
        }
      }
    }
    return [];
  }

  validateProduct(product: ProductXML, index: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!product.urunKodu || String(product.urunKodu).trim() === '') {
      errors.push(`Ürün ${index + 1}: Ürün kodu gereklidir`);
    }
    if (!product.urunAdi || String(product.urunAdi).trim() === '') {
      errors.push(`Ürün ${index + 1}: Ürün adı gereklidir`);
    }

    const fiyat = parseFloat(String(product.fiyat || '0'));
    if (isNaN(fiyat) || fiyat < 0) {
      errors.push(`Ürün ${index + 1}: Fiyat geçerli bir sayı olmalıdır`);
    }

    const stok = parseInt(String(product.stok || '0'), 10);
    if (isNaN(stok) || stok < 0) {
      errors.push(`Ürün ${index + 1}: Stok geçerli bir sayı olmalıdır`);
    }

    if (product.urunAdi && String(product.urunAdi).length > 255) {
      errors.push(`Ürün ${index + 1}: Ürün adı en fazla 255 karakter olabilir`);
    }

    return { isValid: errors.length === 0, errors };
  }

  validateProducts(products: ProductXML[]): { isValid: boolean; errors: Record<number, string[]> } {
    const errors: Record<number, string[]> = {};
    products.forEach((product, index) => {
      const validation = this.validateProduct(product, index);
      if (!validation.isValid) {
        errors[index] = validation.errors;
      }
    });
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  generateSampleXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <urunler>
    <urun>
      <urunKodu>SKU-001</urunKodu>
      <urunAdi>Ürün Adı 1</urunAdi>
      <kategori>Elektronik</kategori>
      <fiyat>299.99</fiyat>
      <stok>100</stok>
      <aciklama>Ürün açıklaması</aciklama>
      <resim>https://example.com/image1.jpg</resim>
      <marka>Marka Adı</marka>
    </urun>
  </urunler>
</root>`;
  }
}

export const xmlParserService = new XMLParserService();
