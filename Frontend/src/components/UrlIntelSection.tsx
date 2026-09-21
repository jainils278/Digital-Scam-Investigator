import React from 'react';
import type { UrlAnalysisSummary } from '../types';

interface UrlIntelSectionProps {
  urlAnalysis?: UrlAnalysisSummary[];
}

export const UrlIntelSection: React.FC<UrlIntelSectionProps> = ({ urlAnalysis }) => {
  if (!urlAnalysis || urlAnalysis.length === 0) {
    return (
      <div className="report-section">
        <div className="section-label">URL & DOMAIN THREAT INTELLIGENCE</div>
        <h3 className="section-heading">No Outbound Links Detected</h3>
        <p className="section-subtext">
          The investigated message does not contain embedded web links, bare IP addresses, or domain redirects.
        </p>
      </div>
    );
  }

  return (
    <div className="report-section">
      <div className="section-label">URL & DOMAIN THREAT INTELLIGENCE</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 className="section-heading">Inspected Web Links & Destination Infrastructure</h3>
          <p className="section-subtext">
            Extracted URLs analyzed for typosquatting, Punycode lookalikes, subdomain stacking, and reputation.
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
          }}
        >
          🛡️ SSRF Protected (Internal IPs Blocked)
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
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    🔗 {item.url}
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                    Registered Domain: <strong>{item.domain}</strong> {item.tld && `(TLD: .${item.tld})`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`risk-level-badge ${badgeClass}`}>
                    {item.reputationStatus || (isHighRisk ? 'HIGH RISK' : isMediumRisk ? 'SUSPICIOUS' : 'NEUTRAL')}
                  </span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    Score: {item.riskScore}/100
                  </span>
                </div>
              </div>

              {/* Tag Pills */}
              <div className="tag-list" style={{ marginBottom: '10px' }}>
                {item.isBareIp && (
                  <span className="tag-item" style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                    ⚠️ Bare Numeric IP Host
                  </span>
                )}
                {item.isShortener && (
                  <span className="tag-item" style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                    🔀 URL Shortener Mask
                  </span>
                )}
                {(item.isPunycode || item.hasHomoglyph) && (
                  <span className="tag-item" style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                    🚨 Punycode / Homoglyph Spoof
                  </span>
                )}
                {item.reputationStatus === 'AUTHENTIC_BRAND' && (
                  <span className="tag-item" style={{ color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.4)' }}>
                    ✓ Verified Authentic Brand Domain
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
                  <strong>Intelligence Assessment:</strong> {item.threatDetails}
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
