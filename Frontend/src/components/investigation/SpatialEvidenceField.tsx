import React, { useState } from 'react';
import type { ObservedIndicator, ScreenshotMetadata } from '../../types';

interface SpatialEvidenceFieldProps {
  rawText: string;
  observedIndicators: ObservedIndicator[];
  screenshotMeta?: ScreenshotMetadata;
  screenshotsMeta?: ScreenshotMetadata[];
  selectedIndicatorId?: string | null;
  onSelectIndicator?: (id: string | null) => void;
}

export const SpatialEvidenceField: React.FC<SpatialEvidenceFieldProps> = ({
  rawText,
  observedIndicators,
  screenshotMeta,
  screenshotsMeta,
  selectedIndicatorId,
  onSelectIndicator,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const screenshots = screenshotsMeta || (screenshotMeta ? [screenshotMeta] : []);
  const activeIndicator = observedIndicators.find(
    (ind) => ind.id === (hoveredId || selectedIndicatorId)
  );

  return (
    <div className="spatial-evidence-field-root">
      {/* Module Header */}
      <div className="spatial-section-header">
        <div className="spatial-section-tag">
          <span className="spatial-section-num">02</span>
          <span className="spatial-section-bracket">//</span>
          <span className="spatial-section-title">SPATIAL EVIDENCE ARTIFACT FIELD</span>
        </div>
        <div className="spatial-telemetry-badge">
          <span>{observedIndicators.length} DISCOVERED ARTIFACTS</span>
          <span className="spatial-badge-sep">|</span>
          <span>ORIGIN PROVENANCE VERIFIED</span>
        </div>
      </div>

      {/* Main Spatial Stage */}
      <div className="spatial-evidence-stage">
        {/* Left: Interactive Ingestion Source Canvas */}
        <div className="spatial-source-chassis">
          <div className="spatial-source-header">
            <span className="spatial-source-label">INGESTED FORENSIC CARRIER</span>
            <span className="spatial-source-status">0-RETENTION VOLATILE BUFFER</span>
          </div>

          <div className="spatial-source-body">
            {/* If screenshots are present, display their thumbnail evidence trays */}
            {screenshots.length > 0 && (
              <div className="spatial-screenshot-gallery">
                {screenshots.map((s, idx) => (
                  <div key={idx} className="spatial-screenshot-card">
                    {s.previewDataUrl ? (
                      <img
                        src={s.previewDataUrl}
                        alt={`Screenshot evidence #${idx + 1}`}
                        className="spatial-screenshot-img"
                      />
                    ) : (
                      <div className="spatial-screenshot-placeholder">
                        IMAGE CARRIER #{idx + 1}
                      </div>
                    )}
                    <div className="spatial-screenshot-caption">
                      <span>{s.filename || `Evidence #${idx + 1}`}</span>
                      <span>OCR CONF: {s.ocrConfidence ? `${Math.round(s.ocrConfidence)}%` : 'VERIFIED'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Carrier Text with Live Indicator Coordinate Highlighting */}
            {rawText ? (
              <div className="spatial-carrier-text-display">
                <div className="spatial-carrier-meta-tag">FORENSIC TEXT PAYLOAD ({rawText.length} CHARS)</div>
                <div className="spatial-carrier-stream">
                  {rawText.slice(0, 480)}
                  {rawText.length > 480 ? '… [REMAINDER BUFFERED]' : ''}
                </div>
              </div>
            ) : (
              <div className="spatial-carrier-empty">
                Payload ingested via non-textual OCR multimodal carrier.
              </div>
            )}

            {/* Active Provenance Inspector Pin */}
            {activeIndicator && (
              <div className="spatial-provenance-hud">
                <div className="spatial-hud-title">ACTIVE PROVENANCE INSPECTOR</div>
                <div className="spatial-hud-grid">
                  <div>
                    <span className="hud-key">INDICATOR:</span>
                    <span className="hud-val">{activeIndicator.name}</span>
                  </div>
                  <div>
                    <span className="hud-key">SEVERITY:</span>
                    <span className="hud-val" style={{ color: activeIndicator.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>
                      {activeIndicator.severity}
                    </span>
                  </div>
                  <div>
                    <span className="hud-key">SOURCE:</span>
                    <span className="hud-val">{activeIndicator.evidenceSource || activeIndicator.source || 'RAW_PAYLOAD'}</span>
                  </div>
                  <div>
                    <span className="hud-key">COORDINATES:</span>
                    <span className="hud-val">
                      [{activeIndicator.characterRange ? activeIndicator.characterRange[0] : 0}..{activeIndicator.characterRange ? activeIndicator.characterRange[1] : activeIndicator.evidence.length}]
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Floating 3D Evidence Shard Constellation */}
        <div className="spatial-shards-constellation">
          <div className="spatial-shards-header">
            <span>DETACHED FORENSIC SHARDS (CLICK TO ISOLATE)</span>
          </div>

          <div className="spatial-shards-grid">
            {observedIndicators.length === 0 ? (
              <div className="spatial-no-shards-box">
                <div className="spatial-no-shards-icon">∅</div>
                <div className="spatial-no-shards-txt">No adversarial evidence shards detached. Content evaluated clean.</div>
              </div>
            ) : (
              observedIndicators.map((ind, idx) => {
                const isSelected = selectedIndicatorId === ind.id;
                const isHovered = hoveredId === ind.id;
                const sevColor =
                  ind.severity === 'CRITICAL' || ind.severity === 'HIGH'
                    ? 'var(--scamvera-danger, #ef4444)'
                    : ind.severity === 'MEDIUM'
                    ? 'var(--scamvera-warning, #f59e0b)'
                    : 'var(--scamvera-cyan, #06b6d4)';

                return (
                  <div
                    key={ind.id}
                    className={`spatial-shard-card ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                    onMouseEnter={() => setHoveredId(ind.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onSelectIndicator && onSelectIndicator(isSelected ? null : ind.id)}
                    style={{
                      '--shard-accent': sevColor,
                    } as React.CSSProperties}
                  >
                    <div className="spatial-shard-header">
                      <span className="spatial-shard-tag">#0{idx + 1} // {ind.category}</span>
                      <span className="spatial-shard-sev" style={{ color: sevColor }}>
                        {ind.severity}
                      </span>
                    </div>

                    <div className="spatial-shard-quote">
                      &ldquo;{ind.evidence}&rdquo;
                    </div>

                    <div className="spatial-shard-explanation">
                      {ind.explanation}
                    </div>

                    <div className="spatial-shard-footer">
                      <span className="spatial-shard-weight">CATEGORY: {ind.category}</span>
                      <span className="spatial-shard-click-hint">
                        {isSelected ? 'ACTIVE SELECTION' : 'CLICK TO ISOLATE'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
