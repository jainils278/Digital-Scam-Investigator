import React, { useState } from 'react';

interface TopologyNode {
  id: string;
  name: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  color: string;
  xPct: number;
  yPct: number;
  provenance: string;
  finding: string;
  correlationImpact: string;
}

const TOPOLOGY_NODES: TopologyNode[] = [
  {
    id: 'origin',
    name: 'Suspicious SMS Inbound',
    category: 'INGESTION SPECIMEN',
    severity: 'INFO',
    color: '#38bdf8',
    xPct: 50,
    yPct: 20,
    provenance: 'OFFSET: [0..148] // VOLATILE_SANDBOX',
    finding: 'Raw inbound SMS text from carrier-unverified VoIP gateway (+1 844...).',
    correlationImpact: 'Initial ingestion point establishing base forensic context.',
  },
  {
    id: 'domain',
    name: 'Typosquat Domain',
    category: 'LOOKALIKE_URL',
    severity: 'CRITICAL',
    color: '#ef4444',
    xPct: 22,
    yPct: 48,
    provenance: 'MATCH: LEVENSHTEIN_DISTANCE=4 (chase-security-auth.top)',
    finding: 'Domain masquerades as official banking portal to capture user credentials.',
    correlationImpact: 'Direct vector driving primary scam categorization (+35 pts).',
  },
  {
    id: 'urgency',
    name: 'Coercive Urgency',
    category: 'PSYCHOLOGICAL_TACTIC',
    severity: 'HIGH',
    color: '#f59e0b',
    xPct: 78,
    yPct: 44,
    provenance: 'SPAN: [0..28] // SYNTHETIC_DEADLINE',
    finding: '"24-Hour Final Notice" pressures victim to bypass normal scrutiny.',
    correlationImpact: 'Triggers compound synergy multiplier when paired with lookalike URL (+15 pts).',
  },
  {
    id: 'pretext',
    name: 'Fabricated Debit Pretext',
    category: 'CONTRADICTION',
    severity: 'MEDIUM',
    color: '#fbbf24',
    xPct: 74,
    yPct: 82,
    provenance: 'PATTERN: WIRE_PRETEXT ($1,420.00 USD)',
    finding: 'Contradicts official bank security policy; banks never mandate instant wire reversals via SMS.',
    correlationImpact: 'Establishes factual contradiction against verified institutional registry.',
  },
  {
    id: 'harvest',
    name: 'Credential Harvester',
    category: 'EXPLOITATION_SINK',
    severity: 'CRITICAL',
    color: '#f43f5e',
    xPct: 24,
    yPct: 84,
    provenance: 'TARGET_URI: /login // PHISHING_FORM',
    finding: 'Spoofed two-factor authentication interface designed to exfiltrate session cookies.',
    correlationImpact: 'Terminal payload vector representing irreversible account takeover.',
  },
  {
    id: 'risk_core',
    name: 'Compound Risk Authority',
    category: 'DETERMINISTIC_SCORING',
    severity: 'CRITICAL',
    color: '#a855f7',
    xPct: 49,
    yPct: 62,
    provenance: 'SCORE: 85/100 // MATHEMATICALLY_LOCKED',
    finding: 'Compound deterministic score: base weights (70) + compound coercion synergy (+15).',
    correlationImpact: 'Mathematically locked verdict; zero AI hallucination or probability guessing.',
  },
];

interface ConnectionVector {
  from: string;
  to: string;
  label: string;
}

const VECTORS: ConnectionVector[] = [
  { from: 'origin', to: 'domain', label: 'EXTRACTS_URI' },
  { from: 'origin', to: 'urgency', label: 'COERCIVE_PRETEXT' },
  { from: 'domain', to: 'harvest', label: 'ROUTES_VICTIM' },
  { from: 'urgency', to: 'pretext', label: 'AMPLIFIES_PANIC' },
  { from: 'domain', to: 'risk_core', label: 'PRIMARY_WEIGHT' },
  { from: 'urgency', to: 'risk_core', label: 'SYNERGY_FACTOR' },
  { from: 'pretext', to: 'risk_core', label: 'CONTRADICTION_ELEVATION' },
  { from: 'harvest', to: 'risk_core', label: 'PAYLOAD_IMPACT' },
];

