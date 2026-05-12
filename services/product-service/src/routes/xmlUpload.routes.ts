import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { xmlParserService } from '../services/xmlParser.service';

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

const MAX_REMOTE_XML_SIZE = 10 * 1024 * 1024;

function normalizeRemoteXmlUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('XML linki gereklidir');
  }

  const trimmed = value.trim();
  const parsedUrl = new URL(trimmed);

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Sadece http ve https linkleri desteklenir');
  }

  return parsedUrl.toString();
}

async function fetchRemoteXmlContent(xmlUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(xmlUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/xml,text/xml,text/plain,*/*',
      },
    });

    if (!response.ok) {
      throw new Error(`XML linki okunamadı (${response.status})`);
    }

    const contentType = response.headers.get('content-type') || '';
    const body = await response.text();

    if (body.length > MAX_REMOTE_XML_SIZE) {
      throw new Error('XML içeriği 10MB sınırını aşıyor');
    }

    if (!contentType.includes('xml') && !body.trim().startsWith('<')) {
      throw new Error('Link XML içeriği döndürmüyor');
    }

    return body;
  } finally {
    clearTimeout(timeoutId);
  }
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
 * POST /admin/xml/preview-url
 * XML linkini preview et
 */
router.post('/admin/xml/preview-url', async (req: Request, res: Response) => {
  try {
    const xmlUrl = normalizeRemoteXmlUrl(req.body?.url);
    const xmlContent = await fetchRemoteXmlContent(xmlUrl);
    const products = xmlParserService.parseXMLString(xmlContent);
    const validation = xmlParserService.validateProducts(products);

    res.status(200).json({
      success: true,
      sourceUrl: xmlUrl,
      totalProducts: products.length,
      validProducts: products.length - Object.keys(validation.errors).length,
      invalidProducts: Object.keys(validation.errors).length,
      errors: validation.errors,
      preview: products.slice(0, 10),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'XML linki preview edilemedi',
      error: error.message,
    });
  }
});

/**
 * POST /admin/xml/import-url
 * XML linkinden ürünleri içeri aktar
 */
router.post('/admin/xml/import-url', async (req: Request, res: Response) => {
  try {
    const xmlUrl = normalizeRemoteXmlUrl(req.body?.url);
    const xmlContent = await fetchRemoteXmlContent(xmlUrl);
    const products = xmlParserService.parseXMLString(xmlContent);
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

    res.status(200).json({
      success: true,
      message: `${products.length} ürün başarıyla alındı`,
      sourceUrl: xmlUrl,
      totalProducts: products.length,
      data: {
        uploadedAt: new Date(),
        products: products.slice(0, 5),
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'XML linki işlenirken hata oluştu',
      error: error.message,
    });
  }
});

/**
 * POST /admin/xml/upload
 * XML dosya yükle ve ürünleri içeri aktar
 */
router.post('/admin/xml/upload', upload.single('file'), async (req: Request, res: Response) => {
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

    // Şimdilik sadece parsing ve validation sonucu döndür
    // Sonra database işlemlerini ekleriz
    res.status(200).json({
      success: true,
      message: `${products.length} ürün başarıyla yüklendi`,
      totalProducts: products.length,
      data: {
        uploadedAt: new Date(),
        fileName: req.file.originalname,
        fileSize: req.file.size,
        products: products.slice(0, 5), // İlk 5 ürünü göster
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
router.post('/admin/xml/preview', upload.single('file'), async (req: Request, res: Response) => {
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

export default router;
