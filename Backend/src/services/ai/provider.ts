/**
 * AI Provider Abstraction Interface
 */

import { AiContextAnalysis, ObservedIndicator } from '../../types.js';

export interface AiProvider {
  name: string;
  isAvailable(): boolean;
  analyzeContext(
    rawText: string,
    messageType: string,
    observedIndicators: ObservedIndicator[]
  ): Promise<AiContextAnalysis>;
}