export const RelationshipScene: React.FC = () => {
  const [activeNodeId, setActiveNodeId] = useState<string>('domain');

  const activeNode = TOPOLOGY_NODES.find((n) => n.id === activeNodeId) || TOPOLOGY_NODES[1];

  return (
    <section id="relationships-stream" className="landing-section" aria-label="Evidence Relationships and Topology">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-block">
          <div className="section-label-tag">02 // TOPOLOGY & RELATIONSHIPS</div>
          <h2 className="section-title">
            Isolated clues form an unmistakable topology.
          </h2>
          <p className="section-desc">
            Scam communications rely on interlocking pieces: lookalike domains, spoofed gateways, panic deadlines, and fraudulent pretexts.
            Scamvera maps their spatial relationships so you see the complete attack surface, not just fragmented words.
          </p>
        </div>

        {/* 3D Topology Interactive Canvas Grid */}
        <div className="evidence-world-grid">
          {/* Left: Spatial Vector Network Field */}
          <div className="topology-stage-canvas" aria-label="Interactive Evidence Network Topology">
            <svg
              className="topology-vectors-svg"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              <defs>
                <linearGradient id="vectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              {/* Vector Lines Connecting Nodes */}
              {VECTORS.map((vec, idx) => {
                const nodeFrom = TOPOLOGY_NODES.find((n) => n.id === vec.from);
                const nodeTo = TOPOLOGY_NODES.find((n) => n.id === vec.to);
                if (!nodeFrom || !nodeTo) return null;

                const isConnectedToActive = vec.from === activeNodeId || vec.to === activeNodeId;

                return (
                  <g key={idx}>
                    <line
                      x1={`${nodeFrom.xPct}%`}
                      y1={`${nodeFrom.yPct}%`}
                      x2={`${nodeTo.xPct}%`}
                      y2={`${nodeTo.yPct}%`}
                      stroke={isConnectedToActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}
                      strokeWidth={isConnectedToActive ? 2.2 : 1}
                      strokeDasharray={isConnectedToActive ? '4 2' : 'none'}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Interactive Nodes Positioned Absolutely */}
            {TOPOLOGY_NODES.map((node) => {
              const isActive = node.id === activeNodeId;

              return (
                <button
                  key={node.id}
                  type="button"
                  className={`topology-node-element ${isActive ? 'active' : ''}`}
                  style={{
                    left: `${node.xPct}%`,
                    top: `${node.yPct}%`,
                    transform: 'translate(-50%, -50%)',
                    borderColor: isActive ? node.color : undefined,
                  }}
                  onClick={() => setActiveNodeId(node.id)}
                  aria-pressed={isActive}
                >
                  <div className="node-title-row">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: node.color,
                        boxShadow: `0 0 8px ${node.color}`,
                      }}
                    />
                    <span>{node.name}</span>
                  </div>
                  <div className="node-category-tag">{node.category}</div>
                </button>
              );
            })}
          </div>

          {/* Right: Forensic Relationship Inspector Pane */}
          <div className="pipeline-inspector-pane">
            <div className="inspector-head">
              <div className="inspector-meta-row">
                <span className="inspector-badge">{activeNode.category}</span>
                <span
                  className="inspector-status-badge"
                  style={{
                    background: `${activeNode.color}22`,
                    color: activeNode.color,
                    borderColor: `${activeNode.color}55`,
                  }}
                >
                  SEVERITY: {activeNode.severity}
                </span>
              </div>
              <h3 className="inspector-stage-title">{activeNode.name}</h3>
              <p className="inspector-stage-summary">{activeNode.finding}</p>
            </div>

            {/* Live Telemetry Box */}
            <div className="inspector-telemetry-box">
              <div className="telemetry-box-top">
                <span className="box-channel-label">EVIDENCE_PROVENANCE</span>
                <span className="box-mode-label">CORRELATED</span>
              </div>
              <div className="telemetry-box-body">
                <div className="telemetry-row">
                  <span className="t-key">PROVENANCE:</span>
                  <code className="t-code text-cyan">{activeNode.provenance}</code>
                </div>
                <div className="telemetry-row">
                  <span className="t-key">ATTACK IMPACT:</span>
                  <span className="t-val">{activeNode.correlationImpact}</span>
                </div>
              </div>
            </div>

            {/* Connected Topology Vectors */}
            <div className="inspector-rule-card">
              <div className="rule-card-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div className="rule-card-content">
                <span className="rule-title">TOPOLOGY COUPLING</span>
                <p className="rule-desc">
                  This indicator does not exist in a vacuum. It directly couples with adjacent tactics to form an actionable attack path.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
