import { describe, expect, it } from 'vitest';
import {
  analyzeEvidenceIntelligence,
  buildEvidenceGraph,
  buildInvestigationTimeline,
  identifyMitigatingFactors,
} from '../Backend/src/services/intelligence/evidence_graph.js';
import { ObservedIndicator, UrlAnalysisSummary } from '../Backend/src/types.js';

describe('Phase 4 — Evidence Intelligence & Graph Engine', () => {
  const sampleIndicators: ObservedIndicator[] = [
    {
      id: 'ind_urg_1',
      category: 'URGENCY_PRESSURE',
      name: 'Artificial Urgency Deadline',
      severity: 'HIGH',
      evidence: 'within 24 hours or your account will be suspended',
      characterRange: [10, 58],
      explanation: 'Deadline pressure',
      whyItMatters: 'Panic trigger',
      source: 'DETERMINISTIC',
    },
    {
      id: 'ind_threat_1',
      category: 'ACCOUNT_THREAT',
      name: 'Account Suspension Threat',
      severity: 'HIGH',
      evidence: 'your account will be suspended',
      characterRange: [28, 58],
      explanation: 'Account lockout threat',
      whyItMatters: 'Loss of access fear',
      source: 'DETERMINISTIC',
    },
    {
      id: 'ind_cred_1',
      category: 'CREDENTIAL_HARVESTING',
      name: 'Direct OTP Request',
      severity: 'CRITICAL',
      evidence: 'reply with your OTP passcode',
      characterRange: [60, 88],
      explanation: 'Demands 2FA code',
      whyItMatters: 'Session takeover',
      source: 'DETERMINISTIC',
    },
  ];

  const sampleUrls: UrlAnalysisSummary[] = [
    {
      url: 'https://chase-security-login.xyz/verify',
      domain: 'chase-security-login.xyz',
      hostname: 'chase-security-login.xyz',
      isBareIp: false,
      isShortener: false,
      isPunycode: false,
      hasHomoglyph: false,
      tld: 'xyz',
      riskScore: 75,
      suspiciousFactorsCount: 2,
      reputationStatus: 'SUSPICIOUS',
      reputationSource: 'Local Threat DB',
    },
  ];

  describe('Evidence Graph Construction', () => {
    it('creates structured graph nodes for artifact, indicators, URLs, domains, and reputations', () => {
      const graph = buildEvidenceGraph(
        'INV-TEST-001',
        'URGENT: Your account will be suspended. Reply with your OTP passcode to https://chase-security-login.xyz/verify',
        sampleIndicators,
        sampleUrls
      );

      expect(graph.nodes.length).toBeGreaterThanOrEqual(6);
      expect(graph.edges.length).toBeGreaterThanOrEqual(5);

      // Verify node types
      const types = new Set(graph.nodes.map((n) => n.type));
      expect(types.has('ARTIFACT')).toBe(true);
      expect(types.has('INDICATOR')).toBe(true);
      expect(types.has('URL')).toBe(true);
      expect(types.has('DOMAIN')).toBe(true);
      expect(types.has('REPUTATION')).toBe(true);
    });

    it('correctly maps compound relationships between Urgency, Account Threat, and OTP demands', () => {
      const graph = buildEvidenceGraph(
        'INV-TEST-002',
        'URGENT: Your account will be suspended. Reply with your OTP passcode.',
        sampleIndicators
      );

      const compoundsEdge = graph.edges.find((e) => e.type === 'COMPOUNDS_WITH');
      expect(compoundsEdge).toBeDefined();

      const leadsToEdge = graph.edges.find((e) => e.type === 'LEADS_TO');
      expect(leadsToEdge).toBeDefined();
    });
  });

  describe('Investigation Timeline & Causal Sequencing', () => {
    it('constructs an ordered attack sequence without fabricating real-world timestamps', () => {
      const timeline = buildInvestigationTimeline(
        sampleIndicators,
        'URGENT: Your account will be suspended. Reply with your OTP passcode.'
      );

      expect(timeline.length).toBeGreaterThanOrEqual(2);
      expect(timeline[0].stepIndex).toBe(1);
      // Verify stages exist
      const stages = timeline.map((t) => t.stage);
      expect(stages).toContain('PRESSURE');
      expect(stages).toContain('EXPLOITATION');

      // Ensure every step has an explanation
      for (const step of timeline) {
        expect(step.title).toBeDefined();
        expect(step.description.length).toBeGreaterThan(10);
      }
    });

    it('handles benign messages with a baseline message scan entry', () => {
      const timeline = buildInvestigationTimeline([], 'Hi Mom, I will be home around 6 PM for dinner.');
      expect(timeline.length).toBe(1);
      expect(timeline[0].stage).toBe('HOOK');
      expect(timeline[0].title).toContain('Baseline Message Scan');
    });
  });

  describe('Mitigating & Contradictory Evidence', () => {
    it('recognizes authentic brand domain as a strong mitigating factor', () => {
      const authenticUrls: UrlAnalysisSummary[] = [
        {
          url: 'https://chase.com/login',
          domain: 'chase.com',
          hostname: 'chase.com',
          isBareIp: false,
          isShortener: false,
          isPunycode: false,
          hasHomoglyph: false,
          tld: 'com',
          riskScore: 0,
          suspiciousFactorsCount: 0,
          reputationStatus: 'AUTHENTIC_BRAND',
        },
      ];

      const mitigations = identifyMitigatingFactors(
        'Log in to chase.com to review your monthly statement.',
        [],
        authenticUrls
      );

      const brandMatch = mitigations.find((m) => m.code === 'AUTHENTIC_DOMAIN_MATCH');
      expect(brandMatch).toBeDefined();
      expect(brandMatch?.impact).toBe('STRONG_MITIGATION');
    });

    it('recognizes defensive advisory context in educational warnings', () => {
      const mitigations = identifyMitigatingFactors(
        'Security Notice: We will never ask for your password or OTP over phone or email.',
        [],
        []
      );

      const advFraming = mitigations.find((m) => m.code === 'DEFENSIVE_ADVISORY_FRAMING');
      expect(advFraming).toBeDefined();
      expect(advFraming?.impact).toBe('STRONG_MITIGATION');
    });

    it('synthesizes balanced evidence intelligence avoiding false binary forcing on mixed evidence', () => {
      const summary = analyzeEvidenceIntelligence(
        'INV-MIXED-001',
        'Important notice regarding your account status. Please log in directly through your official mobile app to review.',
        [
          {
            id: 'ind_threat_mild',
            category: 'ACCOUNT_THREAT',
            name: 'Account Status Notice',
            severity: 'MEDIUM',
            evidence: 'notice regarding your account status',
            characterRange: [0, 41],
            explanation: 'Account notice',
            whyItMatters: 'Status review',
            source: 'DETERMINISTIC',
          },
        ],
        'LOW',
        'LIMITED',
        [],
        []
      );

      expect(summary.mitigatingFactors.length).toBeGreaterThan(0);
      expect(summary.uncertaintyLevel).toBe('MODERATE');
      expect(summary.evidenceSynthesis.toLowerCase()).toContain('caution');
    });
  });
});
