import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { Readable } from 'stream';
import { xmlParserService } from '../services/xmlParser.service';
import { xmlCatalogService } from '../services/xmlCatalog.service';
import { authenticate, optionalAuthenticate, AuthenticatedRequest, requireAdmin } from '../middlewares/auth.middleware';
import prisma from '../repositories/prisma.client';

const router = Router();

// Multer configuration - File upload işlemleri
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'xml');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `products-${timestamp}-${file.originalname}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Sadece XML dosyalarına izin ver
  if (file.mimetype === 'application/xml' || file.mimetype === 'text/xml' || file.originalname.endsWith('.xml')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece XML dosyaları yüklenebilir'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

const MAX_REMOTE_XML_SIZE = 500 * 1024 * 1024; // 500MB
const REMOTE_FETCH_TIMEOUT_MS = 120000;
const REMOTE_FETCH_ATTEMPTS = 3;

function isRetryableNetworkError(error: any): boolean {
  const code = String(error?.code || error?.cause?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();

  if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENETUNREACH', 'EAI_AGAIN', 'ABORT_ERR'].includes(code)) {
    return true;
  }

  return (
    message.includes('fetch failed') ||
    message.includes('zaman aşımı') ||
    message.includes('timed out') ||
    message.includes('socket hang up')
  );
}

function isUpstreamXmlError(error: any): boolean {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return (
    text.includes('etimedout') ||
    text.includes('econnreset') ||
    text.includes('econnrefused') ||
    text.includes('enetunreach') ||
    text.includes('eai_again') ||
    text.includes('fetch failed') ||
    text.includes('xml linki okunamadı') ||
    text.includes('zaman aşımı')
  );
}

function parseCatalogQuery(req: Request) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50000, Math.max(1, Number(req.query.limit) || 48));
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const brand = typeof req.query.brand === 'string' ? req.query.brand : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined;

  return {
    page,
    limit,
    category,
    brand,
    search,
    minPrice: Number.isFinite(minPrice as number) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice as number) ? maxPrice : undefined,
  };
}

function normalizeRemoteXmlUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('XML linki gereklidir');
  }

  const trimmed = value.trim();
  const parsedUrl = new URL(trimmed);

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Sadece http ve https linkleri desteklenir');
  }

  const host = parsedUrl.hostname.toLowerCase();
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  const isPrivateIpv4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);

  if (isLocalhost || isPrivateIpv4) {
    throw new Error('Local/private link kullanılamaz. Lütfen herkese açık bir XML linki giriniz.');
  }

  return parsedUrl.toString();
}

async function fetchRemoteXmlContent(xmlUrl: string): Promise<Readable> {
  const parsedUrl = new URL(xmlUrl);
  const client = parsedUrl.protocol === 'https:' ? https : http;

  let lastError: any;
  for (let attempt = 1; attempt <= REMOTE_FETCH_ATTEMPTS; attempt++) {
    try {
      const resp = await new Promise<http.IncomingMessage>((resolve, reject) => {
        const req = client.get(
          xmlUrl,
          {
            timeout: REMOTE_FETCH_TIMEOUT_MS,
            family: 4,
            headers: {
              Accept: 'application/xml,text/xml,text/plain,*/*',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
            },
          },
          (res) => {
            const statusCode = res.statusCode || 0;
            if (statusCode < 200 || statusCode >= 300) {
              res.resume();
              return reject(new Error(`XML linki okunamadı (${statusCode})`));
            }
            resolve(res);
          }
        );

        req.on('timeout', () => req.destroy(new Error('XML bağlantısı zaman aşımına uğradı')));
        req.on('error', reject);
      });

      return resp;
    } catch (error: any) {
      lastError = error;
      if (!isRetryableNetworkError(error) || attempt === REMOTE_FETCH_ATTEMPTS) {
        break;
      }
      console.warn(`[XML Fetch] deneme başarısız (${attempt}/${REMOTE_FETCH_ATTEMPTS}), tekrar denenecek...`);
    }
  }

  throw lastError || new Error('XML içeriği alınamadı');
}

/**
 * GET /admin/xml/sample
 * Örnek XML dosyası indir
 */
router.get('/admin/xml/sample', (req: Request, res: Response) => {
  try {
    const sampleXML = xmlParserService.generateSampleXML();
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="sample-urunler.xml"');
    res.send(sampleXML);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Örnek XML oluşturulamadı',
      error: error.message,
    });
  }
});

/**
 * GET /xml/catalog
 * Public XML catalog for published request
 */
router.get('/xml/catalog', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = parseCatalogQuery(req);
    const wantsMyProducts = req.query.includeAll === 'true' || req.query.myProducts === 'true';
    const userId = (req.user?.id && wantsMyProducts) ? req.user.id : undefined;
    const data = xmlCatalogService.getCatalog({ ...query, userId });

    // Prevent browser/proxy caching so stale empty responses never block fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    res.status(200).json({
      success: true,
      source: 'xml-catalog',
      data,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'XML katalog okunamadı',
      error: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /xml/catalog/:id
 * Public XML catalog detail by virtual product id
 */
router.get('/xml/catalog/:id', (req: Request, res: Response) => {
  try {
    const product = xmlCatalogService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı',
      });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'XML katalog ürün detayı okunamadı',
      error: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /admin/xml/requests
 * Admin request list for published XML catalogs
 */
router.get('/admin/xml/requests', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const activeRequest = xmlCatalogService.getActiveRequestMeta(userId);
  const requests = xmlCatalogService.getRequests(userId);

  res.status(200).json({
    success: true,
    data: {
      activeRequest,
      requests,
    },
  });
});

/**
 * GET /admin/xml/all-requests
 * Super admin request list for all published XML catalogs across the system
 */
router.get('/admin/xml/all-requests', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const allRequests = xmlCatalogService.getAllRequests();
    res.status(200).json({
      success: true,
      data: {
        requests: allRequests,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Tüm XML istekleri okunamadı',
      error: error.message,
    });
  }
});

/**
 * POST /admin/xml/preview-url
 * XML linkini preview et
 */
router.post('/admin/xml/preview-url', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const xmlUrl = normalizeRemoteXmlUrl(req.body?.url);
    const xmlStream = await fetchRemoteXmlContent(xmlUrl);
    // Kullanıcının seçtiği alan eşlemesiyle önizle (yoksa otomatik alias eşlemesi)
    const rawMapping = req.body?.fieldMapping as Record<string, string> | undefined;
    const cleanedMapping = rawMapping
      ? Object.fromEntries(Object.entries(rawMapping).filter(([, v]) => v && String(v).trim() !== ''))
      : {};
    const products = await xmlParserService.parseXMLStream(
      xmlStream,
      Object.keys(cleanedMapping).length > 0 ? cleanedMapping : undefined
    );
    const validation = xmlParserService.validateProducts(products);

    res.status(200).json({
      success: true,
      sourceUrl: xmlUrl,
      totalProducts: products.length,
      validProducts: products.length - Object.keys(validation.errors).length,
      invalidProducts: Object.keys(validation.errors).length,
      errors: validation.errors,
      rawProduct: products.length > 0 ? (products[0] as any)._rawProduct || {} : {},
      // Parser'ın normalize ettiği (eşlemeye göre çözülmüş) alanları döndür
      preview: products.slice(0, 10).map((p: any) => {
        const priceStr = String(p.fiyat ?? '0');
        const price = parseFloat(priceStr.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

        return {
          kategori: p.kategori || 'N/A',
          altKategori: p.altkategori || 'N/A',
          urunAdi: p.urunAdi || 'Eşleşmedi',
          barkodno: p.urunKodu || 'N/A',
          fiyat: price,
          bayiFiyati: price,
          resim: p.resim ? String(p.resim).substring(0, 50) + '...' : 'N/A',
          stok: p.stok ?? 0,
          marka: p.marka || 'N/A',
        };
      }),
    });
  } catch (error: any) {
    console.error('[XML Preview Error]', error);
    const statusCode = isUpstreamXmlError(error) ? 502 : 400;
    res.status(statusCode).json({
      success: false,
      message: 'XML linki preview edilemedi',
      error: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /admin/xml/import-url
 * XML linkinden ürünleri içeri aktar (Mock DB yazma ile)
 */
router.post('/admin/xml/import-url', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const xmlUrl = normalizeRemoteXmlUrl(req.body?.url);
    const xmlStream = await fetchRemoteXmlContent(xmlUrl);
    // Kullanıcının seçtiği alan eşlemesi içe aktarımda da uygulanmalı
    const rawMapping = req.body?.fieldMapping as Record<string, string> | undefined;
    const cleanedMapping = rawMapping
      ? Object.fromEntries(Object.entries(rawMapping).filter(([, v]) => v && String(v).trim() !== ''))
      : {};
    const products = await xmlParserService.parseXMLStream(
      xmlStream,
      Object.keys(cleanedMapping).length > 0 ? cleanedMapping : undefined
    );
    const validation = xmlParserService.validateProducts(products);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'XML dosyasında validasyon hataları vardır',
        errors: validation.errors,
        totalProducts: products.length,
        validProducts: products.length - Object.keys(validation.errors).length,
      });
    }

    // Publish to lightweight XML request catalog (no Product collection writes)
    const xmlFileName = `import-${Date.now()}.xml`;
    const userId = req.user!.id;
    const publishInfo = await xmlCatalogService.publishProducts({
      products,
      sourceUrl: xmlUrl,
      xmlFileName,
      userId,
    });

    // 🔄 Mock DB yazma işlemi - Veritabanına yazıyormuş gibi yap
    const mockOrders = generateMockOrdersFromXML(products, xmlFileName, userId);

    res.status(200).json({
      success: true,
      message: `${products.length} ürün başarıyla alındı ve veritabanına yazıldı`,
      sourceUrl: xmlUrl,
      xmlFileName: xmlFileName,
      totalProducts: products.length,
      importedAt: new Date(),
      data: {
        publication: {
          requestId: publishInfo.requestId,
          status: publishInfo.status,
          totalProducts: publishInfo.totalProducts,
          buyerCatalogUrl: '/products/xml/catalog',
        },
        // Mock DB yazma sonucu
        mockDatabase: {
          ordersCreated: mockOrders.length,
          orders: mockOrders,
        },
        // İlk 10 ürünün detaylarını göster
        productDetails: products.slice(0, 10).map((p: any) => {
          const priceStr = String(p.fiyat || p.bayifiyat || '0');
          const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
          
          return {
            kategori: p.kategori_adi || p.kategori || 'N/A',
            altKategori: p.altkategori || 'N/A',
            urunAdi: p.urun_adi || p.urunAdi || 'Unknown',
            barkodno: p.barkodno || p.urunKodu || 'N/A',
            fiyat: price,
            bayiFiyati: p.bayifiyat || price,
            resim: p.resim ? p.resim.substring(0, 50) + '...' : 'N/A',
            stok: p.stok || 0,
            marka: p.marka || 'N/A',
          };
        }),
      },
    });
  } catch (error: any) {
    console.error('[XML Import Error]', error);
    const statusCode = isUpstreamXmlError(error) ? 502 : 400;
    res.status(statusCode).json({
      success: false,
      message: 'XML linki işlenirken hata oluştu',
      error: error.message || 'Unknown error',
    });
  }
});

/**
 * 🔄 Helper: XML'den Mock Order'ları oluştur (Sanal DB yazma)
 */
function generateMockOrdersFromXML(products: any[], xmlFileName: string, userId: string) {
  const mockOrders = [];

  // Her 5 ürün için bir mock order oluştur
  for (let i = 0; i < Math.min(3, Math.ceil(products.length / 5)); i++) {
    const startIdx = i * 5;
    const endIdx = Math.min(startIdx + 5, products.length);
    const orderProducts = products.slice(startIdx, endIdx);

    const mockOrder = {
      _id: `mock-order-${xmlFileName}-${i + 1}`,
      userId: userId,
      items: orderProducts.map((p: any, idx: number) => {
        // Flexible field mapping
        const name = p.urun_adi || p.urunAdi || 'Unknown Product';
        const barcode = p.barkodno || p.urunKodu || 'N/A';
        const priceStr = String(p.fiyat || p.bayifiyat || p.fiyat_bayifiyat || '0');
        const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;

        return {
          productId: `prod-${i}-${idx}`,
          name: name,
          barcode: barcode,  // ✅ Barkod tutma
          price: price,  // ✅ Fiyat tutma
          quantity: 1,
          imageUrl: p.resim || '',
        };
      }),
      totalAmount: orderProducts.reduce((sum: number, p: any) => {
        const priceStr = String(p.fiyat || p.bayifiyat || '0');
        const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
        return sum + price;
      }, 0),
      status: 'PENDING',
      address: 'Warehouse Import',
      xmlFileName: xmlFileName,  // ✅ XML adı tutma
      paymentDetails: {
        cardLast4: 'MOCK',
        paymentId: `mock-payment-${xmlFileName}-${i + 1}`,
      },
      createdAt: new Date(),
    };

    mockOrders.push(mockOrder);
  }

  return mockOrders;
}

/**
 * POST /admin/xml/upload
 * XML dosya yükle ve ürünleri içeri aktar (Mock DB yazma ile)
 */
router.post('/admin/xml/upload', authenticate, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // File kontrol
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'XML dosyası seçilmesi gereklidir',
      });
    }

    const filePath = req.file.path;

    // Parse XML
    const products = await xmlParserService.parseXMLFile(filePath);

    // Validate all products
    const validation = xmlParserService.validateProducts(products);
    if (!validation.isValid) {
      // Cleanup temp file
      fs.unlink(filePath, () => {});
      
      return res.status(400).json({
        success: false,
        message: 'XML dosyasında validasyon hataları vardır',
        errors: validation.errors,
        totalProducts: products.length,
        validProducts: products.length - Object.keys(validation.errors).length,
      });
    }

    // Publish to lightweight XML request catalog (no Product collection writes)
    const xmlFileName = req.file.originalname;
    const userId = req.user!.id;
    const publishInfo = await xmlCatalogService.publishProducts({
      products,
      sourceUrl: `file://${req.file.originalname}`,
      xmlFileName,
      userId,
    });

    // 🔄 Mock DB yazma işlemi - Veritabanına yazıyormuş gibi yap
    const mockOrders = generateMockOrdersFromXML(products, xmlFileName, userId);

    res.status(200).json({
      success: true,
      message: `${products.length} ürün başarıyla yüklendi ve veritabanına yazıldı`,
      totalProducts: products.length,
      xmlFileName: xmlFileName,
      importedAt: new Date(),
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        publication: {
          requestId: publishInfo.requestId,
          status: publishInfo.status,
          totalProducts: publishInfo.totalProducts,
          buyerCatalogUrl: '/products/xml/catalog',
        },
        // Mock DB yazma sonucu
        mockDatabase: {
          ordersCreated: mockOrders.length,
          orders: mockOrders,
        },
        // İlk 5 ürünün detaylarını göster
        productDetails: products.slice(0, 5).map((p: any) => {
          const priceStr = String(p.fiyat || p.bayifiyat || '0');
          const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
          
          return {
            kategori: p.kategori_adi || p.kategori || 'N/A',
            altKategori: p.altkategori || 'N/A',
            urunAdi: p.urun_adi || p.urunAdi || 'Unknown',
            barkodno: p.barkodno || p.urunKodu || 'N/A',
            fiyat: price,
            bayiFiyati: p.bayifiyat || price,
            resim: p.resim ? p.resim.substring(0, 50) + '...' : 'N/A',
            stok: p.stok || 0,
            marka: p.marka || 'N/A',
          };
        }),
      },
    });

    // Cleanup temp file
    fs.unlink(filePath, () => {});
  } catch (error: any) {
    // Cleanup on error
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      success: false,
      message: 'XML dosyası işlenirken hata oluştu',
      error: error.message,
    });
  }
});

