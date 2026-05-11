import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const configuredFrontendUrl = process.env.FRONTEND_URL;

// ─── Security Middleware ───────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (configuredFrontendUrl) {
        callback(null, origin === configuredFrontendUrl);
        return;
      }

      callback(null, origin || true);
    },
    credentials: true,
  })
);
app.use(morgan('combined'));

// ─── Rate Limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ─── Health Check ──────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Proxy Factory ─────────────────────────────────────────────
const buildProxy = (target: string, pathRewrite: Record<string, string>): Options => ({
  target,
  changeOrigin: true,
  pathRewrite,
  on: {
    error: (err: Error, _req, res) => {
      console.error(`[Gateway] Proxy error: ${err.message}`);
      (res as Response).status(502).json({
        error: 'Bad Gateway',
        message: 'Upstream service unavailable',
      });
    },
    proxyReq: (proxyReq, req) => {
      proxyReq.setHeader('X-Gateway-Request-Id', Date.now().toString());
      proxyReq.setHeader('X-Forwarded-Host', req.headers.host || '');
    },
  },
});

// ─── Routes ────────────────────────────────────────────────────
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL!;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL!;

if (!AUTH_SERVICE_URL || !PRODUCT_SERVICE_URL) {
  console.error('[Gateway] FATAL: Service URLs are not configured!');
  process.exit(1);
}

app.use('/auth', createProxyMiddleware(buildProxy(AUTH_SERVICE_URL, { '^/auth': '' })));
app.use('/products', createProxyMiddleware(buildProxy(PRODUCT_SERVICE_URL, { '^/products': '' })));
app.use('/cart', createProxyMiddleware(buildProxy(process.env.CART_SERVICE_URL || 'http://cart-service:3004', { '^/cart': '' })));
app.use('/orders', createProxyMiddleware(buildProxy(process.env.ORDER_SERVICE_URL || 'http://order-service:3005', { '^/orders': '' })));
app.use('/search', createProxyMiddleware(buildProxy(process.env.SEARCH_SERVICE_URL || 'http://search-service:3006', { '^/search': '' })));

// ─── 404 Fallback ──────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', message: 'Route does not exist on this gateway' });
});

// ─── Global Error Handler ──────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Gateway] Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ─── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚦 API Gateway running on http://localhost:${PORT}`);
  console.log(`   ↳ /auth       → ${AUTH_SERVICE_URL}`);
  console.log(`   ↳ /products   → ${PRODUCT_SERVICE_URL}`);
});
