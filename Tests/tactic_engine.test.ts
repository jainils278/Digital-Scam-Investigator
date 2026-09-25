import { describe, expect, it } from 'vitest';
import { analyzeTacticProfile } from '../Backend/src/services/intelligence/tactic_engine.js';
import { ObservedIndicator, UrlAnalysisSummary } from '../Backend/src/types.js';

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

describe('V3.0 Deterministic Psychological Tactic Fingerprinting Engine', () => {
  it('returns empty profile for benign messages with zero indicators', () => {
    const profile = analyzeTacticProfile([]);
    expect(profile.tacticCount).toBe(0);
    expect(profile.allTactics).toHaveLength(0);
    expect(profile.primaryTactic).toBeUndefined();
    expect(profile.summary).toContain('No composite predatory social engineering');
  });

  it('detects Authority-Pressure Manipulation (TAC_AUTH_PRESSURE)', () => {
    const indicators: ObservedIndicator[] = [
      makeIndicator({ id: 'ind_imp', category: 'IMPERSONATION', severity: 'HIGH', name: 'Tax Department Impersonation' }),
      makeIndicator({ id: 'ind_urg', category: 'URGENCY_PRESSURE', severity: 'HIGH', name: 'Imminent Legal Action' }),
    ];

    const profile = analyzeTacticProfile(indicators);
    expect(profile.tacticCount).toBeGreaterThanOrEqual(1);

    const authTactic = profile.allTactics.find((t) => t.id === 'TAC_AUTH_PRESSURE');
    expect(authTactic).toBeDefined();
    expect(authTactic?.name).toBe('Authority-Pressure Manipulation');
    expect(authTactic?.constituentIndicatorIds).toContain('ind_imp');
    expect(authTactic?.constituentIndicatorIds).toContain('ind_urg');
    expect(authTactic?.patternDescription).toContain('Pattern consistent with');
  });

  it('detects Pressure-Driven Credential Harvesting (TAC_COERCIVE_CRED_HARVEST)', () => {
    const indicators: ObservedIndicator[] = [
      makeIndicator({ id: 'ind_threat', category: 'ACCOUNT_THREAT', severity: 'HIGH', name: 'Account Suspension Threat' }),
      makeIndicator({ id: 'ind_cred', category: 'CREDENTIAL_HARVESTING', severity: 'CRITICAL', name: 'Direct OTP Request' }),
    ];

    const profile = analyzeTacticProfile(indicators);
    const credTactic = profile.allTactics.find((t) => t.id === 'TAC_COERCIVE_CRED_HARVEST');
    expect(credTactic).toBeDefined();
    expect(credTactic?.severity).toBe('CRITICAL');
    expect(credTactic?.targetedVulnerability).toContain('cognitive panic');
    expect(credTactic?.constituentIndicatorIds).toContain('ind_threat');
    expect(credTactic?.constituentIndicatorIds).toContain('ind_cred');
  });

  it('detects Trust-Transfer Payment Extraction (TAC_TRUST_PAYMENT)', () => {
    const indicators: ObservedIndicator[] = [
      makeIndicator({ id: 'ind_bank', category: 'IMPERSONATION', severity: 'HIGH', name: 'Bank Security Impersonation' }),
      makeIndicator({ id: 'ind_gift', category: 'FINANCIAL_COERCION', severity: 'CRITICAL', name: 'Gift Card Demands' }),
    ];

    const profile = analyzeTacticProfile(indicators);
    const payTactic = profile.allTactics.find((t) => t.id === 'TAC_TRUST_PAYMENT');
    expect(payTactic).toBeDefined();
    expect(payTactic?.severity).toBe('CRITICAL');
    expect(payTactic?.name).toBe('Trust-Transfer Payment Extraction');
  });

  it('detects Windfall Bait & Advance-Fee Extraction (TAC_WINDFALL_ADVANCE_FEE)', () => {
    const indicators: ObservedIndicator[] = [
      makeIndicator({ id: 'ind_win', category: 'PRIZE_LOTTERY', severity: 'HIGH', name: 'Unsolicited Prize' }),
      makeIndicator({ id: 'ind_fee', category: 'FINANCIAL_COERCION', severity: 'HIGH', name: 'Advance Clearance Fee' }),
    ];

    const profile = analyzeTacticProfile(indicators);
    const prizeTactic = profile.allTactics.find((t) => t.id === 'TAC_WINDFALL_ADVANCE_FEE');
    expect(prizeTactic).toBeDefined();
    expect(prizeTactic?.targetedVulnerability).toContain('reward expectation');
  });

  it('detects Communication Channel Diversion & Isolation (TAC_ISOLATION_DIVERSION)', () => {
    const indicators: ObservedIndicator[] = [
      makeIndicator({ id: 'ind_div', category: 'CHANNEL_DIVERSION', severity: 'HIGH', name: 'Telegram Recruitment Diversion' }),
      makeIndicator({ id: 'ind_pay', category: 'FINANCIAL_COERCION', severity: 'HIGH', name: 'Registration Fee' }),
    ];

    const profile = analyzeTacticProfile(indicators);
    const divTactic = profile.allTactics.find((t) => t.id === 'TAC_ISOLATION_DIVERSION');
    expect(divTactic).toBeDefined();
    expect(divTactic?.constituentIndicatorIds).toContain('ind_div');
    expect(divTactic?.constituentIndicatorIds).toContain('ind_pay');
  });

  it('detects Lookalike Delivery Redirection Trap (TAC_DECEPTIVE_DELIVERY) with URL summary', () => {
    const indicators: ObservedIndicator[] = [
      makeIndicator({ id: 'ind_imp_delivery_1', category: 'IMPERSONATION', severity: 'HIGH', name: 'USPS Redelivery Problem' }),
    ];
    const urls: UrlAnalysisSummary[] = [
      {
        url: 'https://usps-redelivery-portal.top/track',
        domain: 'usps-redelivery-portal.top',
        hostname: 'usps-redelivery-portal.top',
        isBareIp: false,
        isShortener: false,
        isPunycode: false,
        hasHomoglyph: false,
        tld: 'top',
        riskScore: 75,
        suspiciousFactorsCount: 3,
        reputationStatus: 'SUSPICIOUS',
      },
    ];

    const profile = analyzeTacticProfile(indicators, urls);
    const delivTactic = profile.allTactics.find((t) => t.id === 'TAC_DECEPTIVE_DELIVERY');
    expect(delivTactic).toBeDefined();
    expect(delivTactic?.constituentIndicatorIds).toContain('ind_imp_delivery_1');
  });

  it('correctly designates the highest severity tactic as primaryTactic', () => {
    const indicators: ObservedIndicator[] = [
      makeIndicator({ id: 'ind_imp', category: 'IMPERSONATION', severity: 'HIGH' }),
      makeIndicator({ id: 'ind_urg', category: 'URGENCY_PRESSURE', severity: 'HIGH' }),
      makeIndicator({ id: 'ind_cred', category: 'CREDENTIAL_HARVESTING', severity: 'CRITICAL' }),
    ];

    const profile = analyzeTacticProfile(indicators);
    expect(profile.primaryTactic).toBeDefined();
    expect(profile.primaryTactic?.severity).toBe('CRITICAL');
  });
});
