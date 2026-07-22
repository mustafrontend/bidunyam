// ─────────────────────────────────────────────────────────────
// Komisyon (kâr oranı) ve kargo ücreti hesaplama motoru.
// Oranlar /admin panelinden parametrik olarak yönetilir; burada
// yalnızca "hangi orana göre ne hesaplanır" mantığı bulunur.
// ─────────────────────────────────────────────────────────────

import prisma from '../repositories/prisma.client';

const DEFAULT_KEY = '*';

/** Kurulumda bir kez yazılan makul başlangıç değerleri */
const SEED_COMMISSIONS: Array<{ categoryName: string; rate: number; bireyselRate?: number }> = [
  { categoryName: DEFAULT_KEY, rate: 12, bireyselRate: 8 },
  { categoryName: 'Elektronik', rate: 8, bireyselRate: 6 },
  { categoryName: 'Moda', rate: 18, bireyselRate: 12 },
  { categoryName: 'Giyim', rate: 18, bireyselRate: 12 },
  { categoryName: 'Ev & Yaşam', rate: 15, bireyselRate: 10 },
  { categoryName: 'Kozmetik', rate: 16, bireyselRate: 11 },
  { categoryName: 'Ayakkabı & Çanta', rate: 20, bireyselRate: 13 },
  { categoryName: 'Spor & Outdoor', rate: 14, bireyselRate: 10 },
  { categoryName: 'Anne & Bebek', rate: 13, bireyselRate: 9 },
  { categoryName: 'Kitap & Hobi', rate: 10, bireyselRate: 7 },
  { categoryName: 'Süpermarket', rate: 9, bireyselRate: 7 },
];

const SEED_SHIPPING: Array<{ label: string; minDesi: number; maxDesi: number; price: number }> = [
  { label: '0 - 1 Desi', minDesi: 0, maxDesi: 1, price: 54.9 },
  { label: '1 - 2 Desi', minDesi: 1, maxDesi: 2, price: 64.9 },
  { label: '2 - 3 Desi', minDesi: 2, maxDesi: 3, price: 74.9 },
  { label: '3 - 5 Desi', minDesi: 3, maxDesi: 5, price: 89.9 },
  { label: '5 - 10 Desi', minDesi: 5, maxDesi: 10, price: 119.9 },
  { label: '10 - 20 Desi', minDesi: 10, maxDesi: 20, price: 179.9 },
  { label: '20 - 30 Desi', minDesi: 20, maxDesi: 30, price: 249.9 },
];

export interface QuoteItem {
  price: number;
  quantity?: number;
  categoryPath?: string;
  categoryName?: string;
  listingType?: string; // KURUMSAL | BIREYSEL
  desi?: number;
}

export interface QuoteLine {
  categoryName: string;
  gross: number;
  commissionRate: number;
  commission: number;
}

export interface Quote {
  gross: number;
  commissionTotal: number;
  serviceFee: number;
  transactionFee: number;
  shippingCost: number;
  freeShippingApplied: boolean;
  totalDesi: number;
  sellerPayout: number;
  buyerTotal: number;
  lines: QuoteLine[];
}

