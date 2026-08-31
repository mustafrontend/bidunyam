import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { PaymentController } from './controllers/payment.controller';
import { ReturnController } from './controllers/return.controller';
import { startOrderWorker } from './queue/order.worker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
// Banka 3DS callback'i application/x-www-form-urlencoded POST eder
app.use(express.urlencoded({ extended: true }));

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Only super admins can access this route' });
  }
  next();
};

const requireSellerOrAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SELLER') {
    return res.status(403).json({ message: 'Only sellers or admins can access this route' });
  }
  next();
};

// Routes — ÖNEMLİ: spesifik path'ler /:id catch-all'dan ÖNCE tanımlanmalı
app.post('/checkout', authenticate, OrderController.checkout);
app.get('/history', authenticate, OrderController.list);
app.get('/my-orders', authenticate, OrderController.list);
app.get('/', authenticate, requireSellerOrAdmin, OrderController.getAdminOrders);
app.get('/admin/all', authenticate, requireAdmin, OrderController.getAdminOrders);

// İyzico ödeme (gerçek — 3D Secure)
app.post('/payment/installments', authenticate, PaymentController.installments);
app.post('/payment/init', authenticate, PaymentController.init);
// Banka 3DS ekranının döndüğü public callback (JWT yok — banka tarayıcıdan POST eder)
app.post('/payment/3ds/callback', PaymentController.callback3DS);
// Opener'ın yetkili sonucu çektiği uç
app.get('/payment/3ds/result', authenticate, PaymentController.result3DS);

// İade süreci
app.post('/returns', authenticate, ReturnController.create);
app.get('/returns/my', authenticate, ReturnController.myReturns);
app.get('/returns', authenticate, requireSellerOrAdmin, ReturnController.allReturns);
app.post('/returns/:id/approve', authenticate, requireSellerOrAdmin, ReturnController.approve);
app.post('/returns/:id/reject', authenticate, requireSellerOrAdmin, ReturnController.reject);
app.post('/returns/:id/refund', authenticate, requireSellerOrAdmin, ReturnController.refund);

// Kırılımı eksik kalmış siparişleri güncel tarifeyle tamamla (admin)
// NOT: /:id kalıplarından ÖNCE tanımlanmalı.
app.post('/admin/pricing/backfill', authenticate, requireAdmin, async (_req, res) => {
  try {
    const fixed = await OrderService.backfillPricing(500);
    res.json({ success: true, message: `${fixed} siparişin komisyon kırılımı tamamlandı.`, fixed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Kargo (Navlungo) — satıcı/admin gönderi oluşturur, takip ilerletir
app.post('/:id/ship', authenticate, OrderController.ship);
app.post('/:id/advance', authenticate, OrderController.advanceTracking);
app.patch('/:id/status', authenticate, OrderController.updateStatus);
app.get('/:id/tracking', OrderController.getTracking);
app.get('/:id', authenticate, OrderController.getById);

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('[Order] 📦 MongoDB connected');

    // 🚀 Start Queue Worker
    startOrderWorker();

    // Fiyatlandırma servisi geçici erişilemezken kaydedilmiş siparişleri tamamla
    setTimeout(() => {
      OrderService.backfillPricing(200).catch((e) =>
        console.error('[Pricing] Backfill hatası:', e.message)
      );
    }, 10000);

    app.listen(PORT, () => {
      console.log(`📦 Order Service running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start order service:', err);
    process.exit(1);
  }
};

start();
