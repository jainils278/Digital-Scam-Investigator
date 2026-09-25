import { describe, expect, it } from 'vitest';
import { calculateRiskAssessment } from '../Backend/src/services/risk_engine.js';
import { ObservedIndicator } from '../Backend/src/types.js';

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

describe('V3.0 Explainable Risk Waterfall Engine', () => {
  it('returns empty waterfall with 0 points for benign messages with no indicators', () => {
    const result = calculateRiskAssessment([], 100);
    expect(result.score).toBe(0);
    expect(result.waterfall).toBeDefined();
    expect(result.waterfall?.baseScore).toBe(0);
    expect(result.waterfall?.synergyScore).toBe(0);
    expect(result.waterfall?.rawTotalScore).toBe(0);
    expect(result.waterfall?.capAdjustment).toBe(0);
    expect(result.waterfall?.finalScore).toBe(0);
    expect(result.waterfall?.contributions).toHaveLength(0);
  });

  it('records correct base contribution points and provenance for individual indicators', () => {
    const indicators: ObservedIndicator[] = [
      makeIndicator({ id: 'ind_med', severity: 'MEDIUM', name: 'Urgent Tone' }),
      makeIndicator({ id: 'ind_high', severity: 'HIGH', category: 'ACCOUNT_THREAT', name: 'Suspension Notice' }),
      makeIndicator({ id: 'ind_crit', severity: 'CRITICAL', category: 'CREDENTIAL_HARVESTING', name: 'Direct OTP Demand' }),
    ];

    const result = calculateRiskAssessment(indicators, 200);
    expect(result.waterfall).toBeDefined();

    const wf = result.waterfall!;
    expect(wf.baseScore).toBe(15 + 25 + 40); // 80
    expect(wf.contributions.filter((c) => c.type === 'BASE_SEVERITY')).toHaveLength(3);

    const critContrib = wf.contributions.find((c) => c.sourceIndicatorId === 'ind_crit');
    expect(critContrib).toBeDefined();
    expect(critContrib?.points).toBe(40);
    expect(critContrib?.category).toBe('CREDENTIAL_HARVESTING');
    expect(critContrib?.evidenceQuote).toBe('act immediately within 24 hours');
    expect(critContrib?.characterRange).toEqual([10, 42]);
  });

  it('records compound synergy contributions when combinations are detected', () => {
    const indicators: ObservedIndicator[] = [
      makeIndicator({ id: 'ind_imp', category: 'IMPERSONATION', severity: 'HIGH', name: 'Chase Bank Impersonation' }),
      makeIndicator({ id: 'ind_cred', category: 'CREDENTIAL_HARVESTING', severity: 'HIGH', name: 'Login Verification' }),
    ];

    const result = calculateRiskAssessment(indicators, 200);
    const wf = result.waterfall!;

    expect(wf.baseScore).toBe(25 + 25); // 50
    expect(wf.synergyScore).toBe(15);
    expect(wf.rawTotalScore).toBe(65);
    expect(wf.capAdjustment).toBe(0);
    expect(wf.finalScore).toBe(65);
    expect(result.score).toBe(65);

    const synergyContrib = wf.contributions.find((c) => c.type === 'COMPOUND_SYNERGY');
    expect(synergyContrib).toBeDefined();
    expect(synergyContrib?.points).toBe(15);
    expect(synergyContrib?.label).toContain('Brand Impersonation & Credential Harvesting');
  });

  it('applies negative cap adjustment when raw total score exceeds 100', () => {
    const indicators: ObservedIndicator[] = [
      makeIndicator({ id: 'ind_1', category: 'IMPERSONATION', severity: 'CRITICAL' }), // 40
      makeIndicator({ id: 'ind_2', category: 'CREDENTIAL_HARVESTING', severity: 'CRITICAL' }), // 40
      makeIndicator({ id: 'ind_3', category: 'ACCOUNT_THREAT', severity: 'HIGH' }), // 25
      makeIndicator({ id: 'ind_4', category: 'URGENCY_PRESSURE', severity: 'MEDIUM' }), // 15
    ];
    // Base: 40 + 40 + 25 + 15 = 120
    // Synergies:
    // Impersonation + Credential = +15
    // Account Threat + Urgency = +10
    // Raw Total = 120 + 25 = 145

    const result = calculateRiskAssessment(indicators, 300);
    const wf = result.waterfall!;

    expect(wf.baseScore).toBe(120);
    expect(wf.synergyScore).toBe(25);
    expect(wf.rawTotalScore).toBe(145);
    expect(wf.capAdjustment).toBe(-45);
    expect(wf.finalScore).toBe(100);
    expect(result.score).toBe(100);
    expect(result.level).toBe('CRITICAL');

    const capContrib = wf.contributions.find((c) => c.type === 'CAP_ADJUSTMENT');
    expect(capContrib).toBeDefined();
    expect(capContrib?.points).toBe(-45);
  });

  it('guarantees the mathematical conservation invariant: sum(contributions.points) === finalScore', () => {
    const testCases: ObservedIndicator[][] = [
      [],
      [makeIndicator({ severity: 'LOW' })],
      [makeIndicator({ severity: 'MEDIUM' })],
      [makeIndicator({ severity: 'HIGH' })],
      [makeIndicator({ severity: 'CRITICAL' })],
      [
        makeIndicator({ id: '1', category: 'FINANCIAL_COERCION', severity: 'HIGH' }),
        makeIndicator({ id: '2', category: 'URGENCY_PRESSURE', severity: 'MEDIUM' }),
      ],
      [
        makeIndicator({ id: '1', category: 'IMPERSONATION', severity: 'HIGH' }),
        makeIndicator({ id: '2', category: 'CREDENTIAL_HARVESTING', severity: 'CRITICAL' }),
        makeIndicator({ id: '3', category: 'ACCOUNT_THREAT', severity: 'HIGH' }),
        makeIndicator({ id: '4', category: 'URGENCY_PRESSURE', severity: 'HIGH' }),
      ],
    ];

    for (const testCase of testCases) {
      const assessment = calculateRiskAssessment(testCase, 150);
      const wf = assessment.waterfall!;
      const sumPoints = wf.contributions.reduce((acc, c) => acc + c.points, 0);

      expect(sumPoints).toBe(assessment.score);
      expect(wf.finalScore).toBe(assessment.score);
    }
  });

  it('preserves exact V2.1 scoring rationale strings alongside structured waterfall', () => {
    const indicators: ObservedIndicator[] = [
      makeIndicator({ id: 'ind_imp', category: 'IMPERSONATION', severity: 'HIGH', name: 'Authority Impersonation' }),
      makeIndicator({ id: 'ind_cred', category: 'CREDENTIAL_HARVESTING', severity: 'HIGH', name: 'Credential Form' }),
    ];

    const result = calculateRiskAssessment(indicators, 100);
    expect(result.scoringRationale).toHaveLength(3); // 2 base + 1 synergy
    expect(result.scoringRationale[0]).toContain('+25 pts: HIGH indicator');
    expect(result.scoringRationale[1]).toContain('+25 pts: HIGH indicator');
    expect(result.scoringRationale[2]).toContain('+15 pts synergy');
    expect(result.waterfall?.contributions).toHaveLength(3);
  });
});
