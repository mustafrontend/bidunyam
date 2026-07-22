import { Router, Request, Response } from 'express';
import { PricingService } from '../services/pricing.service';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middlewares/auth.middleware';
import prisma from '../repositories/prisma.client';

const router = Router();

/** Yürürlükteki tarifeler — satıcı paneli ve sepet bunu okur. */
router.get('/pricing/rates', async (_req: Request, res: Response) => {
  try {
    const [commissions, shipping, settings] = await Promise.all([
      PricingService.listCommissions(),
      PricingService.listShipping(),
      PricingService.getSettings(),
    ]);
    res.json({ success: true, data: { commissions, shipping, settings } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** Sepet/sipariş kırılımı: komisyon, kargo, satıcı hakedişi. */
router.post('/pricing/quote', async (req: Request, res: Response) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'items zorunludur' });
    }
    const quote = await PricingService.quote(items, { desi: Number(req.body?.desi) || undefined });
    res.json({ success: true, data: quote });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Admin: komisyon oranları ────────────────────────────────────
router.put('/admin/pricing/commissions', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    let saved = 0;
    for (const r of rows) {
      const categoryName = String(r.categoryName || '').trim();
      if (!categoryName) continue;
      const rate = Number(r.rate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        return res.status(400).json({ success: false, message: `${categoryName}: oran 0-100 arasında olmalı` });
      }
      const bireysel = r.bireyselRate === null || r.bireyselRate === undefined || r.bireyselRate === ''
        ? null
        : Number(r.bireyselRate);
      if (bireysel !== null && (!Number.isFinite(bireysel) || bireysel < 0 || bireysel > 100)) {
        return res.status(400).json({ success: false, message: `${categoryName}: bireysel oran 0-100 arasında olmalı` });
      }

      await prisma.commissionRate.upsert({
        where: { categoryName },
        create: { categoryName, rate, bireyselRate: bireysel, isActive: r.isActive !== false },
        update: { rate, bireyselRate: bireysel, isActive: r.isActive !== false },
      });
      saved += 1;
    }
    res.json({ success: true, message: `${saved} komisyon oranı kaydedildi.`, saved });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/admin/pricing/commissions/:categoryName', authenticate, requireAdmin, async (req, res) => {
  try {
    const categoryName = decodeURIComponent(req.params.categoryName);
    if (categoryName === '*') {
      return res.status(400).json({ success: false, message: 'Varsayılan oran silinemez' });
    }
    await prisma.commissionRate.delete({ where: { categoryName } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Admin: kargo tarifesi ───────────────────────────────────────
router.put('/admin/pricing/shipping', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    for (const r of rows) {
      const minDesi = Number(r.minDesi);
      const maxDesi = Number(r.maxDesi);
      const price = Number(r.price);
      if (!Number.isFinite(minDesi) || !Number.isFinite(maxDesi) || maxDesi <= minDesi) {
        return res.status(400).json({ success: false, message: 'Desi aralığı geçersiz (üst sınır alt sınırdan büyük olmalı)' });
      }
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ success: false, message: 'Kargo ücreti geçersiz' });
      }
    }

    // Tarife bir bütün olarak değiştirilir (aralıkların tutarlı kalması için)
    await prisma.$transaction([
      prisma.shippingRate.deleteMany({}),
      prisma.shippingRate.createMany({
        data: rows.map((r: any) => ({
          label: String(r.label || `${r.minDesi} - ${r.maxDesi} Desi`).slice(0, 60),
          minDesi: Number(r.minDesi),
          maxDesi: Number(r.maxDesi),
          price: Number(r.price),
          isActive: r.isActive !== false,
        })),
      }),
    ]);

    res.json({ success: true, message: `${rows.length} kargo kademesi kaydedildi.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Admin: genel ayarlar ────────────────────────────────────────
router.put('/admin/pricing/settings', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const num = (v: unknown, fallback: number) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : fallback;
    };
    const current = await PricingService.getSettings();
    const data = {
      freeShippingLimit: num(req.body?.freeShippingLimit, current.freeShippingLimit),
      perDesiPrice: num(req.body?.perDesiPrice, current.perDesiPrice),
      payoutHoldDays: Math.round(num(req.body?.payoutHoldDays, current.payoutHoldDays)),
      serviceFeeRate: Math.min(100, num(req.body?.serviceFeeRate, current.serviceFeeRate)),
      transactionFee: num(req.body?.transactionFee, current.transactionFee),
    };

    const saved = await prisma.platformSetting.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    });
    res.json({ success: true, message: 'Ayarlar kaydedildi.', data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
