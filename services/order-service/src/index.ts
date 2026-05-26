import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { OrderController } from './controllers/order.controller';
import { startOrderWorker } from './queue/order.worker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

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

// Routes
app.post('/checkout', authenticate, OrderController.checkout);
app.get('/history', authenticate, OrderController.list);
app.get('/admin/all', authenticate, requireAdmin, OrderController.getAdminOrders);

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('[Order] 📦 MongoDB connected');

    // 🚀 Start Queue Worker
    startOrderWorker();

    app.listen(PORT, () => {
      console.log(`📦 Order Service running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start order service:', err);
    process.exit(1);
  }
};

start();
