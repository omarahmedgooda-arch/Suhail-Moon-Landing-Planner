// Animated 2D scenes for the Student "Mission stories" (Odysseus, Athena). Pure SVG + CSS, palette only.
// Each scene restarts its animation when it mounts (the parent keys it by step).
import { useReducedMotion } from '../hooks.js';
import { useLang } from '../i18n.js';

const FLAT = 'M0 232 C150 226 300 234 400 230 S650 226 800 232 V300 H0Z';
const CRATER = 'M0 222 C140 218 250 226 330 224 C380 224 410 236 440 262 C480 290 560 290 600 262 C630 238 660 226 720 224 C760 223 790 224 800 224 V300 H0Z';

const STARS = [[60, 40], [180, 80], [300, 30], [520, 60], [640, 24], [760, 90], [420, 100], [110, 120], [250, 140], [700, 150]];

function Lander({ tipped = false, dark = false, frost = false, flame = false, quiet = false, sparkle = false }) {
  return (
    <g className="ss-lander-shape">
      <g transform={tipped ? 'translate(0 -8) rotate(72 30 0)' : undefined} className="ss-tilt">
        <path d="M-26 0 L-34 -2 M26 0 L34 -2 M-18 -12 L-30 0 M18 -12 L30 0" className="l-leg" />
        <rect x="-22" y="-40" width="44" height="28" rx="6" className="l-body" />
        <rect x="-62" y="-36" width="34" height="14" rx="2" className={`l-panel ${dark ? 'off' : ''}`} />
        <rect x="28" y="-36" width="34" height="14" rx="2" className={`l-panel ${dark ? 'off' : ''}`} />
        <circle cx="0" cy="-26" r="6" className={`l-window ${dark ? 'off' : ''}`} />
        <path d="M10 -40 L18 -56" className="l-leg" /><circle cx="18" cy="-58" r="3" className="l-ant" />
        {!quiet && <path d="M24 -62 q6 6 0 12 M30 -66 q10 10 0 20" className="l-wave" />}
        {frost && <rect x="-24" y="-42" width="48" height="32" rx="6" className="l-frost" />}
      </g>
      {flame && <path d="M-8 4 L0 26 L8 4" className="l-flame" />}
      {sparkle && <g className="sparkles">{[[-44, -62], [44, -68], [0, -88]].map(([x, y]) => (<path key={x} d={`M${x} ${y - 7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`} />))}</g>}
    </g>
  );
}

function Sky({ sunY = 120, sunX = 90, earth = true, earthWeak = false }) {
  return (
    <>
      <rect width="800" height="300" className="g-sky" />
      {STARS.map(([x, y]) => (<circle key={x} cx={x} cy={y} r="1.4" className="g-star" />))}
      {sunY != null && <circle cx={sunX} cy={sunY} r="16" className="g-sun" />}
      {earth && (<g className={`g-earth ${earthWeak ? 'ss-weak' : ''}`}><circle cx="690" cy="58" r="14" /><path d="M682 54q6 -6 12 0" /></g>)}
    </>
  );
}

const LABEL = {
  launch: 'A lander flies from Earth to the Moon',
  approach: 'The lander descends toward its target area',
  fast: 'The lander is coming down too fast',
  tip: 'A leg catches the ground and the lander tips onto its side',
  side: 'The lander lies on its side; its antenna and panels point the wrong way',
  'guess-crater': 'The lander descends, drifting away from its target',
  crater: 'The lander drops into a small crater and tips over',
  cold: 'In the crater, the panels are dark and the lander freezes',
  lesson: 'A lander standing upright on flat, sunlit ground',
};

