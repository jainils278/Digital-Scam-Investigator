import React, { useState } from 'react';

export const InvestigationArtifact: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [activeHighlight, setActiveHighlight] = useState<string | null>('domain');

  return (
    <div className={`investigation-artifact-root ${className}`}>
      {/* 3D Forensic Card Container */}
      <div className="investigation-artifact-card">
        {/* Forensic Header Bar */}
        <div className="artifact-header">
          <div className="artifact-meta-left">
            <span className="artifact-indicator-dot" />
            <span className="artifact-case-tag">CASE // SV-3091</span>
            <span className="artifact-channel-badge">SMS TRANSMISSION</span>
          </div>
          <div className="artifact-meta-right">
            <span className="artifact-source-tag">UNVERIFIED ORIGIN</span>
            <span className="artifact-time-tag">T+0.04s PROCESSED</span>
          </div>
        </div>

        {/* Sender Coordinate Frame */}
        <div className="artifact-sender-row">
          <span className="sender-label">SENDER:</span>
          <span className="sender-val">+1 (844) 592-3011</span>
          <span className="sender-spoof-warning">[CARRIER UNVERIFIED / VOIP ROUTED]</span>
        </div>

        {/* Message Ingestion Body with Highlighted Forensic Indicators */}
        <div className="artifact-message-box">
          <p className="artifact-message-content">
            <span
              className={`forensic-token token-urgency ${activeHighlight === 'urgency' ? 'active' : ''}`}
              onMouseEnter={() => setActiveHighlight('urgency')}
              onClick={() => setActiveHighlight('urgency')}
            >
              URGENT: Chase Bank Alert
              <span className="token-tag">TACTIC: ARTIFICIAL_URGENCY (+15)</span>
            </span>{' '}
            Suspicious transfer of{' '}
            <span
              className={`forensic-token token-financial ${activeHighlight === 'financial' ? 'active' : ''}`}
              onMouseEnter={() => setActiveHighlight('financial')}
              onClick={() => setActiveHighlight('financial')}
            >
              $1,420.00 USD
              <span className="token-tag">PRETEXT: FABRICATED_DEBIT (+20)</span>
            </span>{' '}
            initiated. If you did not authorize this transaction, secure your account immediately via our verification portal:{' '}
            <span
              className={`forensic-token token-domain ${activeHighlight === 'domain' ? 'active' : ''}`}
              onMouseEnter={() => setActiveHighlight('domain')}
              onClick={() => setActiveHighlight('domain')}
            >
              https://chase-security-auth.com/login
              <span className="token-tag">SIGNAL: LOOKALIKE_TYPOSQUAT (+35)</span>
            </span>
          </p>
        </div>

        {/* Forensic Telemetry & Evidence Ledger Strip */}
        <div className="artifact-ledger-strip">
          <div className="ledger-item">
            <span className="ledger-key">EVIDENCE COUNT:</span>
            <span className="ledger-val">3 VERIFIED</span>
          </div>
          <div className="ledger-item">
            <span className="ledger-key">SYNERGY BONUS:</span>
            <span className="ledger-val text-red">+15 (COERCION + URL)</span>
          </div>
          <div className="ledger-item">
            <span className="ledger-key">PIVOT FACTOR:</span>
            <span className="ledger-val text-cyan">CATEGORY: LOOKALIKE_URL</span>
          </div>
        </div>

        {/* Mini Deterministic Risk HUD */}
        <div className="artifact-risk-hud">
          <div className="hud-score-cluster">
            <div className="hud-score-number">85</div>
            <div className="hud-score-meta">
              <span className="hud-score-level">HIGH RISK</span>
              <span className="hud-score-calc">DETERMINISTIC FORMULA</span>
            </div>
          </div>
          <div className="hud-verdict-cluster">
            <div className="hud-verdict-title">DECEPTIVE BANKING PRETEXT</div>
            <div className="hud-verdict-desc">
              Impersonates financial institution to harvest authentication credentials through typosquatted domain.
            </div>
          </div>
        </div>

        {/* Background Technical Watermark / Grid Lines */}
        <div className="artifact-watermark" aria-hidden="true">
          SCAMVERA // DETERMINISTIC EVIDENCE RECONSTRUCTION
        </div>
      </div>
    </div>
  );
};
