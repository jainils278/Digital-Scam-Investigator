/**
 * AI Provider Factory & Fallback Coordinator
 * 
 * Safely delegates contextual analysis to OpenAI when configured and healthy,
 * with zero-downtime fallback to the local Heuristic provider.
 */

import { AiContextAnalysis, AnalysisMethod, ObservedIndicator } from '../../types.js';
import { HeuristicAiProvider } from './heuristic_provider.js';
import { OpenAiProvider } from './openai_provider.js';
import { AiProvider } from './provider.js';

export interface AiContextAnalysisWithMethod extends AiContextAnalysis {
  analysisMethod: AnalysisMethod;
}

export class AiProviderCoordinator {
  private primaryProvider: AiProvider | null = null;
  private fallbackProvider: HeuristicAiProvider;

  constructor() {
    this.fallbackProvider = new HeuristicAiProvider();
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

  public async analyze(
    rawText: string,
    messageType: string,
    observedIndicators: ObservedIndicator[]
  ): Promise<AiContextAnalysisWithMethod> {
    if (this.primaryProvider) {
      try {
        const result = await this.primaryProvider.analyzeContext(rawText, messageType, observedIndicators);
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
          },
        };
      }
    }

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
