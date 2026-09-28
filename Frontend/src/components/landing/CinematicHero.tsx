import React, { useEffect, useRef } from 'react';
import { SpatialParticles } from '../../scenes/investigation/SpatialParticles';

interface CinematicHeroProps {
  onLaunchWorkstation: () => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ onLaunchWorkstation }) => {
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const nx = (x - rect.width / 2) / (rect.width / 2);
      const ny = (y - rect.height / 2) / (rect.height / 2);

      targetRotX = -ny * 6; // Max 6 deg tilt
      targetRotY = nx * 8;  // Max 8 deg tilt
    };

    const handleMouseLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
    };

    const updateTilt = () => {
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;

      el.style.setProperty('--hero-tilt-x', `${currentRotX.toFixed(2)}deg`);
      el.style.setProperty('--hero-tilt-y', `${currentRotY.toFixed(2)}deg`);

      animId = requestAnimationFrame(updateTilt);
    };

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave);
    animId = requestAnimationFrame(updateTilt);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const scrollToEvidence = (e: React.MouseEvent) => {
    e.preventDefault();
    const elem = document.getElementById('evidence-stream');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={heroRef}
      className="monumental-hero-section"
      aria-label="Scamvera Digital Forensic Investigator Overview"
    >
      {/* Background Layer: Atmospheric Particles & Radar Coordinates */}
      <SpatialParticles particleCount={45} />
      <div className="hero-forensic-radar-ring" aria-hidden="true" />
      <div className="hero-crosshair-center" aria-hidden="true" />
      <div className="hero-vignette-overlay" aria-hidden="true" />

      {/* Floating 3D Evidence Shards Constellation */}
      <div className="hero-shards-constellation" aria-hidden="true">
        {/* Shard 1: Lookalike URL */}
        <div className="floating-shard shard-pos-1">
          <div className="shard-category-tag">LOOKALIKE_URL // EVASION</div>
          <div className="shard-quote">chase-security-auth.top/login</div>
          <div className="shard-meta-row">
            <span>LEVENSHTEIN: 4</span>
            <span className="shard-weight-pill">WEIGHT: +35</span>
          </div>
        </div>

        {/* Shard 2: Coercive Urgency */}
        <div className="floating-shard shard-pos-2">
          <div className="shard-category-tag">TACTIC // URGENCY_PRESSURE</div>
          <div className="shard-quote">"24-Hour Final Lockout Notice"</div>
          <div className="shard-meta-row">
            <span>SPAN: [0..28]</span>
            <span className="shard-weight-pill">WEIGHT: +20</span>
          </div>
        </div>

        {/* Shard 3: Financial Pretext */}
        <div className="floating-shard shard-pos-3">
          <div className="shard-category-tag">PRETEXT // FABRICATED_DEBIT</div>
          <div className="shard-quote">"$1,420.00 Unauthorized Wire"</div>
          <div className="shard-meta-row">
            <span>TRIGGER: FRAUD_ALERT</span>
            <span className="shard-weight-pill">WEIGHT: +25</span>
          </div>
        </div>

        {/* Shard 4: OCR Metadata */}
        <div className="floating-shard shard-pos-4">
          <div className="shard-category-tag">MULTIMODAL // OCR_EXTRACT</div>
          <div className="shard-quote">1080x1920 Screenshot Raw Feed</div>
          <div className="shard-meta-row">
            <span>CONFIDENCE: 98.4%</span>
            <span style={{ color: '#38bdf8' }}>IN-MEMORY</span>
          </div>
        </div>

        {/* Shard 5: Ephemeral Nonce */}
        <div className="floating-shard shard-pos-5">
          <div className="shard-category-tag">PRIVACY // EPHEMERAL_BUFFER</div>
          <div className="shard-quote">0-Retention Volatile Nonce</div>
          <div className="shard-meta-row">
            <span>DISK_WRITES: 0</span>
            <span style={{ color: '#34d399' }}>ISOLATED</span>
          </div>
        </div>
      </div>

      {/* Center Monumental Content Stack */}
      <div className="hero-monumental-content">
        <div className="hero-forensic-eyebrow">
          <div className="eyebrow-ping-beacon" />
          <span>EVIDENCE-FIRST CYBER FORENSICS // VERSION 3.1</span>
        </div>

        <h1 className="hero-monumental-headline">
          <span className="hero-headline-glitch-part">Scamvera</span>
          <span className="hero-headline-accent-part">Digital Investigation</span>
        </h1>

        <p className="hero-monumental-desc">
          Reconstruct suspicious messages, deceptive lookalike URLs, and social-engineering tactics into
          verifiable forensic evidence. Powered by locked deterministic scoring, multi-evidence correlation,
          and strict zero-retention privacy.
        </p>

        <div className="hero-actions-container">
          <button
            type="button"
            className="btn-monumental-primary"
            onClick={onLaunchWorkstation}
            title="Launch the Scamvera investigation workstation"
          >
            <span>Enter Investigation Workstation</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          <button
            type="button"
            className="btn-monumental-secondary"
            onClick={scrollToEvidence}
            title="Follow the evidence narrative stream"
          >
            <span>Follow Evidence Stream</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        <div className="hero-telemetry-strip">
          <div className="telemetry-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.4">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>DETERMINISTIC RISK AUTHORITY</span>
          </div>
          <div className="telemetry-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.4">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>ZERO SERVER RETENTION</span>
          </div>
          <div className="telemetry-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.4">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>UNIFIED MULTI-EVIDENCE COMPOSER</span>
          </div>
        </div>
      </div>
    </section>
  );
};
