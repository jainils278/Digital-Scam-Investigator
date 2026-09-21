import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../Backend/src/index.js';

describe('Integration Tests — /api/investigate', () => {
  // --- Successful Investigation Flows ---

  it('returns a complete investigation report for a known scam message', async () => {
    const response = await request(app)
      .post('/api/investigate')
      .send({
        text: 'URGENT: Your bank account will be suspended today. Verify your identity by sending the OTP to this number immediately.',
        messageType: 'sms',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    const report = response.body.report;
    expect(report).toBeDefined();
    expect(report.id).toMatch(/^INV-/);
    expect(report.timestamp).toBeDefined();
    expect(report.rawText).toContain('URGENT');
    expect(report.inputMeta.messageType).toBe('sms');
    expect(report.inputMeta.characterCount).toBeGreaterThan(0);
    expect(report.inputMeta.wordCount).toBeGreaterThan(0);

    // Observed indicators
    expect(report.observedIndicators).toBeInstanceOf(Array);
    expect(report.observedIndicators.length).toBeGreaterThan(0);
    for (const ind of report.observedIndicators) {
      expect(ind.id).toBeDefined();
      expect(ind.category).toBeDefined();
      expect(ind.severity).toBeDefined();
      expect(ind.evidence).toBeDefined();
      expect(ind.characterRange).toBeInstanceOf(Array);
      expect(ind.characterRange.length).toBe(2);
      expect(ind.source).toBe('DETERMINISTIC');
      // Verify evidence offset integrity
      const slice = report.rawText.slice(ind.characterRange[0], ind.characterRange[1]);
      expect(slice.toLowerCase()).toContain(ind.evidence.toLowerCase().slice(0, 5));
    }

    // Risk assessment
    expect(report.riskAssessment).toBeDefined();
    expect(report.riskAssessment.score).toBeGreaterThan(0);
    expect(['BENIGN', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(report.riskAssessment.level);
    expect(report.riskAssessment.scoringRationale).toBeInstanceOf(Array);
    expect(report.riskAssessment.isNonProbabilisticNotice).toBeDefined();

    // AI context
    expect(report.aiContext).toBeDefined();
    expect(report.aiContext.mode).toBeDefined();
    expect(report.aiContext.providerName).toBeDefined();

    // Defensive recommendations
    expect(report.defensiveRecommendations).toBeInstanceOf(Array);
    expect(report.defensiveRecommendations.length).toBeGreaterThan(0);

    // Disclaimer
    expect(report.disclaimer).toBeDefined();
    expect(report.disclaimer.length).toBeGreaterThan(0);
  });

  it('returns BENIGN for a clearly legitimate message', async () => {
    const response = await request(app)
      .post('/api/investigate')
      .send({
        text: 'Hey, just checking in to see how your project presentation went yesterday. Let me know if you need help.',
        messageType: 'social_dm',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    const report = response.body.report;
    expect(report.observedIndicators.length).toBe(0);
    expect(report.riskAssessment.score).toBe(0);
    expect(report.riskAssessment.level).toBe('BENIGN');
  });

  it('detects URL-related indicators when URLs are present', async () => {
    const response = await request(app)
      .post('/api/investigate')
      .send({
        text: 'Click http://bit.ly/free-prize to claim your reward! Limited time offer!',
        messageType: 'sms',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    const report = response.body.report;
    expect(report.observedIndicators.length).toBeGreaterThan(0);
  });

  it('includes evidence intelligence graph when indicators are found', async () => {
    const response = await request(app)
      .post('/api/investigate')
      .send({
        text: 'Your account has been compromised! Send ₹5000 immediately to secure it. Click http://verify-bank-secure.com now.',
        messageType: 'email',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    const report = response.body.report;
    expect(report.evidenceIntelligence).toBeDefined();
    expect(report.evidenceIntelligence.graph).toBeDefined();
    expect(report.evidenceIntelligence.graph.nodes).toBeInstanceOf(Array);
    expect(report.evidenceIntelligence.graph.edges).toBeInstanceOf(Array);
    expect(report.evidenceIntelligence.timeline).toBeInstanceOf(Array);
  });

  it('includes education modules when scam indicators are found', async () => {
    const response = await request(app)
      .post('/api/investigate')
      .send({
        text: 'Congratulations! You won $1,000,000 in the international lottery! Pay $200 processing fee to claim.',
        messageType: 'email',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    const report = response.body.report;
    expect(report.education).toBeDefined();
    expect(report.education.modules).toBeInstanceOf(Array);
    expect(report.education.modules.length).toBeGreaterThan(0);
  });

  // --- Input Validation ---

  it('rejects text shorter than 5 characters', async () => {
    const response = await request(app)
      .post('/api/investigate')
      .send({ text: 'Hi' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects empty text', async () => {
    const response = await request(app)
      .post('/api/investigate')
      .send({ text: '' })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('rejects missing text field', async () => {
    const response = await request(app)
      .post('/api/investigate')
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('handles unknown messageType gracefully', async () => {
    const response = await request(app)
      .post('/api/investigate')
      .send({
        text: 'Your account needs immediate verification. Send OTP.',
        messageType: 'carrier_pigeon',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.report.inputMeta.messageType).toBe('unknown');
  });

  // --- API Endpoints ---

  it('GET /api/health returns operational status', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body.status).toBe('operational');
    expect(response.body.ai).toBeDefined();
  });

  it('GET /api/examples returns example cases', async () => {
    const response = await request(app).get('/api/examples').expect(200);
    expect(response.body.examples).toBeInstanceOf(Array);
    expect(response.body.examples.length).toBeGreaterThan(0);
    for (const ex of response.body.examples) {
      expect(ex.id).toBeDefined();
      expect(ex.title).toBeDefined();
      expect(ex.text).toBeDefined();
    }
  });

  it('returns 404 for unknown endpoints', async () => {
    const response = await request(app).get('/api/nonexistent').expect(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  // --- URL Investigation ---

  it('POST /api/investigate/url returns analysis for valid URLs', async () => {
    const response = await request(app)
      .post('/api/investigate/url')
      .send({ url: 'https://example.com' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.analysis).toBeDefined();
  });

  it('rejects URL investigation with empty URL', async () => {
    const response = await request(app)
      .post('/api/investigate/url')
      .send({ url: '' })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  // --- Security ---

  it('does not leak stack traces in error responses', async () => {
    const response = await request(app)
      .post('/api/investigate')
      .send({ text: '' })
      .expect(400);

    const body = JSON.stringify(response.body);
    expect(body).not.toContain('stack');
    expect(body).not.toContain('at ');
    expect(body).not.toContain('.ts:');
  });
});
