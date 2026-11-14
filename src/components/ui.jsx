import { useEffect, useId, useRef, useState } from 'react';
import { GLOSSARY } from '../content/glossary.js';
import { useInView } from '../hooks.js';

/* ---------- Rich text mini-markup:  **bold**   {{glossary-key|shown text}} ---------- */
const TOKEN = /(\*\*[^*]+\*\*|\{\{[a-z]+\|[^}]+\}\})/g;

export function parseRich(text) {
  return text.split(TOKEN).filter(Boolean).map((part, i) => {
    if (part.startsWith('**')) return { type: 'b', text: part.slice(2, -2), i };
    if (part.startsWith('{{')) {
      const [k, t] = part.slice(2, -2).split('|');
      return { type: 'term', key: k, text: t, i };
    }
    return { type: 't', text: part, i };
  });
}
export const richLength = (text) => parseRich(text).reduce((s, p) => s + p.text.length, 0);
export const richPlain = (text) => parseRich(text).map((p) => p.text).join('');

export function Rich({ text, limit = Infinity }) {
  let left = limit;
  const out = [];
  for (const p of parseRich(text)) {
    if (left <= 0) break;
    const shown = p.text.slice(0, left);
    left -= shown.length;
    if (p.type === 'b') out.push(<strong key={p.i}>{shown}</strong>);
    else if (p.type === 'term') out.push(shown.length === p.text.length ? <Term key={p.i} k={p.key}>{shown}</Term> : <span key={p.i}>{shown}</span>);
    else out.push(<span key={p.i}>{shown}</span>);
  }
  return <>{out}</>;
}

/* ---------- Glossary tooltip ---------- */
export function Term({ k, children }) {
  const g = GLOSSARY[k];
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onDoc = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDoc);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDoc); };
  }, [open]);
  if (!g) return <>{children}</>;
  return (
    <span className="term" ref={wrap} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="term-btn" aria-describedby={open ? id : undefined} aria-expanded={open} onClick={() => setOpen((o) => !o)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
        {children}
      </button>
      {open && (
        <span role="tooltip" id={id} className="term-pop">
          <strong>{g.term}</strong>
          {g.def}
        </span>
      )}
    </span>
  );
}

/* ---------- Scroll reveal ---------- */
export function Reveal({ children, as: Tag = 'div', delay = 0, className = '', ...rest }) {
  const [ref, inView] = useInView();
  return (
    <Tag ref={ref} className={`reveal ${inView ? 'in' : ''} ${className}`} style={{ '--d': `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}

/* ---------- Status icons: shape + word, never colour alone ---------- */
export const STATUS_WORD = { go: 'Go', marginal: 'Marginal', nogo: 'No-Go', unknown: 'Unverified', off: 'Off', risky: 'Risky' };

export function StatusIcon({ status, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false };
  switch (status) {
    case 'go':
      return (<svg {...common}><circle cx="12" cy="12" r="10" fill="var(--cream)" /><path d="M7 12.5l3.2 3.2L17 8.8" fill="none" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case 'marginal':
    case 'risky':
      return (<svg {...common}><path d="M12 2.5L22 20.5H2z" fill="var(--lav)" stroke="var(--cream)" strokeWidth="1.4" strokeLinejoin="round" /><path d="M12 9v5.2" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" /><circle cx="12" cy="17.2" r="1.4" fill="var(--ink)" /></svg>);
    case 'nogo':
      return (<svg {...common}><rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="var(--ink)" stroke="var(--cream)" strokeWidth="1.8" /><path d="M8 8l8 8M16 8l-8 8" stroke="var(--cream)" strokeWidth="2.4" strokeLinecap="round" /></svg>);
    case 'unknown':
      return (<svg {...common}><circle cx="12" cy="12" r="10" fill="none" stroke="var(--lav)" strokeWidth="2" strokeDasharray="3.2 2.6" /><path d="M9.2 9.6a3 3 0 115 2c-1.2.8-2.2 1.3-2.2 2.8" fill="none" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="18" r="1.3" fill="var(--cream)" /></svg>);
    default:
      return (<svg {...common}><circle cx="12" cy="12" r="9" fill="none" stroke="var(--lav)" strokeWidth="1.6" /><path d="M7.5 12h9" stroke="var(--lav)" strokeWidth="2" strokeLinecap="round" /></svg>);
  }
}

export function StatusPill({ status, label }) {
  return (
    <span className={`pill pill-${status}`}>
      <StatusIcon status={status} size={16} />
      <span>{label ?? STATUS_WORD[status]}</span>
    </span>
  );
}

export function SourceLink({ source, prefix = 'Source' }) {
  return (
    <a className="source" href={source.url} target="_blank" rel="noreferrer noopener">
      <span className="source-k">{prefix}</span> {source.label}<span aria-hidden="true"> ↗</span>
    </a>
  );
}

export function SampleBadge({ compact = false }) {
  return (
    <span className="sample-badge" title="Numbers come from a simplified geometry model, not real SPICE / LOLA results yet.">
      <Term k="sample">{compact ? 'SAMPLE' : 'SAMPLE DATA'}</Term>
    </span>
  );
}

export function Kbd({ children }) { return <kbd className="kbd">{children}</kbd>; }
