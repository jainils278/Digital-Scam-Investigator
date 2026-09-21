/**
 * AI Provider Factory & Fallback Coordinator
 * 
 * Safely delegates contextual analysis to OpenAI when configured and healthy,
 * with zero-downtime fallback to the local Heuristic provider.
 */

import { AiContextAnalysis, ObservedIndicator } from '../../types.js';
import { HeuristicAiProvider } from './heuristic_provider.js';
import { OpenAiProvider } from './openai_provider.js';
import { AiProvider } from './provider.js';

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
  ): Promise<AiContextAnalysis> {
    if (this.primaryProvider) {
      try {
        return await this.primaryProvider.analyzeContext(rawText, messageType, observedIndicators);
      } catch (err) {
        // Safe fallback without exposing stack traces or API errors
        // Fall through to heuristic provider
      }
    }

    return await this.fallbackProvider.analyzeContext(rawText, messageType, observedIndicators);
  }
}
