import { useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar.jsx';
import { castFor } from '../content/cast.js';
import { GAME_DOCTOR, GAME_MISSIONS, GAME_ROUNDS_V2, gameResult } from '../content/game.js';
import { useReducedMotion } from '../hooks.js';

const cast = castFor('student');
const METERS = ['Stability', 'Power', 'Heat', 'Signal', 'Science'];
const pick = (arr, i) => arr[i % arr.length];

/* ------------------------------------------------------------------ 2D scene */
// Ground profile per scene, as SVG path in a 800×300 box (ground below the line).
const GROUND = {
  flat: 'M0 230 C150 226 300 234 400 230 S650 226 800 232 V300 H0Z',
  boulders: 'M0 232 C120 220 220 240 330 228 S520 236 800 230 V300 H0Z',
  steep: 'M0 290 L260 250 L400 190 L560 130 L800 90 V300 H0Z',
  darkcrater: 'M0 160 C120 160 200 170 260 240 C320 290 480 290 540 240 C600 170 680 160 800 160 V300 H0Z',
  pit: 'M0 150 C120 150 200 165 260 245 C320 292 480 292 540 245 C600 165 680 150 800 150 V300 H0Z',
  icecrater: 'M0 160 C120 160 200 170 260 240 C320 290 480 290 540 240 C600 170 680 160 800 160 V300 H0Z',
  shadow: 'M0 240 C200 236 330 240 420 236 L520 100 L640 236 C700 240 760 238 800 240 V300 H0Z',
  hill: 'M0 240 C150 236 250 240 330 236 L470 110 L610 236 C700 240 760 238 800 240 V300 H0Z',
  ridge: 'M0 270 C150 260 280 190 400 160 S650 240 800 268 V300 H0Z',
  earthview: 'M0 270 C150 260 280 190 400 160 S650 240 800 268 V300 H0Z',
  heater: 'M0 232 C150 226 300 234 400 230 S650 226 800 232 V300 H0Z',
  ignore: 'M0 232 C150 226 300 234 400 230 S650 226 800 232 V300 H0Z',
  window: 'M0 232 C150 226 300 234 400 230 S650 226 800 232 V300 H0Z',
  rock: 'M0 232 C150 226 300 234 400 230 S650 226 800 232 V300 H0Z',
  nearice: 'M0 230 C200 226 330 232 470 230 C520 230 560 236 600 262 C650 292 760 292 800 262 V300 H0Z',
};
// Where the lander stands (x, ground y) for each scene.
const PAD = { flat: [400, 230], boulders: [300, 228], steep: [480, 160], darkcrater: [400, 288], pit: [400, 290], icecrater: [400, 288], shadow: [700, 238],
  hill: [700, 238], ridge: [400, 160], earthview: [400, 160], heater: [400, 230], ignore: [400, 230], window: [400, 230], rock: [300, 228], nearice: [420, 230] };
const NIGHT = new Set(['heater', 'ignore', 'window', 'darkcrater', 'pit', 'icecrater']);

function Ground({ scene }) {
  return (
    <g>
      <path d={GROUND[scene] ?? GROUND.flat} className="g-ground" />
      {scene === 'boulders' && [[260, 222, 16], [340, 220, 22], [300, 226, 10], [420, 224, 18], [210, 226, 9]].map(([x, y, r]) => (<circle key={x} cx={x} cy={y} r={r} className="g-rock" />))}
      {scene === 'rock' && <circle cx="250" cy="222" r="16" className="g-rock" />}
      {(scene === 'nearice' || scene === 'icecrater') && [[640, 282], [700, 286], [670, 278], [380, 280], [420, 284]].map(([x, y]) => (<path key={x} d={`M${x} ${y - 6}l3 6-3 6-3-6z`} className="g-ice" />))}
    </g>
  );
}

function Lander({ x, y, state, scene }) {
  const tip = state === 'fail-terrain';
  const dark = state === 'fail-sunlight';
  const frozen = state === 'fail-night';
  const lost = state === 'fail-comms';
  const nosci = state === 'fail-science';
  const ok = state === 'ok';
  return (
    <g className={`lander ${state}`} style={{ '--lx': `${x}px`, '--ly': `${y}px` }}>
      <g className="lander-body" transform={tip ? 'rotate(72 0 0)' : undefined}>
        <path d="M-26 0 L-34 -2 M26 0 L34 -2 M-18 -12 L-30 0 M18 -12 L30 0" className="l-leg" />
        <rect x="-22" y="-40" width="44" height="28" rx="6" className="l-body" />
        <rect x="-62" y="-36" width="34" height="14" rx="2" className={`l-panel ${dark ? 'off' : ''}`} />
        <rect x="28" y="-36" width="34" height="14" rx="2" className={`l-panel ${dark ? 'off' : ''}`} />
        <circle cx="0" cy="-26" r="6" className={`l-window ${dark || frozen ? 'off' : ''}`} />
        <path d="M10 -40 L18 -56" className="l-leg" /><circle cx="18" cy="-58" r="3" className="l-ant" />
        {!lost && <path d="M24 -62 q6 6 0 12 M30 -66 q10 10 0 20" className="l-wave" />}
        {lost && <path d="M26 -70 l12 12 M38 -70 l-12 12" className="l-x" />}
        {frozen && <rect x="-24" y="-42" width="48" height="32" rx="6" className="l-frost" />}
      </g>
      {nosci && <text x="0" y="-74" textAnchor="middle" className="l-q">?</text>}
      {ok && <g className="sparkles">{[[-40, -60], [40, -66], [0, -84]].map(([sx, sy]) => (<path key={sx} d={`M${sx} ${sy - 7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`} />))}</g>}
      {(state === 'hover' || state === 'descend') && <path d="M-8 4 L0 24 L8 4" className="l-flame" />}
    </g>
  );
}

function Scene({ scene, state, mini = false }) {
  const night = NIGHT.has(scene) && !mini;
  const [px, gy] = PAD[scene] ?? PAD.flat;
  const y = state === 'hover' ? 70 : gy;
  return (
    <svg viewBox="0 0 800 300" className={`g-scene ${mini ? 'mini' : ''} ${night ? 'night' : ''}`} role="img" aria-label={mini ? undefined : 'The landing scene'} aria-hidden={mini ? 'true' : undefined}>
      <rect width="800" height="300" className="g-sky" />
      {!mini && [[60, 40], [180, 80], [300, 30], [520, 60], [640, 24], [760, 90], [420, 100], [110, 120]].map(([sx, sy]) => (<circle key={sx} cx={sx} cy={sy} r="1.4" className="g-star" />))}
      {!night && <circle cx={scene === 'shadow' ? 760 : 70} cy={scene === 'ridge' ? 150 : 200} r="16" className="g-sun" />}
      <g className="g-earth"><circle cx={scene === 'hill' ? 760 : 680} cy={scene === 'hill' ? 224 : 60} r="14" /><path d={`M${(scene === 'hill' ? 760 : 680) - 8} ${(scene === 'hill' ? 224 : 60) - 4}q6 -6 12 0`} /></g>
      <Ground scene={scene} />
      {!mini && <Lander x={px} y={y} state={state} scene={scene} />}
    </svg>
  );
}

/* ------------------------------------------------------------------ game */
export default function Game({ onFinish, onHome }) {
  const reduced = useReducedMotion();
  const [mission, setMission] = useState(null);
  const [round, setRound] = useState(0);
  const [choice, setChoice] = useState(null);
  const [landed, setLanded] = useState(false);
  const [hint, setHint] = useState(false);
  const [meters, setMeters] = useState(() => Object.fromEntries(METERS.map((m) => [m, 100])));
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const R = GAME_ROUNDS_V2[round];
  const who = R && cast.members[R.aspect];
  const opt = choice != null ? R.options[choice] : null;

  const choose = (i) => {
    if (choice != null) return;
    const o = R.options[i];
    setChoice(i);
    setLanded(false);
    setTimeout(() => setLanded(true), reduced ? 0 : 1100);
    const good = o.kind === 'good';
    setMeters((m) => ({ ...m, [R.meter]: good ? 100 : o.kind === 'silly' ? 15 : 40 }));
    setScore((s) => s + (good ? (hint ? 60 : 100) : 0));
  };
  const next = () => {
    if (round === GAME_ROUNDS_V2.length - 1) { setOver(true); onFinish?.(); return; }
    setRound(round + 1); setChoice(null); setLanded(false); setHint(false);
  };
  const reset = () => { setMission(null); setRound(0); setChoice(null); setLanded(false); setHint(false); setScore(0); setOver(false); setMeters(Object.fromEntries(METERS.map((m) => [m, 100]))); };

  const state = choice == null ? 'hover' : !landed ? 'descend' : opt.kind === 'good' ? 'ok' : `fail-${R.aspect}`;
  const res = useMemo(() => gameResult(meters), [meters]);

  if (!mission) {
    return (
      <section aria-labelledby="g-pick">
        <div className="game-line wise intro"><Avatar id="leader" mood="happy" size={120} mode="student" /><div className="bubble"><div className="bubble-head"><strong>{cast.leader.name}</strong><span>{cast.leader.role}</span></div><p>{GAME_DOCTOR.intro}</p></div></div>
        <h3 className="title" id="g-pick">Pick your mission, Commander</h3>
        <ul className="g-missions">
          {GAME_MISSIONS.map((m) => (<li key={m.id}><button type="button" className="mode-card" onClick={() => setMission(m)}><span className="g-ico" aria-hidden="true">{m.icon}</span><strong>{m.name}</strong><span>{m.blurb}</span><span className="hc-go" aria-hidden="true">Launch →</span></button></li>))}
        </ul>
      </section>
    );
  }

  if (over) {
    return (
      <section className="game-over panel" aria-labelledby="g-end">
        <div className="g-final"><Scene scene={res.ok ? 'flat' : 'boulders'} state={res.ok ? 'ok' : 'fail-terrain'} /></div>
        <div>
          <p className="eyebrow">{mission.name} · final report</p>
          <h3 className="title" id="g-end">{res.title}</h3>
          <p className="score-big mono">{score}<small>/500</small></p>
          <p>{res.text}</p>
          <Meters meters={meters} />
          <blockquote className="doctor-quote"><strong>{cast.leader.name}:</strong> Choosing a landing site is about five things at once: ground, sunlight, heat, the link home and the science. Real teams check all five, every time.</blockquote>
          <div className="cta-row"><button type="button" className="btn btn-primary" onClick={reset}>Play again</button><button type="button" className="btn btn-ghost" onClick={onHome}>Back to the start</button></div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="g-round">
      <div className="game-top"><h3 className="title" id="g-round">{mission.name} · {round + 1}/5: {R.title}</h3><span className="score mono">Score {score}</span></div>
      <Meters meters={meters} active={R.meter} />
      <div className="g-stage">
        <Scene scene={opt ? opt.scene : 'flat'} state={state} />
        <div className="g-crew">
          <div className="g-say left"><Avatar id={R.aspect} mood={choice == null ? 'thinking' : opt.kind === 'good' ? 'worried' : 'happy'} size={120} mode="student" /><div className="bubble"><div className="bubble-head"><strong>{who.name}</strong><span>{who.role}</span></div><p>“{R.silly}”</p></div></div>
          {(hint || (choice != null && landed)) && (
            <div className="g-say right"><div className="bubble"><div className="bubble-head"><strong>{cast.leader.name}</strong><span>{cast.leader.role}</span></div>
              <p>{choice == null ? R.hint : opt.kind === 'good' ? `${pick(GAME_DOCTOR.good, round)} ${R.win}` : `${pick(GAME_DOCTOR.bad, round)} ${R.lose[opt.kind]}`}</p></div>
              <Avatar id="leader" mood={choice == null ? 'thinking' : opt.kind === 'good' ? 'happy' : 'thinking'} size={120} mode="student" /></div>
          )}
        </div>
      </div>
      <ul className="g-options" aria-label="Your options">
        {R.options.map((o, i) => (
          <li key={o.text}>
            <button type="button" disabled={choice != null} className={`g-opt ${choice === i ? (o.kind === 'good' ? 'right' : 'wrong') : ''} ${choice != null && o.kind === 'good' && choice !== i ? 'reveal' : ''}`} onClick={() => choose(i)}>
              <Scene scene={o.scene} state="hover" mini />
              <span>{o.text}{o.kind === 'silly' && <em className="g-tag">{who.name}’s idea</em>}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="cta-row">
        {choice == null && !hint && <button type="button" className="btn btn-ghost" onClick={() => setHint(true)}>Ask the Wise Doctor for a hint (−40 pts)</button>}
        {choice != null && landed && <button type="button" className="btn btn-primary" onClick={next}>{round === 4 ? 'Final report →' : 'Next decision →'}</button>}
      </div>
    </section>
  );
}

function Meters({ meters, active }) {
  return (
    <ul className="g-meters" aria-label="Mission gauges">
      {METERS.map((m) => (
        <li key={m} className={`${active === m ? 'on' : ''} ${meters[m] < 50 ? 'low' : ''}`}>
          <span>{m}</span><span className="g-bar"><i style={{ width: `${meters[m]}%` }} /></span><span className="mono">{meters[m]}%</span>
        </li>
      ))}
    </ul>
  );
}
