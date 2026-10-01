import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../Backend/src/index.js';
import { InvestigationService } from '../Backend/src/services/investigation.js';
import { deriveExecutiveSummary } from '../Frontend/src/utils/executiveSummary.js';

describe('Manual Scenarios & Analysis Method Verification', () => {
  it('Public Health Endpoint distinguishes configured provider from the last scan result', async () => {
    const res = await request(app).get('/api/health').expect(200);
    console.log('--- GET /api/health Output ---');
    console.log(JSON.stringify(res.body, null, 2));

    expect(res.body.status).toBe('operational');
    expect(res.body.version).toBe('2.1.0');
    expect(typeof res.body.analysisEngine.providerConfigured).toBe('boolean');
    expect(res.body.analysisEngine.lastAnalysisMode).toBe('NOT_TESTED');
    expect(res.body.analysisEngine.lastFallbackReason).toBeNull();
    expect(res.body.analysisEngine.lastExternalCallSucceeded).toBeNull();
    expect(res.body.analysisEngine.mode).toBe(
      res.body.analysisEngine.providerConfigured ? 'NOT_TESTED' : 'LOCAL_ONLY'
    );
    expect(res.body.analysisEngine.deterministicRules).toBe(true);
    expect(res.body.analysisEngine.localHeuristics).toBe(true);
  });

  it('Scenario A: USPS Parcel Scam rated CRITICAL (score >= 80) with delivery, payment, domain mismatch and defensive instructions', async () => {
    const text = 'Your package could not be delivered. Pay $2.99 now at https://usps-redelivery-portal.com to reschedule.';
    const service = new InvestigationService();
    const report = await service.investigate({ text, messageType: 'sms' });
    const exec = deriveExecutiveSummary(report);

    console.log('--- SCENARIO A Output ---');
    console.log('Risk Level:', report.riskAssessment.level);
    console.log('Risk Score:', report.riskAssessment.score);
    console.log('Analysis Method:', JSON.stringify(report.analysisMethod, null, 2));
    console.log('Verdict Title:', exec.verdictTitle);
    console.log('Verdict Direct Action:', exec.verdictDirectAction);
    console.log('Indicators:', report.observedIndicators.map(i => ({ id: i.id, name: i.name, severity: i.severity })));
    console.log('Immediate Actions:', exec.immediateActions);

    expect(report.riskAssessment.score).toBeGreaterThanOrEqual(80);
    expect(['HIGH', 'CRITICAL']).toContain(report.riskAssessment.level);

    // Delivery impersonation evidence
    const hasDelivery = report.observedIndicators.some(i =>
      /delivery|courier|package|parcel|postal/i.test(i.name + ' ' + i.evidence)
    );
    expect(hasDelivery).toBe(true);

    // Payment request evidence
    const hasPayment = report.observedIndicators.some(i =>
      /payment|fee|pay/i.test(i.name + ' ' + i.evidence)
    );
    expect(hasPayment).toBe(true);

    // Brand / Domain mismatch evidence
    const hasBrandOrDomain = report.observedIndicators.some(i =>
      /brand|domain|mismatch|usps/i.test(i.name + ' ' + i.evidence)
    );
    expect(hasBrandOrDomain).toBe(true);

    // Instruction not to click, reply, call, or pay
    expect(exec.verdictDirectAction).toContain('Do not click, reply, call, pay, or share codes.');
  });

  it('Scenario B: Chase Bank Alert rated CRITICAL (score >= 90) with OTP/credential, bank impersonation and instruction not to share OTP', async () => {
    const text = 'CHASE BANK ALERT: Unauthorized transfer detected. Reply with your OTP immediately.';
    const service = new InvestigationService();
    const report = await service.investigate({ text, messageType: 'sms' });
    const exec = deriveExecutiveSummary(report);

    console.log('--- SCENARIO B Output ---');
    console.log('Risk Level:', report.riskAssessment.level);
    console.log('Risk Score:', report.riskAssessment.score);
    console.log('Analysis Method:', JSON.stringify(report.analysisMethod, null, 2));
    console.log('Verdict Title:', exec.verdictTitle);
    console.log('Verdict Direct Action:', exec.verdictDirectAction);
    console.log('Indicators:', report.observedIndicators.map(i => ({ id: i.id, name: i.name, severity: i.severity })));
    console.log('Immediate Actions:', exec.immediateActions);

    expect(report.riskAssessment.score).toBeGreaterThanOrEqual(90);
    expect(report.riskAssessment.level).toBe('CRITICAL');

    // OTP / credential evidence
    const hasOtp = report.observedIndicators.some(i =>
      /otp|passcode|pin|credential/i.test(i.name + ' ' + i.evidence)
    );
    expect(hasOtp).toBe(true);

    // Bank impersonation evidence
    const hasBank = report.observedIndicators.some(i =>
      /bank|financial|chase|institution/i.test(i.name + ' ' + i.evidence)
    );
    expect(hasBank).toBe(true);

    // Instruction not to share OTP
    const recActions = report.defensiveRecommendations.map(r => r.action);
    expect(recActions.some(a => /Do NOT Disclose OTPs|passcode/i.test(a))).toBe(true);
    expect(exec.verdictDirectAction).toContain('Do not click, reply, call, pay, or share codes.');
  });

  it('Scenario C: Normal work message rated NO_KNOWN_INDICATORS, score 0, not "verified safe", with sender disclaimer', async () => {
    const text = 'Hi team, please send the quarterly project slides before 5 PM today.';
    const service = new InvestigationService();
    const report = await service.investigate({ text, messageType: 'email' });
    const exec = deriveExecutiveSummary(report);

    console.log('--- SCENARIO C Output ---');
    console.log('Risk Level:', report.riskAssessment.level);
    console.log('Risk Score:', report.riskAssessment.score);
    console.log('Analysis Method:', JSON.stringify(report.analysisMethod, null, 2));
    console.log('Verdict Title:', exec.verdictTitle);
    console.log('Verdict Direct Action:', exec.verdictDirectAction);
    console.log('Plain English Summary:', exec.plainEnglishSummary);

    expect(report.riskAssessment.level).toBe('NO_KNOWN_INDICATORS');
    expect(report.riskAssessment.score).toBe(0);
    expect(exec.verdictTitle).not.toContain('SAFE');
    expect(exec.plainEnglishSummary).toContain('No known scam indicators detected. This does not verify that the sender, website, or message is legitimate.');
  });

  it('Scenario D: Plain URL rated NO_KNOWN_INDICATORS, not claimed safe, states destination page was not loaded or verified', async () => {
    const text = 'https://example.com';
    const service = new InvestigationService();
    const report = await service.investigate({ text, messageType: 'unknown' });
    const exec = deriveExecutiveSummary(report);

    console.log('--- SCENARIO D Output ---');
    console.log('Risk Level:', report.riskAssessment.level);
    console.log('Risk Score:', report.riskAssessment.score);
    console.log('Analysis Method:', JSON.stringify(report.analysisMethod, null, 2));
    console.log('Verdict Title:', exec.verdictTitle);
    console.log('Plain English Summary:', exec.plainEnglishSummary);
    console.log('URL Disclaimer:', report.urlDisclaimer);

    expect(report.riskAssessment.level).toBe('NO_KNOWN_INDICATORS');
    expect(report.riskAssessment.score).toBe(0);
    expect(exec.verdictTitle).not.toContain('SAFE');
    expect(report.urlDisclaimer).toContain('ScamVera performed passive structural analysis only. The destination page was not loaded or executed.');
    expect(exec.plainEnglishSummary).toContain('ScamVera did not load or execute the destination page. This result is based on structural analysis of the submitted URL.');
  });

  it('Public POST /api/investigate endpoint produces identical findings and LOCAL_ONLY analysisMethod', async () => {
    const text = 'Your package could not be delivered. Pay $2.99 now at https://usps-redelivery-portal.com to reschedule.';
    const res = await request(app)
      .post('/api/investigate')
      .send({ text, messageType: 'sms' })
      .expect(200);

    console.log('--- POST /api/investigate Output ---');
    console.log('Response Status:', res.status);
    console.log('Success:', res.body.success);
    console.log('Report Level:', res.body.report.riskAssessment.level);
    console.log('Report Score:', res.body.report.riskAssessment.score);
    console.log('Analysis Method:', JSON.stringify(res.body.report.analysisMethod, null, 2));

    expect(res.body.success).toBe(true);
    expect(res.body.report.riskAssessment.score).toBeGreaterThanOrEqual(80);
    expect(res.body.report.analysisMethod).toEqual({
      mode: 'LOCAL_ONLY',
      deterministicRules: true,
      localHeuristics: true,
      externalModelUsed: false,
      externalAttempted: false,
      externalProvider: null,
      fallbackUsed: false,
    });
  });
});
