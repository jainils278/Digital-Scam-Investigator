import React from 'react';

interface HeaderProps {
  activeAiMode?: string;
  isRealAi?: boolean;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenReference: () => void;
  onNewInvestigation: () => void;
  hasActiveReport?: boolean;
  onDownloadReport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  historyCount,
  onOpenHistory,
  onOpenReference,
  onNewInvestigation,
  hasActiveReport,
  onDownloadReport,
}) => {
  return (
    <header className="workstation-header">
      <div className="header-inner">
        {/* Brand Identity */}
        <div className="brand-section">
          <div className="brand-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
          </div>
          <div>
            <h1 className="brand-title">DIGITAL SCAM INVESTIGATOR</h1>
            <p className="brand-subtitle">DEFENSIVE CYBER INVESTIGATION WORKSTATION</p>
          </div>
        </div>

        {/* Status Telemetry */}
        <div className="header-telemetry">
          <div className="status-badge" title="Defensive analysis pipeline is ready">
            <span className="status-dot"></span>
            <span>System Ready</span>
          </div>

          <div
            className="privacy-badge"
            title="No investigation data is stored by this application. Input is processed in volatile memory with zero server retention."
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No Investigation Data Stored</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Zero server retention</div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="header-actions">
          {hasActiveReport && onDownloadReport ? (
            <button
              type="button"
              className="btn-primary btn-header"
              onClick={onDownloadReport}
              style={{
                backgroundColor: '#0284c7',
                borderColor: '#0284c7',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '13px',
              }}
              title="Download standalone executive and technical investigation report"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download Full Investigation Report</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-secondary btn-header"
                onClick={onOpenReference}
                title="Open threat pattern & scam archetype reference guide"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span>Threat Reference</span>
              </button>

              <button
                type="button"
                className="btn-secondary btn-header"
                onClick={onOpenHistory}
                title="Inspect local browser investigation history"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>History ({historyCount})</span>
              </button>

              <button
                type="button"
                className="btn-primary btn-header"
                onClick={onNewInvestigation}
                title="Start a fresh investigation"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>New Investigation</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