/** "Elektronik > Cep Telefonu" → "Elektronik" */
function mainCategory(item: QuoteItem): string {
  const raw = (item.categoryPath || item.categoryName || '').trim();
  if (!raw) return DEFAULT_KEY;
  return raw.split('>')[0].trim() || DEFAULT_KEY;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const PricingService = {
  /**
   * İlk kurulumda varsayılan tarifeleri yazar (idempotent — mevcut kayda dokunmaz).
   * Tablolar henüz oluşmamışsa (auth-service db push'u bitmediyse) kısa aralıklarla
   * yeniden dener; hata sessizce yutulmaz, loglanır.
   */
  async seed(attempt = 1): Promise<void> {
    const MAX_ATTEMPTS = 5;
    try {
      for (const c of SEED_COMMISSIONS) {
        await prisma.commissionRate.upsert({
          where: { categoryName: c.categoryName },
          create: c,
          update: {}, // admin değiştirdiyse ezme
        });
      }

      if ((await prisma.shippingRate.count()) === 0) {
        await prisma.shippingRate.createMany({ data: SEED_SHIPPING });
      }

      await prisma.platformSetting.upsert({
        where: { id: 'default' },
        create: { id: 'default' },
        update: {},
      });

      console.log(
        `[Pricing] Tarifeler hazır: ${SEED_COMMISSIONS.length} komisyon kuralı, ${SEED_SHIPPING.length} kargo kademesi`
      );
    } catch (err) {
      if (attempt < MAX_ATTEMPTS) {
        console.warn(`[Pricing] Seed denemesi ${attempt} başarısız, 3 sn sonra tekrar denenecek.`);
        await new Promise((r) => setTimeout(r, 3000));
        return this.seed(attempt + 1);
      }
      console.error('[Pricing] Seed başarısız:', err);
    }
  },

  async getSettings() {
    const s = await prisma.platformSetting.findUnique({ where: { id: 'default' } }).catch(() => null);
    return (
      s || {
        id: 'default',
        freeShippingLimit: 500,
        perDesiPrice: 25,
        payoutHoldDays: 14,
        serviceFeeRate: 0,
        transactionFee: 0,
        updatedAt: new Date(),
      }
    );
  },

  async listCommissions() {
    return prisma.commissionRate.findMany({ orderBy: [{ categoryName: 'asc' }] });
  },

  async listShipping() {
    return prisma.shippingRate.findMany({ orderBy: [{ minDesi: 'asc' }] });
  },

  /** Kategori + satıcı tipine göre yürürlükteki komisyon yüzdesi. */
  async commissionRateFor(categoryName: string, listingType?: string): Promise<number> {
    const rows = await prisma.commissionRate.findMany({ where: { isActive: true } }).catch(() => []);
    const byName = new Map(rows.map((r) => [r.categoryName.toLocaleLowerCase('tr'), r]));
    const hit = byName.get(categoryName.toLocaleLowerCase('tr')) || byName.get(DEFAULT_KEY);
    if (!hit) return 0;
    if (listingType === 'BIREYSEL' && typeof hit.bireyselRate === 'number') return hit.bireyselRate;
    return hit.rate;
  },

  /** Desiye karşılık gelen kargo ücreti; aralık yoksa desi başına ücret uygulanır. */
  async shippingCostFor(desi: number): Promise<number> {
    const d = Math.max(0, Number(desi) || 0);
    const rates = await prisma.shippingRate.findMany({ where: { isActive: true }, orderBy: { minDesi: 'asc' } }).catch(() => []);
    const band = rates.find((r) => d > r.minDesi - 0.0001 && d <= r.maxDesi + 0.0001);
    if (band) return round2(band.price);

    const settings = await this.getSettings();
    // Tarifenin üstünde kalan ağır gönderiler: en yüksek band + aşan desi başına ücret
    const top = rates[rates.length - 1];
    if (top && d > top.maxDesi) {
      return round2(top.price + (d - top.maxDesi) * settings.perDesiPrice);
    }
    return round2(d * settings.perDesiPrice);
  },

  /**
   * Sepet/sipariş için tam kırılım: komisyon, hizmet bedeli, kargo ve
   * satıcı hakedişi. Sipariş anında hesaplanıp siparişe yazılır ki
   * sonradan oran değişse bile geçmiş siparişler etkilenmesin.
   */
  async quote(items: QuoteItem[], opts?: { desi?: number }): Promise<Quote> {
    const settings = await this.getSettings();
    const list = Array.isArray(items) ? items : [];

    const lines: QuoteLine[] = [];
    let gross = 0;
    let commissionTotal = 0;
    let totalDesi = 0;

    for (const item of list) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const lineGross = round2((Number(item.price) || 0) * qty);
      const cat = mainCategory(item);
      const rate = await this.commissionRateFor(cat, item.listingType);
      const commission = round2((lineGross * rate) / 100);

      gross += lineGross;
      commissionTotal += commission;
      totalDesi += (Number(item.desi) || 1) * qty;

      lines.push({ categoryName: cat, gross: lineGross, commissionRate: rate, commission });
    }

    if (typeof opts?.desi === 'number' && opts.desi > 0) totalDesi = opts.desi;

    gross = round2(gross);
    commissionTotal = round2(commissionTotal);

    const serviceFee = round2((gross * (settings.serviceFeeRate || 0)) / 100);
    const transactionFee = round2(settings.transactionFee || 0);

    const rawShipping = await this.shippingCostFor(totalDesi);
    const freeShippingApplied = settings.freeShippingLimit > 0 && gross >= settings.freeShippingLimit;
    const shippingCost = freeShippingApplied ? 0 : rawShipping;

    return {
      gross,
      commissionTotal,
      serviceFee,
      transactionFee,
      shippingCost,
      freeShippingApplied,
      totalDesi: round2(totalDesi),
      // Kargoyu platform/satıcı üstlenir: hakedişten düşülür
      sellerPayout: round2(gross - commissionTotal - serviceFee - transactionFee - shippingCost),
      buyerTotal: round2(gross + shippingCost),
      lines,
    };
  },
};
