import { useMemo, useState } from 'react';
import { Avatar } from './Avatar.jsx';
import { Reveal, Rich, StatusIcon, StatusPill, Term, STATUS_WORD } from './ui.jsx';
import { MISSIONS, LEVEL_WORDS, ASPECT_LABEL } from '../content/missions.js';
import { ORDER } from '../content/characters.js';
import { castFor } from '../content/cast.js';
const CHARACTERS = castFor('student').members;
import { MOOD } from '../engine/dialogue.js';
import { LIMITS, LEVELS, bestPlan, compareEvals } from '../engine/rules.js';

const STAGES = [
  { n: 1, short: 'Measure', title: 'Measure everything', text: 'For every site and every possible landing day, SUHAIL measures a handful of numbers from the Sun, Earth and terrain data. To keep the table short, each site is shown on **its best day**.' },
  { n: 2, short: 'Dealbreakers', title: 'Rule out the dealbreakers', text: 'Your mission sets a limit for each aspect. Break one and the site is **out**, however good it looks elsewhere. Click the levels and watch sites drop out. Missing data? {{unknown|Unknown is not a pass}}.' },
  { n: 3, short: 'Score', title: 'Score the survivors', text: 'Each survivor gets a {{score|score from 0 to 100}} per aspect. Aspects you care about more count more. Change the importance and watch the ranking move.' },
  { n: 4, short: 'Weakest link', title: 'Break ties by the weakest link', text: 'If two sites score the same, SUHAIL picks the one whose **worst aspect is better**. A site that is brilliant at four things and barely passes the fifth is a gamble.' },
];

export const limitText = (a, m) => {
  const lv = m.levels[a];
  if (lv === 'off') return 'switched off';
  switch (a) {
    case 'sunlight': return `Sun up ≥ ${LIMITS.sunPct[lv]}% of the mission`;
    case 'night': return `dark gap ≤ ${m.batteryH} h (battery)`;
    case 'comms': return `Earth ≥ ${LIMITS.earthPct[lv]}% and no gap over ${LIMITS.earthGapH[lv]} h`;
    case 'terrain': return `slope ≤ ${LIMITS.slopeDeg[lv]}°`;
    default: return `≤ ${LIMITS.psrKm[lv]} km to a shadowed crater`;
  }
};

const cellValue = (a, ev) => {
  const g = (k) => ev.metrics[k];
  switch (a) {
    case 'sunlight': return `${g('sunPct')}%`;
    case 'night': return `${g('maxDarkH')} h`;
    case 'comms': return g('earthPct') == null ? 'no data' : `${g('earthPct')}%\ngap ${g('earthGapH')} h`;
    case 'terrain': return `${g('slopeDeg')}°`;
    default: return `${g('psrKm')} km`;
  }
};

export function LevelControl({ aspect, value, onChange }) {
  const ch = CHARACTERS[aspect];
  return (
    <fieldset className="ctrl">
      <legend><Avatar id={aspect} mood="happy" size={34} /> <span><strong>{ASPECT_LABEL[aspect]}</strong><small>{ch.name}</small></span></legend>
      <div className="seg" role="radiogroup" aria-label={`${ASPECT_LABEL[aspect]} importance`}>
        {LEVELS.map((lv) => (
          <button key={lv} type="button" role="radio" aria-checked={value === lv} className={value === lv ? 'on' : ''} onClick={() => onChange(lv)} title={LEVEL_WORDS[lv].plain}>{LEVEL_WORDS[lv].label}</button>
        ))}
      </div>
    </fieldset>
  );
}

function reasonText(ev) {
  const bad = ORDER.filter((a) => ['nogo', 'unknown'].includes(ev.aspects[a].status));
  return bad.map((a) => `${ASPECT_LABEL[a]} ${ev.aspects[a].status === 'unknown' ? 'is unverified' : 'fails'}`).join(' · ');
}

