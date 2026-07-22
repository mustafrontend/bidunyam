// ─────────────────────────────────────────────────────────────
// Fiyatlandırma istemcisi.
// Komisyon ve kargo tarifesi product-service'te (Postgres) tutulur;
// sipariş oluşurken oradan kırılım alınır ve siparişe yazılır.
// Servise ulaşılamazsa sipariş ASLA düşmez — kırılım "resolved: false"
// olarak işaretlenir, hakediş sonradan hesaplanır.
// ─────────────────────────────────────────────────────────────

import type { IPricingSnapshot } from '../models/order.model';

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
const TIMEOUT_MS = 4000;

export interface PricingQuoteItem {
  price: number;
  quantity?: number;
  categoryPath?: string;
  categoryName?: string;
  listingType?: string;
  desi?: number;
}

function emptySnapshot(gross: number): IPricingSnapshot {
  return {
    gross,
    commissionTotal: 0,
    serviceFee: 0,
    transactionFee: 0,
    shippingCost: 0,
    freeShippingApplied: false,
    totalDesi: 0,
    sellerPayout: gross,
    buyerTotal: gross,
    lines: [],
    calculatedAt: new Date(),
    resolved: false,
  };
}

export const PricingClient = {
  /**
   * Sipariş kalemleri için komisyon/kargo kırılımını alır.
   * Hata durumunda çözümlenmemiş bir anlık görüntü döner (sipariş engellenmez).
   */
  async quote(items: PricingQuoteItem[], desi?: number): Promise<IPricingSnapshot> {
    const gross = items.reduce(
      (sum, i) => sum + (Number(i.price) || 0) * Math.max(1, Number(i.quantity) || 1),
      0
    );

    if (items.length === 0) return emptySnapshot(0);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${PRODUCT_SERVICE_URL}/pricing/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, desi }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`pricing/quote ${res.status}`);
      const json: any = await res.json();
      const q = json?.data;
      if (!q) throw new Error('Boş fiyatlandırma yanıtı');

      return {
        gross: q.gross,
        commissionTotal: q.commissionTotal,
        serviceFee: q.serviceFee,
        transactionFee: q.transactionFee,
        shippingCost: q.shippingCost,
        freeShippingApplied: q.freeShippingApplied,
        totalDesi: q.totalDesi,
        sellerPayout: q.sellerPayout,
        buyerTotal: q.buyerTotal,
        lines: q.lines || [],
        calculatedAt: new Date(),
        resolved: true,
      };
    } catch (err) {
      console.error('[Pricing] Kırılım alınamadı, sipariş kırılımsız kaydediliyor:', (err as Error).message);
      return emptySnapshot(Math.round(gross * 100) / 100);
    } finally {
      clearTimeout(timer);
    }
  },
};
