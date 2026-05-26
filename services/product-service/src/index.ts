import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { ProductController } from './controllers/product.controller';
import prisma from './repositories/prisma.client';
import { ZodError } from 'zod';
import xmlUploadRoutes from './routes/xmlUpload.routes';
import campaignRoutes from './routes/campaign.routes';
import { authenticate, optionalAuthenticate, requireAdmin } from './middlewares/auth.middleware';

const app = express();
const PORT = Number(process.env.PORT) || 3002;

// ─── Static Files ──────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// ─── Health Check ──────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await prisma.$executeRawUnsafe('SELECT 1');
    res.json({
      status: 'ok',
      service: 'product-service',
      dbState: 'CONNECTED',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      service: 'product-service',
      dbState: 'DISCONNECTED',
      error: String(err),
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── Routes ────────────────────────────────────────────────────
// XML Upload Routes
app.use('/', xmlUploadRoutes);

// Campaign Routes
app.use('/campaigns', campaignRoutes);

// Product meta & admin endpoints
app.get('/meta/options', ProductController.getCatalogOptions);
app.post('/meta/brand', ProductController.createBrandOption);
app.post('/meta/category', ProductController.createCategoryOption);
app.get('/admin/:id', authenticate, ProductController.getByIdAny);
app.get('/admin/products/all', authenticate, requireAdmin, ProductController.getAdminProducts);

// Question & Answer endpoints
app.get('/:id/questions', ProductController.getQuestions);
app.post('/:id/questions', ProductController.createQuestion);
app.post('/questions/:questionId/answer', ProductController.answerQuestion);

// Review endpoints
app.get('/:id/reviews', ProductController.getReviews);
app.post('/:id/reviews', ProductController.createReview);

// Standard Product CRUD Routes
app.get('/', optionalAuthenticate, ProductController.getAll);
app.get('/:id', ProductController.getById);
app.post('/', authenticate, ProductController.create);
app.patch('/:id', authenticate, ProductController.update);
app.delete('/:id', authenticate, ProductController.remove);

// ─── Error Handler ─────────────────────────────────────────────
app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Product] Error:', err.message);

  if (err instanceof ZodError) {
    res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
    return;
  }

  res.status(err.statusCode ?? 500).json({ success: false, message: err.message });
});

import { ProductService } from './services/product.service';

// ─── Start ─────────────────────────────────────────────────────
const start = async (): Promise<void> => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured');

  await prisma.$connect();
  console.log('[Product] ✅ PostgreSQL connected via Prisma');

  // Seed sample products if database is empty
  await ProductService.seedProducts();

  // Sync products to Elasticsearch (Disabled since ES is not running)
  // await ProductService.syncAllToSearch();

  app.listen(PORT, () => {
    console.log(`📦 Product Service running on http://localhost:${PORT}`);
  });
};

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start().catch((err) => {
  console.error('[Product] Fatal startup error:', err);
  process.exit(1);
});
