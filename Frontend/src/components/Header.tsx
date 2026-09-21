import React from 'react';

interface HeaderProps {
  activeAiMode?: string;
  isRealAi?: boolean;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenReference: () => void;
  onNewInvestigation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeAiMode = 'Local Heuristic',
  isRealAi = false,
  historyCount,
  onOpenHistory,
  onOpenReference,
  onNewInvestigation,
}) => {
  return (
    <header className="workstation-header">
      <div className="header-inner">
        <div className="brand-section">
          <div className="brand-icon">🛡️</div>
          <div>
            <h1 className="brand-title">DIGITAL SCAM INVESTIGATOR</h1>
            <p className="brand-subtitle">Defensive Cyber Threat Workstation</p>
          </div>
        </div>

        <div className="header-telemetry">
          <div className="status-badge" title="Defensive engine is operational and ready">
            <span className="status-dot"></span>
            <span>ENGINE: OPERATIONAL</span>
          </div>

          <div
            className="mode-badge"
            title={`Active Contextual Engine: ${activeAiMode} (${isRealAi ? 'Server-side OpenAI' : 'Deterministic Offline Heuristic'})`}
          >
            <span>MODE: {isRealAi ? 'REAL AI CONTEXT' : 'LOCAL HEURISTIC'}</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenReference}
            title="Open scam threat intelligence and attack pattern guide"
          >
            📖 Threat Reference
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenHistory}
            title="Inspect local investigation records"
          >
            ⏱️ View History ({historyCount})
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onNewInvestigation}
            title="Clear and start a fresh investigation"
          >
            + New Investigation
          </button>
        </div>
      </div>
    </header>
  );
};
