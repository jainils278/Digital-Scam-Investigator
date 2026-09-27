import React, { useState, useEffect, useRef } from 'react';

interface IntelligenceModule {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  positionLabel: string;
  tagline: string;
  description: string;
  technicalDetails: string[];
  visualMock: {
    type: 'OBFUSCATION' | 'COUNTERFACTUAL' | 'VICTIM_STATE' | 'VERIFICATION' | 'CASE_FILE';
    headline: string;
    snippet: string;
    metrics: Array<{ label: string; value: string; color?: string }>;
  };
}

const MODULES: IntelligenceModule[] = [
  {
    id: 'mask',
    badge: 'MODULE 01 // PROVENANCE',
    title: "The Attacker's Mask",
    subtitle: 'Zero-Width & Homoglyph Obfuscation Diffing',
    positionLabel: 'TOP // CANONICAL LAYER',
    tagline: 'Strips invisible codepoints & lookalikes while preserving 100% exact character offsets.',
    description: 'Adversaries inject invisible zero-width spaces and Cyrillic lookalikes to bypass keyword filters. Scamvera strips evasion tricks while mapping exact character offsets back to the raw message.',
    technicalDetails: [
      'Bijective index mapping preserves 100% evidence offset accuracy',
      'Detects zero-width non-joiners, word-joiners, and bidirectional overrides',
      'Exposes exact Unicode hex representations alongside decoded characters',
    ],
    visualMock: {
      type: 'OBFUSCATION',
      headline: 'DIFF BREAKDOWN: "p\u200Bay\u0440al.com"',
      snippet: 'Token 0: "p" [U+0070] | Token 1: <ZWSP> [U+200B - EVASION] | Token 2: "ay" | Token 3: "р" [U+0440 CYRILLIC] -> "p"',
      metrics: [
        { label: 'EVASION CHARS', value: '2 CODEPOINTS', color: '#f87171' },
        { label: 'CANONICAL DECODE', value: 'paypal.com', color: '#38bdf8' },
        { label: 'DETECTION CONFIDENCE', value: '100% DETERMINISTIC', color: '#34d399' },
      ],
    },
  },
  {
    id: 'counterfactual',
    badge: 'MODULE 02 // SENSITIVITY',
    title: 'Counterfactual Sensitivity',
    subtitle: 'Mathematical Sensitivity & Pivot Factor Isolation',
    positionLabel: 'WEST // RISK MATRIX',
    tagline: 'Re-runs scoring across indicator subsets to isolate what drives compound risk.',
    description: 'Hypothetical sensitivity engine that re-runs the locked risk formula across filtered indicator subsets to determine which single factor is driving the compound risk score.',
    technicalDetails: [
      'Re-runs calculateRiskAssessment() without duplicating formulas or weights',
      'Identifies broken synergies and compound bonus collapse',
      'Isolates Primary Pivot Factor without altering actual report score',
    ],
    visualMock: {
      type: 'COUNTERFACTUAL',
      headline: 'HYPOTHETICAL DELTA: REMOVING LOOKALIKE_URL',
      snippet: 'Baseline Score: 85 (HIGH) -> Hypothetical Score: 30 (LOW). Delta: -55 pts. Broken Synergies: [COERCION + URL]',
      metrics: [
        { label: 'BASELINE SCORE', value: '85 (HIGH)', color: '#ef4444' },
        { label: 'SCORE DELTA', value: '-55 PTS', color: '#38bdf8' },
        { label: 'PRIMARY PIVOT', value: 'CATEGORY: URL', color: '#fbbf24' },
      ],
    },
  },
  {
    id: 'verification',
    badge: 'MODULE 03 // OUT-OF-BAND',
    title: 'Safe Verification Directory',
    subtitle: 'Curated Static Registry of Official Channels',
    positionLabel: 'EAST // REGISTRY',
    tagline: 'Static out-of-band coordinate lookup without active web scraping or DNS leaks.',
    description: 'Scamvera references a curated static directory of official institutions (banks, postal services, platforms). Message content is never treated as verification evidence.',
    technicalDetails: [
      'Static registry of 16 high-value institutions with official source URLs',
      'Zero dynamic lookups, WHOIS requests, or outbound network calls',
      'Clear demarcation between observed suspicious claims and curated official coordinates',
    ],
    visualMock: {
      type: 'VERIFICATION',
      headline: 'CURATED REGISTRY MATCH: JPMORGAN CHASE',
      snippet: 'Official Domain: chase.com | Fraud Hotline: 1-800-935-9935 | Source: Official Security Page (Reviewed 2026-09-01)',
      metrics: [
        { label: 'OFFICIAL DOMAIN', value: 'chase.com', color: '#34d399' },
        { label: 'MESSAGE DOMAIN', value: 'chase-security-auth.com [UNVERIFIED]', color: '#f87171' },
        { label: 'OUTBOUND CALLS', value: 'ZERO (PASSIVE)', color: '#38bdf8' },
      ],
    },
  },
  {
    id: 'victim-state',
    badge: 'MODULE 04 // CONTAINMENT',
    title: 'Victim-State Response Engine',
    subtitle: 'Declarative Incident Containment Protocol',
    positionLabel: 'SOUTH-WEST // PROTOCOL',
    tagline: 'Tailored containment action trees derived strictly from declared victim action.',
    description: 'Tailored response protocols generated strictly from user-declared interactions (clicked link, entered credentials, sent money). Never assumes compromise from message content.',
    technicalDetails: [
      '9 distinct declared victim states with dedicated containment sequences',
      'Zero server-side persistence of victim declaration',
      'Client-side state switching enables immediate advice updates without re-investigation',
    ],
    visualMock: {
      type: 'VICTIM_STATE',
      headline: 'DECLARED: ENTERED_CREDENTIALS',
      snippet: 'Containment Urgency: CRITICAL_CONTAINMENT. Step 1: Change master password via known clean device. Step 2: Revoke active session tokens. Step 3: Monitor unauthorized 2FA prompts.',
      metrics: [
        { label: 'CONTAINMENT LEVEL', value: 'CRITICAL', color: '#f87171' },
        { label: 'ACTION STEPS', value: '4 SEQUENTIAL', color: '#38bdf8' },
        { label: 'JURISDICTION', value: 'NEUTRAL / GLOBAL', color: '#34d399' },
      ],
    },
  },
  {
    id: 'case-file',
    badge: 'MODULE 05 // LOCAL ARCHIVE',
    title: 'Forensic Case File Triad',
    subtitle: 'Standalone Forensic HTML, PDF 1.4 & Case JSON',
    positionLabel: 'SOUTH-EAST // EXPORT',
    tagline: 'Complete cryptographic case export generated client-side without cloud storage.',
    description: 'Export complete investigation reports locally in three forensic formats. Everything executes client-side without cloud transmission or database retention.',
    technicalDetails: [
      'Standalone HTML report with zero external font/script dependencies',
      'Deterministic PDF 1.4 generation with valid cross-reference tables',
      'Forensic Case JSON following caseSchemaVersion: "1.0.0" standard',
    ],
    visualMock: {
      type: 'CASE_FILE',
      headline: 'EXPORT TRIAD: LOCAL FORENSIC ARCHIVE',
      snippet: 'Generates report.html (offline file://), report.pdf (deterministic 1.4 binary), and case.json. Zero telemetry, zero server-side storage.',
      metrics: [
        { label: 'STANDALONE HTML', value: 'OFFLINE CAPABLE', color: '#38bdf8' },
        { label: 'PDF 1.4', value: 'CLIENT DETERMINISTIC', color: '#34d399' },
        { label: 'CASE JSON', value: 'SCHEMA v1.0.0', color: '#fbbf24' },
      ],
    },
  },
];

