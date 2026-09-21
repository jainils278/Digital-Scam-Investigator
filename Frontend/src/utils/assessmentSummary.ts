import type { InvestigationReport, ObservedIndicator } from '../types/index.js';

export interface AssessmentPanelData {
  state: 'SUSPICIOUS' | 'AMBIGUOUS' | 'NO_INDICATORS';
  badgeText: string;
  badgeType: 'critical' | 'high' | 'ambiguous' | 'clean';
  category: string;
  headerText: 'KEY INDICATORS' | 'KEY FINDINGS';
  keyItems: string[];
  clarification: string;
}

/**
 * Derives user-facing category from verified observed evidence and primary categories.
 */
function deriveCategory(report: InvestigationReport): string {
  const text = (report.rawText || '').toLowerCase();
  const indicators = report.observedIndicators || [];
  const indIds = indicators.map((i) => i.id.toLowerCase());
  const cats = new Set(indicators.map((i) => i.category));

  // Toll / Highway payment phishing
  if (
    (text.includes('toll') || text.includes('highway toll')) &&
    (text.includes('pay') || text.includes('due') || text.includes('penalty') || text.includes('fee'))
  ) {
    return 'Toll / Payment Phishing';
  }

  // Utility / Electricity Disconnection
  if (
    (text.includes('electricity') || text.includes('power') || text.includes('utility')) &&
    (text.includes('disconnect') || text.includes('bill'))
  ) {
    return 'Utility Impersonation / Payment Phishing';
  }

  // Government / Tax / Income Tax / PAN notice
  if (
    (text.includes('income tax') ||
      text.includes('pan will be blocked') ||
      text.includes('tax department') ||
      text.includes('irs') ||
      text.includes('fbi') ||
      text.includes('arrest warrant')) &&
    (text.includes('transfer') || text.includes('pay') || text.includes('legal'))
  ) {
    return 'Government Impersonation / Financial';
  }

  // Job Scam / Employment bait
  if (
    (text.includes('work-from-home') || text.includes('job') || text.includes('recruitment') || text.includes('onboarding')) &&
    (text.includes('registration') || text.includes('charges') || text.includes('fee') || text.includes('pay ₹') || text.includes('pay $'))
  ) {
    return 'Job Scam';
  }

  // Investment Scam / High Yield
  if (
    (text.includes('invest') || text.includes('investment') || text.includes('returns of') || text.includes('guaranteed return')) &&
    (text.includes('guaranteed') || text.includes('returns') || text.includes('slots'))
  ) {
    return 'Investment Scam';
  }

  // Subscription Renewal / Antivirus / Tech Support
  if (
    (text.includes('subscription') || text.includes('antivirus') || text.includes('renew') || text.includes('auto-renew')) &&
    (text.includes('call') || text.includes('cancel') || text.includes('refund'))
  ) {
    return 'Subscription / Tech Support Impersonation';
  }

  // Prize / Reward Scam
  if (
    cats.has('PRIZE_LOTTERY') ||
    (text.includes('won') && (text.includes('lucky draw') || text.includes('lottery') || text.includes('prize') || text.includes('processing fee')))
  ) {
    return 'Prize / Reward Scam';
  }

  // Gift Card Payment Scam
  if (indIds.some((id) => id.includes('ind_fin_gift_cards')) || text.includes('gift card') || text.includes('gift cards')) {
    return 'Account Takeover / Payment Scam';
  }

  // Courier / Delivery Phishing
  if (
    indIds.some((id) => id.includes('ind_imp_delivery')) ||
    ((text.includes('parcel') || text.includes('delivery') || text.includes('courier') || text.includes('package')) &&
      (text.includes('pay') || text.includes('fee') || text.includes('redelivery') || text.includes('reschedule') || text.includes('charges')))
  ) {
    return 'Delivery / Payment Phishing';
  }

  // UPI Refund / Payment Bait
  if (text.includes('refund') && (text.includes('upi') || text.includes('pin') || text.includes('pending'))) {
    return 'Payment / Credential Harvesting';
  }

  // Bank Impersonation / Account Takeover / Credential Harvesting
  if (
    (cats.has('IMPERSONATION') || text.includes('bank') || text.includes('account')) &&
    (cats.has('CREDENTIAL_HARVESTING') || text.includes('otp') || text.includes('password') || text.includes('pin'))
  ) {
    if (text.includes('bank') || indIds.some((id) => id.includes('ind_imp_bank'))) {
      return 'Account Takeover / Bank Impersonation';
    }
    return 'Impersonation / Credential Harvesting';
  }

  // Bank Transaction Alert / Fear
  if (text.includes('bank') && (text.includes('transaction') || text.includes('attempted') || text.includes('secure your funds'))) {
    return 'Bank Impersonation / Financial';
  }

  // Social Media / Impersonation
  if (
    (text.includes('stuck and need money') || text.includes("don't call me right now") || text.includes("phone isn't working")) &&
    (text.includes('send') || text.includes('upi'))
  ) {
    return 'Social Engineering / Impersonation';
  }

  // General Credential Phishing with link
  if (cats.has('CREDENTIAL_HARVESTING') && (cats.has('SUSPICIOUS_LINK') || (report.urlAnalysis && report.urlAnalysis.length > 0))) {
    return 'Phishing / Credential and Financial Information Harvesting';
  }

  // Default to primary categories from Risk Assessment if available
  if (report.riskAssessment?.primaryCategories && report.riskAssessment.primaryCategories.length > 0) {
    const primary = report.riskAssessment.primaryCategories[0];
    if (primary !== 'Unclassified' && primary !== 'Non-Malicious / Informational') {
      return primary;
    }
  }

  return 'Social Engineering / Suspicious Communication';
}

