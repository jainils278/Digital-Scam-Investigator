/**
 * Local Heuristic AI Provider
 * 
 * Functions as an offline, deterministic substitute and fallback for contextual analysis.
 * Explicitly identifies itself as "Local Heuristic" and never misrepresents itself as a deep LLM.
 */

import { AiContextAnalysis, ObservedIndicator } from '../../types.js';
import { AiProvider } from './provider.js';

export class HeuristicAiProvider implements AiProvider {
  public readonly name = 'Defensive Heuristic Engine';

  public isAvailable(): boolean {
    return true; // Always available offline
  }

  public async analyzeContext(
    rawText: string,
    messageType: string,
    observedIndicators: ObservedIndicator[]
  ): Promise<AiContextAnalysis> {
    const categories = new Set(observedIndicators.map((i) => i.category));
    const severities = observedIndicators.map((i) => i.severity);

    const hasUrgency = categories.has('URGENCY_PRESSURE');
    const hasCredentials = categories.has('CREDENTIAL_HARVESTING');
    const hasFinancial = categories.has('FINANCIAL_COERCION');
    const hasAccountThreat = categories.has('ACCOUNT_THREAT');
    const hasPrize = categories.has('PRIZE_LOTTERY');
    const hasImpersonation = categories.has('IMPERSONATION');
    const hasDiversion = categories.has('CHANNEL_DIVERSION');
    const hasSuspiciousLink = categories.has('SUSPICIOUS_LINK');

    // 1. Determine Archetypes
    const archetypes: string[] = [];

    if (hasCredentials && (hasImpersonation || hasUrgency)) {
      archetypes.push('Credential Harvesting Phishing / Smishing');
    }
    if (hasImpersonation && (hasAccountThreat || hasSuspiciousLink)) {
      archetypes.push('Brand / Institution Impersonation Pretexting');
    }
    if (hasFinancial && hasPrize) {
      archetypes.push('Advance-Fee / Fake Lottery Fraud');
    }
    if (hasFinancial && !hasPrize) {
      archetypes.push('Financial Extortion / Coercive Payment Scheme');
    }
    if (hasDiversion) {
      archetypes.push('Off-Platform Channel Diversion (Recruitment or Romance Scam)');
    }
    if (observedIndicators.length === 0) {
      archetypes.push('Standard Non-Malicious Communication');
    } else if (archetypes.length === 0) {
      archetypes.push('Suspicious Digital Communication');
    }

    // 2. Psychological Triggers
    const psychologicalTriggers: string[] = [];
    if (hasUrgency) {
      psychologicalTriggers.push('Artificial Time Scarcity (induces panic, suppressing rational due diligence)');
    }
    if (hasAccountThreat) {
      psychologicalTriggers.push('Loss Aversion & Intimidation (fear of losing account access or legal status)');
    }
    if (hasImpersonation) {
      psychologicalTriggers.push('Authority & Trust Exploitation (leveraging established corporate/government branding)');
    }
    if (hasPrize) {
      psychologicalTriggers.push('Baiting & Reward Expectation (stimulating emotional excitement over sudden gain)');
    }
    if (hasDiversion) {
      psychologicalTriggers.push('Isolation & Audit Evasion (moving the victim outside monitored corporate or platform channels)');
    }
    if (psychologicalTriggers.length === 0) {
      psychologicalTriggers.push('None detected (communication displays normal interpersonal tone)');
    }

    // 3. Social Engineering Tactics Synthesis
    let socialEngineeringTactics = '';
    if (observedIndicators.length === 0) {
      socialEngineeringTactics =
        'No manipulative social engineering patterns were detected in the provided text. The communication does not exhibit artificial urgency, threat framing, or credential solicitation.';
    } else if (severities.includes('CRITICAL')) {
      socialEngineeringTactics =
        'The message pairs high-urgency language with critical account or verification demands. In social engineering, this combination is often associated with attempts to induce stress and obtain credentials or authorization before the recipient can independently verify the claim.';
    } else {
      socialEngineeringTactics =
        'The communication exhibits recognizable pressure characteristics: establishing an urgent scenario and prompting an immediate response without affording standard verification opportunities.';
    }

    // 4. Ambiguity Assessment
    let ambiguityAssessment = '';
    if (observedIndicators.length === 0) {
      ambiguityAssessment =
        'No known suspicious indicators were detected in this message. This assessment reflects absence of checked scam patterns rather than verified authenticity of the sender.';
    } else if (observedIndicators.length >= 3 || severities.includes('CRITICAL')) {
      ambiguityAssessment =
        'Low ambiguity: Multiple independent indicators confirm high-risk manipulation patterns characteristic of fraudulent campaigns.';
    } else {
      ambiguityAssessment =
        'Moderate ambiguity: Limited indicators were detected. While cautionary, some legitimate notifications can share similar urgency. Independently verify with the official entity before taking action.';
    }

    return {
      mode: 'LOCAL_HEURISTIC',
      providerName: this.name,
      scamArchetypes: archetypes,
      psychologicalTriggers,
      socialEngineeringTactics,
      ambiguityAssessment,
      unverifiedInferences: [],
    };
  }
}
