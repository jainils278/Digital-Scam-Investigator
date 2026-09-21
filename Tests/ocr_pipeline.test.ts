import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../Backend/src/index.js';
import {
  MAX_SCREENSHOT_BYTES,
  OcrService,
  validateImageBuffer,
} from '../Backend/src/services/ocr/ocr_service.js';

describe('Phase 3 — Multimodal / OCR Pipeline', () => {
  // Helper to create synthetic PNG buffer with tEXt chunk
  function createSyntheticPng(textPayload: string): Buffer {
    // 8-byte PNG header: 89 50 4E 47 0D 0A 1A 0A
    const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    // Simulated tEXt chunk: length(4), type(4), keyword, null, text, crc(4)
    const keyword = Buffer.from('Comment\0');
    const text = Buffer.from(textPayload, 'utf8');
    const chunkData = Buffer.concat([keyword, text]);
    const chunkHeader = Buffer.from('tEXt');

    return Buffer.concat([header, chunkHeader, chunkData]);
  }

  describe('Safe Image Validation & Magic Byte Defense', () => {
    it('validates genuine PNG magic bytes', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      const res = validateImageBuffer(pngBuffer);
      expect(res.isValid).toBe(true);
      expect(res.mimeType).toBe('image/png');
    });

    it('validates genuine JPEG magic bytes', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      const res = validateImageBuffer(jpegBuffer);
      expect(res.isValid).toBe(true);
      expect(res.mimeType).toBe('image/jpeg');
    });

    it('validates genuine WebP magic bytes', () => {
      const webpBuffer = Buffer.from('RIFF\x20\x00\x00\x00WEBPVP8\x00', 'ascii');
      const res = validateImageBuffer(webpBuffer);
      expect(res.isValid).toBe(true);
      expect(res.mimeType).toBe('image/webp');
    });

    it('rejects zero-byte image buffers', () => {
      const emptyBuffer = Buffer.alloc(0);
      const res = validateImageBuffer(emptyBuffer);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('EMPTY_IMAGE');
    });

    it('rejects oversized images exceeding 5MB', () => {
      const largeBuffer = Buffer.alloc(MAX_SCREENSHOT_BYTES + 1024);
      const res = validateImageBuffer(largeBuffer);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('OVERSIZED_IMAGE');
    });

    it('rejects malicious SVG / script-bearing markup disguising as image', () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      const res = validateImageBuffer(svgBuffer);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('UNSAFE_FORMAT');
    });

    it('rejects unknown binary / executable files', () => {
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ DOS header
      const res = validateImageBuffer(exeBuffer);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('UNSUPPORTED_IMAGE_FORMAT');
    });
  });

  describe('OCR Processing & Failure Handling', () => {
    it('extracts embedded text from a synthetic screenshot', async () => {
      const ocr = new OcrService();
      const message = 'USPS: Package delivery failure. A delivery fee of $2.99 is required.';
      const pngBuffer = createSyntheticPng(message);

      const result = await ocr.extractText(pngBuffer);
      expect(result.success).toBe(true);
      expect(result.text).toContain('delivery fee of $2.99');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    it('returns graceful warning on unreadable or blank image without throwing', async () => {
      const ocr = new OcrService();
      // Pure blank PNG header without any text
      const blankPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00]);

      const result = await ocr.extractText(blankPng);
      expect(result.success).toBe(false);
      expect(result.warning).toContain('LOW_CONTRAST_OR_UNREADABLE');
    });
  });

  describe('Pipeline Integration & API Endpoint', () => {
    it('POST /api/investigate/screenshot processes screenshot through existing detection engine', async () => {
      const message = 'WELLS FARGO: Unauthorized wire alert. Reply with your OTP code now.';
      const pngBuffer = createSyntheticPng(message);
      const base64 = pngBuffer.toString('base64');

      const response = await supertest(app)
        .post('/api/investigate/screenshot')
        .send({
          imageBase64: base64,
          filename: 'suspicious_sms_capture.png',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const report = response.body.report;
      expect(report.screenshotMeta).toBeDefined();
      expect(report.screenshotMeta.filename).toBe('suspicious_sms_capture.png');
      expect(report.screenshotMeta.mimeType).toBe('image/png');

      // Check that existing deterministic detector recognized OTP demand from OCR text
      const otpInd = report.observedIndicators.find(
        (i: any) => i.category === 'CREDENTIAL_HARVESTING'
      );
      expect(otpInd).toBeDefined();
      expect(otpInd.severity).toBe('CRITICAL');
      expect(report.riskAssessment.score).toBeGreaterThanOrEqual(40);
    });

    it('POST /api/investigate/screenshot rejects empty base64 with 400', async () => {
      const response = await supertest(app)
        .post('/api/investigate/screenshot')
        .send({
          imageBase64: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
