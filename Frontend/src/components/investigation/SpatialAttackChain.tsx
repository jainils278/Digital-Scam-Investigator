import React, { useState } from 'react';
import type { TimelineStep, ObservedIndicator } from '../../types';

interface SpatialAttackChainProps {
  timeline?: TimelineStep[];
  observedIndicators: ObservedIndicator[];
}

interface StandardStage {
  id: string;
  stageName: string;
  title: string;
  description: string;
  evidenceQuote?: string;
  isHypothetical: boolean;
  status: 'ACTIVE_OBSERVED' | 'PROJECTED' | 'NOT_DETECTED';
}

const DEFAULT_STAGES = [
  'HOOK',
  'TRUST / AUTHORITY',
  'PRESSURE',
  'REQUEST',
  'EXPLOITATION',
  'PROJECTED CONSEQUENCE',
];

export const SpatialAttackChain: React.FC<SpatialAttackChainProps> = ({
  timeline,
  observedIndicators,
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);

  // Normalize stages from timeline or observed indicators
  const stages: StandardStage[] = React.useMemo(() => {
    if (timeline && timeline.length > 0) {
      return timeline.map((tm, i) => ({
        id: `tm-${i}`,
        stageName: tm.stageLabel || tm.stage,
        title: tm.title,
        description: tm.description,
        evidenceQuote: tm.evidenceQuote,
        isHypothetical: tm.observedOrInferred === 'PROJECTED_CONSEQUENCE' || tm.stage.includes('CONSEQUENCE'),
        status: tm.observedOrInferred === 'PROJECTED_CONSEQUENCE' ? 'PROJECTED' : 'ACTIVE_OBSERVED',
      }));
    }

    // Default reconstruction from observed indicators
    return DEFAULT_STAGES.map((name, i) => {
      const isHypo = name.includes('CONSEQUENCE');
      let matchingInd: ObservedIndicator | undefined;
      if (name.includes('HOOK') || name.includes('TRUST')) {
        matchingInd = observedIndicators.find((ind) => ind.category === 'IMPERSONATION');
      } else if (name.includes('PRESSURE')) {
        matchingInd = observedIndicators.find((ind) => ind.category === 'URGENCY_PRESSURE');
      } else if (name.includes('REQUEST') || name.includes('EXPLOITATION')) {
        matchingInd = observedIndicators.find(
          (ind) => ind.category === 'SUSPICIOUS_LINK' || ind.category === 'FINANCIAL_COERCION' || ind.category === 'CREDENTIAL_HARVESTING'
        );
      }

      return {
        id: `def-${i}`,
        stageName: name,
        title: matchingInd ? matchingInd.name : isHypo ? 'Hypothetical Exposure Analysis' : `${name} Phase`,
        description: matchingInd
          ? matchingInd.explanation
          : isHypo
          ? 'Hypothetical forensic trajectory if victim interacts with adversarial call to action.'
          : 'No specific deterministic indicators triggered during this phase.',
        evidenceQuote: matchingInd?.evidence,
        isHypothetical: isHypo,
        status: matchingInd ? 'ACTIVE_OBSERVED' : isHypo ? 'PROJECTED' : 'NOT_DETECTED',
      };
    });
  }, [timeline, observedIndicators]);

  const currentStage = stages[activeStageIndex] || stages[0];

  return (
    <div className="spatial-attack-chain-world">
      {/* Module Header */}
      <div className="spatial-section-header">
        <div className="spatial-section-tag">
          <span className="spatial-section-num">04</span>
          <span className="spatial-section-bracket">//</span>
          <span className="spatial-section-title">ATTACK CHAIN RECONSTRUCTION PATH</span>
        </div>
        <div className="spatial-telemetry-badge">
          <span>STEPPED 3D PROGRESSION SEQUENCE</span>
          <span className="spatial-badge-sep">|</span>
          <span>STEP {activeStageIndex + 1} OF {stages.length}</span>
        </div>
      </div>

      {/* Stepped 3D Isometric Progression Path */}
      <div className="attack-path-3d-stage">
        {/* SVG Laser Guide Rail */}
        <svg className="attack-path-laser-svg" viewBox="0 0 1000 160" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pathLaserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--scamvera-cyan, #06b6d4)" />
              <stop offset="50%" stopColor="var(--scamvera-warning, #f59e0b)" />
              <stop offset="100%" stopColor="var(--scamvera-danger, #ef4444)" />
            </linearGradient>
          </defs>
          <path
            d="M 50 80 Q 250 30, 500 80 T 950 80"
            fill="none"
            stroke="url(#pathLaserGrad)"
            strokeWidth="2"
            strokeDasharray="4 6"
            className="attack-path-dash-anim"
          />
        </svg>

        {/* Stepped 3D Stage Nodes in Z-Depth */}
        <div className="attack-stepped-nodes-track">
          {stages.map((st, idx) => {
            const isActive = idx === activeStageIndex;
            const isObserved = st.status === 'ACTIVE_OBSERVED';
            const isHypothetical = st.isHypothetical;

            let badgeColor = 'var(--scamvera-muted, #64748b)';
            if (isObserved) badgeColor = 'var(--scamvera-danger, #ef4444)';
            else if (isHypothetical) badgeColor = 'var(--scamvera-warning, #f59e0b)';

            // Depth calculation: stepped Z-offset
            const depthZ = idx * 25;

            return (
              <div
                key={st.id}
                className={`attack-stepped-node ${isActive ? 'active-step' : ''}`}
                style={{
                  '--step-depth': `${depthZ}px`,
                  zIndex: isActive ? 20 : 10 - idx,
                } as React.CSSProperties}
                onClick={() => setActiveStageIndex(idx)}
              >
                <div className="step-node-header">
                  <span className="step-idx">0{idx + 1}</span>
                  <span className="step-status-dot" style={{ backgroundColor: badgeColor }} />
                </div>
                <div className="step-name-label">{st.stageName}</div>
                {isHypothetical ? (
                  <span className="step-hypo-flag">HYPOTHETICAL</span>
                ) : isObserved ? (
                  <span className="step-observed-flag">OBSERVED</span>
                ) : (
                  <span className="step-latent-flag">LATENT</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Stage Focused Forensic Chamber (Z: 140px) */}
        {currentStage && (
          <div className="attack-active-stage-chamber">
            <div className="chamber-top-telemetry">
              <div className="chamber-step-index">
                PROGRESSION STAGE 0{activeStageIndex + 1} // {currentStage.stageName}
              </div>
              {currentStage.isHypothetical ? (
                <div className="chamber-hypo-stamp">
                  ⚠ [HYPOTHETICAL FORENSIC PROJECTION — EVENT HAS NOT OCCURRED]
                </div>
              ) : (
                <div className="chamber-observed-stamp">
                  ✓ VERIFIED FORENSIC OBSERVATION
                </div>
              )}
            </div>

            <h3 className="chamber-stage-title">{currentStage.title}</h3>
            <p className="chamber-stage-desc">{currentStage.description}</p>

            {currentStage.evidenceQuote && (
              <div className="chamber-evidence-pod">
                <span className="pod-key">DETECTED EVIDENCE QUOTE:</span>
                <p className="pod-quote">&ldquo;{currentStage.evidenceQuote}&rdquo;</p>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="chamber-nav-bar">
              <button
                type="button"
                className="btn-secondary chamber-nav-btn"
                disabled={activeStageIndex === 0}
                onClick={() => setActiveStageIndex((prev) => Math.max(0, prev - 1))}
              >
                ← Previous Stage
              </button>
              <div className="chamber-nav-dots">
                {stages.map((_, i) => (
                  <span
                    key={i}
                    className={`nav-dot ${i === activeStageIndex ? 'active' : ''}`}
                    onClick={() => setActiveStageIndex(i)}
                  />
                ))}
              </div>
              <button
                type="button"
                className="btn-secondary chamber-nav-btn"
                disabled={activeStageIndex === stages.length - 1}
                onClick={() => setActiveStageIndex((prev) => Math.min(stages.length - 1, prev + 1))}
              >
                Next Stage →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
