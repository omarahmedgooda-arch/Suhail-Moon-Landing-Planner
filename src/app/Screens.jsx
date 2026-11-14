import { useState } from 'react';
import { PoleMap } from '../components/MapViews.jsx';
import { videoUrl } from '../components/RegionMedia.jsx';
import { useReducedMotion } from '../hooks.js';
import { Speech } from '../components/Speech.jsx';
import { SuhailStar } from '../components/Avatar.jsx';
import { StatusPill, Term } from '../components/ui.jsx';
import { GUIDE } from '../content/characters.js';
import { DATA_RESOURCES, STORY_RESOURCES, TEAM } from '../content/about.js';
import { VERDICT } from '../engine/rules.js';
import { requirementRows } from '../engine/report.js';
import { dayToIso, fmtDay, isoToDay, planMission, windowDays } from '../engine/plan.js';
import { DataWindowNote, ReasonChips, RequirementsEditor, SitePicker, StudentPicker, defaultExpert, studentToMission } from './Forms.jsx';

/* ------------------------------------------------------------------ home */
export function Home({ onStudent, onExpert }) {
  return (
    <section className="home calm" aria-labelledby="home-t">
      <div className="wrap">
        <header className="home-head">
          <SuhailStar size={120} label="Suhail, the guiding star" />
          <div>
            <p className="eyebrow">Lunar Landing Site Navigator</p>
            <h1 className="display" id="home-t">SUHAIL</h1>
            <p className="lead">Choosing where to land near the Moon’s south pole, explained and computed. SUHAIL is named after Suhail (Canopus), the star Arab navigators steered by.</p>
          </div>
        </header>

        <h2 className="sec-h">Choose your mode</h2>
        <ul className="mode-cards">
          <li>
            <button type="button" className="mode-card" onClick={onStudent}>
              <span className="hc-k">Student</span>
              <strong>Lunar Landing Academy</strong>
              <span>Watch two real missions that tipped over, learn the five things that decide a landing site, then save a mission run by a very silly crew.</span>
              <span className="hc-go" aria-hidden="true">Start learning →</span>
            </button>
          </li>
          <li>
            <button type="button" className="mode-card" onClick={onExpert}>
              <span className="hc-k">Expert</span>
              <strong>Mission planner</strong>
              <span>Enter your mission’s requirements, screen NASA’s Artemis III regions on every date, simulate power and temperature, and get a go / no-go with dates.</span>
              <span className="hc-go" aria-hidden="true">Plan a mission →</span>
            </button>
          </li>
        </ul>

        <div className="about-grid">
          <section aria-labelledby="ov-t">
            <h2 className="sec-h" id="ov-t">Overview</h2>
            <p>Landers have reached the Moon and still failed because of <em>where</em> they touched down: a slope, a shadow, a hill between them and Earth. SUHAIL checks the five things that decide a landing site — solar radiation, thermal environment, Earth communication, terrain slope and distance to science targets — using real NASA elevation data and hour-by-hour Sun and Earth geometry.</p>
          </section>
          <section aria-labelledby="team-t">
            <h2 className="sec-h" id="team-t">The team</h2>
            <p><strong>{TEAM.name}</strong><br />{TEAM.university}<br />{TEAM.event} · challenge: {TEAM.challenge}</p>
            {TEAM.members.length > 0 && <p className="small">{TEAM.members.join(' · ')}</p>}
          </section>
        </div>

        <section aria-labelledby="res-t" className="resources">
          <h2 className="sec-h" id="res-t">Resources we used</h2>
          <h3 className="mini-h">Data</h3>
          <ul className="res-list">
            {DATA_RESOURCES.map((r) => (<li key={r.label + r.use}><a href={r.url} target="_blank" rel="noreferrer">{r.label} ↗</a><span className="muted small">{r.use}</span></li>))}
          </ul>
          <h3 className="mini-h">Mission stories</h3>
          <ul className="res-list">
            {STORY_RESOURCES.map((r) => (<li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.label} ↗</a></li>))}
          </ul>
          <p className="field-note">Honest limits: the elevation grid is 80 m per pixel, Sun/Earth positions come from an astronomy model (not NASA SPICE), and the requirement levels are team assumptions, not NASA standards.</p>
        </section>
      </div>
    </section>
  );
}

