import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';

export const CartController = {
  async getCart(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const cart = await CartService.getCart(userId);
      res.json({ success: true, data: cart });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async addToCart(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const product = req.body;
      const cart = await CartService.addToCart(userId, product);
      res.json({ success: true, data: cart });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async removeFromCart(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { productId } = req.params;
      const cart = await CartService.removeFromCart(userId, productId);
      res.json({ success: true, data: cart });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async clearCart(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      await CartService.clearCart(userId);
      res.json({ success: true, message: 'Cart cleared' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
