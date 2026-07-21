import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { xmlParserService } from './xmlParser.service';
import { xmlCatalogService } from './xmlCatalog.service';
import https from 'https';
import http from 'http';
import { Readable } from 'stream';

const prisma = new PrismaClient();
const REMOTE_FETCH_TIMEOUT_MS = 120000;
const REMOTE_FETCH_ATTEMPTS = 3;

function isRetryableNetworkError(error: any): boolean {
  const code = String(error?.code || error?.cause?.code || '').toUpperCase();
  if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENETUNREACH', 'EAI_AGAIN', 'ABORT_ERR'].includes(code)) return true;
  return false;
}

async function fetchRemoteXmlStream(xmlUrl: string): Promise<Readable> {
  const parsedUrl = new URL(xmlUrl);
  const client = parsedUrl.protocol === 'https:' ? https : http;

  let lastError: any;
  for (let attempt = 1; attempt <= REMOTE_FETCH_ATTEMPTS; attempt++) {
    try {
      const resp = await new Promise<http.IncomingMessage>((resolve, reject) => {
        const req = client.get(xmlUrl, {
          timeout: REMOTE_FETCH_TIMEOUT_MS,
          family: 4,
          headers: {
            Accept: 'application/xml,text/xml,*/*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
        }, (res) => {
          if ((res.statusCode || 0) < 200 || (res.statusCode || 0) >= 300) {
            res.resume();
            return reject(new Error(`XML linki okunamadı (${res.statusCode})`));
          }
          resolve(res);
        });

        req.on('timeout', () => req.destroy(new Error('XML bağlantısı zaman aşımına uğradı')));
        req.on('error', reject);
      });
      return resp;
    } catch (error: any) {
      lastError = error;
      if (!isRetryableNetworkError(error) || attempt === REMOTE_FETCH_ATTEMPTS) break;
    }
  }
  throw lastError || new Error('XML içeriği alınamadı');
}

export class XmlCronService {
  private cronJob: any = null;

  start() {
    if (this.cronJob) return;

    // Her saat başı çalışacak (0 * * * *)
    this.cronJob = cron.schedule('0 * * * *', async () => {
      console.log(`[XML Cron] Saatlik XML güncelleme görevi başlatıldı: ${new Date().toISOString()}`);
      await this.runSync();
    });

    console.log('[XML Cron] Servis başlatıldı.');
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
  }

  async runSync() {
    try {
      // Sadece aktif VE admin tarafından onaylanmış feed'leri getir
      const activeFeeds = await prisma.xmlFeed.findMany({
        where: { isActive: true, approvalStatus: 'APPROVED' }
      });

      console.log(`[XML Cron] Güncellenecek toplam aktif/onaylı feed sayısı: ${activeFeeds.length}`);

      for (const feed of activeFeeds) {
        try {
          console.log(`[XML Cron] '${feed.name}' güncelleniyor... URL: ${feed.url}`);
          
          const xmlStream = await fetchRemoteXmlStream(feed.url);
          const fieldMapping = typeof feed.fieldMapping === 'string' ? JSON.parse(feed.fieldMapping) : feed.fieldMapping;
          const products = await xmlParserService.parseXMLStream(xmlStream, fieldMapping as any);
          
          // Güncellenen ürünleri yayınla
          const publishInfo = await xmlCatalogService.publishProducts({
            products,
            sourceUrl: feed.url,
            xmlFileName: feed.name,
            userId: feed.userId,
          });

          await prisma.xmlFeed.update({
            where: { id: feed.id },
            data: {
              lastSyncAt: new Date(),
              lastSyncStatus: `SUCCESS: ${publishInfo.totalProducts} ürün çekildi.`
            }
          });
          
          console.log(`[XML Cron] '${feed.name}' başarıyla güncellendi.`);
        } catch (error: any) {
          console.error(`[XML Cron] Hata: '${feed.name}' güncellenemedi: ${error.message}`);
          await prisma.xmlFeed.update({
            where: { id: feed.id },
            data: {
              lastSyncAt: new Date(),
              lastSyncStatus: `FAILED: ${error.message}`
            }
          });
        }
      }
    } catch (error: any) {
      console.error(`[XML Cron] Genel Hata: ${error.message}`);
    }
  }

  async syncFeed(feedId: string) {
    const feed = await prisma.xmlFeed.findUnique({ where: { id: feedId } });
    if (!feed || !feed.isActive) return;
    // Onaylanmamış feed'ler asla senkronize edilmez
    if (feed.approvalStatus !== 'APPROVED') {
      console.log(`[XML Cron] '${feed.name}' onaylı değil (${feed.approvalStatus}), sync atlandı.`);
      return;
    }

    try {
      console.log(`[XML Cron] '${feed.name}' manual sync started... URL: ${feed.url}`);
      const xmlStream = await fetchRemoteXmlStream(feed.url);
      const fieldMapping = typeof feed.fieldMapping === 'string' ? JSON.parse(feed.fieldMapping) : feed.fieldMapping;
      const products = await xmlParserService.parseXMLStream(xmlStream, fieldMapping as any);
      
      const publishInfo = await xmlCatalogService.publishProducts({
        products,
        sourceUrl: feed.url,
        xmlFileName: feed.name,
        userId: feed.userId,
      });

      await prisma.xmlFeed.update({
        where: { id: feed.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: `SUCCESS: ${publishInfo.totalProducts} ürün çekildi.`
        }
      });
      console.log(`[XML Cron] '${feed.name}' başarıyla güncellendi.`);
    } catch (error: any) {
      console.error(`[XML Cron] Hata: '${feed.name}' güncellenemedi: ${error.message}`);
      await prisma.xmlFeed.update({
        where: { id: feed.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: `FAILED: ${error.message}`
        }
      });
    }
  }
}

export const xmlCronService = new XmlCronService();
