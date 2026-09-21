import React, { useState } from 'react';
import type { EvidenceIntelligenceSummary } from '../types';

interface EvidenceGraphViewProps {
  evidenceIntelligence?: EvidenceIntelligenceSummary;
}

export const EvidenceGraphView: React.FC<EvidenceGraphViewProps> = ({ evidenceIntelligence }) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'timeline' | 'mitigations'>('graph');

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

  return (
    <div className="report-section">
      <div className="section-label">EVIDENCE INTELLIGENCE & CAUSAL GRAPH</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 className="section-heading">Connected Evidence Graph & Attack Timeline</h3>
          <p className="section-subtext">
            Traces relationships between observed physical evidence, external threat feeds, causal progression, and mitigating signals.
          </p>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
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
            }}
          >
            🕸️ Evidence Graph ({graph.nodes.length} nodes)
          </button>
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
            }}
          >
            ⏳ Causal Timeline ({timeline.length} steps)
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
            }}
          >
            ⚖️ Mitigating Signals ({mitigatingFactors.length})
          </button>
        </div>
      </div>

      {/* Synthesis Callout Banner */}
      <div
        style={{
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>
            INTELLIGENCE SYNTHESIS:
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {evidenceSynthesis}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Analytical Uncertainty:</span>
          <span
            className={`risk-level-badge badge-${
              uncertaintyLevel === 'HIGH' ? 'CRITICAL' : uncertaintyLevel === 'MODERATE' ? 'HIGH' : 'LOW'
            }`}
            style={{ fontSize: '11px', padding: '2px 8px' }}
          >
            {uncertaintyLevel} UNCERTAINTY
          </span>
        </div>
      </div>

      {/* TAB 1: EVIDENCE GRAPH */}
      {activeTab === 'graph' && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '18px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
            CONNECTED EVIDENCE TOPOLOGY ({graph.nodes.length} NODES &bull; {graph.edges.length} RELATIONSHIPS):
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            {graph.nodes.map((node) => {
              const color = getNodeColor(node.type, node.severity);
              return (
                <div
                  key={node.id}
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: `1px solid ${color}44`,
                    borderLeft: `4px solid ${color}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color,
                        letterSpacing: '0.5px',
                      }}
                    >
                      [{node.type}]
                    </span>
                    {node.severity && (
                      <span className={`risk-level-badge badge-${node.severity}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {node.severity}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                    {node.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edges List */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              VERIFIED RELATIONSHIPS & COMPOUND HOOKS:
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
              {graph.edges.map((edge) => {
                const sourceNode = graph.nodes.find((n) => n.id === edge.source);
                const targetNode = graph.nodes.find((n) => n.id === edge.target);
                return (
                  <div
                    key={edge.id}
                    style={{
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--bg-input)',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {sourceNode?.label.slice(0, 24) || edge.source}
                    </span>
                    <span style={{ color: 'var(--accent-cyan)' }}>──({edge.label})──&gt;</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {targetNode?.label.slice(0, 24) || edge.target}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAUSAL ATTACK TIMELINE */}
      {activeTab === 'timeline' && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '18px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '14px' }}>
            CAUSAL INTERACTION SEQUENCE (SEQUENTIAL STAGES):
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {timeline.map((step) => {
              const stageColors: Record<string, string> = {
                HOOK: '#38bdf8',
                PRESSURE: '#fb923c',
                EXPLOITATION: '#f87171',
                COMPOUND_IMPACT: '#ec4899',
              };
              const color = stageColors[step.stage] || '#94a3b8';

              return (
                <div
                  key={step.stepIndex}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: `${color}22`,
                      border: `2px solid ${color}`,
                      color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {step.stepIndex}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {step.title}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color,
                          backgroundColor: `${color}18`,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        STAGE: {step.stage}
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '6px' }}>
                      {step.description}
                    </p>

                    {step.evidenceQuote && (
                      <div className="verbatim-quote" style={{ margin: '4px 0 0 0', padding: '6px 10px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--accent-cyan)' }}>“</span>
                        {step.evidenceQuote}
                        <span style={{ color: 'var(--accent-cyan)' }}>”</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MITIGATING SIGNALS */}
      {activeTab === 'mitigations' && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '18px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
            CONTRADICTORY & MITIGATING SIGNALS:
          </div>

          {mitigatingFactors.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '14px', textAlign: 'center' }}>
              No mitigating or reassuring signals were detected. All available evidence aligns with coercive social engineering.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {mitigatingFactors.map((mit, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    borderLeft: '4px solid #34d399',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#34d399' }}>
                      ✓ {mit.title}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        color: '#34d399',
                        backgroundColor: 'rgba(52, 211, 153, 0.15)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {mit.impact}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {mit.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
