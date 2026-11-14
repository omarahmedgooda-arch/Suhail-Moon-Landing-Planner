/* Original illustrations – flat SVG, palette colours only. No third-party images.
   (If you want real NASA photos later, add them under public/images and credit them.) */

function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Stars({ w = 480, h = 160, n = 40, seed = 3 }) {
  const r = mulberry(seed);
  return (
    <g fill="var(--cream)">
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={(r() * w).toFixed(1)} cy={(r() * h).toFixed(1)} r={(0.5 + r() * 1.3).toFixed(2)} opacity={(0.25 + r() * 0.65).toFixed(2)} />
      ))}
    </g>
  );
}

export function Defs() {
  return (
    <defs>
      <radialGradient id="g-sun"><stop offset="0" stopColor="var(--cream)" stopOpacity=".95" /><stop offset=".35" stopColor="var(--cream)" stopOpacity=".28" /><stop offset="1" stopColor="var(--cream)" stopOpacity="0" /></radialGradient>
      <radialGradient id="g-earth"><stop offset="0" stopColor="var(--indigo)" stopOpacity=".9" /><stop offset="1" stopColor="var(--indigo)" stopOpacity="0" /></radialGradient>
      <linearGradient id="g-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--lav)" /><stop offset=".08" stopColor="color-mix(in srgb, var(--plum) 70%, var(--lav))" /><stop offset=".5" stopColor="var(--plum)" /><stop offset="1" stopColor="color-mix(in srgb, var(--plum) 30%, var(--ink))" /></linearGradient>
      <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--ink)" /><stop offset="1" stopColor="color-mix(in srgb, var(--plum) 60%, var(--ink))" /></linearGradient>
    </defs>
  );
}

export function Sun({ x, y, r = 14, glow = 3.2 }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * glow} fill="url(#g-sun)" />
      <circle cx={x} cy={y} r={r} fill="var(--cream)" />
    </g>
  );
}

export function Earth({ x, y, r = 16 }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 2.4} fill="url(#g-earth)" opacity=".5" />
      <circle cx={x} cy={y} r={r} fill="var(--indigo)" stroke="var(--lav)" strokeWidth={Math.max(1, r * 0.09)} />
      <path d={`M${x - r * 0.55} ${y - r * 0.2}q${r * 0.4}-${r * 0.5} ${r * 0.8}-${r * 0.2}t${r * 0.3} ${r * 0.5}q-${r * 0.5} ${r * 0.25}-${r * 0.9} ${r * 0.05}z`} fill="var(--cream)" opacity=".75" />
      <path d={`M${x + r * 0.1} ${y + r * 0.35}q${r * 0.35}-${r * 0.1} ${r * 0.5} ${r * 0.1}q-${r * 0.2} ${r * 0.25}-${r * 0.5} ${r * 0.12}z`} fill="var(--cream)" opacity=".6" />
    </g>
  );
}

