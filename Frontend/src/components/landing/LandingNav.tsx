import React, { useState, useEffect } from 'react';

interface LandingNavProps {
  onLaunchWorkstation: () => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({ onLaunchWorkstation }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`landing-nav ${isScrolled ? 'nav-scrolled' : ''}`}
      aria-label="Main Navigation"
    >
      <div className="landing-nav-inner">
        {/* Brand Anchor */}
        <div className="landing-nav-brand">
          <div className="brand-shield-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div className="brand-text-group">
            <span className="brand-name">SCAMVERA</span>
            <span className="brand-version-badge">V3.1</span>
          </div>

          <div className="nav-system-status" title="Deterministic investigation pipeline online">
            <span className="status-live-dot" />
            <span className="status-text">SYSTEM OPERATIONAL</span>
          </div>
        </div>

        {/* Section Navigation Links */}
        <div className="landing-nav-links">
          <a
            href="#evidence-first"
            onClick={(e) => scrollToSection(e, 'evidence-first')}
            className="nav-link"
          >
            Evidence First
          </a>
          <a
            href="#investigation-flow"
            onClick={(e) => scrollToSection(e, 'investigation-flow')}
            className="nav-link"
          >
            Attack Chain
          </a>
          <a
            href="#intelligence-showcase"
            onClick={(e) => scrollToSection(e, 'intelligence-showcase')}
            className="nav-link"
          >
            Intelligence
          </a>
          <a
            href="#privacy-architecture"
            onClick={(e) => scrollToSection(e, 'privacy-architecture')}
            className="nav-link"
          >
            Zero-Retention
          </a>
        </div>

        {/* Launch Workstation CTA */}
        <div className="landing-nav-actions">
          <button
            type="button"
            className="btn-launch-workstation"
            onClick={onLaunchWorkstation}
            title="Open digital forensic investigation workstation"
          >
            <span>Launch Workstation</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};
