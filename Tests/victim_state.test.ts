import { describe, expect, it } from 'vitest';
import { generateVictimStateResponse } from '../Backend/src/services/incident_response.js';
import { calculateRiskAssessment } from '../Backend/src/services/risk_engine.js';
import type { ObservedIndicator, VictimState } from '../Backend/src/types.js';

describe('V3.1 Victim-State Response Engine', () => {
  const allStates: VictimState[] = [
    'RECEIVED_MESSAGE_ONLY',
    'CLICKED_LINK',
    'ENTERED_CREDENTIALS',
    'DISCLOSED_OTP_OR_AUTH_CODE',
    'PROVIDED_PERSONAL_INFORMATION',
    'SENT_MONEY',
    'INSTALLED_SOFTWARE_OR_APP',
    'SHARED_SCREEN_OR_REMOTE_ACCESS',
    'UNKNOWN_STATE',
  ];

  it('generates structured response guidance for every recognized victim state', () => {
    for (const state of allStates) {
      const response = generateVictimStateResponse(state);
      expect(response.declaredState).toBe(state);
      expect(response.stateLabel).toBeDefined();
      expect(response.stateLabel.length).toBeGreaterThan(0);
      expect(response.containmentUrgency).toMatch(/^(CRITICAL_CONTAINMENT|ACTIVE_CONTAINMENT|PREVENTATIVE)$/);
      expect(response.containmentSteps.length).toBeGreaterThan(0);
      expect(response.evidencePreservationGuide).toBeDefined();
      expect(response.evidencePreservationGuide.length).toBeGreaterThan(0);
      expect(response.reportingChannels.length).toBeGreaterThan(0);

      // Verify each containment step has structured numbering and urgency
      response.containmentSteps.forEach((step, idx) => {
        expect(step.stepNumber).toBe(idx + 1);
        expect(step.title).toBeDefined();
        expect(step.detail).toBeDefined();
        expect(step.urgency).toMatch(/^(IMMEDIATE_ACTION|WITHIN_1_HOUR|WITHIN_24_HOURS)$/);
        expect(step.category).toMatch(/^(CONTAINMENT|AUTHENTICATION|FINANCIAL|LEGAL_REPORTING)$/);
      });
    }
  });

  it('defaults to UNKNOWN_STATE when state is undefined or unrecognized', () => {
    const resUndefined = generateVictimStateResponse(undefined);
    expect(resUndefined.declaredState).toBe('UNKNOWN_STATE');
    expect(resUndefined.containmentUrgency).toBe('PREVENTATIVE');

    // @ts-expect-error Testing invalid input at runtime
    const resInvalid = generateVictimStateResponse('NON_EXISTENT_STATE');
    expect(resInvalid.declaredState).toBe('UNKNOWN_STATE');
  });

  it('assigns CRITICAL_CONTAINMENT urgency to high-exposure states', () => {
    const criticalStates: VictimState[] = [
      'ENTERED_CREDENTIALS',
      'DISCLOSED_OTP_OR_AUTH_CODE',
      'SENT_MONEY',
      'INSTALLED_SOFTWARE_OR_APP',
      'SHARED_SCREEN_OR_REMOTE_ACCESS',
    ];

    for (const state of criticalStates) {
      const response = generateVictimStateResponse(state);
      expect(response.containmentUrgency).toBe('CRITICAL_CONTAINMENT');
      // At least one step must be IMMEDIATE_ACTION
      expect(response.containmentSteps.some((s) => s.urgency === 'IMMEDIATE_ACTION')).toBe(true);
    }
  });

  it('provides financial recovery protocols and evidence preservation for SENT_MONEY state', () => {
    const response = generateVictimStateResponse('SENT_MONEY');
    expect(response.containmentUrgency).toBe('CRITICAL_CONTAINMENT');

    const stepTitles = response.containmentSteps.map((s) => s.title);
    expect(stepTitles.some((t) => t.includes('Financial Institution'))).toBe(true);

    expect(response.evidencePreservationGuide).toContain('receipts');
    expect(response.reportingChannels.some((c) => c.channelType === 'BANK')).toBe(true);
    expect(response.reportingChannels.some((c) => c.channelType === 'LAW_ENFORCEMENT')).toBe(true);
  });

  it('maintains strict jurisdiction neutrality in response guidance', () => {
    for (const state of allStates) {
      const response = generateVictimStateResponse(state);
      // Guidance must not hardcode regional police names (e.g. "FBI", "Scotland Yard", "CBI", "1930")
      const serialized = JSON.stringify(response);
      expect(serialized).not.toContain('FBI');
      expect(serialized).not.toContain('Scotland Yard');
      expect(serialized).not.toContain('CBI');
      expect(serialized).not.toContain('IC3');
    }
  });

  it('does NOT alter deterministic risk assessment or verified indicators', () => {
    const indicators: ObservedIndicator[] = [
      {
        id: 'ind_1',
        category: 'CREDENTIAL_HARVESTING',
        name: 'Credential Solicitation',
        severity: 'CRITICAL',
        evidence: 'Submit your passcode',
        characterRange: [0, 20],
        explanation: 'Test',
        whyItMatters: 'Test',
        source: 'DETERMINISTIC',
      },
    ];

    const baseline = calculateRiskAssessment(indicators, 100);
    const scoreBefore = baseline.score;
    const levelBefore = baseline.level;

    // Simulate response generation for different victim states
    generateVictimStateResponse('SENT_MONEY');
    generateVictimStateResponse('RECEIVED_MESSAGE_ONLY');

    const assessmentAfter = calculateRiskAssessment(indicators, 100);
    expect(assessmentAfter.score).toBe(scoreBefore);
    expect(assessmentAfter.level).toBe(levelBefore);
    expect(indicators).toHaveLength(1);
  });
});
