import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks.js';

/* Fixed parallax star field (3 depth layers). Static when the user prefers reduced motion. */
export default function Starfield() {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, raf = 0, stars = [];
    const cs = getComputedStyle(document.documentElement);
    const cream = cs.getPropertyValue('--cream').trim() || '#C8C793';
    const lav = cs.getPropertyValue('--lav').trim() || '#7C679E';

    const seed = (() => { let a = 20261113; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; })();

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      const count = Math.round((w * h) / 5200);
      stars = Array.from({ length: count }, () => {
        const layer = seed() < 0.55 ? 0 : seed() < 0.75 ? 1 : 2;
        return { x: seed() * w, y: seed() * h * 1.6, r: [0.6, 0.95, 1.5][layer], depth: [0.03, 0.08, 0.16][layer], tw: seed() * 6.28, c: layer === 2 ? cream : seed() < 0.5 ? lav : cream, a: [0.45, 0.65, 0.95][layer] };
      });
    }

    function draw(t = 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const sy = reduced ? 0 : window.scrollY;
      for (const s of stars) {
        let y = (s.y - sy * s.depth) % (h * 1.6);
        if (y < 0) y += h * 1.6;
        if (y > h) continue;
        const tw = reduced ? 1 : 0.75 + 0.25 * Math.sin(t / 900 + s.tw);
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = s.c;
        ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    build(); draw();
    let last = 0;
    const loop = (t) => { if (t - last > 60) { draw(t); last = t; } raf = requestAnimationFrame(loop); };
    if (!reduced) raf = requestAnimationFrame(loop);
    const onResize = () => { build(); draw(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [reduced]);

  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
