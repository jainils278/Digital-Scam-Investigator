import { describe, expect, it } from 'vitest';
import type { AiContextAnalysis } from '../Backend/src/types.js';
import {
  AiProviderCoordinator,
  classifyAiFallbackReason,
  categorizeExternalAiError,
} from '../Backend/src/services/ai/factory.js';
import type { AiProvider } from '../Backend/src/services/ai/provider.js';

describe('AI Failure Safe Diagnostics & Classification Audit', () => {
  // ---------------------------------------------------------------------------
  // 1. External AI Error Categorization (Coarse categories for logging/audit)
  // ---------------------------------------------------------------------------
  it('correctly classifies quota exhaustion errors as "quota"', () => {
    const quotaErr1 = { status: 429, code: 'insufficient_quota', message: 'You exceeded your current quota' };
    expect(categorizeExternalAiError(quotaErr1)).toBe('quota');

    const quotaErr2 = { status: 429, code: 'credit_balance_exhausted', message: 'You have no credits remaining' };
    expect(categorizeExternalAiError(quotaErr2)).toBe('quota');

    const quotaErr3 = { name: 'RateLimitError', message: 'Rate limit reached' };
    expect(categorizeExternalAiError(quotaErr3)).toBe('quota');
  });

  it('correctly classifies authentication and authorization errors as "auth"', () => {
    const authErr1 = { status: 401, code: 'invalid_api_key', message: 'Incorrect API key provided' };
    expect(categorizeExternalAiError(authErr1)).toBe('auth');

    const authErr2 = { status: 403, message: 'Unauthorized organization access' };
    expect(categorizeExternalAiError(authErr2)).toBe('auth');

    const authErr3 = { name: 'AuthenticationError', message: 'Invalid token' };
    expect(categorizeExternalAiError(authErr3)).toBe('auth');
  });

  it('correctly classifies model availability errors as "model"', () => {
    const modelErr1 = { status: 404, code: 'model_not_found', message: 'The model does not exist' };
    expect(categorizeExternalAiError(modelErr1)).toBe('model');

    const modelErr2 = { status: 400, message: 'Model gpt-5 is unsupported or not found' };
    expect(categorizeExternalAiError(modelErr2)).toBe('model');
  });

  it('correctly classifies timeout and cancellation errors as "timeout"', () => {
    const timeoutErr1 = { name: 'APIUserAbortError', message: 'Request was aborted' };
    expect(categorizeExternalAiError(timeoutErr1)).toBe('timeout');

    const timeoutErr2 = { code: 'ETIMEDOUT', message: 'Operation timed out after 8000ms' };
    expect(categorizeExternalAiError(timeoutErr2)).toBe('timeout');
  });

  it('correctly classifies connection and network errors as "network"', () => {
    const netErr1 = { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED 127.0.0.1:443' };
    expect(categorizeExternalAiError(netErr1)).toBe('network');

    const netErr2 = { message: 'fetch failed' };
    expect(categorizeExternalAiError(netErr2)).toBe('network');

    const netErr3 = { code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND api.openai.com' };
    expect(categorizeExternalAiError(netErr3)).toBe('network');
  });

  it('falls back to "unknown" on unrecognized errors', () => {
    const strangeErr = { message: 'Something completely arbitrary occurred' };
    expect(categorizeExternalAiError(strangeErr)).toBe('unknown');
    expect(categorizeExternalAiError(null)).toBe('unknown');
  });

  // ---------------------------------------------------------------------------
  // 2. Structured AiFallbackReason Classification
  // ---------------------------------------------------------------------------
  it('distinguishes rate limits, authentication failures, and timeouts', () => {
    expect(classifyAiFallbackReason({ status: 429, message: 'Too many requests' })).toBe('RATE_LIMITED');
    expect(classifyAiFallbackReason({ status: 401, message: 'Unauthorized' })).toBe('AUTHENTICATION_FAILED');
    expect(classifyAiFallbackReason({ code: 'ETIMEDOUT', message: 'request timed out' })).toBe('TIMEOUT');
    expect(classifyAiFallbackReason({ code: 'ECONNREFUSED', message: 'connect ECONNREFUSED' })).toBe('NETWORK_ERROR');
    expect(classifyAiFallbackReason({ status: 500, message: 'Internal server error' })).toBe('PROVIDER_ERROR');
    expect(classifyAiFallbackReason({ status: 429, code: 'insufficient_quota' })).toBe('QUOTA_EXCEEDED');
  });

  // ---------------------------------------------------------------------------
  // 3. Coordinator Lifecycle: External AI Success
  // ---------------------------------------------------------------------------
  it('records external AI success when primary provider succeeds', async () => {
    const mockSuccessProvider: AiProvider = {
      name: 'OpenAI test provider',
      isAvailable: () => true,
      analyzeContext: async (): Promise<AiContextAnalysis> => ({
        mode: 'OPENAI_REAL',
        providerName: 'OpenAI test provider',
        scamArchetypes: ['ACCOUNT_SUSPENSION'],
        psychologicalTriggers: ['URGENCY'],
        socialEngineeringTactics: 'Impersonation of financial institution',
        ambiguityAssessment: 'LOW',
        unverifiedInferences: [],
      }),
    };
    const coordinator = new AiProviderCoordinator(mockSuccessProvider);
    expect(coordinator.isUsingRealAi()).toBe(true);
    expect(coordinator.getLastAnalysisMode()).toBe('NOT_TESTED');

    const result = await coordinator.analyze('Please verify your account immediately.', 'sms', []);
    expect(result.mode).toBe('OPENAI_REAL');
    expect(result.analysisMethod).toEqual({
      mode: 'EXTERNAL_AI',
      deterministicRules: true,
      localHeuristics: false,
      externalModelUsed: true,
      externalAttempted: true,
      externalProvider: 'OpenAI test provider',
      fallbackUsed: false,
    });
    expect(coordinator.getLastAnalysisMode()).toBe('EXTERNAL_AI');
    expect(coordinator.getLastFallbackReason()).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // 4. Coordinator Lifecycle: Fallback to Local & Secrets Quarantine
  // ---------------------------------------------------------------------------
  it('tracks provider configured vs actually used during fallback without leaking secrets', async () => {
    const rawProviderError = Object.assign(
      new Error('insufficient_quota: PRIVATE_DIAGNOSTIC_SENTINEL credits remaining: 0'),
      { status: 429, code: 'insufficient_quota', type: 'insufficient_quota' }
    );

    const failingProvider: AiProvider = {
      name: 'Mock Failing OpenAI Provider',
      isAvailable: () => true,
      analyzeContext: async (): Promise<AiContextAnalysis> => {
        throw rawProviderError;
      },
    };
    const coordinator = new AiProviderCoordinator(failingProvider);
    expect(coordinator.isUsingRealAi()).toBe(true);

    const userSecretPayload = 'Secret Bank Wire to Account 9876543210 with OTP 44321';
    const result = await coordinator.analyze(userSecretPayload, 'sms', []);

    // 1. Result must fall back to local heuristic provider safely
    expect(result.mode).toBe('LOCAL_HEURISTIC');
    expect(result.analysisMethod.mode).toBe('FALLBACK_LOCAL');
    expect(result.analysisMethod.fallbackUsed).toBe(true);
    expect(result.analysisMethod.externalAttempted).toBe(true);
    expect(result.analysisMethod.externalModelUsed).toBe(false);

    // 2. Safe diagnostic records the fallback reason
    expect(result.analysisMethod.fallbackReason).toBe('QUOTA_EXCEEDED');
    expect(coordinator.getLastAnalysisMode()).toBe('FALLBACK_LOCAL');
    expect(coordinator.getLastFallbackReason()).toBe('QUOTA_EXCEEDED');

    // 3. Serialized report/context NEVER contains the error message, stack trace, or raw provider payload
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('PRIVATE_DIAGNOSTIC_SENTINEL');
    expect(serialized).not.toContain('credits remaining');
    expect(serialized).not.toContain('Error:');
    expect(serialized).not.toContain('stack');
  });

  // ---------------------------------------------------------------------------
  // 5. Coordinator Lifecycle: Local-Only Mode (No external provider configured)
  // ---------------------------------------------------------------------------
  it('handles local-only mode when no external AI provider is configured', async () => {
    const coordinator = new AiProviderCoordinator(null);
    expect(coordinator.isUsingRealAi()).toBe(false);
    expect(coordinator.getLastAnalysisMode()).toBe('NOT_TESTED');

    const result = await coordinator.analyze('Suspicious notice from bank.', 'sms', []);
    expect(result.mode).toBe('LOCAL_HEURISTIC');
    expect(result.analysisMethod).toEqual({
      mode: 'LOCAL_ONLY',
      deterministicRules: true,
      localHeuristics: true,
      externalModelUsed: false,
      externalAttempted: false,
      externalProvider: null,
      fallbackUsed: false,
    });
    expect(coordinator.getLastAnalysisMode()).toBe('LOCAL_ONLY');
    expect(coordinator.getLastFallbackReason()).toBeNull();
  });
});
