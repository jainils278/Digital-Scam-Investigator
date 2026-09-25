/**
 * Deterministic Psychological Tactic Fingerprinting Engine
 * 
 * Analyzes verified observed indicators and infrastructure to identify higher-level
 * composite social engineering tactic patterns.
 * 
 * STRICT RULES:
 * 1. Operates solely on verified indicators and passive structural URL telemetry.
 * 2. Pure deterministic rule-based evaluation (zero LLM dependency).
 * 3. Never claims definitive attacker intent; uses defensible "Pattern consistent with..." phrasing.
 * 4. Benign messages with zero indicators produce an empty tactic profile.
 */

import type {
  IndicatorCategory,
  IndicatorSeverity,
  ObservedIndicator,
  TacticFingerprint,
  TacticProfile,
  UrlAnalysisSummary,
} from '../../types.js';

export function analyzeTacticProfile(
  verifiedIndicators: ObservedIndicator[],
  urlSummaries: UrlAnalysisSummary[] = []
): TacticProfile {
  if (!verifiedIndicators || verifiedIndicators.length === 0) {
    return {
      allTactics: [],
      tacticCount: 0,
      summary: 'No composite predatory social engineering manipulation patterns were detected in the analyzed material.',
    };
  }

  const tactics: TacticFingerprint[] = [];
  const categories = new Set(verifiedIndicators.map((i) => i.category));
  const hasCritical = verifiedIndicators.some((i) => i.severity === 'CRITICAL');

  const getIndicatorsForCategories = (...cats: IndicatorCategory[]): string[] => {
    return verifiedIndicators
      .filter((i) => cats.includes(i.category))
      .map((i) => i.id);
  };

  // 1. Authority-Pressure Manipulation
  // Combination: Impersonation + (Urgency Pressure OR Account Threat)
  if (
    categories.has('IMPERSONATION') &&
    (categories.has('URGENCY_PRESSURE') || categories.has('ACCOUNT_THREAT'))
  ) {
    const ids = getIndicatorsForCategories('IMPERSONATION', 'URGENCY_PRESSURE', 'ACCOUNT_THREAT');
    const severity: IndicatorSeverity = categories.has('ACCOUNT_THREAT') || hasCritical ? 'CRITICAL' : 'HIGH';
    tactics.push({
      id: 'TAC_AUTH_PRESSURE',
      name: 'Authority-Pressure Manipulation',
      category: 'IMPERSONATION',
      severity,
      constituentIndicatorIds: ids,
      targetedVulnerability: 'Authority deference & fear of administrative, financial, or legal repercussions',
      patternDescription:
        'Pattern consistent with establishing an authoritative persona (financial institution, utility provider, or regulatory body) while imposing acute deadlines to rush compliance before independent verification.',
      explanation:
        'The communication pairs institutional authority pretexting with immediate negative consequences, designed to trigger panic and bypass deliberate rational scrutiny.',
      spottingTip:
        'Official institutions will not penalize you for taking 15 minutes to pause, verify sender credentials, and independently check claims through their official app or website.',
    });
  }

  // 2. Trust-Transfer Payment Extraction
  // Combination: Impersonation + Financial Coercion
  if (
    categories.has('IMPERSONATION') &&
    categories.has('FINANCIAL_COERCION')
  ) {
    const ids = getIndicatorsForCategories('IMPERSONATION', 'FINANCIAL_COERCION');
    const hasGiftCard = verifiedIndicators.some((i) => i.id.includes('ind_fin_gift_cards'));
    const hasCrypto = verifiedIndicators.some((i) => i.id.includes('ind_fin_crypto'));
    const severity: IndicatorSeverity = hasGiftCard || hasCrypto || hasCritical ? 'CRITICAL' : 'HIGH';
    tactics.push({
      id: 'TAC_TRUST_PAYMENT',
      name: 'Trust-Transfer Payment Extraction',
      category: 'FINANCIAL_COERCION',
      severity,
      constituentIndicatorIds: ids,
      targetedVulnerability: 'Transferred corporate trust used to legitimize unexpected financial demands',
      patternDescription:
        'Pattern consistent with borrowing recognized brand credibility to manufacture an unexpected fee, overdue bill, or toll debt that requires immediate transfer.',
      explanation:
        'By impersonating a trusted entity, the sender attempts to overcome the recipient\'s natural resistance to sending unverified payments.',
      spottingTip:
        'Legitimate companies and public utilities never mandate payments via retail gift cards, cryptocurrency, or direct personal peer-to-peer transfers.',
    });
  }

  // 3. Pressure-Driven Credential Harvesting
  // Combination: Credential Harvesting + (Account Threat OR Urgency Pressure)
  if (
    categories.has('CREDENTIAL_HARVESTING') &&
    (categories.has('ACCOUNT_THREAT') || categories.has('URGENCY_PRESSURE'))
  ) {
    const ids = getIndicatorsForCategories('CREDENTIAL_HARVESTING', 'ACCOUNT_THREAT', 'URGENCY_PRESSURE');
    tactics.push({
      id: 'TAC_COERCIVE_CRED_HARVEST',
      name: 'Pressure-Driven Credential Harvesting',
      category: 'CREDENTIAL_HARVESTING',
      severity: 'CRITICAL',
      constituentIndicatorIds: ids,
      targetedVulnerability: 'Fear of service disruption & cognitive panic regarding account security',
      patternDescription:
        'Pattern consistent with manufacturing an account suspension or security alert to rush the recipient into disclosing passwords, PINs, or one-time verification passcodes (OTPs).',
      explanation:
        'Coercive urgency is applied to convince the target that inputting authentication tokens is an urgent protective step, when in reality it enables authentication bypass.',
      spottingTip:
        'One-time passcodes (OTPs) and PINs are private master access keys. No legitimate support agent or automated system will ever request that you share them.',
    });
  }

  // 4. Windfall Bait & Advance-Fee Extraction
  // Combination: Prize/Lottery/Job + Financial Coercion
  if (
    categories.has('PRIZE_LOTTERY') &&
    categories.has('FINANCIAL_COERCION')
  ) {
    const ids = getIndicatorsForCategories('PRIZE_LOTTERY', 'FINANCIAL_COERCION');
    tactics.push({
      id: 'TAC_WINDFALL_ADVANCE_FEE',
      name: 'Windfall Bait & Advance-Fee Extraction',
      category: 'PRIZE_LOTTERY',
      severity: 'HIGH',
      constituentIndicatorIds: ids,
      targetedVulnerability: 'Excitement over unearned financial gain & reward expectation',
      patternDescription:
        'Pattern consistent with enticing the recipient with an unexpected reward, lottery prize, or lucrative job offer, coupled with an upfront administrative or release fee.',
      explanation:
        'The prospect of sudden windfall wealth diminishes skepticism, inducing victims to send nominal fees under the false promise of receiving larger payouts.',
      spottingTip:
        'Genuine lotteries, prizes, and legitimate employers will never require candidates or winners to pay an upfront processing or registration fee.',
    });
  }

  // 5. Communication Channel Diversion & Isolation
  // Combination: Channel Diversion + (Financial Coercion OR Credential Harvesting OR Impersonation)
  if (
    categories.has('CHANNEL_DIVERSION') &&
    (categories.has('FINANCIAL_COERCION') || categories.has('CREDENTIAL_HARVESTING') || categories.has('IMPERSONATION'))
  ) {
    const ids = getIndicatorsForCategories(
      'CHANNEL_DIVERSION',
      'FINANCIAL_COERCION',
      'CREDENTIAL_HARVESTING',
      'IMPERSONATION'
    );
    tactics.push({
      id: 'TAC_ISOLATION_DIVERSION',
      name: 'Communication Channel Diversion & Isolation',
      category: 'CHANNEL_DIVERSION',
      severity: 'HIGH',
      constituentIndicatorIds: ids,
      targetedVulnerability: 'Isolation from platform protections & evasion of automated fraud monitoring',
      patternDescription:
        'Pattern consistent with moving the communication away from monitored corporate or marketplace platforms to private encrypted channels (e.g. Telegram or WhatsApp) before making sensitive demands.',
      explanation:
        'Off-platform migration prevents automated platform scanning, content moderation, and fraud flags from interrupting the fraudulent engagement.',
      spottingTip:
        'Always conduct financial or recruitment correspondence within the official platform where verified identity records and dispute protections exist.',
    });
  }

  // 6. Lookalike Delivery Redirection Trap
  // Combination: Impersonation (delivery courier) + Suspicious Link (or suspicious URL summary)
  const hasDelivery = verifiedIndicators.some((i) => i.id.includes('ind_imp_delivery'));
  const hasSuspiciousUrl =
    categories.has('SUSPICIOUS_LINK') ||
    urlSummaries.some((u) => u.riskScore >= 40 || u.reputationStatus === 'SUSPICIOUS' || u.reputationStatus === 'MALICIOUS');

  if (hasDelivery && hasSuspiciousUrl) {
    const ids = verifiedIndicators
      .filter((i) => i.id.includes('ind_imp_delivery') || i.category === 'SUSPICIOUS_LINK')
      .map((i) => i.id);
    tactics.push({
      id: 'TAC_DECEPTIVE_DELIVERY',
      name: 'Deceptive Delivery Parcel Redirection',
      category: 'SUSPICIOUS_LINK',
      severity: 'HIGH',
      constituentIndicatorIds: ids,
      targetedVulnerability: 'Routine reliance on parcel tracking and anxiety regarding missed deliveries',
      patternDescription:
        'Pattern consistent with package delivery smishing impersonating couriers (e.g. USPS, FedEx, UPS, DHL) directing users to lookalike domains to harvest payment card details.',
      explanation:
        'Attackers capitalize on high volumes of consumer e-commerce, assuming recipients are expecting deliveries and will instinctively tap links to resolve package holds.',
      spottingTip:
        'Inspect the root registered domain name in parcel alerts. Hyphenated lookalikes (e.g. usps-redelivery-portal.com) are not legitimate carrier infrastructure.',
    });
  }

  // 7. Distress Pretext & Emotional Coercion
  // Combination: Emotional Manipulation + Financial Coercion
  if (
    categories.has('EMOTIONAL_MANIPULATION') &&
    categories.has('FINANCIAL_COERCION')
  ) {
    const ids = getIndicatorsForCategories('EMOTIONAL_MANIPULATION', 'FINANCIAL_COERCION');
    tactics.push({
      id: 'TAC_EMERGENCY_IMPERSONATION',
      name: 'Distress Pretext & Emotional Coercion',
      category: 'EMOTIONAL_MANIPULATION',
      severity: 'HIGH',
      constituentIndicatorIds: ids,
      targetedVulnerability: 'Empathy exploitation & urgent response to perceived interpersonal crisis',
      patternDescription:
        'Pattern consistent with impersonating a friend or relative claiming an acute personal emergency to extract funds before the recipient can make voice contact.',
      explanation:
        'Fabricating an urgent emergency exploits emotional empathy to short-circuit standard financial due diligence and authentication steps.',
      spottingTip:
        'Before transferring funds for any purported family emergency, immediately verify the claim by calling the known official phone number of the individual or other relatives.',
    });
  }

  // Sort by severity: CRITICAL first, then HIGH, then MEDIUM
  const severityRank: Record<IndicatorSeverity, number> = {
    CRITICAL: 3,
    HIGH: 2,
    MEDIUM: 1,
    LOW: 0,
  };
  tactics.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);

  const primaryTactic = tactics[0];
  let summary = '';

  if (tactics.length === 1) {
    summary = `Identified 1 primary manipulation tactic: ${primaryTactic.name}.`;
  } else if (tactics.length > 1) {
    summary = `Identified ${tactics.length} intersecting manipulation tactics, led by ${primaryTactic.name}.`;
  } else {
    summary = 'No composite predatory social engineering tactic patterns were identified from the observed indicators.';
  }

  return {
    primaryTactic,
    allTactics: tactics,
    tacticCount: tactics.length,
    summary,
  };
}

export const analyzeTactics = analyzeTacticProfile;
