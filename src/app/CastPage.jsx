import { useState } from 'react';
import { Avatar } from '../components/Avatar.jsx';
import { SourceLink } from '../components/ui.jsx';
import { ASPECT_LABEL } from '../content/missions.js';
import { castFor, ORDER } from '../content/cast.js';

/** Photo of the real inspiration, only if the team put a licensed file in public/inspired/. */
function InspiredPhoto({ file, who }) {
  const [ok, setOk] = useState(true);
  if (!file || !ok) return <div className="insp-photo empty" aria-hidden="true"><span>Photo</span><small>add public/inspired/{file}</small></div>;
  return <img className="insp-photo" src={`./inspired/${file}`} alt={who} onError={() => setOk(false)} />;
}

/** "Meet the council": one card per character, with the real person who inspired them (Expert mode). */
export default function CastPage({ mode, onStart }) {
  const cast = castFor(mode);
  const expert = mode === 'expert';
  return (
    <section className="stage" aria-labelledby="cast-t">
      <div className="wrap">
        <p className="eyebrow">{expert ? 'Expert mode · the council' : 'Student mode · the crew'}</p>
        <h2 className="title" id="cast-t">{expert ? 'Meet the council' : 'Meet the crew'}</h2>
        <p className="lead small">{expert
          ? 'Five specialists, one per aspect, argue about every candidate site; the flight director decides. Each character is original: we borrowed a field and a spirit from a real Arab scientist or astronaut, not their words or personality. Everything the characters say is generated from the data.'
          : 'Five clumsy crew members, one per aspect, and the wise doctor who keeps the mission on track.'}</p>
        <ul className="cast-grid">
          {ORDER.map((a) => {
            const c = cast.members[a];
            return (
              <li key={a} className="cast-card panel">
                <div className="cast-top">
                  <Avatar id={a} mood="happy" size={150} />
                  <div>
                    <p className="eyebrow">{ASPECT_LABEL[a]}</p>
                    <h3 className="cast-name">{c.name}</h3>
                    <p className="muted small">{c.role}{c.meaning ? ` · ${c.meaning}` : ''}</p>
                  </div>
                </div>
                {expert ? (
                  <>
                    <p>{c.voice}</p>
                    <dl className="cast-dl">
                      <div><dt>Cares about</dt><dd>{c.cares}</dd></div>
                      <div><dt>Red line</dt><dd>{c.redLine}</dd></div>
                      <div><dt>Risk appetite</dt><dd>{c.risk}</dd></div>
                      <div><dt>Argues</dt><dd>{c.argues}</dd></div>
                    </dl>
                    <div className="inspired">
                      <InspiredPhoto file={c.inspired.photo} who={c.inspired.who} />
                      <div>
                        <p className="eyebrow">Inspired by</p>
                        <p><strong>{c.inspired.who}</strong> <span className="muted small">· {c.inspired.where}</span></p>
                        <p className="small">{c.inspired.what}</p>
                        {c.inspired.source && <SourceLink source={c.inspired.source} />}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p>{c.quirk}</p>
                    <p className="small muted">{c.job}</p>
                  </>
                )}
              </li>
            );
          })}
          <li className="cast-card panel">
            <div className="cast-top"><Avatar id="leader" mood="happy" size={150} /><div><p className="eyebrow">Decides</p><h3 className="cast-name">{cast.leader.name}</h3><p className="muted small">{cast.leader.role} · {cast.leader.meaning}</p></div></div>
            <p>{expert ? 'Listens to all five, weighs the trade-offs and gives the go / no-go with numbers and dates. Original character.' : 'Calm and clever. Fixes the crew’s silly ideas and explains the real science.'}</p>
          </li>
        </ul>
        {expert && <p className="field-note">Character art by the FASA Destination Team. Dialogue is invented and never attributed to the real people. Photos of the inspirations are not bundled; the team can add licensed photos in <code>public/inspired/</code>.</p>}
        <div className="cta-row"><button type="button" className="btn btn-primary" onClick={onStart}>Start a mission →</button></div>
      </div>
    </section>
  );
}
