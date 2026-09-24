import React from 'react';
import type { UrlAnalysisSummary } from '../types';

interface UrlIntelSectionProps {
  urlAnalysis?: UrlAnalysisSummary[];
}

export const UrlIntelSection: React.FC<UrlIntelSectionProps> = ({ urlAnalysis }) => {
  if (!urlAnalysis || urlAnalysis.length === 0) {
    return null;
  }

  return (
    <div className="report-section">
      <div className="section-label">PASSIVE WEB ADDRESS & DOMAIN ANALYSIS</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 className="section-heading">Inspected Web Addresses & Destination Domain</h3>
          <p className="section-subtext">
            Passive structural analysis found destination domain, typosquatting risk, lookalike characters, and structural flags without visiting external servers.
          </p>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>Passive Analysis · SSRF Protected</span>
        </span>
      </div>

      <div style={{ display: 'grid', gap: '14px', marginTop: '12px' }}>
        {urlAnalysis.map((item, index) => {
          const isHighRisk = item.riskScore >= 60 || item.reputationStatus === 'MALICIOUS';
          const isMediumRisk = item.riskScore >= 30 || item.reputationStatus === 'SUSPICIOUS';
          const badgeClass = isHighRisk ? 'badge-CRITICAL' : isMediumRisk ? 'badge-HIGH' : 'badge-LOW';

          return (
            <div
              key={index}
              style={{
                backgroundColor: 'var(--bg-input)',
                border: `1px solid ${isHighRisk ? 'var(--risk-critical-border)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    <span>{item.url}</span>
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    Registered Domain: <strong>{item.domain}</strong> {item.tld && `(Extension: .${item.tld})`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`risk-level-badge ${badgeClass}`}>
                    {item.reputationStatus || (isHighRisk ? 'HIGH RISK' : isMediumRisk ? 'SUSPICIOUS' : 'LOW RISK')}
                  </span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    Risk Score: {item.riskScore}/100
                  </span>
                </div>
              </div>

              {/* Tag Pills */}
              <div className="tag-list" style={{ marginBottom: '10px' }}>
                {item.isBareIp && (
                  <span className="tag-item" style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                    Bare Numeric IP Address
                  </span>
                )}
                {item.isShortener && (
                  <span className="tag-item" style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                    URL Shortener Mask
                  </span>
                )}
                {(item.isPunycode || item.hasHomoglyph) && (
                  <span className="tag-item" style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                    Lookalike / Homoglyph Characters
                  </span>
                )}
                {item.reputationStatus === 'AUTHENTIC_BRAND' && (
                  <span className="tag-item" style={{ color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.4)' }}>
                    Verified Brand Domain
                  </span>
                )}
                {item.suspiciousFactorsCount > 0 && (
                  <span className="tag-item" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                    {item.suspiciousFactorsCount} Structural Flag{item.suspiciousFactorsCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              {/* Threat details / Source attribution */}
              {item.threatDetails && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <strong>Analysis Findings:</strong> {item.threatDetails}
                  {item.reputationSource && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                      (Source: {item.reputationSource})
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
