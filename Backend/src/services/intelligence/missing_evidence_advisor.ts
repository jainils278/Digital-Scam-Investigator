/**
 * Evidentiary Completeness & Missing Evidence Advisor
 * 
 * Deterministic advisor evaluating what Scamvera can establish, what it cannot,
 * and what additional corroborating evidence would materially improve the assessment.
 * 
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. Missing evidence MUST NOT alter the deterministic risk score (no additions or subtractions).
 * 2. Never implies "Missing evidence = safe".
 * 3. Analytical significance describes possible interpretive impact, never numerical score promises.
 * 4. Preserves zero-retention, privacy-safe, passive architecture without external network calls.
 */

import type {
  EvidentiaryCompletenessAssessment,
  MissingEvidenceItem,
  ObservedIndicator,
  UrlAnalysisSummary,
} from '../../types.js';

/**
 * Analyzes evidentiary completeness of submitted artifact.
 * Does NOT alter the deterministic risk assessment.
 */
export function assessEvidentiaryCompleteness(
  rawText: string,
  indicators: ObservedIndicator[],
  urlSummaries: UrlAnalysisSummary[] = []
): EvidentiaryCompletenessAssessment {
  const missingItems: MissingEvidenceItem[] = [];
  const establishedFacts: string[] = [];
  const unestablishedHypotheses: string[] = [];

  const textLength = rawText.trim().length;
  const hasUrls = urlSummaries.length > 0 || /https?:\/\//i.test(rawText);
  const hasFinancialClaim = indicators.some(
    (i) =>
      i.category === 'FINANCIAL_COERCION' ||
      i.id.startsWith('ind_imp_tx_alert') ||
      i.id.startsWith('ind_threat_compromise') ||
      i.id.startsWith('ind_fin_toll_debt') ||
      i.id.startsWith('ind_fin_fake_invoice')
  );
  const hasChannelDiversion = indicators.some((i) => i.category === 'CHANNEL_DIVERSION');
  const hasSenderHeader = /(?:from:|sent\s+from|received\s+from|envelope-from|return-path:)/i.test(rawText);

  // 1. Established Facts (What Scamvera CAN deterministically establish)
  if (indicators.length > 0) {
    establishedFacts.push(
      `Identified ${indicators.length} verified physical indicator${indicators.length > 1 ? 's' : ''} in the verbatim text.`
    );
  } else {
    establishedFacts.push('No recognized scam keywords, manipulation signatures, or high-risk patterns detected.');
  }

  if (hasUrls) {
    establishedFacts.push('Extracted external destination link(s) and evaluated structural domain properties.');
  } else {
    establishedFacts.push('Confirmed absence of external hyperlinks in submitted text.');
  }

  // 2. Unestablished Hypotheses (What Scamvera CANNOT establish from artifact alone)
  unestablishedHypotheses.push('The true cryptographic real-world identity of the sender cannot be verified without transport headers.');
  if (hasFinancialClaim) {
    unestablishedHypotheses.push('Whether an unauthorized account debit or security incident actually occurred on your real financial account.');
  }
  if (hasUrls) {
    unestablishedHypotheses.push('The backend server ownership, hosting registration history, or live page content behind destination links.');
  }

  // 3. Category Evaluation for Missing Evidence

  // Category: SENDER_IDENTITY
  if (!hasSenderHeader) {
    missingItems.push({
      id: 'MISSING_SENDER_IDENTITY',
      category: 'SENDER_IDENTITY',
      title: 'Cryptographic Sender Origin Verification',
      whatIsMissing: 'Cryptographic sender authentication signatures (DKIM / SPF) and raw transport-layer headers.',
      whyUnavailable: 'The submitted artifact contains message body text only, omitting mail transfer agent or telecom transport headers.',
      safeVerificationGuidance: 'If this was an email, inspect raw headers ("View Original" or "Show Headers") to check SPF/DKIM authentication. Never rely solely on the display name.',
      analyticalSignificance: 'Could materially verify whether the transmission originated from verified corporate mail servers or spoofed third-party infrastructure.',
    });
  }

  // Category: DESTINATION_INFRASTRUCTURE
  if (hasUrls) {
    missingItems.push({
      id: 'MISSING_DESTINATION_INFRASTRUCTURE',
      category: 'DESTINATION_INFRASTRUCTURE',
      title: 'Destination Domain Registration & Server History',
      whatIsMissing: 'Authoritative domain registration (WHOIS) age, registrar identity, and DNS host history.',
      whyUnavailable: 'Scamvera operates in passive mode to protect your privacy and does not execute active network lookups or live domain crawling.',
      safeVerificationGuidance: 'Do not click or load the link. If safe verification is required, look up the domain registration date using an isolated public WHOIS query.',
      analyticalSignificance: 'Could confirm whether the destination domain was newly registered for a short-lived campaign or is a long-standing authenticated domain.',
    });
  }

  // Category: TRANSACTION_AUDIT
  if (hasFinancialClaim) {
    missingItems.push({
      id: 'MISSING_TRANSACTION_AUDIT',
      category: 'TRANSACTION_AUDIT',
      title: 'Official Banking Ledger Record',
      whatIsMissing: 'Direct transaction confirmation from your financial institution or core-banking ledger.',
      whyUnavailable: 'Scamvera does not connect to private banking records or store personal financial credentials.',
      safeVerificationGuidance: 'Independently log in to your banking application directly (or call the number on your payment card) to verify if any pending charge exists.',
      analyticalSignificance: 'Could definitively establish whether an unauthorized transaction claim is authentic or an urgent manufactured pretext.',
    });
  }

  // Category: MESSAGE_CONTEXT
  if (textLength < 90) {
    missingItems.push({
      id: 'MISSING_MESSAGE_CONTEXT',
      category: 'MESSAGE_CONTEXT',
      title: 'Full Conversational Thread Context',
      whatIsMissing: 'Preceding communication thread history, previous messages, or inbound origin details.',
      whyUnavailable: 'The submitted text appears to be a truncated snippet or single isolated sentence.',
      safeVerificationGuidance: 'Review preceding messages in the communication chain to determine if you initiated the interaction or requested updates.',
      analyticalSignificance: 'Could clarify whether the message was an unprompted cold solicitation or a legitimate response to your own previous inquiry.',
    });
  }

  // Category: ORIGINAL_CHANNEL
  if (hasChannelDiversion) {
    missingItems.push({
      id: 'MISSING_ORIGINAL_CHANNEL',
      category: 'ORIGINAL_CHANNEL',
      title: 'Original Platform Audit Trail',
      whatIsMissing: 'Original platform account profile history, marketplace listing context, or internal communication logs.',
      whyUnavailable: 'The communication directs conversation away from the originating platform to third-party consumer messaging apps.',
      safeVerificationGuidance: 'Refuse to move conversations to WhatsApp, Telegram, or external channels. Keep all interaction on the monitored official platform.',
      analyticalSignificance: 'Could reveal whether the counterparty has already been flagged, reported, or banned by the official service provider.',
    });
  }

  // 4. Calculate Completeness Rating (Deterministic, does NOT change risk score)
  let completenessScore = 40; // baseline for body-only text
  if (hasSenderHeader) completenessScore += 25;
  if (textLength >= 150) completenessScore += 15;
  if (hasUrls) completenessScore += 10;
  if (!hasFinancialClaim || /ref(?:erence)?|ending\s+in/i.test(rawText)) completenessScore += 10;

  completenessScore = Math.min(100, Math.max(10, completenessScore));

  const completenessRating: 'HIGH' | 'MODERATE' | 'LOW' =
    completenessScore >= 75 ? 'HIGH' : completenessScore >= 45 ? 'MODERATE' : 'LOW';

  const advisoryNote =
    'Missing evidence reflects limitations of the submitted material, not proof of sender authenticity. Never treat missing evidence as proof that a communication is safe.';

  return {
    completenessScore,
    completenessRating,
    establishedFacts,
    unestablishedHypotheses,
    missingEvidenceItems: missingItems,
    advisoryNote,
  };
}