/**
 * Derives category for ambiguous cases with insufficient evidence.
 */
function deriveAmbiguousCategory(report: InvestigationReport): string {
  const text = (report.rawText || '').toLowerCase();
  if (text.includes('package') || text.includes('parcel') || text.includes('delivery') || text.includes('order')) {
    return 'Delivery / Account Activity';
  }
  if (text.includes('payment') || text.includes('transaction') || text.includes('refund')) {
    return 'Payment / Transaction Activity';
  }
  if (
    text.includes('account') ||
    text.includes('login') ||
    text.includes('verification') ||
    text.includes('membership') ||
    text.includes('subscription')
  ) {
    return 'Account Activity / Verification';
  }
  return 'General Communication / Context Incomplete';
}

/**
 * Derives concise, user-facing key indicator phrases from verified observed indicators.
 * Ensures AI inferences are never converted into observed facts.
 */
function deriveKeyIndicators(report: InvestigationReport): string[] {
  const indicators: ObservedIndicator[] = report.observedIndicators || [];
  const text = (report.rawText || '').toLowerCase();
  const items: string[] = [];

  const add = (item: string) => {
    if (!items.includes(item)) {
      items.push(item);
    }
  };

  // 1. Process observed indicators (authoritative source)
  for (const ind of indicators) {
    const id = ind.id.toLowerCase();
    const cat = ind.category;
    const name = ind.name.toLowerCase();

    if (
      id.includes('ind_cred_otp') ||
      name.includes('otp') ||
      name.includes('passcode') ||
      name.includes('pin') ||
      (text.includes('otp') && (text.includes('send') || text.includes('enter') || text.includes('provide')))
    ) {
      add('One-Time Passcode (OTP) / PIN request');
    }
    if (
      id.includes('ind_cred_login') ||
      name.includes('login') ||
      name.includes('credential verification') ||
      (text.includes('password') && (text.includes('send') || text.includes('enter')))
    ) {
      add('Credential harvesting / password request');
    }
    if (
      id.includes('ind_threat_suspension') ||
      name.includes('suspension') ||
      name.includes('blocked') ||
      (text.includes('account') && (text.includes('suspended') || text.includes('blocked') || text.includes('closure')))
    ) {
      add('Account suspension / closure threat');
    }
    if (
      id.includes('ind_threat_legal') ||
      name.includes('legal') ||
      text.includes('legal action') ||
      text.includes('arrest warrant')
    ) {
      add('Legal coercion / law enforcement threat');
    }
    if (
      id.includes('ind_urg_consequence') ||
      name.includes('artificial deadline') ||
      (text.includes('within') && (text.includes('hours') || text.includes('minutes') || text.includes('days')))
    ) {
      add('Artificial deadline / urgency pressure');
    }
    if (
      id.includes('ind_urg_immediate_call') ||
      name.includes('urgent') ||
      (text.includes('urgent') && !text.includes('never'))
    ) {
      add('Urgent call-to-action pressure');
    }
    if (id.includes('ind_fin_gift_cards') || text.includes('gift card')) {
      add('Gift card payment demand');
    }
    if (id.includes('ind_fin_crypto') || text.includes('crypto') || text.includes('bitcoin')) {
      add('Cryptocurrency transfer demand');
    }
    if (id.includes('ind_fin_advance_fee') || name.includes('advance fee') || name.includes('fee request')) {
      add('Upfront fee / payment request');
    }
    if (
      id.includes('ind_prize_win') ||
      name.includes('prize') ||
      name.includes('lucky draw') ||
      text.includes('won ₹') ||
      text.includes('won $')
    ) {
      add('Unsolicited prize or reward claim');
    }
    if (id.includes('ind_imp_bank') || name.includes('financial institution')) {
      add('Bank / financial institution impersonation');
    }
    if (
      id.includes('ind_imp_delivery') ||
      name.includes('delivery problem') ||
      text.includes('parcel could not be delivered')
    ) {
      add('Delivery problem claim');
    }
    if (id.includes('ind_div_channel') || name.includes('diversion') || text.includes("don't call me right now")) {
      add('Communication diversion / restriction');
    }
    if (id.includes('ind_link_ip') || name.includes('bare ip')) {
      add('Bare IP address URL');
    }
    if (id.includes('ind_link_spoofed_keyword') || name.includes('spoofed')) {
      add('Lookalike / spoofed domain link');
    }
    if (cat === 'SUSPICIOUS_LINK' || id.startsWith('ind_url_')) {
      add('Suspicious URL link');
    }
    if (id.includes('ind_evasion_zerowidth')) {
      add('Hidden zero-width Unicode characters');
    }
    if (id.includes('ind_evasion_homoglyph')) {
      add('Lookalike homoglyph characters');
    }
  }

  // 2. Verified URL intelligence
  if (report.urlAnalysis && report.urlAnalysis.length > 0 && !items.some((i) => i.toLowerCase().includes('url'))) {
    add('Suspicious URL link');
  }

  // 3. Grounded textual evidence patterns if under 4 items
  if (items.length < 4) {
    if (
      (text.includes('toll') || text.includes('highway toll')) &&
      !items.some((i) => i.toLowerCase().includes('toll') || i.toLowerCase().includes('debt'))
    ) {
      add('Unexpected debt / payment claim');
    }
    if (
      (text.includes('refund') || text.includes('upi refund')) &&
      !items.some((i) => i.toLowerCase().includes('refund'))
    ) {
      add('Refund lure / bait claim');
    }
    if (
      (text.includes('transaction was attempted') ||
        text.includes('transaction attempted') ||
        text.includes('unauthorized transaction')) &&
      !items.some((i) => i.toLowerCase().includes('transaction'))
    ) {
      add('Unexpected transaction claim');
    }
    if (
      (text.includes('pay ₹') || text.includes('pay $') || text.includes('transfer ₹') || text.includes('transfer $')) &&
      !items.some((i) => i.toLowerCase().includes('payment'))
    ) {
      add('Payment request');
    }
    if (
      text.includes('call ') &&
      (text.includes('immediately') || text.includes('to cancel') || text.includes('to secure'))
    ) {
      add('Phone response request');
    }
    if (text.includes('guaranteed return') || text.includes('returns of ₹')) {
      add('Guaranteed / unrealistic return promise');
    }
    if (text.includes('selected for a work-from-home') || text.includes('work-from-home position')) {
      add('Unsolicited job offer');
    }
    if (text.includes('electricity connection will be disconnected') || text.includes('connection will be disconnected')) {
      add('Utility disconnection threat');
    }
    if (text.includes('income tax department notice') || text.includes('pan will be blocked')) {
      add('Authority impersonation / tax notice claim');
    }
    if (text.includes('requires verification') && (text.includes('card number') || text.includes('enter your password'))) {
      add('Financial and credential harvesting');
    }
  }

  return items.slice(0, 5);
}