interface SpatialModuleConfig {
  coords: { x: number; y: number; z: number };
  codeSnippet: string;
  glyph: React.ReactNode;
  port: { x: number; y: number };
  target: { x: number; y: number };
  driftClass: string;
}

const SPATIAL_CONFIG: Record<string, SpatialModuleConfig> = {
  mask: {
    coords: { x: -380, y: -160, z: -50 },
    codeSnippet: 'U+200B // STRIPPED',
    glyph: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
        <line x1="3" y1="3" x2="21" y2="21" />
      </svg>
    ),
    port: { x: 390, y: 250 },
    target: { x: 190, y: 160 },
    driftClass: 'drift-nw',
  },
  counterfactual: {
    coords: { x: -420, y: 110, z: 65 },
    codeSnippet: 'Δ -55 PTS // SENSITIVITY',
    glyph: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 2L2 22h20L12 2z" />
        <path d="M12 9v5" />
        <path d="M12 18h.01" />
      </svg>
    ),
    port: { x: 350, y: 390 },
    target: { x: 140, y: 440 },
    driftClass: 'drift-w',
  },
  verification: {
    coords: { x: 380, y: -160, z: -60 },
    codeSnippet: '0-DNS // PASSIVE',
    glyph: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    port: { x: 610, y: 250 },
    target: { x: 810, y: 160 },
    driftClass: 'drift-ne',
  },
  'victim-state': {
    coords: { x: 420, y: 100, z: 45 },
    codeSnippet: 'ACTION // 4-STEP',
    glyph: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="5" r="3" />
        <path d="M12 8v8" />
        <path d="m8 12 4 4 4-4" />
        <path d="M6 20h12" />
      </svg>
    ),
    port: { x: 650, y: 390 },
    target: { x: 860, y: 430 },
    driftClass: 'drift-e',
  },
  'case-file': {
    coords: { x: 0, y: 285, z: 80 },
    codeSnippet: 'HTML+PDF+JSON // CRYPTO',
    glyph: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    port: { x: 500, y: 520 },
    target: { x: 500, y: 645 },
    driftClass: 'drift-s',
  },
};

