/**
 * Transparent Risk Assessment Engine
 * 
 * Computes an explainable, reproducible risk score (0-100) and discrete risk level.
 * 
 * CRITICAL RULE: The score represents a rule-based assessment metric, NOT an empirical
 * or statistical probability.
 */

import type {
  EvidenceStrength,
  ObservedIndicator,
  RiskAssessment,
  RiskContribution,
  RiskLevel,
  RiskWaterfallBreakdown,
} from '../types.js';

const SEVERITY_WEIGHTS = {
  CRITICAL: 40,
  HIGH: 25,
  MEDIUM: 15,
  LOW: 8,
};

export function calculateRiskAssessment(
  verifiedIndicators: ObservedIndicator[],
  rawTextLength: number
): RiskAssessment {
  if (verifiedIndicators.length === 0) {
    return {
      score: 0,
      level: 'BENIGN',
      evidenceStrength: 'MINIMAL',
      evidenceStrengthExplanation:
        'No recognizable scam patterns, coercive urgency, or credential solicitations were detected in the submitted text.',
      primaryCategories: ['Non-Malicious / Informational'],
      scoringRationale: [
        'Zero deterministic scam indicators detected.',
        'Text exhibits baseline conversational or benign characteristics.',
      ],
      waterfall: {
        baseScore: 0,
        synergyScore: 0,
        rawTotalScore: 0,
        capAdjustment: 0,
        finalScore: 0,
        contributions: [],
      },
      isNonProbabilisticNotice:
        'This score (0/100) reflects the absence of known defensive scam patterns. It is an algorithmic assessment, not a guarantee of legitimacy.',
    };
  }

  let totalScore = 0;
  let baseScore = 0;
  let synergyScore = 0;
  const contributions: RiskContribution[] = [];
  const rationale: string[] = [];
  const categoriesPresent = new Set(verifiedIndicators.map((i) => i.category));

  // 1. Add base weights for verified indicators
  for (const indicator of verifiedIndicators) {
    const weight = SEVERITY_WEIGHTS[indicator.severity];
    totalScore += weight;
    baseScore += weight;
    rationale.push(
      `+${weight} pts: ${indicator.severity} indicator (${indicator.name})`
    );
    contributions.push({
      id: `contrib_base_${indicator.id}`,
      label: indicator.name,
      category: indicator.category,
      points: weight,
      type: 'BASE_SEVERITY',
      sourceIndicatorId: indicator.id,
      characterRange: indicator.characterRange,
      evidenceQuote: indicator.evidence,
      explanation: `${indicator.severity} severity indicator: ${indicator.explanation}`,
    });
  }

  // 2. Contextual Compound Synergies
  // Combination: Impersonation + Credential Harvesting
  if (
    categoriesPresent.has('IMPERSONATION') &&
    categoriesPresent.has('CREDENTIAL_HARVESTING')
  ) {
    totalScore += 15;
    synergyScore += 15;
    rationale.push(
      '+15 pts synergy: Combined Brand Impersonation and Credential Harvesting (high-confidence phishing pattern)'
    );
    contributions.push({
      id: 'contrib_syn_impersonation_credential',
      label: 'Brand Impersonation & Credential Harvesting Synergy',
      category: 'COMPOUND_SYNERGY',
      points: 15,
      type: 'COMPOUND_SYNERGY',
      explanation: 'Combined Brand Impersonation and Credential Harvesting creates a high-confidence credential theft vector.',
    });
  }

  // Combination: Account Threat + Artificial Urgency
  if (
    categoriesPresent.has('ACCOUNT_THREAT') &&
    categoriesPresent.has('URGENCY_PRESSURE')
  ) {
    totalScore += 10;
    synergyScore += 10;
    rationale.push(
      '+10 pts synergy: Combined Account Threat and Artificial Urgency (coercive panic tactic)'
    );
    contributions.push({
      id: 'contrib_syn_threat_urgency',
      label: 'Account Threat & Artificial Urgency Synergy',
      category: 'COMPOUND_SYNERGY',
      points: 10,
      type: 'COMPOUND_SYNERGY',
      explanation: 'Combined Account Threat and Artificial Urgency induces panic to force unverified compliance.',
    });
  }

  // Combination: Financial Demand + Urgency Pressure
  if (
    categoriesPresent.has('FINANCIAL_COERCION') &&
    categoriesPresent.has('URGENCY_PRESSURE')
  ) {
    totalScore += 10;
    synergyScore += 10;
    rationale.push(
      '+10 pts synergy: Combined Financial Demand and Urgent Deadline (advance-fee extraction pressure)'
    );
    contributions.push({
      id: 'contrib_syn_financial_urgency',
      label: 'Financial Demand & Deadline Synergy',
      category: 'COMPOUND_SYNERGY',
      points: 10,
      type: 'COMPOUND_SYNERGY',
      explanation: 'Combined Financial Demand and Urgent Deadline pressures victim into rapid payment without verification.',
    });
  }

  const rawTotalScore = totalScore;
  let capAdjustment = 0;
  if (rawTotalScore > 100) {
    capAdjustment = 100 - rawTotalScore;
    contributions.push({
      id: 'contrib_cap_adjustment',
      label: 'Maximum Risk Scale Clamping',
      category: 'CAP_ADJUSTMENT',
      points: capAdjustment,
      type: 'CAP_ADJUSTMENT',
      explanation: 'Accumulated risk score exceeded 100 and was clamped to the maximum scale value.',
    });
  }

  // Cap score at 100
  const finalScore = Math.min(100, Math.max(0, totalScore));

  const waterfall: RiskWaterfallBreakdown = {
    baseScore,
    synergyScore,
    rawTotalScore,
    capAdjustment,
    finalScore,
    contributions,
  };

  // 3. Determine Discrete Risk Level
  let level: RiskLevel;
  if (finalScore <= 15) {
    level = 'BENIGN';
  } else if (finalScore <= 40) {
    level = 'LOW';
  } else if (finalScore <= 70) {
    level = 'MEDIUM';
  } else if (finalScore <= 89) {
    level = 'HIGH';
  } else {
    level = 'CRITICAL';
  }

  // 4. Determine Evidence Strength
  const criticalCount = verifiedIndicators.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = verifiedIndicators.filter((i) => i.severity === 'HIGH').length;

  let evidenceStrength: EvidenceStrength;
  let evidenceStrengthExplanation = '';

  if (criticalCount >= 1 || (highCount >= 2 && verifiedIndicators.length >= 3)) {
    evidenceStrength = 'SUBSTANTIAL';
    evidenceStrengthExplanation =
      'Substantial: Multiple high-impact, independent indicators observed across critical categories.';
  } else if (highCount >= 1 || verifiedIndicators.length >= 2) {
    evidenceStrength = 'MODERATE';
    evidenceStrengthExplanation =
      'Moderate: Recognized indicators observed; patterns warrant verification against official channels.';
  } else if (verifiedIndicators.length === 1) {
    evidenceStrength = 'LIMITED';
    evidenceStrengthExplanation =
      'Limited: Single isolated indicator detected. May be an ambiguous or benign false-positive.';
  } else {
    evidenceStrength = 'MINIMAL';
    evidenceStrengthExplanation = 'Minimal: No recognized indicators present in the input text.';
  }

  // 5. Derive Primary Categories
  const primaryCategories = Array.from(categoriesPresent).map((cat) => {
    switch (cat) {
      case 'CREDENTIAL_HARVESTING':
        return 'Credential & MFA Harvesting';
      case 'FINANCIAL_COERCION':
        return 'Financial Coercion / Payment Demand';
      case 'ACCOUNT_THREAT':
        return 'Account Suspension Intimidation';
      case 'URGENCY_PRESSURE':
        return 'Artificial Urgency & Deadline Coercion';
      case 'PRIZE_LOTTERY':
        return 'Unsolicited Prize / Lottery Bait';
      case 'IMPERSONATION':
        return 'Authority / Brand Impersonation';
      case 'CHANNEL_DIVERSION':
        return 'Off-Platform Channel Diversion';
      case 'SUSPICIOUS_LINK':
        return 'Deceptive Link / Domain Signature';
      case 'EMOTIONAL_MANIPULATION':
        return 'Evasion / Obfuscation Technique';
      default:
        return 'General Social Engineering';
    }
  });

  return {
    score: finalScore,
    level,
    evidenceStrength,
    evidenceStrengthExplanation,
    primaryCategories: primaryCategories.length > 0 ? primaryCategories : ['Unclassified'],
    scoringRationale: rationale,
    waterfall,
    isNonProbabilisticNotice:
      'This score represents the application\'s rule-based assessment and is not a statistical probability.',
  };
}
