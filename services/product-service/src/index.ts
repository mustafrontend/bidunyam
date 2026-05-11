import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { ZodError } from 'zod';

const app = express();
const PORT = Number(process.env.PORT) || 3002;

// ─── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ─── Health Check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'product-service',
    dbState: mongoose.connection.readyState,
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ────────────────────────────────────────────────────
app.get('/', ProductController.getAll);
app.get('/:id', ProductController.getById);

// ─── Error Handler ─────────────────────────────────────────────
app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Product] Error:', err.message);

  if (err instanceof ZodError) {
    res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
    return;
  }

  res.status(err.statusCode ?? 500).json({ success: false, message: err.message });
});

// ─── Start ─────────────────────────────────────────────────────
const start = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is not configured');

  await mongoose.connect(mongoUri);
  console.log('[Product] ✅ MongoDB connected');

  await ProductService.seedIfEmpty();

  app.listen(PORT, () => {
    console.log(`📦 Product Service running on http://localhost:${PORT}`);
  });
};

process.on('SIGTERM', async () => {
  await mongoose.disconnect();
  process.exit(0);
});

start().catch((err) => {
  console.error('[Product] Fatal startup error:', err);
  process.exit(1);
});
