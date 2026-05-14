import fs from 'fs';
import path from 'path';

export interface XmlCatalogProduct {
  _id: string;
  sourceType: 'XML_REQUEST';
  requestId: string;
  name: string;
  barcode: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  imageUrl: string;
  brand: string;
  category: string;
  stock: number;
  rating: number;
  reviewCount: number;
}

export interface PublishRequestMeta {
  requestId: string;
  sourceUrl: string;
  xmlFileName: string;
  status: 'PUBLISHED';
  createdAt: string;
  totalProducts: number;
}

interface PersistedState {
  activeRequestId?: string;
  requests: PublishRequestMeta[];
  productsByRequest: Record<string, XmlCatalogProduct[]>;
}

interface CatalogQuery {
  page: number;
  limit: number;
  category?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

const MAX_REQUEST_HISTORY = 3;

class XmlCatalogService {
  private state: PersistedState = {
    requests: [],
    productsByRequest: {},
  };

  private readonly storageFilePath: string | null;

  constructor() {
    this.storageFilePath = this.resolveStoragePath();
    this.loadState();
  }

  publishProducts(input: { products: any[]; sourceUrl: string; xmlFileName: string }): PublishRequestMeta {
    const requestId = `xml-req-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const mappedProducts = input.products
      .map((item: any, index: number) => this.toCatalogProduct(item, requestId, index))
      .filter((item) => item.stock > 0 && item.price >= 0);

    const meta: PublishRequestMeta = {
      requestId,
      sourceUrl: input.sourceUrl,
      xmlFileName: input.xmlFileName,
      status: 'PUBLISHED',
      createdAt,
      totalProducts: mappedProducts.length,
    };

    this.state.activeRequestId = requestId;
    this.state.requests.unshift(meta);
    this.state.productsByRequest[requestId] = mappedProducts;
    this.pruneOldRequests();
    this.saveState();
    return meta;
  }

  getActiveRequestMeta(): PublishRequestMeta | null {
    const requestId = this.state.activeRequestId;
    if (!requestId) {
      return null;
    }
    return this.state.requests.find((r) => r.requestId === requestId) || null;
  }

  getRequests(): PublishRequestMeta[] {
    return this.state.requests;
  }

  getCatalog(query: CatalogQuery) {
    const activeRequest = this.getActiveRequestMeta();
    const allProducts = this.getActiveProducts();

    let filtered = allProducts;

    if (query.category) {
      filtered = filtered.filter((p) => p.category.toLowerCase() === query.category!.toLowerCase());
    }
    if (query.brand) {
      filtered = filtered.filter((p) => p.brand.toLowerCase() === query.brand!.toLowerCase());
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q));
    }
    if (query.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= query.minPrice!);
    }
    if (query.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= query.maxPrice!);
    }

    const total = filtered.length;
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;
    const products = filtered.slice(start, end);

    return {
      request: activeRequest,
      products,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page * query.limit < total,
        hasPrev: query.page > 1,
      },
    };
  }

  getProductById(id: string): XmlCatalogProduct | null {
    const products = this.getActiveProducts();
    return products.find((p) => p._id === id) || null;
  }

  private getActiveProducts(): XmlCatalogProduct[] {
    const requestId = this.state.activeRequestId;
    if (!requestId) {
      return [];
    }
    return this.state.productsByRequest[requestId] || [];
  }

  private toCatalogProduct(raw: any, requestId: string, index: number): XmlCatalogProduct {
    const name = String(raw.urun_adi || raw.urunAdi || raw.name || 'Unknown Product').trim();
    const barcode = String(raw.barkodno || raw.urunKodu || `XML-${requestId}-${index + 1}`).trim();
    const fiyat = this.toNumber(raw.fiyat);
    const bayi = this.toNumber(raw.bayifiyat);
    const price = fiyat > 0 ? fiyat : bayi;
    const originalPrice = fiyat > 0 ? fiyat : price;
    const discountPercent = originalPrice > price ? Math.max(0, Math.round(((originalPrice - price) / originalPrice) * 100)) : 0;
    const stock = Math.max(0, Math.floor(this.toNumber(raw.stok)));
    const imageUrl = String(raw.resim || '').trim();
    const brand = String(raw.marka || 'XML Market').trim() || 'XML Market';
    const category = String(raw.kategori_adi || raw.kategori || 'XML Katalog').trim() || 'XML Katalog';

    return {
      _id: `${requestId}-${index + 1}`,
      sourceType: 'XML_REQUEST',
      requestId,
      name,
      barcode,
      price,
      originalPrice,
      discountPercent,
      imageUrl,
      brand,
      category,
      stock,
      rating: 4.6,
      reviewCount: 0,
    };
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    const cleaned = String(value ?? '0').replace(/[^0-9.,-]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private pruneOldRequests() {
    if (this.state.requests.length <= MAX_REQUEST_HISTORY) {
      return;
    }

    const removed = this.state.requests.splice(MAX_REQUEST_HISTORY);
    for (const item of removed) {
      delete this.state.productsByRequest[item.requestId];
    }
  }

  private saveState() {
    if (!this.storageFilePath) {
      return;
    }
    fs.writeFileSync(this.storageFilePath, JSON.stringify(this.state), 'utf-8');
  }

  private loadState() {
    if (!this.storageFilePath) {
      return;
    }

    if (!fs.existsSync(this.storageFilePath)) {
      return;
    }

    try {
      const content = fs.readFileSync(this.storageFilePath, 'utf-8');
      const parsed = JSON.parse(content) as PersistedState;
      this.state = {
        activeRequestId: parsed.activeRequestId,
        requests: Array.isArray(parsed.requests) ? parsed.requests : [],
        productsByRequest: parsed.productsByRequest || {},
      };
    } catch (error) {
      console.error('[XML Catalog] Failed to load persisted state:', error);
    }
  }

  private resolveStoragePath(): string | null {
    const candidates = [
      process.env.XML_CATALOG_DIR,
      path.join(process.cwd(), 'uploads', 'xml'),
      path.join('/tmp', 'trendyol-xml-catalog'),
    ].filter((item): item is string => Boolean(item));

    for (const dir of candidates) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        return path.join(dir, 'published-catalog.json');
      } catch {
        // Continue with next candidate.
      }
    }

    console.warn('[XML Catalog] Persistent storage unavailable, using memory-only mode.');
    return null;
  }
}

export const xmlCatalogService = new XmlCatalogService();
