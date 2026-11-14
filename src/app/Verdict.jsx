import { useEffect, useMemo, useRef, useState } from 'react';
import RegionMedia, { videoUrl } from '../components/RegionMedia.jsx';
import { EnergyCompare, EnergyPanel, SiteDossier } from './Science.jsx';
import { Speech } from '../components/Speech.jsx';
import { SkyView, Timeline } from '../components/SkyView.jsx';
import { StatusIcon, StatusPill, Term } from '../components/ui.jsx';
import { ASPECT_LABEL } from '../content/missions.js';
import { ORDER } from '../content/characters.js';
import { VERDICT } from '../engine/rules.js';
import { a_an, coord, metricText } from '../engine/banter.js';
import { fmtDay, fmtRange } from '../engine/plan.js';
import { buildReportHtml, buildReportJson, downloadText, printHtml, requirementRows } from '../engine/report.js';
import { useReducedMotion } from '../hooks.js';
import { PlaceNumbers, RankTable, StartDays, limitText } from './Numbers.jsx';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'mission';

function SkyBlock({ site, day, mission, real }) {
  const hours = mission.durationDays * 24;
  const t0 = day * 24;
  const [scrub, setScrub] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setScrub(0); setPlaying(false); }, [day, site.id, mission.durationDays]);
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setScrub((s) => { if (s >= hours - 1) { setPlaying(false); return hours - 1; } return Math.min(hours - 1, s + 4); }), 110);
    return () => clearInterval(id);
  }, [playing, hours]);
  const t = Math.min(t0 + scrub, site.hourly.sun_el_deg.length - 1);
  return (
    <div className="skyblock">
      <SkyView site={site} t={t} t0={t0} hours={hours} real={real} />
      <div className="sky-ctl">
        <button type="button" className="btn btn-ghost" aria-pressed={playing} onClick={() => { if (scrub >= hours - 1) setScrub(0); setPlaying((p) => !p); }}>{playing ? '❚❚ Pause' : '▶ Play the mission'}</button>
        <label className="range-label grow" htmlFor="v-scrub">Mission time: <strong>Day {Math.floor(scrub / 24) + 1}, hour {scrub % 24}</strong></label>
        <input id="v-scrub" type="range" min="0" max={hours - 1} value={scrub} onChange={(e) => { setPlaying(false); setScrub(+e.target.value); }} />
      </div>
      <Timeline site={site} t0={t0} hours={hours} scrub={scrub} />
    </div>
  );
}

function ReplanCard({ rp, data, winner }) {
  const rec = {
    keep: ['go', 'Keep your old plan', 'It still passes every rule under the new requirements.'],
    'move-better': ['marginal', 'You can keep it, but a better place exists', `${winner.regionName} now scores clearly higher.`],
    shift: ['marginal', 'Keep the site, change the date', rp.shiftTo ? `The same site passes starting ${fmtDay(data, rp.shiftTo.day)}.` : ''],
    move: ['nogo', 'Move to a new place', 'The old site breaks a rule on every possible start date.'],
    unknown: ['unknown', 'The old plan could not be tested', 'Its start date is outside the data window.'],
  }[rp.recommendation];
  return (
    <div className="panel replan-card">
      <h3 className="panel-title">Your old plan under the new requirements</h3>
      {rp.site && <p className="panel-text">Old plan: <strong>{rp.site.name}</strong>{rp.inWindow && <> starting <strong>{fmtDay(data, rp.startDay)}</strong></>}. Reasons you gave: {rp.reasons.length ? rp.reasons.join(', ') : 'none selected'}.{rp.note && <> “{rp.note}”</>}</p>}
      <p className="rec"><StatusPill status={rec[0]} label={rec[1]} /> <span>{rec[2]}</span></p>
      {rp.underNew && (
        <div className="old-new">
          <div><h4>Old plan, old requirements</h4>{rp.underOld ? <p><StatusPill status={rp.underOld.verdict} label={VERDICT[rp.underOld.verdict].label} /> <span className="mono">score {Math.round(rp.underOld.overall)}</span></p> : <p className="muted">not tested</p>}</div>
          <div><h4>Old plan, new requirements</h4><p><StatusPill status={rp.underNew.verdict} label={VERDICT[rp.underNew.verdict].label} /> <span className="mono">score {Math.round(rp.underNew.overall)}</span></p></div>
        </div>
      )}
      {rp.underNew && !rp.underNew.eligible && (
        <ul className="reasons">{ORDER.filter((a) => ['nogo', 'unknown'].includes(rp.underNew.aspects[a].status)).map((a) => (<li key={a}><StatusIcon status={rp.underNew.aspects[a].status} size={18} /> <span><strong>{ASPECT_LABEL[a]}</strong>: {rp.underNew.aspects[a].metrics.filter((m) => m.pass !== true).map((m) => `${metricText(m)} (needs ${limitText(m)})`).join(', ')}</span></li>))}</ul>
      )}
      {rp.changes.length > 0 && (
        <details className="limits" open>
          <summary>What changed in the requirements</summary>
          <ul>{rp.changes.map((c) => (<li key={c.key}><span>{c.label ?? c.key}</span><span className="mono">{c.from ?? 'off'}{c.from == null ? '' : c.unit} → {c.to ?? 'off'}{c.to == null ? '' : c.unit}</span></li>))}</ul>
        </details>
      )}
    </div>
  );
}

