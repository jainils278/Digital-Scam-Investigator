import React, { useEffect, useRef } from 'react';
import { EvidenceNetwork } from '../../scenes/investigation/EvidenceNetwork';
import { InvestigationArtifact } from '../../scenes/investigation/InvestigationArtifact';
import { SpatialParticles } from '../../scenes/investigation/SpatialParticles';

interface InvestigationSceneProps {
  className?: string;
}

export const InvestigationScene: React.FC<InvestigationSceneProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Disable pointer parallax on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Normalized coordinates in [-1, 1]
      const nx = (x - rect.width / 2) / (rect.width / 2);
      const ny = (y - rect.height / 2) / (rect.height / 2);

      // Max tilt: 8 degrees X, 10 degrees Y
      targetRotX = -ny * 7;
      targetRotY = nx * 9;
    };

    const handleMouseLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
    };

    const updateTilt = () => {
      // Smooth lerp
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;

      el.style.setProperty('--scene-rot-x', `${currentRotX.toFixed(2)}deg`);
      el.style.setProperty('--scene-rot-y', `${currentRotY.toFixed(2)}deg`);

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

  return (
    <div
      ref={containerRef}
      className={`investigation-scene-container ${className}`}
      aria-label="Interactive 3D Digital Forensic Scene"
    >
      {/* Layer 0: Atmospheric Canvas Particles & Coordinate Grid */}
      <SpatialParticles />

      {/* Atmospheric Ambient Glow behind 3D Stage */}
      <div className="scene-ambient-lens" aria-hidden="true" />

      {/* Layer 1: Spatial 3D Perspective Stage */}
      <div className="investigation-scene-stage">
        {/* Plane A: Deep Coordinate Grid (translateZ -40px) */}
        <div className="scene-plane-depth-grid" aria-hidden="true">
          <div className="scene-grid-crosshair top-left" />
          <div className="scene-grid-crosshair top-right" />
          <div className="scene-grid-crosshair bottom-left" />
          <div className="scene-grid-crosshair bottom-right" />
        </div>

        {/* Plane B: Middle SVG Evidence Network (translateZ 15px) */}
        <div className="scene-plane-network" aria-hidden="true">
          <EvidenceNetwork />
        </div>

        {/* Plane C: Foreground Forensic Artifact Card (translateZ 50px) */}
        <div className="scene-plane-artifact">
          <InvestigationArtifact />
        </div>
      </div>
    </div>
  );
};
