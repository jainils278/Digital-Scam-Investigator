import React from 'react';
import type { AiContextAnalysis } from '../types';

interface AiInterpretationSectionProps {
  aiContext: AiContextAnalysis;
}

export const AiInterpretationSection: React.FC<AiInterpretationSectionProps> = ({ aiContext }) => {

  return (
    <div className="panel-card" style={{ marginBottom: '24px' }}>
      <div className="panel-header">
        <div className="panel-title">
          <span>🧠</span>
          <span>2. CONTEXTUAL INTERPRETATION & ATTACKER PSYCHOLOGY</span>
          <span className="panel-title-badge">INTERPRETIVE LAYER</span>
        </div>
        <div className="mode-badge" style={{ fontSize: '11px' }}>
          Provider: {aiContext.providerName}
        </div>
      </div>

      <div className="ai-notice">
        <span>ℹ️</span>
        <span>
          <strong>Strict Evidence Rule:</strong> The insights below are AI/heuristic contextual interpretations of attacker behavior and psychological persuasion tactics. They are deliberately kept separate from directly observed evidence.
        </span>
      </div>

      {/* Psychological Manipulation Triggers */}
      <div style={{ marginBottom: '18px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          Psychological Coercion Triggers:
        </h4>
        <div className="tag-list">
          {aiContext.psychologicalTriggers.map((trigger, i) => (
            <span key={i} className="tag-item" style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', borderColor: 'rgba(2, 132, 199, 0.3)', color: '#38bdf8' }}>
              ⚡ {trigger}
            </span>
          ))}
        </div>
      </div>

      {/* Social Engineering Tactics Breakdown */}
      <div style={{ marginBottom: '18px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
          Social Engineering Mechanics:
        </h4>
        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, backgroundColor: 'var(--bg-input)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          {aiContext.socialEngineeringTactics}
        </p>
      </div>

      {/* Ambiguity & Intent Assessment */}
      <div style={{ marginBottom: '18px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
          Contextual Ambiguity & Certainty:
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {aiContext.ambiguityAssessment}
        </p>
      </div>

      {/* Unverified Inferences (if any were produced by the model) */}
      {aiContext.unverifiedInferences && aiContext.unverifiedInferences.length > 0 && (
        <div style={{ marginTop: '14px', borderTop: '1px dashed var(--border-subtle)', paddingTop: '12px' }}>
          <h5 style={{ fontSize: '12px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '6px' }}>
            ⚠️ Unverified Contextual Inferences (Not Directly Quoted):
          </h5>
          <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-muted)' }}>
            {aiContext.unverifiedInferences.map((inf, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>{inf.claim}:</strong> {inf.rationale}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
