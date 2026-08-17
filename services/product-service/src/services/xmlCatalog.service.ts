import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { syncXmlProductsToSearch } from '../repositories/elasticsearch.client';
import { normalizeKeys, parseDecimal } from './xmlParser.service';
import { normalizeCategoryPath } from '../data/categoryNormalize';

const prisma = new PrismaClient();

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
  categoryAttributes?: Record<string, string>;
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
  activeRequestIds: Record<string, string>; // userId -> activeRequestId
  requestsByUserId: Record<string, PublishRequestMeta[]>; // userId -> requests
  productsByRequest: Record<string, XmlCatalogProduct[]>; // requestId -> yayindaki (kural uygulanmis) urunler
  /// XML'den geldigi hâli — toplu islem kurallari her zaman bunun uzerine uygulanir
  baseByRequest?: Record<string, XmlCatalogProduct[]>;
}

/// XML urunlerine uygulanan toplu islem kurali
export interface XmlOverride {
  barcode: string;
  priceMode: string | null;
  priceValue: number | null;
  stockMode: string | null;
  stockValue: number | null;
  categoryPath: string | null;
  isHidden: boolean;
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
    activeRequestIds: {},
    requestsByUserId: {},
    productsByRequest: {},
  };

  private readonly storageFilePath: string | null;

  constructor() {
    this.storageFilePath = this.resolveStoragePath();
    this.loadState();
  }

  async publishProducts(input: { products: any[]; sourceUrl: string; xmlFileName: string; userId: string }): Promise<PublishRequestMeta> {
    const requestId = `xml-req-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const baseProducts = input.products
      .map((item: any, index: number) => this.toCatalogProduct(item, requestId, index))
      .filter((item) => item.stock >= 0 && item.price >= 0);

    // Saticinin daha once uyguladigi toplu islem kurallari senkronda korunur
    const overrides = await this.loadOverrides(input.userId);
    const mappedProducts = baseProducts.map((p) => this.applyOverride(p, overrides.get(p.barcode)));

    const meta: PublishRequestMeta = {
      requestId,
      sourceUrl: input.sourceUrl,
      xmlFileName: input.xmlFileName,
      status: 'PUBLISHED',
      createdAt,
      totalProducts: mappedProducts.length,
    };

    if (!this.state.activeRequestIds) this.state.activeRequestIds = {};
    if (!this.state.requestsByUserId) this.state.requestsByUserId = {};

    this.state.activeRequestIds[input.userId] = requestId;
    
    if (!this.state.requestsByUserId[input.userId]) {
      this.state.requestsByUserId[input.userId] = [];
    }
    this.state.requestsByUserId[input.userId].unshift(meta);
    this.state.productsByRequest[requestId] = mappedProducts;
    if (!this.state.baseByRequest) this.state.baseByRequest = {};
    this.state.baseByRequest[requestId] = baseProducts;
    
    this.pruneOldRequests(input.userId);
    this.saveState();

    // Trigger Elasticsearch sync for XML products asynchronously
    syncXmlProductsToSearch(mappedProducts, input.userId).catch(err => {
      console.error(`[XML Catalog] Failed to sync XML products to ES for user ${input.userId}:`, err);
    });

    // Otomatik Kategori ve Marka Oluşturma (Ağaç yapısı)
    this.syncOptionsToDatabase(mappedProducts).catch(err => {
      console.error(`[XML Catalog] Failed to sync options to DB:`, err);
    });

    return meta;
  }

  private async syncOptionsToDatabase(products: XmlCatalogProduct[]) {
    const uniqueCategories = new Set<string>();
    const uniqueBrands = new Set<string>();

    for (const p of products) {
      if (p.category && p.category.trim() !== '') uniqueCategories.add(p.category.trim());
      if (p.brand && p.brand.trim() !== '') uniqueBrands.add(p.brand.trim());
    }

    try {
      const { CatalogRepository } = require('../repositories/catalog.repository');

      // Save brands
      for (const brand of uniqueBrands) {
        await CatalogRepository.upsertBrand(brand);
      }

      // Save categories with full tree structure (supports 3+ levels)
      for (const catStr of uniqueCategories) {
        const parts = catStr.split('>').map((p: string) => p.trim()).filter(Boolean);
        
        if (parts.length === 0) continue;
        
        // Always create the main category
        const mainCategory = parts[0];
        
        // Create sub-categories for each level after the first
        if (parts.length >= 2) {
          for (let i = 1; i < parts.length; i++) {
            await CatalogRepository.upsertCategory(mainCategory, parts[i]);
          }
        } else {
          await CatalogRepository.upsertCategory(mainCategory);
        }
      }

      // Also auto-extract categoryAttributes for filter templates
      const filterMap = new Map<string, Map<string, Set<string>>>();
      for (const p of products) {
        const catKey = p.category?.split('>')[0]?.trim();
        if (!catKey || !p.categoryAttributes) continue;
        
        if (!filterMap.has(catKey)) filterMap.set(catKey, new Map());
        const catFilters = filterMap.get(catKey)!;
        
        for (const [key, value] of Object.entries(p.categoryAttributes)) {
          if (!key || !value) continue;
          if (!catFilters.has(key)) catFilters.set(key, new Set());
          catFilters.get(key)!.add(String(value));
        }
      }

      // Save auto-extracted filter templates (only if no manual template exists)
      const prismaClient = require('../repositories/prisma.client').default;
      for (const [categoryName, attrMap] of filterMap) {
        const existing = await prismaClient.categoryFilterTemplate.findUnique({
          where: { categoryName },
        }).catch(() => null);
        
        if (!existing) {
          const filters = Array.from(attrMap.entries())
            .filter(([, vals]) => vals.size > 1 && vals.size <= 50)
            .map(([name, vals]) => ({
              name,
              type: 'select',
              options: Array.from(vals).sort((a: string, b: string) => a.localeCompare(b, 'tr')),
            }));
          
          if (filters.length > 0) {
            await prismaClient.categoryFilterTemplate.create({
              data: { categoryName, filters },
            }).catch(() => {});
          }
        }
      }

      console.log(`[XML Catalog] Synced ${uniqueBrands.size} brands and ${uniqueCategories.size} categories to DB`);
    } catch (error) {
      console.error(`[XML Catalog] Sync options error:`, error);
    }
  }

  getActiveRequestMeta(userId: string): PublishRequestMeta | null {
    if (!this.state.activeRequestIds) return null;
    const requestId = this.state.activeRequestIds[userId];
    if (!requestId) {
      return null;
    }
    const userRequests = this.state.requestsByUserId?.[userId] || [];
    return userRequests.find((r) => r.requestId === requestId) || null;
  }

  getRequests(userId: string): PublishRequestMeta[] {
    if (!this.state.requestsByUserId) return [];
    return this.state.requestsByUserId[userId] || [];
  }

  getAllRequests(): PublishRequestMeta[] {
    if (!this.state.requestsByUserId) return [];
    let allRequests: PublishRequestMeta[] = [];
    for (const userId of Object.keys(this.state.requestsByUserId)) {
      allRequests = allRequests.concat(this.state.requestsByUserId[userId]);
    }
    return allRequests;
  }

  getCatalog(query: CatalogQuery & { userId?: string }) {
    const activeRequest = query.userId ? this.getActiveRequestMeta(query.userId) : null;
    const allProducts = query.userId ? this.getActiveProducts(query.userId) : this.getAllActiveProducts();

    let filtered = allProducts;

    if (query.category) {
      filtered = filtered.filter((p) => p.category.toLowerCase() === query.category!.toLowerCase() || p.category.toLowerCase().includes(query.category!.toLowerCase()));
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
    const allProducts = this.getAllActiveProducts();
    return allProducts.find((p) => p._id === id) || null;
  }

  public getActiveProducts(userId: string): XmlCatalogProduct[] {
    if (!this.state.activeRequestIds) return [];
    const requestId = this.state.activeRequestIds[userId];
    if (!requestId) {
      return [];
    }
    return this.state.productsByRequest[requestId] || [];
  }

  public getAllActiveProducts(): (XmlCatalogProduct & { userId: string })[] {
    const all: (XmlCatalogProduct & { userId: string })[] = [];
    if (!this.state.activeRequestIds) return [];
    for (const [userId, requestId] of Object.entries(this.state.activeRequestIds)) {
      const products = this.state.productsByRequest[requestId] || [];
      for (const p of products) {
        all.push({ ...p, userId });
      }
    }
    return all;
  }

  private toCatalogProduct(raw: any, requestId: string, index: number): XmlCatalogProduct {
    const normalized = normalizeKeys(raw);

    const name = String(normalized.urunadi || normalized.name || normalized.title || normalized.productname || 'Bilinmeyen Ürün').trim();
    const barcode = String(normalized.urunkodu || normalized.barkodno || normalized.barcode || normalized.sku || normalized.productcode || `XML-${requestId}-${index + 1}`).trim();
    // Fiyatlar: satış fiyatı esas, liste fiyatı varsa gerçek indirim hesaplanır
    const satis = this.toNumber(normalized.fiyat ?? normalized.fiyati ?? normalized.price);
    const liste = this.toNumber(normalized.listefiyati ?? normalized.listprice);
    const alis = this.toNumber(normalized.alisfiyati ?? normalized.bayifiyat ?? normalized.bayifiyati);

    const price = satis > 0 ? satis : liste > 0 ? liste : alis;
    const originalPrice = liste > price ? liste : price;
    const discountPercent =
      originalPrice > price ? Math.max(0, Math.round(((originalPrice - price) / originalPrice) * 100)) : 0;

    const stock = Math.max(0, Math.floor(this.toNumber(normalized.stok ?? normalized.stock ?? normalized.quantity ?? normalized.qty)));
    const imageUrl = String(normalized.resim || normalized.resim1 || normalized.image || normalized.imageurl || normalized.gorsel || '').trim();
    const brand = String(normalized.marka || normalized.brand || normalized.manufacturer || 'XML Market').trim() || 'XML Market';

    // Kategori: "Ana > Alt" yolu kur; zaten yol içeriyorsa olduğu gibi kullan
    const anaKat = String(normalized.kategori || normalized.category || normalized.kategoriadi || '').trim();
    const altKat = String(normalized.altkategori || normalized.subcategory || '').trim();
    let category = anaKat || 'XML Katalog';
    if (altKat && !anaKat.includes('>') && altKat.toLowerCase() !== anaKat.toLowerCase()) {
      category = anaKat ? `${anaKat} > ${altKat}` : altKat;
    }
    // Serbest metin kategoriyi kanonik ağaca indirge (çöp kategori üretmesin)
    category = normalizeCategoryPath(category) || 'XML Katalog';

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
      categoryAttributes: raw.categoryAttributes || {},
    };
  }

  // Türkçe/İngiliz sayı formatlarını doğru çözen ortak parser
  // ("1.299,00" → 1299 ; "1,299.00" → 1299 ; "149,90" → 149.9)
  private toNumber(value: unknown): number {
    return parseDecimal(value);
  }

  // ─── Toplu işlem kuralları (override) ───────────────────────────
  // Satıcının XML ürünlerine uyguladığı toplu fiyat/stok/kategori
  // düzenlemeleri DB'de saklanır ve her senkronda yeniden uygulanır.

  private async loadOverrides(userId: string): Promise<Map<string, XmlOverride>> {
    try {
      const rows = await prisma.xmlCatalogOverride.findMany({ where: { userId } });
      return new Map(rows.map((r) => [r.barcode, r as unknown as XmlOverride]));
    } catch (err) {
      console.error('[XML Catalog] Override okunamadı:', err);
      return new Map();
    }
  }

  private applyOverride(product: XmlCatalogProduct, ov?: XmlOverride): XmlCatalogProduct {
    if (!ov) return product;
    const next = { ...product };

    if (ov.priceMode && typeof ov.priceValue === 'number') {
      const base = next.price;
      const v = ov.priceValue;
      let price = base;
      if (ov.priceMode === 'PERCENT_DISCOUNT') price = base * (1 - v / 100);
      else if (ov.priceMode === 'AMOUNT_DISCOUNT') price = base - v;
      else if (ov.priceMode === 'PERCENT_INCREASE') price = base * (1 + v / 100);
      else if (ov.priceMode === 'AMOUNT_INCREASE') price = base + v;
      next.price = Math.max(0, Math.round(price * 100) / 100);
      // Liste fiyatı XML'den geleni korur; indirim yüzdesi yeniden hesaplanır
      next.originalPrice = Math.max(next.originalPrice, next.price);
      next.discountPercent =
        next.originalPrice > next.price
          ? Math.max(0, Math.round(((next.originalPrice - next.price) / next.originalPrice) * 100))
          : 0;
    }

    if (ov.stockMode && typeof ov.stockValue === 'number') {
      if (ov.stockMode === 'SET') next.stock = ov.stockValue;
      else if (ov.stockMode === 'INCREASE') next.stock = next.stock + ov.stockValue;
      else if (ov.stockMode === 'DECREASE') next.stock = next.stock - ov.stockValue;
      next.stock = Math.max(0, Math.floor(next.stock));
    }

    if (ov.categoryPath) next.category = ov.categoryPath;
    // Gizlenen ürün stoksuz kalır; katalog listelerinde satın alınamaz
    if (ov.isHidden) next.stock = 0;

    return next;
  }

  /**
   * Seçili XML ürünlerine toplu işlem uygular: kuralı kaydeder ve
   * yayındaki katalogda anında etkili kılar.
   */
  async applyBulkOverrides(
    userId: string,
    barcodes: string[],
    action: {
      priceMode?: string;
      priceValue?: number;
      stockMode?: string;
      stockValue?: number;
      categoryPath?: string;
      isHidden?: boolean;
      reset?: boolean;
    }
  ): Promise<{ updated: number; affectedProducts: number }> {
    const unique = [...new Set(barcodes.filter((b) => b && String(b).trim()))].map(String);
    if (unique.length === 0) return { updated: 0, affectedProducts: 0 };

    if (action.reset) {
      await prisma.xmlCatalogOverride.deleteMany({ where: { userId, barcode: { in: unique } } });
    } else {
      const data = {
        priceMode: action.priceMode ?? null,
        priceValue: typeof action.priceValue === 'number' ? action.priceValue : null,
        stockMode: action.stockMode ?? null,
        stockValue: typeof action.stockValue === 'number' ? action.stockValue : null,
        categoryPath: action.categoryPath ?? null,
        isHidden: action.isHidden ?? false,
      };
      // Yalnızca gönderilen alanlar güncellenir, diğer kurallar korunur
      const patch = Object.fromEntries(
        Object.entries(data).filter(([k, v]) => v !== null || (k === 'isHidden' && action.isHidden !== undefined))
      );
      for (const barcode of unique) {
        await prisma.xmlCatalogOverride.upsert({
          where: { userId_barcode: { userId, barcode } },
          create: { userId, barcode, ...data },
          update: patch,
        });
      }
    }

    // Yayındaki katalogu yeniden hesapla
    const overrides = await this.loadOverrides(userId);
    let affected = 0;
    const requestIds = (this.state.requestsByUserId?.[userId] || []).map((r) => r.requestId);
    for (const requestId of requestIds) {
      const list = this.state.productsByRequest[requestId];
      if (!list) continue;
      // Kural değiştiğinde eski kuralın etkisi birikmesin diye ham hâlden yeniden uygulanır
      const baseList = this.state.baseByRequest?.[requestId] || list;
      const baseById = new Map(baseList.map((b) => [b._id, b]));
      this.state.productsByRequest[requestId] = list.map((p) => {
        if (!unique.includes(p.barcode)) return p;
        affected += 1;
        const base = baseById.get(p._id) || p;
        return this.applyOverride(base, overrides.get(p.barcode));
      });
    }
    this.saveState();

    return { updated: unique.length, affectedProducts: affected };
  }

  private pruneOldRequests(userId: string) {
    if (!this.state.requestsByUserId) return;
    const userRequests = this.state.requestsByUserId[userId] || [];
    if (userRequests.length <= MAX_REQUEST_HISTORY) {
      return;
    }

    const removed = userRequests.splice(MAX_REQUEST_HISTORY);
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
      const parsed = JSON.parse(content);
      this.state = {
        activeRequestIds: parsed.activeRequestIds || (parsed.activeRequestId ? { 'admin-user-001': parsed.activeRequestId } : {}),
        requestsByUserId: parsed.requestsByUserId || (Array.isArray(parsed.requests) ? { 'admin-user-001': parsed.requests } : {}),
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
