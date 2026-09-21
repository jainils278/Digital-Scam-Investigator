/**
 * Evidence Validation Engine
 * 
 * Enforces the core rule: EVIDENCE FIRST.
 * 
 * Verifies that every indicator presented as "Observed Evidence" actually exists
 * within the user's original raw text. Accounts for whitespace variations,
 * zero-width characters, and homoglyphs while NEVER altering the user's original text.
 * 
 * Any unverified or hallucinated evidence is strictly rejected.
 */

import { ObservedIndicator } from '../types.js';
import { NormalizedResult, mapNormalizedRangeToRaw } from './normalizer.js';

export interface ValidationResult {
  isValid: boolean;
  verifiedRange?: [number, number];
  verifiedEvidence?: string;
  rejectionReason?: string;
}

/**
 * Validates a single indicator against raw text and normalized results.
 */
export function validateIndicatorEvidence(
  indicator: ObservedIndicator,
  rawText: string,
  normalizedResult: NormalizedResult
): ValidationResult {
  const [rangeStart, rangeEnd] = indicator.characterRange;

  // 1. Direct range verification: Check if the slice at the specified range matches the evidence
  if (
    rangeStart >= 0 &&
    rangeEnd <= rawText.length &&
    rangeStart < rangeEnd
  ) {
    const rawSlice = rawText.slice(rangeStart, rangeEnd);
    if (rawSlice === indicator.evidence) {
      return {
        isValid: true,
        verifiedRange: [rangeStart, rangeEnd],
        verifiedEvidence: rawSlice,
      };
    }
  }

  // 2. Exact substring search in raw text
  const exactIndex = rawText.indexOf(indicator.evidence);
  if (exactIndex !== -1) {
    const exactEnd = exactIndex + indicator.evidence.length;
    return {
      isValid: true,
      verifiedRange: [exactIndex, exactEnd],
      verifiedEvidence: rawText.slice(exactIndex, exactEnd),
    };
  }

  // 3. Case-insensitive search in raw text
  const lowerRaw = rawText.toLowerCase();
  const lowerEvidence = indicator.evidence.toLowerCase();
  const caseInsensitiveIndex = lowerRaw.indexOf(lowerEvidence);
  if (caseInsensitiveIndex !== -1) {
    const end = caseInsensitiveIndex + indicator.evidence.length;
    return {
      isValid: true,
      verifiedRange: [caseInsensitiveIndex, end],
      verifiedEvidence: rawText.slice(caseInsensitiveIndex, end),
    };
  }

  // 4. Normalized search: Check if evidence exists in normalized text (e.g. stripped zero-width, resolved homoglyphs)
  const normIndex = normalizedResult.normalizedText.toLowerCase().indexOf(lowerEvidence);
  if (normIndex !== -1) {
    const normEnd = normIndex + lowerEvidence.length;
    const [rawStart, rawEnd] = mapNormalizedRangeToRaw(
      normIndex,
      normEnd,
      normalizedResult.indexMap,
      rawText.length
    );
    const rawSlice = rawText.slice(rawStart, rawEnd);
    if (rawSlice.length > 0) {
      return {
        isValid: true,
        verifiedRange: [rawStart, rawEnd],
        verifiedEvidence: rawSlice,
      };
    }
  }

  // 5. Special case: Evasion flags that span the full text
  if (indicator.id.startsWith('ind_evasion_') && rangeStart === 0 && rangeEnd === rawText.length) {
    return {
      isValid: true,
      verifiedRange: [0, rawText.length],
      verifiedEvidence: indicator.evidence,
    };
  }

  // 6. Failed verification: Evidence cannot be located in submitted text
  return {
    isValid: false,
    rejectionReason: `Evidence string "${indicator.evidence.slice(0, 40)}..." cannot be found in submitted text.`,
  };
}

/**
 * Validates an array of indicators, filtering out any hallucinated or unverified evidence.
 */
export function filterAndValidateIndicators(
  indicators: ObservedIndicator[],
  rawText: string,
  normalizedResult: NormalizedResult
): {
  verifiedIndicators: ObservedIndicator[];
  rejectedIndicators: Array<{ indicator: ObservedIndicator; reason: string }>;
} {
  const verifiedIndicators: ObservedIndicator[] = [];
  const rejectedIndicators: Array<{ indicator: ObservedIndicator; reason: string }> = [];

  for (const indicator of indicators) {
    const validation = validateIndicatorEvidence(indicator, rawText, normalizedResult);

    if (validation.isValid && validation.verifiedRange && validation.verifiedEvidence) {
      verifiedIndicators.push({
        ...indicator,
        evidence: validation.verifiedEvidence,
        characterRange: validation.verifiedRange,
      });
    } else {
      rejectedIndicators.push({
        indicator,
        reason: validation.rejectionReason || 'Unverifiable evidence claim',
      });
    }
  }

  // Sort verified indicators by appearance in the text
  verifiedIndicators.sort((a, b) => a.characterRange[0] - b.characterRange[0]);

  return { verifiedIndicators, rejectedIndicators };
}
