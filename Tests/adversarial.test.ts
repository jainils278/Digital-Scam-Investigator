import { describe, expect, it } from 'vitest';
import { detectIndicators } from '../Backend/src/services/detector.js';
import { normalizeForAnalysis } from '../Backend/src/services/normalizer.js';
import { calculateRiskAssessment } from '../Backend/src/services/risk_engine.js';
import { filterAndValidateIndicators } from '../Backend/src/services/validator.js';
import { ObservedIndicator } from '../Backend/src/types.js';

describe('Adversarial False-Positive & Quality Audit', () => {
  // 1. Benign OTP Context
  it('does NOT trigger OTP harvesting on warning "Never share your OTP with anyone"', () => {
    const text = 'Never share your OTP with anyone, even if they claim to be from your bank.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);
    const otpInd = indicators.find((i) => i.category === 'CREDENTIAL_HARVESTING');

    expect(otpInd).toBeUndefined();
  });

  // 2. Legitimate Urgency
  it('does NOT classify legitimate college assignment urgency as a scam', () => {
    const text = 'Please submit the college assignment within 24 hours.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);
    const assessment = calculateRiskAssessment(indicators, text.length);

    expect(indicators.length).toBe(0);
    expect(assessment.level).toBe('BENIGN');
    expect(assessment.score).toBe(0);
  });

  // 3. Legitimate Payment
  it('does NOT classify legitimate electricity bill as a scam', () => {
    const text = 'Your electricity bill is due tomorrow. Pay through the official utility website.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);
    const assessment = calculateRiskAssessment(indicators, text.length);

    expect(indicators.length).toBe(0);
    expect(assessment.level).toBe('BENIGN');
  });

  // 4. Legitimate Delivery Notification
  it('does NOT classify legitimate courier arrival notice as a delivery scam', () => {
    const text = 'Your parcel will arrive tomorrow. Track it through the official courier application.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);
    const feeInd = indicators.find((i) => i.id.startsWith('ind_fin_advance_fee'));

    expect(feeInd).toBeUndefined();
  });

  // 5. Security Education Context
  it('does NOT trigger credential harvesting on educational text about scams', () => {
    const text = 'Scammers often ask victims to provide passwords, PINs, and OTPs.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);
    const otpInd = indicators.find((i) => i.category === 'CREDENTIAL_HARVESTING');

    expect(otpInd).toBeUndefined();
  });

  // 6. Benign Personal WhatsApp Message
  it('does NOT classify benign personal message "message me on WhatsApp when you reach home" as channel diversion', () => {
    const text = 'Please message me on WhatsApp when you reach home.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);
    const divInd = indicators.find((i) => i.category === 'CHANNEL_DIVERSION');

    expect(divInd).toBeUndefined();
  });

  // 7. Suspicious Compound Attack
  it('accurately identifies compound indicators on high-risk banking smishing', () => {
    const text = 'URGENT: Your bank account will be suspended today. Verify your identity by sending the OTP to this number immediately.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);
    const { verifiedIndicators } = filterAndValidateIndicators(indicators, text, normalized);
    const assessment = calculateRiskAssessment(verifiedIndicators, text.length);

    expect(verifiedIndicators.length).toBeGreaterThanOrEqual(2);
    expect(['HIGH', 'CRITICAL']).toContain(assessment.level);
    expect(assessment.score).toBeGreaterThanOrEqual(70);

    // Verify all ranges align strictly with raw text
    for (const ind of verifiedIndicators) {
      const [start, end] = ind.characterRange;
      expect(text.slice(start, end)).toBe(ind.evidence);
    }
  });

  // 8. Ambiguous Package Notification
  it('handles ambiguous package message without forcing high certainty', () => {
    const text = 'Your package could not be delivered. Please contact customer support.';
    const normalized = normalizeForAnalysis(text);
    const indicators = detectIndicators(normalized);
    const assessment = calculateRiskAssessment(indicators, text.length);

    // Should NOT be CRITICAL or HIGH risk without payment or suspicious links
    expect(['BENIGN', 'LOW']).toContain(assessment.level);
    expect(assessment.evidenceStrength).not.toBe('SUBSTANTIAL');
  });

  // 9. AI Hallucination Rejection Guardrail
  it('strictly rejects fabricated AI indicators that do not exist in the raw input', () => {
    const text = 'Your package could not be delivered. Please contact customer support.';
    const normalized = normalizeForAnalysis(text);

    // Hallucinated AI indicator claiming a login link and OTP prompt exist
    const hallucinatedInd: ObservedIndicator = {
      id: 'ai_hallucinated_1',
      category: 'CREDENTIAL_HARVESTING',
      name: 'Phishing Login Link Claimed by Model',
      severity: 'CRITICAL',
      evidence: 'The message asks you to click a login link to verify your password',
      characterRange: [0, 65],
      explanation: 'Hallucination',
      whyItMatters: 'Hallucination',
      source: 'DETERMINISTIC',
    };

    const { verifiedIndicators, rejectedIndicators } = filterAndValidateIndicators(
      [hallucinatedInd],
      text,
      normalized
    );

    expect(verifiedIndicators.length).toBe(0);
    expect(rejectedIndicators.length).toBe(1);
    expect(rejectedIndicators[0].indicator.id).toBe('ai_hallucinated_1');
  });
});