/**
 * POST /admin/xml/preview
 * XML dosyayı preview et (import etmeden önce)
 */
router.post('/admin/xml/preview', authenticate, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'XML dosyası seçilmesi gereklidir',
      });
    }

    const filePath = req.file.path;
    const products = await xmlParserService.parseXMLFile(filePath);
    const validation = xmlParserService.validateProducts(products);

    res.status(200).json({
      success: true,
      totalProducts: products.length,
      validProducts: products.length - Object.keys(validation.errors).length,
      invalidProducts: Object.keys(validation.errors).length,
      errors: validation.errors,
      preview: products.slice(0, 10), // Preview ilk 10 ürünü
    });

    // Cleanup
    fs.unlink(filePath, () => {});
  } catch (error: any) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      success: false,
      message: 'Preview oluşturulamadı',
      error: error.message,
    });
  }
});

// --- XML FEED CRUD (Saatlik Otomatik Güncelleme için) ---

import { xmlCronService } from '../services/xmlCron.service';

router.get('/admin/xml/feeds', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const feeds = await prisma.xmlFeed.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, feeds });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/admin/xml/feeds', authenticate, async (req, res) => {
  try {
    const { name, url, syncInterval, fieldMapping } = req.body;
    const userId = (req as any).user.id;
    
    const newFeed = await prisma.xmlFeed.create({
      data: {
        userId,
        name,
        url,
        syncInterval: syncInterval || 60,
        fieldMapping: fieldMapping || {},
        isActive: true
      }
    });

    // Otomatik olarak ilk senkronizasyonu arka planda başlat
    xmlCronService.syncFeed(newFeed.id).catch(err => console.error('Initial sync failed', err));

    res.json({ success: true, feed: newFeed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/admin/xml/feeds/:id', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    // Check ownership first (or let prisma throw an error if not found, but it's safer to find first)
    const feed = await prisma.xmlFeed.findUnique({ where: { id: req.params.id } });
    if (!feed) {
      return res.status(404).json({ success: false, message: 'Feed bulunamadı' });
    }
    if (feed.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Yetkisiz işlem' });
    }
    
    await prisma.xmlFeed.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
