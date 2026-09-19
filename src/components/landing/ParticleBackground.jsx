import React, { useRef, useEffect } from 'react';

const PREFERS_REDUCED_MOTION = typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      // FIX: reset transform instead of compounding ctx.scale on every resize
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const createParticle = () => ({
      x: Math.random() * canvas.offsetWidth,
      y: canvas.offsetHeight + Math.random() * 40,
      size: Math.random() * 2.5 + 0.5,
      speedY: -(Math.random() * 0.6 + 0.15),
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
      fadeSpeed: Math.random() * 0.002 + 0.001,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    });

    // PERF: pre-render the radial glow ONCE to an offscreen sprite,
    // instead of calling createRadialGradient 60x per frame
    const glowSprite = document.createElement('canvas');
    const SPRITE_SIZE = 32;
    glowSprite.width = SPRITE_SIZE;
    glowSprite.height = SPRITE_SIZE;
    const gctx = glowSprite.getContext('2d');
    const gradient = gctx.createRadialGradient(SPRITE_SIZE / 2, SPRITE_SIZE / 2, 0, SPRITE_SIZE / 2, SPRITE_SIZE / 2, SPRITE_SIZE / 2);
    gradient.addColorStop(0, 'rgba(0, 245, 160, 0.5)');
    gradient.addColorStop(0.4, 'rgba(0, 245, 160, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 245, 160, 0)');
    gctx.fillStyle = gradient;
    gctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

    const drawParticle = (p, pulseFactor) => {
      const currentOpacity = p.opacity * pulseFactor;
      const currentSize = p.size * (0.8 + pulseFactor * 0.4);
      const radius = currentSize * 4;
      ctx.globalAlpha = Math.min(1, currentOpacity * 2);
      ctx.drawImage(glowSprite, p.x - radius, p.y - radius, radius * 2, radius * 2);
      ctx.globalAlpha = Math.min(1, currentOpacity * 1.5);
      ctx.fillStyle = 'rgba(0, 245, 160, 1)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const renderFrame = () => {
      particles.forEach(p => drawParticle(p, 0.5 + Math.sin(p.pulse) * 0.5));
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += p.pulseSpeed;
        drawParticle(p, 0.5 + Math.sin(p.pulse) * 0.5);
        if (p.y < -20 || p.x < -20 || p.x > canvas.offsetWidth + 20) {
          particles[i] = createParticle();
        }
      });
      animationId = requestAnimationFrame(animate);
    };

    // FIX: named handler so removeEventListener actually removes it (leak fix)
    const handleResize = () => resize();

    resize();
    particles = Array.from({ length: 60 }, createParticle);
    particles.forEach(p => { p.y = Math.random() * canvas.offsetHeight; });

    if (PREFERS_REDUCED_MOTION) {
      renderFrame(); // A11y: static frame, no animation loop
    } else {
      animate();
    }

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}
