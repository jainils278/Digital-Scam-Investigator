import { describe, expect, it } from 'vitest';
import {
  filterAndValidateIndicators,
  validateIndicatorEvidence,
} from '../Backend/src/services/validator.js';
import { normalizeForAnalysis } from '../Backend/src/services/normalizer.js';
import { ObservedIndicator } from '../Backend/src/types.js';

function makeIndicator(
  evidence: string,
  range: [number, number],
  overrides: Partial<ObservedIndicator> = {}
): ObservedIndicator {
  return {
    id: 'test_ind',
    category: 'URGENCY_PRESSURE',
    name: 'Test Indicator',
    severity: 'MEDIUM',
    evidence,
    characterRange: range,
    explanation: 'Test',
    whyItMatters: 'Test',
    source: 'DETERMINISTIC',
    ...overrides,
  };
}

describe('Evidence Validator', () => {
  describe('validateIndicatorEvidence', () => {
    it('validates evidence with exact range match', () => {
      const text = 'Send your OTP immediately';
      const normalized = normalizeForAnalysis(text);
      const indicator = makeIndicator('OTP', [10, 13]);
      const result = validateIndicatorEvidence(indicator, text, normalized);
      expect(result.isValid).toBe(true);
      expect(result.verifiedEvidence).toBe('OTP');
      expect(result.verifiedRange).toEqual([10, 13]);
    });

    it('validates evidence via exact substring search when range is wrong', () => {
      const text = 'Please verify your password now';
      const normalized = normalizeForAnalysis(text);
      const indicator = makeIndicator('password', [999, 1007]);
      const result = validateIndicatorEvidence(indicator, text, normalized);
      expect(result.isValid).toBe(true);
      expect(result.verifiedEvidence).toBe('password');
    });

    it('validates evidence via case-insensitive match', () => {
      const text = 'Your ACCOUNT has been SUSPENDED';
      const normalized = normalizeForAnalysis(text);
      const indicator = makeIndicator('account', [5, 12]);
      const result = validateIndicatorEvidence(indicator, text, normalized);
      expect(result.isValid).toBe(true);
    });

    it('rejects evidence that does not exist in the text', () => {
      const text = 'Hello, how are you today?';
      const normalized = normalizeForAnalysis(text);
      const indicator = makeIndicator('bitcoin wallet', [0, 14]);
      const result = validateIndicatorEvidence(indicator, text, normalized);
      expect(result.isValid).toBe(false);
      expect(result.rejectionReason).toBeDefined();
    });

    it('validates evasion indicators that span full text', () => {
      const text = 'Some obfuscated text here';
      const normalized = normalizeForAnalysis(text);
      const indicator = makeIndicator(text, [0, text.length], {
        id: 'ind_evasion_homoglyph',
      });
      const result = validateIndicatorEvidence(indicator, text, normalized);
      expect(result.isValid).toBe(true);
    });
  });

  describe('filterAndValidateIndicators', () => {
    it('filters out indicators with unverifiable evidence', () => {
      const text = 'Verify your account immediately or it will be suspended.';
      const normalized = normalizeForAnalysis(text);
      const indicators = [
        makeIndicator('Verify your account', [0, 19], { id: 'ind_1' }),
        makeIndicator('nonexistent evidence string', [0, 26], { id: 'ind_2' }),
      ];
      const { verifiedIndicators, rejectedIndicators } =
        filterAndValidateIndicators(indicators, text, normalized);
      expect(verifiedIndicators.length).toBe(1);
      expect(verifiedIndicators[0].id).toBe('ind_1');
      expect(rejectedIndicators.length).toBe(1);
      expect(rejectedIndicators[0].indicator.id).toBe('ind_2');
    });

    it('sorts verified indicators by character range', () => {
      const text = 'Act now! Send OTP to avoid suspension.';
      const normalized = normalizeForAnalysis(text);
      const indicators = [
        makeIndicator('suspension', [27, 37], { id: 'ind_late' }),
        makeIndicator('Act now', [0, 7], { id: 'ind_early' }),
        makeIndicator('OTP', [14, 17], { id: 'ind_mid' }),
      ];
      const { verifiedIndicators } = filterAndValidateIndicators(
        indicators,
        text,
        normalized
      );
      expect(verifiedIndicators.length).toBe(3);
      expect(verifiedIndicators[0].id).toBe('ind_early');
      expect(verifiedIndicators[1].id).toBe('ind_mid');
      expect(verifiedIndicators[2].id).toBe('ind_late');
    });

    it('returns empty arrays for empty input', () => {
      const text = 'Some text';
      const normalized = normalizeForAnalysis(text);
      const { verifiedIndicators, rejectedIndicators } =
        filterAndValidateIndicators([], text, normalized);
      expect(verifiedIndicators).toEqual([]);
      expect(rejectedIndicators).toEqual([]);
    });
  });
});
