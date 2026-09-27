import React, { useEffect, useRef } from 'react';

interface LandingCTAProps {
  onLaunchWorkstation: () => void;
}

export const LandingCTA: React.FC<LandingCTAProps> = ({ onLaunchWorkstation }) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);

  // Restrained mouse parallax interaction for the 3D terminal scene
  useEffect(() => {
    const el = terminalRef.current;
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

      // Subtle parallax response hierarchy
      targetRotX = -ny * 3.2; // Max 3.2 deg tilt
      targetRotY = nx * 4.5;  // Max 4.5 deg tilt
      targetPanX = nx * 10;   // Max 10px pan
      targetPanY = ny * 7;    // Max 7px pan
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

      el.style.setProperty('--cta-tilt-x', `${currentRotX.toFixed(2)}deg`);
      el.style.setProperty('--cta-tilt-y', `${currentRotY.toFixed(2)}deg`);
      el.style.setProperty('--cta-pan-x', `${currentPanX.toFixed(2)}px`);
      el.style.setProperty('--cta-pan-y', `${currentPanY.toFixed(2)}px`);

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

  const scrollToMethodology = (e: React.MouseEvent) => {
    e.preventDefault();
    const elem = document.getElementById('evidence-first');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="landing-section landing-cta-section" aria-label="Start Digital Investigation">
      <div className="section-container">
        {/* Spatial Investigation Terminal 3D Stage */}
        <div ref={terminalRef} className="cta-spatial-stage">

          {/* LAYER 1: BACK PLANE (translateZ: -100px, parallax ~0.08x) */}
          <div className="cta-plane-back" aria-hidden="true">
            <div className="cta-atmospheric-glow" />
            <div className="cta-investigation-grid" />
            <div className="cta-particles-field">
              <span className="cta-particle p1" />
              <span className="cta-particle p2" />
              <span className="cta-particle p3" />
              <span className="cta-particle p4" />
            </div>
          </div>

          {/* LAYER 2: MID PLANE (translateZ: -50px, parallax ~0.18x) — Forensic Aperture & Concentric Signal Rings */}
          <div className="cta-plane-mid" aria-hidden="true">
            <svg
              className="cta-aperture-canvas"
              viewBox="0 0 840 480"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="ctaRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                  <stop offset="50%" stopColor="#818cf8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="ctaPulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Outer Concentric Coordinate Ring */}
              <ellipse
                cx="420"
                cy="240"
                rx="390"
                ry="210"
                stroke="rgba(56, 189, 248, 0.12)"
                strokeWidth="1"
                strokeDasharray="6 8"
              />

              {/* Mid Concentric Ring with Slow Orbital Sweep */}
              <g className="cta-ring-orbital">
                <ellipse
                  cx="420"
                  cy="240"
                  rx="330"
                  ry="175"
                  stroke="url(#ctaRingGrad)"
                  strokeWidth="1.2"
                />
                {/* Active Signal Arc */}
                <ellipse
                  cx="420"
                  cy="240"
                  rx="330"
                  ry="175"
                  stroke="url(#ctaPulseGrad)"
                  strokeWidth="2"
                  strokeDasharray="90 380"
                  className="cta-signal-arc"
                />
              </g>

              {/* Inner Counter-Rotating Aperture Ring */}
              <g className="cta-ring-counter">
                <ellipse
                  cx="420"
                  cy="240"
                  rx="260"
                  ry="135"
                  stroke="rgba(129, 140, 248, 0.15)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
              </g>

              {/* Cardinal Reticle Crosshair Ticks */}
              <line x1="420" y1="20" x2="420" y2="40" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" />
              <line x1="420" y1="440" x2="420" y2="460" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" />
              <line x1="20" y1="240" x2="40" y2="240" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" />
              <line x1="800" y1="240" x2="820" y2="240" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" />

              {/* Small Traveling Signal Pulse Marker */}
              <circle cx="420" cy="65" r="2.5" fill="#38bdf8" className="cta-pulse-beacon">
                <animate
                  attributeName="opacity"
                  values="0.4;1;0.4"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>

          {/* LAYER 3: CORE PLANE (translateZ: 0px, parallax ~0.28x) — Terminal Chassis & Content */}
          <div className="cta-plane-core">
            <div className="cta-cinematic-card">
              {/* Terminal Header Provenance Strip */}
              <div className="cta-terminal-topbar" aria-hidden="true">
                <div className="cta-topbar-left">
                  <span className="cta-status-led" />
                  <span className="cta-status-code">INVESTIGATION WORKSTATION // GATEWAY 06</span>
                </div>
                <div className="cta-topbar-right">
                  <span className="cta-readiness-pill">SYSTEM READY // SECURE ENTRANCE</span>
                </div>
              </div>

              <div className="cta-content-inner">
                <div className="cta-label-badge">DEFENSIVE CYBER WORKSTATION</div>

                <h2 className="cta-main-heading">
                  Have something suspicious? <br />
                  <span className="cta-heading-emphasis">Investigate the evidence.</span>
                </h2>

                <p className="cta-subtext">
                  Deconstruct deceptive SMS messages, fraudulent payment demands, lookalike URLs, or suspicious screenshots.
                  Instant deterministic scoring. Complete zero-retention privacy.
                </p>

                <div className="cta-action-row">
                  <button
                    type="button"
                    className="btn-cta-launch"
                    onClick={onLaunchWorkstation}
                    title="Launch digital scam investigation workstation"
                  >
                    <span className="btn-cta-text">Start an Investigation</span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="btn-cta-methodology"
                    onClick={scrollToMethodology}
                    title="Review evidence-first methodology"
                  >
                    <span>Review Methodology</span>
                  </button>
                </div>

                {/* Forensic Assurance Checklist */}
                <div className="cta-assurance-strip">
                  <span>&bull; NO ACCOUNT REQUIRED</span>
                  <span>&bull; ZERO SERVER LOG RETENTION</span>
                  <span>&bull; OFFLINE REPORT EXPORTS (HTML/PDF/JSON)</span>
                </div>
              </div>
            </div>
          </div>

          {/* LAYER 4: FOREGROUND PLANE (translateZ: 42px, parallax ~0.45x) — Floating Evidence Markers & Telemetry Fragments */}
          <div className="cta-plane-fore" aria-hidden="true">
            {/* Top-Left Telemetry Marker */}
            <div className="cta-floating-chip chip-tl" style={{ '--chip-idx': 0 } as React.CSSProperties}>
              <div className="chip-indicator dot-green" />
              <div className="chip-content">
                <span className="chip-label">RUNTIME ISOLATION</span>
                <span className="chip-val">EPHEMERAL HEAP</span>
              </div>
            </div>

            {/* Top-Right Telemetry Marker */}
            <div className="cta-floating-chip chip-tr" style={{ '--chip-idx': 1 } as React.CSSProperties}>
              <div className="chip-indicator dot-cyan" />
              <div className="chip-content">
                <span className="chip-label">HASH ATTESTATION</span>
                <span className="chip-val">EVIDENCE VERIFIED</span>
              </div>
            </div>

            {/* Bottom-Left Telemetry Marker */}
            <div className="cta-floating-chip chip-bl" style={{ '--chip-idx': 2 } as React.CSSProperties}>
              <div className="chip-indicator dot-indigo" />
              <div className="chip-content">
                <span className="chip-label">ALGORITHM LOCK</span>
                <span className="chip-val">ZERO DRIFT DETERMINISTIC</span>
              </div>
            </div>

            {/* Bottom-Right Telemetry Marker */}
            <div className="cta-floating-chip chip-br" style={{ '--chip-idx': 3 } as React.CSSProperties}>
              <div className="chip-indicator dot-cyan" />
              <div className="chip-content">
                <span className="chip-label">GATEWAY PORT</span>
                <span className="chip-val">READY TO ENTER</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
