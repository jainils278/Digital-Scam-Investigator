import React, { useState } from 'react';

interface EvidenceNode {
  id: string;
  label: string;
  category: string;
  x: number;
  y: number;
  color: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  detail: string;
  provenance: string;
}

const NODES: EvidenceNode[] = [
  {
    id: 'origin',
    label: 'Forensic Message Artifact',
    category: 'INGESTION',
    x: 380,
    y: 220,
    color: '#38bdf8',
    severity: 'INFO',
    detail: 'Raw suspicious SMS text analyzed at 0-retention volatile boundary',
    provenance: 'OFFSET: [0..148]',
  },
  {
    id: 'domain',
    label: 'Typosquat Domain',
    category: 'LOOKALIKE_URL',
    x: 150,
    y: 110,
    color: '#f87171',
    severity: 'CRITICAL',
    detail: 'chase-security-auth.com impersonates official banking authority',
    provenance: 'MATCH: LEVENSHTEIN_DISTANCE=4',
  },
  {
    id: 'urgency',
    label: 'Coercive Urgency',
    category: 'TACTIC',
    x: 610,
    y: 110,
    color: '#fb923c',
    severity: 'HIGH',
    detail: 'Immediate account suspension threat designed to trigger panic',
    provenance: 'TACTIC: ARTIFICIAL_DEADLINE',
  },
  {
    id: 'harvest',
    label: 'Credential Harvester',
    category: 'ATTACK_STAGE',
    x: 150,
    y: 350,
    color: '#f43f5e',
    severity: 'CRITICAL',
    detail: 'Target URI directs victim to spoofed 2FA/login credential capture',
    provenance: 'ACTION: PHISHING_LOGIN',
  },
  {
    id: 'financial',
    label: 'Unauthorized Transfer',
    category: 'CONTRADICTION',
    x: 610,
    y: 350,
    color: '#fbbf24',
    severity: 'MEDIUM',
    detail: '$1,420 fake debit claim contradicts bank standard notification protocol',
    provenance: 'CONTRADICTION: WIRE_PRETEXT',
  },
  {
    id: 'risk',
    label: 'Deterministic Score',
    category: 'RISK_AUTHORITY',
    x: 380,
    y: 440,
    color: '#ef4444',
    severity: 'CRITICAL',
    detail: 'Compound Score: 85/100 (HIGH). Risk calculated from verified indicators',
    provenance: 'SYNERGY BONUS: +15 APPLIED',
  },
];

interface Edge {
  from: string;
  to: string;
  label: string;
  dashed?: boolean;
}

const EDGES: Edge[] = [
  { from: 'origin', to: 'domain', label: 'EXTRACTS_TARGET' },
  { from: 'origin', to: 'urgency', label: 'EXPLOITS_FEAR' },
  { from: 'domain', to: 'harvest', label: 'DELIVERS_PAYLOAD' },
  { from: 'urgency', to: 'financial', label: 'FABRICATES_DEBIT' },
  { from: 'harvest', to: 'risk', label: 'COMPOUND_WEIGHT' },
  { from: 'financial', to: 'risk', label: 'SYNERGY_ELEVATION' },
  { from: 'origin', to: 'risk', label: 'DETERMINISTIC_FLOW', dashed: true },
];

