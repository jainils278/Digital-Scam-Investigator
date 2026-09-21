import React from 'react';
import type { RiskAssessment } from '../types';

interface RiskHeroProps {
  assessment: RiskAssessment;
  onCopySummary: () => void;
  onExportJson: () => void;
}

export const RiskHero: React.FC<RiskHeroProps> = ({
  assessment,
  onCopySummary,
  onExportJson,
}) => {
  const { score, level, evidenceStrength, evidenceStrengthExplanation, primaryCategories, isNonProbabilisticNotice } =
    assessment;

  return (
    <div className={`risk-hero ${level}`}>
      <div className="risk-hero-main">
        <div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            OVERALL RISK ASSESSMENT
          </div>
          <div className="risk-score-box">
            <span className="risk-score-num">{score}</span>
            <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>/100</span>
            <span className={`risk-level-badge badge-${level}`}>{level} RISK</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
          <button type="button" className="btn-secondary" onClick={onCopySummary} title="Copy plain-text summary to clipboard">
            📋 Copy Summary
          </button>
          <button type="button" className="btn-secondary" onClick={onExportJson} title="Export complete structured report as JSON">
            💾 Export JSON
          </button>
        </div>
      </div>

      {/* Meter Bar */}
      <div className="risk-meter">
        <div className={`risk-meter-fill fill-${level}`} style={{ width: `${Math.max(4, score)}%` }}></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        <p className="non-probabilistic-disclaimer">
          ⚖️ {isNonProbabilisticNotice}
        </p>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          <strong>Evidence Strength:</strong>{' '}
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{evidenceStrength}</span>
        </div>
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
        {evidenceStrengthExplanation}
      </div>

      {/* Primary Scam Classifications */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
          DETECTED ATTACK ARCHETYPES:
        </span>
        <div className="tag-list">
          {primaryCategories.map((cat) => (
            <span key={cat} className="tag-item" style={{ color: '#e2e8f0', borderColor: 'var(--border-medium)' }}>
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
