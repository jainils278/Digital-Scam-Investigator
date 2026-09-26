import { describe, expect, it } from 'vitest';
import { analyzeObfuscation } from '../Backend/src/services/intelligence/obfuscation_analyzer.js';
import { mapNormalizedRangeToRaw, normalizeForAnalysis } from '../Backend/src/services/normalizer.js';

describe('V3.1 The Attacker Mask — Obfuscation & Diff Engine', () => {
  it('returns clean analysis when no obfuscation is present', () => {
    const raw = 'Please verify your Bank of America account details immediately.';
    const normalized = normalizeForAnalysis(raw);

    expect(normalized.hasZeroWidthCharacters).toBe(false);
    expect(normalized.hasHomoglyphs).toBe(false);
    expect(normalized.obfuscationEvents).toHaveLength(0);

    const analysis = analyzeObfuscation(raw, normalized.obfuscationEvents);
    expect(analysis.hasObfuscation).toBe(false);
    expect(analysis.totalEvasionChars).toBe(0);
    expect(analysis.typesDetected).toHaveLength(0);
    expect(analysis.diffTokens).toHaveLength(1);
    expect(analysis.diffTokens[0].isObfuscated).toBe(false);
    expect(analysis.diffTokens[0].text).toBe(raw);
    expect(analysis.summary).toContain('No adversarial evasion');
  });

  it('detects zero-width characters and preserves rawIndex accuracy', () => {
    // Insert zero-width space \u200B inside "verify" -> "ve\u200Brify"
    const raw = 'Please ve\u200Brify your account.';
    const normalized = normalizeForAnalysis(raw);

    expect(normalized.hasZeroWidthCharacters).toBe(true);
    expect(normalized.obfuscationEvents).toHaveLength(1);

    const event = normalized.obfuscationEvents[0];
    expect(event.type).toBe('ZERO_WIDTH_CHAR');
    expect(event.rawChar).toBe('\u200B');
    expect(event.rawIndex).toBe(9); // "Please ve" is 9 chars (0-8), \u200B is at index 9
    expect(raw[event.rawIndex]).toBe('\u200B');
    expect(event.unicodeHex).toBe('U+200B');

    // Normalized text strips the zero-width character
    expect(normalized.normalizedText).toBe('Please verify your account.');

    const analysis = analyzeObfuscation(raw, normalized.obfuscationEvents);
    expect(analysis.hasObfuscation).toBe(true);
    expect(analysis.totalEvasionChars).toBe(1);
    expect(analysis.typesDetected).toEqual(['ZERO_WIDTH_CHAR']);

    const zwToken = analysis.diffTokens.find((t) => t.isObfuscated && t.type === 'ZERO_WIDTH_CHAR');
    expect(zwToken).toBeDefined();
    expect(zwToken?.unicodeHex).toBe('U+200B');
    expect(zwToken?.originalChars).toBe('\u200B');
    expect(zwToken?.decodedChars).toBe('');
  });

  it('detects homoglyphs and creates replacement diff tokens', () => {
    // Cyrillic 'а' (U+0430) and 'с' (U+0441) in "Bank" and "account":
    // "Bаnk" (Cyrillic а) "ассount" (Cyrillic а and с)
    const cyrillicA = '\u0430';
    const cyrillicC = '\u0441';
    const raw = `B${cyrillicA}nk ${cyrillicA}${cyrillicC}ount`;

    const normalized = normalizeForAnalysis(raw);
    expect(normalized.hasHomoglyphs).toBe(true);
    expect(normalized.obfuscationEvents).toHaveLength(3); // 'а', 'а', 'с'

    expect(normalized.normalizedText).toBe('Bank acount');

    const analysis = analyzeObfuscation(raw, normalized.obfuscationEvents);
    expect(analysis.hasObfuscation).toBe(true);
    expect(analysis.totalEvasionChars).toBe(3);
    expect(analysis.typesDetected).toEqual(['HOMOGLYPH']);

    const homoglyphTokens = analysis.diffTokens.filter((t) => t.isObfuscated && t.type === 'HOMOGLYPH');
    expect(homoglyphTokens).toHaveLength(3);
    expect(homoglyphTokens[0].originalChars).toBe(cyrillicA);
    expect(homoglyphTokens[0].decodedChars).toBe('a');
    expect(homoglyphTokens[0].unicodeHex).toBe('U+0430');
  });

  it('handles mixed Unicode with both zero-width characters and homoglyphs', () => {
    const cyrillicO = '\u043E';
    const zwsp = '\u200B';
    const raw = `L${cyrillicO}g${zwsp}in now`;

    const normalized = normalizeForAnalysis(raw);
    expect(normalized.hasHomoglyphs).toBe(true);
    expect(normalized.hasZeroWidthCharacters).toBe(true);
    expect(normalized.obfuscationEvents).toHaveLength(2);

    expect(normalized.normalizedText).toBe('Login now');

    const analysis = analyzeObfuscation(raw, normalized.obfuscationEvents);
    expect(analysis.hasObfuscation).toBe(true);
    expect(analysis.totalEvasionChars).toBe(2);
    expect(analysis.typesDetected).toContain('HOMOGLYPH');
    expect(analysis.typesDetected).toContain('ZERO_WIDTH_CHAR');

    // Token stream sequence should preserve order: "L", [HOMOGLYPH: o], "g", [ZW], "in now"
    expect(analysis.diffTokens[0]).toEqual({ text: 'L', isObfuscated: false });
    expect(analysis.diffTokens[1].isObfuscated).toBe(true);
    expect(analysis.diffTokens[1].type).toBe('HOMOGLYPH');
    expect(analysis.diffTokens[2]).toEqual({ text: 'g', isObfuscated: false });
    expect(analysis.diffTokens[3].isObfuscated).toBe(true);
    expect(analysis.diffTokens[3].type).toBe('ZERO_WIDTH_CHAR');
    expect(analysis.diffTokens[4]).toEqual({ text: 'in now', isObfuscated: false });
  });

  it('preserves emojis without corrupting offsets or triggering false positives', () => {
    const raw = '🚨 Urgent: Your account is suspended! 🏦 Click here ⚠️';
    const normalized = normalizeForAnalysis(raw);

    expect(normalized.hasZeroWidthCharacters).toBe(false);
    expect(normalized.hasHomoglyphs).toBe(false);
    expect(normalized.obfuscationEvents).toHaveLength(0);
    expect(normalized.normalizedText).toBe(raw);

    const analysis = analyzeObfuscation(raw, normalized.obfuscationEvents);
    expect(analysis.hasObfuscation).toBe(false);
  });

  it('handles adjacent obfuscation events cleanly', () => {
    const zwsp1 = '\u200B';
    const zwsp2 = '\u200C';
    const cyrillicA = '\u0430';
    const raw = `Test${zwsp1}${zwsp2}${cyrillicA}End`;

    const normalized = normalizeForAnalysis(raw);
    expect(normalized.obfuscationEvents).toHaveLength(3);

    const analysis = analyzeObfuscation(raw, normalized.obfuscationEvents);
    expect(analysis.diffTokens).toHaveLength(5);
    expect(analysis.diffTokens[0].text).toBe('Test');
    expect(analysis.diffTokens[1].type).toBe('ZERO_WIDTH_CHAR');
    expect(analysis.diffTokens[2].type).toBe('ZERO_WIDTH_CHAR');
    expect(analysis.diffTokens[3].type).toBe('HOMOGLYPH');
    expect(analysis.diffTokens[4].text).toBe('End');
  });

  it('preserves verified evidence range mapping back to raw text with obfuscation present', () => {
    // Target keyword: "password"
    // Obfuscated as: "p\u200Bаssword" (with \u200B at index 1 and Cyrillic 'а' at index 2)
    const zwsp = '\u200B';
    const cyrillicA = '\u0430';
    const raw = `Enter your p${zwsp}${cyrillicA}ssword immediately`;
    const normalized = normalizeForAnalysis(raw);

    // In normalized text, it is canonical "Enter your password immediately"
    expect(normalized.normalizedText).toBe('Enter your password immediately');

    const normStart = normalized.normalizedText.indexOf('password');
    const normEnd = normStart + 'password'.length;

    const [rawStart, rawEnd] = mapNormalizedRangeToRaw(
      normStart,
      normEnd,
      normalized.indexMap,
      raw.length
    );

    const rawSlice = raw.slice(rawStart, rawEnd);
    // The raw slice must span the entire obfuscated word in the original text
    expect(rawSlice).toBe(`p${zwsp}${cyrillicA}ssword`);
  });
});
