/**
 * AI Provider Factory & Fallback Coordinator
 * 
 * Safely delegates contextual analysis to OpenAI when configured and healthy,
 * with zero-downtime fallback to the local Heuristic provider.
 */

import {
  AiContextAnalysis,
  AiFallbackReason,
  AiLastAnalysisMode,
  AnalysisMethod,
  ExternalAiFailureCategory,
  ObservedIndicator,
} from '../../types.js';
import { logger } from '../logger.js';
import { HeuristicAiProvider } from './heuristic_provider.js';
import { OpenAiProvider } from './openai_provider.js';
import { AiProvider } from './provider.js';

export interface AiContextAnalysisWithMethod extends AiContextAnalysis {
  analysisMethod: AnalysisMethod;
}

/** Reduce provider errors to safe categories; raw messages never leave the backend. */
export function classifyAiFallbackReason(error: unknown): AiFallbackReason {
  const details = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const statusValue = details.status ?? details.statusCode;
  const parsedStatus = typeof statusValue === 'number' ? statusValue : Number(statusValue);
  const status = Number.isFinite(parsedStatus) ? parsedStatus : undefined;
  const code = typeof details.code === 'string' ? details.code.toLowerCase() : '';
  const name = typeof details.name === 'string' ? details.name.toLowerCase() : '';
  const message = typeof details.message === 'string' ? details.message.toLowerCase() : typeof error === 'string' ? error.toLowerCase() : '';
  const signals = `${code} ${name} ${message}`;

  if (/insufficient[_\s-]?quota|quota|credit[_\s-]?balance|billing/.test(signals)) return 'QUOTA_EXCEEDED';
  if (status === 401 || status === 403 || /invalid[_\s-]?api[_\s-]?key|unauthori[sz]ed|authentication/.test(signals)) return 'AUTHENTICATION_FAILED';
  if (status === 429 || /rate.?limit|too many requests/.test(signals)) return 'RATE_LIMITED';
  if (status === 408 || name === 'aborterror' || /time.?out|timed out|deadline exceeded/.test(signals)) return 'TIMEOUT';
  if (/econn|enotfound|eai_again|network|fetch failed|socket hang up/.test(signals)) return 'NETWORK_ERROR';
  if ((status !== undefined && status >= 500) || /server_error|internal server error/.test(signals)) return 'PROVIDER_ERROR';
  return 'UNKNOWN';
}

/**
 * Safe error diagnostic categorization.
 * Extracts ONLY a coarse category: 'auth' | 'quota' | 'model' | 'timeout' | 'network' | 'unknown'.
 * NEVER logs or exposes API keys, raw provider response bodies, or user-submitted text.
 */
export function categorizeExternalAiError(err: any): ExternalAiFailureCategory {
  if (!err) return 'unknown';

  const status = typeof err.status === 'number' ? err.status : 0;
  const code = String(err.code || '').toLowerCase();
  const type = String(err.type || '').toLowerCase();
  const name = String(err.name || '').toLowerCase();
  const msg = String(err.message || '').toLowerCase();

  // 1. Quota / Rate limit (e.g. HTTP 429, credit_balance_exhausted, insufficient_quota, RateLimitError)
  if (
    status === 429 ||
    type === 'insufficient_quota' ||
    code === 'credit_balance_exhausted' ||
    code.includes('quota') ||
    code.includes('rate_limit') ||
    name.includes('ratelimit') ||
    msg.includes('quota') ||
    msg.includes('credits remaining') ||
    msg.includes('rate limit')
  ) {
    return 'quota';
  }

  // 2. Authentication (e.g. HTTP 401, 403, AuthenticationError, invalid_api_key)
  if (
    status === 401 ||
    status === 403 ||
    (type === 'invalid_request_error' && code.includes('key')) ||
    code === 'invalid_api_key' ||
    name.includes('auth') ||
    msg.includes('api key') ||
    msg.includes('unauthorized') ||
    msg.includes('authentication')
  ) {
    return 'auth';
  }

  // 3. Model availability (e.g. HTTP 404, model_not_found)
  if (
    status === 404 ||
    code === 'model_not_found' ||
    (msg.includes('model') && (msg.includes('not found') || msg.includes('does not exist') || msg.includes('unsupported')))
  ) {
    return 'model';
  }

  // 4. Timeout (e.g. AbortError, APIUserAbortError, ETIMEDOUT)
  if (
    code === 'etimedout' ||
    code === 'esockettimedout' ||
    name.includes('timeout') ||
    name.includes('abort') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('aborted')
  ) {
    return 'timeout';
  }

  // 5. Network / connection (e.g. ECONNREFUSED, ENOTFOUND, fetch failed)
  if (
    code === 'econnrefused' ||
    code === 'enotfound' ||
    code === 'econnreset' ||
    code === 'eai_again' ||
    name.includes('connection') ||
    msg.includes('connection') ||
    msg.includes('fetch failed') ||
    msg.includes('network')
  ) {
    return 'network';
  }

  return 'unknown';
}