export default function StoryScene({ scene }) {
  const reduced = useReducedMotion();
  const ar = useLang() === 'ar';
  const cls = `g-scene ss ss-${scene} ${reduced ? 'ss-still' : ''}`;
  const common = { viewBox: '0 0 800 300', className: cls, role: 'img', 'aria-label': LABEL[scene] };

  if (scene === 'launch') {
    const arc = 'M150 250 C260 90 520 40 690 90';
    return (
      <svg {...common}>
        <rect width="800" height="300" className="g-sky" />
        {STARS.map(([x, y]) => (<circle key={x} cx={x} cy={y} r="1.4" className="g-star" />))}
        <circle cx="70" cy="330" r="150" className="ss-earth-big" />
        <path d="M-10 250 q60 -30 120 -10 q40 14 80 0" className="ss-earth-land" />
        <circle cx="700" cy="90" r="42" className="ss-moon" />
        <circle cx="688" cy="80" r="7" className="ss-moon-crater" /><circle cx="714" cy="104" r="5" className="ss-moon-crater" />
        <path d={arc} className="ss-path" />
        <g className="ss-rocket" transform={reduced ? 'translate(670 96)' : undefined}>
          <g transform="rotate(60)"><path d="M0 -16 C6 -8 6 6 4 10 H-4 C-6 6 -6 -8 0 -16Z" className="l-body" /><path d="M-3 11 L0 20 L3 11" className="l-flame" /></g>
          {!reduced && <animateMotion dur="3.2s" fill="freeze" path={arc} rotate="auto" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".4 0 .3 1" />}
        </g>
      </svg>
    );
  }

  const inCrater = scene === 'crater' || scene === 'cold';
  const ground = inCrater || scene === 'guess-crater' ? CRATER : FLAT;
  const sun = scene === 'cold' ? { sunY: 222, sunX: 760 } : scene === 'side' ? { sunY: 200, sunX: 70 } : scene === 'lesson' ? { sunY: 110, sunX: 90 } : { sunY: 170, sunX: 80 };

  return (
    <svg {...common}>
      <Sky {...sun} earthWeak={scene === 'side' || scene === 'cold'} />
      <path d={ground} className={`g-ground ${scene === 'cold' ? 'ss-cold-ground' : ''}`} />
      {scene === 'approach' && (<g className="ss-target"><ellipse cx="400" cy="232" rx="70" ry="10" /><text x="400" y="266" textAnchor="middle">{ar ? 'الهدف' : 'target'}</text></g>)}
      {scene === 'guess-crater' && (<g className="ss-target"><ellipse cx="200" cy="224" rx="60" ry="9" /><text x="200" y="256" textAnchor="middle">{ar ? 'الهدف' : 'target'}</text></g>)}
      {(scene === 'tip' || scene === 'side') && [[330, 226, 9], [470, 228, 6]].map(([x, y, r]) => (<circle key={x} cx={x} cy={y} r={r} className="g-rock" />))}
      {scene === 'fast' && (<g className="ss-speed">{[-30, 0, 30].map((dx) => (<path key={dx} d={`M${400 + dx} 20 v40`} />))}</g>)}

      {scene === 'approach' && (<g className="ss-move ss-descend-slow"><Lander flame /></g>)}
      {scene === 'fast' && (<g className="ss-move ss-descend-fast"><Lander flame /><text x="0" y="-80" textAnchor="middle" className="l-q">?</text></g>)}
      {scene === 'tip' && (<g className="ss-move ss-land-tip"><g className="ss-fall"><Lander /></g></g>)}
      {scene === 'side' && (<g transform="translate(400 222)"><Lander tipped quiet /><text y={ar ? -100 : -46} className="ss-days" textAnchor={ar ? 'middle' : 'start'} x={ar ? 20 : 70}>{ar ? 'إشارة ضعيفة' : 'no signal up'}</text></g>)}
      {scene === 'guess-crater' && (<g className="ss-move ss-drift"><Lander flame /><text x="0" y="-80" textAnchor="middle" className="l-q">?</text></g>)}
      {scene === 'crater' && (<g className="ss-move ss-into-crater"><g className="ss-fall"><Lander /></g></g>)}
      {scene === 'cold' && (<g transform="translate(520 283)"><Lander tipped dark frost quiet /></g>)}
      {scene === 'lesson' && (<g transform="translate(400 230)"><Lander sparkle /></g>)}
    </svg>
  );
}
