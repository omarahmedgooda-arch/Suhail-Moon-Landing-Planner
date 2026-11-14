import { useMemo, useRef, useState } from 'react';
import { HeroArt, MiniArt, PoleArt, ChapterArt, Lander, Defs } from './Art.jsx';
import { SuhailStar } from './Avatar.jsx';
import { Speech } from './Speech.jsx';
import { Reveal, Rich, SourceLink, StatusPill, Term } from './ui.jsx';
import { SCENES, CHAPTERS, CHAPTERS_INTRO, BAD_DAY, TO_ACT2, HERO } from '../content/story.js';
import { castFor } from '../content/cast.js';
const CHARACTERS = castFor('student').members;
import { windowMetrics } from '../engine/rules.js';
import { useInView, useReducedMotion } from '../hooks.js';

/* ============================================================ HERO */
function Hero({ onStart }) {
  return (
    <header className="hero" id="top">
      <div className="hero-art"><HeroArt /></div>
      <div className="hero-star"><SuhailStar size={112} label="Suhail, the guiding star" /><span className="hero-star-cap">Suhail · Canopus</span></div>
      <div className="wrap hero-in">
        <p className="eyebrow">SUHAIL · {HERO.eyebrow}</p>
        <h1 id="hero-title" className="display">{HERO.title}</h1>
        <p className="lead">{HERO.lead}</p>
        <div className="cta-row">
          <a className="btn btn-primary" href="#checklist">Start the story <span aria-hidden="true">↓</span></a>
          <button type="button" className="btn btn-ghost" onClick={onStart}>Plan a real mission</button>
        </div>
        <p className="meta">{HERO.meta}</p>
      </div>
    </header>
  );
}

/* ============================================================ SCENES */
function SceneHead({ scene }) {
  return (
    <>
      <p className="stamp"><span className="stamp-dot" aria-hidden="true" />{scene.stamp}</p>
      <h2 className="title" id={`${scene.id}-t`}>{scene.title}</h2>
      {scene.body.map((p, i) => (<p key={i} className="body"><Rich text={p} /></p>))}
    </>
  );
}

function ChecklistScene({ scene }) {
  return (
    <section className="scene" id={scene.id} aria-labelledby={`${scene.id}-t`}>
      <div className="wrap">
        <Reveal><SceneHead scene={scene} /></Reveal>
        <ul className="cards3">
          {scene.cards.map((c, i) => (
            <Reveal as="li" key={c.key} delay={i * 110} className="mini-card">
              <MiniArt kind={c.art} />
              <h3>{c.key}</h3>
              <p><Rich text={c.text} /></p>
            </Reveal>
          ))}
        </ul>
        <Reveal><p className="callout">{scene.callout}</p></Reveal>
        <Reveal><SourceLink source={scene.source} /></Reveal>
      </div>
    </section>
  );
}

/* ---------- interactive: help Eagle find a smooth patch ---------- */
const BOULDERS = [[86, 12], [132, 17], [178, 11], [232, 15], [286, 10], [330, 16]];
const CRATER = { x: 440, rx: 52 };
const LAND_Y = 214;

