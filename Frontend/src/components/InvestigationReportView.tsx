import React, { useState } from 'react';
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

  // V3.0 Progressive Disclosure Accordion States
  const [isWaterfallOpen, setIsWaterfallOpen] = useState(false);
  const [isTacticsOpen, setIsTacticsOpen] = useState(false);
  const [isContradictionsOpen, setIsContradictionsOpen] = useState(false);
  const [isChainOpen, setIsChainOpen] = useState(false);
  const [isMissingEvidenceOpen, setIsMissingEvidenceOpen] = useState(false);

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

      {/* 4. V3.0 Explainable Risk Waterfall Accordion */}
      {riskAssessment.waterfall && (
        <div className="v3-accordion-panel" id="v3-waterfall-panel">
          <button
            type="button"
            className="v3-accordion-header"
            onClick={() => setIsWaterfallOpen(!isWaterfallOpen)}
            aria-expanded={isWaterfallOpen}
          >
            <div className="v3-header-left">
              <div className="card-icon-circle icon-circle-blue">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 20V10"></path>
                  <path d="M18 20V4"></path>
                  <path d="M6 20v-4"></path>
                </svg>
              </div>
              <div>
                <h4 className="v3-header-title">Explainable Risk Score Breakdown</h4>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Mathematical provenance: Base severity + compound synergies
                </div>
              </div>
            </div>
            <div className="v3-header-right">
              <span className="v3-pill-badge v3-pill-cyan">
                Raw: {riskAssessment.waterfall.rawTotalScore} pts → Final: {riskAssessment.waterfall.finalScore}/100
              </span>
              <svg
                className={`v3-chevron ${isWaterfallOpen ? 'open' : ''}`}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </button>

          {isWaterfallOpen && (
            <div className="v3-accordion-content">
              <div className="waterfall-reconciliation-bar">
                <div className="waterfall-math-tokens">
                  <span className="waterfall-token">
                    Base: <strong style={{ color: '#f87171' }}>+{riskAssessment.waterfall.baseScore}</strong>
                  </span>
                  <span style={{ color: '#64748b' }}>+</span>
                  <span className="waterfall-token">
                    Synergy: <strong style={{ color: '#c084fc' }}>+{riskAssessment.waterfall.synergyScore}</strong>
                  </span>
                  {riskAssessment.waterfall.capAdjustment !== 0 && (
                    <>
                      <span style={{ color: '#64748b' }}>+</span>
                      <span className="waterfall-token">
                        Cap Adjustment: <strong style={{ color: '#94a3b8' }}>{riskAssessment.waterfall.capAdjustment}</strong>
                      </span>
                    </>
                  )}
                  <span style={{ color: '#64748b' }}>=</span>
                  <span className="waterfall-token-score">
                    Final Score: {riskAssessment.waterfall.finalScore} / 100
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Deterministic mathematical calculation</div>
              </div>

              <div className="waterfall-grid">
                {riskAssessment.waterfall.contributions.map((c) => (
                  <div key={c.id} className="waterfall-row-card">
                    <div
                      className={`waterfall-points-badge ${
                        c.type === 'COMPOUND_SYNERGY'
                          ? 'pts-synergy'
                          : c.type === 'CAP_ADJUSTMENT'
                          ? 'pts-cap'
                          : 'pts-base'
                      }`}
                    >
                      {c.points > 0 ? `+${c.points}` : c.points} pts
                    </div>
                    <div className="waterfall-details">
                      <div className="waterfall-label-row">
                        <span className="waterfall-label">{c.label}</span>
                        {c.evidenceQuote && (
                          <span className="waterfall-evidence-quote">"{c.evidenceQuote}"</span>
                        )}
                      </div>
                      <p className="waterfall-explanation">{c.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. V3.0 Psychological Tactic Fingerprinting Accordion */}
      {report.tactics && (
        <div className="v3-accordion-panel" id="v3-tactics-panel">
          <button
            type="button"
            className="v3-accordion-header"
            onClick={() => setIsTacticsOpen(!isTacticsOpen)}
            aria-expanded={isTacticsOpen}
          >
            <div className="v3-header-left">
              <div className="card-icon-circle icon-circle-slate">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 2a9 9 0 0 0-9 9c0 3.6 2.1 6.7 5.2 8.1V21h7.6v-1.9c3.1-1.4 5.2-4.5 5.2-8.1a9 9 0 0 0-9-9z"></path>
                  <path d="M9 22h6"></path>
                </svg>
              </div>
              <div>
                <h4 className="v3-header-title">Psychological Manipulation Tactics</h4>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Derived social engineering patterns & cognitive vulnerabilities
                </div>
              </div>
            </div>
            <div className="v3-header-right">
              <span className={`v3-pill-badge ${report.tactics.tacticCount > 0 ? 'v3-pill-purple' : 'v3-pill-green'}`}>
                {report.tactics.tacticCount} {report.tactics.tacticCount === 1 ? 'Tactic' : 'Tactics'}
              </span>
              <svg
                className={`v3-chevron ${isTacticsOpen ? 'open' : ''}`}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </button>

          {isTacticsOpen && (
            <div className="v3-accordion-content">
              <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '14px', marginBottom: '8px' }}>
                {report.tactics.summary}
              </p>
              {report.tactics.allTactics.length > 0 ? (
                <div className="tactics-grid">
                  {report.tactics.allTactics.map((tactic) => (
                    <div
                      key={tactic.id}
                      className={`tactic-card ${tactic.severity === 'CRITICAL' ? 'critical' : 'high'}`}
                    >
                      <div className="tactic-header">
                        <span className="tactic-title">{tactic.name}</span>
                        <span className="v3-pill-badge v3-pill-cyan" style={{ fontSize: '10px' }}>
                          Derived pattern
                        </span>
                      </div>
                      <div className="tactic-vuln">Target: {tactic.targetedVulnerability}</div>
                      <div className="tactic-desc">{tactic.explanation}</div>
                      <div className="tactic-tip-box">
                        <strong>Spotting Tip:</strong> {tactic.spottingTip}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', marginTop: '10px' }}>
                  No composite predatory social engineering tactic patterns detected in verified evidence.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. V3.0 Pretext Contradictions & Anomalies Accordion */}
      {report.contradictions && (
        <div className="v3-accordion-panel" id="v3-contradictions-panel">
          <button
            type="button"
            className="v3-accordion-header"
            onClick={() => setIsContradictionsOpen(!isContradictionsOpen)}
            aria-expanded={isContradictionsOpen}
          >
            <div className="v3-header-left">
              <div className="card-icon-circle icon-circle-red">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
              </div>
              <div>
                <h4 className="v3-header-title">Pretext Contradictions & Inconsistencies</h4>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Incompatibilities between claimed identity and observed indicators
                </div>
              </div>
            </div>
            <div className="v3-header-right">
              <span className={`v3-pill-badge ${report.contradictions.totalFindings > 0 ? 'v3-pill-amber' : 'v3-pill-green'}`}>
                {report.contradictions.totalFindings} {report.contradictions.totalFindings === 1 ? 'Finding' : 'Findings'}
              </span>
              <svg
                className={`v3-chevron ${isContradictionsOpen ? 'open' : ''}`}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </button>

          {isContradictionsOpen && (
            <div className="v3-accordion-content">
              <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '14px', marginBottom: '8px' }}>
                {report.contradictions.summary}
              </p>
              {report.contradictions.findings.length > 0 ? (
                <div className="contradictions-list">
                  {report.contradictions.findings.map((f) => (
                    <div key={f.id} className="contradiction-card">
                      <div className="contradiction-header">
                        <span
                          className={
                            f.classification === 'CONTRADICTION'
                              ? 'badge-contradiction'
                              : f.classification === 'ANOMALY'
                              ? 'badge-anomaly'
                              : 'badge-unsupported'
                          }
                        >
                          {f.classification === 'CONTRADICTION'
                            ? 'Direct Contradiction'
                            : f.classification === 'ANOMALY'
                            ? 'Operational Anomaly'
                            : 'Unsupported Claim'}
                        </span>
                      </div>
                      <div className="contradiction-split-row">
                        <div>
                          <div className="pretext-label">Claimed Pretext / Identity</div>
                          <div className="pretext-val">{f.claimedPretext}</div>
                        </div>
                        <div>
                          <div className="pretext-label">Observed Inconsistency</div>
                          <div className="conflicting-val">{f.conflictingEvidence}</div>
                        </div>
                      </div>
                      <p className="contradiction-explanation">{f.explanation}</p>
                      <div className="contradiction-why">
                        <strong>Why this matters:</strong> {f.whyItMatters}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', marginTop: '10px' }}>
                  No contradictions or pretext anomalies detected between claimed sender identity and observed evidence.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. V3.0 6-Stage Scam Attack Chain Progression Accordion */}
      {report.evidenceIntelligence && report.evidenceIntelligence.timeline && (
        <div className="v3-accordion-panel" id="v3-chain-panel">
          <button
            type="button"
            className="v3-accordion-header"
            onClick={() => setIsChainOpen(!isChainOpen)}
            aria-expanded={isChainOpen}
          >
            <div className="v3-header-left">
              <div className="card-icon-circle icon-circle-blue">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </div>
              <div>
                <h4 className="v3-header-title">6-Stage Scam Attack Chain Progression</h4>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Sequential attack reconstruction: Hook → Trust → Pressure → Request → Exploitation → Potential Impact
                </div>
              </div>
            </div>
            <div className="v3-header-right">
              <span className="v3-pill-badge v3-pill-cyan">
                {report.evidenceIntelligence.timeline.length} Steps
              </span>
              <svg
                className={`v3-chevron ${isChainOpen ? 'open' : ''}`}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </button>

          {isChainOpen && (
            <div className="v3-accordion-content">
              <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                {report.evidenceIntelligence.timeline.map((step) => (
                  <div
                    key={step.stepIndex}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          color: '#38bdf8',
                          fontWeight: 700,
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {step.stageLabel || `Step ${step.stepIndex}`}
                      </span>
                      {step.observedOrInferred === 'PROJECTED_CONSEQUENCE' ? (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          Potential Consequence
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            color: '#94a3b8',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          Observed
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc', marginBottom: '4px' }}>
                        {step.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                        {step.description}
                      </div>
                      {step.evidenceQuote && (
                        <div style={{ marginTop: '8px', fontSize: '12px', fontStyle: 'italic', color: '#94a3b8' }}>
                          Evidence snippet: "{step.evidenceQuote}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. V3.0 Missing Evidence & Completeness Advisor Accordion */}
      {report.missingEvidence && (
        <div className="v3-accordion-panel" id="v3-missing-evidence-panel">
          <button
            type="button"
            className="v3-accordion-header"
            onClick={() => setIsMissingEvidenceOpen(!isMissingEvidenceOpen)}
            aria-expanded={isMissingEvidenceOpen}
          >
            <div className="v3-header-left">
              <div className="card-icon-circle icon-circle-green">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="8.01"></line>
                  <line x1="11" y1="11" x2="11" y2="14"></line>
                </svg>
              </div>
              <div>
                <h4 className="v3-header-title">Missing Evidence & Verification Advisor</h4>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Evidentiary completeness assessment & safe official verification steps
                </div>
              </div>
            </div>
            <div className="v3-header-right">
              <span
                className={`v3-pill-badge ${
                  report.missingEvidence.completenessRating === 'HIGH'
                    ? 'v3-pill-green'
                    : report.missingEvidence.completenessRating === 'MODERATE'
                    ? 'v3-pill-amber'
                    : 'v3-pill-cyan'
                }`}
              >
                Completeness: {report.missingEvidence.completenessRating} ({report.missingEvidence.completenessScore}%)
              </span>
              <svg
                className={`v3-chevron ${isMissingEvidenceOpen ? 'open' : ''}`}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </button>

          {isMissingEvidenceOpen && (
            <div className="v3-accordion-content">
              <div className="completeness-meter-container">
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                  Artifact Completeness Meter:
                </div>
                <div className="completeness-bar-wrapper">
                  <div
                    className="completeness-bar-fill"
                    style={{
                      width: `${report.missingEvidence.completenessScore}%`,
                      backgroundColor:
                        report.missingEvidence.completenessScore >= 75
                          ? '#10b981'
                          : report.missingEvidence.completenessScore >= 45
                          ? '#f59e0b'
                          : '#38bdf8',
                    }}
                  ></div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                  {report.missingEvidence.completenessScore}%
                </div>
              </div>

              {/* What Scamvera Can vs Cannot Establish */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                    What Scamvera Can Establish:
                  </div>
                  <ul style={{ listStyle: 'disc', paddingLeft: '18px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {report.missingEvidence.establishedFacts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                    Not Established From Material Alone:
                  </div>
                  <ul style={{ listStyle: 'disc', paddingLeft: '18px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {report.missingEvidence.unestablishedHypotheses.map((hyp, i) => (
                      <li key={i}>{hyp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Missing Corroborating Evidence Checklist */}
              {report.missingEvidence.missingEvidenceItems.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
                    Corroborating Evidence Needed For Complete Verification:
                  </div>
                  <div className="missing-checklist">
                    {report.missingEvidence.missingEvidenceItems.map((item) => (
                      <div key={item.id} className="missing-item-card">
                        <div className="missing-item-header">{item.title}</div>
                        <div className="missing-item-what">
                          <strong>Missing:</strong> {item.whatIsMissing}
                        </div>
                        <div className="missing-item-guidance">
                          <strong>How to safely verify:</strong> {item.safeVerificationGuidance}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mandatory Advisory Note */}
              <div className="missing-advisory-box">
                <strong>Advisory:</strong> {report.missingEvidence.advisoryNote}
              </div>
            </div>
          )}
        </div>
      )}

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
