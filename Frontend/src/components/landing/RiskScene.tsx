import React, { useState } from 'react';

export const RiskScene: React.FC = () => {
  const [isCounterfactualActive, setIsCounterfactualActive] = useState<boolean>(false);

  // When counterfactual simulation is active, Lookalike URL is removed
  const currentScore = isCounterfactualActive ? 30 : 85;
  const currentLevel = isCounterfactualActive ? 'LOW RISK' : 'HIGH RISK';
  const scoreColor = isCounterfactualActive ? '#10b981' : '#ef4444';

  return (
    <section id="risk-stream" className="landing-section" aria-label="Deterministic Risk Instrument">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-block">
          <div className="section-label-tag">05 // DETERMINISTIC RISK AUTHORITY</div>
          <h2 className="section-title">
            Mathematical scoring. Zero hallucinations.
          </h2>
          <p className="section-desc">
            Most security tools use opaque AI models that hallucinate certainty.
            Scamvera executes locked, reproducible mathematical scoring: base indicator weights, compound synergy bonuses, and counterfactual sensitivity.
          </p>
        </div>

        {/* 3D Risk Instrument & Interactive Caliper Stage */}
        <div className="risk-scene-stage">
          {/* Left: Physical Visual Caliper Instrument */}
          <div className="risk-caliper-instrument" aria-label="Forensic Risk Gauge">
            <div className="caliper-outer-ring" />
            <div className="caliper-tick-ring" />

            <div className="caliper-core-readout">
              <div
                className="caliper-score-huge"
                style={{
                  color: scoreColor,
                  textShadow: `0 0 35px ${scoreColor}44`,
                  transition: 'color 0.4s ease, text-shadow 0.4s ease',
                }}
              >
                {currentScore}
              </div>
              <div className="caliper-level-tag" style={{ color: scoreColor }}>
                {currentLevel}
              </div>
              <div className="caliper-authority-badge">
                DETERMINISTIC FORMULA // LOCKED
              </div>
            </div>
          </div>

          {/* Right: Risk Calculation & Counterfactual Sensitivity Engine */}
          <div className="risk-formula-breakdown">
            {/* Calculation Formula Card */}
            <div className="formula-card">
              <div className="inspector-meta-row" style={{ marginBottom: 12 }}>
                <span className="inspector-badge">FORMULA BREAKDOWN</span>
                <span className="inspector-status-badge status-locked">CODE-ENFORCED</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--scamvera-text)', marginBottom: 8 }}>
                {isCounterfactualActive ? 'Hypothetical Sensitivity Delta' : 'Baseline Verified Score'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--scamvera-subtle)', lineHeight: 1.5 }}>
                {isCounterfactualActive
                  ? 'Isolating the primary pivot factor: Removing LOOKALIKE_URL breaks the compound coercion synergy, dropping the score by -55 points.'
                  : 'Score calculated from verified indicator base weights plus compound synergy bonus. Mathematically reproducible down to the single point.'}
              </p>

              <div className="formula-math-line">
                {isCounterfactualActive ? (
                  <span>Base (30) + Synergy (0) = <strong>30/100 (LOW)</strong> [-55 pts]</span>
                ) : (
                  <span>Base (35 + 20 + 15) + Synergy (+15) = <strong>85/100 (HIGH)</strong></span>
                )}
              </div>
            </div>

            {/* Counterfactual Pivot Demonstration Toggle */}
            <div className="formula-card" style={{ borderColor: isCounterfactualActive ? '#10b981' : 'var(--scamvera-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--scamvera-text)' }}>
                    Counterfactual Pivot Engine
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--scamvera-muted)' }}>
                    Demonstrating sensitivity analysis
                  </div>
                </div>
                <button
                  type="button"
                  className={isCounterfactualActive ? 'btn-secondary' : 'btn-primary'}
                  style={{ fontSize: 12, padding: '8px 16px' }}
                  onClick={() => setIsCounterfactualActive((prev) => !prev)}
                >
                  {isCounterfactualActive ? 'Restore Baseline (+55 pts)' : 'Remove Lookalike URL (-55 pts)'}
                </button>
              </div>

              <p style={{ fontSize: 12.5, color: 'var(--scamvera-subtle)', margin: 0, lineHeight: 1.5 }}>
                Scamvera re-runs the scoring formula across indicator permutations to identify which single piece of evidence is the critical pivot factor driving the overall risk classification.
              </p>
            </div>

            {/* Zero-Hallucination Guarantee */}
            <div className="inspector-rule-card" style={{ margin: 0 }}>
              <div className="rule-card-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="rule-card-content">
                <span className="rule-title">MATHEMATICAL CERTAINTY</span>
                <p className="rule-desc">
                  Risk scores are NEVER estimated by LLMs. Scoring logic is 100% deterministic TypeScript code with full unit test regression barriers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