/** Lander drawn around (0,0) = centre of its feet. tilt rotates it about the feet. */
export function Lander({ x = 0, y = 0, s = 1, tilt = 0, shade = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`}>
      <path d="M-10 -14L-23 0M10 -14L23 0" stroke="var(--cream)" strokeWidth="3" strokeLinecap="round" />
      <path d="M-28 1h10M18 1h10" stroke="var(--cream)" strokeWidth="3.4" strokeLinecap="round" />
      <rect x="-38" y="-34" width="22" height="9" rx="1.5" fill="var(--indigo)" stroke="var(--lav)" strokeWidth="1.2" />
      <rect x="16" y="-34" width="22" height="9" rx="1.5" fill="var(--indigo)" stroke="var(--lav)" strokeWidth="1.2" />
      <path d="M-30 -34v9M-23 -34v9M23 -34v9M30 -34v9" stroke="var(--lav)" strokeWidth=".8" />
      <path d="M-16 -29.5h4M12 -29.5h4" stroke="var(--cream)" strokeWidth="1.6" />
      <rect x="-14" y="-42" width="28" height="28" rx="6" fill="var(--cream)" />
      <circle cx="0" cy="-30" r="5" fill="var(--ink)" />
      <path d="M0 -42v-9" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round" />
      <path d="M-8 -55q8 9 16 0z" fill="var(--cream)" />
      {shade > 0 && <rect x="-40" y="-56" width="80" height="62" fill="var(--ink)" opacity={shade} />}
    </g>
  );
}

export function Rover({ x = 0, y = 0, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-18" y="-20" width="36" height="12" rx="3" fill="var(--cream)" />
      <rect x="-12" y="-27" width="24" height="7" rx="2" fill="var(--indigo)" stroke="var(--lav)" strokeWidth="1" />
      <path d="M10 -27l8-9" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="19" cy="-37" r="2.6" fill="var(--cream)" />
      {[-14, 0, 14].map((cx) => (<circle key={cx} cx={cx} cy="-4" r="5.5" fill="var(--ink)" stroke="var(--cream)" strokeWidth="2" />))}
    </g>
  );
}

function Craters({ items }) {
  return items.map(([cx, cy, rx, ry], i) => (
    <g key={i} fill="none" stroke="var(--ink)" strokeOpacity=".45">
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} strokeWidth="1.4" />
      <path d={`M${cx - rx} ${cy}a${rx} ${ry} 0 0 1 ${rx * 2} 0`} stroke="var(--cream)" strokeOpacity=".22" strokeWidth="1.2" />
    </g>
  ));
}

/* ---------------------------------------------------------------- hero */
export function HeroArt() {
  return (
    <svg viewBox="0 0 1200 560" preserveAspectRatio="xMidYMax slice" className="art-hero" role="img" aria-label="A small lander stands on the curved Moon at sunrise. Earth hangs in the sky and the shadow stretches far.">
      <Defs />
      <Earth x={1010} y={170} r={30} />
      <Sun x={96} y={488} r={20} glow={4} />
      <path d="M0 506Q600 410 1200 506V560H0z" fill="url(#g-ground)" />
      <path d="M0 506Q600 410 1200 506" fill="none" stroke="var(--cream)" strokeOpacity=".5" strokeWidth="2" />
      <g transform="translate(0 0)"><Craters items={[[250, 520, 60, 8], [520, 506, 90, 9], [980, 520, 70, 8], [700, 540, 40, 5], [1120, 538, 50, 6]]} /></g>
      <path d="M811 484L1060 494L1060 502L848 492z" fill="var(--ink)" opacity=".55" />
      <Lander x={830} y={484} s={1.5} />
      <g fill="var(--ink)" opacity=".6"><ellipse cx="640" cy="492" rx="14" ry="5" /><ellipse cx="610" cy="494" rx="7" ry="3" /><ellipse cx="934" cy="498" rx="10" ry="3.6" /></g>
    </svg>
  );
}

/* ---------------------------------------------------------------- scene 1 mini cards */
export function MiniArt({ kind }) {
  return (
    <svg viewBox="0 0 200 110" className="art-mini" aria-hidden="true" focusable="false">
      <Defs />
      <rect width="200" height="110" fill="url(#g-sky)" />
      {kind === 'flat' && (
        <g>
          <Stars w={200} h={60} n={14} seed={4} />
          <path d="M0 78h200v32H0z" fill="url(#g-ground)" />
          <path d="M0 78h200" stroke="var(--cream)" strokeOpacity=".6" strokeWidth="1.5" />
          <Lander x={100} y={78} s={.62} />
          <g transform="translate(150 30)"><rect x="-26" y="-7" width="52" height="14" rx="7" fill="var(--ink)" stroke="var(--cream)" strokeWidth="1.5" /><circle cx="0" cy="0" r="4.4" fill="var(--cream)" /><path d="M-8 -7v14M8 -7v14" stroke="var(--lav)" strokeWidth="1" /></g>
          <text x="150" y="53" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--cream)">&lt; 2°</text>
        </g>
      )}
      {kind === 'approach' && (
        <g>
          <Stars w={200} h={70} n={14} seed={9} />
          <path d="M0 84h200v26H0z" fill="url(#g-ground)" />
          <path d="M0 84L34 60 56 84z" fill="var(--plum)" stroke="var(--lav)" strokeWidth="1" />
          <path d="M140 84V52l18-3 26 4v31z" fill="var(--plum)" stroke="var(--lav)" strokeWidth="1" />
          <path d="M20 8Q92 18 104 80" fill="none" stroke="var(--cream)" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" />
          <path d="M99 70l5 11 6-10" fill="none" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <g stroke="var(--cream)" strokeWidth="2" strokeLinecap="round"><path d="M31 42l8 8M39 42l-8 8" /><path d="M151 33l8 8M159 33l-8 8" /></g>
        </g>
      )}
      {kind === 'light' && (
        <g>
          <Stars w={200} h={40} n={10} seed={2} />
          <Sun x={26} y={72} r={9} />
          <path d="M0 80h200v30H0z" fill="url(#g-ground)" />
          <path d="M0 80h200" stroke="var(--cream)" strokeOpacity=".6" strokeWidth="1.5" />
          <path d="M104 80L196 84v4l-84-4z" fill="var(--ink)" opacity=".6" />
          <Lander x={104} y={80} s={.62} />
          <path d="M44 72Q58 70 62 80" fill="none" stroke="var(--cream)" strokeWidth="1.4" />
          <text x="84" y="26" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--cream)">7°–20°</text>
        </g>
      )}
    </svg>
  );
}

/* ---------------------------------------------------------------- the pole */
export function PoleArt() {
  return (
    <svg viewBox="0 0 560 320" className="art-chapter" role="img" aria-label="Near the Moon's pole the Sun sits on the horizon, mountains throw long shadows, and a deep crater stays dark with ice crystals sparkling inside.">
      <Defs />
      <rect width="560" height="320" fill="url(#g-sky)" />
      <Stars w={560} h={170} n={70} seed={12} />
      <Sun x={40} y={226} r={18} glow={4} />
      <Earth x={470} y={70} r={20} />
      <path d="M0 236L70 222 120 190 170 226 250 236 330 232 390 200 440 160 490 214 560 226V320H0z" fill="url(#g-ground)" />
      <path d="M0 236L70 222 120 190 170 226 250 236 330 232 390 200 440 160 490 214 560 226" fill="none" stroke="var(--cream)" strokeOpacity=".55" strokeWidth="1.6" />
      <path d="M120 190L560 262V320H170z" fill="var(--ink)" opacity=".5" />
      <path d="M440 160L560 238V320H490z" fill="var(--ink)" opacity=".45" />
      <ellipse cx="290" cy="262" rx="86" ry="14" fill="var(--ink)" />
      <g fill="var(--cream)">{[[260, 262, 3.4], [300, 258, 2.6], [326, 266, 3], [280, 270, 2]].map(([x, y, r], i) => (<path key={i} d={`M${x} ${y - r * 2}L${x + r * .5} ${y - r * .5} ${x + r * 2} ${y} ${x + r * .5} ${y + r * .5} ${x} ${y + r * 2} ${x - r * .5} ${y + r * .5} ${x - r * 2} ${y} ${x - r * .5} ${y - r * .5}z`} />))}</g>
      <Lander x={150} y={252} s={.8} />
    </svg>
  );
}

/* ---------------------------------------------------------------- chapters */
export function ChapterArt({ aspect }) {
  const label = {
    sunlight: 'A lander lies on its side on the floor of a crater. A low Sun and the crater wall put it in shadow.',
    night: 'A lander sits under a starry black sky next to a thermometer reading far below freezing.',
    comms: 'A lander on the left tries to send a radio signal to Earth, but a mountain blocks the straight line.',
    terrain: 'A lander on a steep slope beside boulders is starting to tip over.',
    science: 'A rover waits at the rim of a deep, dark crater that sparkles with ice crystals.',
  }[aspect];
  return (
    <svg viewBox="0 0 480 300" className="art-chapter" role="img" aria-label={label}>
      <Defs />
      <rect width="480" height="300" fill="url(#g-sky)" />
      <Stars w={480} h={190} n={aspect === 'night' ? 120 : 50} seed={aspect.length * 7} />
      {aspect === 'sunlight' && (
        <g>
          <Sun x={46} y={206} r={16} glow={4} />
          <path d="M0 218L90 204 124 186 176 246 330 252 388 206 430 196 480 212V300H0z" fill="url(#g-ground)" />
          <path d="M0 218L90 204 124 186" fill="none" stroke="var(--cream)" strokeOpacity=".6" strokeWidth="1.6" />
          <path d="M124 186L480 258V300H176z" fill="var(--ink)" opacity=".62" />
          <Lander x={268} y={252} s={.9} tilt={78} shade={.0} />
          <path d="M60 150q70 0 124 60" fill="none" stroke="var(--cream)" strokeWidth="1.6" strokeDasharray="2 6" strokeLinecap="round" opacity=".7" />
        </g>
      )}
      {aspect === 'night' && (
        <g>
          <Earth x={78} y={64} r={16} />
          <path d="M0 238Q240 214 480 238V300H0z" fill="url(#g-ground)" />
          <Lander x={210} y={238} s={1} />
          <g fill="none" stroke="var(--cream)" strokeWidth="1.6" strokeLinecap="round" opacity=".8">
            {[[150, 190], [270, 196], [190, 150], [244, 168]].map(([x, y], i) => (<g key={i}><path d={`M${x} ${y - 6}v12M${x - 5} ${y - 3}l10 6M${x + 5} ${y - 3}l-10 6`} /></g>))}
          </g>
          <g transform="translate(386 70)">
            <rect x="-9" y="0" width="18" height="140" rx="9" fill="var(--ink)" stroke="var(--cream)" strokeWidth="2" />
            <circle cx="0" cy="152" r="17" fill="var(--ink)" stroke="var(--cream)" strokeWidth="2" />
            <rect x="-4" y="112" width="8" height="40" rx="4" fill="var(--indigo)" /><circle cx="0" cy="152" r="11" fill="var(--indigo)" />
            {[20, 50, 80, 110].map((y) => (<path key={y} d={`M14 ${y}h12`} stroke="var(--lav)" strokeWidth="2" />))}
            <text x="32" y="118" fontFamily="var(--font-mono)" fontSize="13" fill="var(--cream)">−238 °C</text>
          </g>
        </g>
      )}
      {aspect === 'comms' && (
        <g>
          <Earth x={398} y={62} r={24} />
          <path d="M0 240L120 232 200 222 270 120 340 222 480 238V300H0z" fill="url(#g-ground)" />
          <path d="M200 222L270 120 340 222" fill="none" stroke="var(--cream)" strokeOpacity=".5" strokeWidth="1.6" />
          <Lander x={92} y={236} s={.9} />
          <path d="M92 184Q220 120 262 128" fill="none" stroke="var(--cream)" strokeWidth="2.2" strokeDasharray="3 7" strokeLinecap="round" />
          <path d="M290 124Q350 100 380 78" fill="none" stroke="var(--lav)" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" opacity=".5" />
          <g transform="translate(276 118)" stroke="var(--cream)" strokeWidth="3" strokeLinecap="round"><circle r="13" fill="var(--ink)" /><path d="M-5 -5l10 10M5 -5l-10 10" /></g>
        </g>
      )}
      {aspect === 'terrain' && (
        <g>
          <path d="M0 150L480 268V300H0z" fill="url(#g-ground)" />
          <path d="M0 150L480 268" stroke="var(--cream)" strokeOpacity=".55" strokeWidth="1.6" />
          <g fill="var(--plum)" stroke="var(--lav)" strokeWidth="1.2"><ellipse cx="360" cy="246" rx="22" ry="12" /><ellipse cx="406" cy="258" rx="12" ry="7" /><ellipse cx="76" cy="168" rx="14" ry="8" /></g>
          <Lander x={226} y={209} s={1} tilt={-4} />
          <path d="M226 209v-120" stroke="var(--cream)" strokeWidth="1.4" strokeDasharray="3 5" opacity=".6" />
          <path d="M226 209 L300 209" stroke="var(--cream)" strokeWidth="1.2" strokeDasharray="3 5" opacity=".6" />
          <path d="M270 209A44 44 0 0 1 266 228" fill="none" stroke="var(--cream)" strokeWidth="2" />
          <text x="286" y="203" fontFamily="var(--font-mono)" fontSize="13" fill="var(--cream)">slope</text>
          <path d="M168 120q-40 40-8 78" fill="none" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 7" />
          <path d="M163 188l-2 11 11-3" fill="none" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {aspect === 'science' && (
        <g>
          <Sun x={44} y={190} r={14} glow={4} />
          <path d="M0 200L110 190 170 176 230 250 360 254 400 200 440 188 480 200V300H0z" fill="url(#g-ground)" />
          <path d="M170 176L480 262V300H230z" fill="var(--ink)" opacity=".5" />
          <ellipse cx="300" cy="256" rx="76" ry="13" fill="var(--ink)" />
          <g fill="var(--cream)">{[[270, 256, 3.4], [304, 252, 2.6], [330, 260, 3], [286, 262, 2]].map(([x, y, r], i) => (<path key={i} d={`M${x} ${y - r * 2}L${x + r * .5} ${y - r * .5} ${x + r * 2} ${y} ${x + r * .5} ${y + r * .5} ${x} ${y + r * 2} ${x - r * .5} ${y + r * .5} ${x - r * 2} ${y} ${x - r * .5} ${y - r * .5}z`} />))}</g>
          <Rover x={140} y={196} s={1} />
          <path d="M160 214Q220 232 244 250" fill="none" stroke="var(--cream)" strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
