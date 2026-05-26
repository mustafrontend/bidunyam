import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { AuthController } from './controllers/auth.controller';
import { authenticate, requireCustomer, requireAdmin } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { prisma } from './repositories/prisma.client';
import { AuthService } from './services/auth.service';
import { getRedisClient } from './repositories/redis.client';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ─── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ─── Health Check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

// ─── Routes ────────────────────────────────────────────────────
// Müşteri (normal kullanıcı) rotaları
app.post('/register', AuthController.register);
app.post('/login', AuthController.login);
app.get('/profile', authenticate, AuthController.profile);

// Satıcı / Panel hesabı rotaları
app.post('/seller/register', AuthController.sellerRegister);
app.post('/seller/login', AuthController.sellerLogin);
app.get('/seller/profile', authenticate, AuthController.sellerProfile);

// Favoriler (müşteri)
app.get('/favorites', authenticate, requireCustomer, AuthController.getFavorites);
app.post('/favorites/:productId', authenticate, requireCustomer, AuthController.addFavorite);
app.delete('/favorites/:productId', authenticate, requireCustomer, AuthController.removeFavorite);

// Super Admin Rotaları
app.post('/admin/login', AuthController.adminLogin);
app.get('/admin/users', authenticate, requireAdmin, AuthController.getAdminUsers);
app.get('/admin/sellers', authenticate, requireAdmin, AuthController.getAdminSellers);

// ─── Error Handler ─────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ─────────────────────────────────────────────────────
const start = async (): Promise<void> => {
  try {
    // Connect Prisma
    await prisma.$connect();
    console.log('[Auth] ✅ PostgreSQL connected via Prisma');

    // Connect Redis
    const redis = getRedisClient();
    await redis.connect();

    // 🚀 Seed users
    await AuthService.seedUsers();

    app.listen(PORT, () => {
      console.log(`🔐 Auth Service running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Auth] Failed to start:', err);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ─────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('[Auth] SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
