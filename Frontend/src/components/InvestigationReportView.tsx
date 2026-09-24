import React from 'react';
import type { InvestigationReport } from '../types';

interface InvestigationReportViewProps {
  report: InvestigationReport;
  selectedIndicatorId?: string | null;
  onSelectIndicator?: (id: string | null) => void;
  onDownloadReport?: () => void;
  onBackToNewInvestigation?: () => void;
}

export const InvestigationReportView: React.FC<InvestigationReportViewProps> = ({
  report,
  onDownloadReport,
  onBackToNewInvestigation,
}) => {
  const { observedIndicators, aiContext, riskAssessment, defensiveRecommendations, screenshotMeta, id, timestamp } = report;
  const { score, level, primaryCategories } = riskAssessment;

  // Format date for Investigated timestamp (e.g. Sep 23, 2026 • 9:16 PM)
  const formatInvestigatedDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getUTCMonth()];
      const day = d.getUTCDate();
      const year = d.getUTCFullYear();
      let hours = d.getUTCHours();
      const minutes = d.getUTCMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${month} ${day}, ${year} • ${hours}:${minutes} ${ampm}`;
    } catch {
      return iso;
    }
  };

  // Determine mode label
  const isScreenshot = !!screenshotMeta;
  const isUrlMode = !!(report.urlAnalysis && report.urlAnalysis.length > 0);
  const modeLabel = isScreenshot ? 'Screenshot OCR' : isUrlMode ? 'URL Analysis' : 'Text Analysis';

  // Level theme colors
  const levelColor =
    level === 'CRITICAL' || level === 'HIGH'
      ? '#ef4444'
      : level === 'MEDIUM'
      ? '#f59e0b'
      : level === 'LOW'
      ? '#10b981'
      : '#38bdf8';

  // Circular gauge circumference for r=42 is 263.89
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  // Derive plain-language simple conclusion
  const getSimpleConclusion = () => {
    if (level === 'BENIGN' || level === 'LOW') {
      return `The ${isScreenshot ? 'image' : 'message'} does not contain recognized scam patterns currently checked by the system. However, this does not verify the sender or guarantee authenticity.`;
    }
    if (level === 'CRITICAL' || level === 'HIGH') {
      return `The ${isScreenshot ? 'image' : 'message'} contains a reward claim that uses urgency and a payment request. This combination is commonly used in scams to pressure people into sharing money or personal information.`;
    }
    return `The ${isScreenshot ? 'image' : 'message'} contains warning signs commonly associated with ${primaryCategories.join(' and ') || 'suspicious communications'}. Verify the sender through trusted independent channels before responding.`;
  };

  // Segregate Do and Don't actions
  const doItems: string[] = [];
  const dontItems: string[] = [];

  if (defensiveRecommendations && defensiveRecommendations.length > 0) {
    for (const rec of defensiveRecommendations) {
      const act = rec.action;
      const lower = act.toLowerCase();
      if (
        lower.startsWith('do not') ||
        lower.startsWith("don't") ||
        lower.includes('refuse') ||
        lower.includes('halt') ||
        lower.includes('never')
      ) {
        dontItems.push(act);
      } else {
        doItems.push(act);
      }
    }
  }

  // Fallbacks if recommendations are sparse
  if (dontItems.length === 0) {
    dontItems.push('Do not send money or make any payments.');
    dontItems.push('Do not share verification codes or account details.');
    dontItems.push('Do not assume the message is genuine, even if it looks official.');
  }
  if (doItems.length === 0) {
    doItems.push('Do not share passwords, personal information or payment details.');
    doItems.push('Do not click on the link or respond to the message.');
    doItems.push('Verify the request using the official website or a trusted contact.');
    doItems.push('If you already shared information, secure your account immediately.');
  }

  // Derive Observed / Verified Information bullets
  const observedFacts: string[] = [];
  if (observedIndicators && observedIndicators.length > 0) {
    for (const ind of observedIndicators.slice(0, 4)) {
      if (ind.evidence) {
        observedFacts.push(`Identified ${ind.name.toLowerCase()}: "${ind.evidence}"`);
      } else {
        observedFacts.push(ind.explanation);
      }
    }
  } else {
    observedFacts.push('No recognized scam patterns detected in submitted content.');
    observedFacts.push('No suspicious payment demands or credential solicitation identified.');
  }

  // Derive AI Interpretation bullets
  const aiPoints: string[] = [];
  if (aiContext) {
    if (aiContext.socialEngineeringTactics) {
      aiPoints.push(aiContext.socialEngineeringTactics);
    }
    if (aiContext.scamArchetypes && aiContext.scamArchetypes.length > 0) {
      aiPoints.push('Associated scam archetypes: ' + aiContext.scamArchetypes.join(', ') + '.');
    }
    if (aiContext.psychologicalTriggers && aiContext.psychologicalTriggers.length > 0) {
      aiPoints.push(`Identified persuasion triggers: ${aiContext.psychologicalTriggers.join(', ')}.`);
    }
  }
  if (aiPoints.length === 0) {
    if (level === 'CRITICAL' || level === 'HIGH') {
      aiPoints.push('The message is likely a scam based on common patterns.');
      aiPoints.push('The reward and payment request are used to create urgency.');
      aiPoints.push('The link may lead to a fraudulent website to collect money or information.');
    } else {
      aiPoints.push('The message pattern does not exhibit recognized manipulative social engineering tactics.');
      aiPoints.push('Maintain standard verification habits for unsolicited communications.');
    }
  }
  return (
    <div className="investigation-report-layout" id="investigation-report-section">
      {/* 1. Sub-Header Back Navigation */}
      {onBackToNewInvestigation && (
        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className="back-nav-link"
            onClick={onBackToNewInvestigation}
            title="Return to submission input terminal"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to New Investigation</span>
          </button>
        </div>
      )}

      {/* 2. Top Hero Card: Score, Level & Audit Metadata */}
      <div className="result-hero-card" style={{ borderLeftColor: levelColor }}>
        {/* Left: Circular SVG Score Gauge */}
        <div className="gauge-container">
          <svg className="gauge-svg" viewBox="0 0 100 100">
            {/* Background track circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="rgba(30, 41, 59, 0.8)"
              strokeWidth="8"
            />
            {/* Glowing animated progress stroke */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={levelColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.8s ease-out',
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
                filter: `drop-shadow(0 0 6px ${levelColor}66)`,
              }}
            />
          </svg>
          <div className="gauge-inner-text">
            <div className="gauge-score">
              {score} <span className="gauge-denom">/ 100</span>
            </div>
            <div className="gauge-label">RISK SCORE</div>
          </div>
        </div>

        {/* Center: Risk Level, Title & Summary Description */}
        <div className="hero-main-content">
          <div className="level-pill" style={{ backgroundColor: `${levelColor}22`, color: levelColor, borderColor: `${levelColor}44` }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>{level} RISK</span>
          </div>

          <h2 className="hero-title">Investigation Result</h2>
          <p className="hero-description">
            {level === 'CRITICAL' || level === 'HIGH'
              ? `This message shows several warning signs commonly used in scams, including ${primaryCategories.join(' and ') || 'a prize claim and a request for payment'}.`
              : level === 'MEDIUM'
              ? `This message contains patterns that warrant caution, including ${primaryCategories.join(' and ') || 'unverified claims'}.`
              : 'No recognized scam indicators were detected in the provided submission.'}
          </p>
        </div>

        {/* Right: Mode, Investigated Date & Audit ID */}
        <div className="hero-meta-panel">
          <div className="meta-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <div>
              <div className="meta-label">Mode</div>
              <div className="meta-value">{modeLabel}</div>
            </div>
          </div>

          <div className="meta-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div>
              <div className="meta-label">Investigated</div>
              <div className="meta-value">{formatInvestigatedDate(timestamp)}</div>
            </div>
          </div>

          <div className="meta-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <div>
              <div className="meta-label">Audit ID</div>
              <div className="meta-value">#{id}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Card 1: Simple Conclusion */}
      <div className="report-card-panel">
        <div className="card-header-row">
          <div className="card-icon-circle icon-circle-blue">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="9" y1="18" x2="15" y2="18"></line>
              <line x1="10" y1="22" x2="14" y2="22"></line>
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
            </svg>
          </div>
          <h3 className="card-title">Simple Conclusion</h3>
        </div>
        <p className="card-body-text">{getSimpleConclusion()}</p>
      </div>

      {/* 4. Card 2: What You Should Do (Do vs Don't Two-Column Matrix) */}
      <div className="report-card-panel">
        <div className="card-header-row">
          <div className="card-icon-circle icon-circle-green">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
          </div>
          <h3 className="card-title">What You Should Do</h3>
        </div>

        <div className="do-dont-grid">
          {/* Green Do Box */}
          <div className="do-box">
            <div className="do-box-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Do</span>
            </div>
            <div className="checklist-items">
              {doItems.map((item, idx) => (
                <div key={idx} className="checklist-row do-row">
                  <div className="icon-badge-box do-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Red Don't Box */}
          <div className="dont-box">
            <div className="dont-box-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Don't</span>
            </div>
            <div className="checklist-items">
              {dontItems.map((item, idx) => (
                <div key={idx} className="checklist-row dont-row">
                  <div className="icon-badge-box dont-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Card 3: Assessment (Observed / Verified vs AI Interpretation) */}
      <div className="report-card-panel">
        <div className="card-header-row">
          <div className="card-icon-circle icon-circle-slate">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h3 className="card-title">Assessment</h3>
        </div>

        <div className="assessment-split-grid">
          {/* Left: Observed / Verified Information */}
          <div className="observed-box">
            <div className="observed-box-title">
              <span className="bullet-dot-blue"></span>
              <span>Observed / Verified Information</span>
            </div>
            <ul className="assessment-list">
              {observedFacts.map((fact, idx) => (
                <li key={idx} className="assessment-list-item">
                  <span className="bullet-char">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: AI Interpretation */}
          <div className="ai-box">
            <div className="ai-box-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>AI Interpretation</span>
            </div>
            <ul className="assessment-list">
              {aiPoints.map((pt, idx) => (
                <li key={idx} className="assessment-list-item">
                  <span className="bullet-char-purple">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
            <div className="ai-advisory-footnote">
              Note: This interpretation is based on the available context and is not itself verified evidence.
            </div>
          </div>
        </div>
      </div>

      {/* 6. Download Full Investigation Report Action */}
      {onDownloadReport && (
        <div className="report-download-footer-container">
          <button
            type="button"
            className="btn-download-report"
            onClick={onDownloadReport}
            id="download-investigation-report-btn"
            title="Download complete standalone investigation audit report"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download Full Investigation Report</span>
          </button>
        </div>
      )}
    </div>
  );
};
