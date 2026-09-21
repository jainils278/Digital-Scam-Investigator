/**
 * Production Sliding-Window Rate Limiter
 * 
 * Protects against brute-force DoS, burst automation, and AI resource exhaustion.
 * Enforces per-IP limits with privacy-preserving client identification.
 */

import { NextFunction, Request, Response } from 'express';
import { hashIpForPrivacy, logger } from '../services/logger.js';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  burstLimit?: number;
  message?: string;
  trustProxy?: boolean;
}

export interface RateLimitState {
  tokens: number;
  lastUpdated: number;
  requestTimestamps: number[];
}

export interface IRateLimiterStorage {
  consume(key: string, now: number): { allowed: boolean; remaining: number; resetTimeMs: number };
  prune(now: number): void;
}

export class InMemorySlidingWindowStorage implements IRateLimiterStorage {
  private store = new Map<string, RateLimitState>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly burstLimit: number;

  constructor(windowMs: number, maxRequests: number, burstLimit?: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.burstLimit = burstLimit || Math.ceil(maxRequests * 1.5);
  }

  public consume(key: string, now: number): { allowed: boolean; remaining: number; resetTimeMs: number } {
    let state = this.store.get(key);

    if (!state) {
      state = {
        tokens: this.burstLimit,
        lastUpdated: now,
        requestTimestamps: [],
      };
      this.store.set(key, state);
    }

    // Prune timestamps older than windowMs
    const windowStart = now - this.windowMs;
    state.requestTimestamps = state.requestTimestamps.filter((t) => t > windowStart);

    const currentCount = state.requestTimestamps.length;
    const remaining = Math.max(0, this.maxRequests - currentCount);
    const resetTimeMs = (state.requestTimestamps[0] || now) + this.windowMs;

    if (currentCount >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTimeMs,
      };
    }

    state.requestTimestamps.push(now);
    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - (currentCount + 1)),
      resetTimeMs,
    };
  }

  public prune(now: number): void {
    const windowStart = now - this.windowMs;
    for (const [key, state] of this.store.entries()) {
      state.requestTimestamps = state.requestTimestamps.filter((t) => t > windowStart);
      if (state.requestTimestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  public getStoreSize(): number {
    return this.store.size;
  }
}

export function createSlidingWindowRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    burstLimit,
    message = 'Rate limit exceeded. Please wait before submitting additional investigations.',
  } = options;

  const storage = new InMemorySlidingWindowStorage(windowMs, maxRequests, burstLimit);

  // Periodic memory eviction every 2 minutes
  const intervalId = setInterval(() => {
    storage.prune(Date.now());
  }, 2 * 60 * 1000);

  // Prevent background timer from blocking graceful exit
  if (intervalId.unref) {
    intervalId.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Determine client IP safely: only trust X-Forwarded-For if explicitly behind a trusted reverse proxy
      const forwarded = req.headers['x-forwarded-for'];
      const rawIp = options.trustProxy
        ? (typeof forwarded === 'string'
            ? forwarded.split(',')[0].trim()
            : req.socket.remoteAddress || '127.0.0.1')
        : (req.socket.remoteAddress || '127.0.0.1');

      const clientKey = hashIpForPrivacy(rawIp);
      const now = Date.now();
      const result = storage.consume(clientKey, now);

      // Standard Rate Limit Headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTimeMs / 1000).toString());

      if (!result.allowed) {
        const retryAfterSeconds = Math.max(1, Math.ceil((result.resetTimeMs - now) / 1000));
        res.setHeader('Retry-After', retryAfterSeconds.toString());

        logger.warn('Rate limit threshold reached', {
          clientIp: rawIp,
          endpoint: req.originalUrl || req.url,
          status: 429,
        });

        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message,
            retryAfterSeconds,
          },
        });
        return;
      }

      next();
    } catch (err: any) {
      // Safe failure behavior: Do not take down application if rate limiter errors
      logger.error('Rate limiter encountered unexpected error; failing open', {
        errorCategory: 'RATE_LIMIT_ERROR',
        details: err?.message,
      });
      next();
    }
  };
}
