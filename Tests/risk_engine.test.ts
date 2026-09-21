import { describe, expect, it } from 'vitest';
import { calculateRiskAssessment } from '../Backend/src/services/risk_engine.js';
import { ObservedIndicator } from '../Backend/src/types.js';

function makeIndicator(overrides: Partial<ObservedIndicator> = {}): ObservedIndicator {
  return {
    id: 'test_ind_1',
    category: 'URGENCY_PRESSURE',
    name: 'Artificial Urgency',
    severity: 'MEDIUM',
    evidence: 'act now',
    characterRange: [0, 7],
    explanation: 'Test indicator',
    whyItMatters: 'Test',
    source: 'DETERMINISTIC',
    ...overrides,
  };
}

describe('Risk Engine', () => {
  it('returns BENIGN with score 0 for empty indicators', () => {
    const result = calculateRiskAssessment([], 100);
    expect(result.score).toBe(0);
    expect(result.level).toBe('BENIGN');
    expect(result.evidenceStrength).toBe('MINIMAL');
    expect(result.primaryCategories).toContain('Non-Malicious / Informational');
    expect(result.scoringRationale.length).toBeGreaterThan(0);
    expect(result.isNonProbabilisticNotice).toBeDefined();
  });

  it('scores a single MEDIUM indicator correctly', () => {
    const indicators = [makeIndicator({ severity: 'MEDIUM' })];
    const result = calculateRiskAssessment(indicators, 100);
    expect(result.score).toBe(15);
    expect(result.level).toBe('BENIGN');
    expect(result.evidenceStrength).toBe('LIMITED');
  });

  it('scores a single HIGH indicator correctly', () => {
    const indicators = [makeIndicator({ severity: 'HIGH' })];
    const result = calculateRiskAssessment(indicators, 100);
    expect(result.score).toBe(25);
    expect(result.level).toBe('LOW');
    expect(result.evidenceStrength).toBe('MODERATE');
  });

  it('scores a CRITICAL indicator correctly', () => {
    const indicators = [makeIndicator({ severity: 'CRITICAL' })];
    const result = calculateRiskAssessment(indicators, 100);
    expect(result.score).toBe(40);
    expect(result.level).toBe('LOW');
    expect(result.evidenceStrength).toBe('SUBSTANTIAL');
  });

  it('applies IMPERSONATION + CREDENTIAL_HARVESTING synergy bonus', () => {
    const indicators = [
      makeIndicator({ id: 'ind_1', category: 'IMPERSONATION', severity: 'HIGH' }),
      makeIndicator({ id: 'ind_2', category: 'CREDENTIAL_HARVESTING', severity: 'HIGH' }),
    ];
    const result = calculateRiskAssessment(indicators, 200);
    // 25 + 25 + 15 synergy = 65
    expect(result.score).toBe(65);
    expect(result.level).toBe('MEDIUM');
    expect(result.scoringRationale.some((r) => r.includes('synergy'))).toBe(true);
  });

  it('applies ACCOUNT_THREAT + URGENCY_PRESSURE synergy bonus', () => {
    const indicators = [
      makeIndicator({ id: 'ind_1', category: 'ACCOUNT_THREAT', severity: 'HIGH' }),
      makeIndicator({ id: 'ind_2', category: 'URGENCY_PRESSURE', severity: 'MEDIUM' }),
    ];
    const result = calculateRiskAssessment(indicators, 200);
    // 25 + 15 + 10 synergy = 50
    expect(result.score).toBe(50);
  });

  it('applies FINANCIAL_COERCION + URGENCY_PRESSURE synergy bonus', () => {
    const indicators = [
      makeIndicator({ id: 'ind_1', category: 'FINANCIAL_COERCION', severity: 'HIGH' }),
      makeIndicator({ id: 'ind_2', category: 'URGENCY_PRESSURE', severity: 'MEDIUM' }),
    ];
    const result = calculateRiskAssessment(indicators, 200);
    // 25 + 15 + 10 synergy = 50
    expect(result.score).toBe(50);
  });

  it('caps score at 100', () => {
    const indicators = [
      makeIndicator({ id: 'ind_1', category: 'IMPERSONATION', severity: 'CRITICAL' }),
      makeIndicator({ id: 'ind_2', category: 'CREDENTIAL_HARVESTING', severity: 'CRITICAL' }),
      makeIndicator({ id: 'ind_3', category: 'ACCOUNT_THREAT', severity: 'CRITICAL' }),
      makeIndicator({ id: 'ind_4', category: 'URGENCY_PRESSURE', severity: 'CRITICAL' }),
    ];
    const result = calculateRiskAssessment(indicators, 200);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.level).toBe('CRITICAL');
  });

  it('determines SUBSTANTIAL evidence strength for multiple high-severity indicators', () => {
    const indicators = [
      makeIndicator({ id: 'ind_1', severity: 'HIGH', category: 'IMPERSONATION' }),
      makeIndicator({ id: 'ind_2', severity: 'HIGH', category: 'CREDENTIAL_HARVESTING' }),
      makeIndicator({ id: 'ind_3', severity: 'MEDIUM', category: 'URGENCY_PRESSURE' }),
    ];
    const result = calculateRiskAssessment(indicators, 200);
    expect(result.evidenceStrength).toBe('SUBSTANTIAL');
  });

  it('returns correct primaryCategories mapping', () => {
    const indicators = [
      makeIndicator({ category: 'CREDENTIAL_HARVESTING', severity: 'HIGH' }),
    ];
    const result = calculateRiskAssessment(indicators, 100);
    expect(result.primaryCategories).toContain('Credential & MFA Harvesting');
  });

  it('always includes isNonProbabilisticNotice', () => {
    const result1 = calculateRiskAssessment([], 100);
    const result2 = calculateRiskAssessment([makeIndicator()], 100);
    expect(result1.isNonProbabilisticNotice).toBeTruthy();
    expect(result2.isNonProbabilisticNotice).toBeTruthy();
  });
});
