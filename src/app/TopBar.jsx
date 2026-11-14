import { LogoMark } from '../components/Avatar.jsx';

const STEPS = [
  { id: 'form', n: '1', label: 'Requirements' },
  { id: 'map', n: '2', label: 'Map' },
  { id: 'council', n: '3', label: 'Council' },
  { id: 'verdict', n: '4', label: 'Verdict' },
];

export default function TopBar({ mode, setMode, view, hasRun, onNav, onHome, onBack, isSample }) {
  const inFlow = mode === 'expert' && ['new', 'replan', 'map', 'council', 'verdict'].includes(view);
  const cur = view === 'new' || view === 'replan' ? 'form' : view;
  const order = STEPS.map((s) => s.id);
  return (
    <header className="topbar">
      <div className="topbar-in">
        {view !== 'home' && <button type="button" className="back-btn" onClick={onBack} aria-label="Go back">← <span>Back</span></button>}
        <button type="button" className="brand" onClick={onHome} aria-label="SUHAIL – back to the start">
          <LogoMark /><span className="brand-name">SUHAIL</span>
        </button>
        {view !== 'home' && <span className="mode-chip">{mode === 'expert' ? 'Expert mode' : 'Student mode'}</span>}
        {inFlow && (
          <nav className="acts" aria-label="Steps">
            {STEPS.map((s) => {
              const reachable = s.id === 'form' || hasRun;
              const on = cur === s.id;
              const done = order.indexOf(s.id) < order.indexOf(cur);
              return (
                <button key={s.id} type="button" className={`act-link ${on ? 'on' : ''} ${done ? 'done' : ''}`} disabled={!reachable} aria-current={on ? 'step' : undefined}
                  onClick={() => onNav(s.id === 'form' ? (view === 'replan' ? 'replan' : 'new') : s.id)}>
                  <span className="act-n">{s.n}</span><span className="act-t">{s.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
