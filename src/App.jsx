import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ModeContext } from './components/ModeContext.js';
import { simulateEnergy } from './engine/energy.js';
import Academy from './app/Academy.jsx';
import CastPage from './app/CastPage.jsx';
import Starfield from './components/Starfield.jsx';
import Act1 from './components/Act1.jsx';
import Act2 from './components/Act2.jsx';
import { SuhailStar } from './components/Avatar.jsx';
import { prepareData } from './engine/rules.js';
import { isoToDay, planMission, replanCompare } from './engine/plan.js';
import { leaderScript, mapIntro, placeScript } from './engine/banter.js';
import { loadSites } from './data/loadSites.js';
import TopBar from './app/TopBar.jsx';
import Council from './app/Council.jsx';
import Verdict from './app/Verdict.jsx';
import { ExpertStart, Home, MapStage, NewMission, ReplanMission, defaultReplan } from './app/Screens.jsx';
import { defaultExpert, defaultStudent, expertToMission, studentToMission } from './app/Forms.jsx';

const DAY = 86400000;

/** A 30-day slice and one well-lit site per region: what the story pages (Act 1 and 2) are built for. */
function teachingData(data) {
  const o = 45 * 24, hours = 720;
  const best = new Map();
  for (const s of data.sites) {
    const up = s.vis.sun.reduce((a, b) => a + b, 0);
    if (!best.has(s.region) || up > best.get(s.region).up) best.set(s.region, { s, up });
  }
  const cut = (a) => (a ? a.subarray(o, o + hours) : a);
  const sites = [...best.values()].map(({ s }) => ({
    ...s, name: s.name, hourly: { sun_el_deg: cut(s.hourly.sun_el_deg), sun_az_deg: cut(s.hourly.sun_az_deg), earth_el_deg: cut(s.hourly.earth_el_deg), earth_az_deg: cut(s.hourly.earth_az_deg) },
    vis: { sun: cut(s.vis.sun), earth: cut(s.vis.earth) },
  }));
  return { ...data, sites, window: { ...data.window, start_utc: new Date(Date.parse(data.window.start_utc) + 45 * DAY).toISOString(), hours } };
}

/**
 * <App/> – SUHAIL: landing page, new / replan flow, map, council, leader, report.
 * Props (optional): data = pipeline output in the suhail.sites/v0 shape.
 */
