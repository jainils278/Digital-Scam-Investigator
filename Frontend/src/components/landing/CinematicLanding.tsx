import React, { useEffect } from 'react';
import { CinematicHero } from './CinematicHero';
import { EvidenceFirstSection } from './EvidenceFirstSection';
import { RelationshipScene } from './RelationshipScene';
import { InvestigationFlow } from './InvestigationFlow';
import { TacticsScene } from './TacticsScene';
import { RiskScene } from './RiskScene';
import { ResponseScene } from './ResponseScene';
import { PrivacySection } from './PrivacySection';
import { LandingCTA } from './LandingCTA';
import { LandingFooter } from './LandingFooter';
import { LandingNav } from './LandingNav';

interface CinematicLandingProps {
  onLaunchWorkstation: () => void;
}

export const CinematicLanding: React.FC<CinematicLandingProps> = ({ onLaunchWorkstation }) => {
  useEffect(() => {
    // Respect user reduced-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.landing-section, .landing-hero-section, .monumental-hero-section').forEach((el) => {
        el.classList.add('section-visible');
      });
      return;
    }

    // 1. Scroll-triggered reveal sequence observer (replayable bidirectional lifecycle)
    const targets = document.querySelectorAll('.landing-section, .landing-hero-section, .monumental-hero-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-visible');
          } else {
            entry.target.classList.remove('section-visible');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    targets.forEach((t) => observer.observe(t));

    // 2. Subtle scroll-linked depth controller (rAF-throttled, zero React re-renders)
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || window.pageYOffset;
          const root = document.documentElement;
          root.style.setProperty('--scroll-parallax-1', `${(scrollY * 0.04).toFixed(1)}px`);
          root.style.setProperty('--scroll-parallax-2', `${(scrollY * 0.08).toFixed(1)}px`);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="landing-page narrative-stream-container">
      {/* Top Technical Navigation */}
      <LandingNav onLaunchWorkstation={onLaunchWorkstation} />

      {/* Main Narrative Content Stream */}
      <main className="landing-main-content">
        {/* Cinematic Monumental Opening */}
        <CinematicHero onLaunchWorkstation={onLaunchWorkstation} />

        {/* Stage 01: Evidence First */}
        <div id="evidence-stream">
          <EvidenceFirstSection />
        </div>

        {/* Stage 02: Topology & Relationships */}
        <RelationshipScene />

        {/* Stage 03: Attack Chain Reconstruction */}
        <InvestigationFlow />

        {/* Stage 04: Psychological Tactic Fingerprints */}
        <TacticsScene />

        {/* Stage 05: Deterministic Risk Authority & Sensitivity */}
        <RiskScene />

        {/* Stage 06: Incident Containment & Response Directive */}
        <ResponseScene />

        {/* Architectural Defense: Zero Server Retention & Ephemeral Nonces */}
        <PrivacySection />

        {/* Terminal Gateway: Start Investigation */}
        <LandingCTA onLaunchWorkstation={onLaunchWorkstation} />
      </main>

      {/* Forensic Editorial Footer */}
      <LandingFooter onLaunchWorkstation={onLaunchWorkstation} />
    </div>
  );
};
