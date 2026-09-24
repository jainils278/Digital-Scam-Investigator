import React from 'react';
import type { EducationBriefing } from '../types';

interface EducationDeepDiveViewProps {
  education?: EducationBriefing;
}

export const EducationDeepDiveView: React.FC<EducationDeepDiveViewProps> = ({ education }) => {
  if (!education) {
    return null;
  }

  const { modules, generalHygieneAdvice, summary } = education;

  return (
    <div className="report-section education-section">
      <div className="section-label">EDUCATIONAL BREAKDOWN</div>
      <div style={{ marginBottom: '16px' }}>
        <h3 className="section-heading">How Scammers Use These Psychological Tactics</h3>
        <p className="section-subtext">{summary}</p>
      </div>

      {modules.length > 0 ? (
        <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
          {modules.map((mod) => (
            <div
              key={mod.id}
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '4px solid var(--accent-cyan)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>{mod.title}</span>
                </h4>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                  }}
                >
                  TACTIC: {mod.tacticName}
                </span>
              </div>

              {/* Psychological Persuasion Mechanism */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  WHY THIS TACTIC WORKS:
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {mod.psychologicalMechanism}
                </p>
              </div>

              {/* Attacker Playbook Step-by-Step */}
              <div style={{ marginBottom: '12px', backgroundColor: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
                  TYPICAL ATTACKER PLAYBOOK (HOW THEY EXECUTE THIS):
                </div>
                <div style={{ display: 'grid', gap: '4px' }}>
                  {mod.attackerPlaybook.map((step, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      &bull; {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Spotting Tips */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                  CONCRETE RED FLAGS TO WATCH FOR:
                </div>
                <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {mod.spottingTips.map((tip, idx) => (
                    <li key={idx} style={{ marginBottom: '2px' }}>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rule of Thumb & Analogy */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'grid', gap: '6px', fontSize: '12px' }}>
                <div>
                  <strong style={{ color: 'var(--accent-cyan)' }}>Golden Rule:</strong>{' '}
                  <span style={{ color: 'var(--text-primary)' }}>{mod.ruleOfThumb}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Real-World Analogy:</strong>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{mod.realWorldAnalogy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
          No specific persuasion tactics required individual deep dive modules for this communication.
        </div>
      )}

      {/* General Hygiene Advice */}
      {generalHygieneAdvice && generalHygieneAdvice.length > 0 && (
        <div style={{ backgroundColor: 'var(--bg-input)', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Core Cybersecurity Best Practices
          </h4>
          <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {generalHygieneAdvice.map((adv, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {adv}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