function Bench({ rows, stage, mission }) {
  return (
    <div className="table-scroll">
      <table className="bench">
        <caption className="sr-only">Candidate sites on their best landing day</caption>
        <thead>
          <tr>
            <th scope="col">Site</th><th scope="col">Best day</th>
            {ORDER.map((a) => (<th scope="col" key={a}>{ASPECT_LABEL[a]}{mission.levels[a] === 'off' && <small>off</small>}</th>))}
            {stage >= 2 && <th scope="col">Result</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((ev) => (
            <tr key={ev.siteId} className={stage >= 2 ? (ev.eligible ? 'is-in' : 'is-out') : ''}>
              <th scope="row">{ev.siteName}</th>
              <td className="mono">Day {ev.day + 1}</td>
              {ORDER.map((a) => {
                const as = ev.aspects[a];
                return (
                  <td key={a} className={`cell ${stage >= 2 ? `s-${as.status}` : ''}`}>
                    {stage >= 2 && <StatusIcon status={as.status} size={18} />}
                    <span className="mono">{as.status === 'off' ? '—' : cellValue(a, ev)}</span>
                    {stage >= 2 && <span className="sr-only"> {STATUS_WORD[as.status]}</span>}
                  </td>
                );
              })}
              {stage >= 2 && (
                <td className="result">
                  {ev.eligible ? <StatusPill status="go" label="Still in" /> : <><StatusPill status="nogo" label="OUT" /><small>{reasonText(ev)}</small></>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeightControl({ aspect, mission, value, onChange }) {
  const ch = CHARACTERS[aspect];
  const lv = mission.levels[aspect];
  return (
    <fieldset className="ctrl compact">
      <legend><Avatar id={aspect} mood="happy" size={30} /> <span><strong>{ASPECT_LABEL[aspect]}</strong><small>{lv === 'off' ? 'switched off' : `${ch.name} · weight ${value}`}</small></span></legend>
      <div className="seg" role="radiogroup" aria-label={`${ASPECT_LABEL[aspect]} weight`}>
        {[1, 2, 3].map((w) => (
          <button key={w} type="button" role="radio" disabled={lv === 'off'} aria-checked={value === w} className={value === w ? 'on' : ''} onClick={() => onChange(w)}>{['Low', 'Med', 'High'][w - 1]}</button>
        ))}
      </div>
    </fieldset>
  );
}

const ROW_H = 92;
function RankList({ rows }) {
  const sorted = [...rows].sort((a, b) => compareEvals(a, b));
  const inn = sorted.filter((e) => e.eligible);
  const out = sorted.filter((e) => !e.eligible);
  const all = [...inn, ...out];
  return (
    <div className="rank" style={{ height: all.length * ROW_H }}>
      {rows.map((ev) => {
        const idx = all.indexOf(ev);
        const first = idx === 0 && ev.eligible;
        return (
          <div key={ev.siteId} className={`rank-row ${ev.eligible ? '' : 'is-out'} ${first ? 'is-first' : ''}`} style={{ transform: `translateY(${idx * ROW_H}px)`, height: ROW_H - 10 }}>
            <div className="rank-pos" aria-hidden="true">{ev.eligible ? idx + 1 : '✕'}</div>
            <div className="rank-main">
              <div className="rank-top"><strong>{ev.siteName}</strong><span className="mono">Day {ev.day + 1}</span>{first && <span className="crown">Top pick</span>}{!ev.eligible && <span className="out-tag">OUT · {reasonText(ev)}</span>}</div>
              <div className="rank-bar" role="img" aria-label={ev.eligible ? `Overall score ${Math.round(ev.overall)} out of 100` : 'Eliminated'}>
                <i style={{ width: `${ev.eligible ? ev.overall : 0}%` }} />
                <b className="mono">{ev.eligible ? Math.round(ev.overall) : ''}</b>
              </div>
              <ul className="mini-scores">
                {ORDER.map((a) => {
                  const as = ev.aspects[a];
                  return (<li key={a} title={`${ASPECT_LABEL[a]}: ${as.score == null ? 'off' : Math.round(as.score)}`}><span>{ASPECT_LABEL[a].split(' ')[0]}</span><span className="mono">{as.score == null ? '—' : Math.round(as.score)}</span></li>);
                })}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Stage 4 toy: two sites with an equal average ---------- */
function WeakestLink() {
  const [w, setW] = useState(50);
  const [useMaximin, setUseMaximin] = useState(true);
  const sam = [90, 90, 90, 90, 90];
  const sue = [100, 100, 100, 100, w];
  const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const aS = avg(sam), aU = avg(sue);
  let winner;
  if (Math.abs(aS - aU) > 0.5) winner = aS > aU ? 'Sam' : 'Sue';
  else winner = useMaximin ? (Math.min(...sam) >= Math.min(...sue) ? 'Sam' : 'Sue') : 'Sue';
  const tie = Math.abs(aS - aU) <= 0.5;
  const names = ['Sun', 'Night', 'Radio', 'Ground', 'Science'];
  const Card = ({ who, vals, sub }) => (
    <div className={`toy-card ${winner === who ? 'win' : ''}`}>
      <h4>{who === 'Sam' ? 'Steady Sam' : 'Spiky Sue'}{winner === who && <span className="crown">Picked</span>}</h4>
      <p>{sub}</p>
      <ul>
        {vals.map((v, i) => (<li key={i}><span>{names[i]}</span><span className="bar"><i style={{ width: `${v}%` }} /></span><b className="mono">{v}</b></li>))}
      </ul>
      <p className="avg">Average <b className="mono">{Math.round(avg(vals) * 10) / 10}</b> · weakest <b className="mono">{Math.min(...vals)}</b></p>
    </div>
  );
  return (
    <div className="toy">
      <div className="toy-grid">
        <Card who="Sam" vals={sam} sub="Good at everything. No weak spot." />
        <Card who="Sue" vals={sue} sub="Brilliant at four things, barely passes the fifth." />
      </div>
      <div className="toy-controls">
        <label className="range-label" htmlFor="sue-w">Sue’s weakest aspect: <strong className="mono">{w}</strong> (50 = exactly at the limit)</label>
        <input id="sue-w" type="range" min="50" max="80" value={w} onChange={(e) => setW(+e.target.value)} />
        <label className="check"><input type="checkbox" checked={useMaximin} onChange={(e) => setUseMaximin(e.target.checked)} /> Break ties with the <Term k="maximin">weakest link</Term> rule</label>
      </div>
      <p className="toy-note" role="status" aria-live="polite">
        {tie ? (useMaximin ? 'The averages match, so SUHAIL looks at the weakest aspect: Sam’s worst is 90, Sue’s is just 50. Sam is the safer landing.' : 'The averages match and there is no tie-break, so it’s a coin flip. Would you fly on that?') : `Sue’s average is now clearly higher, so she wins on score. Slide back to 50 to see the tie-break.`}
      </p>
    </div>
  );
}

/* ---------- Act 2 ---------- */
export default function Act2({ data, onStart }) {
  const [presetId, setPresetId] = useState('science-rover');
  const base = MISSIONS.find((m) => m.id === presetId);
  const [levels, setLevels] = useState(base.levels);
  const [weights, setWeights] = useState({});
  const [stage, setStage] = useState(1);

  const mission = useMemo(() => ({ ...base, levels, weights: { ...(base.weights || {}), ...weights } }), [base, levels, weights]);
  const plan = useMemo(() => bestPlan(data, mission), [data, mission]);
  const rows = useMemo(() => data.sites.map((s) => plan.flex[s.id].bestEval), [data, plan]);
  const unknownSite = rows.find((r) => ORDER.some((a) => r.aspects[a].status === 'unknown'));
  const survivors = rows.filter((r) => r.eligible).length;

  const pickPreset = (id) => { const m = MISSIONS.find((x) => x.id === id); setPresetId(id); setLevels(m.levels); setWeights({}); };
  const setLevel = (a, lv) => { setLevels((l) => ({ ...l, [a]: lv })); setWeights((w) => { const n = { ...w }; delete n[a]; return n; }); };
  const weightOf = (a) => mission.weights?.[a] ?? ({ off: 0, low: 1, medium: 2, high: 3 })[levels[a]];

  const S = STAGES[stage - 1];
  return (
    <section className="scene method" id="method" aria-labelledby="method-t">
      <div className="wrap">
        <Reveal>
          <p className="stamp"><span className="stamp-dot" aria-hidden="true" />Act 2</p>
          <h2 className="title" id="method-t">The recipe, in four steps.</h2>
          <p className="body">Pick a kind of mission, then play with each step. The numbers below are a 30-day slice of the <Term k="realdata">real NASA-based data</Term>, run through the same rules the real tool uses.</p>
        </Reveal>

        <Reveal>
          <div className="pills" role="group" aria-label="Mission type">
            {MISSIONS.map((m) => (<button key={m.id} type="button" className={`chip ${m.id === presetId ? 'on' : ''}`} aria-pressed={m.id === presetId} onClick={() => pickPreset(m.id)}>{m.name}</button>))}
          </div>

          <ol className="stepper" aria-label="Recipe steps">
            {STAGES.map((s) => (
              <li key={s.n}><button type="button" className={`step ${stage === s.n ? 'on' : ''} ${stage > s.n ? 'done' : ''}`} aria-current={stage === s.n ? 'step' : undefined} onClick={() => setStage(s.n)}><span className="step-n">{s.n}</span><span className="step-t">{s.short}</span></button></li>
            ))}
          </ol>

          <div className="bench-grid">
            <aside className="bench-side" aria-label="Controls">
              <h3 className="side-title">{S.n}. {S.title}</h3>
              <p className="side-text"><Rich text={S.text} /></p>

              {stage === 2 && (
                <div className="ctrls">
                  {ORDER.map((a) => (<div key={a}><LevelControl aspect={a} value={levels[a]} onChange={(lv) => setLevel(a, lv)} /><p className="limit-line mono">{limitText(a, mission)}</p></div>))}
                  <p className="note">Limits are <Term k="dealbreaker">team assumptions</Term>, not NASA standards. You can edit them in the Expert form.</p>
                </div>
              )}
              {stage === 3 && (
                <div className="ctrls">
                  {ORDER.map((a) => (<WeightControl key={a} aspect={a} mission={mission} value={weightOf(a)} onChange={(w) => setWeights((x) => ({ ...x, [a]: w }))} />))}
                </div>
              )}
              {stage <= 2 && <p className="tally" role="status" aria-live="polite">{stage === 1 ? `${rows.length} candidate sites` : `${survivors} of ${rows.length} sites survive`}</p>}
              {stage === 2 && unknownSite && (<p className="callout small"><StatusIcon status="unknown" size={18} /> <strong>{unknownSite.siteName}</strong> has no Earth data. SUHAIL doesn’t guess. Try switching “Radio link” to <em>Off</em> and watch it come back in.</p>)}
            </aside>

            <div className="bench-main">
              {stage <= 2 && <Bench rows={rows} stage={stage} mission={mission} />}
              {stage === 3 && <RankList rows={rows} />}
              {stage === 4 && <WeakestLink />}
              {stage === 4 && (
                <p className="callout small">One more thing: SUHAIL runs this whole recipe for <strong>every landing day</strong>, then keeps the best site-and-day pair. It also reports how many days still work, which is how much <em>flexibility</em> the plan really has.</p>
              )}
            </div>
          </div>

          <div className="stage-nav">
            <button type="button" className="btn btn-ghost" disabled={stage === 1} onClick={() => setStage((s) => Math.max(1, s - 1))}>← Back</button>
            {stage < 4 ? <button type="button" className="btn btn-primary" onClick={() => setStage((s) => Math.min(4, s + 1))}>Next step →</button> : <button type="button" className="btn btn-primary" onClick={onStart}>Plan a real mission →</button>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
