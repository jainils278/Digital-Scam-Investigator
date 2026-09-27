import React, { useEffect, useRef } from 'react';

interface SpatialParticlesProps {
  particleCount?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
}

export const SpatialParticles: React.FC<SpatialParticlesProps> = ({
  particleCount = 55,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Draw static grid coordinates once and exit
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.parentElement?.clientWidth || 800;
      const height = canvas.parentElement?.clientHeight || 600;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      drawStaticGrid(ctx, width, height);
      return;
    }

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const particles: Particle[] = [];
    const count = window.innerWidth < 768 ? 20 : window.innerWidth < 1024 ? 35 : particleCount;

    const resize = () => {
      if (!canvas.parentElement) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // Re-initialize particles within new boundaries
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 0.8 + 0.2, // depth factor [0.2, 1.0]
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          size: Math.random() * 1.5 + 0.8,
          alpha: Math.random() * 0.35 + 0.15,
          baseAlpha: Math.random() * 0.35 + 0.15,
        });
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = (e.clientX - rect.left - width / 2) * 0.05;
      targetMouseY = (e.clientY - rect.top - height / 2) * 0.05;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    resize();

    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle coordinate grid
      drawCoordinateGrid(ctx, width, height, time);

      // Render & update depth particles
      ctx.fillStyle = '#38bdf8';
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += (p.vx + mouseX * p.z * 0.08) * (delta * 60);
        p.y += (p.vy + mouseY * p.z * 0.08) * (delta * 60);

        // Wrap around boundaries
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Subtle alpha breathing
        const alphaPulse = Math.sin(time * 0.0015 + i) * 0.08;
        const currentAlpha = Math.max(0.05, Math.min(0.6, p.baseAlpha + alphaPulse));

        ctx.globalAlpha = currentAlpha * p.z;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.z, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles with subtle forensic vectors
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 90) {
            const lineAlpha = (1 - dist / 90) * 0.12 * p.z * p2.z;
            ctx.globalAlpha = lineAlpha;
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`spatial-particles-canvas ${className}`}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

function drawCoordinateGrid(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const step = 80;
  ctx.save();
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
  ctx.lineWidth = 0.5;

  // Grid tick marks at intersections
  for (let x = step; x < width; x += step) {
    for (let y = step; y < height; y += step) {
      // Small crosshairs
      const crossSize = 3;
      ctx.beginPath();
      ctx.moveTo(x - crossSize, y);
      ctx.lineTo(x + crossSize, y);
      ctx.moveTo(x, y - crossSize);
      ctx.lineTo(x, y + crossSize);
      ctx.stroke();
    }
  }

  // Very subtle scanning wave
  const scanY = (time * 0.035) % (height * 1.5) - height * 0.25;
  if (scanY >= 0 && scanY <= height) {
    const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.035)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 30, width, 60);
  }

  ctx.restore();
}

function drawStaticGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const step = 80;
  ctx.save();
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
  ctx.lineWidth = 0.5;

  for (let x = step; x < width; x += step) {
    for (let y = step; y < height; y += step) {
      const crossSize = 3;
      ctx.beginPath();
      ctx.moveTo(x - crossSize, y);
      ctx.lineTo(x + crossSize, y);
      ctx.moveTo(x, y - crossSize);
      ctx.lineTo(x, y + crossSize);
      ctx.stroke();
    }
  }
  ctx.restore();
}
