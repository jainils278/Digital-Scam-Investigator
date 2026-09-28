import React from 'react';
import type { InvestigationReport } from '../../types';
import { deriveExecutiveSummary } from '../../utils/executiveSummary';

interface PrimaryReportOverviewProps {
  report: InvestigationReport;
  onViewAdditionalInfo: () => void;
  onDownloadPdf?: () => void;
  onDownloadHtml?: () => void;
  onDownloadJson?: () => void;
}

export const PrimaryReportOverview: React.FC<PrimaryReportOverviewProps> = ({
  report,
  onViewAdditionalInfo,
  onDownloadPdf,
  onDownloadHtml,
  onDownloadJson,
}) => {
  const summary = deriveExecutiveSummary(report);
  const { riskScore, riskLevel, plainEnglishSummary, strongestIndicators, doActions, dontActions, disclaimer } = summary;

  // Level theme colors
  const levelColor =
    riskLevel === 'CRITICAL' || riskLevel === 'HIGH'
      ? '#ef4444'
      : riskLevel === 'MEDIUM'
      ? '#f59e0b'
      : riskLevel === 'LOW'
      ? '#10b981'
      : '#38bdf8';

  const levelBg =
    riskLevel === 'CRITICAL' || riskLevel === 'HIGH'
      ? 'rgba(239, 68, 68, 0.12)'
      : riskLevel === 'MEDIUM'
      ? 'rgba(245, 158, 11, 0.12)'
      : riskLevel === 'LOW'
      ? 'rgba(16, 185, 129, 0.12)'
      : 'rgba(56, 189, 248, 0.12)';

  const levelBorder =
    riskLevel === 'CRITICAL' || riskLevel === 'HIGH'
      ? 'rgba(239, 68, 68, 0.35)'
      : riskLevel === 'MEDIUM'
      ? 'rgba(245, 158, 11, 0.35)'
      : riskLevel === 'LOW'
      ? 'rgba(16, 185, 129, 0.35)'
      : 'rgba(56, 189, 248, 0.35)';

  return (
    <div className="primary-overview-root" id="primary-report-overview">
      {/* =========================================================================
          A. FINAL SCORE / RISK
          ========================================================================= */}
      <section className="overview-risk-card" style={{ borderColor: levelBorder }} aria-labelledby="risk-summary-title">
        <div className="overview-risk-header">
          <div className="overview-risk-badge-box" style={{ background: levelBg, borderColor: levelBorder, color: levelColor }}>
            <span className="overview-risk-pulse-dot" style={{ background: levelColor }} />
            <span className="overview-risk-tier-label">{riskLevel} RISK</span>
          </div>
          <div className="overview-risk-score-display">
            <span className="overview-score-num" style={{ color: levelColor }}>{riskScore}</span>
            <span className="overview-score-denom">/ 100</span>
          </div>
        </div>

        {/* Visual score progression meter */}
        <div className="overview-score-bar-track" role="progressbar" aria-valuenow={riskScore} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="overview-score-bar-fill"
            style={{ width: `${Math.min(100, Math.max(0, riskScore))}%`, backgroundColor: levelColor }}
          />
        </div>

        {/* One short plain-English explanation under the final score */}
        <p className="overview-plain-summary" id="risk-summary-title">
          {plainEnglishSummary}
        </p>
      </section>

      {/* =========================================================================
          B. WHY WAS THIS FLAGGED? (3–5 Strongest Verified Indicators)
          ========================================================================= */}
      <section className="overview-card-panel why-flagged-panel" aria-labelledby="why-flagged-title">
        <div className="overview-card-title-row">
          <div className="overview-card-icon icon-amber">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h2 className="overview-card-title" id="why-flagged-title">Why Was This Flagged?</h2>
        </div>

        <p className="overview-panel-intro">
          The strongest verified indicators identified in the submitted evidence:
        </p>

        <div className="overview-indicators-list">
          {strongestIndicators.length > 0 ? (
            strongestIndicators.map((ind, idx) => (
              <div key={ind.id || idx} className="overview-indicator-item">
                <div className="overview-indicator-top">
                  <span className="overview-indicator-name">{ind.name}</span>
                  <span className={`overview-indicator-severity sev-${ind.severity.toLowerCase()}`}>
                    {ind.severity}
                  </span>
                </div>
                <p className="overview-indicator-why">
                  {ind.whyItMatters}
                </p>
                {ind.evidenceQuote && (
                  <div className="overview-indicator-evidence">
                    <span className="evidence-quote-lead">Quote:</span> &ldquo;{ind.evidenceQuote}&rdquo;
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="overview-empty-indicators">
              No suspicious patterns or scam indicators were identified in the submitted content.
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          C & D. WHAT YOU SHOULD DO (DO) & WHAT YOU SHOULD NOT DO (DON'T)
          ========================================================================= */}
      <div className="overview-dos-donts-grid">
        {/* C. WHAT YOU SHOULD DO */}
        <section className="overview-card-panel do-card-panel" aria-labelledby="what-to-do-title">
          <div className="overview-card-title-row">
            <div className="overview-card-icon icon-emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="overview-card-title title-do" id="what-to-do-title">What You Should Do</h2>
          </div>

          <ul className="overview-action-list">
            {doActions.map((action, idx) => (
              <li key={idx} className="overview-action-item do-item">
                <span className="action-check-badge" aria-hidden="true">✓</span>
                <span className="action-text">{action}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* D. WHAT YOU SHOULD NOT DO */}
        <section className="overview-card-panel dont-card-panel" aria-labelledby="what-not-to-do-title">
          <div className="overview-card-title-row">
            <div className="overview-card-icon icon-rose">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h2 className="overview-card-title title-dont" id="what-not-to-do-title">What You Should NOT Do</h2>
          </div>

          <ul className="overview-action-list">
            {dontActions.map((action, idx) => (
              <li key={idx} className="overview-action-item dont-item">
                <span className="action-cross-badge" aria-hidden="true">✕</span>
                <span className="action-text">{action}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* =========================================================================
          E. DISCLAIMER
          ========================================================================= */}
      <aside className="overview-disclaimer-card" aria-label="Assessment Disclaimer">
        <div className="overview-disclaimer-header">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>ASSESSMENT DISCLAIMER</span>
        </div>
        <p className="overview-disclaimer-text">{disclaimer}</p>
      </aside>

      {/* =========================================================================
          VIEW ADDITIONAL INFORMATION (Progressive Disclosure Primary Action)
          ========================================================================= */}
      <div className="overview-disclosure-footer">
        <button
          type="button"
          className="btn-view-additional-info"
          onClick={onViewAdditionalInfo}
          id="btn-view-additional-info"
        >
          <span className="view-more-plus">+</span>
          <span className="view-more-text">VIEW ADDITIONAL INFORMATION</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
        <span className="view-more-hint">
          Access complete evidence matching, scam tactics, timeline, network graph, and sensitivity models.
        </span>

        {/* Quick Report Download Actions */}
        <div className="overview-download-row">
          {onDownloadPdf && (
            <button
              type="button"
              className="overview-download-btn"
              onClick={onDownloadPdf}
              id="overview-download-pdf-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download PDF</span>
            </button>
          )}

          {onDownloadHtml && (
            <button
              type="button"
              className="overview-download-btn"
              onClick={onDownloadHtml}
              id="overview-download-html-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>Download HTML</span>
            </button>
          )}

          {onDownloadJson && (
            <button
              type="button"
              className="overview-download-btn"
              onClick={onDownloadJson}
              id="overview-download-json-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>Export JSON</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
