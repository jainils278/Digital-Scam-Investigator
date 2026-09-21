/**
 * Digital Scam Investigator - Server Entry Point (V2 Production Hardened)
 * 
 * Defensive, resilient Express backend.
 * Features:
 * - Content-Security-Policy & production security headers
 * - Sliding-window rate limiting with burst tolerance & IP hashing
 * - Structured privacy-preserving JSON logging (zero raw user text)
 * - Strict CORS policy & payload size barriers
 * - Centralized safe error boundary (zero stack trace leaks)
 */

import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import { config } from './config/env.js';
import { createSlidingWindowRateLimiter } from './middleware/rate_limiter.js';
import { requestTracer } from './middleware/request_tracer.js';
import { productionSecurityHeaders } from './middleware/security_headers.js';
import { createInvestigationRouter } from './routes/investigation.js';
import { InvestigationService } from './services/investigation.js';
import { logger } from './services/logger.js';

dotenv.config();

const app = express();
const PORT = config.port;

// 1. Observability: Request Tracing & Structured Latency Logging
app.use(requestTracer());

// 2. Defensive HTTP Security Headers (CSP, HSTS, Framing, Permissions)
app.use(productionSecurityHeaders(config.nodeEnv === 'production'));

// 3. Strict CORS Policy
app.use(
  cors({
    origin: config.corsAllowedOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-Request-Id'],
  })
);

// 4. Strict Payload Size Limiting
// General endpoints: 50KB max (prevents memory exhaustion)
// Screenshot endpoint: 7MB max (supports up to 5MB images base64 encoded)
app.use('/api/investigate/screenshot', express.json({ limit: '7mb' }));
app.use(express.json({ limit: `${Math.ceil(config.maxPayloadSizeBytes / 1024)}kb` }));

// Configure trust proxy if running behind a trusted reverse proxy (e.g. AWS ALB, Cloudflare, Nginx)
if (config.trustProxy) {
  app.set('trust proxy', 1);
}

// 5. Sliding-Window Rate Limiter (60 requests / minute per IP with burst protection)
const apiRateLimiter = createSlidingWindowRateLimiter({
  windowMs: config.rateLimitWindowMs,
  maxRequests: config.rateLimitMaxRequests,
  burstLimit: Math.ceil(config.rateLimitMaxRequests * 1.5),
  trustProxy: config.trustProxy,
  message: 'Rate limit exceeded. Please wait before submitting additional investigations.',
});

app.use('/api', apiRateLimiter);

// 6. Initialize Investigation Service and Routes
const investigationService = new InvestigationService();
app.use('/api', createInvestigationRouter(investigationService));

// 7. Root Health / Info Check
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Digital Scam Investigator API',
    version: '2.0.0',
    status: 'operational',
    docs: 'POST /api/investigate, GET /api/examples, GET /api/health',
  });
});

// 8. 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist.',
    },
  });
});

// 9. Central Error Handler (Zero stack trace leaks, respects HTTP 413 / status codes)
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const status = typeof err.status === 'number' ? err.status : 500;
  const isPayloadTooLarge = status === 413 || err.type === 'entity.too.large';

  logger.error('Unhandled server exception caught by root error boundary', {
    reqId: (req as any).reqId,
    endpoint: req.originalUrl || req.url,
    errorCategory: isPayloadTooLarge ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL_SERVER_ERROR',
    status: isPayloadTooLarge ? 413 : status,
    details: err?.message,
  });

  if (isPayloadTooLarge) {
    res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeds maximum allowed limit of 50KB.',
      },
    });
    return;
  }

  res.status(status).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'An internal server error occurred. Please try again.',
    },
  });
});

// Export app for testing
export { app };

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server operational on http://localhost:${PORT}`, {
      port: PORT,
      nodeEnv: config.nodeEnv,
      activeAiEngine: investigationService.getActiveAiProviderInfo().providerName,
      isRealAi: investigationService.getActiveAiProviderInfo().isRealAi,
    });
  });
}