export const IntelligenceShowcase: React.FC = () => {
  const [activeModuleId, setActiveModuleId] = useState<string>('mask');
  const stageRef = useRef<HTMLDivElement | null>(null);

  const activeModule = MODULES.find((m) => m.id === activeModuleId) || MODULES[0];

  // Pointer interaction system with smooth requestAnimationFrame lerp
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    let targetRotX = 0;
    let targetRotY = 0;
    let targetPanX = 0;
    let targetPanY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let currentPanX = 0;
    let currentPanY = 0;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const nx = (x - rect.width / 2) / (rect.width / 2);
      const ny = (y - rect.height / 2) / (rect.height / 2);

      targetRotX = -ny * 9;   // ~1.5x: Max 9 deg tilt
      targetRotY = nx * 12;   // ~1.5x: Max 12 deg tilt
      targetPanX = nx * 22;   // ~1.5x: Max 22px lateral pan
      targetPanY = ny * 15;   // ~1.5x: Max 15px vertical pan
    };

    const handleMouseLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
      targetPanX = 0;
      targetPanY = 0;
    };

    const updateParallax = () => {
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;
      currentPanX += (targetPanX - currentPanX) * 0.08;
      currentPanY += (targetPanY - currentPanY) * 0.08;

      el.style.setProperty('--core-tilt-x', `${currentRotX.toFixed(2)}deg`);
      el.style.setProperty('--core-tilt-y', `${currentRotY.toFixed(2)}deg`);
      el.style.setProperty('--core-pan-x', `${currentPanX.toFixed(2)}px`);
      el.style.setProperty('--core-pan-y', `${currentPanY.toFixed(2)}px`);

      animId = requestAnimationFrame(updateParallax);
    };

    animId = requestAnimationFrame(updateParallax);
    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section id="intelligence-showcase" className="landing-section intelligence-showcase-section" aria-label="Workstation Intelligence Capabilities">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-block">
          <div className="section-label-tag">03 // WORKSTATION ARCHITECTURE</div>
          <h2 className="section-title">
            Investigation Intelligence Core.
          </h2>
          <p className="section-desc">
            V3.1 transforms the investigation viewer into an interactive workstation with five integrated intelligence modules docking into a centralized deterministic core.
          </p>
        </div>

        {/* Spatial Intelligence Core Layout */}
        <div className="intelligence-spatial-system">
          {/* Top Satellite Dock Selector for Accessible Keyboard & Screen-Reader Navigation */}
          <div className="core-dock-selectors" role="tablist" aria-label="Investigation Intelligence Modules">
            {MODULES.map((m, idx) => {
              const isSelected = m.id === activeModuleId;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  id={`intel-tab-${m.id}`}
                  aria-selected={isSelected}
                  aria-controls={`intel-panel-${m.id}`}
                  className={`dock-satellite-btn ${isSelected ? 'active' : ''}`}
                  style={{ '--dock-idx': idx } as React.CSSProperties}
                  onClick={() => setActiveModuleId(m.id)}
                >
                  <span className="dock-btn-badge">{m.badge.split(' // ')[0]}</span>
                  <span className="dock-btn-name">{m.title}</span>
                </button>
              );
            })}
          </div>

          {/* Central 3D Spatial Core Stage */}
          <div ref={stageRef} className="intelligence-core-stage" aria-label="Dimensional Forensic Instrument">
            {/* Plane 1: BACK PLANE (Depth Lattice & Atmospheric Ring, translateZ: -70px) */}
            <div className="core-plane-back" aria-hidden="true">
              <div className="core-aperture-backdrop" />
              <div className="aperture-hex-grid" />
              <div className="aperture-coordinate-ring">
                <span className="degree-tick tick-0">000°</span>
                <span className="degree-tick tick-72">072°</span>
                <span className="degree-tick tick-144">144°</span>
                <span className="degree-tick tick-216">216°</span>
                <span className="degree-tick tick-288">288°</span>
              </div>
            </div>

            {/* Plane 2: MID PLANE (Aperture Reticles & SVG Vector Conduits, translateZ: -25px) */}
            <div className="core-plane-mid" aria-hidden="true">
              <div className="aperture-rotating-reticle" />
              <div className="aperture-inner-reticle" />
              <div className="chassis-extrusion-rim" />

              {/* Vector Tether Lines Connecting Central Hub to the 5 Orbiting Modules */}
              <svg className="core-spatial-tethers-svg" viewBox="0 0 1000 720">
                <defs>
                  <linearGradient id="tetherGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                {MODULES.map((m) => {
                  const cfg = SPATIAL_CONFIG[m.id];
                  if (!cfg) return null;
                  const isSelected = m.id === activeModuleId;
                  const pathData = `M ${cfg.port.x} ${cfg.port.y} Q ${(cfg.port.x + cfg.target.x) / 2} ${(cfg.port.y + cfg.target.y) / 2 + (m.id === 'case-file' ? 30 : -20)} ${cfg.target.x} ${cfg.target.y}`;
                  return (
                    <g key={m.id} className={`tether-group ${isSelected ? 'tether-active' : ''}`}>
                      {/* Background Conduit Track */}
                      <path d={pathData} className="tether-conduit-base" />
                      {/* Active Illuminated Beam */}
                      <path d={pathData} className="tether-conduit-beam" />
                      {/* Docking Node Port Ring */}
                      <circle cx={cfg.port.x} cy={cfg.port.y} r="3" className="tether-port-dot" />
                      {/* Traveling Signal Pulse when Active */}
                      {isSelected && (
                        <circle r="4" className="tether-pulse-bead">
                          <animateMotion path={pathData} dur="2.4s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Plane 3: CORE PLANE (The Physical 3D Forensic Chassis & Nucleus, translateZ: 0px) */}
            <div className="core-plane-main">
              <div
                className="core-chassis"
                id={`intel-panel-${activeModule.id}`}
                role="tabpanel"
                aria-labelledby={`intel-tab-${activeModule.id}`}
              >
                {/* Visual Nucleus Chamber (Forensic Energy Reactor) */}
                <div className="core-nucleus-chamber" aria-hidden="true">
                  <div className="nucleus-glow-sphere" />
                  <div className="nucleus-orbital-ring-outer" />
                  <div className="nucleus-orbital-ring-inner" />
                  <div className="nucleus-center-crystal">
                    <span className="nucleus-sig-icon">
                      {SPATIAL_CONFIG[activeModule.id]?.glyph}
                    </span>
                  </div>
                  <div className="nucleus-telemetry-strip">
                    <span className="nucleus-pulse-dot" />
                    <span className="nucleus-state-label">DETERMINISTIC KERNEL // ONLINE</span>
                  </div>
                </div>

                {/* Core Internal HUD Screen */}
                <div className="core-screen-inner">
                  {/* HUD Header Bar */}
                  <div className="core-hud-topbar">
                    <div className="core-indicator-cluster">
                      <span className="core-pulse-led" />
                      <span className="core-system-label">INVESTIGATION_CORE // v3.1</span>
                      <span className="core-dock-pos">DOCKED: {activeModule.positionLabel}</span>
                    </div>
                    <div className="core-status-flag">
                      <span className="flag-mode">ISOLATED ENCLAVE</span>
                    </div>
                  </div>

                  {/* Central Visual Diagnostics Frame */}
                  <div className="core-diagnostics-frame">
                    <div className="core-module-header">
                      <div className="module-badge-tag">{activeModule.badge}</div>
                      <h3 className="module-title-text">{activeModule.title}</h3>
                      <div className="module-subtitle-text">{activeModule.subtitle}</div>
                      <p className="module-desc-text">{activeModule.description}</p>
                    </div>

                    {/* Active Code / Diagnostic Telemetry Terminal */}
                    <div className="core-terminal-block">
                      <div className="terminal-bar-strip">
                        <span className="terminal-bar-title">{activeModule.visualMock.headline}</span>
                        <span className="terminal-bar-provenance">VERIFIED FORENSIC DATA</span>
                      </div>
                      <div className="terminal-code-body">
                        <code>{activeModule.visualMock.snippet}</code>
                      </div>

                      <div className="core-metrics-trio">
                        {activeModule.visualMock.metrics.map((m, i) => (
                          <div
                            key={i}
                            className="core-metric-card"
                            style={{ '--metric-idx': i } as React.CSSProperties}
                          >
                            <span className="core-metric-lbl">{m.label}</span>
                            <span className="core-metric-val" style={{ color: m.color || '#f8fafc' }}>
                              {m.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Architectural Points */}
                    <div className="core-bullet-strip">
                      {activeModule.technicalDetails.map((pt, idx) => (
                        <div key={idx} className="core-bullet-item">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plane 4: FRONT PLANE (Floating Optical Telemetry & Reticles, translateZ: 55px) */}
            <div className="core-plane-front" aria-hidden="true">
              <div className="telemetry-floating-chip chip-tl">
                <span className="chip-indicator" />
                <span className="chip-text">LATENCY: 0.00ms (PASSIVE)</span>
              </div>
              <div className="telemetry-floating-chip chip-tr">
                <span className="chip-indicator green" />
                <span className="chip-text">INTEGRITY: 100% DETERMINISTIC</span>
              </div>
              <div className="telemetry-bracket bracket-bl" />
              <div className="telemetry-bracket bracket-br" />
            </div>

            {/* Orbiting Spatial Intelligence Modules (Dimensional Satellites) */}
            <div className="core-spatial-satellites" role="region" aria-label="Orbiting Intelligence Capabilities">
              {MODULES.map((m, idx) => {
                const config = SPATIAL_CONFIG[m.id];
                if (!config) return null;
                const isSelected = m.id === activeModuleId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`spatial-satellite-pod pod-${m.id} ${isSelected ? 'pod-docked-active' : 'pod-orbiting'} ${config.driftClass}`}
                    style={{
                      '--mod-x': `${config.coords.x}px`,
                      '--mod-y': `${config.coords.y}px`,
                      '--mod-z': `${config.coords.z}px`,
                      '--mod-idx': idx,
                    } as React.CSSProperties}
                    onClick={() => setActiveModuleId(m.id)}
                    aria-label={`Inspect ${m.title} capability (${m.positionLabel})`}
                  >
                    <div className="satellite-pod-bezel">
                      <div className="satellite-pod-top">
                        <div className="satellite-pod-glyph">
                          {config.glyph}
                        </div>
                        <div className="satellite-pod-tags">
                          <span className="pod-order-chip">{m.badge.split(' // ')[0]}</span>
                          <span className="pod-pos-chip">{m.positionLabel.split(' // ')[0]}</span>
                        </div>
                      </div>

                      <div className="satellite-pod-title">{m.title}</div>
                      <div className="satellite-pod-code">{config.codeSnippet}</div>

                      <div className="satellite-pod-dock-state">
                        <span className={`dock-indicator-dot ${isSelected ? 'active' : ''}`} />
                        <span className="dock-state-text">
                          {isSelected ? 'DOCKED // ACTIVE' : 'DOCK SATELLITE'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
