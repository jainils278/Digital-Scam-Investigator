import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../Backend/src/index.js';

describe('Production Security Headers & CORS Tests', () => {
  it('attaches comprehensive defensive HTTP headers to responses', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);

    // 1. Content Security Policy
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");

    // 2. MIME Sniffing & Framing
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

    // 3. Permissions Policy
    const permissionsPolicy = res.headers['permissions-policy'];
    expect(permissionsPolicy).toBeDefined();
    expect(permissionsPolicy).toContain('camera=()');
    expect(permissionsPolicy).toContain('microphone=()');

    // 4. Cross-Origin Isolation
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin');

    // 5. Request Tracing ID
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id']).toMatch(/^req_/);
  });

  it('enforces rate limit headers on API requests', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });

  it('rejects payloads larger than 50KB with HTTP 413 Payload Too Large', async () => {
    const hugePayload = {
      text: 'A'.repeat(60 * 1024), // 60KB
      messageType: 'sms',
    };

    const res = await request(app)
      .post('/api/investigate')
      .send(hugePayload);

    expect(res.status).toBe(413);
  });
});

