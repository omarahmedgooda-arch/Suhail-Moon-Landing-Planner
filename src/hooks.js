import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';
function subscribe(cb) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

/** true once the element has entered the viewport (stays true). */
export function useInView(options = { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { setInView(true); return; }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect(); }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);
  return [ref, inView];
}

/** Counts up to `total` characters, one tick per `ms`. Instant when reduced motion or !active. */
export function useTypewriter(total, { active = true, ms = 14, restartKey } = {}) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduced || !active) { setN(total); return; }
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setN(Math.min(i, total));
      if (i >= total) clearInterval(id);
    }, ms);
    return () => clearInterval(id);
  }, [total, active, ms, reduced, restartKey]);
  return n;
}

/** current scroll progress 0..1 of the whole document */
export function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        setP(max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0);
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, []);
  return p;
}

/** Measures an element's width (px) so SVGs can lay out at real size on phones. */
export function useWidth(initial = 720) {
  const ref = useRef(null);
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const set = () => setW(el.clientWidth || initial);
    set();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [initial]);
  return [ref, w];
}
