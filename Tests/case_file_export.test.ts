import { describe, expect, it } from 'vitest';
import {
  buildCaseJson,
  buildReportHtml,
  generateInvestigationPdfBytes,
} from '../Frontend/src/utils/reportGenerator';
import type { InvestigationReport } from '../Frontend/src/types';

describe('Feature E — Advanced Investigation Case File & V3.1 Report Generator', () => {
  const mockReportV31: InvestigationReport = {
    id: 'rep_v31_case_test_01',
    timestamp: '2026-09-26T12:00:00.000Z',
    inputMeta: {
      characterCount: 95,
      wordCount: 16,
      messageType: 'sms',
    },
    rawText: 'U\u200Brgent: Chase Bank alert. Wire funds immediately to secure account.',
    observedIndicators: [
      {
        id: 'ind_urgency',
        category: 'URGENCY_PRESSURE',
        name: 'Urgency Pressure',
        severity: 'HIGH',
        evidence: 'Urgent:',
        characterRange: [0, 8],
        explanation: 'Creates false panic',
        whyItMatters: 'Forces rushed compliance',
        source: 'DETERMINISTIC',
      },
      {
        id: 'ind_impersonation',
        category: 'AUTHORITY_IMPERSONATION',
        name: 'Financial Institution Pretext',
        severity: 'HIGH',
        evidence: 'Chase Bank',
        characterRange: [9, 19],
        explanation: 'Bank pretext',
        whyItMatters: 'Fosters false trust',
        source: 'DETERMINISTIC',
      },
      {
        id: 'ind_coercion',
        category: 'FINANCIAL_COERCION',
        name: 'Wire Transfer Demand',
        severity: 'CRITICAL',
        evidence: 'Wire funds immediately',
        characterRange: [27, 50],
        explanation: 'Irreversible transaction',
        whyItMatters: 'Direct financial extraction',
        source: 'DETERMINISTIC',
      },
    ],
    aiContext: {
      mode: 'LOCAL_HEURISTIC',
      providerName: 'Local Heuristic Engine',
      scamArchetypes: ['Bank Impersonation Wire Fraud'],
      psychologicalTriggers: ['Fear', 'Urgency'],
      socialEngineeringTactics: 'Presents fraudulent bank notification demanding immediate wire transfer',
      ambiguityAssessment: 'High confidence scam pattern',
      unverifiedInferences: [],
    },
    riskAssessment: {
      score: 95,
      level: 'CRITICAL',
      evidenceStrength: 'COMPELLING',
      evidenceStrengthExplanation: 'Multiple critical financial coercion and authority cues',
      primaryCategories: ['FINANCIAL_COERCION', 'AUTHORITY_IMPERSONATION', 'URGENCY_PRESSURE'],
      scoringRationale: ['Wire demand', 'Bank pretext', 'Urgency pressure'],
      waterfall: {
        baseScore: 85,
        synergyScore: 10,
        rawTotalScore: 95,
        capAdjustment: 0,
        finalScore: 95,
        contributions: [
          {
            id: 'c1',
            label: 'Wire Transfer Demand',
            category: 'FINANCIAL_COERCION',
            points: 40,
            type: 'BASE_SEVERITY',
            explanation: 'Base severity',
          },
          {
            id: 'c2',
            label: 'Bank Pretext',
            category: 'AUTHORITY_IMPERSONATION',
            points: 25,
            type: 'BASE_SEVERITY',
            explanation: 'Base severity',
          },
          {
            id: 'c3',
            label: 'Urgency Pressure',
            category: 'URGENCY_PRESSURE',
            points: 20,
            type: 'BASE_SEVERITY',
            explanation: 'Base severity',
          },
        ],
      },
    },
    defensiveRecommendations: [
      {
        action: 'Do not send wire transfers or money under any circumstances',
        detail: 'Wire transfers are irreversible once processed.',
        priority: 1,
      },
      {
        action: 'Contact your bank directly via the official fraud department number',
        detail: 'Never use contact info inside the suspicious message.',
        priority: 2,
      },
    ],
    disclaimer: 'This investigation assessment is deterministic and educational only.',
    obfuscationAnalysis: {
      hasObfuscation: true,
      totalEvasionChars: 1,
      typesDetected: ['ZERO_WIDTH_CHAR'],
      diffTokens: [
        { text: 'U', isObfuscated: false },
        {
          text: '\u200B',
          isObfuscated: true,
          type: 'ZERO_WIDTH_CHAR',
          originalChars: '\u200B',
          decodedChars: '',
          unicodeHex: 'U+200B',
        },
        { text: 'rgent: Chase Bank alert. Wire funds immediately to secure account.', isObfuscated: false },
      ],
      summary: 'Detected 1 evasion characters (ZERO_WIDTH_CHAR)',
    },
    counterfactuals: {
      baselineScore: 95,
      primaryPivotFactor: 'Category: FINANCIAL_COERCION (-50 pts)',
      scenarios: [
        {
          scope: 'INDICATOR',
          targetIndicatorId: 'ind_coercion',
          removedIndicatorIds: ['ind_coercion'],
          counterfactualScore: 55,
          scoreDelta: 40,
          counterfactualLevel: 'MEDIUM',
          brokenSynergies: ['AUTHORITY_IMPERSONATION + FINANCIAL_COERCION'],
          explanation: 'Hypothetical removal of Wire Transfer Demand reduces score by 40 pts and severs synergy.',
        },
        {
          scope: 'CATEGORY',
          targetCategory: 'FINANCIAL_COERCION',
          removedIndicatorIds: ['ind_coercion'],
          counterfactualScore: 45,
          scoreDelta: 50,
          counterfactualLevel: 'MEDIUM',
          brokenSynergies: ['AUTHORITY_IMPERSONATION + FINANCIAL_COERCION'],
          explanation: 'Hypothetical removal of all FINANCIAL_COERCION indicators reduces score by 50 pts.',
        },
      ],
    },
    institutionVerification: {
      matched: true,
      institution: {
        id: 'inst_chase',
        organizationName: 'JPMorgan Chase & Co.',
        category: 'BANKING',
        jurisdiction: 'United States',
        officialPrimaryDomain: 'chase.com',
        officialLoginUrl: 'https://secure.chase.com',
        officialFraudHotline: '1-800-935-9935',
        officialFraudEmail: 'phishing@chase.com',
        safeVerificationGuidance: 'Call the official fraud hotline or visit chase.com directly.',
        verificationSource: {
          sourceUrl: 'https://www.chase.com/digital/resources/privacy-security',
          sourceType: 'OFFICIAL_FRAUD_PAGE',
          lastReviewedDate: '2026-09-20',
          registryVersion: '3.1.0',
        },
      },
      messageDiscrepancyNotes: [
        'Message demands wire transfer which Chase does not solicit via unsolicited SMS.',
      ],
      trustNotice: 'INDEPENDENTLY CURATED OFFICIAL INFORMATION - NOT OBSERVED IN SUSPICIOUS SUBMISSION',
    },
    victimResponse: {
      declaredState: 'SENT_MONEY',
      stateLabel: 'Sent Money or Transferred Funds',
      containmentUrgency: 'CRITICAL_CONTAINMENT',
      containmentSteps: [
        {
          stepNumber: 1,
          urgency: 'IMMEDIATE_ACTION',
          title: 'Initiate Urgent Wire Recall / Dispute',
          detail: 'Contact your financial institution wire fraud desk immediately and request wire cancellation or recall.',
          category: 'FINANCIAL',
        },
        {
          stepNumber: 2,
          urgency: 'IMMEDIATE_ACTION',
          title: 'Freeze Compromised Accounts',
          detail: 'Place a temporary security freeze on impacted accounts.',
          category: 'CONTAINMENT',
        },
      ],
      evidencePreservationGuide: 'Preserve transaction confirmation numbers, recipient routing numbers, and exact message timestamps.',
      reportingChannels: [
        {
          name: 'Sending Bank Wire Operations',
          channelType: 'BANK',
          sourceAttribution: 'Direct financial institution hotline',
        },
        {
          name: 'FBI Internet Crime Complaint Center (IC3)',
          channelType: 'LAW_ENFORCEMENT',
          jurisdiction: 'United States',
          sourceUrl: 'https://www.ic3.gov',
        },
      ],
    },
  };

  it('buildReportHtml includes all V3.1 sections when present', () => {
    const html = buildReportHtml(mockReportV31);

    // 1. The Attacker's Mask
    expect(html).toContain("The Attacker's Mask");
    expect(html).toContain('Structural Evasion Diff');
    expect(html).toContain('EVASION:');
    expect(html).toContain('U+200B');

    // 2. Counterfactual Risk Sensitivity
    expect(html).toContain('Counterfactual Risk Sensitivity Analysis');
    expect(html).toContain('Primary Pivot Factor:');
    expect(html).toContain('FINANCIAL_COERCION');
    expect(html).toContain('-40 pts');
    expect(html).toContain('-50 pts');
    expect(html).toContain('Severed Risk Synergies:');

    // 3. Safe Out-of-Band Verification Directory
    expect(html).toContain('Safe Out-of-Band Verification Directory');
    expect(html).toContain('JPMorgan Chase &amp; Co.');
    expect(html).toContain('chase.com');
    expect(html).toContain('1-800-935-9935');
    expect(html).toContain('Channel Discrepancy Warnings:');
    expect(html).toContain('Message demands wire transfer');

    // 4. Victim-State Incident Containment
    expect(html).toContain('Victim-State Incident Containment');
    expect(html).toContain('CRITICAL_CONTAINMENT');
    expect(html).toContain('Sent Money or Transferred Funds');
    expect(html).toContain('Initiate Urgent Wire Recall / Dispute');
    expect(html).toContain('FBI Internet Crime Complaint Center');

    // 5. Export Case JSON button in header
    expect(html).toContain('id="downloadCaseJsonBtn"');
    expect(html).toContain('Export Case JSON');
    expect(html).toContain('downloadCaseJson()');
  });

  it('buildReportHtml gracefully omits V3.1 sections when absent', () => {
    const minimalReport: InvestigationReport = {
      ...mockReportV31,
      obfuscationAnalysis: undefined,
      counterfactuals: undefined,
      institutionVerification: undefined,
      victimResponse: undefined,
    };

    const html = buildReportHtml(minimalReport);

    expect(html).not.toContain("The Attacker&#039;s Mask &bull; Structural Evasion Diff");
    expect(html).not.toContain('<div class="section-title" style="margin-top: 24px;">Counterfactual Risk Sensitivity Analysis</div>');
    expect(html).not.toContain('<div class="section-title" style="margin-top: 24px;">Safe Out-of-Band Verification Directory</div>');
    expect(html).not.toContain('Victim-State Incident Containment &bull;');
    // Still includes download buttons and base report
    expect(html).toContain('Download as PDF');
    expect(html).toContain('Export Case JSON');
    expect(html).toContain('Overall Risk Rating');
  });

  it('generateInvestigationPdfBytes produces valid PDF 1.4 with V3.1 sections', () => {
    const pdfBytes = generateInvestigationPdfBytes(mockReportV31);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    const pdfString = new TextDecoder('latin1').decode(pdfBytes);
    expect(pdfString.startsWith('%PDF-1.4')).toBe(true);
    expect(pdfString).toContain('%%EOF');

    // Check that V3.1 text was written into PDF streams
    expect(pdfString).toContain("THE ATTACKER'S MASK");
    expect(pdfString).toContain('COUNTERFACTUAL RISK SENSITIVITY');
    expect(pdfString).toContain('SAFE OUT-OF-BAND VERIFICATION');
    expect(pdfString).toContain('VICTIM-STATE INCIDENT CONTAINMENT');
    expect(pdfString).toContain('Initiate Urgent Wire Recall');
    expect(pdfString).toContain('Official Domain: chase.com');
  });

  it('buildCaseJson produces compliant schema 1.0.0 JSON without secrets', () => {
    const jsonStr = buildCaseJson(mockReportV31);
    expect(typeof jsonStr).toBe('string');

    const parsed = JSON.parse(jsonStr);
    expect(parsed.caseSchemaVersion).toBe('1.0.0');
    expect(parsed.caseId).toBe('rep_v31_case_test_01');
    expect(parsed.generatedAt).toBeDefined();
    expect(parsed.investigationTimestamp).toBe('2026-09-26T12:00:00.000Z');
    expect(parsed.riskAssessment.score).toBe(95);
    expect(parsed.riskAssessment.level).toBe('CRITICAL');
    expect(parsed.counterfactuals.scenarios.length).toBe(2);
    expect(parsed.obfuscationAnalysis.totalEvasionChars).toBe(1);
    expect(parsed.institutionVerification.institution.organizationName).toBe('JPMorgan Chase & Co.');
    expect(parsed.victimResponse.declaredState).toBe('SENT_MONEY');

    // Security check: ensure no secrets or environment leakage
    expect(jsonStr).not.toContain('sk-');
    expect(jsonStr).not.toContain('AI_STUDIO_API_KEY');
    expect(jsonStr).not.toContain('PASSWORD');
    expect(jsonStr).not.toContain('SECRET');
  });
});
