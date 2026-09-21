import React from 'react';
import type { ObservedIndicator } from '../types';

interface ObservedEvidenceListProps {
  indicators: ObservedIndicator[];
  selectedIndicatorId: string | null;
  onSelectIndicator: (id: string) => void;
}

export const ObservedEvidenceList: React.FC<ObservedEvidenceListProps> = ({
  indicators,
  selectedIndicatorId,
  onSelectIndicator,
}) => {
  return (
    <div className="panel-card" style={{ marginBottom: '24px' }}>
      <div className="panel-header">
        <div className="panel-title">
          <span>🎯</span>
          <span>1. OBSERVED EVIDENCE REGISTRY</span>
          <span className="panel-title-badge">INDEPENDENTLY VERIFIED</span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Traceable to source text offsets
        </span>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Every indicator in this section was independently detected and verified against your original text. None of the quotes below were generated or assumed by AI.
      </p>

      {indicators.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
          No suspicious indicators, coercive phrases, or credential demands were observed in the submitted text.
        </div>
      ) : (
        <div className="evidence-grid">
          {indicators.map((ind) => {
            const isSelected = selectedIndicatorId === ind.id;

            return (
              <div
                key={ind.id}
                id={`evidence-${ind.id}`}
                className={`evidence-card ${ind.severity}`}
                style={{
                  outline: isSelected ? '2px solid #38bdf8' : 'none',
                  backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                }}
                onClick={() => onSelectIndicator(ind.id)}
              >
                <div className="evidence-card-header">
                  <div className="evidence-card-title">
                    <span>{ind.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      offset: [{ind.characterRange[0]}, {ind.characterRange[1]}]
                    </span>
                    <span className={`risk-level-badge badge-${ind.severity}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {ind.severity}
                    </span>
                  </div>
                </div>

                <div className="verbatim-quote">
                  <span style={{ color: 'var(--accent-cyan)', marginRight: '6px' }}>“</span>
                  <strong>{ind.evidence}</strong>
                  <span style={{ color: 'var(--accent-cyan)', marginLeft: '6px' }}>”</span>
                </div>

                <div className="evidence-card-body">
                  <strong>What was detected:</strong> {ind.explanation}
                </div>

                <div className="evidence-why">
                  <strong>Why it matters:</strong> {ind.whyItMatters}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
