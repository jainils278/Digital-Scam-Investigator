import { describe, expect, it } from 'vitest';
import { buildReportHtml, generateInvestigationPdfBytes } from '../Frontend/src/utils/reportGenerator';
import type { InvestigationReport } from '../Frontend/src/types';

describe('Phase 8 — Downloadable Investigation Report (V3.0 Extended)', () => {
  const mockReport: InvestigationReport = {
    id: 'rep_v3_test_01',
    timestamp: '2026-09-25T12:00:00.000Z',
    inputMeta: {
      characterCount: 120,
      wordCount: 22,
      messageType: 'sms',
    },
    rawText: 'Urgent: Your account is suspended. Buy $500 gift card to restore.',
    observedIndicators: [
      {
        id: 'ind_test_1',
        category: 'URGENCY_PRESSURE',
        name: 'Urgency Pressure',
        severity: 'HIGH',
        evidence: 'Urgent: Your account is suspended',
        characterRange: [0, 33],
        explanation: 'Creates false panic',
        whyItMatters: 'Forces rushed compliance',
        source: 'DETERMINISTIC',
      },
      {
        id: 'ind_test_2',
        category: 'FINANCIAL_COERCION',
        name: 'Gift Card Demand',
        severity: 'CRITICAL',
        evidence: 'Buy $500 gift card',
        characterRange: [35, 53],
        explanation: 'Irreversible payment method',
        whyItMatters: 'Non-recoverable funds',
        source: 'DETERMINISTIC',
      },
    ],
    aiContext: {
      mode: 'LOCAL_HEURISTIC',
      providerName: 'Local Heuristic Engine',
      scamArchetypes: ['Urgent Account Suspension'],
      psychologicalTriggers: ['Panic', 'Coercion'],
      socialEngineeringTactics: 'Leverages artificial crisis with untraceable payment demand',
      ambiguityAssessment: 'Clear predatory pattern',
      unverifiedInferences: [],
    },
    riskAssessment: {
      score: 75,
      level: 'HIGH',
      evidenceStrength: 'SUBSTANTIAL',
      evidenceStrengthExplanation: 'Multiple high severity cues',
      primaryCategories: ['URGENCY_PRESSURE', 'FINANCIAL_COERCION'],
      scoringRationale: ['Urgency demand', 'Gift card vector'],
      waterfall: {
        baseScore: 65,
        synergyScore: 10,
        rawTotalScore: 75,
        capAdjustment: 0,
        finalScore: 75,
        contributions: [
          {
            id: 'contrib_1',
            label: 'Gift Card Demand (CRITICAL)',
            category: 'FINANCIAL_COERCION',
            points: 40,
            type: 'BASE_SEVERITY',
            explanation: 'Base severity weight',
          },
          {
            id: 'contrib_2',
            label: 'Urgency Pressure (HIGH)',
            category: 'URGENCY_PRESSURE',
            points: 25,
            type: 'BASE_SEVERITY',
            explanation: 'Base severity weight',
          },
          {
            id: 'contrib_syn_1',
            label: 'Urgency + Financial Coercion',
            category: 'COMPOUND_SYNERGY',
            points: 10,
            type: 'COMPOUND_SYNERGY',
            explanation: 'Compound multi-vector penalty',
          },
        ],
      },
      isNonProbabilisticNotice: 'Deterministic rule calculation',
    },
    defensiveRecommendations: [
      {
        id: 'act_1',
        priority: 'IMMEDIATE',
        action: 'Do not send gift cards',
        detail: 'Legitimate entities never require payment via gift card',
        category: 'FINANCIAL',
      },
    ],
    disclaimer: 'Advisory analysis only.',
    evidenceIntelligence: {
      graph: { nodes: [], edges: [] },
      timeline: [
        {
          stepIndex: 1,
          stage: 'PRESSURE',
          stageLabel: 'Stage 3: Pressure / Urgency',
          observedOrInferred: 'OBSERVED',
          title: 'Psychological Coercion (Urgency Pressure)',
          description: 'Urgency was introduced to bypass calm consideration.',
          evidenceQuote: 'Urgent: Your account is suspended',
        },
        {
          stepIndex: 2,
          stage: 'POTENTIAL_IMPACT',
          stageLabel: 'Stage 6: Potential Impact',
          observedOrInferred: 'PROJECTED_CONSEQUENCE',
          title: 'Potential Consequence: Irreversible Financial Loss',
          description: 'Potential consequence: irreversible financial loss if gift card codes are surrendered.',
        },
      ],
      mitigatingFactors: [],
      uncertaintyLevel: 'LOW',
      evidenceSynthesis: 'High probability malicious pattern.',
    },
    tactics: {
      tacticCount: 1,
      summary: '1 manipulative tactic pattern identified.',
      allTactics: [
        {
          id: 'tac_fear_consequence',
          name: 'Fear & Consequence Coercion',
          category: 'URGENCY_PRESSURE',
          severity: 'HIGH',
          constituentIndicatorIds: ['ind_test_1'],
          targetedVulnerability: 'Loss Aversion & Panic',
          patternDescription: 'Combines urgent demand with threat of service disruption.',
          explanation: 'Manufactures fear to accelerate compliance before verification.',
          spottingTip: 'Pause and verify through official contact details.',
        },
      ],
    },
    contradictions: {
      hasContradictions: true,
      totalFindings: 1,
      contradictionsCount: 1,
      anomaliesCount: 0,
      unsupportedClaimsCount: 0,
      summary: '1 critical institutional contradiction detected.',
      findings: [
        {
          id: 'contra_1',
          ruleId: 'RULE_GOV_GIFT_CARD',
          classification: 'CONTRADICTION',
          severity: 'CRITICAL',
          claimedPretext: 'Account Services',
          conflictingEvidence: 'Gift Card Payment Demand',
          sourceIndicatorIds: ['ind_test_1', 'ind_test_2'],
          explanation: 'Official services do not demand payment via retail gift cards.',
          whyItMatters: 'Retail gift cards are untraceable and cannot be refunded.',
        },
      ],
    },
    missingEvidence: {
      completenessScore: 50,
      completenessRating: 'MODERATE',
      establishedFacts: ['Urgency phrase detected', 'Gift card vector detected'],
      unestablishedHypotheses: ['Actual account ownership'],
      advisoryNote: 'Missing evidence reflects input limitations, not safety.',
      missingEvidenceItems: [
        {
          id: 'miss_1',
          category: 'SENDER_IDENTITY',
          title: 'Sender Authentication Missing',
          whatIsMissing: 'Cryptographic or verified sender identity header.',
          whyUnavailable: 'Only plain SMS text was submitted.',
          safeVerificationGuidance: 'Check official portal directly without using provided links.',
          analyticalSignificance: 'Could confirm if sender is authorized official representative.',
        },
      ],
    },
  };

  it('renders all 5 V3.0 explainable intelligence sections into downloadable HTML', () => {
    const html = buildReportHtml(mockReport);

    // 1. Risk Waterfall
    expect(html).toContain('Explainable Risk Waterfall Breakdown');
    expect(html).toContain('Base Contributing Factors:');
    expect(html).toContain('+65 pts');
    expect(html).toContain('Compound Risk Synergies:');
    expect(html).toContain('+10 pts');
    expect(html).toContain('Total Raw Points:');
    expect(html).toContain('75 pts');
    expect(html).toContain('Final Deterministic Score:');

    // 2. 6-Stage Attack Chain
    expect(html).toContain('6-Stage Scam Attack Chain Progression');
    expect(html).toContain('Stage 3: Pressure / Urgency');
    expect(html).toContain('OBSERVED');
    expect(html).toContain('Stage 6: Potential Impact');
    expect(html).toContain('POTENTIAL CONSEQUENCE');
    expect(html).toContain('Potential Consequence: Irreversible Financial Loss');

    // 3. Pretext Contradiction Matrix
    expect(html).toContain('Pretext Contradiction Matrix');
    expect(html).toContain('CONTRADICTION');
    expect(html).toContain('Official services do not demand payment via retail gift cards.');
    expect(html).toContain('Retail gift cards are untraceable and cannot be refunded.');

    // 4. Psychological Tactic Fingerprinting
    expect(html).toContain('Psychological Tactic Fingerprinting');
    expect(html).toContain('Fear &amp; Consequence Coercion');
    expect(html).toContain('Loss Aversion &amp; Panic');
    expect(html).toContain('Pause and verify through official contact details.');

    // 5. Missing Evidence Advisor
    expect(html).toContain('Missing Evidence &amp; Evidentiary Completeness Advisor');
    expect(html).toContain('Sender Authentication Missing');
    expect(html).toContain('Cryptographic or verified sender identity header.');
    expect(html).toContain('Check official portal directly without using provided links.');
    expect(html).toContain('Missing evidence reflects input limitations, not safety.');
  });

  it('handles URL and Screenshot investigations seamlessly', () => {
    const urlReport: InvestigationReport = {
      ...mockReport,
      urlAnalysis: [
        {
          url: 'https://pay-security-update.com/login',
          domain: 'pay-security-update.com',
          hostname: 'pay-security-update.com',
          isBareIp: false,
          isShortener: false,
          isPunycode: false,
          hasHomoglyph: false,
          tld: 'com',
          riskScore: 85,
          suspiciousFactorsCount: 3,
        },
      ],
    };

    const urlHtml = buildReportHtml(urlReport);
    expect(urlHtml).toContain('DIRECT URL INVESTIGATION');
    expect(urlHtml).toContain('Passive URL Structural Analysis');
    expect(urlHtml).toContain('pay-security-update.com');

    const screenshotReport: InvestigationReport = {
      ...mockReport,
      screenshotMeta: {
        filename: 'fake_invoice.png',
        mimeType: 'image/png',
        byteSize: 1048576,
        ocrConfidence: 94,
        extractedCharacterCount: 150,
        extractedTextPreview: 'Preview',
      },
    };

    const ssHtml = buildReportHtml(screenshotReport);
    expect(ssHtml).toContain('SCREENSHOT / OCR INVESTIGATION');
    expect(ssHtml).toContain('fake_invoice.png');
    expect(ssHtml).toContain('OCR Confidence: <strong>94%</strong>');
  });

  it('renders "Download as PDF" button with true client-side handler and eliminates print dialog', () => {
    const html = buildReportHtml(mockReport);
    expect(html).toContain('Download as PDF');
    expect(html).toContain('id="downloadPdfBtn"');
    expect(html).toContain('downloadInvestigationPdf()');
    expect(html).not.toContain('Print / Save as PDF');
    expect(html).not.toContain('window.print()');
    expect(html).toContain('id="scamvera-report-data"');
  });

  it('generates a valid, self-contained PDF 1.4 binary containing all core sections', () => {
    const pdfBytes = generateInvestigationPdfBytes(mockReport);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    const pdfString = new TextDecoder('latin1').decode(pdfBytes);
    // Valid PDF header and EOF trailer
    expect(pdfString.startsWith('%PDF-1.4')).toBe(true);
    expect(pdfString).toContain('%%EOF');

    // Key V3.0 content preserved in generated PDF stream
    expect(pdfString).toContain('DIGITAL SCAM INVESTIGATOR - OFFICIAL AUDIT REPORT');
    expect(pdfString).toContain('OVERALL RISK RATING: 75 / 100');
    expect(pdfString).toContain('EXPLAINABLE RISK WATERFALL BREAKDOWN');
    expect(pdfString).toContain('6-STAGE SCAM ATTACK CHAIN PROGRESSION');
    expect(pdfString).toContain('PRETEXT CONTRADICTION MATRIX');
    expect(pdfString).toContain('PSYCHOLOGICAL TACTIC FINGERPRINTING');
    expect(pdfString).toContain('MISSING EVIDENCE & EVIDENTIARY COMPLETENESS ADVISOR');
  });
});

