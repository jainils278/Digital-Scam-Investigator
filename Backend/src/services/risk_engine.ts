import type {
  EvidenceStrength,
  InstitutionVerificationMatch,
  ObservedIndicator,
  RiskAssessment,
  RiskContribution,
  RiskLevel,
  RiskWaterfallBreakdown,
  UrlAnalysisSummary,
} from '../types.js';

const SEVERITY_WEIGHTS = {
  CRITICAL: 40,
  HIGH: 25,
  MEDIUM: 15,
  LOW: 8,
};

export function calculateRiskAssessment(
  verifiedIndicators: ObservedIndicator[],
  rawTextLength: number,
  urlSummaries: UrlAnalysisSummary[] = [],
  institutionVerification?: InstitutionVerificationMatch
): RiskAssessment {
  if (verifiedIndicators.length === 0 && urlSummaries.length === 0) {
    return {
      score: 0,
      level: 'NO_KNOWN_INDICATORS',
      evidenceStrength: 'MINIMAL',
      evidenceStrengthExplanation:
        'No recognizable scam patterns, coercive urgency, or credential solicitations were detected in the submitted input. Note: This does not verify that the sender, website, or message is legitimate.',
      primaryCategories: ['Non-Malicious / Informational'],
      scoringRationale: [
        'Zero deterministic scam indicators detected.',
        'Text exhibits baseline conversational or benign characteristics.',
        'Live page content, domain ownership history, and sender identity were not verified.',
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
        'This score (0/100) reflects the absence of known defensive scam patterns. It is an algorithmic rule assessment, not a guarantee of legitimacy.',
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

  // 2. URL Structural Risk Contributions
  for (const url of urlSummaries) {
    if (url.riskScore > 0) {
      // Check if URL brand spoofing or severe factor is present
      const hasSpoofing =
        url.threatDetails?.toLowerCase().includes('spoof') ||
        verifiedIndicators.some(
          (i) => i.category === 'SUSPICIOUS_LINK' && i.name.toLowerCase().includes('impersonation')
        );
      if (url.isPunycode || url.hasHomoglyph) {
        totalScore += 20;
        synergyScore += 20;
        rationale.push(`+20 pts: Lookalike / Punycode domain (${url.domain})`);
        contributions.push({
          id: `contrib_url_punycode_${url.domain}`,
          label: 'Punycode / Homoglyph Domain Risk',
          category: 'SUSPICIOUS_LINK',
          points: 20,
          type: 'COMPOUND_SYNERGY',
          explanation: `Domain ${url.domain} uses internationalized characters to mimic authentic brand names.`,
        });
      }
      if (url.isBareIp) {
        totalScore += 15;
        synergyScore += 15;
        rationale.push(`+15 pts: Direct IP address destination (${url.hostname})`);
        contributions.push({
          id: `contrib_url_bare_ip_${url.hostname}`,
          label: 'Direct IP Address Hostname',
          category: 'SUSPICIOUS_LINK',
          points: 15,
          type: 'COMPOUND_SYNERGY',
          explanation: `URL points directly to an IP address (${url.hostname}) rather than a verified registered domain.`,
        });
      }
      if (url.isShortener) {
        totalScore += 10;
        synergyScore += 10;
        rationale.push(`+10 pts: URL Shortener hiding destination (${url.domain})`);
        contributions.push({
          id: `contrib_url_shortener_${url.domain}`,
          label: 'Obfuscated Shortened Link',
          category: 'SUSPICIOUS_LINK',
          points: 10,
          type: 'COMPOUND_SYNERGY',
          explanation: `URL uses a shortening service (${url.domain}) that obscures the real destination host.`,
        });
      }
    }
  }

  // 3. Institution Domain Mismatch Contribution
  const hasInstitutionMismatch =
    !!institutionVerification?.matched &&
    Array.isArray(institutionVerification.messageDiscrepancyNotes) &&
    institutionVerification.messageDiscrepancyNotes.length > 0;

  if (hasInstitutionMismatch) {
    totalScore += 25;
    synergyScore += 25;
    rationale.push(
      `+25 pts: Official domain mismatch with claimed organization (${institutionVerification!.claimedPretext})`
    );
    contributions.push({
      id: 'contrib_inst_domain_mismatch',
      label: 'Official Institution Domain Mismatch',
      category: 'COMPOUND_SYNERGY',
      points: 25,
      type: 'COMPOUND_SYNERGY',
      explanation:
        institutionVerification!.messageDiscrepancyNotes![0] ||
        `Destination URL does not match official domain of claimed institution.`,
    });
  }

  // 4. Contextual Compound Synergies
  // Combination: Impersonation + Credential Harvesting
  if (
    (categoriesPresent.has('IMPERSONATION') || !!institutionVerification?.matched) &&
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

  // 5. Centralized High-Impact Minimum Scoring Rules
  let minScore = 0;
  let minLevel: RiskLevel | null = null;
  const policyRationale: string[] = [];

  const hasDirectOtpOrCredRequest = verifiedIndicators.some(
    (i) =>
      i.id === 'ind_cred_otp' ||
      (i.category === 'CREDENTIAL_HARVESTING' &&
        /(?:\botp\b|\bpin\b|\bpass(?:word|code)\b|\bverification code\b|\bsecret code\b|\bsecurity code\b)/i.test(
          i.name + ' ' + (i.evidence || '')
        ))
  );

  const hasPaymentDemand =
    categoriesPresent.has('FINANCIAL_COERCION') ||
    verifiedIndicators.some((i) => i.id.includes('ind_fin_'));

  const hasSuspiciousOrMismatchedUrl =
    hasInstitutionMismatch ||
    urlSummaries.some(
      (u) =>
        u.isPunycode ||
        u.hasHomoglyph ||
        u.isBareIp ||
        u.isShortener ||
        u.riskScore >= 25 ||
        u.reputationStatus === 'SUSPICIOUS' ||
        u.reputationStatus === 'MALICIOUS'
    ) ||
    verifiedIndicators.some(
      (i) =>
        i.category === 'SUSPICIOUS_LINK' &&
        (i.severity === 'HIGH' || i.severity === 'CRITICAL')
    );

  const hasCourierOrDeliveryPretext =
    institutionVerification?.institution?.category === 'LOGISTICS_POSTAL' ||
    verifiedIndicators.some(
      (i) =>
        i.id.includes('delivery') ||
        /package|delivery|parcel|shipment|courier|postal|usps|fedex|ups|dhl/i.test(
          i.name + ' ' + i.explanation + ' ' + i.evidence
        )
    );

  // Minimum Rule 1: Direct request for OTP, PIN, password, recovery code
  if (hasDirectOtpOrCredRequest) {
    minScore = Math.max(minScore, 90);
    minLevel = 'CRITICAL';
    policyRationale.push('Direct request for OTP/PIN/password (minimum score: 90, level: CRITICAL)');
  }

  // Minimum Rule 2: Institution impersonation plus domain mismatch
  if (
    (categoriesPresent.has('IMPERSONATION') || !!institutionVerification?.matched) &&
    hasInstitutionMismatch
  ) {
    minScore = Math.max(minScore, 75);
    if (minLevel !== 'CRITICAL') minLevel = 'HIGH';
    policyRationale.push('Institution impersonation with domain mismatch (minimum score: 75, level: HIGH)');

    // Minimum Rule 3: Institution impersonation plus domain mismatch plus payment request
    if (hasPaymentDemand) {
      minScore = Math.max(minScore, 90);
      minLevel = 'CRITICAL';
      policyRationale.push('Institution impersonation with domain mismatch and payment demand (minimum score: 90, level: CRITICAL)');
    }
  }

  // Minimum Rule 4: Delivery/courier impersonation plus payment request plus suspicious or mismatched domain
  if (
    hasCourierOrDeliveryPretext &&
    hasPaymentDemand &&
    hasSuspiciousOrMismatchedUrl
  ) {
    minScore = Math.max(minScore, 80);
    if (minLevel !== 'CRITICAL') minLevel = 'HIGH';
    policyRationale.push('Delivery impersonation with payment request and suspicious/mismatched domain (minimum score: 80, level: HIGH)');
  }

  // Minimum Rule 5: Lookalike domain, punycode, homoglyph, bare IP, or shortener combined with urgency, payment, credentials, or account threat
  if (
    hasSuspiciousOrMismatchedUrl &&
    (categoriesPresent.has('URGENCY_PRESSURE') || hasPaymentDemand || categoriesPresent.has('CREDENTIAL_HARVESTING') || categoriesPresent.has('ACCOUNT_THREAT'))
  ) {
    minScore = Math.max(minScore, 80);
    if (minLevel !== 'CRITICAL') minLevel = 'HIGH';
    policyRationale.push('Suspicious URL structure combined with urgency, payment, credentials, or account threat (minimum score: 80, level: HIGH)');
  }

  // Minimum Rule 6: Account suspension threat plus urgency plus credential request
  if (
    categoriesPresent.has('ACCOUNT_THREAT') &&
    categoriesPresent.has('URGENCY_PRESSURE') &&
    categoriesPresent.has('CREDENTIAL_HARVESTING')
  ) {
    minScore = Math.max(minScore, 90);
    minLevel = 'CRITICAL';
    policyRationale.push('Account suspension threat with urgency and credential request (minimum score: 90, level: CRITICAL)');
  }

  // Minimum Rule 7: Government/tax authority impersonation or legal threat combined with gift cards or non-standard payment
  const hasGovOrLegalThreat =
    categoriesPresent.has('ACCOUNT_THREAT') ||
    institutionVerification?.institution?.category === 'GOVERNMENT' ||
    verifiedIndicators.some(
      (i) =>
        i.id.includes('authority') ||
        i.id.includes('legal') ||
        i.id.includes('arrest') ||
        /irs|tax|internal\s*revenue|warrant|arrest|fbi|police|court|customs/i.test(
          i.name + ' ' + (i.evidence || '')
        )
    );

  const hasGiftCardOrNonStandardPayment =
    verifiedIndicators.some(
      (i) =>
        i.id.includes('gift_card') ||
        i.id.includes('crypto') ||
        i.id.includes('wire') ||
        /(?:gift\s*card|itunes|apple\s*gift|steam|crypto|bitcoin|wire\s*transfer)/i.test(
          i.name + ' ' + (i.evidence || '')
        )
    );

  if (hasGovOrLegalThreat && hasGiftCardOrNonStandardPayment) {
    minScore = Math.max(minScore, 90);
    minLevel = 'CRITICAL';
    policyRationale.push(
      'Government/legal threat combined with non-standard payment demand (minimum score: 90, level: CRITICAL)'
    );
  }

  // Minimum Rule 8: Unsolicited job/recruitment lure diverting to external messaging channels (Telegram/WhatsApp)
  const hasJobOrRecruitmentLure =
    verifiedIndicators.some(
      (i) =>
        i.id.includes('ind_lure_job') ||
        /job|recruitment|work[-\s]from[-\s]home|data\s*entry|hiring/i.test(i.name + ' ' + (i.evidence || ''))
    );

  const hasOffPlatformDiversion =
    categoriesPresent.has('CHANNEL_DIVERSION') ||
    verifiedIndicators.some((i) => i.id.includes('div_channel'));

  if (hasJobOrRecruitmentLure && hasOffPlatformDiversion) {
    minScore = Math.max(minScore, 75);
    if (minLevel !== 'CRITICAL') minLevel = 'HIGH';
    policyRationale.push(
      'Unsolicited job offer diverting to external communication channel (minimum score: 75, level: HIGH)'
    );
  }

  // Apply policy floor if applicable
  if (totalScore < minScore) {
    const policyBoost = minScore - totalScore;
    totalScore = minScore;
    synergyScore += policyBoost;
    contributions.push({
      id: 'contrib_policy_floor',
      label: 'Centralized Risk Policy Floor',
      category: 'COMPOUND_SYNERGY',
      points: policyBoost,
      type: 'COMPOUND_SYNERGY',
      explanation: policyRationale[0] || 'High-impact compound risk policy floor applied.',
    });
    rationale.push(`+${policyBoost} pts: Centralized risk policy floor (${policyRationale[0]})`);
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

  // 6. Determine Discrete Risk Level
  let level: RiskLevel;
  if (finalScore <= 15) {
    level = verifiedIndicators.length === 0 ? 'NO_KNOWN_INDICATORS' : 'LOW';
  } else if (finalScore <= 40) {
    level = 'LOW';
  } else if (finalScore <= 70) {
    level = 'MEDIUM';
  } else if (finalScore <= 89) {
    level = 'HIGH';
  } else {
    level = 'CRITICAL';
  }

  // Enforce minimum level if mandated by policy rules
  if (minLevel === 'CRITICAL' && level !== 'CRITICAL') {
    level = 'CRITICAL';
  } else if (minLevel === 'HIGH' && (level === 'LOW' || level === 'MEDIUM' || level === 'NO_KNOWN_INDICATORS')) {
    level = 'HIGH';
  }

  // 7. Determine Evidence Strength
  const criticalCount = verifiedIndicators.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = verifiedIndicators.filter((i) => i.severity === 'HIGH').length;

  let evidenceStrength: EvidenceStrength;
  let evidenceStrengthExplanation = '';

  if (criticalCount >= 1 || (highCount >= 2 && verifiedIndicators.length >= 3) || finalScore >= 80) {
    evidenceStrength = 'SUBSTANTIAL';
    evidenceStrengthExplanation =
      'Substantial: Multiple high-impact, independent indicators observed across critical categories.';
  } else if (highCount >= 1 || verifiedIndicators.length >= 2 || finalScore >= 45) {
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

  // 8. Derive Primary Categories
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

  if (hasInstitutionMismatch && !primaryCategories.includes('Authority / Brand Impersonation')) {
    primaryCategories.unshift('Authority / Brand Impersonation');
  }

  return {
    score: finalScore,
    level,
    evidenceStrength,
    evidenceStrengthExplanation,
    primaryCategories: primaryCategories.length > 0 ? primaryCategories : ['Unclassified'],
    scoringRationale: rationale,
    waterfall,
    isNonProbabilisticNotice:
      'This score represents the application\'s rule-based assessment and is not a statistical probability. This does not verify that the sender, website, or message is legitimate.',
  };
}