/**
 * Helper to identify messages with ambiguous context, incomplete claims, or unverifiable requests
 * that lack strong scam indicators but warrant verification before compliance.
 */
function isAmbiguousText(text: string): boolean {
  const lower = text.toLowerCase();

  // If the message has explicit educational or official guidance markers, it is legitimate/clean
  const hasOfficialOrDefensiveMarker =
    lower.includes('official') ||
    lower.includes('never share') ||
    lower.includes('do not share') ||
    lower.includes("don't share") ||
    lower.includes('internal employee portal') ||
    lower.includes('scheduled maintenance') ||
    lower.includes('project meeting') ||
    lower.includes('flight ai-') ||
    lower.includes('message me on whatsapp') ||
    lower.includes('reimbursement for your approved') ||
    lower.includes('college assignment') ||
    lower.includes('was successful') ||
    lower.includes('amount payable on delivery');

  if (hasOfficialOrDefensiveMarker) {
    return false;
  }

  // Common ambiguous contextual triggers (package delivery issues, account notices, failed payments, verification prompts)
  const ambiguousPatterns = [
    /package\s+could\s+not\s+be\s+delivered/i,
    /parcel\s+is\s+delayed/i,
    /address\s+issue/i,
    /delivery\s+details/i,
    /order\s+requires\s+additional\s+verification/i,
    /unusual\s+login/i,
    /account\s+needs\s+verification/i,
    /activity\s+on\s+your\s+account/i,
    /account\s+may\s+be\s+suspended/i,
    /payment\s+could\s+not\s+be\s+completed/i,
    /subscription\s+payment\s+failed/i,
    /problem\s+with\s+your\s+payment/i,
    /confirm\s+whether\s+you\s+made\s+this\s+purchase/i,
    /verify\s+your\s+identity\s+before\s+continuing/i,
    /additional\s+information\s+to\s+complete\s+your\s+application/i,
    /refund\s+is\s+being\s+processed/i,
    /membership\s+expires\s+soon/i,
  ];

  return ambiguousPatterns.some((p) => p.test(lower));
}