export class AiProviderCoordinator {
  private primaryProvider: AiProvider | null = null;
  private fallbackProvider: HeuristicAiProvider;
  private lastAnalysisMode: AiLastAnalysisMode = 'NOT_TESTED';
  private lastFallbackReason: AiFallbackReason | ExternalAiFailureCategory | null = null;

  constructor(primaryProvider?: AiProvider | null) {
    this.fallbackProvider = new HeuristicAiProvider();
    if (primaryProvider !== undefined) {
      this.primaryProvider = primaryProvider;
      return;
    }
    try {
      const openAi = new OpenAiProvider();
      if (openAi.isAvailable()) {
        this.primaryProvider = openAi;
      }
    } catch {
      this.primaryProvider = null;
    }
  }

  public getActiveProviderName(): string {
    return this.primaryProvider ? this.primaryProvider.name : this.fallbackProvider.name;
  }

  public isUsingRealAi(): boolean {
    return this.primaryProvider !== null;
  }

  public getLastAnalysisMode(): AiLastAnalysisMode {
    return this.lastAnalysisMode;
  }

  public getLastFallbackReason(): AiFallbackReason | ExternalAiFailureCategory | null {
    return this.lastFallbackReason;
  }

  public async analyze(
    rawText: string,
    messageType: string,
    observedIndicators: ObservedIndicator[]
  ): Promise<AiContextAnalysisWithMethod> {
    if (this.primaryProvider) {
      try {
        const result = await this.primaryProvider.analyzeContext(rawText, messageType, observedIndicators);
        this.lastAnalysisMode = 'EXTERNAL_AI';
        this.lastFallbackReason = null;
        return {
          ...result,
          analysisMethod: {
            mode: 'EXTERNAL_AI',
            deterministicRules: true,
            localHeuristics: false,
            externalModelUsed: true,
            externalAttempted: true,
            externalProvider: this.primaryProvider.name,
            fallbackUsed: false,
          },
        };
      } catch (err: any) {
        // Safe diagnostics: classify error into category (auth, quota, model, timeout, network, unknown)
        // Never log the raw provider response, user text, or API key
        const failureCategory = categorizeExternalAiError(err);
        const fallbackReason = classifyAiFallbackReason(err);
        this.lastAnalysisMode = 'FALLBACK_LOCAL';
        this.lastFallbackReason = fallbackReason;

        logger.warn('External AI provider failed, executing deterministic fallback', {
          provider: this.primaryProvider?.name || 'EXTERNAL_AI',
          failureCategory,
        });

        // Safe fallback without exposing stack traces or API errors
        const fallbackResult = await this.fallbackProvider.analyzeContext(rawText, messageType, observedIndicators);
        return {
          ...fallbackResult,
          analysisMethod: {
            mode: 'FALLBACK_LOCAL',
            deterministicRules: true,
            localHeuristics: true,
            externalModelUsed: false,
            externalAttempted: true,
            externalProvider: null,
            fallbackUsed: true,
            fallbackReason,
          },
        };
      }
    }

    this.lastAnalysisMode = 'LOCAL_ONLY';
    this.lastFallbackReason = null;
    const localResult = await this.fallbackProvider.analyzeContext(rawText, messageType, observedIndicators);
    return {
      ...localResult,
      analysisMethod: {
        mode: 'LOCAL_ONLY',
        deterministicRules: true,
        localHeuristics: true,
        externalModelUsed: false,
        externalAttempted: false,
        externalProvider: null,
        fallbackUsed: false,
      },
    };
  }
}
