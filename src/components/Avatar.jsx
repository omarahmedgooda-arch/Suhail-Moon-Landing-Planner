import { useId } from 'react';
import { useMode } from './ModeContext.js';
import { figureFor } from './figures.js';
import starUrl from '../assets/suhail-star.webp';

/* Five astronaut-style characters + the guide star. Pure SVG, palette colours only.
   mood: happy | nervous | worried | confused | asleep */

const LOOK = {
  sunlight: { helmet: 'var(--cream)', suit: 'var(--lav)', accent: 'var(--cream)', badge: 'var(--indigo)' },
  night: { helmet: 'color-mix(in srgb, var(--lav) 60%, var(--cream))', suit: 'var(--indigo)', accent: 'var(--cream)', badge: 'var(--plum)' },
  comms: { helmet: 'var(--indigo)', suit: 'var(--plum)', accent: 'var(--cream)', badge: 'var(--lav)' },
  terrain: { helmet: 'var(--lav)', suit: 'var(--plum)', accent: 'var(--cream)', badge: 'var(--indigo)' },
  science: { helmet: 'color-mix(in srgb, var(--cream) 70%, var(--lav))', suit: 'var(--indigo)', accent: 'var(--cream)', badge: 'var(--plum)' },
  leader: { helmet: 'color-mix(in srgb, var(--cream) 82%, var(--lav))', suit: 'var(--plum)', accent: 'var(--cream)', badge: 'var(--indigo)' },
};

