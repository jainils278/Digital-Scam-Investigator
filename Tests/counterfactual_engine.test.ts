import { describe, expect, it } from 'vitest';
import { generateCounterfactualAnalysis } from '../Backend/src/services/intelligence/counterfactual_engine.js';
import { calculateRiskAssessment } from '../Backend/src/services/risk_engine.js';
import type { ObservedIndicator } from '../Backend/src/types.js';

function makeIndicator(overrides: Partial<ObservedIndicator> = {}): ObservedIndicator {
  return {
    id: 'test_ind_1',
    category: 'URGENCY_PRESSURE',
    name: 'Artificial Urgency Deadline',
    severity: 'MEDIUM',
    evidence: 'act immediately within 24 hours',
    characterRange: [10, 42],
    explanation: 'Deadline pressure test',
    whyItMatters: 'Panic trigger test',
    source: 'DETERMINISTIC',
    ...overrides,
  };
}

describe('V3.1 Counterfactual Risk Analysis Engine', () => {
  it('returns empty scenarios when verified indicators list is empty (baseline 0)', () => {
    const baseline = calculateRiskAssessment([], 100);
    const analysis = generateCounterfactualAnalysis([], baseline, 100);

    expect(analysis.baselineScore).toBe(0);
    expect(analysis.scenarios).toHaveLength(0);
    expect(analysis.primaryPivotFactor).toBeUndefined();
  });

  it('evaluates single indicator removal and calculates exact scoreDelta', () => {
    const ind1 = makeIndicator({ id: 'ind_1', severity: 'MEDIUM', category: 'URGENCY_PRESSURE', name: 'Urgent Tone' });
    const baseline = calculateRiskAssessment([ind1], 100);
    expect(baseline.score).toBe(15);

    const analysis = generateCounterfactualAnalysis([ind1], baseline, 100);
    expect(analysis.baselineScore).toBe(15);

    const indScenario = analysis.scenarios.find((s) => s.scope === 'INDICATOR' && s.targetIndicatorId === 'ind_1');
    expect(indScenario).toBeDefined();
    expect(indScenario?.counterfactualScore).toBe(0);
    expect(indScenario?.scoreDelta).toBe(15);
    expect(indScenario?.counterfactualLevel).toBe('BENIGN');
    expect(indScenario?.brokenSynergies).toHaveLength(0);
    expect(indScenario?.explanation).toContain('reduces risk score by 15 pts');

    expect(analysis.primaryPivotFactor).toBeDefined();
  });

  it('evaluates category removal when multiple indicators exist in the same category', () => {
    const ind1 = makeIndicator({ id: 'ind_urg_1', severity: 'MEDIUM', category: 'URGENCY_PRESSURE', name: 'Urgency 1' });
    const ind2 = makeIndicator({ id: 'ind_urg_2', severity: 'LOW', category: 'URGENCY_PRESSURE', name: 'Urgency 2' });
    const ind3 = makeIndicator({ id: 'ind_imp', severity: 'HIGH', category: 'IMPERSONATION', name: 'Brand Impersonation' });

    const indicators = [ind1, ind2, ind3];
    const baseline = calculateRiskAssessment(indicators, 150);
    // Base: 15 + 8 + 25 = 48. No synergies between URGENCY and IMPERSONATION.
    expect(baseline.score).toBe(48);

    const analysis = generateCounterfactualAnalysis(indicators, baseline, 150);

    // Check category removal for URGENCY_PRESSURE
    const catScenario = analysis.scenarios.find((s) => s.scope === 'CATEGORY' && s.targetCategory === 'URGENCY_PRESSURE');
    expect(catScenario).toBeDefined();
    expect(catScenario?.removedIndicatorIds).toEqual(['ind_urg_1', 'ind_urg_2']);
    // With URGENCY_PRESSURE removed, only ind_imp remains (25 pts)
    expect(catScenario?.counterfactualScore).toBe(25);
    expect(catScenario?.scoreDelta).toBe(23); // 48 - 25 = 23
    expect(catScenario?.counterfactualLevel).toBe('LOW');

    // Individual indicator removal should only remove that indicator
    const ind1Scenario = analysis.scenarios.find((s) => s.scope === 'INDICATOR' && s.targetIndicatorId === 'ind_urg_1');
    expect(ind1Scenario?.counterfactualScore).toBe(33); // 48 - 15 = 33
    expect(ind1Scenario?.scoreDelta).toBe(15);
  });

  it('detects broken compound synergies when removing synergy participants', () => {
    const indImp = makeIndicator({ id: 'ind_imp', category: 'IMPERSONATION', severity: 'HIGH', name: 'Chase Impersonation' });
    const indCred = makeIndicator({ id: 'ind_cred', category: 'CREDENTIAL_HARVESTING', severity: 'HIGH', name: 'Login Link' });

    const indicators = [indImp, indCred];
    const baseline = calculateRiskAssessment(indicators, 200);
    // Base: 25 + 25 = 50 + 15 (synergy) = 65
    expect(baseline.score).toBe(65);
    expect(baseline.waterfall?.synergyScore).toBe(15);

    const analysis = generateCounterfactualAnalysis(indicators, baseline, 200);

    const impScenario = analysis.scenarios.find((s) => s.scope === 'INDICATOR' && s.targetIndicatorId === 'ind_imp');
    expect(impScenario).toBeDefined();
    // Removing impersonation removes 25 base + 15 synergy = 40 pts delta. Result = 25.
    expect(impScenario?.counterfactualScore).toBe(25);
    expect(impScenario?.scoreDelta).toBe(40);
    expect(impScenario?.brokenSynergies).toContain('Brand Impersonation & Credential Harvesting Synergy');
    expect(impScenario?.explanation).toContain('eliminates synergy');
  });

  it('detects multiple broken synergies when removing an indicator participating in several synergies', () => {
    // URGENCY_PRESSURE participates in:
    // 1. ACCOUNT_THREAT + URGENCY_PRESSURE (+10)
    // 2. FINANCIAL_COERCION + URGENCY_PRESSURE (+10)
    const indUrg = makeIndicator({ id: 'ind_urg', category: 'URGENCY_PRESSURE', severity: 'MEDIUM', name: 'Urgency' });
    const indThreat = makeIndicator({ id: 'ind_threat', category: 'ACCOUNT_THREAT', severity: 'HIGH', name: 'Threat' });
    const indFin = makeIndicator({ id: 'ind_fin', category: 'FINANCIAL_COERCION', severity: 'HIGH', name: 'Wire Demand' });

    const indicators = [indUrg, indThreat, indFin];
    const baseline = calculateRiskAssessment(indicators, 200);
    // Base: 15 + 25 + 25 = 65.
    // Synergies: threat+urgency (10) + fin+urgency (10) = 20. Total = 85.
    expect(baseline.score).toBe(85);

    const analysis = generateCounterfactualAnalysis(indicators, baseline, 200);

    const urgScenario = analysis.scenarios.find((s) => s.scope === 'INDICATOR' && s.targetIndicatorId === 'ind_urg');
    expect(urgScenario).toBeDefined();
    // Removing ind_urg breaks BOTH synergies: 15 (base) + 10 + 10 = 35 delta. Result = 50.
    expect(urgScenario?.counterfactualScore).toBe(50);
    expect(urgScenario?.scoreDelta).toBe(35);
    expect(urgScenario?.brokenSynergies).toHaveLength(2);
    expect(urgScenario?.brokenSynergies).toContain('Account Threat & Artificial Urgency Synergy');
    expect(urgScenario?.brokenSynergies).toContain('Financial Demand & Deadline Synergy');
  });

  it('handles saturated scores exceeding 100 with clamping correctly', () => {
    // Total raw points well over 100
    const ind1 = makeIndicator({ id: 'ind_crit1', category: 'CREDENTIAL_HARVESTING', severity: 'CRITICAL', name: 'Password Theft' }); // 40
    const ind2 = makeIndicator({ id: 'ind_crit2', category: 'CREDENTIAL_HARVESTING', severity: 'CRITICAL', name: 'OTP Solicitation' }); // 40
    const ind3 = makeIndicator({ id: 'ind_high', category: 'IMPERSONATION', severity: 'HIGH', name: 'Bank Pretext' }); // 25
    const ind4 = makeIndicator({ id: 'ind_low', category: 'URGENCY_PRESSURE', severity: 'LOW', name: 'Slight Urgency' }); // 8
    // Base = 40 + 40 + 25 + 8 = 113. Synergy (imp+cred) = 15. Raw = 128. Clamped to 100.

    const indicators = [ind1, ind2, ind3, ind4];
    const baseline = calculateRiskAssessment(indicators, 300);
    expect(baseline.score).toBe(100);

    const analysis = generateCounterfactualAnalysis(indicators, baseline, 300);
    expect(analysis.baselineScore).toBe(100);

    // Removing ind_low (8 pts) leaves raw = 120, clamped score is STILL 100!
    const lowScenario = analysis.scenarios.find((s) => s.scope === 'INDICATOR' && s.targetIndicatorId === 'ind_low');
    expect(lowScenario).toBeDefined();
    expect(lowScenario?.counterfactualScore).toBe(100);
    expect(lowScenario?.scoreDelta).toBe(0);
    expect(lowScenario?.explanation).toContain('does not alter the clamped score');
  });

  it('never violates mathematical monotonicity: removal of indicators never increases score', () => {
    const indicators: ObservedIndicator[] = [
      makeIndicator({ id: 'i1', category: 'IMPERSONATION', severity: 'HIGH' }),
      makeIndicator({ id: 'i2', category: 'CREDENTIAL_HARVESTING', severity: 'CRITICAL' }),
      makeIndicator({ id: 'i3', category: 'ACCOUNT_THREAT', severity: 'HIGH' }),
      makeIndicator({ id: 'i4', category: 'URGENCY_PRESSURE', severity: 'MEDIUM' }),
      makeIndicator({ id: 'i5', category: 'FINANCIAL_COERCION', severity: 'HIGH' }),
    ];

    const baseline = calculateRiskAssessment(indicators, 250);
    const analysis = generateCounterfactualAnalysis(indicators, baseline, 250);

    for (const scenario of analysis.scenarios) {
      expect(scenario.counterfactualScore).toBeLessThanOrEqual(analysis.baselineScore);
      expect(scenario.scoreDelta).toBeGreaterThanOrEqual(0);
    }
  });

  it('computes primaryPivotFactor from the scenario with the highest scoreDelta', () => {
    const indLow = makeIndicator({ id: 'ind_low', category: 'URGENCY_PRESSURE', severity: 'LOW', name: 'Low Urgency' }); // 8 pts
    const indCrit = makeIndicator({ id: 'ind_crit', category: 'CREDENTIAL_HARVESTING', severity: 'CRITICAL', name: 'Stolen Credentials' }); // 40 pts

    const indicators = [indLow, indCrit];
    const baseline = calculateRiskAssessment(indicators, 100);
    // Score = 48
    expect(baseline.score).toBe(48);

    const analysis = generateCounterfactualAnalysis(indicators, baseline, 100);
    expect(analysis.primaryPivotFactor).toBeDefined();
    // ind_crit has 40 pts delta, higher than ind_low (8 pts)
    expect(analysis.primaryPivotFactor).toContain('CREDENTIAL_HARVESTING');
  });

  it('does not mutate the baseline indicators array or assessment object', () => {
    const indicators = [
      makeIndicator({ id: 'ind_1', severity: 'HIGH' }),
      makeIndicator({ id: 'ind_2', severity: 'MEDIUM' }),
    ];
    const originalLength = indicators.length;
    const baseline = calculateRiskAssessment(indicators, 100);
    const originalScore = baseline.score;

    generateCounterfactualAnalysis(indicators, baseline, 100);

    expect(indicators).toHaveLength(originalLength);
    expect(baseline.score).toBe(originalScore);
  });
});
