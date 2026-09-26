/**
 * Normalization Service
 * 
 * Normalizes input text for pattern matching while maintaining an exact 1-to-1 index map
 * back to the user's original, un-altered raw text.
 * 
 * CRITICAL RULE: The original text is NEVER mutated for display. Normalization is strictly
 * used for detection and matching.
 */

import type { ObfuscationEvent } from '../types.js';

// Zero-width and invisible characters commonly used for evasion
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E\u00AD]/;

// Common Cyrillic and Greek homoglyphs used in phishing / smishing
const HOMOGLYPH_MAP: Record<string, string> = {
  'а': 'a', 'А': 'A', // Cyrillic
  'с': 'c', 'С': 'C',
  'е': 'e', 'Е': 'E',
  'о': 'o', 'О': 'O',
  'р': 'p', 'Р': 'P',
  'ѕ': 's', 'Ѕ': 'S',
  'і': 'i', 'І': 'I',
  'ј': 'j', 'Ј': 'J',
  'у': 'y', 'У': 'Y',
  'х': 'x', 'Х': 'X',
  'ԁ': 'd', 'Ԃ': 'D',
  'ԛ': 'q',
  'ո': 'n',
  'ш': 'w',
  // Greek
  'α': 'a', 'Α': 'A',
  'β': 'b', 'Β': 'B',
  'ε': 'e', 'Ε': 'E',
  'ι': 'i', 'Ι': 'I',
  'κ': 'k', 'Κ': 'K',
  'ν': 'v', 'Ν': 'N',
  'ο': 'o', 'Ο': 'O',
  'ρ': 'p', 'Ρ': 'P',
  'τ': 't', 'Τ': 'T',
  'υ': 'u', 'Υ': 'U',
  'χ': 'x', 'Χ': 'X',
};

export interface NormalizedResult {
  rawText: string;
  normalizedText: string;
  // indexMap[normIndex] returns the corresponding index in rawText
  indexMap: number[];
  hasZeroWidthCharacters: boolean;
  hasHomoglyphs: boolean;
  obfuscationEvents: ObfuscationEvent[];
}

/**
 * Normalizes text while constructing a forward index mapping back to raw text.
 */
export function normalizeForAnalysis(rawText: string): NormalizedResult {
  const indexMap: number[] = [];
  const normalizedChars: string[] = [];
  const obfuscationEvents: ObfuscationEvent[] = [];
  let hasZeroWidthCharacters = false;
  let hasHomoglyphs = false;

  for (let rawIdx = 0; rawIdx < rawText.length; rawIdx++) {
    const char = rawText[rawIdx];

    // Check for zero-width / invisible characters
    if (ZERO_WIDTH_REGEX.test(char)) {
      hasZeroWidthCharacters = true;
      const hex = 'U+' + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
      obfuscationEvents.push({
        id: `obf_${obfuscationEvents.length + 1}`,
        type: 'ZERO_WIDTH_CHAR',
        rawChar: char,
        normalizedChar: '',
        rawIndex: rawIdx,
        unicodeHex: hex,
        description: `Zero-width invisible formatting character (${hex}) used to evade string filters`,
      });
      continue; // Skip zero-width character, indexMap will skip this rawIdx
    }

    // Check for homoglyphs
    const homoglyphReplacement = HOMOGLYPH_MAP[char];
    if (homoglyphReplacement) {
      hasHomoglyphs = true;
      const hex = 'U+' + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
      obfuscationEvents.push({
        id: `obf_${obfuscationEvents.length + 1}`,
        type: 'HOMOGLYPH',
        rawChar: char,
        normalizedChar: homoglyphReplacement,
        rawIndex: rawIdx,
        unicodeHex: hex,
        description: `Homoglyph character '${char}' (${hex}) substituting Latin '${homoglyphReplacement}'`,
      });
      normalizedChars.push(homoglyphReplacement);
      indexMap.push(rawIdx);
      continue;
    }

    normalizedChars.push(char);
    indexMap.push(rawIdx);
  }

  return {
    rawText,
    normalizedText: normalizedChars.join(''),
    indexMap,
    hasZeroWidthCharacters,
    hasHomoglyphs,
    obfuscationEvents,
  };
}

/**
 * Maps a match range [normStart, normEnd] in normalized text back to [rawStart, rawEnd] in rawText.
 */
export function mapNormalizedRangeToRaw(
  normStart: number,
  normEnd: number,
  indexMap: number[],
  rawTextLength: number
): [number, number] {
  if (indexMap.length === 0) {
    return [0, 0];
  }

  const boundedNormStart = Math.max(0, Math.min(normStart, indexMap.length - 1));
  const boundedNormEnd = Math.max(0, Math.min(normEnd - 1, indexMap.length - 1));

  const rawStart = indexMap[boundedNormStart];
  const rawEnd = Math.min(indexMap[boundedNormEnd] + 1, rawTextLength);

  return [rawStart, rawEnd];
}

/**
 * Defangs a URL safely for defensive inspection (e.g. https://bad.com -> hxxps://bad[.]com)
 */
export function defangUrl(url: string): string {
  return url
    .replace(/^https?:\/\//i, (match) => match.toLowerCase().replace('http', 'hxxp'))
    .replace(/\./g, '[.]');
}
