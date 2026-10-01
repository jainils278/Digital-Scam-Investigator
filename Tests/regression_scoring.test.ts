import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../Backend/src/index.js';

describe('ScamVera V2.1 Core Regression Test Suite', () => {
  // Scenario 1: Bank impersonation + OTP request + urgency
  it('1. Flags Bank Impersonation + OTP Request + Urgency as CRITICAL (score >= 90)', async () => {
    const text = 'CHASE BANK ALERT: Unauthorized transfer detected. Reply with your OTP immediately.';
    const res = await request(app)
      .post('/api/investigate')
      .send({ text, messageType: 'sms' })
      .expect(200);

    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.riskAssessment.score).toBeGreaterThanOrEqual(90);
    expect(report.riskAssessment.level).toBe('CRITICAL');

    const indIds = report.observedIndicators.map((i: any) => i.id);
    expect(indIds.some((id: string) => id.startsWith('ind_cred_otp'))).toBe(true);
    expect(report.analysisMethod).toBeDefined();
    expect(report.analysisMethod.mode).toBe('LOCAL_ONLY');
    expect(report.analysisMethod.deterministicRules).toBe(true);
    expect(report.analysisMethod.localHeuristics).toBe(true);
    expect(report.analysisMethod.externalModelUsed).toBe(false);
    expect(report.analysisMethod.externalAttempted).toBe(false);
    expect(report.analysisMethod.fallbackUsed).toBe(false);
  });

  // Scenario 2: Courier impersonation + payment request + mismatched domain
  it('2. Flags Courier Impersonation + Payment Request + Mismatched Domain as HIGH or CRITICAL (score >= 80)', async () => {
    const text = 'Your package could not be delivered. Pay $2.99 now at https://usps-redelivery-portal.com to reschedule.';
    const res = await request(app)
      .post('/api/investigate')
      .send({ text, messageType: 'sms' })
      .expect(200);

    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.riskAssessment.score).toBeGreaterThanOrEqual(80);
    expect(['HIGH', 'CRITICAL']).toContain(report.riskAssessment.level);

    // Verify indicators for delivery impersonation, payment demand, and domain mismatch
    const indNames = report.observedIndicators.map((i: any) => i.name.toLowerCase());
    const hasDelivery = indNames.some((n: string) => n.includes('delivery') || n.includes('courier') || n.includes('postal'));
    expect(hasDelivery).toBe(true);

    expect(report.institutionVerification?.matched).toBe(true);
    expect(report.institutionVerification?.claimedPretext).toContain('USPS');
    expect(report.institutionVerification?.messageDiscrepancyNotes?.length).toBeGreaterThan(0);
  });

  // Scenario 3: Government / tax threat + gift card demand
  it('3. Flags Government / IRS Threat + Gift Card Demand as CRITICAL (score >= 90)', async () => {
    const text = 'IRS FINAL NOTICE: You have unpaid taxes of $1,500. A warrant has been issued for your arrest. Pay immediately via Apple Gift Cards to clear your record.';
    const res = await request(app)
      .post('/api/investigate')
      .send({ text, messageType: 'email' })
      .expect(200);

    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.riskAssessment.score).toBeGreaterThanOrEqual(90);
    expect(report.riskAssessment.level).toBe('CRITICAL');

    const indIds = report.observedIndicators.map((i: any) => i.id);
    expect(indIds.some((id: string) => id.startsWith('ind_fin_gift_cards'))).toBe(true);
  });

  // Scenario 4: Job scam moving to Telegram
  it('4. Flags Job Scam Moving to Telegram as HIGH (score >= 70)', async () => {
    const text = 'Congratulations! You have been selected for a remote data entry position paying $45/hour. Contact our hiring manager on Telegram @career_recruiter immediately to start.';
    const res = await request(app)
      .post('/api/investigate')
      .send({ text, messageType: 'email' })
      .expect(200);

    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.riskAssessment.score).toBeGreaterThanOrEqual(70);
    expect(['HIGH', 'CRITICAL']).toContain(report.riskAssessment.level);

    const indIds = report.observedIndicators.map((i: any) => i.id);
    expect(indIds.some((id: string) => id.startsWith('ind_div_channel'))).toBe(true);
  });

  // Scenario 5: Normal work deadline message
  it('5. Rates Normal Work Message as NO_KNOWN_INDICATORS with score 0 (never safe/benign)', async () => {
    const text = 'Hi team, please review the Q3 marketing slide deck before our team meeting tomorrow morning at 10am.';
    const res = await request(app)
      .post('/api/investigate')
      .send({ text, messageType: 'email' })
      .expect(200);

    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.riskAssessment.score).toBe(0);
    expect(report.riskAssessment.level).toBe('NO_KNOWN_INDICATORS');
    expect(report.observedIndicators).toHaveLength(0);
    expect(report.disclaimer).toContain('algorithmic risk assessment');
  });

  // Scenario 6: Normal personal message
  it('6. Rates Normal Personal Message as NO_KNOWN_INDICATORS with score 0', async () => {
    const text = "Hey! Dinner is at 7pm tonight at Mom's place. Let me know if you want me to pick you up on the way.";
    const res = await request(app)
      .post('/api/investigate')
      .send({ text, messageType: 'social_dm' })
      .expect(200);

    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.riskAssessment.score).toBe(0);
    expect(report.riskAssessment.level).toBe('NO_KNOWN_INDICATORS');
    expect(report.observedIndicators).toHaveLength(0);
  });

  // Scenario 7: Plain URL without known scam indicators
  it('7. Inspects Plain URL without claiming safe or loading page, providing passive inspection disclaimer', async () => {
    const text = 'https://example.com';
    const res = await request(app)
      .post('/api/investigate')
      .send({ text, messageType: 'sms' })
      .expect(200);

    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.riskAssessment.score).toBe(0);
    expect(report.riskAssessment.level).toBe('NO_KNOWN_INDICATORS');
    expect(report.liveInspectionPerformed).toBe(false);
    expect(report.urlDisclaimer).toContain('passive structural analysis');
  });

  // Scenario 8: Direct OTP/password/PIN request without a URL
  it('8. Flags Direct Passcode/Credential Solicitations as CRITICAL (score >= 90) even without URLs', async () => {
    const text = 'Security update: Please reply with your temporary login passcode to verify your account identity.';
    const res = await request(app)
      .post('/api/investigate')
      .send({ text, messageType: 'sms' })
      .expect(200);

    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.riskAssessment.score).toBeGreaterThanOrEqual(90);
    expect(report.riskAssessment.level).toBe('CRITICAL');
  });

  // Scenario 9: Brand lookalike domain with credential harvesting
  it('9. Flags Brand Lookalike Domain as HIGH or CRITICAL (score >= 80)', async () => {
    const text = 'Please sign in to confirm your identity at https://chase-bank-verify-security.login-portal.net/auth to unfreeze your funds.';
    const res = await request(app)
      .post('/api/investigate')
      .send({ text, messageType: 'email' })
      .expect(200);

    expect(res.body.success).toBe(true);
    const report = res.body.report;
    expect(report.riskAssessment.score).toBeGreaterThanOrEqual(80);
    expect(['HIGH', 'CRITICAL']).toContain(report.riskAssessment.level);

    const hasSpoof = report.observedIndicators.some(
      (i: any) => i.id.startsWith('ind_url_brand_spoof') || i.name.toLowerCase().includes('brand') || i.category === 'SUSPICIOUS_LINK'
    );
    expect(hasSpoof).toBe(true);
  });

  // Scenario 10: Input validation & empty/short submissions
  it('10. Strictly rejects empty, whitespace, and undersized submissions with HTTP 400', async () => {
    const emptyRes = await request(app)
      .post('/api/investigate')
      .send({ text: '' })
      .expect(400);
    expect(emptyRes.body.success).toBe(false);
    expect(emptyRes.body.error.code).toBe('VALIDATION_ERROR');

    const whitespaceRes = await request(app)
      .post('/api/investigate')
      .send({ text: '    ' })
      .expect(400);
    expect(whitespaceRes.body.success).toBe(false);
    expect(whitespaceRes.body.error.code).toBe('VALIDATION_ERROR');

    const shortRes = await request(app)
      .post('/api/investigate')
      .send({ text: 'hi' })
      .expect(400);
    expect(shortRes.body.success).toBe(false);
    expect(shortRes.body.error.code).toBe('VALIDATION_ERROR');
  });

  // Health Endpoint Check
  it('11. GET /api/health accurately reports engine architecture, analysis mode, and AI availability', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.status).toBe('operational');
    expect(res.body.analysisEngine).toBeDefined();
    expect(res.body.analysisEngine.deterministicRules).toBe(true);
    expect(res.body.analysisEngine.localHeuristics).toBe(true);
    expect(['EXTERNAL_AI', 'LOCAL_ONLY']).toContain(res.body.analysisEngine.mode);
  });
});
