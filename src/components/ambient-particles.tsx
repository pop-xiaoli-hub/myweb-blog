"use client";

import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; vx: number; vy: number; radius: number; hue: number; alpha: number };

export default function AmbientParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(28, Math.max(12, Math.round((width * height) / 65000)));
      particles = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.08 + Math.random() * 0.2;
        return { x: Math.random() * width, y: Math.random() * height, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: 1.6 + Math.random() * 3.6, hue: Math.random() > 0.5 ? 20 + Math.random() * 38 : 180 + Math.random() * 65, alpha: 0.18 + Math.random() * 0.2 };
      });
    };

    const draw = () => {
      context.fillStyle = "rgba(7, 12, 21, 0.12)";
      context.fillRect(0, 0, width, height);
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x <= -30 || particle.x >= width + 30) particle.vx *= -1;
        if (particle.y <= -30 || particle.y >= height + 30) particle.vy *= -1;
        const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * 14);
        glow.addColorStop(0, `hsla(${particle.hue}, 100%, 88%, ${particle.alpha * 0.7})`);
        glow.addColorStop(0.08, `hsla(${particle.hue}, 100%, 78%, ${particle.alpha * 0.5})`);
        glow.addColorStop(0.28, `hsla(${particle.hue}, 100%, 70%, ${particle.alpha * 0.2})`);
        glow.addColorStop(0.58, `hsla(${particle.hue}, 100%, 65%, ${particle.alpha * 0.06})`);
        glow.addColorStop(1, `hsla(${particle.hue}, 100%, 65%, 0)`);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius * 14, 0, Math.PI * 2);
        context.fill();
      }
      frame = window.requestAnimationFrame(draw);
    };

    resize();
    context.fillStyle = "#070c15";
    context.fillRect(0, 0, width, height);
    window.addEventListener("resize", resize);
    frame = window.requestAnimationFrame(draw);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="ambient-particles" aria-hidden="true" />;
}
