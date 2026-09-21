import { describe, expect, it } from 'vitest';
import {
  InMemorySlidingWindowStorage,
  createSlidingWindowRateLimiter,
} from '../Backend/src/middleware/rate_limiter.js';

describe('Sliding-Window Rate Limiter Unit Tests', () => {
  it('allows requests within limit and decrements remaining tokens', () => {
    const storage = new InMemorySlidingWindowStorage(60000, 5, 10);
    const now = 1000000;
    const clientKey = 'test-client-1';

    // 1st request
    const r1 = storage.consume(clientKey, now);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(4);

    // 2nd request
    const r2 = storage.consume(clientKey, now + 100);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(3);

    // 3rd request
    const r3 = storage.consume(clientKey, now + 200);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(2);

    // 4th request
    const r4 = storage.consume(clientKey, now + 300);
    expect(r4.allowed).toBe(true);
    expect(r4.remaining).toBe(1);

    // 5th request (last permitted)
    const r5 = storage.consume(clientKey, now + 400);
    expect(r5.allowed).toBe(true);
    expect(r5.remaining).toBe(0);

    // 6th request (exceeds limit)
    const r6 = storage.consume(clientKey, now + 500);
    expect(r6.allowed).toBe(false);
    expect(r6.remaining).toBe(0);
    expect(r6.resetTimeMs).toBeGreaterThan(now);
  });

  it('slides window and restores capacity once window expires', () => {
    const storage = new InMemorySlidingWindowStorage(1000, 2);
    const now = 5000;
    const clientKey = 'test-client-2';

    // Consume 2 requests
    storage.consume(clientKey, now);
    storage.consume(clientKey, now + 100);

    // Block 3rd request
    const blocked = storage.consume(clientKey, now + 200);
    expect(blocked.allowed).toBe(false);

    // Fast-forward past windowMs (1000ms)
    const future = now + 1100;
    const restored = storage.consume(clientKey, future);
    expect(restored.allowed).toBe(true);
    expect(restored.remaining).toBe(1);
  });

  it('isolates different clients by key', () => {
    const storage = new InMemorySlidingWindowStorage(60000, 2);
    const now = 1000;

    storage.consume('client-a', now);
    storage.consume('client-a', now);
    const clientABlocked = storage.consume('client-a', now);
    expect(clientABlocked.allowed).toBe(false);

    // Client B should still be allowed
    const clientB = storage.consume('client-b', now);
    expect(clientB.allowed).toBe(true);
    expect(clientB.remaining).toBe(1);
  });

  it('prunes expired entries from memory store', () => {
    const storage = new InMemorySlidingWindowStorage(500, 2);
    const now = 10000;

    storage.consume('client-ephemeral', now);
    expect(storage.getStoreSize()).toBe(1);

    // Advance 600ms past window
    storage.prune(now + 600);
    expect(storage.getStoreSize()).toBe(0);
  });

  it('middleware ignores spoofed X-Forwarded-For when trustProxy is false', () => {
    const limiter = createSlidingWindowRateLimiter({
      windowMs: 60000,
      maxRequests: 2,
      trustProxy: false,
    });

    let nextCalled = 0;
    const next = () => {
      nextCalled++;
    };

    let statusCode = 200;
    let responseBody: any = null;
    const headers: Record<string, string> = {};

    const createReq = (spoofedIp: string) =>
      ({
        headers: { 'x-forwarded-for': spoofedIp },
        socket: { remoteAddress: '127.0.0.1' },
        originalUrl: '/api/test',
        method: 'POST',
      } as any);

    const createRes = () =>
      ({
        setHeader: (k: string, v: string) => {
          headers[k] = v;
        },
        status: (code: number) => {
          statusCode = code;
          return {
            json: (body: any) => {
              responseBody = body;
            },
          };
        },
      } as any);

    // Request 1 with spoofed header "1.1.1.1"
    limiter(createReq('1.1.1.1'), createRes(), next);
    expect(nextCalled).toBe(1);

    // Request 2 with spoofed header "2.2.2.2"
    limiter(createReq('2.2.2.2'), createRes(), next);
    expect(nextCalled).toBe(2);

    // Request 3 with spoofed header "3.3.3.3" - MUST be blocked because remoteAddress is 127.0.0.1
    limiter(createReq('3.3.3.3'), createRes(), next);
    expect(nextCalled).toBe(2); // Not incremented
    expect(statusCode).toBe(429);
    expect(responseBody.error.code).toBe('RATE_LIMITED');
  });
});

