import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { CartController } from './controllers/cart.controller';
import { getRedisClient } from './repositories/redis.client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// Auth Middleware (Same secret as Auth Service)
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

app.get('/health', (req, res) => res.json({ status: 'OK' }));

// Cart Routes
app.get('/', authenticate, CartController.getCart);
app.post('/add', authenticate, CartController.addToCart);
app.delete('/:productId', authenticate, CartController.removeFromCart);
app.delete('/', authenticate, CartController.clearCart);

const start = async () => {
  try {
    const redis = getRedisClient();
    await redis.connect();
    
    app.listen(PORT, () => {
      console.log(`🛒 Cart Service running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start cart service:', err);
    process.exit(1);
  }
};

start();
