import { describe, it, expect } from 'vitest';
import { assessEvidentiaryCompleteness } from '../Backend/src/services/intelligence/missing_evidence_advisor.js';
import { normalizeForAnalysis } from '../Backend/src/services/normalizer.js';
import { detectIndicators } from '../Backend/src/services/detector.js';
import { calculateRiskAssessment } from '../Backend/src/services/risk_engine.js';

describe('Phase 5 — Missing Evidence & Completeness Advisor', () => {
  it('detects SENDER_IDENTITY missing when raw headers are absent', () => {
    const text = 'Urgent: Your account is suspended. Call customer support now to verify.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const advisor = assessEvidentiaryCompleteness(text, indicators, []);

    expect(advisor.missingEvidenceItems.some((i) => i.category === 'SENDER_IDENTITY')).toBe(true);
    const senderItem = advisor.missingEvidenceItems.find((i) => i.category === 'SENDER_IDENTITY');
    expect(senderItem?.whatIsMissing).toContain('DKIM');
    expect(senderItem?.whyUnavailable).toContain('body text only');
    expect(senderItem?.safeVerificationGuidance).toContain('headers');
    expect(senderItem?.analyticalSignificance).toContain('Could materially verify');
  });

  it('detects DESTINATION_INFRASTRUCTURE missing when URLs are present in text', () => {
    const text = 'USPS: Package on hold. Pay redelivery fee at https://usps-parcel-tracking.com.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const advisor = assessEvidentiaryCompleteness(text, indicators, []);

    expect(advisor.missingEvidenceItems.some((i) => i.category === 'DESTINATION_INFRASTRUCTURE')).toBe(true);
    const urlItem = advisor.missingEvidenceItems.find((i) => i.category === 'DESTINATION_INFRASTRUCTURE');
    expect(urlItem?.whyUnavailable).toContain('passive mode');
    expect(urlItem?.safeVerificationGuidance).toContain('WHOIS');
  });

  it('detects TRANSACTION_AUDIT missing when financial claim or debt is asserted', () => {
    const text = 'SECURITY ALERT: An unauthorized transaction was attempted on your account. Call immediately to reverse.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const advisor = assessEvidentiaryCompleteness(text, indicators, []);

    expect(advisor.missingEvidenceItems.some((i) => i.category === 'TRANSACTION_AUDIT')).toBe(true);
    const txItem = advisor.missingEvidenceItems.find((i) => i.category === 'TRANSACTION_AUDIT');
    expect(txItem?.whatIsMissing).toContain('banking');
    expect(txItem?.safeVerificationGuidance).toContain('card');
  });

  it('detects MESSAGE_CONTEXT missing for brief or isolated snippets', () => {
    const text = 'Send your OTP code now.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const advisor = assessEvidentiaryCompleteness(text, indicators, []);

    expect(advisor.missingEvidenceItems.some((i) => i.category === 'MESSAGE_CONTEXT')).toBe(true);
    const contextItem = advisor.missingEvidenceItems.find((i) => i.category === 'MESSAGE_CONTEXT');
    expect(contextItem?.whatIsMissing).toContain('thread history');
  });

  it('detects ORIGINAL_CHANNEL missing when communication diversion is attempted', () => {
    const text = 'This is HR. Contact our recruiter on Telegram username: @remote_hiring_auth.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const advisor = assessEvidentiaryCompleteness(text, indicators, []);

    expect(advisor.missingEvidenceItems.some((i) => i.category === 'ORIGINAL_CHANNEL')).toBe(true);
    const divItem = advisor.missingEvidenceItems.find((i) => i.category === 'ORIGINAL_CHANNEL');
    expect(divItem?.safeVerificationGuidance).toContain('Refuse to move');
  });

  it('INVARIANT: Missing evidence assessment NEVER alters the deterministic risk score', () => {
    const text = 'Your account will be suspended within 24 hours. Reply with your OTP passcode.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    // Calculate risk score independently
    const riskBefore = calculateRiskAssessment(indicators);

    // Run missing evidence advisor
    const advisor = assessEvidentiaryCompleteness(text, indicators, []);

    // Calculate risk score after advisor execution
    const riskAfter = calculateRiskAssessment(indicators);

    expect(riskBefore.score).toBe(riskAfter.score);
    expect(riskBefore.tier).toBe(riskAfter.tier);
    expect(advisor.completenessScore).toBeDefined();
    // Completeness score does NOT equate to risk score
    expect(advisor.completenessScore).not.toBe(riskBefore.score);
  });

  it('INVARIANT: Analytical significance describes interpretive importance, NEVER promising numeric score changes', () => {
    const text = 'URGENT: Settle toll balance due immediately via bitcoin at https://suspicious-toll.info.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const advisor = assessEvidentiaryCompleteness(text, indicators, []);

    for (const item of advisor.missingEvidenceItems) {
      expect(item.analyticalSignificance).not.toMatch(/[-+]\d+\s*(?:points|pts|score)/i);
      expect(item.analyticalSignificance).not.toMatch(/drop\s+by\s+\d+/i);
      expect(item.analyticalSignificance).not.toMatch(/increase\s+by\s+\d+/i);
      expect(item.analyticalSignificance.length).toBeGreaterThan(15);
    }
  });

  it('includes mandatory disclaimer that missing evidence does not prove safety', () => {
    const text = 'Hi friend, here is a cool link to check out.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const advisor = assessEvidentiaryCompleteness(text, indicators, []);

    expect(advisor.advisoryNote).toContain(
      'Missing evidence reflects limitations of the submitted material, not proof of sender authenticity'
    );
  });
});
