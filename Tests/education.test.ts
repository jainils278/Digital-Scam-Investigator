import { describe, expect, it } from 'vitest';
import { generateEvidenceEducation } from '../Backend/src/services/education/education_engine.js';
import { ObservedIndicator } from '../Backend/src/types.js';

describe('Phase 6 — Evidence-Grounded Cybersecurity Education Engine', () => {
  it('generates educational modules strictly grounded in detected indicators', () => {
    const indicators: ObservedIndicator[] = [
      {
        id: 'ind_otp_1',
        category: 'CREDENTIAL_HARVESTING',
        name: 'Direct OTP Request',
        severity: 'CRITICAL',
        evidence: 'reply with your OTP passcode',
        characterRange: [10, 38],
        explanation: 'OTP demand',
        whyItMatters: '2FA bypass',
        source: 'DETERMINISTIC',
      },
      {
        id: 'ind_urg_1',
        category: 'URGENCY_PRESSURE',
        name: 'Artificial Urgency Deadline',
        severity: 'HIGH',
        evidence: 'within 2 hours or your account will be closed',
        characterRange: [40, 85],
        explanation: 'Deadline pressure',
        whyItMatters: 'Panic inducement',
        source: 'DETERMINISTIC',
      },
    ];

    const briefing = generateEvidenceEducation(indicators);

    expect(briefing.modules.length).toBe(2);

    const otpModule = briefing.modules.find((m) => m.category === 'CREDENTIAL_HARVESTING');
    expect(otpModule).toBeDefined();
    expect(otpModule?.title).toContain('One-Time Passcode (OTP)');
    expect(otpModule?.tacticName).toContain('Authentication Bypass');
    expect(otpModule?.attackerPlaybook.length).toBeGreaterThanOrEqual(3);
    expect(otpModule?.ruleOfThumb.length).toBeGreaterThan(15);
    expect(otpModule?.groundedInIndicatorId).toBe('ind_otp_1');

    const urgModule = briefing.modules.find((m) => m.category === 'URGENCY_PRESSURE');
    expect(urgModule).toBeDefined();
    expect(urgModule?.title).toContain('Artificial Urgency');
    expect(urgModule?.tacticName).toContain('Cognitive Overload');
    expect(urgModule?.psychologicalMechanism).toContain('deliberate analytical thinking');
  });

  it('never hallucinates or manufactures unobserved attack categories', () => {
    // Message only contains gift cards, no lottery or channel diversion
    const indicators: ObservedIndicator[] = [
      {
        id: 'ind_gift_1',
        category: 'FINANCIAL_COERCION',
        name: 'Gift Card Coercion',
        severity: 'CRITICAL',
        evidence: 'pay fine with Apple gift cards',
        characterRange: [0, 30],
        explanation: 'Gift cards demand',
        whyItMatters: 'Untraceable payment',
        source: 'DETERMINISTIC',
      },
    ];

    const briefing = generateEvidenceEducation(indicators);

    expect(briefing.modules.length).toBe(1);
    expect(briefing.modules[0].category).toBe('FINANCIAL_COERCION');

    // Verify unobserved categories are completely omitted
    const categories = briefing.modules.map((m) => m.category);
    expect(categories).not.toContain('PRIZE_LOTTERY');
    expect(categories).not.toContain('CHANNEL_DIVERSION');
    expect(categories).not.toContain('CREDENTIAL_HARVESTING');
  });

  it('provides general hygiene guidance for benign messages without inventing attacks', () => {
    const briefing = generateEvidenceEducation([]);

    expect(briefing.modules.length).toBe(0);
    expect(briefing.generalHygieneAdvice.length).toBeGreaterThanOrEqual(2);
    expect(briefing.summary.toLowerCase()).toContain('no scam manipulation tactics were detected');
  });
});
