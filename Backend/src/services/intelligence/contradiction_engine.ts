/**
 * Deterministic Pretext Contradiction Matrix Engine
 * 
 * Evaluates observed indicators, URL evidence, and structural text properties
 * to detect incompatibilities between claimed sender pretexts and observed demands.
 * 
 * Classifications:
 * 1. CONTRADICTION: Strong documented incompatibility between claimed identity/pretext and observed evidence.
 * 2. ANOMALY: Suspicious, unusual, or inconsistent behavior not logically impossible but highly atypical.
 * 3. UNSUPPORTED_CLAIM: Critical assertion made without necessary verifiable artifact details.
 * 
 * Principle: Uses defensible institutional language ("inconsistent with expected official-channel pattern").
 * Never uses AI as authority, never makes external network calls.
 */

import type {
  ContradictionAnalysis,
  ContradictionClassification,
  ContradictionFinding,
  IndicatorSeverity,
  ObservedIndicator,
  UrlAnalysisSummary,
} from '../../types.js';
import { extractUrlIndicators } from '../url/url_analyzer.js';

interface ContradictionRule {
  ruleId: string;
  classification: ContradictionClassification;
  severity: IndicatorSeverity;
  evaluate: (
    indicators: ObservedIndicator[],
    urlSummaries: UrlAnalysisSummary[],
    rawText: string
  ) => ContradictionFinding | null;
}