function EagleField() {
  const reduced = useReducedMotion();
  const [x, setX] = useState(150);
  const [phase, setPhase] = useState('aim'); // aim | falling | done
  const [result, setResult] = useState(null);
  const timer = useRef(null);

  function judge(px) {
    for (const [bx, br] of BOULDERS) if (Math.abs(px - bx) < br + 20) return 'boulder';
    if (Math.abs(px - CRATER.x) < CRATER.rx - 6) return 'crater';
    return 'safe';
  }
  function land() {
    if (phase !== 'aim') return;
    const r = judge(x);
    setPhase('falling');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setResult(r); setPhase('done'); }, reduced ? 0 : 1100);
  }
  function reset() { clearTimeout(timer.current); setPhase('aim'); setResult(null); setX(150); }

  const msg = {
    boulder: { status: 'nogo', head: 'Tipped over.', text: 'A footpad came down on a boulder. This is exactly what Thabit worries about.' },
    crater: { status: 'nogo', head: 'Slid into the crater.', text: 'The ground tilts steeply at a crater wall, and a lander is tall and narrow.' },
    safe: { status: 'go', head: 'Safe landing!', text: 'You did what Armstrong did: flew past the boulders and found a smooth patch.' },
  };
  const y = phase === 'aim' ? 70 : LAND_Y;
  return (
    <div className="game" role="group" aria-labelledby="eagle-game-t">
      <h3 id="eagle-game-t" className="game-title">Your turn to fly Eagle</h3>
      <p className="game-help">The computer is steering you onto the boulders on the left. Slide the lander sideways to find a safe spot, then touch down.</p>
      <svg viewBox="0 0 640 260" className="game-svg" role="img" aria-label="Side view of the landing area. Boulders on the left, a crater on the right, and a smooth patch between them and at the far right.">
        <Defs />
        <rect width="640" height="260" fill="url(#g-sky)" />
        <path d="M0 214H640V260H0z" fill="url(#g-ground)" />
        <path d="M0 214H640" stroke="var(--cream)" strokeOpacity=".55" strokeWidth="1.6" />
        <path d="M388 214Q440 262 492 214" fill="var(--ink)" stroke="var(--lav)" strokeWidth="1.4" />
        <g>{BOULDERS.map(([bx, br]) => (<g key={bx}><ellipse cx={bx} cy={214 - br * 0.55} rx={br} ry={br * 0.8} fill="var(--plum)" stroke="var(--lav)" strokeWidth="1.4" /><path d={`M${bx - br * .6} ${214 - br * .9}q${br * .5}-${br * .3} ${br * .9} 0`} stroke="var(--cream)" strokeOpacity=".4" fill="none" strokeWidth="1.2" /></g>))}</g>
        <g aria-hidden="true"><path d="M128 20v22" stroke="var(--lav)" strokeWidth="1.6" strokeDasharray="3 4" /><text x="128" y="14" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--cream)">computer’s target</text></g>
        <path d={`M${x} 120V${LAND_Y - 4}`} stroke="var(--cream)" strokeOpacity={phase === 'aim' ? .5 : 0} strokeWidth="1.6" strokeDasharray="2 6" />
        <g style={{ transform: `translate(${x}px, ${y}px)`, transition: reduced ? 'none' : phase === 'falling' ? 'transform 1.05s cubic-bezier(.5,0,.8,.6)' : 'transform .15s linear' }}>
          <Lander s={.95} tilt={result && result !== 'safe' ? (result === 'boulder' ? 38 : -34) : 0} />
        </g>
        {result === 'safe' && <g fill="var(--cream)">{[[x - 40, 190], [x + 44, 184], [x + 6, 176]].map(([sx, sy], i) => (<path key={i} d={`M${sx} ${sy - 6}l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z`} />))}</g>}
      </svg>
      <div className="game-controls">
        <label className="range-label" htmlFor="steer">Steer left ↔ right</label>
        <input id="steer" type="range" min="40" max="600" step="2" value={x} disabled={phase !== 'aim'} onChange={(e) => setX(+e.target.value)} />
        {phase === 'done' ? <button type="button" className="btn btn-ghost" onClick={reset}>Try again</button> : <button type="button" className="btn btn-primary" onClick={land} disabled={phase !== 'aim'}>Touch down</button>}
      </div>
      <div className="game-result" role="status" aria-live="polite">
        {result && (<><StatusPill status={msg[result].status} label={msg[result].head} /><p>{msg[result].text}</p></>)}
      </div>
    </div>
  );
}

function EagleScene({ scene }) {
  return (
    <section className="scene alt" id={scene.id} aria-labelledby={`${scene.id}-t`}>
      <div className="wrap split">
        <Reveal><SceneHead scene={scene} /><SourceLink source={scene.source} /></Reveal>
        <Reveal delay={120}><EagleField /></Reveal>
      </div>
    </section>
  );
}

function PoleScene({ scene }) {
  return (
    <section className="scene" id={scene.id} aria-labelledby={`${scene.id}-t`}>
      <div className="wrap split">
        <Reveal><SceneHead scene={scene} /><SourceLink source={scene.source} /></Reveal>
        <Reveal delay={120}><figure className="figure"><PoleArt /><figcaption>Illustration: low Sun, long shadows, and a crater floor that never sees daylight.</figcaption></figure></Reveal>
      </div>
    </section>
  );
}

/* ============================================================ CHAPTERS */
function Chapter({ c, i }) {
  const ch = CHARACTERS[c.aspect];
  const [ref, inView] = useInView({ rootMargin: '0px 0px -25% 0px', threshold: 0.2 });
  return (
    <article className={`chapter ${i % 2 ? 'flip' : ''}`} ref={ref} aria-labelledby={`ch-${c.aspect}`}>
      <div className="chapter-art"><ChapterArt aspect={c.aspect} /></div>
      <div className="chapter-copy">
        <p className="stamp"><span className="stamp-dot" aria-hidden="true" />Chapter {i + 1} · {c.heading}</p>
        <h3 id={`ch-${c.aspect}`} className="sr-only">{c.heading}: {ch.name}</h3>
        <Speech id={c.aspect} mood="worried" name={ch.name} role={ch.role} text={c.speech} active={inView} />
        <div className="case">
          <p className="case-k">A real case</p>
          <h4>{c.caseTitle}</h4>
          <p>{c.caseBody}</p>
          <SourceLink source={ch.learn.real.source} />
        </div>
      </div>
    </article>
  );
}

