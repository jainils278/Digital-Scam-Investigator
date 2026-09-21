import { describe, expect, it } from 'vitest';
import { AiProviderCoordinator } from '../Backend/src/services/ai/factory.js';
import { HeuristicAiProvider } from '../Backend/src/services/ai/heuristic_provider.js';
import { InvestigationService } from '../Backend/src/services/investigation.js';

describe('AI Provider Resilience & Failure Fallback Audit', () => {
  it('fallback heuristic provider produces valid structured context offline', async () => {
    const heuristic = new HeuristicAiProvider();
    expect(heuristic.isAvailable()).toBe(true);

    const result = await heuristic.analyzeContext(
      'WELLS FARGO: Unauthorized wire. Reply with your OTP now.',
      'sms',
      [
        {
          id: 'ind_1',
          category: 'CREDENTIAL_HARVESTING',
          name: 'Direct OTP Demand',
          severity: 'CRITICAL',
          evidence: 'Reply with your OTP now',
          characterRange: [32, 55],
          explanation: 'OTP demand',
          whyItMatters: 'MFA bypass',
          source: 'DETERMINISTIC',
        },
      ]
    );

    expect(result.mode).toBe('LOCAL_HEURISTIC');
    expect(result.providerName).toBe('Defensive Heuristic Engine');
    expect(result.scamArchetypes.length).toBeGreaterThan(0);
    expect(result.psychologicalTriggers.length).toBeGreaterThan(0);
    expect(result.socialEngineeringTactics.length).toBeGreaterThan(0);
    expect(result.unverifiedInferences).toEqual([]);
  });

  it('coordinator safely falls back to heuristic provider without throwing on provider errors', async () => {
    const coordinator = new AiProviderCoordinator();

    // Even if OpenAI encounters network errors or timeouts, analyze must return valid AiContextAnalysis
    const result = await coordinator.analyze(
      'Your package is waiting for delivery fee payment.',
      'sms',
      []
    );

    expect(result).toBeDefined();
    expect(['OPENAI_REAL', 'LOCAL_HEURISTIC']).toContain(result.mode);
    expect(typeof result.socialEngineeringTactics).toBe('string');
  }, 15000);

  it('investigation service never exposes internal provider errors or stack traces to client', async () => {
    const service = new InvestigationService();

    // Run investigation on text
    const report = await service.investigate({
      text: 'Final Notice: Your account will be terminated today unless you verify.',
      messageType: 'email',
    });

    expect(report.id).toBeDefined();
    expect(report.riskAssessment).toBeDefined();
    expect(report.disclaimer).toBeDefined();
    // Verify no stack traces or API keys are embedded anywhere in the report
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain('Error:');
    expect(serialized).not.toContain('stack');
    expect(serialized).not.toContain('sk-');
  }, 15000);
});