const GENERIC_GREETING_PATTERN = /\b(?:dear|hello|hi|attention|valued|greetings)\s+(?:customer|user|client|member|account\s*holder|subscriber|taxpayer|citizen|recipient|sir[/\s]*madam|friend)\b/i;
const VERIFIED_TX_METADATA_PATTERN = /(?:(?:ending\s+in|card\s+ending)\s+\d{4}|\b(?:acct|card|account)\b[^\w\n]*\*{2,}\d{2,4}|ref(?:erence)?\s*(?:#|id|no|num)?[:.\s]+[a-z0-9-]{6,})/i;

const CONTRADICTION_RULES: ContradictionRule[] = [
  // 1. Government / Law Enforcement Authority + Retail Gift Cards
  {
    ruleId: 'CONTR_GOV_GIFTCARD',
    classification: 'CONTRADICTION',
    severity: 'CRITICAL',
    evaluate: (indicators) => {
      const govIndicator = indicators.find(
        (ind) =>
          ind.id.startsWith('ind_imp_authority') ||
          ind.id.startsWith('ind_threat_legal') ||
          /\b(?:irs|tax\s+department|law\s+enforcement|police|court|fbi|treasury)\b/i.test(ind.evidence)
      );
      const giftCardIndicator = indicators.find((ind) => ind.id.startsWith('ind_fin_gift_cards'));

      if (govIndicator && giftCardIndicator) {
        return {
          id: `contr_${govIndicator.id}_${giftCardIndicator.id}`,
          ruleId: 'CONTR_GOV_GIFTCARD',
          classification: 'CONTRADICTION',
          severity: 'CRITICAL',
          claimedPretext: 'Official Government / Tax / Law Enforcement Authority',
          conflictingEvidence: 'Demand for payment via untraceable retail consumer gift cards',
          sourceIndicatorIds: [govIndicator.id, giftCardIndicator.id],
          explanation:
            'This behavior is inconsistent with the expected official-channel pattern represented by the local rule. Official government and law enforcement bodies utilize statutory fiscal channels and do not accept retail consumer gift cards or voucher codes for settlements.',
          whyItMatters:
            'Retail gift cards are untraceable and non-refundable. Legitimate public authorities never collect payments or penalties through commercial gift cards.',
        };
      }
      return null;
    },
  },

  // 2. Bank / Financial Institution + Retail Gift Cards
  {
    ruleId: 'CONTR_BANK_GIFTCARD',
    classification: 'CONTRADICTION',
    severity: 'CRITICAL',
    evaluate: (indicators) => {
      const bankIndicator = indicators.find(
        (ind) =>
          ind.id.startsWith('ind_imp_bank') ||
          /\b(?:bank|wells\s*fargo|chase|citibank|bank\s*of\s*america|credit\s*union)\b/i.test(ind.evidence)
      );
      const giftCardIndicator = indicators.find((ind) => ind.id.startsWith('ind_fin_gift_cards'));

      if (bankIndicator && giftCardIndicator) {
        return {
          id: `contr_${bankIndicator.id}_${giftCardIndicator.id}`,
          ruleId: 'CONTR_BANK_GIFTCARD',
          classification: 'CONTRADICTION',
          severity: 'CRITICAL',
          claimedPretext: 'Financial Institution / Banking Provider',
          conflictingEvidence: 'Demand for payment or security deposit via retail gift cards',
          sourceIndicatorIds: [bankIndicator.id, giftCardIndicator.id],
          explanation:
            'This behavior is inconsistent with the expected official-channel pattern represented by the local rule. Regulated financial institutions resolve disputed charges or security holds through standard core-banking rails, not consumer retail gift cards.',
          whyItMatters:
            'Financial institutions operate on regulated electronic settlement networks and cannot accept or secure assets via retail shopping gift cards.',
        };
      }
      return null;
    },
  },

  // 3. Recognized Brand + Lookalike / Spoofed Domain
  {
    ruleId: 'CONTR_BRAND_LOOKALIKE_DOMAIN',
    classification: 'CONTRADICTION',
    severity: 'HIGH',
    evaluate: (indicators, urlSummaries, rawText) => {
      // Find institutional or brand impersonation pretext indicators
      const brandIndicator = indicators.find(
        (ind) =>
          ind.category === 'IMPERSONATION' ||
          ind.id.startsWith('ind_imp_') ||
          ind.id.startsWith('ind_fin_toll_debt')
      );

      // Find lookalike domain or deceptive link indicators
      const lookalikeIndicator = indicators.find(
        (ind) =>
          ind.category === 'SUSPICIOUS_LINK' ||
          ind.id.startsWith('ind_link_') ||
          ind.id.startsWith('ind_url_')
      );

      // Check for deceptive URL in provided summaries or extract from rawText
      const hasDeceptiveUrlSummary = urlSummaries.some(
        (u) =>
          u.reputationStatus === 'SUSPICIOUS' ||
          u.reputationStatus === 'MALICIOUS' ||
          u.riskScore >= 30 ||
          u.isBareIp
      );

      const hasDeceptiveExtracted =
        urlSummaries.length === 0 &&
        extractUrlIndicators(rawText).urlResults.some(
          (ur) =>
            ur.riskScore >= 30 ||
            ur.suspiciousFactors.some(
              (r) =>
                r.code === 'URL_BRAND_SPOOFING' ||
                r.code === 'URL_DECEPTIVE_HYPHENATION' ||
                r.code === 'URL_IP_ADDRESS'
            )
        );

      const hasDeceptiveUrl = hasDeceptiveUrlSummary || hasDeceptiveExtracted;

      if (brandIndicator && (lookalikeIndicator || hasDeceptiveUrl)) {
        const sourceIds = [brandIndicator.id];
        if (lookalikeIndicator && !sourceIds.includes(lookalikeIndicator.id)) {
          sourceIds.push(lookalikeIndicator.id);
        }

        return {
          id: `contr_${brandIndicator.id}_domain`,
          ruleId: 'CONTR_BRAND_LOOKALIKE_DOMAIN',
          classification: 'CONTRADICTION',
          severity: 'HIGH',
          claimedPretext: 'Recognized Brand / Service Provider Identity',
          conflictingEvidence: 'Action link directs to an unverified third-party or typosquatted destination domain',
          sourceIndicatorIds: sourceIds,
          explanation:
            'This behavior is inconsistent with the expected official-channel pattern represented by the local rule. Communication purports to represent an official organization, but directs user interaction to an unaffiliated or lookalike destination domain outside official brand infrastructure.',
          whyItMatters:
            'Authentic organizations transact customer actions exclusively through verified primary domain infrastructure, never lookalike or typosquatted domains.',
        };
      }
      return null;
    },
  },

  // 4. Support / Security Pretext + Off-Platform Channel Diversion
  {
    ruleId: 'ANOM_SUPPORT_CHANNEL_DIVERSION',
    classification: 'ANOMALY',
    severity: 'HIGH',
    evaluate: (indicators) => {
      const supportIndicator = indicators.find(
        (ind) =>
          ind.id.startsWith('ind_imp_authority_internal') ||
          ind.id.startsWith('ind_imp_bank') ||
          ind.id.startsWith('ind_lure_job') ||
          /\b(?:security\s*team|fraud\s*department|it\s*helpdesk|support\s*team|hr|recruiter)\b/i.test(ind.evidence)
      );
      const diversionIndicator = indicators.find((ind) => ind.id.startsWith('ind_div_channel'));

      if (supportIndicator && diversionIndicator) {
        return {
          id: `anom_${supportIndicator.id}_${diversionIndicator.id}`,
          ruleId: 'ANOM_SUPPORT_CHANNEL_DIVERSION',
          classification: 'ANOMALY',
          severity: 'HIGH',
          claimedPretext: 'Institutional Support / Security / HR Department',
          conflictingEvidence: 'Off-platform diversion to external messaging application',
          sourceIndicatorIds: [supportIndicator.id, diversionIndicator.id],
          explanation:
            'This behavior is inconsistent with the expected official-channel pattern represented by the local rule. Corporate support and security operations generally operate within authenticated internal ticketing or corporate telephone systems. Diverting communication to third-party consumer messaging applications is anomalous and inconsistent with enterprise support protocols.',
          whyItMatters:
            'Diverting communications away from enterprise channels circumvents organizational audit logging and caller verification.',
        };
      }
      return null;
    },
  },

  // 5. Urgent Account Suspension / Legal Sanction + Generic Greeting
  {
    ruleId: 'ANOM_URGENT_SUSPENSION_GENERIC_GREETING',
    classification: 'ANOMALY',
    severity: 'MEDIUM',
    evaluate: (indicators, _urlSummaries, rawText) => {
      const urgencyOrThreatIndicator = indicators.find(
        (ind) =>
          ind.id.startsWith('ind_threat_suspension') ||
          ind.id.startsWith('ind_threat_legal') ||
          ind.id.startsWith('ind_urg_consequence')
      );

      const hasGenericGreeting = GENERIC_GREETING_PATTERN.test(rawText);

      if (urgencyOrThreatIndicator && hasGenericGreeting) {
        return {
          id: `anom_${urgencyOrThreatIndicator.id}_generic_greeting`,
          ruleId: 'ANOM_URGENT_SUSPENSION_GENERIC_GREETING',
          classification: 'ANOMALY',
          severity: 'MEDIUM',
          claimedPretext: 'Specific Targeted Account Suspension / Sanction',
          conflictingEvidence: 'Impersonal generic greeting lacking recipient customer identity',
          sourceIndicatorIds: [urgencyOrThreatIndicator.id],
          explanation:
            'This behavior is inconsistent with the expected official-channel pattern represented by the local rule. Urgent account suspension notices typically correlate with specific customer account records. Combining severe account-level sanctions with an unpersonalized, generic greeting is inconsistent with authenticated institutional alerts.',
          whyItMatters:
            'Broad generic greetings in messages threatening immediate termination indicate automated bulk distribution rather than an account-specific administrative action.',
        };
      }
      return null;
    },
  },

  // 6. Unsupported Transaction or Security Alert Claim
  {
    ruleId: 'UNSUPP_TRANSACTION_ALERT_CLAIM',
    classification: 'UNSUPPORTED_CLAIM',
    severity: 'MEDIUM',
    evaluate: (indicators, _urlSummaries, rawText) => {
      const txClaimIndicator = indicators.find(
        (ind) =>
          ind.id.startsWith('ind_imp_tx_alert') ||
          ind.id.startsWith('ind_threat_compromise') ||
          ind.id.startsWith('ind_fin_fake_invoice')
      );

      if (txClaimIndicator) {
        const hasVerifiedTxMetadata = VERIFIED_TX_METADATA_PATTERN.test(rawText);
        // If the message claims an unauthorized transaction or breach but provides zero specific transaction reference or card masking
        if (!hasVerifiedTxMetadata) {
          return {
            id: `unsupp_${txClaimIndicator.id}_no_metadata`,
            ruleId: 'UNSUPP_TRANSACTION_ALERT_CLAIM',
            classification: 'UNSUPPORTED_CLAIM',
            severity: 'MEDIUM',
            claimedPretext: 'Unauthorized Financial Debit / Transaction Claim',
            conflictingEvidence: 'Absence of verifiable transaction identifiers or masked account numbers',
            sourceIndicatorIds: [txClaimIndicator.id],
            explanation:
              'This behavior is inconsistent with the expected official-channel pattern represented by the local rule. The communication asserts that an unauthorized charge or security breach occurred on your account, but supplies no verifiable reference details (such as account masking or merchant transaction identifiers).',
            whyItMatters:
              'Fraudulent alerts rely on vague references to unauthorized charges to spark panic without disclosing that the sender has no access to the recipient\'s real banking records.',
          };
        }
      }
      return null;
    },
  },
];

/**
 * Evaluates observed indicators and evidence against the Pretext Contradiction Matrix.
 * Returns structured contradictions, anomalies, and unsupported claims.
 */
export function analyzeContradictions(
  indicators: ObservedIndicator[],
  urlSummaries: UrlAnalysisSummary[] = [],
  rawText: string = ''
): ContradictionAnalysis {
  // If no indicators exist, message is benign/empty: no contradictions
  if (!indicators || indicators.length === 0) {
    return {
      hasContradictions: false,
      totalFindings: 0,
      contradictionsCount: 0,
      anomaliesCount: 0,
      unsupportedClaimsCount: 0,
      findings: [],
      summary: 'No contradictions or pretext anomalies detected in verified evidence.',
    };
  }

  const findings: ContradictionFinding[] = [];

  for (const rule of CONTRADICTION_RULES) {
    const finding = rule.evaluate(indicators, urlSummaries, rawText);
    if (finding) {
      findings.push(finding);
    }
  }

  const contradictionsCount = findings.filter((f) => f.classification === 'CONTRADICTION').length;
  const anomaliesCount = findings.filter((f) => f.classification === 'ANOMALY').length;
  const unsupportedClaimsCount = findings.filter((f) => f.classification === 'UNSUPPORTED_CLAIM').length;

  let summary = 'No contradictions or pretext anomalies detected in verified evidence.';
  if (findings.length > 0) {
    const parts: string[] = [];
    if (contradictionsCount > 0) {
      parts.push(`${contradictionsCount} direct contradiction${contradictionsCount > 1 ? 's' : ''}`);
    }
    if (anomaliesCount > 0) {
      parts.push(`${anomaliesCount} operational anomal${anomaliesCount > 1 ? 'ies' : 'y'}`);
    }
    if (unsupportedClaimsCount > 0) {
      parts.push(`${unsupportedClaimsCount} unsupported claim${unsupportedClaimsCount > 1 ? 's' : ''}`);
    }
    summary = `Identified ${parts.join(', ')} between claimed identity and observed indicators.`;
  }

  return {
    hasContradictions: findings.length > 0,
    totalFindings: findings.length,
    contradictionsCount,
    anomaliesCount,
    unsupportedClaimsCount,
    findings,
    summary,
  };
}
