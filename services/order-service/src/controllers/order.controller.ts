import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { addOrderToQueue } from '../queue/order.queue';

export const OrderController = {
  async checkout(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      // Artık doğrudan yazmıyoruz, kuyruğa atıyoruz
      await addOrderToQueue({ userId, orderData: req.body });
      
      res.status(202).json({ 
        success: true, 
        message: 'Siparişiniz işleme alındı. Kuyrukta işleniyor...',
        status: 'PENDING'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const orders = await OrderService.getOrders(userId);
      res.json({ success: true, data: orders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getAdminOrders(req: Request, res: Response) {
    try {
      const orders = await OrderService.getAdminOrders();
      res.json({ success: true, data: orders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ─── Kargo ────────────────────────────────────────────────────
  async ship(req: Request, res: Response) {
    try {
      const order = await OrderService.createShipment(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async advanceTracking(req: Request, res: Response) {
    try {
      const order = await OrderService.advanceTracking(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getTracking(req: Request, res: Response) {
    try {
      const tracking = await OrderService.getTracking(req.params.id);
      if (!tracking) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
      res.json({ success: true, data: tracking });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const order = await OrderService.updateStatus(req.params.id, req.body.status);
      if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
