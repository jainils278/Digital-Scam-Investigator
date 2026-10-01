/**
 * AI Provider Factory & Fallback Coordinator
 * 
 * Safely delegates contextual analysis to OpenAI when configured and healthy,
 * with zero-downtime fallback to the local Heuristic provider.
 */

import { AiContextAnalysis, AiFallbackReason, AiLastAnalysisMode, AnalysisMethod, ObservedIndicator } from '../../types.js';
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

export class AiProviderCoordinator {
  private primaryProvider: AiProvider | null = null;
  private fallbackProvider: HeuristicAiProvider;
  private lastAnalysisMode: AiLastAnalysisMode = 'NOT_TESTED';
  private lastFallbackReason: AiFallbackReason | null = null;

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

  public getLastFallbackReason(): AiFallbackReason | null {
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
      } catch (err) {
        // Classify locally; never include the raw provider error in responses or logs.
        const fallbackReason = classifyAiFallbackReason(err);
        this.lastAnalysisMode = 'FALLBACK_LOCAL';
        this.lastFallbackReason = fallbackReason;
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
