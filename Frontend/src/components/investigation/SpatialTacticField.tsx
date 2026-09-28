import React, { useState } from 'react';
import type { TacticFingerprint, TacticProfile, ObservedIndicator } from '../../types';

interface SpatialTacticFieldProps {
  tacticProfile?: TacticProfile;
  observedIndicators: ObservedIndicator[];
}

export const SpatialTacticField: React.FC<SpatialTacticFieldProps> = ({
  tacticProfile,
  observedIndicators,
}) => {
  const [selectedTacticId, setSelectedTacticId] = useState<string | null>(null);

  // Extract tactics list from profile or indicators
  const tactics: TacticFingerprint[] = React.useMemo(() => {
    if (tacticProfile && tacticProfile.allTactics && tacticProfile.allTactics.length > 0) {
      return tacticProfile.allTactics;
    }

    // Deterministically synthesize from observed indicators
    const synthesized: TacticFingerprint[] = [];
    const urgencyInd = observedIndicators.find((i) => i.category === 'URGENCY_PRESSURE');
    if (urgencyInd) {
      synthesized.push({
        id: 'tac-urgency',
        name: 'Coercive Urgency & Time Compression',
        category: 'URGENCY_PRESSURE',
        severity: 'HIGH',
        constituentIndicatorIds: [urgencyInd.id],
        targetedVulnerability: 'Executive cognitive overload / Panic impulse',
        patternDescription: 'Imposes an artificial deadline to preempt critical verification reasoning.',
        explanation: urgencyInd.explanation,
        spottingTip: 'Legitimate institutions almost never impose sub-hour ultimatums via unsolicited channels.',
      });
    }

    const authorityInd = observedIndicators.find((i) => i.category === 'IMPERSONATION');
    if (authorityInd) {
      synthesized.push({
        id: 'tac-authority',
        name: 'Institutional Authority Spoofing',
        category: 'IMPERSONATION',
        severity: 'CRITICAL',
        constituentIndicatorIds: [authorityInd.id],
        targetedVulnerability: 'Social deference to regulatory or financial enforcement',
        patternDescription: 'Adopts the visual branding, vocabulary, or insignia of recognized authorities.',
        explanation: authorityInd.explanation,
        spottingTip: 'Always initiate communication through an independently verified official directory.',
      });
    }

    const urlInd = observedIndicators.find((i) => i.category === 'SUSPICIOUS_LINK');
    if (urlInd) {
      synthesized.push({
        id: 'tac-pretext',
        name: 'Lookalike Infrastructure Pretext',
        category: 'SUSPICIOUS_LINK',
        severity: 'HIGH',
        constituentIndicatorIds: [urlInd.id],
        targetedVulnerability: 'Visual perceptual blindness to typosquatted domains',
        patternDescription: 'Redirects victim to credential-harvesting server masquerading as genuine login portal.',
        explanation: urlInd.explanation,
        spottingTip: 'Inspect top-level domain and character substitutions before entering sensitive tokens.',
      });
    }

    return synthesized;
  }, [tacticProfile, observedIndicators]);

  const activeTactic = tactics.find((t) => t.id === selectedTacticId) || tactics[0];

  return (
    <div className="spatial-tactics-field-root">
      {/* Module Header */}
      <div className="spatial-section-header">
        <div className="spatial-section-tag">
          <span className="spatial-section-num">05</span>
          <span className="spatial-section-bracket">//</span>
          <span className="spatial-section-title">PSYCHOLOGICAL TACTIC FINGERPRINTS</span>
        </div>
        <div className="spatial-telemetry-badge">
          <span>{tactics.length} IDENTIFIED SIGNATURES</span>
          <span className="spatial-badge-sep">|</span>
          <span>COGNITIVE EXPLOITATION VECTORS</span>
        </div>
      </div>

      {tactics.length === 0 ? (
        <div className="spatial-no-tactics-card">
          <span>✓</span> No coercive psychological exploitation fingerprints detected in observed carrier.
        </div>
      ) : (
        <div className="spatial-tactics-stage">
          {/* Tactic Cards with Procedural Waveforms */}
          <div className="spatial-tactics-cards-grid">
            {tactics.map((tac) => {
              const isSelected = (activeTactic && activeTactic.id === tac.id);
              const isCritical = tac.severity === 'CRITICAL' || tac.severity === 'HIGH';
              const tacColor = isCritical ? 'var(--scamvera-danger, #ef4444)' : 'var(--scamvera-warning, #f59e0b)';

              return (
                <div
                  key={tac.id}
                  className={`spatial-tactic-signature-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTacticId(tac.id)}
                  style={{ '--tac-color': tacColor } as React.CSSProperties}
                >
                  <div className="spatial-tactic-card-top">
                    <span className="spatial-tactic-cat">{tac.category}</span>
                    <span className="spatial-tactic-sev" style={{ color: tacColor }}>
                      {tac.severity}
                    </span>
                  </div>

                  {/* Procedural Visual Signature Waveform / Geometry */}
                  <div className="spatial-tactic-waveform-box">
                    <svg className="spatial-waveform-svg" viewBox="0 0 240 60" preserveAspectRatio="none">
                      {tac.category === 'URGENCY_PRESSURE' ? (
                        // Accelerating frequency sine wave
                        <path
                          d="M 0 30 Q 30 10, 60 30 T 110 30 T 150 30 T 180 30 T 205 30 T 225 30 T 240 30"
                          fill="none"
                          stroke={tacColor}
                          strokeWidth="2"
                          className="spatial-wave-draw"
                        />
                      ) : tac.category === 'IMPERSONATION' ? (
                        // Rigid vertical geometric structure
                        <path
                          d="M 10 50 L 10 10 L 40 10 L 40 50 L 70 50 L 70 10 L 100 10 L 100 50 L 130 50 L 130 10 L 160 10 L 160 50 L 190 50 L 190 10 L 220 10 L 220 50"
                          fill="none"
                          stroke={tacColor}
                          strokeWidth="1.8"
                        />
                      ) : (
                        // Layered mask / stepped mesh
                        <path
                          d="M 0 45 L 60 15 L 120 40 L 180 20 L 240 35"
                          fill="none"
                          stroke={tacColor}
                          strokeWidth="2"
                        />
                      )}
                    </svg>
                  </div>

                  <div className="spatial-tactic-name">{tac.name}</div>
                  <div className="spatial-tactic-vuln">TARGET: {tac.targetedVulnerability}</div>
                </div>
              );
            })}
          </div>

          {/* Expanded Signature Detail Inspector */}
          {activeTactic && (
            <div className="spatial-tactic-detail-inspector">
              <div className="spatial-detail-header">
                <div>
                  <span className="spatial-detail-badge">ACTIVE TACTIC ANALYSIS</span>
                  <h4 className="spatial-detail-title">{activeTactic.name}</h4>
                </div>
                <div className="spatial-detail-vuln-pill">
                  VULNERABILITY: {activeTactic.targetedVulnerability}
                </div>
              </div>

              <div className="spatial-detail-grid">
                <div className="spatial-detail-item">
                  <div className="spatial-item-key">EXPLOITATION MECHANISM:</div>
                  <p className="spatial-item-val">{activeTactic.patternDescription}</p>
                </div>
                <div className="spatial-detail-item">
                  <div className="spatial-item-key">FORENSIC RATIONALE:</div>
                  <p className="spatial-item-val">{activeTactic.explanation}</p>
                </div>
                <div className="spatial-detail-item">
                  <div className="spatial-item-key">DEFENSIVE COUNTERMEASURE / SPOTTING TIP:</div>
                  <p className="spatial-item-val highlight">{activeTactic.spottingTip}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