/** Expert mode start: create a new mission or replan an old one. */
export function ExpertStart({ onNew, onReplan, onCast }) {
  return (
    <section className="stage" aria-labelledby="xs-t">
      <div className="wrap narrow">
        <p className="eyebrow">Expert mode</p>
        <h2 className="title" id="xs-t">What do you want to do?</h2>
        <ul className="mode-cards">
          <li><button type="button" className="mode-card" onClick={onNew}><span className="hc-k">Option 1</span><strong>Create a new mission</strong><span>Enter the requirements; SUHAIL finds the best places and dates.</span><span className="hc-go" aria-hidden="true">Begin →</span></button></li>
          <li><button type="button" className="mode-card" onClick={onReplan}><span className="hc-k">Option 2</span><strong>Replan an old mission</strong><span>Enter the old plan, why it changed and the new terms.</span><span className="hc-go" aria-hidden="true">Replan →</span></button></li>
        </ul>
        <p className="home-learn"><button type="button" className="link-btn" onClick={onCast}>Meet the council: the five specialists who argue about every site</button></p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ new mission */
export function NewMission({ mode, data, student, setStudent, expert, setExpert, onCreate, busy }) {
  const allOff = mode === 'expert' && Object.values(expert.levels).every((l) => l === 'off');
  return (
    <section className="stage" aria-labelledby="new-t">
      <div className="wrap narrow">
        <p className="eyebrow">Step 1 · Assessment</p>
        <h2 className="title" id="new-t">{mode === 'expert' ? 'What does your mission need?' : 'What kind of mission is it?'}</h2>
        <p className="lead small">{mode === 'expert' ? 'Enter your requirements for the five aspects. SUHAIL will test every candidate site on every possible start date.' : 'Pick the one that sounds most like yours. SUHAIL turns it into limits for the five aspects.'}</p>
        <div className="panel">
          {mode === 'expert'
            ? <RequirementsEditor value={expert} onChange={setExpert} data={data} idp="new" mode={mode} />
            : <><StudentPicker value={student} onChange={setStudent} idp="new" mode={mode} /><DataWindowNote data={data} /></>}
          <div className="cta-row"><button type="button" className="btn btn-primary" disabled={busy || allOff} onClick={onCreate}>{busy ? 'Analysing…' : 'Create mission'}</button></div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ replan */
export function ReplanMission({ mode, data, draft, setDraft, onReplan, busy }) {
  const set = (patch) => setDraft({ ...draft, ...patch });
  const last = windowDays(data) - 1;
  const oldDay = isoToDay(data, draft.oldIso);
  const dateOk = oldDay >= 0 && oldDay <= last;
  const allOff = mode === 'expert' && Object.values(draft.newExpert.levels).every((l) => l === 'off');
  return (
    <section className="stage" aria-labelledby="rp-t">
      <div className="wrap narrow">
        <p className="eyebrow">Step 1 · Replan assessment</p>
        <h2 className="title" id="rp-t">Replan an old mission</h2>
        <p className="lead small">Tell us what the old plan was, why it has to change, and what the mission needs now. SUHAIL then runs the same analysis and shows how the old plan holds up.</p>

        <div className="panel">
          <h3 className="panel-title">1 · The old mission</h3>
          <div className="req-top">
            <label className="numfield wide" htmlFor="rp-site"><span>Planned landing site</span><SitePicker id="rp-site" data={data} value={draft.siteId} onChange={(v) => set({ siteId: v })} /></label>
            <label className="numfield" htmlFor="rp-date"><span>Planned start date</span><input id="rp-date" type="date" min={dayToIso(data, 0)} max={dayToIso(data, last)} value={draft.oldIso} onChange={(e) => set({ oldIso: e.target.value })} /></label>
          </div>
          {!dateOk && <p className="callout small" role="status">That date is outside the data ({fmtDay(data, 0)} → {fmtDay(data, last)}). SUHAIL can still replan, but it cannot test the old plan.</p>}
          {mode === 'expert'
            ? <details className="limits"><summary>Old requirements <span>(optional, to show what changed)</span></summary><RequirementsEditor value={draft.oldExpert} onChange={(v) => set({ oldExpert: v })} data={data} idp="old" showDates={false} /></details>
            : <><p className="panel-text small">Which kind of mission was it?</p><StudentPicker value={draft.oldStudent} onChange={(v) => set({ oldStudent: v })} idp="old" /></>}
        </div>

        <div className="panel">
          <h3 className="panel-title">2 · Why replan?</h3>
          <ReasonChips value={draft.reasons} onChange={(v) => set({ reasons: v })} />
          <label className="numfield wide" htmlFor="rp-note"><span>Anything else? (optional)</span><input id="rp-note" type="text" maxLength={140} value={draft.note} onChange={(e) => set({ note: e.target.value })} placeholder="For example: new rover is 40 kg heavier" /></label>
        </div>

        <div className="panel">
          <h3 className="panel-title">3 · The new terms</h3>
          {mode === 'expert'
            ? <>
                <div className="cta-row tight"><button type="button" className="btn btn-ghost" onClick={() => set({ newExpert: { ...draft.oldExpert, fromIso: draft.newExpert.fromIso, toIso: draft.newExpert.toIso, name: `${draft.oldExpert.name} (replan)` } })}>Copy the old requirements</button></div>
                <RequirementsEditor value={draft.newExpert} onChange={(v) => set({ newExpert: v })} data={data} idp="newr" />
              </>
            : <><StudentPicker value={draft.newStudent} onChange={(v) => set({ newStudent: v })} idp="newr" /><DataWindowNote data={data} /></>}
          <div className="cta-row"><button type="button" className="btn btn-primary" disabled={busy || allOff} onClick={onReplan}>{busy ? 'Analysing…' : 'Replan'}</button></div>
        </div>
      </div>
    </section>
  );
}

/** A believable starting point for the replan demo: the old plan is the best place and date for the
 *  old (small) mission, and the reasons already match what changed (longer mission, new science goal). */
export function defaultReplan(data) {
  const oldStudent = { presetId: 'fast-demo', durationDays: 4, batteryH: 36, levels: {} };
  const oldRun = planMission(data, studentToMission(oldStudent));
  const best = oldRun.places[0];
  return {
    siteId: best ? best.site.id : data.sites[0].id,
    oldIso: dayToIso(data, best ? best.day : Math.min(20, windowDays(data) - 12)),
    reasons: ['Mission got longer or shorter', 'New science target'], note: '',
    oldExpert: { ...defaultExpert('fast-demo', data), name: 'Old mission' }, newExpert: { ...defaultExpert('science-rover', data), name: 'Replanned mission' },
    oldStudent, newStudent: { presetId: 'science-rover', durationDays: 8, batteryH: 60, levels: {} },
  };
}

/* ------------------------------------------------------------------ map: top five places */
export function MapStage({ run, data, onStart, onBack, selected, setSelected }) {
  const { result, mission, intro } = run;
  const ln = intro.line;
  const reduced = useReducedMotion();
  const [introOn, setIntroOn] = useState(!reduced && !!videoUrl('intro-dive'));
  return (
    <section className="stage" aria-labelledby="map-t">
      <div className="wrap">
        <p className="eyebrow">Step 2 · The map</p>
        <h2 className="title" id="map-t">{result.hasWinner ? 'Your best five places' : 'The five nearest misses'}</h2>
        <div className="map-grid">
          <div className="map-left">
            {introOn && (
              <figure className="intro-dive">
                <video src={videoUrl('intro-dive')} autoPlay muted playsInline onEnded={() => setIntroOn(false)} />
                <figcaption><span className="muted small">Approaching the Moon… (illustrative footage)</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => setIntroOn(false)}>Skip ▸</button></figcaption>
              </figure>
            )}
            <PoleMap data={data} places={result.places} selected={selected} onSelect={setSelected} />
            <p className="map-cap">The Moon’s south pole seen from above. Outlined areas are NASA’s Artemis <Term k="region">candidate regions</Term>; dots are the {data.sites.length} points SUHAIL tested. Numbered markers are your top {result.places.length}. Shaded relief from NASA LOLA elevation data.</p>
          </div>
          <div className="map-right">
            <Speech id="guide" mood={ln.mood} name={GUIDE.name} role={GUIDE.role} text={ln.text} size={84} tone="guide" restartKey={run.madeAt} />
            <ol className="place-list" aria-label="The five places">
              {result.places.map((p) => (
                <li key={p.region}>
                  <button type="button" className={`place-row ${selected === p.region ? 'on' : ''}`} onClick={() => setSelected(p.region)} aria-pressed={selected === p.region}>
                    <span className="pr-n">{p.rank}</span>
                    <span className="pr-name"><strong>{p.regionName}</strong><small>site {p.site.name.split('·')[1]?.trim()}</small></span>
                    <StatusPill status={p.ev.verdict} label={VERDICT[p.ev.verdict].label} />
                    <span className="mono pr-score">{Math.round(p.ev.overall)}</span>
                  </button>
                </li>
              ))}
            </ol>
            <details className="limits">
              <summary>Your requirements</summary>
              <ul>{requirementRows(mission).map(([a, l, t]) => (<li key={a}><span>{a} · {l}</span><span className="mono">{t}</span></li>))}</ul>
            </details>
            <div className="cta-row tight">
              <button type="button" className="btn btn-primary" onClick={onStart}>Start the tour →</button>
              <button type="button" className="btn btn-ghost" onClick={onBack}>Change requirements</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
