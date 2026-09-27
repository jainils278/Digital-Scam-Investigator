import React from 'react';

interface LandingFooterProps {
  onLaunchWorkstation: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onLaunchWorkstation }) => {
  const scrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="landing-footer" aria-label="Workstation Credits & Specifications">
      {/* Subtle Top Boundary Accent Line */}
      <div className="footer-top-accent-line" aria-hidden="true" />

      <div className="section-container">
        {/* Status Line / System Provenance Header */}
        <div className="footer-status-line">
          <div className="footer-status-left">
            <span className="footer-live-beacon" />
            <span className="footer-status-title">DEFENSIVE CYBER FORENSICS // SPECIFICATION v3.1</span>
          </div>
          <div className="footer-status-right">
            <span className="footer-provenance-tag">ZERO RETENTION // HEAP ISOLATED RUNTIME</span>
          </div>
        </div>

        {/* Minimal Editorial Grid */}
        <div className="footer-top-grid">
          {/* Brand & Mission Column */}
          <div className="footer-brand-col">
            <div className="footer-brand-header">
              <div className="footer-brand-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <span className="footer-brand-name">SCAMVERA</span>
              <span className="footer-version-tag">PROD v3.1</span>
            </div>
            <p className="footer-brand-desc">
              Deterministic digital forensics instrument designed for dissecting deceptive communications, smishing vectors, fraudulent payment demands, and social-engineering attacks.
            </p>
            <div className="footer-telemetry-tags">
              <span className="footer-telemetry-badge">OPEN PROTOCOL</span>
              <span className="footer-telemetry-badge">ZERO SERVER DISK RETENTION</span>
              <span className="footer-telemetry-badge">LOCKED MATHEMATICAL SCORING</span>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="footer-links-col">
            <div className="footer-col-heading">INVESTIGATION STATIONS</div>
            <ul className="footer-links-list">
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={onLaunchWorkstation}
                >
                  <span className="link-arrow">→</span> Launch Workstation
                </button>
              </li>
              <li>
                <a href="#evidence-first" onClick={(e) => scrollTo(e, 'evidence-first')}>
                  <span className="link-arrow">→</span> Evidence-First Apparatus
                </a>
              </li>
              <li>
                <a href="#investigation-flow" onClick={(e) => scrollTo(e, 'investigation-flow')}>
                  <span className="link-arrow">→</span> 6-Stage Attack Chain
                </a>
              </li>
              <li>
                <a href="#intelligence-showcase" onClick={(e) => scrollTo(e, 'intelligence-showcase')}>
                  <span className="link-arrow">→</span> V3.1 Intelligence Modules
                </a>
              </li>
              <li>
                <a href="#privacy-architecture" onClick={(e) => scrollTo(e, 'privacy-architecture')}>
                  <span className="link-arrow">→</span> Zero-Retention Isolation
                </a>
              </li>
            </ul>
          </div>

          {/* Technical Specifications Column */}
          <div className="footer-tech-col">
            <div className="footer-col-heading">FORENSIC SPECIFICATIONS</div>
            <ul className="footer-specs-list">
              <li>
                <span className="spec-label">RISK ENGINE:</span>
                <span className="spec-val">LOCKED DETERMINISTIC (V3.0)</span>
              </li>
              <li>
                <span className="spec-label">OBFUSCATION DIFF:</span>
                <span className="spec-val">BIJECTIVE INDEX MAPPING</span>
              </li>
              <li>
                <span className="spec-label">SENSITIVITY:</span>
                <span className="spec-val">COUNTERFACTUAL PIVOT ISOLATION</span>
              </li>
              <li>
                <span className="spec-label">CASE FILE EXPORTS:</span>
                <span className="spec-val">HTML / PDF 1.4 / JSON v1.0.0</span>
              </li>
              <li>
                <span className="spec-label">SOURCE REPOSITORY:</span>
                <a
                  href="https://github.com/jainils278/Digital-Scam-Investigator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spec-link"
                >
                  GitHub Project ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits & Disclaimer Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-disclaimer">
            <strong>DEFENSIVE NOTICE:</strong> Scamvera is engineered strictly for educational, defensive, and research purposes.
            It provides structural pattern analysis and risk attribution to assist individuals and security practitioners in identifying deceptive digital communications.
            Scamvera does not provide legal counsel, law enforcement intervention, or financial asset recovery guarantees.
          </p>
          <div className="footer-meta-row">
            <span className="footer-copy">
              &copy; {new Date().getFullYear()} Scamvera Investigation Project. Built with React 19, TypeScript, and Native SVG 3D.
            </span>
            <span className="footer-cipher-hash">SHA-256 // ZERO-LOGGING ASSURANCE SECURED</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
