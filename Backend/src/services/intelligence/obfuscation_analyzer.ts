/**
 * The Attacker's Mask — Obfuscation & Evasion Analyzer
 * 
 * Analyzes structured obfuscation provenance to produce a visual diff
 * between the attacker's raw evasive payload and the canonical text.
 * 
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. OBSERVATIONAL ONLY — Never alters raw text, normalized text, or indexMap.
 * 2. Preserves verified evidence offsets without mutation.
 * 3. Tokenizes raw text into readable diff segments for frontend rendering.
 */

import type {
  DiffToken,
  ObfuscationAnalysis,
  ObfuscationEvent,
} from '../../types.js';

export function analyzeObfuscation(
  rawText: string,
  obfuscationEvents: ObfuscationEvent[]
): ObfuscationAnalysis {
  if (!obfuscationEvents || obfuscationEvents.length === 0) {
    return {
      hasObfuscation: false,
      totalEvasionChars: 0,
      typesDetected: [],
      diffTokens: rawText ? [{ text: rawText, isObfuscated: false }] : [],
      summary: 'No adversarial evasion or Unicode obfuscation detected in the submitted text.',
    };
  }

  const eventsByRawIdx = new Map<number, ObfuscationEvent>();
  for (const event of obfuscationEvents) {
    eventsByRawIdx.set(event.rawIndex, event);
  }

  const diffTokens: DiffToken[] = [];
  let normalBuffer = '';

  for (let rawIdx = 0; rawIdx < rawText.length; rawIdx++) {
    const event = eventsByRawIdx.get(rawIdx);

    if (event) {
      if (normalBuffer.length > 0) {
        diffTokens.push({
          text: normalBuffer,
          isObfuscated: false,
        });
        normalBuffer = '';
      }

      if (event.type === 'ZERO_WIDTH_CHAR') {
        diffTokens.push({
          text: `[ZW:${event.unicodeHex}]`,
          isObfuscated: true,
          type: 'ZERO_WIDTH_CHAR',
          originalChars: event.rawChar,
          decodedChars: '',
          unicodeHex: event.unicodeHex,
        });
      } else {
        diffTokens.push({
          text: event.rawChar,
          isObfuscated: true,
          type: 'HOMOGLYPH',
          originalChars: event.rawChar,
          decodedChars: event.normalizedChar,
          unicodeHex: event.unicodeHex,
        });
      }
    } else {
      normalBuffer += rawText[rawIdx];
    }
  }

  if (normalBuffer.length > 0) {
    diffTokens.push({
      text: normalBuffer,
      isObfuscated: false,
    });
  }

  const typesDetected = Array.from(new Set(obfuscationEvents.map((e) => e.type)));

  return {
    hasObfuscation: true,
    totalEvasionChars: obfuscationEvents.length,
    typesDetected,
    diffTokens,
    summary: `Detected ${obfuscationEvents.length} adversarial evasion character(s) (${typesDetected.join(
      ', '
    )}) inserted to evade automated security filters while remaining readable to victims.`,
  };
}
