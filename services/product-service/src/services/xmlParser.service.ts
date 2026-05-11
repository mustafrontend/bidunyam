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
  urunler?: ProductXML | ProductXML[];
}

export class XMLParserService {
  private parser: XMLParser;

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
      
      // Extract products array
      let products: ProductXML[] = [];
      if (parsed.urunler) {
        products = Array.isArray(parsed.urunler)
          ? parsed.urunler
          : [parsed.urunler];
      }

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
      
      let products: ProductXML[] = [];
      if (parsed.urunler) {
        products = Array.isArray(parsed.urunler)
          ? parsed.urunler
          : [parsed.urunler];
      }

      if (products.length === 0) {
        throw new Error('XML dosyasında ürün bulunamadı');
      }

      return products;
    } catch (error: any) {
      throw new Error(`XML Parse Error: ${error.message}`);
    }
  }

  /**
   * Ürün verisini validate et
   */
  validateProduct(product: ProductXML, index: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!product.urunKodu || String(product.urunKodu).trim() === '') {
      errors.push(`Ürün ${index + 1}: urunKodu gereklidir`);
    }
    if (!product.urunAdi || String(product.urunAdi).trim() === '') {
      errors.push(`Ürün ${index + 1}: urunAdi gereklidir`);
    }

    // Numeric validations
    const fiyat = parseFloat(String(product.fiyat || '0'));
    if (isNaN(fiyat) || fiyat < 0) {
      errors.push(`Ürün ${index + 1}: fiyat geçerli bir sayı olmalıdır`);
    }

    const stok = parseInt(String(product.stok || '0'), 10);
    if (isNaN(stok) || stok < 0) {
      errors.push(`Ürün ${index + 1}: stok geçerli bir sayı olmalıdır`);
    }

    // Length validations
    if (product.urunAdi && String(product.urunAdi).length > 255) {
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
