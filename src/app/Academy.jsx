import { useState } from 'react';
import { Avatar } from '../components/Avatar.jsx';
import { SourceLink } from '../components/ui.jsx';
import StoryScene from '../components/StoryScene.jsx';
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
function Story({ m, onDone }) {
  const [i, setI] = useState(0);
  const [guess, setGuess] = useState(null);
  const st = m.steps[i];
  const last = i === m.steps.length - 1;
  const needGuess = !!st.guess && guess == null;
  const go = (n) => { setI(n); if (m.steps[n]?.guess == null) setGuess(null); if (n === m.steps.length - 1) onDone(); };
  const pickGuess = (k) => setGuess(k);
  const g = st.guess && guess != null ? st.guess.options[guess] : null;
  return (
    <div className="ms-player">
      <div className="ms-stage">
        <StoryScene key={`${m.id}-${i}`} scene={st.scene} />
        {st.badge && <div className="ms-badge"><strong>{st.badge}</strong><span>on the Moon</span></div>}
      </div>
      <p className="ms-k">{m.name} · {st.k}</p>
      <div className="ms-say" key={`say-${m.id}-${i}`}>
        <Avatar id="leader" mood={st.guess ? 'thinking' : last ? 'happy' : 'happy'} size={110} mode="student" />
        <div className="bubble"><div className="bubble-head"><strong>{cast.leader.name}</strong><span>{cast.leader.role}</span></div>
          <p>{st.say}</p>
          {g && <p className="small" role="status" style={{ marginTop: 8 }}>{g.ok ? 'Exactly right! Let’s see it happen.' : 'Good guess, but not this time. Let’s see what really happened.'}</p>}
        </div>
      </div>
      {st.guess && (
        <ul className="ms-guess" aria-label="Your guess">
          {st.guess.options.map((o, k) => (
            <li key={o.t}><button type="button" disabled={guess != null} aria-pressed={guess === k}
              className={guess == null ? '' : o.ok ? 'right' : guess === k ? 'wrong' : ''} onClick={() => pickGuess(k)}>{o.t}</button></li>
          ))}
        </ul>
      )}
      <div className="ms-nav">
        <div className="dots" aria-label={`Step ${i + 1} of ${m.steps.length}`}>
          {m.steps.map((x, k) => (<button key={k} type="button" className={`dot ${k === i ? 'on' : ''} ${k < i ? 'seen' : ''}`} aria-label={`Step ${k + 1}: ${x.k}`} disabled={k > i} onClick={() => go(k)} />))}
        </div>
        <button type="button" className="btn btn-ghost" disabled={i === 0} onClick={() => go(i - 1)}>← Back</button>
        {!last && <button type="button" className="btn btn-primary" disabled={needGuess} onClick={() => go(i + 1)}>{needGuess ? 'Make a guess first' : 'Next →'}</button>}
        {!last && <button type="button" className="btn btn-ghost ms-skip" onClick={() => go(m.steps.length - 1)}>Skip to the lesson</button>}
      </div>
      <SourceLink source={m.source} />
    </div>
  );
}

function Watch({ onNext }) {
  const [cur, setCur] = useState(MISSION_STORIES[0].id);
  const [seen, setSeen] = useState({});
  const m = MISSION_STORIES.find((x) => x.id === cur);
  const allSeen = MISSION_STORIES.every((x) => seen[x.id]);
  return (
    <section aria-labelledby="ac-watch">
      <h3 className="title" id="ac-watch">Mission stories</h3>
      <p className="lead small">Reaching the Moon is not enough. Two landers made it to the surface near the south pole, and both ended up on their side. Watch what happened, and guess before the Wise Doctor tells you.</p>
      <div className="ms-tabs" role="tablist" aria-label="Missions">
        {MISSION_STORIES.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={cur === x.id} className={`ms-tab ${seen[x.id] ? 'done' : ''}`} onClick={() => setCur(x.id)}>
            <strong>{x.name}</strong><span>{x.code} · {x.year}</span>
          </button>
        ))}
      </div>
      <Story key={m.id} m={m} onDone={() => setSeen((s) => ({ ...s, [m.id]: true }))} />
      {seen[m.id] && !allSeen && (
        <div className="cta-row"><button type="button" className="btn btn-primary" onClick={() => setCur(MISSION_STORIES.find((x) => !seen[x.id]).id)}>Next mission: {MISSION_STORIES.find((x) => !seen[x.id]).name} →</button></div>
      )}
      {allSeen && (<>
        <p className="callout">Landing on the Moon is only the beginning. Choosing the right landing site can make all the difference!</p>
        <div className="cta-row"><button type="button" className="btn btn-primary" onClick={onNext}>Ready to discover how scientists choose a landing site? →</button></div>
      </>)}
      {!allSeen && <div className="cta-row"><button type="button" className="btn btn-ghost" onClick={onNext}>Skip to the five aspects →</button></div>}
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
