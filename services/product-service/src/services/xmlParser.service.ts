import { XMLParser, XMLValidator } from 'fast-xml-parser';
import fs from 'fs';

interface ProductXML {
  urunKodu?: string;
  urunAdi?: string;
  kategori?: string;
  fiyat?: string | number;
  stok?: string | number;
  aciklama?: string;
  resim?: string;
  marka?: string;
}

interface ParsedXMLData {
  root?: {
    urunler?: {
      urun?: ProductXML | ProductXML[];
    };
  };
  urunler?: ProductXML | ProductXML[];
  urun?: ProductXML | ProductXML[];
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

  private toArray<T>(value: T | T[] | undefined): T[] {
    if (!value) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }

  private looksLikeProduct(value: any): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const normalized = normalizeKeys(value);
    return Boolean(
      normalized.urunkodu ||
      normalized.urunadi ||
      normalized.barkodno ||
      normalized.fiyat ||
      normalized.bayifiyat ||
      normalized.price ||
      normalized.stock ||
      normalized.stok
    );
  }

  private extractProducts(parsed: ParsedXMLData): ProductXML[] {
    if (!parsed || typeof parsed !== 'object') return [];

    // Let's check common root tags
    const rootCandidates = [
      parsed,
      (parsed as any).root,
      (parsed as any).ROOT,
      (parsed as any).catalog,
      (parsed as any).Catalog,
      (parsed as any).urunler,
      (parsed as any).products,
    ].filter(Boolean);

    for (const root of rootCandidates) {
      // Check urunler.urun / products.product / items.item variations
      const nestedUrun = this.toArray(root.urunler?.urun || root.urunler?.Urun || root.Urunler?.Urun);
      if (nestedUrun.length > 0) return nestedUrun;

      const nestedProduct = this.toArray(root.products?.product || root.products?.Product || root.Products?.Product);
      if (nestedProduct.length > 0) return nestedProduct;

      const nestedItem = this.toArray(root.items?.item || root.items?.Item || root.Items?.Item);
      if (nestedItem.length > 0) return nestedItem;

      // Flat direct arrays under keys
      for (const key of Object.keys(root)) {
        const val = root[key];
        if (Array.isArray(val) && val.length > 0 && this.looksLikeProduct(val[0])) {
          return val;
        }
        // If it's a direct object list like <urun>...</urun> under root
        if ((key === 'urun' || key === 'product' || key === 'item') && val) {
          return this.toArray(val);
        }
      }
    }

    // Direct fallbacks
    const directUrun = this.toArray(parsed.urun || (parsed as any).Urun);
    if (directUrun.length > 0) return directUrun;

    const directProduct = this.toArray((parsed as any).product || (parsed as any).Product);
    if (directProduct.length > 0) return directProduct;

    return [];
  }

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      parseTagValue: true,
      removeNSPrefix: false,
      stopNodes: ['urun.content'], // Prevent parsing large content
    });
  }

  /**
   * Validate XML struktur
   */
  validateXML(xmlContent: string): { isValid: boolean; error?: string } {
    const validation = XMLValidator.validate(xmlContent);
    
    if (validation !== true) {
      return {
        isValid: false,
        error: `XML Validation Error: ${JSON.stringify(validation)}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Parse XML dosyasını oku
   */
  async parseXMLFile(filePath: string): Promise<ProductXML[]> {
    try {
      const xmlContent = fs.readFileSync(filePath, 'utf-8');
      
      // Validation
      const validation = this.validateXML(xmlContent);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Parse
      const parsed: ParsedXMLData = this.parser.parse(xmlContent);
      const products = this.extractProducts(parsed);

      if (products.length === 0) {
        throw new Error('XML dosyasında ürün bulunamadı');
      }

      return products;
    } catch (error: any) {
      throw new Error(`XML Parse Error: ${error.message}`);
    }
  }

  /**
   * XML metinini doğrudan parse et
   */
  parseXMLString(xmlContent: string): ProductXML[] {
    try {
      const validation = this.validateXML(xmlContent);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const parsed: ParsedXMLData = this.parser.parse(xmlContent);
      const products = this.extractProducts(parsed);

      if (products.length === 0) {
        throw new Error('XML dosyasında ürün bulunamadı');
      }

      return products;
    } catch (error: any) {
      throw new Error(`XML Parse Error: ${error.message}`);
    }
  }

  /**
   * Ürün verisini validate et (Birden fazla format desteği)
   */
  validateProduct(product: ProductXML, index: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const normalized = normalizeKeys(product);

    // Flexible field mapping - Casing and alias normalization
    const urunAdi = normalized.urunadi || normalized.name || normalized.title || normalized.productname;
    const urunKodu = normalized.urunkodu || normalized.barkodno || normalized.barcode || normalized.sku || normalized.productcode;
    const fiyatStr = String(normalized.fiyat || normalized.bayifiyat || normalized.price || normalized.fiyati || '0');
    const stokStr = String(normalized.stok || normalized.stock || normalized.quantity || normalized.qty || '0');

    // Required fields
    if (!urunKodu || String(urunKodu).trim() === '') {
      errors.push(`Ürün ${index + 1}: Ürün kodu (urunKodu/barkodno/barcode) gereklidir`);
    }
    if (!urunAdi || String(urunAdi).trim() === '') {
      errors.push(`Ürün ${index + 1}: Ürün adı (urunAdi/name) gereklidir`);
    }

    // Numeric validations
    const fiyat = parseFloat(fiyatStr);
    if (isNaN(fiyat) || fiyat < 0) {
      errors.push(`Ürün ${index + 1}: Fiyat geçerli bir sayı olmalıdır`);
    }

    const stok = parseInt(stokStr, 10);
    if (isNaN(stok) || stok < 0) {
      errors.push(`Ürün ${index + 1}: Stok geçerli bir sayı olmalıdır`);
    }

    // Length validations
    if (urunAdi && String(urunAdi).length > 255) {
      errors.push(`Ürün ${index + 1}: Ürün adı en fazla 255 karakter olabilir`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Tüm ürünleri validate et
   */
  validateProducts(products: ProductXML[]): { isValid: boolean; errors: Record<number, string[]> } {
    const errors: Record<number, string[]> = {};

    products.forEach((product, index) => {
      const validation = this.validateProduct(product, index);
      if (!validation.isValid) {
        errors[index] = validation.errors;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * XML formatında örnek dosya oluştur
   */
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
    <urun>
      <urunKodu>SKU-002</urunKodu>
      <urunAdi>Ürün Adı 2</urunAdi>
      <kategori>Giyim</kategori>
      <fiyat>149.99</fiyat>
      <stok>50</stok>
      <aciklama>Başka bir ürün açıklaması</aciklama>
      <resim>https://example.com/image2.jpg</resim>
      <marka>Diğer Marka</marka>
    </urun>
  </urunler>
</root>`;
  }
}

export const xmlParserService = new XMLParserService();