function Chapters() {
  return (
    <section className="scene chapters" id="chapters" aria-labelledby="chapters-t">
      <div className="wrap">
        <Reveal><h2 className="title" id="chapters-t">{CHAPTERS_INTRO.title}</h2><p className="body">{CHAPTERS_INTRO.body}</p></Reveal>
        <div className="chapter-list">
          {CHAPTERS.map((c, i) => (<Reveal key={c.aspect}><Chapter c={c} i={i} /></Reveal>))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ GOOD SITE, BAD DAY */
const DEMO_DAYS = 7;
const COL = 15, ROW = 5, LEFT = 44, TOP = 26, GH = 24 * ROW, GAP = 52;

function runsForDay(series, d) {
  const out = []; let start = -1;
  for (let h = 0; h <= 24; h++) {
    const up = h < 24 && series[d * 24 + h];
    if (up && start < 0) start = h;
    if (!up && start >= 0) { out.push([start, h]); start = -1; }
  }
  return out;
}

function Grid({ series, y0, label, fill }) {
  const days = series ? Math.floor(series.length / 24) : 30;
  return (
    <g transform={`translate(0 ${y0})`}>
      <text x={LEFT} y={-9} fontFamily="var(--font-mono)" fontSize="11" fill="var(--cream)">{label}</text>
      <rect x={LEFT} y={0} width={days * COL} height={GH} fill="url(#hatch)" stroke="var(--line-strong)" />
      {series && Array.from({ length: days }, (_, d) => runsForDay(series, d).map(([a, b], k) => (<rect key={`${d}-${k}`} x={LEFT + d * COL + 1} y={a * ROW} width={COL - 2} height={(b - a) * ROW} fill={fill} />)))}
      {!series && <text x={LEFT + (days * COL) / 2} y={GH / 2 + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill="var(--cream)">no Earth data for this site yet</text>}
      {[0, 6, 12, 18].map((h) => (<text key={h} x={LEFT - 6} y={h * ROW + 8} textAnchor="end" fontFamily="var(--font-mono)" fontSize="9" fill="var(--text-muted)">{String(h).padStart(2, '0')}h</text>))}
    </g>
  );
}

function LightCalendar({ data }) {
  const sites = data.sites;
  const [siteId, setSiteId] = useState(sites[0].id);
  const [dayState, setDayState] = useState(null);
  const site = sites.find((s) => s.id === siteId);
  const lastDay = Math.floor(data.window.hours / 24) - DEMO_DAYS;

  // quality of every start day for this site (simple demo rule: Sun ≥ 50 % and Earth ≥ 40 %)
  const quality = useMemo(() => Array.from({ length: lastDay + 1 }, (_, d) => {
    const w = windowMetrics(site, d * 24, DEMO_DAYS * 24);
    const earth = w.earthPct ?? 100;
    return { d, ok: w.sunPct >= 50 && earth >= 40, score: Math.min(w.sunPct, earth) };
  }), [site, lastDay]);
  const best = quality.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = quality.reduce((a, b) => (b.score < a.score ? b : a));
  const day = Math.min(dayState ?? worst.d, lastDay);
  const setDay = setDayState;
  const m = windowMetrics(site, day * 24, DEMO_DAYS * 24);
  const ok = quality[day].ok;
  const why = [];
  if (m.sunPct < 50) why.push(`the Sun is up only ${m.sunPct}% of the week`);
  if (m.earthPct != null && m.earthPct < 40) why.push(`Earth is visible only ${m.earthPct}% of the week`);
  if (m.earthPct == null) why.push('we have no Earth data for this site');

  return (
    <div className="lightcal">
      <div className="pills" role="group" aria-label="Choose a landing site">
        {sites.map((s) => (<button key={s.id} type="button" className={`chip ${s.id === siteId ? 'on' : ''}`} aria-pressed={s.id === siteId} onClick={() => setSiteId(s.id)}>{s.name}</button>))}
      </div>
      <div className="cal-scroll">
        <svg viewBox={`0 0 ${LEFT + 30 * COL + 8} ${TOP + GH + GAP + GH + 34}`} className="cal-svg" role="img" aria-label={`Calendar of the next 30 days at ${site.name}. Filled cells mean the Sun or Earth is above the horizon at that hour.`}
          onPointerDown={(e) => { const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * (LEFT + 30 * COL + 8); const d = Math.floor((px - LEFT) / COL); if (d >= 0 && d < 30) setDay(Math.max(0, Math.min(lastDay, d))); }}>
          <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--ink)" /><path d="M0 0v6" stroke="var(--lav)" strokeOpacity=".35" strokeWidth="1.2" /></pattern></defs>
          <g transform={`translate(0 ${TOP})`}>
            <Grid series={site.vis.sun} y0={0} label="SUN above the horizon" fill="var(--cream)" />
            <Grid series={site.vis.earth} y0={GH + GAP - 14} label="EARTH above the horizon" fill="color-mix(in srgb, var(--lav) 55%, var(--cream))" />
            {[0, GH + GAP - 14].map((yy) => (<rect key={yy} x={LEFT + day * COL - 1} y={yy - 2} width={DEMO_DAYS * COL + 2} height={GH + 4} rx="4" fill="var(--cream)" fillOpacity=".1" stroke="var(--cream)" strokeWidth="2.4" />))}
            {[0, 5, 10, 15, 20, 25, 29].map((d) => (<text key={d} x={LEFT + d * COL + COL / 2} y={GH * 2 + GAP + 6} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-muted)">{d + 1}</text>))}
            <text x={LEFT} y={GH * 2 + GAP + 22} fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-muted)">day of this 30-day slice of the real data · hatched = down</text>
          </g>
        </svg>
      </div>
      <div className="cal-controls">
        <label className="range-label split" htmlFor="landday"><span>Landing day: <strong>Day {day + 1}</strong></span><span className="muted">mission lasts {DEMO_DAYS} days</span></label>
        <input id="landday" type="range" min="0" max={lastDay} value={day} onChange={(e) => setDay(+e.target.value)} />
        <div className="cal-quick">
          <button type="button" className="chip" onClick={() => setDay(best.d)}>Jump to the best day</button>
          <button type="button" className="chip" onClick={() => setDay(worst.d)}>Jump to the worst day</button>
        </div>
      </div>
      <div className="cal-stats" role="status" aria-live="polite">
        <StatusPill status={ok ? 'go' : 'nogo'} label={ok ? 'A good day' : 'A bad day'} />
        <ul className="stat-list">
          <li><span className="stat-k">Sun up</span><span className="stat-v">{m.sunPct}%</span></li>
          <li><span className="stat-k">Longest dark</span><span className="stat-v">{m.maxDarkH} h</span></li>
          <li><span className="stat-k">Earth visible</span><span className="stat-v">{m.earthPct == null ? '?' : `${m.earthPct}%`}</span></li>
        </ul>
        <p className="cal-why">{ok ? `Same place, good timing: the Sun and Earth are both up for most of the week.` : `Same place, bad timing: ${why.join(', and ')}.`}</p>
      </div>
    </div>
  );
}

function BadDay({ data }) {
  return (
    <section className="scene alt" id="badday" aria-labelledby="badday-t">
      <div className="wrap">
        <Reveal>
          <p className="stamp"><span className="stamp-dot" aria-hidden="true" />{BAD_DAY.stamp}</p>
          <h2 className="title" id="badday-t">{BAD_DAY.title}</h2>
          <p className="body">{BAD_DAY.body}</p>
        </Reveal>
        <Reveal delay={100}><LightCalendar data={data} /></Reveal>
        <Reveal><p className="callout">That is why SUHAIL doesn’t only choose <em>where</em>. It chooses <em>where and when</em>. <Term k="horizon">Terrain</Term> shapes the answer, but so does the calendar.</p></Reveal>
      </div>
    </section>
  );
}

function ToAct2() {
  return (
    <section className="scene bridge" aria-labelledby="bridge-t">
      <div className="wrap center">
        <Reveal>
          <SuhailStar size={84} />
          <h2 className="title" id="bridge-t">{TO_ACT2.title}</h2>
          <p className="body">{TO_ACT2.body}</p>
          <a className="btn btn-primary" href="#method">Show me the recipe <span aria-hidden="true">↓</span></a>
        </Reveal>
      </div>
    </section>
  );
}

export default function Act1({ data, onStart }) {
  const [checklist, eagle, pole] = SCENES;
  return (
    <div id="story">
      <Hero onStart={onStart} />
      <ChecklistScene scene={checklist} />
      <EagleScene scene={eagle} />
      <PoleScene scene={pole} />
      <Chapters />
      <BadDay data={data} />
      <ToAct2 />
    </div>
  );
}
