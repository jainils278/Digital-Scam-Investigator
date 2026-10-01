/**
 * Digital Scam Investigator - Executive Summary Utility
 * 
 * Implements the "Simple by Default, Deep by Choice" progressive disclosure
 * architecture for post-investigation reporting across Web UI, HTML reports, and PDF exports.
 * 
 * Guarantees that the on-screen Overview, downloadable HTML report, and downloadable PDF
 * all use identical synthesized executive guidance grounded in deterministic evidence.
 */

import type { InvestigationReport, IndicatorSeverity, RiskLevel } from '../types';

export interface ExecutiveIndicatorSummary {
  id: string;
  name: string;
  severity: IndicatorSeverity;
  whyItMatters: string;
  evidenceQuote?: string;
  evidenceSource?: 'TEXT' | 'URL' | 'IMAGE_OCR';
}

export interface ExecutiveSummaryData {
  riskScore: number;
  riskLevel: RiskLevel;
  verdictTitle: string;
  verdictDirectAction: string;
  plainEnglishSummary: string;
  strongestIndicators: ExecutiveIndicatorSummary[];
  immediateActions: string[];
  doActions: string[];
  dontActions: string[];
  disclaimer: string;
  urlDisclaimer?: string;
}

/**
 * Standard plain-English human explanation of why common indicator categories matter.
 */
function getHumanWhyItMatters(name: string, category: string, fallback: string): string {
  const lower = `${name} ${category}`.toLowerCase();

  if (lower.includes('urgency') || lower.includes('pressure') || lower.includes('deadline')) {
    return 'The message pressures you to act immediately, which can reduce the chance that you independently verify the request.';
  }
  if (lower.includes('credential') || lower.includes('password') || lower.includes('otp') || lower.includes('login')) {
    return 'The message asks for sensitive account credentials, verification codes, or passwords.';
  }
  if (lower.includes('gift card') || lower.includes('crypto') || lower.includes('wire') || lower.includes('financial') || lower.includes('fee')) {
    return 'The message demands non-standard, rapid, or untraceable payment methods that cannot be refunded.';
  }
  if (lower.includes('link') || lower.includes('url') || lower.includes('domain') || lower.includes('punycode') || lower.includes('shortener')) {
    return 'The link directs to an unverified web destination that may impersonate an official service.';
  }
  if (lower.includes('impersonat') || lower.includes('brand') || lower.includes('authority') || lower.includes('bank')) {
    return 'The sender claims to represent a recognized organization without verifiable cryptographic or sender authentication.';
  }
  if (lower.includes('lottery') || lower.includes('prize') || lower.includes('reward')) {
    return 'The message promises an unexpected reward or prize to entice compliance before critical evaluation.';
  }
  if (lower.includes('threat') || lower.includes('legal') || lower.includes('arrest') || lower.includes('suspend')) {
    return 'The message employs coercive warnings of legal action, account suspension, or financial loss to compel action.';
  }

  return fallback || 'This indicator is commonly observed in deceptive social engineering attempts.';
}

/**
 * Derives the single source of truth executive summary data for an InvestigationReport.
 */
