import { describe, expect, it } from 'vitest';
import { deriveInvestigationAssessment } from '../../Frontend/src/utils/assessmentSummary.js';
import type { InvestigationReport } from '../../Frontend/src/types/index.js';
import {
  AMBIGUOUS_CASES,
  LEGITIMATE_CASES,
  SCAM_CASES,
  VALIDATION_DATASET,
} from './fixtures/validation_dataset.js';
import { detectIndicators } from '../../Backend/src/services/detector.js';
import { normalizeForAnalysis } from '../../Backend/src/services/normalizer.js';
import { calculateRiskAssessment } from '../../Backend/src/services/risk_engine.js';

describe('Validation Dataset & Assessment Panel Test Suite', () => {
  describe('Dataset Structure & Fixture Integrity', () => {
    it('contains exactly 45 structured validation cases', () => {
      expect(VALIDATION_DATASET).toHaveLength(45);
      expect(SCAM_CASES).toHaveLength(15);
      expect(LEGITIMATE_CASES).toHaveLength(15);
      expect(AMBIGUOUS_CASES).toHaveLength(15);
    });

    it('ensures every case has strongly typed, non-empty required fields', () => {
      for (const item of VALIDATION_DATASET) {
        expect(item.id).toMatch(/^(S|L|A)\d{2}$/);
        expect(['SCAM', 'LEGITIMATE', 'AMBIGUOUS']).toContain(item.label);
        expect(item.category.trim().length).toBeGreaterThan(0);
        expect(['sms', 'email', 'social_dm', 'unknown']).toContain(item.channel);
        expect(item.text.trim().length).toBeGreaterThan(0);
        expect(Array.isArray(item.expectedIndicators)).toBe(true);
        expect(Array.isArray(item.expectedEvidence)).toBe(true);
        expect(item.expectedRiskBand.trim().length).toBeGreaterThan(0);
        expect(item.expectedEvidenceStrength.trim().length).toBeGreaterThan(0);
        expect(item.notes.trim().length).toBeGreaterThan(0);
      }
    });

    it('preserves unique IDs across all 45 cases', () => {
      const ids = VALIDATION_DATASET.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(45);
    });
  });

  describe('Investigation Assessment Panel Derivation Logic', () => {
    it('correctly maps a high-suspicion scam report', () => {
      const mockScamReport: InvestigationReport = {
        id: 'rep_scam_test',
        timestamp: new Date().toISOString(),
        inputMeta: { characterCount: 120, wordCount: 20, messageType: 'sms' },
        rawText: 'URGENT: Your bank account will be suspended today. Verify your identity by sending the OTP to this number immediately.',
        observedIndicators: [
          {
            id: 'ind_cred_otp_1',
            category: 'CREDENTIAL_HARVESTING',
            name: 'Direct One-Time Passcode (OTP) Demand',
            severity: 'CRITICAL',
            evidence: 'sending the OTP',
            characterRange: [75, 90],
            explanation: 'demands OTP',
            whyItMatters: 'MFA bypass',
            source: 'DETERMINISTIC',
          },
          {
            id: 'ind_threat_suspension_2',
            category: 'ACCOUNT_THREAT',
            name: 'Account Suspension Threat',
            severity: 'HIGH',
            evidence: 'account will be suspended',
            characterRange: [18, 43],
            explanation: 'suspension threat',
            whyItMatters: 'panic creation',
            source: 'DETERMINISTIC',
          },
        ],
        aiContext: {
          mode: 'LOCAL_HEURISTIC',
          providerName: 'Heuristic',
          scamArchetypes: ['Bank Impersonation'],
          psychologicalTriggers: ['Urgency'],
          socialEngineeringTactics: 'Coercion',
          ambiguityAssessment: 'Low ambiguity',
          unverifiedInferences: [],
        },
        riskAssessment: {
          score: 85,
          level: 'CRITICAL',
          evidenceStrength: 'SUBSTANTIAL',
          evidenceStrengthExplanation: 'Multiple critical indicators',
          primaryCategories: ['Credential & MFA Harvesting', 'Account Suspension Intimidation'],
          scoringRationale: ['+40 OTP', '+25 Suspension'],
          isNonProbabilisticNotice: 'Rule-based',
        },
        defensiveRecommendations: [],
        disclaimer: 'Advisory notice',
      };

      const assessment = deriveInvestigationAssessment(mockScamReport);

      expect(assessment.state).toBe('SUSPICIOUS');
      expect(assessment.badgeText).toContain('SCAM INDICATORS DETECTED');
      expect(assessment.badgeType).toBe('critical');
      expect(assessment.headerText).toBe('KEY INDICATORS');
      expect(assessment.category).toContain('Account Takeover');
      expect(assessment.keyItems.length).toBeGreaterThanOrEqual(2);
      expect(assessment.keyItems).toContain('One-Time Passcode (OTP) / PIN request');
      expect(assessment.keyItems).toContain('Account suspension / closure threat');

      // Crucial user requirement: "Expected" must never be present in user UI
      expect(assessment.badgeText).not.toContain('Expected');
      expect(assessment.category).not.toContain('Expected');
      for (const item of assessment.keyItems) {
        expect(item).not.toContain('Expected');
      }
    });

    it('correctly maps a legitimate/no-indicators report without claiming absolute safety', () => {
      const mockCleanReport: InvestigationReport = {
        id: 'rep_clean_test',
        timestamp: new Date().toISOString(),
        inputMeta: { characterCount: 65, wordCount: 11, messageType: 'sms' },
        rawText: 'Reminder: today project meeting starts at 5 PM. Please bring the latest presentation.',
        observedIndicators: [],
        aiContext: {
          mode: 'LOCAL_HEURISTIC',
          providerName: 'Heuristic',
          scamArchetypes: [],
          psychologicalTriggers: [],
          socialEngineeringTactics: 'None',
          ambiguityAssessment: 'Routine message',
          unverifiedInferences: [],
        },
        riskAssessment: {
          score: 0,
          level: 'BENIGN',
          evidenceStrength: 'MINIMAL',
          evidenceStrengthExplanation: 'No indicators detected',
          primaryCategories: ['Non-Malicious / Informational'],
          scoringRationale: ['Zero indicators'],
          isNonProbabilisticNotice: 'Rule-based',
        },
        defensiveRecommendations: [],
        disclaimer: 'Advisory notice',
      };

      const assessment = deriveInvestigationAssessment(mockCleanReport);

      expect(assessment.state).toBe('NO_INDICATORS');
      expect(assessment.badgeText).toBe('🟢 NO SUSPICIOUS INDICATORS DETECTED');
      expect(assessment.badgeType).toBe('clean');
      expect(assessment.category).toBe('General Communication');
      expect(assessment.headerText).toBe('KEY FINDINGS');
      expect(assessment.keyItems[0]).toContain('No recognized scam indicators were found');

      // Absolute safety terms are strictly forbidden
      expect(assessment.badgeText).not.toContain('SAFE');
      expect(assessment.badgeText).not.toContain('100% LEGITIMATE');
      expect(assessment.badgeText).not.toContain('NOT A SCAM');
      expect(assessment.clarification).toContain('does not confirm that the message is legitimate');
    });

    it('correctly maps an ambiguous report and communicates insufficient evidence', () => {
      const mockAmbiguousReport: InvestigationReport = {
        id: 'rep_ambiguous_test',
        timestamp: new Date().toISOString(),
        inputMeta: { characterCount: 68, wordCount: 9, messageType: 'sms' },
        rawText: 'Your package could not be delivered. Please contact customer support.',
        observedIndicators: [
          {
            id: 'ind_imp_delivery_1',
            category: 'IMPERSONATION',
            name: 'Courier / Postal Delivery Problem',
            severity: 'LOW',
            evidence: 'package could not be delivered',
            characterRange: [5, 35],
            explanation: 'delivery problem notice',
            whyItMatters: 'routine notice',
            source: 'DETERMINISTIC',
          },
        ],
        aiContext: {
          mode: 'LOCAL_HEURISTIC',
          providerName: 'Heuristic',
          scamArchetypes: ['Delivery Inquiry'],
          psychologicalTriggers: [],
          socialEngineeringTactics: 'Incomplete',
          ambiguityAssessment: 'Context is ambiguous',
          unverifiedInferences: [],
        },
        riskAssessment: {
          score: 20,
          level: 'LOW',
          evidenceStrength: 'LIMITED',
          evidenceStrengthExplanation: 'Single isolated indicator',
          primaryCategories: ['Authority / Brand Impersonation'],
          scoringRationale: ['+8 low severity'],
          isNonProbabilisticNotice: 'Rule-based',
        },
        defensiveRecommendations: [],
        disclaimer: 'Advisory notice',
      };

      const assessment = deriveInvestigationAssessment(mockAmbiguousReport);

      expect(assessment.state).toBe('AMBIGUOUS');
      expect(assessment.badgeText).toBe('🟡 INSUFFICIENT EVIDENCE');
      expect(assessment.badgeType).toBe('ambiguous');
      expect(assessment.headerText).toBe('KEY FINDINGS');
      expect(assessment.keyItems).toContain('The available text is insufficient to determine whether the message is malicious.');
      expect(assessment.clarification).toContain('official channels to verify');
    });
  });

  describe('Part 14 — Core Regression Scenarios', () => {
    it('S01: Strong bank/OTP compound is assessed as high/critical risk with substantial evidence', () => {
      const s01Case = SCAM_CASES.find((c) => c.id === 'S01')!;
      expect(s01Case).toBeDefined();

      const normalized = normalizeForAnalysis(s01Case.text);
      const indicators = detectIndicators(normalized);
      const risk = calculateRiskAssessment(indicators, s01Case.text.length);

      // Verify risk engine assessment
      expect(['HIGH', 'CRITICAL']).toContain(risk.level);
      expect(risk.score).toBeGreaterThanOrEqual(60);
      expect(risk.evidenceStrength).toBe('SUBSTANTIAL');

      // Verify indicators detected
      const indicatorCategories = indicators.map((i) => i.category);
      expect(indicatorCategories).toContain('CREDENTIAL_HARVESTING');
      expect(indicatorCategories).toContain('ACCOUNT_THREAT');
    });

    it('L04: Defensive OTP warning is not flagged as a scam demand', () => {
      const l04Case = LEGITIMATE_CASES.find((c) => c.id === 'L04')!;
      expect(l04Case).toBeDefined();

      const normalized = normalizeForAnalysis(l04Case.text);
      const indicators = detectIndicators(normalized);
      const risk = calculateRiskAssessment(indicators, l04Case.text.length);

      // Must be benign with 0 indicators detected due to negation guard
      expect(indicators).toHaveLength(0);
      expect(risk.level).toBe('BENIGN');
      expect(risk.score).toBe(0);
      expect(risk.evidenceStrength).toBe('MINIMAL');
    });

    it('A01: Ambiguous delivery issue is not forced into high/critical scam', () => {
      const a01Case = AMBIGUOUS_CASES.find((c) => c.id === 'A01')!;
      expect(a01Case).toBeDefined();

      const normalized = normalizeForAnalysis(a01Case.text);
      const indicators = detectIndicators(normalized);
      const risk = calculateRiskAssessment(indicators, a01Case.text.length);

      // Must not be forced into HIGH or CRITICAL
      expect(risk.level).not.toBe('CRITICAL');
      expect(risk.level).not.toBe('HIGH');
      expect(risk.score).toBeLessThan(50);
    });

    it('end-to-end: derives correct assessment states for S01, L04, and A01 from full investigation pipeline', () => {
      // 1. S01: Strong Scam
      const s01 = SCAM_CASES.find((c) => c.id === 'S01')!;
      const s01Norm = normalizeForAnalysis(s01.text);
      const s01Ind = detectIndicators(s01Norm);
      const s01Risk = calculateRiskAssessment(s01Ind, s01.text.length);
      const s01Report: InvestigationReport = {
        id: 'rep_s01',
        timestamp: new Date().toISOString(),
        inputMeta: { characterCount: s01.text.length, wordCount: 15, messageType: 'sms' },
        rawText: s01.text,
        observedIndicators: s01Ind,
        aiContext: {
          mode: 'LOCAL_HEURISTIC',
          providerName: 'Heuristic',
          scamArchetypes: [],
          psychologicalTriggers: [],
          socialEngineeringTactics: 'None',
          ambiguityAssessment: 'High suspicion',
          unverifiedInferences: [],
        },
        riskAssessment: s01Risk,
        defensiveRecommendations: [],
        disclaimer: 'Advisory notice',
      };
      const s01Assessment = deriveInvestigationAssessment(s01Report);
      expect(s01Assessment.state).toBe('SUSPICIOUS');
      expect(s01Assessment.badgeText).toContain('SCAM INDICATORS DETECTED');
      expect(s01Assessment.category).toBe('Account Takeover / Bank Impersonation');
      expect(s01Assessment.keyItems).toEqual(
        expect.arrayContaining([
          expect.stringContaining('One-Time Passcode'),
          expect.stringContaining('Account suspension'),
          expect.stringContaining('Urgent call-to-action'),
        ])
      );
      expect(s01Assessment.clarification).toContain('verified indicators found in the submitted text');

      // 2. L04: Defensive Educational / Legitimate
      const l04 = LEGITIMATE_CASES.find((c) => c.id === 'L04')!;
      const l04Norm = normalizeForAnalysis(l04.text);
      const l04Ind = detectIndicators(l04Norm);
      const l04Risk = calculateRiskAssessment(l04Ind, l04.text.length);
      const l04Report: InvestigationReport = {
        id: 'rep_l04',
        timestamp: new Date().toISOString(),
        inputMeta: { characterCount: l04.text.length, wordCount: 12, messageType: 'sms' },
        rawText: l04.text,
        observedIndicators: l04Ind,
        aiContext: {
          mode: 'LOCAL_HEURISTIC',
          providerName: 'Heuristic',
          scamArchetypes: [],
          psychologicalTriggers: [],
          socialEngineeringTactics: 'None',
          ambiguityAssessment: 'Defensive context',
          unverifiedInferences: [],
        },
        riskAssessment: l04Risk,
        defensiveRecommendations: [],
        disclaimer: 'Advisory notice',
      };
      const l04Assessment = deriveInvestigationAssessment(l04Report);
      expect(l04Assessment.state).toBe('NO_INDICATORS');
      expect(l04Assessment.badgeText).toBe('🟢 NO SUSPICIOUS INDICATORS DETECTED');
      expect(l04Assessment.category).toBe('General Communication');
      expect(l04Assessment.badgeText).not.toContain('SAFE');
      expect(l04Assessment.clarification).toContain('does not confirm that the message is legitimate');

      // 3. A01: Ambiguous Delivery / Support Notice
      const a01 = AMBIGUOUS_CASES.find((c) => c.id === 'A01')!;
      const a01Norm = normalizeForAnalysis(a01.text);
      const a01Ind = detectIndicators(a01Norm);
      const a01Risk = calculateRiskAssessment(a01Ind, a01.text.length);
      const a01Report: InvestigationReport = {
        id: 'rep_a01',
        timestamp: new Date().toISOString(),
        inputMeta: { characterCount: a01.text.length, wordCount: 9, messageType: 'sms' },
        rawText: a01.text,
        observedIndicators: a01Ind,
        aiContext: {
          mode: 'LOCAL_HEURISTIC',
          providerName: 'Heuristic',
          scamArchetypes: [],
          psychologicalTriggers: [],
          socialEngineeringTactics: 'None',
          ambiguityAssessment: 'Ambiguous context',
          unverifiedInferences: [],
        },
        riskAssessment: a01Risk,
        defensiveRecommendations: [],
        disclaimer: 'Advisory notice',
      };
      const a01Assessment = deriveInvestigationAssessment(a01Report);
      expect(a01Assessment.state).toBe('AMBIGUOUS');
      expect(a01Assessment.badgeText).toBe('🟡 INSUFFICIENT EVIDENCE');
      expect(a01Assessment.category).toBe('Delivery / Account Activity');
      expect(a01Assessment.keyItems).toContain('The available text is insufficient to determine whether the message is malicious.');
      expect(a01Assessment.clarification).toContain('official channels to verify');
    });
  });
});
