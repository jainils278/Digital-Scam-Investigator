import React, { useState, useMemo } from 'react';
import type { EvidenceGraph, GraphNode, GraphEdge, ObservedIndicator } from '../../types';

interface SpatialEvidenceGraphProps {
  evidenceGraph?: EvidenceGraph;
  observedIndicators: ObservedIndicator[];
  selectedIndicatorId?: string | null;
  onSelectIndicator?: (id: string | null) => void;
}

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
  color: string;
}

export const SpatialEvidenceGraph: React.FC<SpatialEvidenceGraphProps> = ({
  evidenceGraph,
  observedIndicators,
  selectedIndicatorId,
  onSelectIndicator,
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Compute graph data (use report.evidenceGraph or construct deterministic layout from observed indicators)
  const { nodes, edges } = useMemo(() => {
    if (evidenceGraph && evidenceGraph.nodes && evidenceGraph.nodes.length > 0) {
      return evidenceGraph;
    }

    // Deterministic fallback derived exclusively from observed real indicators
    const derivedNodes: GraphNode[] = [
      { id: 'origin_payload', type: 'ARTIFACT', label: 'Forensic Carrier', severity: 'LOW' },
      ...observedIndicators.map((ind) => ({
        id: ind.id,
        type: (ind.category.includes('LINK') ? 'URL' : 'INDICATOR') as GraphNode['type'],
        label: ind.name,
        severity: ind.severity,
        metadata: { matchedText: ind.evidence, category: ind.category },
      })),
      { id: 'risk_synthesis', type: 'MITIGATION', label: 'Deterministic Assessment', severity: 'CRITICAL' },
    ];

    const derivedEdges: GraphEdge[] = [];
    observedIndicators.forEach((ind, i) => {
      derivedEdges.push({
        id: `e-origin-${ind.id}`,
        source: 'origin_payload',
        target: ind.id,
        type: 'CONTAINS',
        label: 'OBSERVES',
      });
      derivedEdges.push({
        id: `e-${ind.id}-risk`,
        source: ind.id,
        target: 'risk_synthesis',
        type: 'COMPOUNDS_WITH',
        label: ind.category,
      });
      if (i > 0) {
        derivedEdges.push({
          id: `e-${observedIndicators[i - 1].id}-${ind.id}`,
          source: observedIndicators[i - 1].id,
          target: ind.id,
          type: 'LEADS_TO',
          label: 'CORRELATED',
        });
      }
    });

    return { nodes: derivedNodes, edges: derivedEdges };
  }, [evidenceGraph, observedIndicators]);

  // Spatial Radial Layout computation
  const layoutNodes: LayoutNode[] = useMemo(() => {
    const width = 720;
    const height = 440;
    const centerX = width / 2;
    const centerY = height / 2;

    if (nodes.length === 0) return [];
    if (nodes.length === 1) {
      return [{ ...nodes[0], x: centerX, y: centerY, color: '#06b6d4' }];
    }

    const radius = Math.min(centerX, centerY) - 80;
    return nodes.map((node, idx) => {
      // Center node for origin or root
      if (node.id === 'origin_payload' || idx === 0) {
        return {
          ...node,
          x: centerX,
          y: centerY,
          color: 'var(--scamvera-cyan, #06b6d4)',
        };
      }

      const angle = ((idx - 1) / (nodes.length - 1)) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      let color = 'var(--scamvera-cyan, #06b6d4)';
      if (node.severity === 'CRITICAL' || node.severity === 'HIGH') {
        color = 'var(--scamvera-danger, #ef4444)';
      } else if (node.severity === 'MEDIUM') {
        color = 'var(--scamvera-warning, #f59e0b)';
      } else if (node.type === 'URL' || node.type === 'DOMAIN') {
        color = '#38bdf8';
      }

      return {
        ...node,
        x,
        y,
        color,
      };
    });
  }, [nodes]);

  // Active highlighted node set (node + immediate neighbors)
  const activeFocusId = hoveredNodeId || selectedIndicatorId;
  const connectedNodeIds = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    const set = new Set<string>([activeFocusId]);
    edges.forEach((edge) => {
      if (edge.source === activeFocusId) set.add(edge.target);
      if (edge.target === activeFocusId) set.add(edge.source);
    });
    return set;
  }, [activeFocusId, edges]);

  // Active focused node object
  const activeNode = layoutNodes.find((n) => n.id === activeFocusId);

  return (
    <div className="spatial-evidence-graph-root">
      {/* Module Header */}
      <div className="spatial-section-header">
        <div className="spatial-section-tag">
          <span className="spatial-section-num">03</span>
          <span className="spatial-section-bracket">//</span>
          <span className="spatial-section-title">SPATIAL EVIDENCE TOPOLOGY & GRAPH</span>
        </div>
        <div className="spatial-telemetry-badge">
          <span>{layoutNodes.length} NODES</span>
          <span className="spatial-badge-sep">|</span>
          <span>{edges.length} RELATIONAL EDGES</span>
        </div>
      </div>

      {/* Main 3D Topology Viewport */}
      <div className="spatial-graph-viewport">
        {/* SVG Network Vector Layer */}
        <svg
          className="spatial-graph-svg"
          viewBox="0 0 720 440"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="edgeGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--scamvera-cyan, #06b6d4)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--scamvera-danger, #ef4444)" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Background Ambient Grid Rings */}
          <circle cx="360" cy="220" r="160" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 6" />
          <circle cx="360" cy="220" r="100" fill="none" stroke="rgba(255, 255, 255, 0.03)" />
          <line x1="360" y1="40" x2="360" y2="400" stroke="rgba(255, 255, 255, 0.03)" />
          <line x1="160" y1="220" x2="560" y2="220" stroke="rgba(255, 255, 255, 0.03)" />

          {/* Edges */}
          {edges.map((edge) => {
            const src = layoutNodes.find((n) => n.id === edge.source);
            const tgt = layoutNodes.find((n) => n.id === edge.target);
            if (!src || !tgt) return null;

            const isEdgeActive =
              activeFocusId &&
              (edge.source === activeFocusId || edge.target === activeFocusId);
            const isSubdued = activeFocusId && !isEdgeActive;

            return (
              <g key={edge.id} className="spatial-edge-group">
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={isEdgeActive ? 'var(--scamvera-cyan, #06b6d4)' : 'rgba(255, 255, 255, 0.12)'}
                  strokeWidth={isEdgeActive ? 2.5 : 1.2}
                  strokeDasharray={edge.type === 'LEADS_TO' ? '4 4' : undefined}
                  opacity={isSubdued ? 0.15 : 1}
                  style={{ transition: 'all 0.3s ease' }}
                />
                {/* Edge Label Pill */}
                {isEdgeActive && (
                  <text
                    x={(src.x + tgt.x) / 2}
                    y={(src.y + tgt.y) / 2 - 6}
                    fill="var(--scamvera-cyan, #06b6d4)"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                    className="spatial-edge-label"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {layoutNodes.map((node) => {
            const isHovered = hoveredNodeId === node.id;
            const isSelected = selectedIndicatorId === node.id;
            const isConnected = connectedNodeIds.has(node.id);
            const isSubdued = activeFocusId && !isConnected;

            return (
              <g
                key={node.id}
                className="spatial-node-group"
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => onSelectIndicator && onSelectIndicator(isSelected ? null : node.id)}
                style={{ cursor: 'pointer', transition: 'opacity 0.3s ease' }}
                opacity={isSubdued ? 0.2 : 1}
              >
                {/* Outer Pulse Beacon */}
                {(isHovered || isSelected) && (
                  <circle
                    r="24"
                    fill="none"
                    stroke={node.color}
                    strokeWidth="1.5"
                    strokeDasharray="2 4"
                    opacity="0.8"
                    className="spatial-node-beacon"
                  />
                )}

                {/* Outer Glow Halo (Lightweight SVG halo for selected/hovered node) */}
                {(isHovered || isSelected) && (
                  <circle
                    r={20}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="3"
                    opacity="0.3"
                    className="spatial-node-halo"
                  />
                )}

                {/* Main Node Disc */}
                <circle
                  r={isHovered || isSelected ? 16 : 12}
                  fill="var(--scamvera-surface, #080d16)"
                  stroke={node.color}
                  strokeWidth={isHovered || isSelected ? 2.5 : 1.5}
                  style={{ transition: 'r 0.2s ease, stroke-width 0.2s ease' }}
                />

                {/* Center Core Dot */}
                <circle r="4" fill={node.color} />

                {/* Node Label */}
                <text
                  y={26}
                  fill="var(--scamvera-text, #f8fafc)"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                  className="spatial-node-label"
                >
                  {node.label.length > 20 ? `${node.label.slice(0, 18)}…` : node.label}
                </text>
                <text
                  y={38}
                  fill="var(--scamvera-muted, #64748b)"
                  fontSize="9"
                  textAnchor="middle"
                  className="spatial-node-sub"
                >
                  {node.type}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Node Detail HUD overlay */}
        {activeNode && (
          <div className="spatial-node-hud-card">
            <div className="spatial-hud-tag-row">
              <span className="spatial-hud-type">{activeNode.type}</span>
              {activeNode.severity && (
                <span className="spatial-hud-sev" style={{ color: activeNode.color }}>
                  {activeNode.severity}
                </span>
              )}
            </div>
            <div className="spatial-hud-name">{activeNode.label}</div>
            {activeNode.metadata?.matchedText && (
              <div className="spatial-hud-matched">
                &ldquo;{activeNode.metadata.matchedText}&rdquo;
              </div>
            )}
            <div className="spatial-hud-hint">
              {connectedNodeIds.size - 1} ACTIVE RELATIONAL EDGES DETECTED
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