export function deriveExecutiveSummary(report: InvestigationReport): ExecutiveSummaryData {
  const { riskAssessment, observedIndicators, defensiveRecommendations, disclaimer, institutionVerification, urlAnalysis } = report;
  const { score, level } = riskAssessment;

  // 1. Verdict Title & Direct Immediate Action
  let verdictTitle = '';
  let verdictDirectAction = '';

  if (level === 'CRITICAL') {
    verdictTitle = 'CRITICAL RISK';
    verdictDirectAction = 'Do not click, reply, call, pay, or share codes.';
  } else if (level === 'HIGH') {
    verdictTitle = 'HIGH RISK';
    verdictDirectAction = 'Do not click, reply, call, pay, or share codes.';
  } else if (level === 'MEDIUM') {
    verdictTitle = 'SUSPICIOUS / MEDIUM RISK';
    verdictDirectAction = 'Exercise caution. Verify directly before replying, clicking, or paying.';
  } else if (level === 'LOW') {
    verdictTitle = 'LOW RISK';
    verdictDirectAction = 'Exercise routine caution. Verify unverified contacts through official channels.';
  } else if (level === 'INSUFFICIENT_EVIDENCE') {
    verdictTitle = 'INSUFFICIENT EVIDENCE';
    verdictDirectAction = 'Context is incomplete. Do not provide sensitive information without verification.';
  } else {
    verdictTitle = 'NO KNOWN SCAM INDICATORS DETECTED';
    verdictDirectAction = 'No known scam patterns detected. Exercise routine caution and verify unexpected requests through trusted official channels.';
  }

  // 2. One short plain-English explanation under the final score
  let plainEnglishSummary = '';
  const isUrlOnly = (urlAnalysis && urlAnalysis.length > 0) && (!observedIndicators || observedIndicators.length === 0);

  if (level === 'CRITICAL') {
    plainEnglishSummary = 'This message contains severe, high-confidence indicators commonly associated with active fraud, impersonation, or credential theft.';
  } else if (level === 'HIGH') {
    plainEnglishSummary = 'This message contains multiple warning indicators commonly associated with scam, impersonation, or financial extraction attempts.';
  } else if (level === 'MEDIUM') {
    plainEnglishSummary = 'This message contains suspicious patterns that warrant caution and independent verification before any response.';
  } else if (level === 'LOW') {
    plainEnglishSummary = 'Few suspicious patterns were identified, but vigilance is still advised for unverified senders or unexpected notices.';
  } else if (isUrlOnly) {
    plainEnglishSummary = 'ScamVera did not load or execute the destination page. This result is based on structural analysis of the submitted URL. Live page content, ownership history, and sender identity were not verified.';
  } else {
    plainEnglishSummary = 'No known scam indicators detected. This does not verify that the sender, website, or message is legitimate.';
  }

  // 3. Strongest 3–5 verified indicators
  const severityWeight: Record<IndicatorSeverity, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const sortedIndicators = [...(observedIndicators || [])].sort((a, b) => {
    const diff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
    if (diff !== 0) return diff;
    return (b.evidence?.length || 0) - (a.evidence?.length || 0);
  });

  const strongestIndicators: ExecutiveIndicatorSummary[] = [];

  // If institution domain mismatch was detected, place as highest-priority evidence card
  if (
    institutionVerification?.matched &&
    Array.isArray(institutionVerification.messageDiscrepancyNotes) &&
    institutionVerification.messageDiscrepancyNotes.length > 0
  ) {
    strongestIndicators.push({
      id: 'ind_inst_domain_mismatch',
      name: 'Official Domain Mismatch Detected',
      severity: 'CRITICAL',
      whyItMatters: `The destination link does not match the official primary domain of ${institutionVerification.institution?.organizationName || institutionVerification.claimedPretext}.`,
      evidenceQuote: institutionVerification.messageDiscrepancyNotes[0],
      evidenceSource: 'URL',
    });
  }

  for (const ind of sortedIndicators) {
    if (strongestIndicators.length >= 5) break;
    // Prevent duplicate name
    if (strongestIndicators.some((existing) => existing.name === ind.name)) continue;

    const whyItMatters = getHumanWhyItMatters(
      ind.name,
      ind.category,
      ind.whyItMatters || ind.explanation
    );
    strongestIndicators.push({
      id: ind.id,
      name: ind.name,
      severity: ind.severity,
      whyItMatters,
      evidenceQuote: ind.evidence,
      evidenceSource: ind.evidenceSource,
    });
  }

  // 4. Max 3 immediate actions first
  const immediateActions: string[] = [
    'Do not interact with the message, link, or sender.',
    'Open the organization\'s official app or manually typed website directly.',
  ];

  const hasHighRiskFinancialOrAuth =
    score >= 70 ||
    level === 'CRITICAL' ||
    level === 'HIGH' ||
    (observedIndicators &&
      observedIndicators.some((i) =>
        /(?:otp|pin|password|card|payment|transfer|bank|gift\s*card)/i.test(i.name + ' ' + i.evidence)
      ));

  if (hasHighRiskFinancialOrAuth) {
    immediateActions.push(
      'If credentials, OTPs, or payment information were already shared, immediately contact your financial institution or service provider to freeze affected accounts.'
    );
  } else {
    immediateActions.push(
      'Verify unexpected communications through an independently obtained official phone number or email before complying.'
    );
  }

  // 5. Actionable DOs & DON'Ts for detailed section
  const doActions: string[] = [];
  if (defensiveRecommendations && defensiveRecommendations.length > 0) {
    for (const rec of defensiveRecommendations) {
      const act = rec.action.trim();
      const lower = act.toLowerCase();
      const isNegative =
        lower.startsWith('do not') ||
        lower.startsWith("don't") ||
        lower.startsWith('never') ||
        lower.startsWith('refuse') ||
        lower.startsWith('halt') ||
        lower.includes('avoid');
      if (!isNegative && !doActions.includes(act)) {
        doActions.push(act);
      }
    }
  }

  const defaultDos = [
    'Verify the claim using the organization\'s official website or app.',
    'Contact the organization through an independently obtained contact method.',
    'Report or block the message using your device or carrier messaging tools.',
  ];
  for (const d of defaultDos) {
    if (!doActions.some((existing) => existing.toLowerCase().includes(d.slice(0, 20).toLowerCase()))) {
      doActions.push(d);
    }
    if (doActions.length >= 4) break;
  }

  const dontActions: string[] = [];
  if (defensiveRecommendations && defensiveRecommendations.length > 0) {
    for (const rec of defensiveRecommendations) {
      const act = rec.action.trim();
      const lower = act.toLowerCase();
      const isNegative =
        lower.startsWith('do not') ||
        lower.startsWith("don't") ||
        lower.startsWith('never') ||
        lower.startsWith('refuse') ||
        lower.startsWith('halt') ||
        lower.includes('avoid');
      if (isNegative && !dontActions.includes(act)) {
        dontActions.push(act);
      }
    }
  }

  const defaultDonts = [
    'Do not click suspicious links or open unrequested attachments.',
    'Do not share passwords, OTP codes, PINs, or sensitive personal information.',
    'Do not use phone numbers or contact details supplied by the suspicious message.',
  ];
  for (const d of defaultDonts) {
    if (!dontActions.some((existing) => existing.toLowerCase().includes(d.slice(0, 20).toLowerCase()))) {
      dontActions.push(d);
    }
    if (dontActions.length >= 4) break;
  }

  const disclaimerText =
    disclaimer ||
    'Scamvera provides an automated assessment based on the evidence available in the submitted content. It is an algorithmic risk assessment, not definitive proof of sender identity, guilt, or innocence. Always verify high-stakes claims, payments, and account notices through known, trusted official channels.';

  const urlDisclaimer =
    urlAnalysis && urlAnalysis.length > 0
      ? 'ScamVera did not load or execute the destination page. This result is based on the submitted URL and message context.'
      : undefined;

  return {
    riskScore: score,
    riskLevel: level,
    verdictTitle,
    verdictDirectAction,
    plainEnglishSummary,
    strongestIndicators,
    immediateActions,
    doActions: doActions.slice(0, 4),
    dontActions: dontActions.slice(0, 4),
    disclaimer: disclaimerText,
    urlDisclaimer,
  };
}