export const EvidenceNetwork: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>('domain');

  const activeNode = NODES.find((n) => n.id === activeNodeId);

  return (
    <div className={`evidence-network-wrapper ${className}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        viewBox="0 0 760 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="evidence-network-svg"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
        aria-label="Interactive Evidence Topological Network"
      >
        <defs>
          {/* Subtle Glow Filters */}
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Linear Gradients for Edge Flow */}
          <linearGradient id="edge-cyan-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="edge-cyan-orange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fb923c" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="edge-red-risk" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Outer Coordinate System Brackets */}
        <g opacity="0.35" stroke="#475569" strokeWidth="1">
          <path d="M 30,50 L 30,30 L 50,30" />
          <path d="M 730,50 L 730,30 L 710,30" />
          <path d="M 30,470 L 30,490 L 50,490" />
          <path d="M 730,470 L 730,490 L 710,490" />
          <text x="32" y="24" fill="#64748b" fontSize="9" fontFamily="monospace" letterSpacing="1">
            SYS_TOPOLOGY // SV-VERIFIED
          </text>
          <text x="640" y="24" fill="#64748b" fontSize="9" fontFamily="monospace" letterSpacing="1">
            GRID: 760x520
          </text>
        </g>

        {/* Connecting Relationship Edges */}
        <g className="network-edges">
          {EDGES.map((edge) => {
            const fromNode = NODES.find((n) => n.id === edge.from)!;
            const toNode = NODES.find((n) => n.id === edge.to)!;
            const isHighlighted = activeNodeId === edge.from || activeNodeId === edge.to;

            // Compute curved path control points
            const dx = toNode.x - fromNode.x;
            const cx1 = fromNode.x + dx * 0.5;
            const cy1 = fromNode.y;
            const cx2 = fromNode.x + dx * 0.5;
            const cy2 = toNode.y;
            const pathData = `M ${fromNode.x},${fromNode.y} C ${cx1},${cy1} ${cx2},${cy2} ${toNode.x},${toNode.y}`;

            return (
              <g key={`${edge.from}-${edge.to}`}>
                {/* Background edge track */}
                <path
                  d={pathData}
                  stroke={isHighlighted ? 'rgba(56, 189, 248, 0.4)' : 'rgba(51, 65, 85, 0.45)'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  fill="none"
                />

                {/* Animated forensic pulse line */}
                <path
                  d={pathData}
                  stroke={isHighlighted ? '#38bdf8' : 'rgba(56, 189, 248, 0.25)'}
                  strokeWidth={isHighlighted ? 2.2 : 1.2}
                  strokeDasharray={edge.dashed ? '4,4' : '6,10'}
                  className="edge-pulse-flow"
                  fill="none"
                  filter={isHighlighted ? 'url(#glow-cyan)' : undefined}
                />

                {/* Vector midpoint label */}
                {isHighlighted && (
                  <g transform={`translate(${(fromNode.x + toNode.x) / 2}, ${(fromNode.y + toNode.y) / 2 - 8})`}>
                    <rect
                      x="-42"
                      y="-8"
                      width="84"
                      height="16"
                      rx="3"
                      fill="#090d16"
                      stroke="#0284c7"
                      strokeWidth="0.8"
                    />
                    <text
                      textAnchor="middle"
                      y="3.5"
                      fill="#38bdf8"
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Forensic Evidence Nodes */}
        <g className="network-nodes">
          {NODES.map((node) => {
            const isActive = activeNodeId === node.id;
            const isOrigin = node.id === 'origin';
            const isRisk = node.id === 'risk';

            return (
              <g
                key={node.id}
                className="evidence-node-group"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setActiveNodeId(node.id)}
                onClick={() => setActiveNodeId(node.id)}
                tabIndex={0}
                role="button"
                aria-label={`${node.label}: ${node.detail}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveNodeId(node.id);
                  }
                }}
              >
                {/* Radar pulse ring for active/critical nodes */}
                {(isActive || isRisk) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isOrigin ? 30 : 24}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="1"
                    opacity="0.4"
                    className="node-radar-pulse"
                  />
                )}

                {/* Outer halo */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isOrigin ? 20 : isRisk ? 18 : 14}
                  fill="#0b1120"
                  stroke={node.color}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  filter={isActive ? 'url(#glow-cyan)' : undefined}
                />

                {/* Inner core */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isOrigin ? 8 : isRisk ? 7 : 5}
                  fill={node.color}
                  opacity={isActive ? 1 : 0.85}
                />

                {/* Node Technical Label */}
                <text
                  x={node.x}
                  y={node.y + (node.y > 400 ? 30 : node.y < 150 ? -20 : 26)}
                  textAnchor="middle"
                  fill={isActive ? '#f8fafc' : '#cbd5e1'}
                  fontSize={isOrigin ? '11.5' : '10'}
                  fontFamily="system-ui, sans-serif"
                  fontWeight={isActive ? '700' : '600'}
                  letterSpacing="0.2"
                >
                  {node.label}
                </text>

                {/* Category tag */}
                <text
                  x={node.x}
                  y={node.y + (node.y > 400 ? 41 : node.y < 150 ? -9 : 37)}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8.5"
                  fontFamily="monospace"
                  letterSpacing="0.5"
                >
                  [{node.category}]
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Interactive Node Telemetry HUD Popover */}
      {activeNode && (
        <div
          className="node-telemetry-hud"
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '16px',
            right: '16px',
            background: 'rgba(10, 14, 25, 0.92)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '6px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
            fontSize: '12px',
            color: '#cbd5e1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: activeNode.color,
                boxShadow: `0 0 8px ${activeNode.color}`,
              }}
            />
            <div>
              <span style={{ fontWeight: 700, color: '#f8fafc', marginRight: '6px' }}>
                {activeNode.label}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>{activeNode.detail}</span>
            </div>
          </div>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            {activeNode.provenance}
          </span>
        </div>
      )}
    </div>
  );
};
