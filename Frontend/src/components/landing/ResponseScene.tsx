import React, { useState } from 'react';

interface DirectorySample {
  institution: string;
  category: string;
  officialDomain: string;
  officialPhone: string;
  fraudReportingUrl: string;
}

const DIRECTORY_SAMPLES: DirectorySample[] = [
  {
    institution: 'JPMorgan Chase & Co.',
    category: 'FINANCIAL_INSTITUTION',
    officialDomain: 'chase.com',
    officialPhone: '1-800-935-9935',
    fraudReportingUrl: 'chase.com/security/report-fraud',
  },
  {
    institution: 'United States Postal Service (USPS)',
    category: 'LOGISTICS_POSTAL',
    officialDomain: 'usps.com',
    officialPhone: '1-800-275-8777',
    fraudReportingUrl: 'uspis.gov/report',
  },
  {
    institution: 'Amazon.com Inc.',
    category: 'ECOMMERCE_PLATFORM',
    officialDomain: 'amazon.com',
    officialPhone: '1-888-280-4331',
    fraudReportingUrl: 'amazon.com/reportascam',
  },
];

export const ResponseScene: React.FC = () => {
  const [selectedInstIdx, setSelectedInstIdx] = useState<number>(0);
  const selectedInst = DIRECTORY_SAMPLES[selectedInstIdx];

  return (
    <section id="response-stream" className="landing-section" aria-label="Incident Containment and Response Directive">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-block">
          <div className="section-label-tag">06 // INCIDENT CONTAINMENT & RESPONSE</div>
          <h2 className="section-title">
            From forensic analysis to active defense.
          </h2>
          <p className="section-desc">
            When an attack is identified, Scamvera transitions from analysis into operational incident response.
            Clear, prioritized directives replace panic with verifiable defensive action.
          </p>
        </div>

        {/* Operational Split Directive Grid */}
        <div className="response-directive-split">
          {/* Left Column: Immediate Containment (WHAT NOT TO DO) */}
          <div className="directive-card-danger">
            <div className="directive-header">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                ✕
              </div>
              <div>
                <h3 className="directive-title" style={{ color: '#fca5a5' }}>
                  Immediate Containment
                </h3>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(248, 113, 113, 0.8)' }}>
                  WHAT NOT TO DO // PREVENT COMPROMISE
                </span>
              </div>
            </div>

            <div className="directive-item-row">
              <span className="directive-bullet" style={{ color: '#ef4444' }}>•</span>
              <div>
                <strong>DO NOT click embedded links</strong> or navigate to the suspicious domain.
              </div>
            </div>

            <div className="directive-item-row">
              <span className="directive-bullet" style={{ color: '#ef4444' }}>•</span>
              <div>
                <strong>DO NOT dial caller ID numbers</strong> provided in unsolicited alerts or voicemails.
              </div>
            </div>

            <div className="directive-item-row">
              <span className="directive-bullet" style={{ color: '#ef4444' }}>•</span>
              <div>
                <strong>DO NOT transmit one-time codes</strong>, authentication tokens, or debit PINs.
              </div>
            </div>

            <div className="directive-item-row">
              <span className="directive-bullet" style={{ color: '#ef4444' }}>•</span>
              <div>
                <strong>DO NOT initiate wire or gift-card payments</strong> to "reverse" a simulated transaction.
              </div>
            </div>
          </div>

          {/* Right Column: Active Remediation (WHAT TO DO) */}
          <div className="directive-card-success">
            <div className="directive-header">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                ✓
              </div>
              <div>
                <h3 className="directive-title" style={{ color: '#6ee7b7' }}>
                  Active Remediation
                </h3>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(52, 211, 153, 0.8)' }}>
                  WHAT TO DO // VERIFIABLE MITIGATION
                </span>
              </div>
            </div>

            <div className="directive-item-row">
              <span className="directive-bullet" style={{ color: '#10b981' }}>•</span>
              <div>
                <strong>Lock compromised cards</strong> directly via your bank's verified standalone mobile app.
              </div>
            </div>

            <div className="directive-item-row">
              <span className="directive-bullet" style={{ color: '#10b981' }}>•</span>
              <div>
                <strong>Verify out-of-band</strong> using Scamvera's static institutional channel directory below.
              </div>
            </div>

            <div className="directive-item-row">
              <span className="directive-bullet" style={{ color: '#10b981' }}>•</span>
              <div>
                <strong>Export forensic case report (PDF/JSON)</strong> for fraud claims and police incident reports.
              </div>
            </div>

            <div className="directive-item-row">
              <span className="directive-bullet" style={{ color: '#10b981' }}>•</span>
              <div>
                <strong>Place a fraud alert</strong> with major credit bureaus if personal identifiers were exposed.
              </div>
            </div>
          </div>
        </div>

        {/* Curated Static Verification Directory Preview */}
        <div className="pipeline-inspector-pane" style={{ marginTop: '36px' }}>
          <div className="inspector-head">
            <div className="inspector-meta-row">
              <span className="inspector-badge">OUT-OF-BAND REGISTRY</span>
              <span className="inspector-status-badge status-locked">ZERO ACTIVE WEB SCRAPING</span>
            </div>
            <h3 className="inspector-stage-title">Static Institutional Directory Lookup</h3>
            <p className="inspector-stage-summary">
              Scamvera maintains an internal verified coordinate directory. Never use links or numbers from suspicious messages to verify claims.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {DIRECTORY_SAMPLES.map((sample, idx) => (
              <button
                key={sample.institution}
                type="button"
                className={`btn-secondary ${selectedInstIdx === idx ? 'btn-active' : ''}`}
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderColor: selectedInstIdx === idx ? 'var(--scamvera-cyan)' : undefined,
                  color: selectedInstIdx === idx ? 'var(--scamvera-cyan)' : undefined,
                }}
                onClick={() => setSelectedInstIdx(idx)}
              >
                {sample.institution}
              </button>
            ))}
          </div>

          <div className="inspector-telemetry-box">
            <div className="telemetry-box-top">
              <span className="box-channel-label">VERIFIED_COORDINATES</span>
              <span className="box-mode-label">{selectedInst.category}</span>
            </div>
            <div className="telemetry-box-body">
              <div className="telemetry-row">
                <span className="t-key">OFFICIAL DOMAIN:</span>
                <code className="t-code text-cyan">https://{selectedInst.officialDomain}</code>
              </div>
              <div className="telemetry-row">
                <span className="t-key">VERIFIED PHONE:</span>
                <span className="t-val text-green">{selectedInst.officialPhone}</span>
              </div>
              <div className="telemetry-row">
                <span className="t-key">OFFICIAL REPORTING:</span>
                <span className="t-val">{selectedInst.fraudReportingUrl}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
