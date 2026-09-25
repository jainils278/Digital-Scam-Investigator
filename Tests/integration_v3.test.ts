import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../Backend/src/index.js';

describe('Phase 6 — V3.0 Pipeline Integration (POST /api/investigate)', () => {

  it('exposes complete V3.0 explainable intelligence structure on scam investigation', async () => {
    const response = await request(app)
      .post('/api/investigate')
      .send({
        text: 'INTERNAL REVENUE SERVICE: Urgent summons issued against you. Pay with $500 in Apple gift cards immediately to avoid arrest warrant. https://irs-tax-settlement.info',
        messageType: 'sms',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    const report = response.body.report;

    // 1. Risk Waterfall
    expect(report.riskAssessment).toBeDefined();
    expect(report.riskAssessment.waterfall).toBeDefined();
    expect(report.riskAssessment.waterfall.baseScore).toBeGreaterThan(0);
    expect(report.riskAssessment.waterfall.contributions.length).toBeGreaterThan(0);
    expect(report.riskAssessment.waterfall.finalScore).toBe(report.riskAssessment.score);

    // 2. Psychological Tactic Fingerprinting
    expect(report.tactics).toBeDefined();
    expect(report.tactics.tacticCount).toBeGreaterThanOrEqual(1);
    expect(report.tactics.allTactics.length).toBeGreaterThanOrEqual(1);
    expect(report.tactics.allTactics[0].constituentIndicatorIds.length).toBeGreaterThanOrEqual(1);

    // 3. Pretext Contradiction Matrix
    expect(report.contradictions).toBeDefined();
    expect(report.contradictions.hasContradictions).toBe(true);
    expect(report.contradictions.contradictionsCount).toBeGreaterThanOrEqual(1);
    const govContradiction = report.contradictions.findings.find(
      (f: any) => f.ruleId === 'CONTR_GOV_GIFTCARD'
    );
    expect(govContradiction).toBeDefined();
    expect(govContradiction.classification).toBe('CONTRADICTION');

    // 4. 6-Stage Attack Chain
    expect(report.evidenceIntelligence).toBeDefined();
    expect(report.evidenceIntelligence.timeline.length).toBeGreaterThanOrEqual(2);
    const impactStep = report.evidenceIntelligence.timeline.find(
      (s: any) => s.stage === 'POTENTIAL_IMPACT'
    );
    expect(impactStep).toBeDefined();
    expect(impactStep.observedOrInferred).toBe('PROJECTED_CONSEQUENCE');

    // 5. Missing Evidence Advisor
    expect(report.missingEvidence).toBeDefined();
    expect(report.missingEvidence.completenessScore).toBeGreaterThanOrEqual(10);
    expect(report.missingEvidence.missingEvidenceItems.length).toBeGreaterThanOrEqual(1);
    expect(report.missingEvidence.advisoryNote).toContain('limitations of the submitted material');

    // 6. Preserved backward compatibility
    expect(report.observedIndicators).toBeDefined();
    expect(report.aiContext).toBeDefined();
    expect(report.defensiveRecommendations).toBeDefined();
    expect(report.disclaimer).toBeDefined();
  });

  it('maintains clean V3.0 contracts for benign message', async () => {
    const response = await request(app)
      .post('/api/investigate')
      .send({
        text: 'Hi Alice, let us meet at the library at 3:00 PM for the study session.',
        messageType: 'social_dm',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    const report = response.body.report;

    expect(report.riskAssessment.score).toBe(0);
    expect(report.riskAssessment.waterfall.finalScore).toBe(0);
    expect(report.tactics.tacticCount).toBe(0);
    expect(report.contradictions.hasContradictions).toBe(false);
    expect(report.missingEvidence).toBeDefined();
    expect(report.evidenceIntelligence.timeline[0].title).toContain('Baseline Message Scan');
  });
});
