import React from 'react';
import { InvestigationScene } from './InvestigationScene';

interface CinematicHeroProps {
  onLaunchWorkstation: () => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ onLaunchWorkstation }) => {
  const scrollToStory = (e: React.MouseEvent) => {
    e.preventDefault();
    const elem = document.getElementById('evidence-first');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="landing-hero-section" aria-label="Forensic Investigation Overview">
      <div className="landing-hero-grid">
        {/* Left Column: Editorial Positioning & Call to Action */}
        <div className="hero-content-col">
          {/* Technical Eyebrow Badge */}
          <div className="hero-eyebrow-badge">
            <span className="eyebrow-tag">DIGITAL FORENSIC WORKSTATION</span>
            <span className="eyebrow-separator">//</span>
            <span className="eyebrow-ver">VERSION 3.1</span>
          </div>

          {/* Primary Editorial Headline */}
          <h1 className="hero-headline">
            Don't just detect the scam. <br />
            <span className="headline-accent">Investigate the evidence.</span>
          </h1>

          {/* Subtitle / Product Philosophy */}
          <p className="hero-subhead">
            Scamvera reconstructs suspicious messages, lookalike URLs, and social-engineering tactics into
            verifiable forensic evidence. With deterministic scoring authority, sensitivity analysis, and
            strict zero-retention privacy.
          </p>

          {/* Action CTAs */}
          <div className="hero-cta-group">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={onLaunchWorkstation}
              title="Launch the Scamvera investigation workstation"
            >
              <span>Start an Investigation</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <button
              type="button"
              className="btn-hero-secondary"
              onClick={scrollToStory}
              title="Explore evidence-first methodology"
            >
              <span>See How It Works</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* Architecture Verification Badges */}
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
              <span>FORENSIC CASE EXPORTS</span>
            </div>
          </div>
        </div>

        {/* Right Column: Spatial 3D Investigation Environment */}
        <div className="hero-scene-col">
          <InvestigationScene />
        </div>
      </div>
    </section>
  );
};
