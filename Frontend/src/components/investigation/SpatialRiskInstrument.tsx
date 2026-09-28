import React, { useState } from 'react';
import type { RiskAssessment, ObservedIndicator, RiskContribution } from '../../types';

interface SpatialRiskInstrumentProps {
  riskAssessment: RiskAssessment;
  observedIndicators: ObservedIndicator[];
  waterfall?: RiskContribution[];
  selectedIndicatorId?: string | null;
  onSelectIndicator?: (id: string | null) => void;
}

export const SpatialRiskInstrument: React.FC<SpatialRiskInstrumentProps> = ({
  riskAssessment,
  observedIndicators,
  waterfall,
  selectedIndicatorId,
  onSelectIndicator,
}) => {
  const { score, level, primaryCategories } = riskAssessment;
  const [activeTab, setActiveTab] = useState<'CALIPER' | 'FACTORS' | 'WATERFALL'>('CALIPER');

  // Theme color based on deterministic risk level
  const levelColor =
    level === 'CRITICAL' || level === 'HIGH'
      ? 'var(--scamvera-danger, #ef4444)'
      : level === 'MEDIUM'
      ? 'var(--scamvera-warning, #f59e0b)'
      : level === 'LOW'
      ? 'var(--scamvera-teal, #14b8a6)'
      : 'var(--scamvera-cyan, #06b6d4)';

  const levelGlow =
    level === 'CRITICAL' || level === 'HIGH'
      ? 'rgba(239, 68, 68, 0.35)'
      : level === 'MEDIUM'
      ? 'rgba(245, 158, 11, 0.30)'
      : 'rgba(6, 182, 212, 0.25)';

  // Calculate arc stroke properties for SVG radial caliper (radius 88, circumference 552.9)
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="spatial-risk-instrument-root">
      {/* Module Frame Header */}
      <div className="spatial-section-header">
        <div className="spatial-section-tag">
          <span className="spatial-section-num">01</span>
          <span className="spatial-section-bracket">//</span>
          <span className="spatial-section-title">DETERMINISTIC RISK INSTRUMENT</span>
        </div>
        <div className="spatial-telemetry-badge">
          <span className="spatial-led-dot" style={{ backgroundColor: levelColor, boxShadow: `0 0 8px ${levelGlow}` }} />
          <span>EVALUATION: {level}</span>
          <span className="spatial-badge-sep">|</span>
          <span>DETERMINISTIC FORMULA v3.1</span>
        </div>
      </div>

      {/* 3D Caliper Stage */}
      <div className="spatial-risk-stage">
        {/* Left: Physical Dial / Caliper */}
        <div className="spatial-risk-caliper-pod">
          <div className="spatial-caliper-ring-wrap">
            {/* Outer mechanical tick ring */}
            <svg className="spatial-caliper-svg" width="220" height="220" viewBox="0 0 220 220">
              <defs>
                <linearGradient id="caliperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--scamvera-cyan, #06b6d4)" />
                  <stop offset="60%" stopColor="var(--scamvera-warning, #f59e0b)" />
                  <stop offset="100%" stopColor="var(--scamvera-danger, #ef4444)" />
                </linearGradient>
                <filter id="caliperGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Track */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="8"
                strokeDasharray="4 6"
              />

              {/* Calibrated Ticks */}
              {Array.from({ length: 40 }).map((_, i) => {
                const angle = (i * 360) / 40;
                const rad = (angle * Math.PI) / 180;
                const x1 = 110 + (radius + 12) * Math.cos(rad);
                const y1 = 110 + (radius + 12) * Math.sin(rad);
                const x2 = 110 + (radius + 18) * Math.cos(rad);
                const y2 = 110 + (radius + 18) * Math.sin(rad);
                const isMajor = i % 10 === 0;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isMajor ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.12)'}
                    strokeWidth={isMajor ? 1.5 : 1}
                  />
                );
              })}

              {/* Active Arc */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke={levelColor}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 110 110)"
                style={{
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  filter: `drop-shadow(0 0 8px ${levelGlow})`,
                }}
              />
            </svg>

            {/* Core Numeric Readout */}
            <div className="spatial-caliper-readout">
              <div className="spatial-score-huge" style={{ color: levelColor }}>
                {score}
              </div>
              <div className="spatial-score-scale">/ 100</div>
              <div className="spatial-score-level-badge" style={{ borderColor: levelColor, color: levelColor }}>
                {level}
              </div>
            </div>
          </div>

          <div className="spatial-caliper-subtext">
            <span>DETERMINISTIC EVIDENCE SUM</span>
            <span className="spatial-badge-dot">•</span>
            <span>NO PROBABILISTIC GUESSWORK</span>
          </div>
        </div>

        {/* Right: Forensic Breakdown & Factors */}
        <div className="spatial-risk-factors-pod">
          {/* Sub-Tabs */}
          <div className="spatial-risk-nav">
            <button
              type="button"
              className={`spatial-risk-tab ${activeTab === 'CALIPER' ? 'active' : ''}`}
              onClick={() => setActiveTab('CALIPER')}
            >
              KEY VECTORS ({observedIndicators.length})
            </button>
            <button
              type="button"
              className={`spatial-risk-tab ${activeTab === 'FACTORS' ? 'active' : ''}`}
              onClick={() => setActiveTab('FACTORS')}
            >
              CATEGORIES ({primaryCategories.length})
            </button>
            {waterfall && waterfall.length > 0 && (
              <button
                type="button"
                className={`spatial-risk-tab ${activeTab === 'WATERFALL' ? 'active' : ''}`}
                onClick={() => setActiveTab('WATERFALL')}
              >
                WATERFALL MATH
              </button>
            )}
          </div>

          {/* Panel: Key Vectors */}
          {activeTab === 'CALIPER' && (
            <div className="spatial-indicator-chips-flow">
              {observedIndicators.length === 0 ? (
                <div className="spatial-empty-notice">
                  <span className="spatial-empty-icon">✓</span>
                  <span>Zero verified adversarial indicators observed in volatile memory.</span>
                </div>
              ) : (
                observedIndicators.map((ind) => {
                  const isSelected = selectedIndicatorId === ind.id;
                  const indColor =
                    ind.severity === 'CRITICAL' || ind.severity === 'HIGH'
                      ? 'var(--scamvera-danger, #ef4444)'
                      : ind.severity === 'MEDIUM'
                      ? 'var(--scamvera-warning, #f59e0b)'
                      : 'var(--scamvera-cyan, #06b6d4)';

                  return (
                    <button
                      key={ind.id}
                      type="button"
                      className={`spatial-indicator-factor-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => onSelectIndicator && onSelectIndicator(isSelected ? null : ind.id)}
                    >
                      <div className="spatial-factor-top">
                        <span className="spatial-factor-sev" style={{ color: indColor }}>
                          {ind.severity}
                        </span>
                        <span className="spatial-factor-pts">{ind.category}</span>
                      </div>
                      <div className="spatial-factor-title">{ind.name}</div>
                      <div className="spatial-factor-quote">&ldquo;{ind.evidence.slice(0, 70)}{ind.evidence.length > 70 ? '…' : ''}&rdquo;</div>
                      {ind.characterRange && (
                        <div className="spatial-factor-provenance">
                          SRC: {ind.evidenceSource || 'TEXT'} • OFF: [{ind.characterRange[0]}..{ind.characterRange[1]}]
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Panel: Categories */}
          {activeTab === 'FACTORS' && (
            <div className="spatial-category-cluster">
              <div className="spatial-category-lead">
                The investigation engine mapped this payload into the following primary adversarial threat taxonomies:
              </div>
              <div className="spatial-category-tags">
                {primaryCategories.length > 0 ? (
                  primaryCategories.map((cat, idx) => (
                    <div key={idx} className="spatial-category-pill">
                      <span className="spatial-category-idx">0{idx + 1}</span>
                      <span className="spatial-category-name">{cat}</span>
                    </div>
                  ))
                ) : (
                  <div className="spatial-category-pill">
                    <span className="spatial-category-idx">00</span>
                    <span className="spatial-category-name">General Communication / Non-Adversarial</span>
                  </div>
                )}
              </div>
              <div className="spatial-category-stat">
                Total Verified Artifacts Observed: <strong>{observedIndicators.length}</strong>
              </div>
            </div>
          )}

          {/* Panel: Waterfall Calculation */}
          {activeTab === 'WATERFALL' && waterfall && (
            <div className="spatial-waterfall-flow">
              <div className="spatial-waterfall-header-row">
                <span>CONTRIBUTION / FACTOR</span>
                <span>POINTS</span>
                <span>TYPE</span>
              </div>
              {waterfall.map((step, idx) => (
                <div key={idx} className="spatial-waterfall-row">
                  <div className="spatial-waterfall-desc">
                    <span className="spatial-waterfall-step">{step.label}</span>
                    <span className="spatial-waterfall-reason">{step.explanation}</span>
                  </div>
                  <div className={`spatial-waterfall-delta ${step.points >= 0 ? 'pos' : 'neg'}`}>
                    {step.points > 0 ? `+${step.points}` : step.points}
                  </div>
                  <div className="spatial-waterfall-total">{step.type}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