/** Step 4: the leader gives the verdict, then the data that confirms it, then the report file. */
export default function Verdict({ run, data, mode, onReplan, onNew, onBack }) {
  const { result, mission, leader, replan, energy } = run;
  const reduced = useReducedMotion();
  const w = result.winner;
  const [count, setCount] = useState(mode === 'expert' ? leader.length : 1);
  const endRef = useRef(null);
  const nextRef = useRef(null);
  const first = useRef(true);
  const [note, setNote] = useState('');
  const done = count >= leader.length;
  const real = !data.is_sample;

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    endRef.current?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    nextRef.current?.focus({ preventScroll: true });
  }, [count, reduced]);

  const html = useMemo(() => buildReportHtml(run, data), [run, data]);
  const file = `suhail-${run.kind}-${slug(mission.name)}`;
  const flash = (m) => { setNote(m); setTimeout(() => setNote(''), 5200); };
  const copyJson = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(buildReportJson(run, data), null, 2)); flash('Data copied to the clipboard as JSON.'); }
    catch { flash('Your browser blocked copying. Use the Download button in the standalone version.'); }
  };

  if (!w) return <section className="stage"><div className="wrap"><p>No candidate sites in the data.</p><button className="btn btn-ghost" onClick={onNew}>Start over</button></div></section>;
  const ev = w.ev;

  return (
    <section className="stage" aria-labelledby="verdict-t">
      <div className="wrap">
        <p className="eyebrow">Step 4 · The leader’s verdict</p>
        <h2 className="title" id="verdict-t">{ev.eligible ? `Land at ${w.regionName}` : 'No place passes every rule'}</h2>

        <div className="chat leader-chat" role="log" aria-live="polite" aria-label="The leader speaking">
          {leader.slice(0, count).map((l, i) => (
            <Speech key={l.key} id="leader" mood={l.mood} name={l.name} role={l.role} text={l.text} size={88} typing={i === count - 1} active={i === count - 1} tone="leader" />
          ))}
          <div ref={endRef} />
        </div>
        {!done && (
          <div className="chat-ctl">
            <button ref={nextRef} type="button" className="btn btn-primary" onClick={() => setCount((c) => c + 1)}>Next ▸</button>
            <button type="button" className="btn btn-ghost" onClick={() => setCount(leader.length)}>Show everything</button>
          </div>
        )}

        {done && (
          <div className="verdict-data">
            <div className="hero-card">
              <div className="hero-card-main">
                <p className="eyebrow">{ev.eligible ? 'Best place to land' : 'Nearest miss'}</p>
                <h3 className="hero-name">{w.regionName} <small>site {w.site.name.split('·')[1]?.trim()}</small></h3>
                <p className="mono coords">{coord(w.site)} · elevation {w.site.elevation_m} m</p>
                <p className={`stamp-verdict v-${ev.verdict}`}><StatusPill status={ev.verdict} label={VERDICT[ev.verdict].label} /> <span>{VERDICT[ev.verdict].short}</span></p>
                <dl className="kv">
                  <div><dt>Overall score</dt><dd>{Math.round(ev.overall)}<small>/100</small></dd></div>
                  <div><dt>Best start</dt><dd>{fmtDay(data, w.day)}</dd></div>
                  <div><dt>Mission window (UTC)</dt><dd>{fmtRange(data, w.day, mission.durationDays)}</dd></div>
                  <div><dt>Start days that pass</dt><dd>{w.flex.eligibleDays}<small> of {w.flex.totalDays}</small></dd></div>
                </dl>
              </div>
              <div className="hero-card-map"><RegionMedia data={data} regionId={w.region} site={w.site} startHour={w.day * 24} hours={mission.durationDays * 24} defaultTab="video" /></div>
            </div>

            <div className="panel"><h3 className="panel-title">The five aspects, with numbers</h3><PlaceNumbers ev={ev} caption={`Numbers for ${w.regionName}`} /></div>

            <div className="panel"><h3 className="panel-title">Site dossier · {w.regionName}</h3><SiteDossier place={w} data={data} mission={mission} /></div>

            <div className="panel"><h3 className="panel-title">Solar energy & thermal environment assessment</h3>
              <p className="panel-text small">Dynamic simulation for the chosen landing date and duration: irradiance, array power, loads, battery state of charge and surface temperature, hour by hour.</p>
              <EnergyPanel sim={energy[0]} data={data} day={w.day} mission={mission} />
            </div>

            <div className="panel"><h3 className="panel-title">The five places under identical mission conditions</h3><EnergyCompare places={result.places} data={data} mission={mission} /></div>

            {replan && <ReplanCard rp={replan} data={data} winner={w} />}

            <div className="panel"><h3 className="panel-title">The five places compared</h3><RankTable places={result.places} data={data} highlight={w.region} /></div>

            <div className="panel">
              <h3 className="panel-title">Which start days work here</h3>
              <p className="panel-text small">SUHAIL tested every possible start day for {a_an(mission.durationDays)} {mission.durationDays}-day mission at this site.</p>
              <StartDays flex={w.flex} bestDay={w.day} data={data} />
            </div>

            <div className="panel">
              <h3 className="panel-title">The sky from this site during your mission</h3>
              <p className="panel-text small">Scrub through the mission and watch the <Term k="elevation">Sun and Earth</Term> slide along the <Term k="horizon">horizon</Term>. When the ground outline covers them, they are hidden.</p>
              <SkyBlock site={w.site} day={w.day} mission={mission} real={real} />
            </div>

            <div className="panel report-panel">
              <h3 className="panel-title">The report file</h3>
              <p className="panel-text">One file with your requirements, all five places, what the council said, the leader’s advice, the numbers and the dates.</p>
              <div className="cta-row">
                <button type="button" className="btn btn-primary" onClick={() => downloadText(`${file}.html`, html, 'text/html')}>Download report (HTML)</button>
                <button type="button" className="btn btn-ghost" onClick={() => downloadText(`${file}.json`, JSON.stringify(buildReportJson(run, data), null, 2), 'application/json')}>Download data (JSON)</button>
                <button type="button" className="btn btn-ghost" onClick={() => printHtml(html)}>Print / save as PDF</button>
                <button type="button" className="btn btn-ghost" onClick={copyJson}>Copy data</button>
              </div>
              {note && <p className="callout small" role="status">{note}</p>}
              <details className="limits"><summary>Preview the report</summary><iframe className="report-frame" title="Report preview" srcDoc={html} sandbox="" /></details>
              <details className="limits"><summary>Your requirements</summary><ul>{requirementRows(mission).map(([a, l, t]) => (<li key={a}><span>{a} · {l}</span><span className="mono">{t}</span></li>))}</ul></details>
            </div>

            <div className="panel honest">
              <h3 className="panel-title">How far to trust this</h3>
              <ul className="honest-list">
                <li><strong>Real:</strong> terrain, slopes and shadowed craters come from NASA’s <Term k="lola">LOLA</Term> elevation data. The five regions are NASA’s Artemis candidate regions.</li>
                <li><strong>Close, not exact:</strong> the Sun and Earth positions come from an astronomy model, not NASA’s SPICE files yet. It should be within a small fraction of a degree, which matters near the horizon.</li>
                <li><strong>Not visible here:</strong> the elevation grid is 80 m per pixel, so boulders and small craters are invisible. A site that passes here still needs a close-up check.</li>
                <li><strong>Assumptions:</strong> the importance levels and their default numbers are the team’s own, not NASA standards. Change them in Expert mode.</li>
              </ul>
            </div>

            <div className="cta-row end">
              <button type="button" className="btn btn-primary" onClick={onReplan}>Replan this mission</button>
              <button type="button" className="btn btn-ghost" onClick={onNew}>Start a new mission</button>
              <button type="button" className="btn btn-ghost" onClick={onBack}>← Back to the council</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
