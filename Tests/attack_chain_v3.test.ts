import { describe, it, expect } from 'vitest';
import { buildInvestigationTimeline } from '../Backend/src/services/intelligence/evidence_graph.js';
import { normalizeForAnalysis } from '../Backend/src/services/normalizer.js';
import { detectIndicators } from '../Backend/src/services/detector.js';

describe('Phase 4 — 6-Stage Attack Chain Engine', () => {
  it('constructs a multi-stage attack sequence with distinct stages and non-fabricated progression', () => {
    // Message combining delivery lure (Hook), authority pretext (Trust), urgency (Pressure), action link (Exploitation)
    const text = 'USPS: Package on hold due to address issues. Urgent: Act now before midnight to prevent return. Pay with $3.50 redelivery fee at https://usps-redelivery-portal.com.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const timeline = buildInvestigationTimeline(indicators, text);

    expect(timeline.length).toBeGreaterThanOrEqual(3);

    // Verify ordering
    for (let i = 0; i < timeline.length; i++) {
      expect(timeline[i].stepIndex).toBe(i + 1);
    }

    const stages = timeline.map((s) => s.stage);
    expect(stages).toContain('HOOK');
    expect(stages).toContain('PRESSURE');
    expect(stages).toContain('EXPLOITATION');
    expect(stages).toContain('POTENTIAL_IMPACT');
  });

  it('marks Stage 6 POTENTIAL_IMPACT strictly as PROJECTED_CONSEQUENCE, never as an actual observed event', () => {
    const text = 'Your Wells Fargo account is suspended. Reply with your OTP passcode immediately.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const timeline = buildInvestigationTimeline(indicators, text);
    const impactStep = timeline.find((s) => s.stage === 'POTENTIAL_IMPACT');

    expect(impactStep).toBeDefined();
    expect(impactStep?.observedOrInferred).toBe('PROJECTED_CONSEQUENCE');

    // Negative constraints: Must NOT claim actual loss, theft, or hijacking has occurred
    const desc = impactStep!.description.toLowerCase();
    expect(desc).toContain('potential consequence');
    expect(desc).not.toContain('session hijacking occurred');
    expect(desc).not.toContain('the victim lost money');
    expect(desc).not.toContain('credentials were harvested');
    expect(desc).not.toContain('account was hacked');
  });

  it('correctly maps gift card demands to financial loss potential consequence', () => {
    const text = 'IRS Notice: Unpaid taxes penalty. Pay with $1,000 in Apple gift cards immediately to avoid arrest warrant.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const timeline = buildInvestigationTimeline(indicators, text);
    const impactStep = timeline.find((s) => s.stage === 'POTENTIAL_IMPACT');

    expect(impactStep).toBeDefined();
    expect(impactStep?.observedOrInferred).toBe('PROJECTED_CONSEQUENCE');
    expect(impactStep?.description).toContain('financial loss if payment');
  });

  it('preserves partial attack chains without fabricating missing intermediate stages', () => {
    // Only pressure and OTP exploitation — NO hook or prize lure
    const text = 'URGENT: Act now within 10 minutes to avoid account closure. Enter your login OTP.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const timeline = buildInvestigationTimeline(indicators, text);
    const stages = timeline.map((s) => s.stage);

    // Should contain PRESSURE and EXPLOITATION, but NOT HOOK or TRUST_AUTHORITY
    expect(stages).toContain('PRESSURE');
    expect(stages).toContain('EXPLOITATION');
    expect(stages).not.toContain('HOOK');
    expect(stages).not.toContain('TRUST_AUTHORITY');

    // Observed steps must have evidenceQuote and indicatorId
    const observedSteps = timeline.filter((s) => s.observedOrInferred === 'OBSERVED');
    for (const step of observedSteps) {
      expect(step.evidenceQuote).toBeDefined();
      expect(step.indicatorId).toBeDefined();
    }
  });

  it('handles benign messages with a single Baseline Message Scan completed entry', () => {
    const text = 'Hey Sarah, lunch at the café tomorrow at 1:00 PM still works for me!';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const timeline = buildInvestigationTimeline(indicators, text);

    expect(timeline).toHaveLength(1);
    expect(timeline[0].stage).toBe('HOOK');
    expect(timeline[0].title).toContain('Baseline Message Scan Completed');
    expect(timeline[0].observedOrInferred).toBe('OBSERVED');
    expect(timeline[0].description).toContain('No multi-stage coercive manipulation sequence');
  });

  it('maintains backwards compatibility with existing stage assertions', () => {
    const text = 'Your account will be blocked. Settle your outstanding bill immediately via bitcoin to 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const timeline = buildInvestigationTimeline(indicators, text);
    const stages = timeline.map((s) => s.stage);

    expect(stages).toContain('PRESSURE');
    expect(stages).toContain('EXPLOITATION');
  });
});
