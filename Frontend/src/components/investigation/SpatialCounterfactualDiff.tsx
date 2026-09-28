import React, { useState } from 'react';
import type { CounterfactualAnalysis, ObfuscationAnalysis } from '../../types';

interface SpatialCounterfactualDiffProps {
  counterfactualAnalysis?: CounterfactualAnalysis;
  obfuscationAnalysis?: ObfuscationAnalysis;
  baselineScore: number;
}

export const SpatialCounterfactualDiff: React.FC<SpatialCounterfactualDiffProps> = ({
  counterfactualAnalysis,
  obfuscationAnalysis,
  baselineScore,
}) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number | null>(null);
  const [activePeelLayer, setActivePeelLayer] = useState<'SURFACE' | 'MASK' | 'FORENSIC'>('SURFACE');

  const scenarios = counterfactualAnalysis?.scenarios || [];
  const activeScenario = selectedScenarioIndex !== null ? scenarios[selectedScenarioIndex] : null;

  return (
    <div className="spatial-counterfactual-diff-root">
      {/* Module Header */}
      <div className="spatial-section-header">
        <div className="spatial-section-tag">
          <span className="spatial-section-num">06</span>
          <span className="spatial-section-bracket">//</span>
          <span className="spatial-section-title">COUNTERFACTUAL SENSITIVITY & OBFUSCATION</span>
        </div>
        <div className="spatial-telemetry-badge">
          <span>WHAT-IF SENSITIVITY ENGINE</span>
          <span className="spatial-badge-sep">|</span>
          <span>EVASION DE-MASKING</span>
        </div>
      </div>

      <div className="spatial-cf-diff-grid">
        {/* Left: Counterfactual Sensitivity Explorer */}
        <div className="spatial-cf-pod">
          <div className="spatial-pod-header">
            <span className="spatial-pod-title">COUNTERFACTUAL HYPOTHETICAL SIMULATOR</span>
            <span className="spatial-pod-sub">ASSESSES DEPENDENCY ON SINGLE INDICATORS</span>
          </div>

          <div className="spatial-cf-baseline-strip">
            <div>
              <span className="spatial-cf-key">ACTUAL BASELINE DETERMINISTIC SCORE:</span>
              <span className="spatial-cf-val-baseline">{baselineScore} / 100</span>
            </div>
            {counterfactualAnalysis?.primaryPivotFactor && (
              <div className="spatial-cf-pivot-tag">
                PIVOT FACTOR: {counterfactualAnalysis.primaryPivotFactor}
              </div>
            )}
          </div>

          {/* Scenario Selection Chips */}
          <div className="spatial-cf-scenarios-list">
            {scenarios.length === 0 ? (
              <div className="spatial-cf-empty">
                No single indicator removal breaks compound risk threshold. Assessment is uniformly grounded.
              </div>
            ) : (
              scenarios.map((sc, idx) => {
                const isSelected = selectedScenarioIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`spatial-cf-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedScenarioIndex(isSelected ? null : idx)}
                  >
                    <div className="spatial-cf-card-header">
                      <span className="spatial-cf-scope">{sc.scope} ISOLATION</span>
                      <span className="spatial-cf-delta">
                        {sc.scoreDelta < 0 ? `${sc.scoreDelta} PTS` : `+${sc.scoreDelta} PTS`}
                      </span>
                    </div>

                    <div className="spatial-cf-explanation">{sc.explanation}</div>

                    <div className="spatial-cf-card-bottom">
                      <span>Hypothetical Result:</span>
                      <strong style={{ color: sc.counterfactualScore < 50 ? 'var(--scamvera-teal, #14b8a6)' : 'var(--scamvera-warning, #f59e0b)' }}>
                        {sc.counterfactualScore} / 100 ({sc.counterfactualLevel})
                      </strong>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Active Comparison HUD */}
          {activeScenario && (
            <div className="spatial-cf-comparison-box">
              <div className="spatial-cf-comp-col actual">
                <span className="spatial-comp-tag">ACTUAL CASE (RECORDED)</span>
                <div className="spatial-comp-score">{baselineScore}</div>
                <span className="spatial-comp-note">Contains all observed indicators</span>
              </div>

              <div className="spatial-cf-comp-arrow">
                <span>SIMULATED REMOVAL</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <span className="spatial-comp-diff">{activeScenario.scoreDelta} PTS</span>
              </div>

              <div className="spatial-cf-comp-col hypothetical">
                <span className="spatial-comp-tag">HYPOTHETICAL STATE</span>
                <div className="spatial-comp-score" style={{ color: 'var(--scamvera-teal, #14b8a6)' }}>
                  {activeScenario.counterfactualScore}
                </div>
                <span className="spatial-comp-note">
                  Broken Synergies: {activeScenario.brokenSynergies.join(', ') || 'None'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Obfuscation & Attacker Mask De-Layering */}
        <div className="spatial-obfuscation-pod">
          <div className="spatial-pod-header">
            <span className="spatial-pod-title">ATTACKER MASK & EVASION DE-LAYERING</span>
            <span className="spatial-pod-sub">PEELS ADVERSARIAL HOMOGLYPHS & INVISIBLE EVASION</span>
          </div>

          {obfuscationAnalysis && obfuscationAnalysis.hasObfuscation ? (
            <div className="spatial-obf-content">
              {/* Layer Selection Pill Navigation */}
              <div className="spatial-peel-controls">
                <button
                  type="button"
                  className={`spatial-peel-btn ${activePeelLayer === 'SURFACE' ? 'active' : ''}`}
                  onClick={() => setActivePeelLayer('SURFACE')}
                >
                  LAYER 01: VISIBLE SURFACE
                </button>
                <button
                  type="button"
                  className={`spatial-peel-btn ${activePeelLayer === 'MASK' ? 'active' : ''}`}
                  onClick={() => setActivePeelLayer('MASK')}
                >
                  LAYER 02: EVASION MASK
                </button>
                <button
                  type="button"
                  className={`spatial-peel-btn ${activePeelLayer === 'FORENSIC' ? 'active' : ''}`}
                  onClick={() => setActivePeelLayer('FORENSIC')}
                >
                  LAYER 03: UNDERLYING SIGNAL
                </button>
              </div>

              {/* Peeling Canvas */}
              <div className="spatial-peel-canvas">
                {activePeelLayer === 'SURFACE' && (
                  <div className="spatial-peel-frame surface">
                    <div className="spatial-layer-label">WHAT THE VICTIM SEES (HUMAN VIEW):</div>
                    <div className="spatial-token-stream">
                      {obfuscationAnalysis.diffTokens.map((t, i) => (
                        <span key={i} className="spatial-token-normal">
                          {t.text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activePeelLayer === 'MASK' && (
                  <div className="spatial-peel-frame mask">
                    <div className="spatial-layer-label">ATTACKER EVASION MASKS DETECTED:</div>
                    <div className="spatial-token-stream">
                      {obfuscationAnalysis.diffTokens.map((t, i) => (
                        <span
                          key={i}
                          className={t.isObfuscated ? 'spatial-token-obfuscated' : 'spatial-token-normal'}
                          title={t.isObfuscated ? `Unicode: ${t.unicodeHex || 'Evasion'}` : undefined}
                        >
                          {t.text}
                          {t.isObfuscated && (
                            <span className="spatial-obf-badge">
                              {t.type === 'HOMOGLYPH' ? 'HOMOGLYPH' : 'ZERO_WIDTH'}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activePeelLayer === 'FORENSIC' && (
                  <div className="spatial-peel-frame forensic">
                    <div className="spatial-layer-label">NORMALIZED UNDERLYING SIGNAL (ANALYSIS FORM):</div>
                    <div className="spatial-token-stream">
                      {obfuscationAnalysis.diffTokens.map((t, i) => (
                        <span
                          key={i}
                          className={t.isObfuscated ? 'spatial-token-decoded' : 'spatial-token-normal'}
                        >
                          {t.decodedChars || t.text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="spatial-obf-summary-box">
                <span className="spatial-obf-char-count">
                  {obfuscationAnalysis.totalEvasionChars} EVASION CHARACTERS DE-MASKED
                </span>
                <p className="spatial-obf-summary-txt">{obfuscationAnalysis.summary}</p>
              </div>
            </div>
          ) : (
            <div className="spatial-no-obf-box">
              <div className="spatial-no-obf-icon">✓</div>
              <div className="spatial-no-obf-title">Zero Adversarial Obfuscation Detected</div>
              <p className="spatial-no-obf-p">
                Text characters, homoglyphs, and URI tokens conform to canonical ASCII standards without zero-width insertion or Cyrillic/Greek character substitution.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
