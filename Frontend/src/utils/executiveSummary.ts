/**
 * Digital Scam Investigator - Executive Summary Utility
 * 
 * Implements the "Simple by Default, Deep by Choice" progressive disclosure
 * architecture for post-investigation reporting across Web UI, HTML reports, and PDF exports.
 * 
 * Guarantees that the on-screen Overview, downloadable HTML report, and downloadable PDF
 * all use identical synthesized executive guidance grounded in deterministic evidence.
 */

import type { InvestigationReport, IndicatorSeverity } from '../types';

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
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'BENIGN';
  plainEnglishSummary: string;
  strongestIndicators: ExecutiveIndicatorSummary[];
  doActions: string[];
  dontActions: string[];
  disclaimer: string;
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
  const { riskAssessment, observedIndicators, defensiveRecommendations, disclaimer } = report;
  const { score, level } = riskAssessment;

  // 1. One short plain-English explanation under the final score
  // Preserves existing assessment semantics without forbidden phrases ("100% scam", "guaranteed fraud", "safe", "definitely legitimate")
  let plainEnglishSummary = '';
  if (level === 'CRITICAL') {
    plainEnglishSummary = 'This message contains multiple severe indicators commonly associated with active fraud or credential theft attempts.';
  } else if (level === 'HIGH') {
    plainEnglishSummary = 'This message contains several warning indicators commonly associated with scam or deception attempts.';
  } else if (level === 'MEDIUM') {
    plainEnglishSummary = 'This message contains suspicious patterns that warrant caution and independent verification.';
  } else if (level === 'LOW') {
    plainEnglishSummary = 'Few suspicious patterns were identified, but vigilance is still advised for unverified contacts.';
  } else {
    plainEnglishSummary = 'No recognized suspicious scam indicators were detected in the submitted content.';
  }

  // 2. Strongest 3–5 verified indicators
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

  const strongestIndicators: ExecutiveIndicatorSummary[] = sortedIndicators.slice(0, 5).map((ind) => {
    const whyItMatters = getHumanWhyItMatters(
      ind.name,
      ind.category,
      ind.whyItMatters || ind.explanation
    );
    return {
      id: ind.id,
      name: ind.name,
      severity: ind.severity,
      whyItMatters,
      evidenceQuote: ind.evidence,
      evidenceSource: ind.evidenceSource,
    };
  });

  // 3. Actionable DOs
  const doActions: string[] = [];

  // Add specific recommendations from engine
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
      if (!isNegative) {
        if (!doActions.includes(act)) {
          doActions.push(act);
        }
      }
    }
  }

  // Ensure core essential protective DO actions
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

  // 4. Defensive DON'Ts
  const dontActions: string[] = [];

  // Add specific negative recommendations from engine
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
      if (isNegative) {
        if (!dontActions.includes(act)) {
          dontActions.push(act);
        }
      }
    }
  }

  // Ensure core defensive prohibitions
  const defaultDonts = [
    'Do not click suspicious links or open unrequested attachments.',
    'Do not share passwords, OTP codes, PINs, or sensitive personal information.',
    'Do not use phone numbers or contact details supplied by the suspicious message without independent verification.',
  ];

  for (const d of defaultDonts) {
    if (!dontActions.some((existing) => existing.toLowerCase().includes(d.slice(0, 20).toLowerCase()))) {
      dontActions.push(d);
    }
    if (dontActions.length >= 4) break;
  }

  // 5. Assessment Disclaimer
  const disclaimerText =
    disclaimer ||
    'Scamvera provides an automated assessment based on the evidence available in the submitted content. It is not proof of fraud. Verify important claims through trusted, independent channels.';

  return {
    riskScore: score,
    riskLevel: level,
    plainEnglishSummary,
    strongestIndicators,
    doActions: doActions.slice(0, 4),
    dontActions: dontActions.slice(0, 4),
    disclaimer: disclaimerText,
  };
}