function Face({ mood }) {
  const s = { stroke: 'var(--cream)', strokeWidth: 3.2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (mood) {
    case 'happy':
      return (<g><path d="M43 50q5-8 10 0" {...s} /><path d="M67 50q5-8 10 0" {...s} /><path d="M51 59q9 8 18 0" {...s} /></g>);
    case 'nervous':
      return (<g><circle cx="49" cy="50" r="3.4" fill="var(--cream)" /><circle cx="71" cy="50" r="3.4" fill="var(--cream)" /><path d="M51 61q3.2-3 6.4 0t6.4 0 6.4 0" {...s} strokeWidth="2.8" /><path d="M84 36q4 6 0 9-4-3 0-9z" fill="var(--lav)" stroke="var(--cream)" strokeWidth="1.2" /></g>);
    case 'worried':
      return (<g><circle cx="49" cy="52" r="3.4" fill="var(--cream)" /><circle cx="71" cy="52" r="3.4" fill="var(--cream)" /><path d="M42 48l13-6M78 48l-13-6" {...s} strokeWidth="2.8" /><path d="M51 64q9-8 18 0" {...s} /></g>);
    case 'confused':
      return (<g><circle cx="49" cy="50" r="4.6" fill="var(--cream)" /><circle cx="71" cy="51" r="2.6" fill="var(--cream)" /><circle cx="60" cy="62" r="3" {...s} strokeWidth="2.6" /><text x="86" y="34" fontFamily="var(--font-display)" fontSize="20" fontWeight="700" fill="var(--cream)">?</text></g>);
    case 'thinking':
      return (<g><circle cx="51" cy="47" r="3.4" fill="var(--cream)" /><circle cx="73" cy="47" r="3.4" fill="var(--cream)" /><circle cx="62" cy="62" r="2.8" {...s} strokeWidth="2.4" /><text x="84" y="34" fontFamily="var(--font-display)" fontSize="16" fontWeight="700" fill="var(--cream)">…</text></g>);
    default: // asleep
      return (<g><path d="M43 51h11M66 51h11" {...s} /><path d="M54 61h12" {...s} strokeWidth="2.6" /><text x="84" y="34" fontFamily="var(--font-display)" fontSize="15" fontWeight="700" fill="var(--cream)">z</text><text x="92" y="24" fontFamily="var(--font-display)" fontSize="11" fontWeight="700" fill="var(--cream)">z</text></g>);
  }
}

function Accessory({ id }) {
  const c = 'var(--cream)';
  switch (id) {
    case 'sunlight': // sun-ray crown
      return (<g stroke={c} strokeWidth="3.4" strokeLinecap="round">{[-50, -25, 0, 25, 50].map((a) => (<line key={a} x1="60" y1="8" x2="60" y2="1" transform={`rotate(${a} 60 50)`} />))}</g>);
    case 'night': // scarf
      return (<g><path d="M30 84q30 14 60 0l-3 11q-27 12-54 0z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" /><path d="M78 92l4 20 9-3-3-18z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" /></g>);
    case 'comms': // antenna
      return (<g><path d="M82 24L96 6" stroke={c} strokeWidth="3" strokeLinecap="round" /><circle cx="97" cy="5" r="3.4" fill={c} /><path d="M104 2q5 5 0 10M109 -1q8 8 0 16" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" /></g>);
    case 'terrain': // hard hat band + flag
      return (<g><path d="M26 40q34-34 68 0" fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" /><path d="M26 40q34-34 68 0" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="1 7" /><path d="M60 14V0l13 5-13 5" fill={c} stroke="var(--ink)" strokeWidth="1.6" strokeLinejoin="round" /></g>);
    case 'science': // goggles on top
      return (<g><rect x="36" y="9" width="48" height="13" rx="6.5" fill="var(--ink)" stroke={c} strokeWidth="2.4" /><circle cx="49" cy="15.5" r="4" fill={c} /><circle cx="71" cy="15.5" r="4" fill={c} /></g>);
    case 'leader': // star crown, wise eyebrows and a long beard
      return (
        <g>
          <path d="M60 -9L62.6 -1L70 1.4L62.6 3.8L60 11L57.4 3.8L50 1.4L57.4 -1z" fill={c} stroke="var(--ink)" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M40 42q8-6 16-1M64 41q8-5 16 1" fill="none" stroke={c} strokeWidth="2.8" strokeLinecap="round" />
          <path d="M36 70q24 32 48 0q-3 21-24 28q-21-7-24-28z" fill={c} stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
          <path d="M60 76v14M52 76q2 10 4 14M68 76q-2 10-4 14" fill="none" stroke="var(--ink)" strokeWidth="1.3" strokeLinecap="round" opacity=".45" />
        </g>
      );
    default: return null;
  }
}

function Badge({ id, fill }) {
  const c = 'var(--cream)';
  return (
    <g>
      <circle cx="60" cy="104" r="11" fill={fill} stroke={c} strokeWidth="1.8" />
      {id === 'sunlight' && (<g stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="60" cy="104" r="3.4" fill={c} />{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (<line key={a} x1="60" y1="97.5" x2="60" y2="99.2" transform={`rotate(${a} 60 104)`} />))}</g>)}
      {id === 'night' && (<g stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M60 97v14M54 100l12 8M66 100l-12 8" /></g>)}
      {id === 'comms' && (<g fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M54 104a6 6 0 016 6M54 104a6 6 0 006-6" opacity="0" /><circle cx="56" cy="107" r="1.6" fill={c} /><path d="M56 102.5a5 5 0 015 5M56 98.5a9 9 0 019 9" /></g>)}
      {id === 'terrain' && (<g><path d="M52 109l8-12 8 12z" fill={c} /><path d="M56 109l4-6 4 6z" fill={fill} /></g>)}
      {id === 'science' && (<g fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M57 97h6M58.5 97v6l-4.5 7h12l-4.5-7v-6" /></g>)}
      {id === 'leader' && (<g><path d="M60 94L62 102L70 104L62 106L60 114L58 106L50 104L58 102z" fill={c} /></g>)}
    </g>
  );
}

export function Avatar({ id, mood = 'happy', size = 96, label, mode: modeProp }) {
  const ctxMode = useMode();
  const mode = modeProp ?? ctxMode;
  const look = LOOK[id] ?? LOOK.sunlight;
  const clip = useId();
  const fig = figureFor(mode, id, mood);
  if (fig) {
    return (
      <span className={`figure mood-${mood} fig-${mode}`} style={{ '--fs': `${size}px` }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        <img src={fig} alt="" loading="lazy" decoding="async" draggable="false" />
      </span>
    );
  }
  return (
    <svg className={`avatar mood-${mood}`} width={size} height={size} viewBox="-8 -10 136 138" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      {/* shoulders / suit */}
      <path d="M16 124c0-26 20-38 44-38s44 12 44 38z" fill={look.suit} stroke="var(--ink)" strokeWidth="2.4" />
      {id === 'night' && <Accessory id="night" />}
      {/* helmet */}
      <circle cx="60" cy="50" r="38" fill={look.helmet} stroke="var(--ink)" strokeWidth="2.6" />
      <clipPath id={clip}><circle cx="60" cy="50" r="38" /></clipPath>
      <path d="M22 62q38 36 76 0" fill="var(--ink)" opacity=".1" clipPath={`url(#${clip})`} />
      {/* visor */}
      <rect x="31" y="31" width="58" height="38" rx="19" fill="var(--ink)" />
      <path d="M38 38q8-5 18-4" fill="none" stroke="var(--cream)" strokeWidth="2.4" strokeLinecap="round" opacity=".35" />
      <Face mood={mood} />
      {id !== 'night' && <Accessory id={id} />}
      <Badge id={id} fill={look.badge} />
    </svg>
  );
}

/* Suhail (Canopus): rendered as a realistic star (white-yellow F-type supergiant with telescope diffraction spikes). */
export function SuhailStar({ size = 96, glow = true, label }) {
  return (
    <span className={`suhail-star real ${glow ? 'glow' : ''}`} style={{ '--ss': `${size}px` }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <img src={starUrl} alt="" draggable="false" />
    </span>
  );
}

/* Logo mark: the same star, small. */
export function LogoMark({ size = 40 }) {
  return <span className="logo-star" style={{ '--ss': `${size}px` }} aria-hidden="true"><img src={starUrl} alt="" draggable="false" /></span>;
}
