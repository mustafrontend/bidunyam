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
  }
};
