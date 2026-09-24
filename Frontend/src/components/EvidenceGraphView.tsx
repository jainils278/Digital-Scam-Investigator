import React, { useState } from 'react';
import type { EvidenceIntelligenceSummary } from '../types';

interface EvidenceGraphViewProps {
  evidenceIntelligence?: EvidenceIntelligenceSummary;
}

export const EvidenceGraphView: React.FC<EvidenceGraphViewProps> = ({ evidenceIntelligence }) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'timeline' | 'mitigations'>('timeline');

  if (!evidenceIntelligence) {
    return null;
  }

  const { graph, timeline, mitigatingFactors, uncertaintyLevel, evidenceSynthesis } =
    evidenceIntelligence;

  const getNodeColor = (type: string, severity?: string) => {
    switch (type) {
      case 'ARTIFACT':
        return '#38bdf8';
      case 'INDICATOR':
        return severity === 'CRITICAL' ? '#f87171' : severity === 'HIGH' ? '#fb923c' : '#fbbf24';
      case 'URL':
      case 'DOMAIN':
        return '#a78bfa';
      case 'REPUTATION':
        return '#ec4899';
      case 'MITIGATION':
        return '#34d399';
      case 'DEFENSIVE_ACTION':
        return '#f43f5e';
      default:
        return '#94a3b8';
    }
  };

  const getStageTitle = (stage: string) => {
    switch (stage) {
      case 'HOOK':
        return '1. Initial Contact / Pretext';
      case 'PRESSURE':
        return '2. Urgency & Coercive Pressure';
      case 'EXPLOITATION':
        return '3. Request for Information or Payment';
      case 'COMPOUND_IMPACT':
        return '4. Potential Impact / Follow-up';
      default:
        return stage;
    }
  };

  return (
    <div className="report-section technical-details-section">
      <div className="section-label">ATTACK PROGRESSION & EVIDENCE ANALYSIS</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 className="section-heading">Communication Flow & Corroborating Signals</h3>
          <p className="section-subtext">
            Traces the step-by-step tactics used in the message and identifies any mitigating context.
          </p>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className={`btn-secondary ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              backgroundColor: activeTab === 'timeline' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'timeline' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderColor: activeTab === 'timeline' ? 'var(--accent-cyan)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Progression Steps ({timeline.length})</span>
          </button>

          <button
            type="button"
            className={`btn-secondary ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              backgroundColor: activeTab === 'graph' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'graph' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderColor: activeTab === 'graph' ? 'var(--accent-cyan)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <span>Evidence Nodes ({graph.nodes.length})</span>
          </button>

          <button
            type="button"
            className={`btn-secondary ${activeTab === 'mitigations' ? 'active' : ''}`}
            onClick={() => setActiveTab('mitigations')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              backgroundColor: activeTab === 'mitigations' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'mitigations' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderColor: activeTab === 'mitigations' ? 'var(--accent-cyan)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Context Signals ({mitigatingFactors.length})</span>
          </button>
        </div>
      </div>

      {/* Synthesis Overview */}
      <div style={{ backgroundColor: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <strong>Evidence Synthesis:</strong> {evidenceSynthesis}
        <span style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>
          (Uncertainty Rating: <strong style={{ color: uncertaintyLevel === 'LOW' ? '#34d399' : '#f59e0b' }}>{uncertaintyLevel}</strong>)
        </span>
      </div>

      {/* 1. Timeline View */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {timeline.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No sequential attack progression steps observed.</p>
          ) : (
            timeline.map((step) => (
              <div
                key={step.stepIndex}
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getStageTitle(step.stage)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {step.description}
                  </div>
                  {step.evidenceQuote && (
                    <div style={{ marginTop: '6px', fontSize: '12px', fontStyle: 'italic', color: 'var(--accent-cyan)' }}>
                      Observed text: "{step.evidenceQuote}"
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. Graph Nodes View */}
      {activeTab === 'graph' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            {graph.nodes.map((node) => (
              <div
                key={node.id}
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: `1px solid ${getNodeColor(node.type, node.severity)}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getNodeColor(node.type, node.severity),
                  }}
                ></span>
                <span>{node.label}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>[{node.type}]</span>
              </div>
            ))}
          </div>

          {/* Relationships */}
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            <strong>Causal Relationships:</strong>
            <div style={{ display: 'grid', gap: '4px', marginTop: '6px' }}>
              {graph.edges.map((edge, idx) => (
                <div key={idx} style={{ color: 'var(--text-secondary)' }}>
                  &bull; <strong>{edge.source}</strong> &rarr; <span style={{ color: 'var(--accent-cyan)' }}>{edge.label}</span> &rarr; <strong>{edge.target}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Mitigating Factors View */}
      {activeTab === 'mitigations' && (
        <div style={{ display: 'grid', gap: '10px' }}>
          {mitigatingFactors.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px' }}>
              No mitigating signals or authentic headers were identified in this communication.
            </div>
          ) : (
            mitigatingFactors.map((factor, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#34d399', marginBottom: '4px' }}>
                  {factor.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {factor.description}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
