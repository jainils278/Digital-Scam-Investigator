import React, { useState } from 'react';

interface AttackStage {
  step: string;
  name: string;
  category: string;
  codename: string;
  shortDesc: string;
  description: string;
  observedSignals: string[];
  countermeasure: string;
  evidenceFragment: string;
  isProjectedConsequence?: boolean;
  xPct: number; // percentage coordinate on curve
  yPct: number;
}

const ATTACK_STAGES: AttackStage[] = [
  {
    step: '01',
    name: 'Hook & Inception',
    category: 'INITIAL_CONTACT',
    codename: 'UNSOLICITED_INBOUND',
    shortDesc: 'Cold delivery via spoofed SMS, WhatsApp, or phishing email.',
    description: 'The adversary initiates unsolicited contact through automated SMS shortcodes, spoofed headers, or lookalike sender addresses to gain attention.',
    observedSignals: [
      'Unregistered VoIP / Virtual Shortcode (+1 844...)',
      'Generic opener ("Dear Customer", "Important Notice")',
      'Unsolicited package delivery or debit pretext',
    ],
    countermeasure: 'Verify sender identity via independent out-of-band directories before responding or clicking.',
    evidenceFragment: 'TEL: +1-844-592-3011 [VOIP_ROUTED // CARRIER_ANONYMIZED]',
    xPct: 8,
    yPct: 28,
  },
  {
    step: '02',
    name: 'Trust & Authority Exploitation',
    category: 'IMPERSONATION',
    codename: 'INSTITUTION_HIJACK',
    shortDesc: 'Bypassing suspicion by borrowing institutional legitimacy.',
    description: 'Adversary borrows credibility from recognized financial institutions, logistics carriers (USPS, DHL), or government bodies (IRS, Police) to suppress scrutiny.',
    observedSignals: [
      'Legitimate brand trademarks referenced in raw text',
      'Lookalike typosquat domain impersonating brand',
      'Spoofed sender display name concealing actual address',
    ],
    countermeasure: 'Scamvera checks verified institution registry; never trust caller ID or message sender headers.',
    evidenceFragment: 'CLAIM: "Chase Bank Alert" | REGISTRY_DOMAIN: "chase.com" != TARGET_DOMAIN',
    xPct: 25,
    yPct: 68,
  },
  {
    step: '03',
    name: 'Artificial Urgency & Coercion',
    category: 'PSYCHOLOGICAL_PRESSURE',
    codename: 'PANIC_ACCELERATOR',
    shortDesc: 'Synthetic deadlines engineered to short-circuit critical thought.',
    description: 'Creates psychological urgency through impending account lockouts, fabricated transactions, or escalating legal/financial penalties to prevent calm verification.',
    observedSignals: [
      '"Immediate Action Required" or "24-Hour Final Notice"',
      'Fabricated unauthorized debit pretext ($1,420.00)',
      'Threat of irreversible account suspension',
    ],
    countermeasure: 'Pause. Legitimate financial and governmental institutions do not mandate instant panic actions.',
    evidenceFragment: 'SYNTHETIC_DEADLINE: "within 24 hours" | PRETEXT: "$1,420.00 Unauthorized Debit"',
    xPct: 43,
    yPct: 24,
  },
  {
    step: '04',
    name: 'Action Request',
    category: 'EXPLOITATION_VECTOR',
    codename: 'GATEWAY_ROUTING',
    shortDesc: 'Channelling the victim toward the extraction endpoint.',
    description: 'Directs the victim toward a specific trap: clicking a link, calling an unlisted call center, or replying with one-time verification tokens.',
    observedSignals: [
      'Direct hyperlink to external unverified domain',
      'Hidden zero-width characters in link anchors',
      'Urging out-of-band action outside official application',
    ],
    countermeasure: 'Never click embedded links in unexpected alerts. Navigate manually to verified official websites.',
    evidenceFragment: 'REDIRECT_URI: "https://chase-security-auth.com/login" [UNREGISTERED_TLD]',
    xPct: 61,
    yPct: 72,
  },
  {
    step: '05',
    name: 'Credential & Asset Exploitation',
    category: 'EXTRACTION',
    codename: 'PAYLOAD_HARVEST',
    shortDesc: 'Active capture of authentication credentials, OTPs, or funds.',
    description: 'The deceptive portal harvests login credentials, intercepts 2FA SMS tokens in real-time, or coerces wire/gift card/cryptocurrency transmissions.',
    observedSignals: [
      'Spoofed authentication dialog matching institutional theme',
      'Simulated 2FA prompt designed to relay token to adversary',
      'Irreversible payment instructions (crypto, wire, cards)',
    ],
    countermeasure: 'If credentials were typed, initiate immediate out-of-band account containment and password resets.',
    evidenceFragment: 'INTERCEPTION: POST /auth/relay -> Harvesting [Username, Password, 2FA_OTP]',
    xPct: 79,
    yPct: 28,
  },
  {
    step: '06',
    name: 'Potential Consequence',
    category: 'PROJECTED_CONSEQUENCE',
    codename: 'PROJECTED_RISK',
    shortDesc: 'Hypothetical downstream impact if deception succeeds.',
    description: 'Forecasted consequence if the deception succeeds (e.g., account takeover, unauthorized wire debit, identity theft). Strictly a projection, not an actual compromise.',
    observedSignals: [
      'Projected account takeover & credential resale on darknet',
      'Direct unauthorized asset exfiltration',
      'Secondary spear-phishing targeting contact list',
    ],
    countermeasure: 'Follow Scamvera declarative containment guide based on your specific declared interaction state.',
    evidenceFragment: 'FORECAST_SEVERITY: CRITICAL // HYPOTHETICAL PROJECTION (NOT ACTUAL BREACH)',
    isProjectedConsequence: true,
    xPct: 93,
    yPct: 66,
  },
];

