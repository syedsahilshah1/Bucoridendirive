import React, { useEffect, useRef } from 'react';

interface LiveBackgroundProps {
  isDark?: boolean;
}

export const LiveBackground: React.FC<LiveBackgroundProps> = ({ isDark = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      pulseSpeed: number;
    }

    const particles: Particle[] = [];
    const count = Math.min(35, Math.floor((width * height) / 32000));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.35 + 0.1,
        pulseSpeed: Math.random() * 0.02 + 0.005,
      });
    }

    let pulseRadar = 0;

    const render = () => {
      // Clear base: Deep Dark Grey
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      // Soft Top Yellow Radial Glow
      const radialGradient = ctx.createRadialGradient(
        width * 0.5,
        0,
        40,
        width * 0.5,
        0,
        height * 0.65
      );
      radialGradient.addColorStop(0, 'rgba(234, 179, 8, 0.16)');
      radialGradient.addColorStop(0.5, 'rgba(234, 179, 8, 0.04)');
      radialGradient.addColorStop(1, 'rgba(11, 15, 25, 0)');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle Faint Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Radar Pulse Beacon (Yellow)
      pulseRadar += 0.012;
      const maxRadar = Math.min(width, height) * 0.4;
      const radarRadius = (pulseRadar * 70) % maxRadar;
      const radarAlpha = Math.max(0, 0.12 - (radarRadius / maxRadar) * 0.12);

      ctx.save();
      ctx.beginPath();
      ctx.arc(width * 0.82, height * 0.2, radarRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(234, 179, 8, ${radarAlpha * 1.8})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Render Particles and Route Lines (Yellow fading into dark grey)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.004;
        const clampedAlpha = Math.max(0.12, Math.min(0.65, p.alpha));

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const lineAlpha = (1 - dist / 110) * 0.2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(234, 179, 8, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(250, 204, 21, ${clampedAlpha * 1.4})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
    />
  );
};

export default LiveBackground;
