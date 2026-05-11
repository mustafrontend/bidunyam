"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 8080;
const configuredFrontendUrl = process.env.FRONTEND_URL;
// ─── Security Middleware ───────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (configuredFrontendUrl) {
            callback(null, origin === configuredFrontendUrl);
            return;
        }
        callback(null, origin || true);
    },
    credentials: true,
}));
app.use((0, morgan_1.default)('combined'));
// ─── Rate Limiting ─────────────────────────────────────────────
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);
// ─── Health Check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// ─── Proxy Factory ─────────────────────────────────────────────
const buildProxy = (target, pathRewrite) => ({
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
        error: (err, _req, res) => {
            console.error(`[Gateway] Proxy error: ${err.message}`);
            res.status(502).json({
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
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;
if (!AUTH_SERVICE_URL || !PRODUCT_SERVICE_URL) {
    console.error('[Gateway] FATAL: Service URLs are not configured!');
    process.exit(1);
}
app.use('/auth', (0, http_proxy_middleware_1.createProxyMiddleware)(buildProxy(AUTH_SERVICE_URL, { '^/auth': '' })));
app.use('/products', (0, http_proxy_middleware_1.createProxyMiddleware)(buildProxy(PRODUCT_SERVICE_URL, { '^/products': '' })));
app.use('/cart', (0, http_proxy_middleware_1.createProxyMiddleware)(buildProxy(process.env.CART_SERVICE_URL || 'http://cart-service:3004', { '^/cart': '' })));
app.use('/orders', (0, http_proxy_middleware_1.createProxyMiddleware)(buildProxy(process.env.ORDER_SERVICE_URL || 'http://order-service:3005', { '^/orders': '' })));
app.use('/search', (0, http_proxy_middleware_1.createProxyMiddleware)(buildProxy(process.env.SEARCH_SERVICE_URL || 'http://search-service:3006', { '^/search': '' })));
// ─── 404 Fallback ──────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found', message: 'Route does not exist on this gateway' });
});
// ─── Global Error Handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Gateway] Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});
// ─── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚦 API Gateway running on http://localhost:${PORT}`);
    console.log(`   ↳ /auth       → ${AUTH_SERVICE_URL}`);
    console.log(`   ↳ /products   → ${PRODUCT_SERVICE_URL}`);
});
//# sourceMappingURL=index.js.map