export const InvestigationFlow: React.FC = () => {
  const [activeStageIdx, setActiveStageIdx] = useState<number>(2); // Default to Stage 03 (Urgency)

  const activeStage = ATTACK_STAGES[activeStageIdx];

  const handlePrev = () => {
    setActiveStageIdx((prev) => (prev > 0 ? prev - 1 : ATTACK_STAGES.length - 1));
  };

  const handleNext = () => {
    setActiveStageIdx((prev) => (prev < ATTACK_STAGES.length - 1 ? prev + 1 : 0));
  };

  return (
    <section id="investigation-flow" className="landing-section investigation-flow-section" aria-label="Investigation Attack Chain">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-block">
          <div className="section-label-tag">02 // ANALYTICAL RIGOR</div>
          <h2 className="section-title">
            Reconstructing the 6-stage attack chain.
          </h2>
          <p className="section-desc">
            Social-engineering attacks are structured campaigns, not random noise.
            Scamvera reconstructs the adversary's timeline as a connected forensic trajectory from inception to projected consequence.
          </p>
        </div>

        {/* Spatial Connected Attack Reconstruction Viewport */}
        <div className="attack-reconstruction-container">
          {/* Spatial SVG Curve Stage */}
          <div className="attack-spatial-path-wrapper">
            <div className="attack-spatial-canvas-hud">
              <span className="canvas-hud-title">SPATIAL ATTACK TIMELINE // FORENSIC RECONSTRUCTION</span>
              <span className="canvas-hud-coords">DEPTH: PERSPECTIVE 1000px</span>
            </div>

            {/* Continuous SVG Path Connecting all 6 stages */}
            <svg
              viewBox="0 0 1000 320"
              preserveAspectRatio="none"
              className="attack-chain-svg-spline"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="attackSplineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#fb923c" stopOpacity="0.8" />
                  <stop offset="75%" stopColor="#f43f5e" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.7" />
                </linearGradient>

                <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Guide Spline */}
              <path
                d="M 80 90 C 160 90, 180 220, 250 220 C 330 220, 360 80, 430 80 C 510 80, 540 230, 610 230 C 690 230, 720 90, 790 90 C 860 90, 880 210, 930 210"
                fill="none"
                stroke="rgba(30, 41, 59, 0.6)"
                strokeWidth="4"
                className="attack-spline-guide"
              />

              {/* Progressive Entrance Drawing Spline */}
              <path
                d="M 80 90 C 160 90, 180 220, 250 220 C 330 220, 360 80, 430 80 C 510 80, 540 230, 610 230 C 690 230, 720 90, 790 90 C 860 90, 880 210, 930 210"
                fill="none"
                stroke="url(#attackSplineGrad)"
                strokeWidth="2.5"
                className="attack-spline-draw"
              />

              {/* Foreground Animated Signal Path */}
              <path
                d="M 80 90 C 160 90, 180 220, 250 220 C 330 220, 360 80, 430 80 C 510 80, 540 230, 610 230 C 690 230, 720 90, 790 90 C 860 90, 880 210, 930 210"
                fill="none"
                stroke="url(#attackSplineGrad)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="attack-spline-pulse"
              />
            </svg>

            {/* 6 3D Spatial Nodes Positioned along the Spline */}
            <div className="attack-nodes-overlay" role="tablist" aria-label="Attack Chain Sequence">
              {ATTACK_STAGES.map((s, idx) => {
                const isActive = activeStageIdx === idx;
                const isProjected = s.isProjectedConsequence;

                return (
                  <button
                    key={s.step}
                    type="button"
                    role="tab"
                    id={`attack-node-${s.step}`}
                    aria-selected={isActive}
                    aria-controls="attack-stage-inspector"
                    className={`spatial-node-beacon ${isActive ? 'beacon-active' : ''} ${isProjected ? 'beacon-projected' : ''}`}
                    style={{
                      left: `${s.xPct}%`,
                      top: `${s.yPct}%`,
                      '--node-idx': idx,
                    } as React.CSSProperties}
                    onClick={() => setActiveStageIdx(idx)}
                  >
                    {/* Concentric Pulse Rings */}
                    <span className="beacon-ring-outer" aria-hidden="true" />
                    <span className="beacon-ring-mid" aria-hidden="true" />
                    <div className="beacon-core">
                      <span className="beacon-num">{s.step}</span>
                    </div>

                    {/* Floating Tactical Label */}
                    <div className="beacon-floating-tag">
                      <span className="tag-step">STAGE {s.step}</span>
                      <span className="tag-name">{s.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Timeline Scrubber Bar Controls */}
            <div className="attack-scrubber-bar">
              <button
                type="button"
                className="scrub-btn"
                onClick={handlePrev}
                aria-label="Inspect Previous Attack Stage"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>PREV</span>
              </button>

              <div className="scrub-pills-row">
                {ATTACK_STAGES.map((s, idx) => (
                  <button
                    key={s.step}
                    type="button"
                    className={`scrub-pill ${activeStageIdx === idx ? 'active' : ''} ${s.isProjectedConsequence ? 'pill-projected' : ''}`}
                    onClick={() => setActiveStageIdx(idx)}
                    title={`Stage ${s.step}: ${s.name}`}
                  >
                    <span>{s.step}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="scrub-btn"
                onClick={handleNext}
                aria-label="Inspect Next Attack Stage"
              >
                <span>NEXT</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Compact Single-Stage Forensic HUD */}
          <div
            id="attack-stage-inspector"
            role="tabpanel"
            aria-labelledby={`attack-node-${activeStage.step}`}
            className="attack-stage-compact-hud"
          >
            <div className="compact-hud-header">
              <div className="hud-header-meta">
                <span className="hud-phase-chip">PHASE {activeStage.step} // {activeStage.codename}</span>
                <span className="hud-cat-chip">{activeStage.category}</span>
                {activeStage.isProjectedConsequence && (
                  <span className="hud-warning-chip">
                    PROJECTED CONSEQUENCE // HYPOTHETICAL FORECAST — NEVER ASSUMED TO HAVE OCCURRED
                  </span>
                )}
              </div>
              <h3 className="hud-stage-title">{activeStage.name}</h3>
              <p className="hud-stage-summary">{activeStage.description}</p>
            </div>

            <div className="compact-hud-grid">
              {/* Observable Forensic Indicators */}
              <div className="compact-hud-col">
                <div className="hud-col-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>OBSERVABLE FORENSIC SIGNALS</span>
                </div>
                <ul className="hud-signals-list">
                  {activeStage.observedSignals.map((sig, i) => (
                    <li key={i} className="hud-signal-item">
                      <span className="sig-dot" aria-hidden="true" />
                      <span>{sig}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Defensive Countermeasure & Evidence Fragment */}
              <div className="compact-hud-col">
                <div className="hud-col-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.2" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                  <span>DEFENSIVE INVESTIGATION PROTOCOL</span>
                </div>
                <div className="hud-protocol-box">
                  <p>{activeStage.countermeasure}</p>
                </div>

                <div className="hud-evidence-chip">
                  <span className="chip-key">FORENSIC TELEMETRY:</span>
                  <code className="chip-val">{activeStage.evidenceFragment}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
