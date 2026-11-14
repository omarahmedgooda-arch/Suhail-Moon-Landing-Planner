import { useState } from 'react';
import { Avatar } from '../components/Avatar.jsx';
import { SourceLink } from '../components/ui.jsx';
import { videoUrl } from '../components/RegionMedia.jsx';
import { castFor } from '../content/cast.js';
import Game from './Game.jsx';
import { ACADEMY_ASPECTS, MISSION_STORIES } from '../content/academy.js';

const cast = castFor('student');
const STAGES = [
  { id: 'watch', n: '01', title: 'Mission stories', blurb: 'Two real lunar landers, what they set out to do and what went wrong on touchdown.', cta: 'Start watching' },
  { id: 'learn', n: '02', title: 'Become a landing expert', blurb: 'The five aspects scientists check before choosing where to land.', cta: 'Start learning' },
  { id: 'play', n: '03', title: 'Try it yourself: Save the Mission', blurb: 'A 2D game: command a very silly crew, make five landing decisions and keep the lander alive.', cta: 'Play now' },
];

function StageBar({ stage, done, onGo }) {
  return (
    <ol className="ac-steps" aria-label="Academy stages">
      {STAGES.map((s) => (
        <li key={s.id}><button type="button" className={`ac-step ${stage === s.id ? 'on' : ''} ${done[s.id] ? 'done' : ''}`} aria-current={stage === s.id ? 'step' : undefined} onClick={() => onGo(s.id)}>
          <span className="ac-n">{done[s.id] ? '✓' : s.n}</span><span>{s.title}</span></button></li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ WATCH */
function Watch({ onNext }) {
  return (
    <section aria-labelledby="ac-watch">
      <h3 className="title" id="ac-watch">Mission stories</h3>
      <p className="lead small">Reaching the Moon is not enough. These two landers made it to the surface near the south pole, and both ended up on their side.</p>
      <div className="story-grid">
        {MISSION_STORIES.map((m) => (
          <article key={m.id} className="story-card panel">
            <header><p className="eyebrow">{m.code} · {m.year}</p><h4 className="story-name">{m.name}</h4></header>
            {videoUrl(m.video) && (<figure className="rm-video"><video src={videoUrl(m.video)} muted loop playsInline autoPlay controls preload="metadata" /><figcaption className="muted small">{m.videoNote} Credit: NASA SVS.</figcaption></figure>)}
            <dl className="story-dl">
              <div><dt>Mission objective</dt><dd>{m.objective}</dd></div>
              <div><dt>What happened?</dt><dd>{m.happened}</dd></div>
              <div><dt>Outcome</dt><dd>{m.outcome}</dd></div>
              <div className="lesson"><dt>Main lesson</dt><dd>{m.lesson}</dd></div>
            </dl>
            <SourceLink source={m.source} />
          </article>
        ))}
      </div>
      <p className="callout">Landing on the Moon is only the beginning. Choosing the right landing site can make all the difference!</p>
      <div className="cta-row"><button type="button" className="btn btn-primary" onClick={onNext}>Ready to discover how scientists choose a landing site? →</button></div>
    </section>
  );
}

/* ------------------------------------------------------------------ LEARN */
function Learn({ onNext }) {
  const [i, setI] = useState(0);
  const [ans, setAns] = useState({});
  const a = ACADEMY_ASPECTS[i];
  const who = cast.members[a.id];
  const picked = ans[a.id];
  const last = i === ACADEMY_ASPECTS.length - 1;
  return (
    <section aria-labelledby="ac-learn">
      <h3 className="title" id="ac-learn">The five aspects</h3>
      <div className="dots" aria-label={`Aspect ${i + 1} of 5`}>{ACADEMY_ASPECTS.map((x, k) => (<button key={x.id} type="button" className={`dot ${k === i ? 'on' : ''} ${ans[x.id] != null ? 'seen' : ''}`} aria-label={`Aspect ${k + 1}: ${x.name}`} onClick={() => setI(k)} />))}</div>
      <article className="aspect-card panel">
        <div className="aspect-head"><Avatar id={a.id} mood="happy" size={120} mode="student" /><div><p className="eyebrow">Aspect {a.n}</p><h4 className="story-name">{a.name}</h4><p className="muted small">Crew member in charge: <strong>{who.name}</strong></p></div></div>
        <dl className="story-dl">
          <div><dt>What is it?</dt><dd>{a.what}</dd></div>
          <div><dt>Why does it matter?</dt><dd>{a.why}</dd></div>
          <div><dt>What happens if we ignore it?</dt><dd>{a.ignore}</dd></div>
        </dl>
        <div className="quick-q">
          <p><strong>Quick check:</strong> {a.q}</p>
          <div className="cta-row tight">
            {[true, false].map((v) => (<button key={String(v)} type="button" className={`btn ${picked === v ? (v === a.a ? 'btn-primary' : 'btn-wrong') : 'btn-ghost'}`} aria-pressed={picked === v} onClick={() => setAns((x) => ({ ...x, [a.id]: v }))}>{v ? 'Yes' : 'No'}</button>))}
          </div>
          {picked != null && <p className={`callout small ${picked === a.a ? '' : 'warn'}`} role="status">{picked === a.a ? a.fb : `Not quite. ${a.fb.replace(/^Right: /, '')}`}</p>}
        </div>
      </article>
      <div className="cta-row">
        <button type="button" className="btn btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>← Previous</button>
        {!last && <button type="button" className="btn btn-primary" onClick={() => setI(i + 1)}>Next aspect →</button>}
        {last && <button type="button" className="btn btn-primary" onClick={onNext}>Start the mission game! →</button>}
      </div>
      {last && <p className="callout">Excellent! You now know the five aspects of choosing a lunar landing site. But can you use them to save a real mission?</p>}
    </section>
  );
}

/** Student "Lunar Landing Academy": WATCH → LEARN → PLAY, then hand over to the real planner. */
export default function Academy({ onHome }) {
  const [stage, setStage] = useState(null);
  const [done, setDone] = useState({});
  const finish = (id, next) => { setDone((d) => ({ ...d, [id]: true })); setStage(next); window.scrollTo?.({ top: 0 }); };
  return (
    <section className="stage academy" aria-labelledby="ac-t">
      <div className="wrap">
        <p className="eyebrow">Student mode</p>
        <h2 className="display" id="ac-t">Lunar Landing Academy</h2>
        <p className="lead">Your mission to become a Lunar Landing Expert starts here! <span className="muted">Watch → Learn → Play.</span></p>
        {stage == null ? (
          <>
            <ul className="ac-cards">
              {STAGES.map((s) => (
                <li key={s.id}><button type="button" className="home-card" onClick={() => setStage(s.id)}>
                  <span className="hc-k">Stage {s.n}{done[s.id] ? ' · done ✓' : ''}</span><strong>{s.title}</strong><span>{s.blurb}</span><span className="hc-go" aria-hidden="true">{s.cta} →</span>
                </button></li>
              ))}
            </ul>
            <div className="crew-strip" aria-label="The crew">
              {['terrain', 'sunlight', 'night', 'comms', 'science'].map((a) => (<figure key={a}><Avatar id={a} mood="happy" size={110} mode="student" /><figcaption><strong>{cast.members[a].name}</strong><small>{cast.members[a].role}</small></figcaption></figure>))}
              <figure><Avatar id="leader" mood="happy" size={110} mode="student" /><figcaption><strong>{cast.leader.name}</strong><small>{cast.leader.role}</small></figcaption></figure>
            </div>
          </>
        ) : (
          <>
            <StageBar stage={stage} done={done} onGo={setStage} />
            {stage === 'watch' && <Watch onNext={() => finish('watch', 'learn')} />}
            {stage === 'learn' && <Learn onNext={() => finish('learn', 'play')} />}
            {stage === 'play' && <Game onFinish={() => setDone((d) => ({ ...d, play: true }))} onHome={onHome} />}
          </>
        )}
      </div>
    </section>
  );
}
