import { describe, expect, it } from 'vitest';
import type { AiContextAnalysis } from '../Backend/src/types.js';
import { AiProviderCoordinator, classifyAiFallbackReason } from '../Backend/src/services/ai/factory.js';
import type { AiProvider } from '../Backend/src/services/ai/provider.js';

describe('AI fallback status diagnostics', () => {
  it('classifies quota exhaustion without exposing provider error details', async () => {
    const rawProviderError = Object.assign(
      new Error('insufficient_quota: PRIVATE_DIAGNOSTIC_SENTINEL'),
      { status: 429, code: 'insufficient_quota' }
    );
    expect(classifyAiFallbackReason(rawProviderError)).toBe('QUOTA_EXCEEDED');

    const failingProvider: AiProvider = {
      name: 'OpenAI test provider',
      isAvailable: () => true,
      analyzeContext: async (): Promise<AiContextAnalysis> => {
        throw rawProviderError;
      },
    };
    const coordinator = new AiProviderCoordinator(failingProvider);
    const result = await coordinator.analyze('Please verify your account now.', 'sms', []);

    expect(result.analysisMethod).toMatchObject({
      mode: 'FALLBACK_LOCAL',
      externalAttempted: true,
      externalModelUsed: false,
      fallbackUsed: true,
      fallbackReason: 'QUOTA_EXCEEDED',
    });
    expect(coordinator.getLastAnalysisMode()).toBe('FALLBACK_LOCAL');
    expect(coordinator.getLastFallbackReason()).toBe('QUOTA_EXCEEDED');
    expect(JSON.stringify(result)).not.toContain('PRIVATE_DIAGNOSTIC_SENTINEL');
  });

  it('distinguishes rate limits, authentication failures, and timeouts', () => {
    expect(classifyAiFallbackReason({ status: 429, message: 'Too many requests' })).toBe('RATE_LIMITED');
    expect(classifyAiFallbackReason({ status: 401, message: 'Unauthorized' })).toBe('AUTHENTICATION_FAILED');
    expect(classifyAiFallbackReason({ code: 'ETIMEDOUT', message: 'request timed out' })).toBe('TIMEOUT');
  });
});
