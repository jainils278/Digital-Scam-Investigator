import { describe, it, expect } from 'vitest';
import { analyzeContradictions } from '../Backend/src/services/intelligence/contradiction_engine.js';
import { normalizeForAnalysis } from '../Backend/src/services/normalizer.js';
import { detectIndicators } from '../Backend/src/services/detector.js';

describe('Phase 3 — Pretext Contradiction Matrix Engine', () => {
  it('detects CONTRADICTION for Government/Tax Authority + Gift Card payment', () => {
    const text = 'INTERNAL REVENUE SERVICE: Urgent summons issued against you. Pay with $500 Apple gift cards within 24 hours to avoid arrest warrant.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const result = analyzeContradictions(indicators, [], text);

    expect(result.hasContradictions).toBe(true);
    expect(result.contradictionsCount).toBeGreaterThanOrEqual(1);

    const govFinding = result.findings.find((f) => f.ruleId === 'CONTR_GOV_GIFTCARD');
    expect(govFinding).toBeDefined();
    expect(govFinding?.classification).toBe('CONTRADICTION');
    expect(govFinding?.claimedPretext).toContain('Government');
    expect(govFinding?.conflictingEvidence).toContain('gift card');
    expect(govFinding?.explanation).toContain('inconsistent with the expected official-channel pattern');
    expect(govFinding?.sourceIndicatorIds.length).toBeGreaterThanOrEqual(2);
  });

  it('detects CONTRADICTION for Bank Impersonation + Gift Card payment', () => {
    const text = 'CHASE BANK: Security Alert. To protect your account, purchase $200 in Google Play cards immediately.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const result = analyzeContradictions(indicators, [], text);

    expect(result.hasContradictions).toBe(true);
    const bankFinding = result.findings.find((f) => f.ruleId === 'CONTR_BANK_GIFTCARD');
    expect(bankFinding).toBeDefined();
    expect(bankFinding?.classification).toBe('CONTRADICTION');
    expect(bankFinding?.claimedPretext).toContain('Financial Institution');
    expect(bankFinding?.conflictingEvidence).toContain('gift card');
    expect(bankFinding?.explanation).toContain('inconsistent with the expected official-channel pattern');
  });

  it('detects CONTRADICTION for Brand Pretext + Lookalike Phishing Domain', () => {
    const text = 'USPS: Delivery Failure notice. Your package is on hold. Visit https://usps-redelivery-portal.com to reschedule.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const result = analyzeContradictions(indicators, [], text);

    expect(result.hasContradictions).toBe(true);
    const domainFinding = result.findings.find((f) => f.ruleId === 'CONTR_BRAND_LOOKALIKE_DOMAIN');
    expect(domainFinding).toBeDefined();
    expect(domainFinding?.classification).toBe('CONTRADICTION');
    expect(domainFinding?.claimedPretext).toContain('Brand');
    expect(domainFinding?.conflictingEvidence).toContain('unverified third-party or typosquatted');
  });

  it('detects ANOMALY for Support/Security Pretext + Off-Platform Channel Diversion', () => {
    const text = 'This is the security team from your bank. Contact our agent on Telegram username: @support_desk_auth immediately.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const result = analyzeContradictions(indicators, [], text);

    expect(result.hasContradictions).toBe(true);
    const supportFinding = result.findings.find((f) => f.ruleId === 'ANOM_SUPPORT_CHANNEL_DIVERSION');
    expect(supportFinding).toBeDefined();
    expect(supportFinding?.classification).toBe('ANOMALY');
    expect(supportFinding?.claimedPretext).toContain('Support');
    expect(supportFinding?.conflictingEvidence).toContain('Off-platform diversion');
  });

  it('detects ANOMALY for Urgent Account Suspension + Generic Greeting', () => {
    const text = 'Dear customer, your account has been suspended due to policy violations. Act now within 2 hours to avoid closure.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const result = analyzeContradictions(indicators, [], text);

    expect(result.hasContradictions).toBe(true);
    const greetingFinding = result.findings.find((f) => f.ruleId === 'ANOM_URGENT_SUSPENSION_GENERIC_GREETING');
    expect(greetingFinding).toBeDefined();
    expect(greetingFinding?.classification).toBe('ANOMALY');
    expect(greetingFinding?.claimedPretext).toContain('Account Suspension');
    expect(greetingFinding?.conflictingEvidence).toContain('Impersonal generic greeting');
  });

  it('detects UNSUPPORTED_CLAIM for Unauthorized Transaction Alert without Account Metadata', () => {
    const text = 'SECURITY ALERT: An unauthorized transaction was attempted on your account. Call immediately to reverse.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const result = analyzeContradictions(indicators, [], text);

    expect(result.hasContradictions).toBe(true);
    const claimFinding = result.findings.find((f) => f.ruleId === 'UNSUPP_TRANSACTION_ALERT_CLAIM');
    expect(claimFinding).toBeDefined();
    expect(claimFinding?.classification).toBe('UNSUPPORTED_CLAIM');
    expect(claimFinding?.claimedPretext).toContain('Unauthorized Financial Debit');
    expect(claimFinding?.conflictingEvidence).toContain('Absence of verifiable transaction identifiers');
  });

  it('does NOT flag UNSUPPORTED_CLAIM if legitimate transaction metadata is present', () => {
    const text = 'SECURITY ALERT: An unauthorized transaction was attempted on your account ending in 4092. Reference #TX-987654.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const result = analyzeContradictions(indicators, [], text);

    const claimFinding = result.findings.find((f) => f.ruleId === 'UNSUPP_TRANSACTION_ALERT_CLAIM');
    expect(claimFinding).toBeUndefined();
  });

  it('returns clean zero-findings result for benign, legitimate messages', () => {
    const text = 'Hi Mom, are we still meeting for lunch tomorrow at 12:30 at the diner? Let me know!';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const result = analyzeContradictions(indicators, [], text);

    expect(result.hasContradictions).toBe(false);
    expect(result.totalFindings).toBe(0);
    expect(result.findings).toHaveLength(0);
    expect(result.summary).toContain('No contradictions');
  });

  it('uses defensible institutional wording across all rule explanations', () => {
    const text = 'INTERNAL REVENUE SERVICE: Pay with gift cards. Dear customer, call +18005550199 immediately about unauthorized transaction.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);

    const result = analyzeContradictions(indicators, [], text);

    for (const finding of result.findings) {
      expect(finding.explanation).toContain('inconsistent with the expected official-channel pattern');
      expect(finding.whyItMatters.length).toBeGreaterThan(15);
      expect(finding.sourceIndicatorIds.length).toBeGreaterThanOrEqual(1);
    }
  });
});
