/**
 * Request Tracing & Observability Middleware
 * 
 * Assigns a unique request ID (reqId) to every incoming request.
 * Logs response metrics without ever logging request bodies or user text.
 */

import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../services/logger.js';

export function requestTracer() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const reqId = (req.headers['x-request-id'] as string) || `req_${randomUUID().slice(0, 8)}`;

    res.setHeader('X-Request-Id', reqId);
    (req as any).reqId = reqId;

    // Hook response finish event to record execution telemetry
    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      logger.info('HTTP Request Completed', {
        reqId,
        endpoint: req.originalUrl || req.url,
        method: req.method,
        status: res.statusCode,
        durationMs,
        clientIp: rawIp,
      });
    });

    next();
  };
}
