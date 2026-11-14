import { useEffect, useRef, useState } from 'react';
import RegionMedia from '../components/RegionMedia.jsx';
import { Speech } from '../components/Speech.jsx';
import { StatusPill } from '../components/ui.jsx';
import { Avatar, SuhailStar } from '../components/Avatar.jsx';
import { VERDICT } from '../engine/rules.js';
import { coord } from '../engine/banter.js';
import { fmtDay, fmtRange } from '../engine/plan.js';
import { richLength } from '../components/ui.jsx';
import { useReducedMotion } from '../hooks.js';
import { EnergyPanel, SiteDossier } from './Science.jsx';
import { PlaceNumbers, WhyButton } from './Numbers.jsx';

/** Seat every speaker on one side of the table: guide in the middle-left, the five split left/right. */
const SIDE = { guide: 'left', sunlight: 'right', night: 'left', comms: 'right', terrain: 'left', science: 'right' };

function Typing({ speaker, side }) {
  return (
    <div className={`typing-row side-${side}`} aria-hidden="true">
      {speaker === 'guide' ? <SuhailStar size={36} glow={false} /> : <Avatar id={speaker} mood="thinking" size={36} />}
      <span className="dots"><i /><i /><i /></span>
    </div>
  );
}

/** Step 3: the council meets about each place — an auto-playing conversation, then a vote before the verdict. */
export default function Council({ run, data, mode, onVerdict, onBack }) {
  const { result, mission, scripts, energy } = run;
  const reduced = useReducedMotion();
  const places = result.places;
  const [idx, setIdx] = useState(0);
  const [count, setCount] = useState({});
  const [playing, setPlaying] = useState(!reduced);
  const [speed, setSpeed] = useState(1);
  const [typing, setTyping] = useState(false);
  const [science, setScience] = useState(false);
  const [vote, setVote] = useState(null);
  const endRef = useRef(null);

  const place = places[idx];
  const lines = scripts[idx];
  const shown = Math.min(lines.length, count[idx] ?? 1);
  const done = shown >= lines.length;
  const last = idx === places.length - 1;
  const ev = place.ev;

  // auto-play: wait for the current line to "type", show a typing indicator, then reveal the next one
  useEffect(() => {
    if (!playing || done) { setTyping(false); return undefined; }
    const cur = lines[shown - 1];
    const read = Math.min(5200, 900 + richLength(cur.text) * 22) / speed;
    let t2;
    const t1 = setTimeout(() => {
      setTyping(true);
      t2 = setTimeout(() => { setTyping(false); setCount((c) => ({ ...c, [idx]: Math.min(lines.length, (c[idx] ?? 1) + 1) })); }, 700 / speed);
    }, read);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [playing, done, shown, idx, lines, speed]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' }); }, [shown, typing, reduced]);

  const go = (i) => { setIdx(i); setPlaying(!reduced); window.scrollTo?.({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); };
  const showAll = () => { setCount((c) => ({ ...c, [idx]: lines.length })); setScience(true); setPlaying(false); };
  const next = lines[shown];

  return (
    <section className="stage" aria-labelledby="council-t">
      <div className="wrap">
        <p className="eyebrow">Step 3 · The council</p>
        <h2 className="title" id="council-t">Place {idx + 1} of {places.length}: {place.regionName}</h2>

        <ol className="place-steps" aria-label="Places">
          {places.map((p, i) => (
            <li key={p.region}>
              <button type="button" className={`place-step ${i === idx ? 'on' : ''} ${count[i] ? 'seen' : ''}`} aria-current={i === idx ? 'step' : undefined} onClick={() => go(i)}>
                <span className="ps-n">{p.rank}</span><span className="ps-t">{p.regionName}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="council-grid">
          <div className="council-left">
            <RegionMedia key={place.region} data={data} regionId={place.region} site={place.site} startHour={place.day * 24} hours={mission.durationDays * 24} />
            <div className="place-card">
              <div className="pc-row"><StatusPill status={ev.verdict} label={VERDICT[ev.verdict].label} /><span className="mono">score {Math.round(ev.overall)}/100</span></div>
              <p><strong>Site {place.site.name.split('·')[1]?.trim()}</strong> · <span className="mono">{coord(place.site)}</span> · elevation <span className="mono">{place.site.elevation_m} m</span></p>
              <p>Best start <strong>{fmtDay(data, place.day)}</strong> <span className="muted">({fmtRange(data, place.day, mission.durationDays)}, UTC)</span></p>
            </div>
          </div>

          <div className="council-right">
            <div className="chat meeting" role="log" aria-live="polite" aria-label="The council’s conversation">
              {lines.slice(0, shown).map((l, i) => {
                const isAspect = l.speaker !== 'guide' && l.key.startsWith('ch-');
                return (
                  <Speech key={`${idx}-${l.key}`} id={l.speaker} mood={l.mood} name={l.name} role={l.role} text={l.text} size={64}
                    side={SIDE[l.speaker] ?? 'left'} typing={i === shown - 1} active={i === shown - 1}
                    tone={l.speaker === 'guide' ? 'guide' : l.key.startsWith('talk') ? 'talk' : undefined}>
                    {isAspect && ev.aspects[l.speaker].status !== 'off' && <WhyButton aspect={l.speaker} ev={ev} mission={mission} />}
                  </Speech>
                );
              })}
              {typing && next && <Typing speaker={next.speaker} side={SIDE[next.speaker] ?? 'left'} />}
              <div ref={endRef} />
            </div>

            <div className="chat-ctl player">
              {!done && <button type="button" className="btn btn-primary" onClick={() => setPlaying((p) => !p)}>{playing ? '❚❚ Pause' : '▶ Play'}</button>}
              {!done && (
                <div className="seg" role="radiogroup" aria-label="Speed">
                  {[1, 2].map((v) => (<button key={v} type="button" role="radio" aria-checked={speed === v} className={speed === v ? 'on' : ''} onClick={() => setSpeed(v)}>{v}×</button>))}
                </div>
              )}
              {!done && <button type="button" className="btn btn-ghost" onClick={showAll}>Show everything</button>}
              {done && !last && <button type="button" className="btn btn-primary" onClick={() => go(idx + 1)}>Next place: {places[idx + 1].regionName} →</button>}
              {!last && <button type="button" className="btn btn-ghost" onClick={() => go(places.length - 1)}>Skip to the last place</button>}
            </div>

            {done && last && (
              <div className="panel vote">
                <h3 className="panel-title">Before Hakim decides: which place would you choose?</h3>
                <ul className="vote-opts">
                  {places.map((p) => (
                    <li key={p.region}><button type="button" aria-pressed={vote === p.region} onClick={() => setVote(p.region)}>
                      <span className="pr-n">{p.rank}</span><strong>{p.regionName}</strong><StatusPill status={p.ev.verdict} label={VERDICT[p.ev.verdict].label} />
                    </button></li>
                  ))}
                  <li><button type="button" aria-pressed={vote === 'none'} onClick={() => setVote('none')}>I’ll let Hakim decide</button></li>
                </ul>
                <div className="cta-row"><button type="button" className="btn btn-primary" disabled={!vote} onClick={() => onVerdict(vote === 'none' ? null : vote)}>Hear Hakim’s verdict →</button></div>
              </div>
            )}

            <details className="numbers" open={science}>
              <summary>The numbers behind this place</summary>
              <PlaceNumbers ev={ev} caption={`Numbers for ${place.regionName}`} />
            </details>
          </div>
        </div>

        <div className="science-toggle">
          <button type="button" className="btn btn-ghost" aria-expanded={science} onClick={() => setScience((v) => !v)}>{science ? 'Hide the full site analysis' : 'Show the full site analysis: data, constraints, power & thermal simulation'}</button>
        </div>
        {science && (
          <div className="science">
            <div className="panel"><h3 className="panel-title">Site dossier · {place.regionName}</h3><SiteDossier place={place} data={data} mission={mission} /></div>
            <div className="panel"><h3 className="panel-title">Solar energy & thermal environment assessment</h3>
              <p className="panel-text small">Hour-by-hour simulation of this site for your mission window ({mission.durationDays} days from {fmtDay(data, place.day)}), using the real terrain horizon and Sun geometry.</p>
              <EnergyPanel sim={energy[idx]} data={data} day={place.day} mission={mission} />
            </div>
          </div>
        )}
        <p className="stage-back"><button type="button" className="btn btn-ghost" onClick={onBack}>← Back to the map</button></p>
      </div>
    </section>
  );
}
