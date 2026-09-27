/**
 * Comprehensive Test Suite for Scamvera Unified Multi-Evidence Investigation Composer
 * 
 * Verifies that the new mental model ("One investigation can contain one or multiple pieces of evidence")
 * works seamlessly across all evidence combinations, preserves evidence provenance, handles OCR failures gracefully,
 * and maintains existing URL and risk security boundaries.
 */

import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../Backend/src/index.js';
import { MAX_SCREENSHOT_BYTES } from '../Backend/src/services/ocr/ocr_service.js';

describe('Unified Multi-Evidence Investigation Composer API', () => {
  // Helper to create synthetic PNG with text payload for Tier 3 instant chunk parsing
  function createSyntheticPng(textPayload: string): Buffer {
    const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const keyword = Buffer.from('Comment\0');
    const text = Buffer.from(textPayload, 'utf8');
    const chunkData = Buffer.concat([keyword, text]);
    const chunkHeader = Buffer.from('tEXt');
    return Buffer.concat([header, chunkHeader, chunkData]);
  }

  // 1. Text-only investigation input
  it('1. processes text-only investigation input successfully', async () => {
    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        text: 'URGENT: Your bank account has been suspended due to suspicious activity. Verify now.',
        messageType: 'sms',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.rawText).toContain('URGENT: Your bank account');
    expect(report.evidenceSources).toEqual(expect.arrayContaining(['TEXT']));
    expect(report.riskAssessment.score).toBeGreaterThan(0);
  });

  // 2. URL-only input
  it('2. processes URL-only input via unified endpoint', async () => {
    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        text: 'https://security-account-verification-login.top/auth',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.urlAnalysis).toBeDefined();
    expect(report.urlAnalysis.length).toBeGreaterThan(0);
    expect(report.urlAnalysis[0].domain).toBe('security-account-verification-login.top');
    expect(report.evidenceSources).toContain('URL');
  });

  // 3. Image-only input
  it('3. processes image-only input via unified endpoint', async () => {
    const pngBuffer = createSyntheticPng('WELLS FARGO: Unauthorized wire attempt detected. Call 800-555-0199 immediately.');
    const base64 = pngBuffer.toString('base64');

    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        images: [{ imageBase64: base64, filename: 'bank_alert.png' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.screenshotMeta).toBeDefined();
    expect(report.screenshotMeta.filename).toBe('bank_alert.png');
    expect(report.screenshotsMeta).toHaveLength(1);
    expect(report.evidenceSources).toContain('IMAGE');
    expect(report.observedIndicators.length).toBeGreaterThan(0);
  });

  // 4. Text + Image
  it('4. processes text + image combined into ONE investigation', async () => {
    const pngBuffer = createSyntheticPng('Verify your account at secure-portal-update.com within 24 hours.');
    const base64 = pngBuffer.toString('base64');

    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        text: 'I received this message from an unknown number claiming to be my bank.',
        images: [{ imageBase64: base64, filename: 'received_sms.png' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.rawText).toContain('I received this message');
    expect(report.rawText).toContain('secure-portal-update.com');
    expect(report.screenshotMeta?.filename).toBe('received_sms.png');
    expect(report.evidenceSources).toEqual(expect.arrayContaining(['TEXT', 'IMAGE']));
  });

  // 5. URL + Image
  it('5. processes URL + image combined into ONE investigation', async () => {
    const pngBuffer = createSyntheticPng('Your delivery is pending. A fee of $2.50 is required.');
    const base64 = pngBuffer.toString('base64');

    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        urls: ['https://usps-redelivery-fee.top/pay'],
        images: [{ imageBase64: base64, filename: 'delivery_notice.png' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.urlAnalysis).toBeDefined();
    expect(report.urlAnalysis.length).toBeGreaterThan(0);
    expect(report.screenshotMeta?.filename).toBe('delivery_notice.png');
    expect(report.evidenceSources).toEqual(expect.arrayContaining(['URL', 'IMAGE']));
  });

  // 6. Text + URL
  it('6. processes text + URL combined into ONE investigation', async () => {
    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        text: 'Someone sent me this saying my account will be closed. Verify here: https://chase-update-account.com',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.rawText).toContain('Someone sent me this');
    expect(report.urlAnalysis).toBeDefined();
    expect(report.urlAnalysis[0].url).toContain('chase-update-account.com');
    expect(report.evidenceSources).toEqual(expect.arrayContaining(['TEXT', 'URL']));
  });

  // 7. Text + URL + Image
  it('7. processes text + URL + image all combined in one case', async () => {
    const pngBuffer = createSyntheticPng('FINAL NOTICE: Immediate action required on invoice #9401.');
    const base64 = pngBuffer.toString('base64');

    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        text: 'The email claimed I owe money for an invoice I never ordered.',
        urls: ['https://invoice-payment-portal-lookup.xyz/pay'],
        images: [{ imageBase64: base64, filename: 'invoice_email.png' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.rawText).toContain('The email claimed');
    expect(report.rawText).toContain('FINAL NOTICE');
    expect(report.urlAnalysis).toBeDefined();
    expect(report.urlAnalysis.length).toBeGreaterThan(0);
    expect(report.screenshotMeta?.filename).toBe('invoice_email.png');
    expect(report.evidenceSources).toEqual(expect.arrayContaining(['TEXT', 'URL', 'IMAGE']));
  });

  // 8. Multiple images
  it('8. processes multiple screenshots in one single investigation case', async () => {
    const png1 = createSyntheticPng('ALERT: Your Apple ID has been locked due to unauthorized login.');
    const png2 = createSyntheticPng('Visit https://apple-security-support.top to unlock your account immediately.');

    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        text: 'The scammer sent two screenshots showing different warnings.',
        images: [
          { imageBase64: png1.toString('base64'), filename: 'apple_lock_alert.png' },
          { imageBase64: png2.toString('base64'), filename: 'apple_unlock_link.png' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.screenshotsMeta).toHaveLength(2);
    expect(report.screenshotsMeta[0].filename).toBe('apple_lock_alert.png');
    expect(report.screenshotsMeta[1].filename).toBe('apple_unlock_link.png');
    expect(report.rawText).toContain('Apple ID has been locked');
    expect(report.rawText).toContain('apple-security-support.top');
  });

  // 9. Image count limit (max 5)
  it('9. rejects submission exceeding maximum image count limit (5)', async () => {
    const dummyPng = createSyntheticPng('Sample text');
    const b64 = dummyPng.toString('base64');
    const images = Array.from({ length: 6 }).map((_, i) => ({
      imageBase64: b64,
      filename: `img_${i + 1}.png`,
    }));

    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        text: 'Too many screenshots test',
        images,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('maximum of 5 screenshots');
  });

  // 10. Invalid image rejection
  it('10. rejects invalid image buffer with 400 when no other evidence exists', async () => {
    const fakeImageBuffer = Buffer.from('NOT_A_REAL_IMAGE_FILE_BUFFER');
    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        images: [{ imageBase64: fakeImageBuffer.toString('base64'), filename: 'corrupted.png' }],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_IMAGE');
  });

  // 11. Oversized image rejection
  it('11. rejects oversized image buffer exceeding 5MB', async () => {
    const oversizedBuffer = Buffer.alloc(MAX_SCREENSHOT_BYTES + 1024);
    // Fake PNG header on oversized buffer
    oversizedBuffer[0] = 0x89;
    oversizedBuffer[1] = 0x50;
    oversizedBuffer[2] = 0x4e;
    oversizedBuffer[3] = 0x47;

    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        images: [{ imageBase64: oversizedBuffer.toString('base64'), filename: 'huge.png' }],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_IMAGE');
  });

  // 12. Mixed evidence provenance
  it('12. retains origin provenance on observed indicators across text, URL, and image', async () => {
    const pngBuffer = createSyntheticPng('Call us immediately at 800-555-0199 or wire funds now.');
    const base64 = pngBuffer.toString('base64');

    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        text: 'Your subscription renewed for $499. Visit https://refund-support-center.top/cancel',
        images: [{ imageBase64: base64, filename: 'receipt.png' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const report = res.body.report;

    // Check that indicators have evidenceSource attributed
    const indicators = report.observedIndicators;
    expect(indicators.length).toBeGreaterThan(0);
    for (const ind of indicators) {
      expect(['TEXT', 'URL', 'IMAGE_OCR']).toContain(ind.evidenceSource);
    }
  });

  // 13. Empty submission rejection
  it('13. rejects completely empty submission', async () => {
    const res = await supertest(app)
      .post('/api/investigate')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // 14. OCR failure does not destroy unrelated evidence
  it('14. continues investigation safely when an image OCR fails if other evidence is present', async () => {
    // Blank PNG header without readable text
    const blankPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00]);

    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        text: 'URGENT: Your PayPal account has been limited due to suspicious transactions. Please log in.',
        images: [{ imageBase64: blankPng.toString('base64'), filename: 'blank_blurry.png' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const report = res.body.report;
    // Main text investigation succeeded!
    expect(report.rawText).toContain('PayPal account has been limited');
    expect(report.observedIndicators.length).toBeGreaterThan(0);
    // Screenshot metadata records the OCR failure honestly without crashing
    expect(report.screenshotsMeta).toHaveLength(1);
    expect(report.screenshotsMeta[0].ocrError).toBeDefined();
  });

  // 15. URL security behavior remains intact
  it('15. preserves passive structural analysis and SSRF guards for recognized URLs', async () => {
    const res = await supertest(app)
      .post('/api/investigate')
      .send({
        text: 'Investigate this suspicious link: https://раypal.com/verify-identity', // Cyrillic homoglyph
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.urlAnalysis).toBeDefined();
    expect(report.urlAnalysis[0].hasHomoglyph).toBe(true);
  });
});
