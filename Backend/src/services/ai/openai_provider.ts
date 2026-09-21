/**
 * OpenAI AI Provider
 * 
 * Performs contextual cybersecurity analysis via OpenAI API using structured JSON output.
 * Keeps OPENAI_API_KEY strictly server-side.
 * 
 * Enforces strict anti-hallucination guardrails and abort timeouts.
 */

import OpenAI from 'openai';
import { AiContextAnalysis, ObservedIndicator } from '../../types.js';
import { AiProvider } from './provider.js';

export class OpenAiProvider implements AiProvider {
  public readonly name = 'OpenAI Contextual Engine (GPT-4o)';
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      this.client = new OpenAI({ apiKey: apiKey.trim() });
    }
  }

  public isAvailable(): boolean {
    return this.client !== null && !!process.env.OPENAI_API_KEY;
  }

  public async analyzeContext(
    rawText: string,
    messageType: string,
    observedIndicators: ObservedIndicator[]
  ): Promise<AiContextAnalysis> {
    if (!this.client) {
      throw new Error('OpenAI client is not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second circuit breaker

    try {
      const prompt = `
You are a Defensive Cybersecurity Threat Analyst analyzing a user-submitted message for scam/phishing patterns.

Submitted Message Channel: ${messageType}
Raw Message Text:
"""
${rawText}
"""

Independently Verified Observed Indicators in this message:
${JSON.stringify(
  observedIndicators.map((ind) => ({
    category: ind.category,
    name: ind.name,
    evidenceQuote: ind.evidence,
    severity: ind.severity,
  })),
  null,
  2
)}

CRITICAL INSTRUCTIONS:
1. Do NOT invent, assume, or hallucinate quotes, URLs, phone numbers, or threats that are not in the raw text.
2. Grounding: Do NOT state attacker intent, financial loss, account compromise, or stolen credentials as factual certainty unless explicitly stated in the raw text. Use qualified, defensive language: "This combination can be associated with attempts to obtain authentication information."
3. Do NOT make absolute factual claims such as "Legitimate institutions never request OTPs." Instead state: "Do not disclose one-time passcodes upon unsolicited request; unexpected OTP requests should be treated as a serious warning sign."
4. If zero indicators were detected, state that no known manipulative patterns were found in the submitted text, but NEVER claim that the message is safe or the sender is legitimate.
5. If ambiguous, clearly communicate uncertainty and encourage independent verification.
6. If you make any contextual inferences that are NOT directly quoted from the text, list them in "unverifiedInferences".
7. Output STRICT JSON adhering to this schema:
{
  "archetypes": ["Name of scam archetype(s)"],
  "psychologicalTriggers": ["Psychological manipulation tactics used"],
  "socialEngineeringTactics": "Concise paragraph explaining how social engineering tactics may operate in this scenario",
  "ambiguityAssessment": "Evaluation of whether this message has ambiguity or clear malicious intent",
  "unverifiedInferences": [
    {
      "claim": "Contextual inference",
      "rationale": "Why this inference is drawn"
    }
  ]
}
`;

      const response = await this.client.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a defensive cybersecurity contextual engine. Output strictly valid JSON. Never hallucinate facts.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1, // Low temperature for factual precision
        },
        { signal: controller.signal }
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response received from OpenAI');
      }

      const parsed = JSON.parse(content);

      return {
        mode: 'OPENAI_REAL',
        providerName: this.name,
        scamArchetypes: Array.isArray(parsed.archetypes) ? parsed.archetypes : ['Suspicious Digital Communication'],
        psychologicalTriggers: Array.isArray(parsed.psychologicalTriggers)
          ? parsed.psychologicalTriggers
          : ['Psychological pressure detected'],
        socialEngineeringTactics:
          typeof parsed.socialEngineeringTactics === 'string'
            ? parsed.socialEngineeringTactics
            : 'Potential social engineering tactics detected.',
        ambiguityAssessment:
          typeof parsed.ambiguityAssessment === 'string'
            ? parsed.ambiguityAssessment
            : 'Assessment based on detected indicators.',
        unverifiedInferences: Array.isArray(parsed.unverifiedInferences)
          ? parsed.unverifiedInferences.map((inf: any) => ({
              claim: String(inf.claim || ''),
              rationale: String(inf.rationale || ''),
            }))
          : [],
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
