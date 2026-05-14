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

export class XMLParserService {
  private parser: XMLParser;

  private toArray<T>(value: T | T[] | undefined): T[] {
    if (!value) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }

  private looksLikeProduct(value: any): value is ProductXML {
    if (!value || typeof value !== 'object') {
      return false;
    }

    return Boolean(
      value.urunKodu ||
      value.urunAdi ||
      value.urun_adi ||
      value.barkodno ||
      value.fiyat ||
      value.bayifiyat
    );
  }

  private extractProducts(parsed: ParsedXMLData): ProductXML[] {
    // Common structure: <urunler><urun>...</urun></urunler>
    const nestedUnderUrunler = this.toArray((parsed.urunler as any)?.urun);
    if (nestedUnderUrunler.length > 0) {
      return nestedUnderUrunler;
    }

    // Alternate structure: <root><urunler><urun>...</urun></urunler></root>
    const nestedUnderRoot = this.toArray(parsed.root?.urunler?.urun);
    if (nestedUnderRoot.length > 0) {
      return nestedUnderRoot;
    }

    // Flat structure: <urunler>...</urunler> where urunler may already be array/object
    const flatUrunler = this.toArray(parsed.urunler);
    if (flatUrunler.length > 0 && this.looksLikeProduct(flatUrunler[0])) {
      return flatUrunler;
    }

    // Fallback structure: <urun>...</urun>
    const directUrun = this.toArray(parsed.urun);
    if (directUrun.length > 0) {
      return directUrun;
    }

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

    // Flexible field mapping - Birden fazla format desteği
    const urunAdi = product.urunAdi || (product as any).urun_adi;
    const urunKodu = product.urunKodu || (product as any).barkodno;
    const fiyatStr = String(product.fiyat || (product as any).bayifiyat || '0');
    const stokStr = String(product.stok || '0');

    // Required fields
    if (!urunKodu || String(urunKodu).trim() === '') {
      errors.push(`Ürün ${index + 1}: urunKodu/barkodno gereklidir`);
    }
    if (!urunAdi || String(urunAdi).trim() === '') {
      errors.push(`Ürün ${index + 1}: urunAdi gereklidir`);
    }

    // Numeric validations
    const fiyat = parseFloat(fiyatStr);
    if (isNaN(fiyat) || fiyat < 0) {
      errors.push(`Ürün ${index + 1}: fiyat geçerli bir sayı olmalıdır`);
    }

    const stok = parseInt(stokStr, 10);
    if (isNaN(stok) || stok < 0) {
      errors.push(`Ürün ${index + 1}: stok geçerli bir sayı olmalıdır`);
    }

    // Length validations
    if (urunAdi && String(urunAdi).length > 255) {
      errors.push(`Ürün ${index + 1}: urunAdi en fazla 255 karakter olabilir`);
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