export default function App({ data: dataProp }) {
  const [raw, setRaw] = useState(dataProp ?? null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('student');
  const [view, setView] = useState('home');
  const [student, setStudent] = useState(defaultStudent);
  const [expert, setExpert] = useState(null);
  const [replanDraft, setReplanDraft] = useState(null);
  const [run, setRun] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [vote, setVote] = useState(undefined);

  useEffect(() => {
    if (dataProp) { setRaw(dataProp); return undefined; }
    let live = true;
    loadSites().then((d) => live && setRaw(d)).catch((e) => live && setError(e));
    return () => { live = false; };
  }, [dataProp]);

  const data = useMemo(() => (raw ? prepareData(raw) : null), [raw]);
  const teach = useMemo(() => (data && view === 'learn' ? teachingData(data) : null), [data, view]);
  useEffect(() => {
    if (data && !expert) setExpert(defaultExpert('science-rover', data));
    if (data && !replanDraft) setReplanDraft(defaultReplan(data));
  }, [data, expert, replanDraft]);

  // Navigation with a real back stack (topbar "Back", browser back button, Esc-free).
  const stack = useRef([]);
  const go = useCallback((v, { replace = false } = {}) => {
    setView((cur) => {
      if (cur !== v && !replace) { stack.current.push(cur); try { window.history.pushState({ v }, ''); } catch { /* sandboxed */ } }
      return v;
    });
    window.scrollTo?.({ top: 0 });
  }, []);
  const back = useCallback(() => {
    const prev = stack.current.pop();
    setView(prev ?? 'home');
    window.scrollTo?.({ top: 0 });
  }, []);
  useEffect(() => {
    const onPop = () => { const prev = stack.current.pop(); setView(prev ?? 'home'); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);


  const execute = useCallback((kind, mission, old) => {
    setBusy(true);
    setTimeout(() => {
      const result = planMission(data, mission);
      const replan = kind === 'replan' ? replanCompare(data, old, result) : null;
      const energy = result.places.map((p) => simulateEnergy(p.site, p.day * 24, mission.durationDays * 24, mission.power, data.window.start_utc));
      setRun({ kind, mission, result, energy, replan, madeAt: Date.now() });
      setVote(undefined);
      setSelected(result.places[0]?.region ?? null);
      setBusy(false);
      go('map');
    }, 40);
  }, [data, go]);

  const createNew = () => execute('new', mode === 'expert' ? expertToMission(expert, data) : studentToMission(student), null);
  const createReplan = () => {
    const d = replanDraft;
    const oldMission = mode === 'expert' ? expertToMission(d.oldExpert, data) : studentToMission(d.oldStudent);
    const mission = mode === 'expert' ? expertToMission(d.newExpert, data) : studentToMission(d.newStudent);
    execute('replan', mission, { siteId: d.siteId, startDay: isoToDay(data, d.oldIso), mission: oldMission, reasons: d.reasons, note: d.note });
  };

  /** "Replan this mission": the finished run becomes the old plan of a new replan. */
  const replanThis = () => {
    const w = run.result.winner;
    setReplanDraft((d) => ({
      ...d, siteId: w?.site.id ?? d.siteId, oldIso: w ? new Date(Date.parse(data.window.start_utc) + w.day * DAY).toISOString().slice(0, 10) : d.oldIso,
      oldExpert: { ...expert, name: run.mission.name }, newExpert: { ...expert, name: `${run.mission.name} (replan)` },
      oldStudent: student, newStudent: student,
    }));
    go('replan');
  };

  const talk = useMemo(() => {
    if (!run) return null;
    const { result, mission, energy, replan } = run;
    return {
      scripts: result.places.map((p, i) => placeScript(p, { index: i, total: result.places.length, data, mission, mode, energy: energy[i] })),
      leader: leaderScript(result, { data, replan, mode, energy: energy[0], vote }),
      intro: mapIntro(result, mode),
    };
  }, [run, mode, data, vote]);
  const runX = run && talk ? { ...run, ...talk } : null;

  if (error) return <main className="loading"><p>Could not load the site data: {String(error.message || error)}</p></main>;
  if (!data || !expert || !replanDraft) return <main className="loading"><SuhailStar size={72} /><p>Finding the stars…</p></main>;

  return (
    <ModeContext.Provider value={mode}>
      <Starfield />
      <TopBar mode={mode} view={view} hasRun={!!run} isSample={!!data.is_sample} onNav={go} onHome={() => go('home')} onBack={back} />
      <main>
        {view === 'home' && <Home onStudent={() => { setMode('student'); go('academy'); }} onExpert={() => { setMode('expert'); go('expert'); }} />}
        {view === 'expert' && <ExpertStart onNew={() => go('new')} onReplan={() => go('replan')} onCast={() => go('cast')} />}
        {view === 'academy' && <Academy onHome={() => go('home')} />}
        {view === 'cast' && <CastPage mode={mode} onStart={() => go('new')} />}
        {view === 'learn' && teach && (
          <>
            <Act1 data={teach} onStart={() => go('new')} />
            <Act2 data={teach} onStart={() => go('new')} />
          </>
        )}
        {view === 'new' && <NewMission mode={mode} data={data} student={student} setStudent={setStudent} expert={expert} setExpert={setExpert} onCreate={createNew} busy={busy} />}
        {view === 'replan' && <ReplanMission mode={mode} data={data} draft={replanDraft} setDraft={setReplanDraft} onReplan={createReplan} busy={busy} />}
        {view === 'map' && runX && <MapStage run={runX} data={data} selected={selected} setSelected={setSelected} onStart={() => go('council')} onBack={back} />}
        {view === 'council' && runX && <Council run={runX} data={data} mode={mode} onVerdict={(v) => { setVote(v); go('verdict'); }} onBack={back} />}
        {view === 'verdict' && runX && <Verdict run={runX} data={data} mode={mode} onReplan={replanThis} onNew={() => go('new')} onBack={back} />}
      </main>
      <footer className="footer">
        <div className="wrap foot-row">
          <p className="foot-brand"><SuhailStar size={28} glow={false} /> <span><strong>SUHAIL</strong></span></p>
          <p className="muted small">FASA Destination Team · NASA Space Apps Cairo 2026 · data: NASA LOLA, NASA Artemis III regions, NASA SVS.</p>
        </div>
      </footer>
    </ModeContext.Provider>
  );
}
