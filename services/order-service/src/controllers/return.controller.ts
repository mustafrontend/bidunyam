import { Request, Response } from 'express';
import { ReturnService } from '../services/return.service';

export const ReturnController = {
  // Müşteri: iade talebi oluştur
  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { orderId, items, reason, description } = req.body;
      if (!orderId || !reason) {
        return res.status(400).json({ success: false, message: 'orderId ve reason gerekli' });
      }
      const ret = await ReturnService.createReturn(userId, orderId, { items, reason, description });
      res.status(201).json({ success: true, data: ret });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Müşteri: kendi iade taleplerim
  async myReturns(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const rets = await ReturnService.getMyReturns(userId);
      res.json({ success: true, data: rets });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Satıcı/Admin: tüm iade talepleri
  async allReturns(_req: Request, res: Response) {
    try {
      const rets = await ReturnService.getAllReturns();
      res.json({ success: true, data: rets });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async approve(req: Request, res: Response) {
    try {
      const ret = await ReturnService.approveReturn(req.params.id);
      if (!ret) return res.status(404).json({ success: false, message: 'İade talebi bulunamadı' });
      res.json({ success: true, data: ret });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async reject(req: Request, res: Response) {
    try {
      const ret = await ReturnService.rejectReturn(req.params.id, req.body.rejectReason || 'Uygun görülmedi');
      if (!ret) return res.status(404).json({ success: false, message: 'İade talebi bulunamadı' });
      res.json({ success: true, data: ret });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async refund(req: Request, res: Response) {
    try {
      const ret = await ReturnService.refund(req.params.id);
      if (!ret) return res.status(404).json({ success: false, message: 'İade talebi bulunamadı' });
      res.json({ success: true, data: ret });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
