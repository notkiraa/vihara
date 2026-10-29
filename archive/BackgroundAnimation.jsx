import React, { useEffect, useRef } from 'react';

/**
 * BackgroundAnimation Component (React JS)
 * Interactive Ambient Particle Canvas for Vihara Amurwa Bhumi Cibinong
 * 
 * Usage in React:
 * import { BackgroundAnimation } from './js/BackgroundAnimation';
 * 
 * function App() {
 *   return (
 *     <div className="app">
 *       <BackgroundAnimation />
 *       <MainContent />
 *     </div>
 *   );
 * }
 */
export const BackgroundAnimation = ({ particleCount = 45 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles = [];
    let animationFrameId;
    let mouse = { x: -9999, y: -9999, radius: 110 };

    const colors = [
      'rgba(122, 26, 48, ',
      'rgba(166, 37, 70, ',
      'rgba(194, 145, 52, ',
      'rgba(180, 83, 9, ',
      'rgba(94, 21, 38, '
    ];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      createParticles();
    };

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2.2 + 1.2;
        this.baseColor = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = Math.random() * 0.35 + 0.15;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.pulseSpeed = Math.random() * 0.02 + 0.008;
        this.pulseVal = Math.random() * Math.PI;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < -10) this.x = width + 10;
        if (this.x > width + 10) this.x = -10;
        if (this.y < -10) this.y = height + 10;
        if (this.y > height + 10) this.y = -10;

        this.pulseVal += this.pulseSpeed;
        const currentAlpha = this.alpha + Math.sin(this.pulseVal) * 0.1;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 2.5;
          this.y -= Math.sin(angle) * force * 2.5;
        }

        return Math.max(0.05, Math.min(0.65, currentAlpha));
      }
      draw(alpha) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.baseColor + alpha + ')';
        ctx.fill();
      }
    }

    const createParticles = () => {
      const count = width < 768 ? Math.floor(particleCount * 0.7) : particleCount;
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };

    const drawConnections = () => {
      const maxDist = width < 768 ? 85 : 115;
      const maxDistSq = maxDist * maxDist;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxDistSq) {
            const opacity = (1 - distSq / maxDistSq) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(122, 26, 48, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    };

    let orbAngle = 0;
    const drawAmbientOrbs = () => {
      orbAngle += 0.003;
      const ox1 = width * 0.2 + Math.sin(orbAngle) * 40;
      const oy1 = height * 0.25 + Math.cos(orbAngle) * 35;
      const ox2 = width * 0.8 + Math.cos(orbAngle * 0.8) * 50;
      const oy2 = height * 0.65 + Math.sin(orbAngle * 0.8) * 45;

      const g1 = ctx.createRadialGradient(ox1, oy1, 0, ox1, oy1, width * 0.4);
      g1.addColorStop(0, 'rgba(244, 219, 226, 0.45)');
      g1.addColorStop(1, 'rgba(244, 219, 226, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const g2 = ctx.createRadialGradient(ox2, oy2, 0, ox2, oy2, width * 0.45);
      g2.addColorStop(0, 'rgba(254, 243, 199, 0.35)');
      g2.addColorStop(1, 'rgba(254, 243, 199, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      drawAmbientOrbs();
      drawConnections();
      particles.forEach((p) => {
        const a = p.update();
        p.draw(a);
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    const handlePointerMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.x = clientX;
      mouse.y = clientY;
    };

    const handlePointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('touchend', handlePointerLeave);

    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('touchend', handlePointerLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default BackgroundAnimation;

