import React, { useEffect } from 'react';
import { CinematicHero } from './CinematicHero';
import { EvidenceFirstSection } from './EvidenceFirstSection';
import { IntelligenceShowcase } from './IntelligenceShowcase';
import { InvestigationFlow } from './InvestigationFlow';
import { LandingCTA } from './LandingCTA';
import { LandingFooter } from './LandingFooter';
import { LandingNav } from './LandingNav';
import { PrivacySection } from './PrivacySection';

interface CinematicLandingProps {
  onLaunchWorkstation: () => void;
}

export const CinematicLanding: React.FC<CinematicLandingProps> = ({ onLaunchWorkstation }) => {
  useEffect(() => {
    // Respect user reduced-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.landing-section, .landing-hero-section').forEach((el) => {
        el.classList.add('section-visible');
      });
      return;
    }

    // 1. Scroll-triggered reveal sequence observer (replayable bidirectional lifecycle)
    const targets = document.querySelectorAll('.landing-section, .landing-hero-section');
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
        threshold: 0.1,
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
    <div className="landing-page">
      {/* Top Technical Navigation */}
      <LandingNav onLaunchWorkstation={onLaunchWorkstation} />

      {/* Main Narrative Content Stream */}
      <main className="landing-main-content">
        <CinematicHero onLaunchWorkstation={onLaunchWorkstation} />
        <EvidenceFirstSection />
        <InvestigationFlow />
        <IntelligenceShowcase />
        <PrivacySection />
        <LandingCTA onLaunchWorkstation={onLaunchWorkstation} />
      </main>

      {/* Forensic Editorial Footer */}
      <LandingFooter onLaunchWorkstation={onLaunchWorkstation} />
    </div>
  );
};
