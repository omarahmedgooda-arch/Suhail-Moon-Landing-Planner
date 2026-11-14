import { Avatar, SuhailStar } from './Avatar.jsx';
import { Rich, richLength, richPlain } from './ui.jsx';
import { useTypewriter } from '../hooks.js';
import { useMode } from './ModeContext.js';

/** Character speech bubble. The full text is always in the DOM (screen readers, stable layout);
 *  the typewriter only reveals it visually. `id` is an aspect id, 'guide' (Suhail) or 'leader' (Hakim). */
export function Speech({ id, mood = 'happy', name, role, text, typing = true, active = true, restartKey, size = 88, tone, side = 'left', children }) {
  const mode = useMode();
  const star = id === 'guide' || (id === 'leader' && mode === 'expert');
  const total = richLength(text);
  const n = useTypewriter(total, { active: typing && active, restartKey });
  const done = n >= total;
  return (
    <div className={`speech ${tone ? `tone-${tone}` : ''} who-${id} side-${side}`} style={{ '--av': `${size}px` }}>
      <div className="speech-av">{star ? <SuhailStar size={size} glow={id === 'leader'} /> : <Avatar id={id} mood={mood} size={size} />}</div>
      <div className="bubble">
        <div className="bubble-head"><strong>{name}</strong><span>{role}</span></div>
        <p className="bubble-text">
          <span className="ghost" aria-hidden="true">{richPlain(text)}</span>
          <span className="typed" aria-hidden={done ? undefined : 'true'}><Rich text={text} limit={n} /></span>
          <span className="sr-only">{richPlain(text)}</span>
        </p>
        {children}
      </div>
    </div>
  );
}
