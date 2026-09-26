/**
 * Counterfactual Risk Analysis Engine
 * 
 * Conducts sensitivity analysis on verified indicators to determine
 * which indicators or categories pivot the final risk assessment.
 * 
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. Strictly re-runs the LOCKED calculateRiskAssessment() on filtered indicator sets.
 * 2. Never duplicates scoring weights, synergy values, or clamping logic.
 * 3. Never mutates the actual risk score or baseline indicators.
 * 4. Sensitivity analysis only — NOT a probabilistic prediction.
 */

import type {
  CounterfactualAnalysis,
  CounterfactualScenario,
  ObservedIndicator,
  RiskAssessment,
} from '../../types.js';
import { calculateRiskAssessment } from '../risk_engine.js';

export function generateCounterfactualAnalysis(
  verifiedIndicators: ObservedIndicator[],
  baselineAssessment: RiskAssessment,
  rawTextLength: number
): CounterfactualAnalysis {
  const baselineScore = baselineAssessment.score;

  if (verifiedIndicators.length === 0) {
    return {
      baselineScore: 0,
      scenarios: [],
      primaryPivotFactor: undefined,
    };
  }

  const baselineSynergies =
    baselineAssessment.waterfall?.contributions
      .filter((c) => c.type === 'COMPOUND_SYNERGY')
      .map((c) => c.label) ?? [];

  const scenarios: CounterfactualScenario[] = [];

  // 1. Single Indicator-level Counterfactuals
  for (const indicator of verifiedIndicators) {
    const filteredIndicators = verifiedIndicators.filter((i) => i.id !== indicator.id);
    const cfAssessment = calculateRiskAssessment(filteredIndicators, rawTextLength);
    const counterfactualScore = cfAssessment.score;
    const scoreDelta = Math.max(0, baselineScore - counterfactualScore);

    const cfSynergies =
      cfAssessment.waterfall?.contributions
        .filter((c) => c.type === 'COMPOUND_SYNERGY')
        .map((c) => c.label) ?? [];

    const brokenSynergies = baselineSynergies.filter((s) => !cfSynergies.includes(s));

    let explanation: string;
    if (scoreDelta > 0) {
      explanation = `Excluding indicator "${indicator.name}" reduces risk score by ${scoreDelta} pts (from ${baselineScore} to ${counterfactualScore})${
        brokenSynergies.length > 0 ? ` and eliminates synergy: ${brokenSynergies.join(', ')}` : ''
      }.`;
    } else {
      explanation = `Excluding indicator "${indicator.name}" does not alter the clamped score (${baselineScore}/100) due to remaining accumulated risk factors.`;
    }

    scenarios.push({
      scope: 'INDICATOR',
      targetIndicatorId: indicator.id,
      removedIndicatorIds: [indicator.id],
      counterfactualScore,
      scoreDelta,
      counterfactualLevel: cfAssessment.level,
      brokenSynergies,
      explanation,
    });
  }

  // 2. Category-level Counterfactuals (for categories with indicators)
  const categoriesPresent = Array.from(new Set(verifiedIndicators.map((i) => i.category)));

  for (const category of categoriesPresent) {
    const indicatorsInCategory = verifiedIndicators.filter((i) => i.category === category);
    const removedIndicatorIds = indicatorsInCategory.map((i) => i.id);
    const filteredIndicators = verifiedIndicators.filter((i) => i.category !== category);

    const cfAssessment = calculateRiskAssessment(filteredIndicators, rawTextLength);
    const counterfactualScore = cfAssessment.score;
    const scoreDelta = Math.max(0, baselineScore - counterfactualScore);

    const cfSynergies =
      cfAssessment.waterfall?.contributions
        .filter((c) => c.type === 'COMPOUND_SYNERGY')
        .map((c) => c.label) ?? [];

    const brokenSynergies = baselineSynergies.filter((s) => !cfSynergies.includes(s));

    let explanation: string;
    if (scoreDelta > 0) {
      explanation = `Excluding entire category "${category}" (${removedIndicatorIds.length} indicator${
        removedIndicatorIds.length === 1 ? '' : 's'
      }) reduces risk score by ${scoreDelta} pts (from ${baselineScore} to ${counterfactualScore})${
        brokenSynergies.length > 0 ? ` and breaks compound synergy: ${brokenSynergies.join(', ')}` : ''
      }.`;
    } else {
      explanation = `Excluding entire category "${category}" does not alter the clamped score (${baselineScore}/100) due to remaining accumulated risk factors.`;
    }

    scenarios.push({
      scope: 'CATEGORY',
      targetCategory: category,
      removedIndicatorIds,
      counterfactualScore,
      scoreDelta,
      counterfactualLevel: cfAssessment.level,
      brokenSynergies,
      explanation,
    });
  }

  // Determine primary pivot factor: scenario with the highest scoreDelta > 0
  let primaryPivotFactor: string | undefined;
  let maxDelta = 0;
  for (const scenario of scenarios) {
    if (scenario.scoreDelta > maxDelta || (scenario.scoreDelta === maxDelta && maxDelta > 0 && scenario.scope === 'CATEGORY')) {
      maxDelta = scenario.scoreDelta;
      if (scenario.scope === 'CATEGORY' && scenario.targetCategory) {
        primaryPivotFactor = `Category: ${scenario.targetCategory}`;
      } else if (scenario.targetIndicatorId) {
        const ind = verifiedIndicators.find((i) => i.id === scenario.targetIndicatorId);
        primaryPivotFactor = `Indicator: ${ind ? `${ind.name} (${ind.category})` : scenario.targetIndicatorId}`;
      }
    }
  }

  return {
    baselineScore,
    scenarios,
    primaryPivotFactor,
  };
}
