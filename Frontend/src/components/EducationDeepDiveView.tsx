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
    <div className="report-section">
      <div className="section-label">EVIDENCE-GROUNDED CYBERSECURITY EDUCATION</div>
      <div style={{ marginBottom: '16px' }}>
        <h3 className="section-heading">Persuasion Mechanics & Attacker Playbook Training</h3>
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
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  🎓 {mod.title}
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
                  🧠 PSYCHOLOGICAL EXPLOITATION MECHANISM:
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {mod.psychologicalMechanism}
                </p>
              </div>

              {/* Attacker Playbook Step-by-Step */}
              <div style={{ marginBottom: '12px', backgroundColor: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
                  🏴‍☠️ ATTACKER PLAYBOOK (HOW THEY EXECUTE THIS):
                </div>
                <div style={{ display: 'grid', gap: '4px' }}>
                  {mod.attackerPlaybook.map((step, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Spotting Tips */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                  💡 HOW TO SPOT IT NEXT TIME:
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {mod.spottingTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>

              {/* Golden Rule of Thumb & Analogy */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '10px',
                  marginTop: '10px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#fbbf24', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <strong>🏆 GOLDEN RULE:</strong> {mod.ruleOfThumb}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <strong>🔍 REAL-WORLD ANALOGY:</strong> {mod.realWorldAnalogy}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="deliberate-empty-state" style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            No specific manipulation techniques were detected in this message.
          </div>
        </div>
      )}

      {/* General Defensive Hygiene Guidelines */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          🛡️ Proactive Defensive Cybersecurity Habits:
        </div>
        <div style={{ display: 'grid', gap: '6px' }}>
          {generalHygieneAdvice.map((advice, i) => (
            <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: 'var(--accent-cyan)' }}>&bull;</span>
              <span>{advice}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
