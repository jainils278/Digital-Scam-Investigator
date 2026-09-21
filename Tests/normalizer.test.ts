import { describe, expect, it } from 'vitest';
import { defangUrl, mapNormalizedRangeToRaw, normalizeForAnalysis } from '../Backend/src/services/normalizer.js';

describe('Normalizer Service', () => {
  it('identifies and strips zero-width non-rendering characters', () => {
    // Embedded zero-width space \u200B inside "password"
    const textWithZeroWidth = 'p\u200Ba\u200Bs\u200Bs\u200Bw\u200Bo\u200Br\u200Bd';
    const result = normalizeForAnalysis(textWithZeroWidth);

    expect(result.hasZeroWidthCharacters).toBe(true);
    expect(result.normalizedText).toBe('password');
    expect(result.rawText).toBe(textWithZeroWidth);
  });

  it('maps confusable Cyrillic homoglyphs back to Latin', () => {
    // "pаypаl" using Cyrillic 'а' (\u0430)
    const textWithHomoglyphs = 'p\u0430yp\u0430l';
    const result = normalizeForAnalysis(textWithHomoglyphs);

    expect(result.hasHomoglyphs).toBe(true);
    expect(result.normalizedText).toBe('paypal');
  });

  it('correctly maps normalized range back to original raw text range', () => {
    // "Send your p\u200Ba\u200Bssword now"
    const raw = 'Send your p\u200Ba\u200Bssword now';
    const normalized = normalizeForAnalysis(raw);

    // In normalized text, "password" starts at index 10 and ends at 18
    const normStart = normalized.normalizedText.indexOf('password');
    const normEnd = normStart + 'password'.length;

    const [rawStart, rawEnd] = mapNormalizedRangeToRaw(
      normStart,
      normEnd,
      normalized.indexMap,
      raw.length
    );

    const extractedRaw = raw.slice(rawStart, rawEnd);
    expect(extractedRaw).toBe('p\u200Ba\u200Bssword');
  });

  it('defangs URLs safely without creating clickable links', () => {
    const maliciousUrl = 'https://fake-login-chase.com/verify';
    const defanged = defangUrl(maliciousUrl);

    expect(defanged).toBe('hxxps://fake-login-chase[.]com/verify');
    expect(defanged.includes('http')).toBe(false);
  });
});

