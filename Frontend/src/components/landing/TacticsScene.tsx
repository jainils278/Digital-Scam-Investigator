import React, { useState } from 'react';

interface TacticSignature {
  id: string;
  name: string;
  codename: string;
  glyph: string;
  accentColor: string;
  mechanism: string;
  forensicSignal: string;
  countermeasure: string;
  bars: number[]; // heights for signature visual waveform
}

const TACTIC_SIGNATURES: TacticSignature[] = [
  {
    id: 'urgency',
    name: 'Artificial Urgency',
    codename: 'TEMPORAL_ACCELERATION',
    glyph: '⚡',
    accentColor: '#f59e0b',
    mechanism: 'Imposes synthetic 24-hour deadlines to short-circuit critical evaluation and provoke panic action.',
    forensicSignal: 'Detected regex: "immediately", "within 24 hours", "final notice", "suspended today".',
    countermeasure: 'Enforce the 15-minute pause protocol. Legitimate institutions never require instantaneous compliance.',
    bars: [12, 18, 28, 36, 48, 64, 82, 100],
  },
  {
    id: 'authority',
    name: 'Coercive Authority',
    codename: 'INSTITUTION_HIJACK',
    glyph: '🏛️',
    accentColor: '#38bdf8',
    mechanism: 'Exploits trust in major banking, postal, or government brands to suppress normal scrutiny.',
    forensicSignal: 'Trademarks extracted ("Chase", "USPS", "IRS") coupled with unverified third-party routing domains.',
    countermeasure: 'Ignore sender headers. Cross-check against Scamvera curated static out-of-band directory.',
    bars: [80, 80, 80, 95, 95, 95, 100, 100],
  },
  {
    id: 'fear',
    name: 'Fear & Loss Aversion',
    codename: 'CATASTROPHIC_THREAT',
    glyph: '🛡️',
    accentColor: '#ef4444',
    mechanism: 'Threatens irreversible account closure, severe penalties, or immediate legal action.',
    forensicSignal: 'Coercive risk weight (+20 pts). Combined with lookalike URL to trigger compound synergy bonus.',
    countermeasure: 'Recognize the threat as a psychological lever. Authentic compliance issues arrive via postal mail.',
    bars: [100, 75, 90, 60, 85, 50, 95, 40],
  },
  {
    id: 'pretext',
    name: 'Financial Pretext',
    codename: 'FABRICATED_LEDGER',
    glyph: '💳',
    accentColor: '#fbbf24',
    mechanism: 'Fabricates a large unauthorized debit ($1,420.00) so the victim urgently attempts to "cancel" it.',
    forensicSignal: 'Currency pattern coupled with reverse verification directive ("Call to dispute").',
    countermeasure: 'Check your official banking application directly. Never dial numbers provided in unsolicited alerts.',
    bars: [30, 50, 40, 70, 60, 90, 80, 100],
  },
  {
    id: 'relief',
    name: 'False Relief',
    codename: 'SYNTHETIC_SANCTUARY',
    glyph: '🔒',
    accentColor: '#10b981',
    mechanism: 'Presents a fake "Security Verification Portal" promising instant safety and account restoration.',
    forensicSignal: 'Lookalike subdomain masking credential harvester ("chase-security-auth.top").',
    countermeasure: 'Verify SSL certificate subject and domain registration age prior to entering credentials.',
    bars: [20, 30, 50, 70, 85, 90, 95, 100],
  },
];

export const TacticsScene: React.FC = () => {
  const [selectedTacticId, setSelectedTacticId] = useState<string>('urgency');

  const selectedTactic = TACTIC_SIGNATURES.find((t) => t.id === selectedTacticId) || TACTIC_SIGNATURES[0];

  return (
    <section id="tactics-stream" className="landing-section" aria-label="Psychological Tactics and Manipulation Signatures">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-block">
          <div className="section-label-tag">04 // PSYCHOLOGICAL FINGERPRINTS</div>
          <h2 className="section-title">
            Decoding the attacker's psychological signatures.
          </h2>
          <p className="section-desc">
            Social-engineering attacks exploit human cognitive biases, not software bugs.
            Scamvera isolates the psychological fingerprints engineered to bypass your rational defenses.
          </p>
        </div>

        {/* Tactical Signatures Interactive Grid */}
        <div className="tactics-spatial-grid">
          {TACTIC_SIGNATURES.map((tactic) => {
            const isSelected = tactic.id === selectedTacticId;

            return (
              <div
                key={tactic.id}
                className={`tactic-signature-card ${isSelected ? 'active' : ''}`}
                style={{
                  borderColor: isSelected ? tactic.accentColor : undefined,
                  boxShadow: isSelected ? `0 16px 40px ${tactic.accentColor}25` : undefined,
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedTacticId(tactic.id)}
              >
                <div className="tactic-glyph-box" style={{ borderColor: `${tactic.accentColor}55`, color: tactic.accentColor }}>
                  <span style={{ fontSize: '22px' }}>{tactic.glyph}</span>
                </div>

                <div className="shard-category-tag" style={{ color: tactic.accentColor, marginBottom: 8 }}>
                  {tactic.codename}
                </div>

                <h3 className="tactic-name">{tactic.name}</h3>
                <p className="tactic-mechanism">{tactic.mechanism}</p>

                {/* Animated Forensic Waveform Signature */}
                <div className="tactic-signature-waveform" aria-hidden="true">
                  {tactic.bars.map((barHeight, idx) => (
                    <div
                      key={idx}
                      className="waveform-bar"
                      style={{
                        height: `${barHeight}%`,
                        background: tactic.accentColor,
                        opacity: isSelected ? 0.9 : 0.4,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Tactic Forensic Deep-Dive Inspector */}
        <div className="pipeline-inspector-pane" style={{ marginTop: '36px' }}>
          <div className="inspector-head">
            <div className="inspector-meta-row">
              <span className="inspector-badge">{selectedTactic.codename}</span>
              <span className="inspector-status-badge status-locked">DETERMINISTIC FINGERPRINT</span>
            </div>
            <h3 className="inspector-stage-title">{selectedTactic.name} — Forensic Signature</h3>
            <p className="inspector-stage-summary">{selectedTactic.mechanism}</p>
          </div>

          <div className="inspector-telemetry-box">
            <div className="telemetry-box-top">
              <span className="box-channel-label">PATTERN_RECOGNITION_OUTPUT</span>
              <span className="box-mode-label">VERIFIED_INDICATOR</span>
            </div>
            <div className="telemetry-box-body">
              <div className="telemetry-row">
                <span className="t-key">DETECTION RULE:</span>
                <code className="t-code text-cyan">{selectedTactic.forensicSignal}</code>
              </div>
              <div className="telemetry-row">
                <span className="t-key">COUNTERMEASURE:</span>
                <span className="t-val text-green">{selectedTactic.countermeasure}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
