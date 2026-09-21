/**
 * Production Security Headers Middleware
 * 
 * Enforces strict browser-side sandbox boundaries:
 * 1. Content-Security-Policy (CSP)
 * 2. Clickjacking mitigation (X-Frame-Options / frame-ancestors)
 * 3. MIME-sniffing prevention (X-Content-Type-Options)
 * 4. Cross-Origin isolation (COOP / CORP)
 * 5. Device capability restrictions (Permissions-Policy)
 */

import { NextFunction, Request, Response } from 'express';

export function productionSecurityHeaders(isProduction = process.env.NODE_ENV === 'production') {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 1. Content-Security-Policy
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join('; ')
    );

    // 2. MIME & Framing Controls
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 3. Device Capability Restrictions
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=()'
    );

    // 4. Cross-Origin Isolation
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // 5. HSTS (Only when deployed over HTTPS / in production)
    if (isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    next();
  };
}
