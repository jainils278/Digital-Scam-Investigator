import React, { useEffect, useRef } from 'react';

export const PrivacySection: React.FC = () => {
  const corridorRef = useRef<HTMLDivElement | null>(null);

  // Subtle mouse-responsive parallax interaction (~0.15–0.25x relative response)
  useEffect(() => {
    const el = corridorRef.current;
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

      // Subtle parallax response ~0.15-0.25x
      targetRotX = -ny * 3.5; // Max 3.5 deg tilt
      targetRotY = nx * 5;    // Max 5 deg tilt
      targetPanX = nx * 8;    // Max 8px pan
      targetPanY = ny * 6;    // Max 6px pan
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

      el.style.setProperty('--corridor-tilt-x', `${currentRotX.toFixed(2)}deg`);
      el.style.setProperty('--corridor-tilt-y', `${currentRotY.toFixed(2)}deg`);
      el.style.setProperty('--corridor-pan-x', `${currentPanX.toFixed(2)}px`);
      el.style.setProperty('--corridor-pan-y', `${currentPanY.toFixed(2)}px`);

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
    <section id="privacy-architecture" className="landing-section privacy-section" aria-label="Privacy & Zero-Retention Architecture">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-block">
          <div className="section-label-tag">04 // PRIVACY & BOUNDARIES</div>
          <h2 className="section-title">
            Zero server retention by mathematical design.
          </h2>
          <p className="section-desc">
            Investigation tools should never become surveillance repositories.
            Scamvera processes submissions in volatile runtime memory and immediately evicts raw payloads — never storing them on disk.
          </p>
        </div>

        {/* Spatial Ephemeral Data-Flow Architecture Corridor */}
        <div ref={corridorRef} className="privacy-spatial-chamber">
          <div className="chamber-top-strip">
            <div className="chamber-top-left">
              <span className="corridor-pulse-led" />
              <span className="chamber-top-title">DIMENSIONAL DATA CORRIDOR // EPHEMERAL TRANSIT PIPELINE</span>
            </div>
            <span className="chamber-top-provenance">VOLATILE HEAP ISOLATION // ZERO-LOGGING MODE</span>
          </div>

          {/* 3D Data-Processing Corridor */}
          <div className="privacy-flow-track">
            {/* BACKGROUND: Isolation Corridor Guide Grid & Depth Atmosphere */}
            <div className="corridor-plane-back" aria-hidden="true">
              <div className="corridor-guide-grid" />
              <div className="corridor-depth-glow" />
              <div className="corridor-transit-ruler">
                <span className="ruler-station">STATION 01 // ORIGIN</span>
                <span className="ruler-arrow">→</span>
                <span className="ruler-station">STATION 02 // VOLATILE</span>
                <span className="ruler-arrow">→</span>
                <span className="ruler-station">STATION 03 // ANALYSIS</span>
                <span className="ruler-arrow">→</span>
                <span className="ruler-station">STATION 04 // PURGE</span>
                <span className="ruler-arrow">→</span>
                <span className="ruler-station">STATION 05 // VAULT</span>
              </div>
            </div>

            {/* MIDGROUND: SVG Vector Conduit Pipeline with Flowing Packets & Downward Purge Exhaust */}
            <div className="privacy-svg-stream" aria-hidden="true">
              <svg viewBox="0 0 1100 280" preserveAspectRatio="none" className="stream-canvas">
                <defs>
                  <linearGradient id="streamGradMain" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                    <stop offset="35%" stopColor="#34d399" stopOpacity="0.9" />
                    <stop offset="70%" stopColor="#818cf8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="purgeDropGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.1" />
                  </linearGradient>
                  <filter id="packetGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Main Forward Pipeline: Chamber 01 -> 02 -> 03 -> 05 */}
                <path
                  d="M 110 90 L 330 90 L 550 90 L 990 90"
                  stroke="url(#streamGradMain)"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  fill="none"
                  className="corridor-main-pipe"
                />

                {/* Terminating Purge Exhaust Line: Diverting from Volatile/Analysis down into Chamber 04 */}
                <path
                  d="M 440 90 Q 440 160 550 160 Q 660 160 770 90"
                  stroke="rgba(239, 68, 68, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  fill="none"
                />
                <path
                  d="M 550 160 L 550 215"
                  stroke="url(#purgeDropGrad)"
                  strokeWidth="3"
                  strokeDasharray="3 3"
                  fill="none"
                  className="corridor-purge-drop"
                />

                {/* Flowing Data Packet Beacons */}
                <circle r="4.5" fill="#38bdf8" filter="url(#packetGlow)" className="corridor-packet-bead">
                  <animateMotion
                    path="M 110 90 L 330 90 L 550 90 L 990 90"
                    dur="3.6s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r="3.5" fill="#ef4444" filter="url(#packetGlow)" className="corridor-purge-bead">
                  <animateMotion
                    path="M 440 90 Q 440 160 550 160 L 550 215"
                    dur="2.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>

            {/* FOREGROUND: 5 Dimensional Data-Processing Chambers */}
            <div className="corridor-chambers-grid">
              {/* Chamber 01: Client Browser Origin */}
              <div
                className="chamber-node node-client"
                tabIndex={0}
                role="region"
                aria-label="Chamber 01: Client Browser Origin"
                style={{ '--chamber-z': '14px', '--chamber-idx': 0 } as React.CSSProperties}
              >
                <div className="chamber-3d-shell" aria-hidden="true" />
                <div className="chamber-content-core">
                  <div className="node-spatial-cap" aria-hidden="true">
                    <span className="cap-terminal-tag">ORIGIN // 01</span>
                  </div>
                  <div className="node-icon-chassis">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" aria-hidden="true">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div className="node-heading-row">
                    <span className="node-badge-code">CHAMBER 01</span>
                    <span className="node-title-text">Client Browser</span>
                  </div>
                  <span className="node-category-tag">DATA ORIGIN & PACKAGING</span>
                  <p className="node-body-text">
                    Raw text or screenshot is packaged locally over TLS 1.3 with an ephemeral request nonce.
                  </p>
                  <div className="node-assurance-pill pill-cyan">CLIENT STORAGE ONLY</div>
                </div>
              </div>

              {/* Chamber 02: Volatile Processing Chamber (RAM Buffer) */}
              <div
                className="chamber-node node-engine"
                tabIndex={0}
                role="region"
                aria-label="Chamber 02: Volatile Processing RAM"
                style={{ '--chamber-z': '28px', '--chamber-idx': 1 } as React.CSSProperties}
              >
                <div className="chamber-3d-shell" aria-hidden="true" />
                <div className="chamber-content-core">
                  <div className="node-spatial-cap cap-engine" aria-hidden="true">
                    <span className="cap-terminal-tag">TRANSIENT RAM // 02</span>
                  </div>
                  <div className="node-icon-chassis chassis-engine">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.2" aria-hidden="true">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div className="node-heading-row">
                    <span className="node-badge-code">CHAMBER 02</span>
                    <span className="node-title-text">Volatile Processing</span>
                  </div>
                  <span className="node-category-tag text-green">TRANSIENT MEMORY EXECUTION</span>
                  <p className="node-body-text">
                    Isolated in-memory decoding & normalization in ephemeral heap. Zero disk buffer allocation.
                  </p>
                  <div className="node-assurance-pill pill-green">0-BYTE DISK RETENTION</div>
                </div>
              </div>

              {/* Chamber 03: Deterministic Analysis Enclave */}
              <div
                className="chamber-node node-analysis"
                tabIndex={0}
                role="region"
                aria-label="Chamber 03: Deterministic Analysis Enclave"
                style={{ '--chamber-z': '36px', '--chamber-idx': 2 } as React.CSSProperties}
              >
                <div className="chamber-3d-shell" aria-hidden="true" />
                <div className="chamber-content-core">
                  <div className="node-spatial-cap cap-analysis" aria-hidden="true">
                    <span className="cap-terminal-tag">ENCLAVE // 03</span>
                  </div>
                  <div className="node-icon-chassis chassis-analysis">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <div className="node-heading-row">
                    <span className="node-badge-code">CHAMBER 03</span>
                    <span className="node-title-text">Deterministic Analysis</span>
                  </div>
                  <span className="node-category-tag text-indigo">ZERO-DRIFT EVALUATION</span>
                  <p className="node-body-text">
                    Executes locked mathematical risk scoring and static directory checks without external calls.
                  </p>
                  <div className="node-assurance-pill pill-indigo">MATHEMATICALLY LOCKED</div>
                </div>
              </div>

              {/* Chamber 04: Active Thermal Purge Void (Data Destruction) */}
              <div
                className="chamber-node node-purge"
                tabIndex={0}
                role="region"
                aria-label="Chamber 04: Active Thermal Purge Void"
                style={{ '--chamber-z': '20px', '--chamber-idx': 3 } as React.CSSProperties}
              >
                <div className="chamber-3d-shell" aria-hidden="true" />
                <div className="chamber-content-core">
                  <div className="node-spatial-cap cap-purge" aria-hidden="true">
                    <span className="cap-terminal-tag">TERMINATION // 04</span>
                  </div>
                  <div className="node-icon-chassis chassis-purge">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.2" aria-hidden="true">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </div>
                  <div className="node-heading-row">
                    <span className="node-badge-code text-red">DISPOSAL VOID</span>
                    <span className="node-title-text">Memory Evaporation</span>
                  </div>
                  <span className="node-category-tag text-red">IMMEDIATE PAYLOAD PURGE</span>
                  <p className="node-body-text">
                    Raw payload bytes vaporized immediately upon response delivery. Zero persistent daemon.
                  </p>
                  <div className="node-assurance-pill pill-red">RAW BYTES DESTROYED</div>
                </div>
              </div>

              {/* Chamber 05: Client-Owned Cryptographic Vault */}
              <div
                className="chamber-node node-vault"
                tabIndex={0}
                role="region"
                aria-label="Chamber 05: Client-Owned Cryptographic Vault"
                style={{ '--chamber-z': '32px', '--chamber-idx': 4 } as React.CSSProperties}
              >
                <div className="chamber-3d-shell" aria-hidden="true" />
                <div className="chamber-content-core">
                  <div className="node-spatial-cap cap-vault" aria-hidden="true">
                    <span className="cap-terminal-tag">ENDPOINT // 05</span>
                  </div>
                  <div className="node-icon-chassis chassis-vault">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.2" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </div>
                  <div className="node-heading-row">
                    <span className="node-badge-code">CHAMBER 05</span>
                    <span className="node-title-text">User Local Control</span>
                  </div>
                  <span className="node-category-tag">CLIENT-OWNED VAULT</span>
                  <p className="node-body-text">
                    Investigation findings live strictly in browser localStorage. Generate standalone HTML, PDF, or Case JSON offline.
                  </p>
                  <div className="node-assurance-pill pill-purple">100% USER OWNED</div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Architecture Guarantees Grid */}
          <div className="privacy-guarantees-grid">
            <div className="spatial-guarantee-card" style={{ '--card-idx': 0 } as React.CSSProperties}>
              <div className="guarantee-header">
                <span className="guarantee-status-indicator indicator-red" />
                <h4 className="guarantee-title">Zero Server Database</h4>
              </div>
              <p className="guarantee-desc">
                No PostgreSQL, MongoDB, or Redis databases exist. Submissions cannot leak in a data breach because they are never written to any database.
              </p>
              <div className="guarantee-metric">STORAGE: 0 BYTES PERSISTED</div>
            </div>

            <div className="spatial-guarantee-card" style={{ '--card-idx': 1 } as React.CSSProperties}>
              <div className="guarantee-header">
                <span className="guarantee-status-indicator indicator-yellow" />
                <h4 className="guarantee-title">Zero Raw-Text Logging</h4>
              </div>
              <p className="guarantee-desc">
                Production logs record only randomized request IDs, IP hashes, and latency metrics. Raw message text or uploaded image bytes are never logged.
              </p>
              <div className="guarantee-metric">LOG LEVEL: METRICS & LATENCY ONLY</div>
            </div>

            <div className="spatial-guarantee-card" style={{ '--card-idx': 2 } as React.CSSProperties}>
              <div className="guarantee-header">
                <span className="guarantee-status-indicator indicator-green" />
                <h4 className="guarantee-title">Passive Operation</h4>
              </div>
              <p className="guarantee-desc">
                Suspicious URL evaluations and institutional verification registries execute passively without outbound crawling, DNS leaks, or WHOIS requests.
              </p>
              <div className="guarantee-metric">NETWORK: ZERO OUTBOUND SCRAPING</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
