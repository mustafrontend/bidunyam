import { XMLParser, XMLValidator } from 'fast-xml-parser';
import fs from 'fs';
import sax from 'sax';
import { Readable } from 'stream';

export interface ProductXML {
  urunKodu?: string;
  urunAdi?: string;
  kategori?: string;
  fiyat?: string | number;
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
    const attributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (!consumedKeys.includes(key) && typeof value === 'string' && value.length < 100 && value.length > 0) {
        // Simple heuristic: tags < 100 chars might be variants/attributes (like Renk, Beden)
        const cleanKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // e.g. "renk" -> "Renk"
        attributes[cleanKey] = value;
      }
    }
    return attributes;
  }

  /**
   * MEY İTHALAT ve Genel formatlar için Mapping
   */
  private mapProduct(raw: Record<string, string>): ProductXML {
    const consumedKeys: string[] = [];
    const getVal = (keys: string[]) => {
      for (const k of keys) {
        if (raw[k]) {
          consumedKeys.push(k);
          return raw[k];
        }
      }
      return undefined;
    };

    return {
      urunKodu: getVal(['productcode', 'urunkodu', 'barcode', 'barkod', 'sku', 'barkodno']),
      urunAdi: getVal(['name', 'urunadi', 'title', 'productname']),
      kategori: getVal(['category', 'kategori']),
      fiyat: getVal(['price', 'fiyat', 'bayifiyat', 'alisfiyati']),
      stok: getVal(['quantity', 'stok', 'stock', 'qty']),
      aciklama: getVal(['detail', 'aciklama', 'description']),
      resim: this.cleanImageUrl(getVal(['resim', 'image', 'image1'])),
      marka: getVal(['brand', 'marka']),
      tax: getVal(['tax', 'kdvorani']),
      desi: getVal(['desi']),
      categoryAttributes: this.extractAttributes(raw, consumedKeys),
    };
  }

  /**
   * Dinamik eşleştirmeleri uygular
   */
  private applyFieldMapping(raw: Record<string, string>, fieldMapping?: Record<string, string>): ProductXML {
    if (!fieldMapping || Object.keys(fieldMapping).length === 0) {
      return this.mapProduct(raw);
    }

    const consumedKeys: string[] = [];

    const resolveField = (mappedKey: string | undefined, defaultAliases: string[]) => {
      if (mappedKey && mappedKey.trim() !== '') {
        const normKey = mappedKey.toLowerCase().replace(/[-_ ]/g, '');
        if (raw[normKey]) {
          consumedKeys.push(normKey);
          return raw[normKey];
        }
      }
      for (const alias of defaultAliases) {
        if (raw[alias]) {
          consumedKeys.push(alias);
          return raw[alias];
        }
      }
      return undefined;
    };

    return {
      urunKodu: resolveField(fieldMapping.urunKodu, ['productcode', 'urunkodu', 'barcode', 'barkod', 'sku', 'barkodno']),
      urunAdi: resolveField(fieldMapping.urunAdi, ['name', 'urunadi', 'title', 'productname']),
      kategori: resolveField(fieldMapping.kategori, ['category', 'kategori']),
      fiyat: resolveField(fieldMapping.fiyat, ['price', 'fiyat', 'bayifiyat', 'alisfiyati']),
      stok: resolveField(fieldMapping.stok, ['quantity', 'stok', 'stock', 'qty']),
      aciklama: resolveField(fieldMapping.aciklama, ['detail', 'aciklama', 'description']),
      resim: this.cleanImageUrl(resolveField(fieldMapping.resim, ['resim', 'image', 'image1'])),
      marka: resolveField(fieldMapping.marka, ['brand', 'marka']),
      tax: resolveField(fieldMapping.tax, ['tax', 'kdvorani']),
      desi: resolveField(fieldMapping.desi, ['desi']),
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
