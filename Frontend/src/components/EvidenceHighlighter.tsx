import React from 'react';
import type { ObservedIndicator } from '../types';

interface EvidenceHighlighterProps {
  rawText: string;
  indicators: ObservedIndicator[];
  selectedIndicatorId: string | null;
  onSelectIndicator: (id: string) => void;
}

interface TextSegment {
  text: string;
  isHighlight: boolean;
  indicator?: ObservedIndicator;
}

export const EvidenceHighlighter: React.FC<EvidenceHighlighterProps> = ({
  rawText,
  indicators,
  selectedIndicatorId,
  onSelectIndicator,
}) => {
  if (indicators.length === 0) {
    return (
      <div className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <div className="panel-title">
            <span>🔍</span>
            <span>SUBMITTED TEXT INSPECTOR</span>
            <span className="panel-title-badge">SOURCE VERBATIM</span>
          </div>
        </div>
        <div className="highlighter-terminal">
          {rawText}
        </div>
        <div style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>✓</span>
          <span>No suspicious patterns or coercive triggers highlighted in this input text.</span>
        </div>
      </div>
    );
  }

  // Filter out full-text evasion flags from inline text slicing
  const inlineIndicators = indicators.filter(
    (ind) => !ind.id.startsWith('ind_evasion_') && ind.characterRange[0] < ind.characterRange[1]
  );

  // Sort indicators by start position
  const sorted = [...inlineIndicators].sort((a, b) => a.characterRange[0] - b.characterRange[0]);

  // Construct non-overlapping text segments
  const segments: TextSegment[] = [];
  let currentIndex = 0;

  for (const ind of sorted) {
    const [start, end] = ind.characterRange;

    // Safety check against invalid bounds
    if (start < currentIndex || start >= rawText.length) {
      continue;
    }

    // Add plain text before this indicator
    if (start > currentIndex) {
      segments.push({
        text: rawText.slice(currentIndex, start),
        isHighlight: false,
      });
    }

    // Add the highlighted evidence segment
    const actualEnd = Math.min(end, rawText.length);
    segments.push({
      text: rawText.slice(start, actualEnd),
      isHighlight: true,
      indicator: ind,
    });

    currentIndex = actualEnd;
  }

  // Add remaining trailing text
  if (currentIndex < rawText.length) {
    segments.push({
      text: rawText.slice(currentIndex),
      isHighlight: false,
    });
  }

  return (
    <div className="panel-card" style={{ marginBottom: '24px' }}>
      <div className="panel-header">
        <div className="panel-title">
          <span>🔍</span>
          <span>EVIDENCE SOURCE INSPECTOR</span>
          <span className="panel-title-badge">{indicators.length} VERIFIED INDICATORS</span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Click any highlighted phrase to jump to its evidence rationale
        </span>
      </div>

      <div className="highlighter-terminal">
        {segments.map((seg, i) => {
          if (!seg.isHighlight || !seg.indicator) {
            return <React.Fragment key={i}>{seg.text}</React.Fragment>;
          }

          const ind = seg.indicator;
          const isSelected = selectedIndicatorId === ind.id;

          return (
            <span
              key={i}
              className={`evidence-highlight-span ${ind.severity} ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectIndicator(ind.id)}
              title={`${ind.name} [${ind.severity}] - Click to inspect rationale`}
            >
              {seg.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
