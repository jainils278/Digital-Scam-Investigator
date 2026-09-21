import { describe, expect, it } from 'vitest';
import { detectIndicators } from '../Backend/src/services/detector.js';
import { normalizeForAnalysis } from '../Backend/src/services/normalizer.js';

describe('Deterministic Detection Engine', () => {
  it('detects direct OTP harvesting demands with verbatim evidence', () => {
    const raw = 'WELLS FARGO: Please reply with your OTP verification code to cancel unauthorized transaction.';
    const normalized = normalizeForAnalysis(raw);
    const indicators = detectIndicators(normalized);

    const otpInd = indicators.find((i) => i.category === 'CREDENTIAL_HARVESTING');
    expect(otpInd).toBeDefined();
    expect(otpInd?.severity).toBe('CRITICAL');
    expect(raw.slice(otpInd!.characterRange[0], otpInd!.characterRange[1])).toBe(otpInd?.evidence);
    expect(otpInd?.evidence.toLowerCase()).toContain('reply with your otp');
  });

  it('detects gift card payment coercion', () => {
    const raw = 'Pay your fine immediately. You must pay with Apple gift cards or face arrest.';
    const normalized = normalizeForAnalysis(raw);
    const indicators = detectIndicators(normalized);

    const giftCardInd = indicators.find((i) => i.id.startsWith('ind_fin_gift_cards'));
    expect(giftCardInd).toBeDefined();
    expect(giftCardInd?.severity).toBe('CRITICAL');
    expect(giftCardInd?.evidence.toLowerCase()).toContain('pay with apple gift cards');
  });

  it('detects courier impersonation with advance redelivery fee', () => {
    const raw = 'USPS: Package delivery failure. A delivery fee of $2.99 is required to schedule redelivery.';
    const normalized = normalizeForAnalysis(raw);
    const indicators = detectIndicators(normalized);

    const courierInd = indicators.find((i) => i.category === 'IMPERSONATION');
    const feeInd = indicators.find((i) => i.id.startsWith('ind_fin_advance_fee'));

    expect(courierInd).toBeDefined();
    expect(feeInd).toBeDefined();
    expect(feeInd?.evidence.toLowerCase()).toContain('delivery fee of $2.99');
  });

  it('detects off-platform communication diversion', () => {
    const raw = 'Our HR recruiter wants to interview you. Contact our agent on Telegram username: @RecruitHr';
    const normalized = normalizeForAnalysis(raw);
    const indicators = detectIndicators(normalized);

    const divInd = indicators.find((i) => i.category === 'CHANNEL_DIVERSION');
    expect(divInd).toBeDefined();
    expect(divInd?.severity).toBe('HIGH');
  });

  it('correctly handles benign message with ZERO false positives', () => {
    const benignText = 'Hi Mom, I will be home around 6pm for dinner. Can you please save me a plate? Love you!';
    const normalized = normalizeForAnalysis(benignText);
    const indicators = detectIndicators(normalized);

    expect(indicators.length).toBe(0);
  });

  it('correctly handles legitimate business meeting deadline without false alarm', () => {
    const meetingText = 'Hi team, please review the presentation slides before 5 PM today so we can finalize the review for tomorrow morning’s meeting.';
    const normalized = normalizeForAnalysis(meetingText);
    const indicators = detectIndicators(normalized);

    expect(indicators.length).toBe(0);
  });

  describe('V2.1 Coverage & Word Boundary Regressions', () => {
    // 1. ETH word-boundary regression
    it('proves "method" and "whether" do NOT produce crypto evidence, but standalone ETH with context does', () => {
      const methodText = 'Your subscription payment failed. Please update your payment method.';
      const whetherText = 'Please confirm whether you made this purchase.';
      const cryptoText = 'Send 2.5 ETH to this wallet address: 0x71C837057774E9923835e236319888Ebb1123456';

      const normMethod = normalizeForAnalysis(methodText);
      const normWhether = normalizeForAnalysis(whetherText);
      const normCrypto = normalizeForAnalysis(cryptoText);

      const indMethod = detectIndicators(normMethod);
      const indWhether = detectIndicators(normWhether);
      const indCrypto = detectIndicators(normCrypto);

      // Neither "method" nor "whether" may trigger crypto indicators
      expect(indMethod.some((i) => i.id.startsWith('ind_fin_crypto'))).toBe(false);
      expect(indWhether.some((i) => i.id.startsWith('ind_fin_crypto'))).toBe(false);

      // Standalone ETH with address/wallet produces valid crypto indicator
      const cryptoInd = indCrypto.find((i) => i.id.startsWith('ind_fin_crypto'));
      expect(cryptoInd).toBeDefined();
      expect(cryptoInd?.severity).toBe('HIGH');
    });

    // 2. Compositional credential detection
    it('detects compositional credential solicitation with various actions and targets', () => {
      const text = 'Please submit your login credentials to verify access.';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const credInd = indicators.find((i) => i.category === 'CREDENTIAL_HARVESTING');
      expect(credInd).toBeDefined();
      expect(credInd?.evidence.toLowerCase()).toContain('submit your login credentials');
    });

    // 3. UPI PIN
    it('detects UPI PIN requests with intervening word modifiers', () => {
      const text = 'Confirm your UPI PIN within 10 minutes to receive the refund.';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const pinInd = indicators.find((i) => i.id.startsWith('ind_cred_otp'));
      expect(pinInd).toBeDefined();
      expect(pinInd?.evidence.toLowerCase()).toContain('confirm your upi pin');
      expect(pinInd?.severity).toBe('CRITICAL');
    });

    // 4. Login password
    it('detects password solicitation with intervening words like "login password"', () => {
      const text = 'Send your login password and OTP here so we can verify your identity.';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const passInd = indicators.find((i) => i.id.startsWith('ind_cred_otp'));
      expect(passInd).toBeDefined();
      expect(passInd?.evidence.toLowerCase()).toContain('send your login password');
    });

    // 5. Gift cards with currency/amount
    it('detects gift card payment demands with intervening amounts and currency symbols', () => {
      const text = 'To protect your balance, purchase ₹20,000 in gift cards immediately.';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const giftInd = indicators.find((i) => i.id.startsWith('ind_fin_gift_cards'));
      expect(giftInd).toBeDefined();
      expect(giftInd?.evidence.toLowerCase()).toContain('purchase ₹20,000 in gift cards');
      expect(giftInd?.severity).toBe('CRITICAL');
    });

    // 6. ₹ delivery fee
    it('detects redelivery and delivery fees denominated in rupees', () => {
      const text = 'Pay ₹25 redelivery charges today to reschedule delivery.';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const feeInd = indicators.find((i) => i.id.startsWith('ind_fin_advance_fee'));
      expect(feeInd).toBeDefined();
      expect(feeInd?.evidence.toLowerCase()).toContain('pay ₹25 redelivery charges');
    });

    // 7. PAN blocking
    it('detects authority threat against PAN identity cards', () => {
      const text = 'Your PAN will be blocked tonight due to unpaid dues.';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const threatInd = indicators.find((i) => i.id.startsWith('ind_threat_suspension'));
      expect(threatInd).toBeDefined();
      expect(threatInd?.evidence.toLowerCase()).toContain('pan will be blocked');
    });

    // 8. Electricity disconnection
    it('detects power and electricity shutoff threats', () => {
      const text = 'FINAL NOTICE: Your electricity connection will be disconnected at 8 PM today.';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const utilInd = indicators.find((i) => i.id.startsWith('ind_threat_utility_shutoff'));
      expect(utilInd).toBeDefined();
      expect(utilInd?.evidence.toLowerCase()).toContain('electricity connection will be disconnected');
    });

    // 9. Work-from-home fee
    it('detects work-from-home recruitment advance registration charges', () => {
      const text = 'Your profile has been selected for a work-from-home position. Pay ₹2,000 registration charges to start.';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const jobInd = indicators.find((i) => i.id.startsWith('ind_lure_job'));
      const feeInd = indicators.find((i) => i.id.startsWith('ind_fin_advance_fee'));

      expect(jobInd).toBeDefined();
      expect(feeInd).toBeDefined();
      expect(feeInd?.evidence.toLowerCase()).toContain('pay ₹2,000 registration charges');
    });

    // 10. Guaranteed investment returns
    it('detects guaranteed return claims and high-yield investment fraud lures', () => {
      const text = 'Invest ₹10,000 today and receive guaranteed returns of ₹25,000 within 7 days. Limited slots available.';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const investInd = indicators.find((i) => i.id.startsWith('ind_fin_investment_fraud'));
      const scarcityInd = indicators.find((i) => i.id.startsWith('ind_urg_scarcity'));

      expect(investInd).toBeDefined();
      expect(scarcityInd).toBeDefined();
      expect(investInd?.evidence.toLowerCase()).toContain('guaranteed returns');
    });

    // 11. Reverse-call transaction lure
    it('detects reverse-call transaction fraud lures with phone numbers', () => {
      const text = 'A ₹48,999 transaction was attempted on your account. Call 9876543210 immediately to secure your funds.';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const txInd = indicators.find((i) => i.id.startsWith('ind_imp_tx_alert'));
      const callInd = indicators.find((i) => i.id.startsWith('ind_lure_reverse_call'));
      const secureInd = indicators.find((i) => i.id.startsWith('ind_fin_secure_funds'));

      expect(txInd).toBeDefined();
      expect(callInd).toBeDefined();
      expect(secureInd).toBeDefined();
      expect(callInd?.evidence.toLowerCase()).toContain('call 9876543210 immediately');
    });

    // 12. Subscription cancellation lure
    it('detects fake subscription renewal with immediate cancellation phone lure', () => {
      const text = 'Your antivirus subscription will automatically renew for ₹9,999 today. Call 1800-000-000 immediately to cancel and receive your refund.';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const invoiceInd = indicators.find((i) => i.id.startsWith('ind_fin_fake_invoice'));
      const callInd = indicators.find((i) => i.id.startsWith('ind_lure_reverse_call'));
      const refundInd = indicators.find((i) => i.id.startsWith('ind_fin_refund_lure'));

      expect(invoiceInd).toBeDefined();
      expect(callInd).toBeDefined();
      expect(refundInd).toBeDefined();
    });

    // 13. Toll penalty deadline
    it('detects highway toll penalty threats with deadlines to avoid penalties', () => {
      const text = 'Outstanding highway toll: ₹180. Pay within 2 hours to avoid additional penalties: http://toll-payment.example';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const tollInd = indicators.find((i) => i.id.startsWith('ind_fin_toll_debt'));
      const penaltyInd = indicators.find((i) => i.id.startsWith('ind_urg_consequence'));

      expect(tollInd).toBeDefined();
      expect(penaltyInd).toBeDefined();
      expect(penaltyInd?.evidence.toLowerCase()).toContain('within 2 hours to avoid additional penalties');
    });

    // 14. Credential harvesting combinations
    it('detects compound credential harvesting combinations (password, card number, OTP)', () => {
      const text = 'Click the link below and enter your password, card number and OTP to prevent account closure: http://verify-account.example';
      const normalized = normalizeForAnalysis(text);
      const indicators = detectIndicators(normalized);

      const otpInd = indicators.find((i) => i.id.startsWith('ind_cred_otp'));
      const multiInd = indicators.find((i) => i.id.startsWith('ind_cred_multi_harvest'));
      const closureInd = indicators.find((i) => i.id.startsWith('ind_threat_suspension'));

      expect(otpInd).toBeDefined();
      expect(multiInd).toBeDefined();
      expect(closureInd).toBeDefined();
      expect(closureInd?.evidence.toLowerCase()).toContain('prevent account closure');
    });
  });
});

