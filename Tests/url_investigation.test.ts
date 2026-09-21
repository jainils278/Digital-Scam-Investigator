import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../Backend/src/index.js';
import { detectIndicators } from '../Backend/src/services/detector.js';
import { normalizeForAnalysis } from '../Backend/src/services/normalizer.js';
import { isPrivateOrBlockedIp, validateUrlForSafeFetch } from '../Backend/src/services/url/ssrf_guard.js';
import { analyzeUrl, extractUrlsWithRanges } from '../Backend/src/services/url/url_analyzer.js';

describe('Phase 2 — URL & Domain Investigation Engine', () => {
  describe('SSRF Guard & Prober Defense', () => {
    it('correctly classifies private, loopback, and reserved IPv4/IPv6 addresses as blocked', () => {
      expect(isPrivateOrBlockedIp('127.0.0.1')).toBe(true);
      expect(isPrivateOrBlockedIp('127.0.1.5')).toBe(true);
      expect(isPrivateOrBlockedIp('10.0.0.1')).toBe(true);
      expect(isPrivateOrBlockedIp('172.16.0.1')).toBe(true);
      expect(isPrivateOrBlockedIp('172.31.255.254')).toBe(true);
      expect(isPrivateOrBlockedIp('192.168.1.1')).toBe(true);
      expect(isPrivateOrBlockedIp('169.254.169.254')).toBe(true); // AWS/GCP Metadata
      expect(isPrivateOrBlockedIp('0.0.0.0')).toBe(true);
      expect(isPrivateOrBlockedIp('::1')).toBe(true);
      expect(isPrivateOrBlockedIp('::')).toBe(true);
      expect(isPrivateOrBlockedIp('fc00::1')).toBe(true);
      expect(isPrivateOrBlockedIp('fe80::1')).toBe(true);
      expect(isPrivateOrBlockedIp('::ffff:127.0.0.1')).toBe(true);

      // Public routable IPs should NOT be blocked
      expect(isPrivateOrBlockedIp('8.8.8.8')).toBe(false);
      expect(isPrivateOrBlockedIp('1.1.1.1')).toBe(false);
      expect(isPrivateOrBlockedIp('93.184.216.34')).toBe(false); // example.com
    });

    it('blocks loopback and localhost destinations with clear reasons', async () => {
      const result1 = await validateUrlForSafeFetch('http://127.0.0.1/admin');
      expect(result1.isSafe).toBe(false);
      expect(result1.reason).toContain('PRIVATE_OR_RESERVED_IP');

      const result2 = await validateUrlForSafeFetch('http://localhost:8080/metrics');
      expect(result2.isSafe).toBe(false);
      expect(result2.reason).toContain('BLOCKED_HOSTNAME');

      // IPv6 bracketed loopback and link-local destinations
      const resultIpv6Loopback = await validateUrlForSafeFetch('http://[::1]:8080/admin');
      expect(resultIpv6Loopback.isSafe).toBe(false);
      expect(resultIpv6Loopback.reason).toContain('PRIVATE_OR_RESERVED_IP');

      const resultIpv6LinkLocal = await validateUrlForSafeFetch('http://[fe80::1]/secrets');
      expect(resultIpv6LinkLocal.isSafe).toBe(false);
      expect(resultIpv6LinkLocal.reason).toContain('PRIVATE_OR_RESERVED_IP');

      const resultIpv4Mapped = await validateUrlForSafeFetch('http://[::ffff:127.0.0.1]/status');
      expect(resultIpv4Mapped.isSafe).toBe(false);
      expect(resultIpv4Mapped.reason).toContain('PRIVATE_OR_RESERVED_IP');
    });

    it('blocks AWS/GCP cloud metadata IP (169.254.169.254) and metadata.google.internal', async () => {
      const metaIp = await validateUrlForSafeFetch('http://169.254.169.254/latest/meta-data/');
      expect(metaIp.isSafe).toBe(false);

      const metaHost = await validateUrlForSafeFetch('http://metadata.google.internal/computeMetadata/v1/');
      expect(metaHost.isSafe).toBe(false);
      expect(metaHost.reason).toContain('BLOCKED_HOSTNAME');
    });

    it('blocks non-HTTP protocols (file:, ftp:, gopher:)', async () => {
      const fileRes = await validateUrlForSafeFetch('file:///etc/passwd');
      expect(fileRes.isSafe).toBe(false);
      expect(fileRes.reason).toContain('FORBIDDEN_PROTOCOL');

      const ftpRes = await validateUrlForSafeFetch('ftp://attacker.com/payload');
      expect(ftpRes.isSafe).toBe(false);
      expect(ftpRes.reason).toContain('FORBIDDEN_PROTOCOL');
    });

    it('blocks numeric/hexadecimal IP obfuscation tricks', async () => {
      // 2130706433 is integer notation for 127.0.0.1
      const numRes = await validateUrlForSafeFetch('http://2130706433/secrets');
      expect(numRes.isSafe).toBe(false);
      expect(numRes.reason).toMatch(/NUMERIC_IP_OBFUSCATION|PRIVATE_OR_RESERVED_IP/);

      // 0x7f000001 is hex notation for 127.0.0.1
      const hexRes = await validateUrlForSafeFetch('http://0x7f000001/secrets');
      expect(hexRes.isSafe).toBe(false);
      expect(hexRes.reason).toMatch(/NUMERIC_IP_OBFUSCATION|PRIVATE_OR_RESERVED_IP/);
    });

    it('blocks embedded credentials in URLs', async () => {
      const credRes = await validateUrlForSafeFetch('http://admin:supersecret@example.com/test');
      expect(credRes.isSafe).toBe(false);
      expect(credRes.reason).toContain('EMBEDDED_CREDENTIALS');
    });
  });

  describe('Structural URL Analyzer & Heuristics', () => {
    it('extracts URLs from natural message text with exact character ranges', () => {
      const text = 'Action required: Please track your package at https://usps-redelivery.top/notice immediately.';
      const extracted = extractUrlsWithRanges(text);

      expect(extracted.length).toBe(1);
      const [start, end] = extracted[0].range;
      expect(text.slice(start, end)).toBe('https://usps-redelivery.top/notice');
    });

    it('detects bare IP address URLs', () => {
      const result = analyzeUrl('http://198.51.100.25/login', [0, 26]);
      expect(result.isBareIp).toBe(true);
      expect(result.suspiciousFactors.some((f) => f.code === 'URL_BARE_IP')).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(30);
    });

    it('detects brand impersonation in deceptive lookalike domains', () => {
      const result = analyzeUrl('https://chase-security-verify.xyz/login', [0, 39]);
      expect(result.suspiciousFactors.some((f) => f.code === 'URL_BRAND_SPOOFING')).toBe(true);
      expect(result.suspiciousFactors.some((f) => f.code === 'URL_HIGH_RISK_TLD')).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(60);
    });

    it('detects deep multi-level subdomain stacking', () => {
      const result = analyzeUrl('https://login.verify.account.update.evil-domain.com/auth', [0, 56]);
      expect(result.suspiciousFactors.some((f) => f.code === 'URL_SUBDOMAIN_STACKING')).toBe(true);
    });

    it('detects URL shortening services', () => {
      const result = analyzeUrl('https://bit.ly/3xY7zQ', [0, 21]);
      expect(result.isShortener).toBe(true);
      expect(result.suspiciousFactors.some((f) => f.code === 'URL_SHORTENER')).toBe(true);
    });

    it('detects Punycode and Cyrillic homoglyph domains', () => {
      const punycodeRes = analyzeUrl('http://xn--pypal-4ve.com/signin', [0, 31]);
      expect(punycodeRes.isPunycode).toBe(true);
      expect(punycodeRes.suspiciousFactors.some((f) => f.code === 'URL_HOMOGLYPH_PUNYCODE')).toBe(true);

      // Using Cyrillic 'а' (\u0430) instead of Latin 'a'
      const homoglyphRes = analyzeUrl('http://pаypal.com/auth', [0, 22]);
      expect(homoglyphRes.hasHomoglyph).toBe(true);
      expect(homoglyphRes.suspiciousFactors.some((f) => f.code === 'URL_HOMOGLYPH_PUNYCODE')).toBe(true);
    });
  });

  describe('Integration with Deterministic Detection & API', () => {
    it('produces verified ObservedIndicator for deceptive URL with exact character ranges', () => {
      const text = 'USPS Alert: Undelivered parcel. Pay redelivery fee at https://usps-post-redelivery.top/now to release.';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const urlInd = indicators.find((i) => i.category === 'SUSPICIOUS_LINK');
      expect(urlInd).toBeDefined();
      expect(urlInd?.evidence).toBe('https://usps-post-redelivery.top/now');
      const [start, end] = urlInd!.characterRange;
      expect(text.slice(start, end)).toBe(urlInd?.evidence);
    });

    it('POST /api/investigate/url inspects public safe domain successfully', async () => {
      const response = await supertest(app)
        .post('/api/investigate/url')
        .send({ url: 'https://paypal.com/signin' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isSafe).toBe(true);
      expect(response.body.data.reputation.status).toBe('AUTHENTIC_BRAND');
    }, 15000);

    it('POST /api/investigate/url blocks SSRF attack to localhost', async () => {
      const response = await supertest(app)
        .post('/api/investigate/url')
        .send({ url: 'http://127.0.0.1:8080/internal/admin' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ssrfBlocked).toBe(true);
      expect(response.body.data.isSafe).toBe(false);
    });
  });
});