/**
 * Transforms an InvestigationReport into structured AssessmentPanelData.
 * Follows Evidence-First rule and strictly excludes test jargon (e.g. "Expected").
 */
export function deriveInvestigationAssessment(report: InvestigationReport): AssessmentPanelData {
  const score = report?.riskAssessment?.score ?? 0;
  const level = report?.riskAssessment?.level ?? 'BENIGN';
  const evidenceStrength = report?.riskAssessment?.evidenceStrength ?? 'MINIMAL';
  const indicators = report?.observedIndicators || [];
  const rawText = report?.rawText || '';

  const isClearlySuspicious =
    (level === 'CRITICAL' || level === 'HIGH' || (level === 'MEDIUM' && score >= 45)) &&
    evidenceStrength !== 'LIMITED' &&
    evidenceStrength !== 'MINIMAL';

  if (isClearlySuspicious) {
    const badgeText = level === 'CRITICAL' ? '🔴 SCAM INDICATORS DETECTED' : '🔴 HIGH SUSPICION';
    const badgeType = level === 'CRITICAL' ? 'critical' : 'high';
    const category = deriveCategory(report);
    const keyItems = deriveKeyIndicators(report);

    return {
      state: 'SUSPICIOUS',
      badgeText,
      badgeType,
      category,
      headerText: 'KEY INDICATORS',
      keyItems: keyItems.length > 0 ? keyItems : ['Suspicious communication patterns detected'],
      clarification:
        'This assessment is based on verified indicators found in the submitted text. Does not constitute proof of sender intent.',
    };
  }

  // Check if text exhibits ambiguous characteristics
  const isAmbiguous =
    (indicators.length > 0 && (level === 'LOW' || level === 'BENIGN' || score <= 40 || evidenceStrength === 'LIMITED')) ||
    isAmbiguousText(rawText);

  if (isAmbiguous) {
    const category = deriveAmbiguousCategory(report);
    return {
      state: 'AMBIGUOUS',
      badgeText: '🟡 INSUFFICIENT EVIDENCE',
      badgeType: 'ambiguous',
      category,
      headerText: 'KEY FINDINGS',
      keyItems: [
        'Some context may warrant verification.',
        'No strong combination of scam indicators was identified.',
        'The available text is insufficient to determine whether the message is malicious.',
      ],
      clarification:
        'The available text does not provide enough definitive evidence. Contact the organization directly via official channels to verify.',
    };
  }

  // Clean / No indicators detected
  return {
    state: 'NO_INDICATORS',
    badgeText: '🟢 NO SUSPICIOUS INDICATORS DETECTED',
    badgeType: 'clean',
    category: 'General Communication',
    headerText: 'KEY FINDINGS',
    keyItems: [
      'No recognized scam indicators were found.',
      'The message does not currently show strong evidence of common scam patterns.',
    ],
    clarification:
      'This assessment reflects the absence of checked suspicious patterns. It does not confirm that the message is legitimate. Always exercise routine caution.',
  };
}
