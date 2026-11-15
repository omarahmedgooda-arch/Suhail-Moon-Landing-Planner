import { LogoMark } from '../components/Avatar.jsx';
import { useT } from '../i18n.js';

const STEPS = [
  { id: 'form', n: '1', label: 'Requirements', ar: 'المتطلبات' },
  { id: 'map', n: '2', label: 'Map', ar: 'الخريطة' },
  { id: 'council', n: '3', label: 'Council', ar: 'المجلس' },
  { id: 'verdict', n: '4', label: 'Verdict', ar: 'القرار' },
];

export default function TopBar({ lang, setLang, mode, setMode, view, hasRun, onNav, onHome, onBack, isSample }) {
  const inFlow = mode === 'expert' && ['new', 'replan', 'map', 'council', 'verdict'].includes(view);
  const cur = view === 'new' || view === 'replan' ? 'form' : view;
  const order = STEPS.map((s) => s.id);
  const t = useT();
  return (
    <header className="topbar">
      <div className="topbar-in">
        {view !== 'home' && <button type="button" className="back-btn" onClick={onBack} aria-label={t('Go back', 'رجوع')}>{t('←', '→')} <span>{t('Back', 'رجوع')}</span></button>}
        <button type="button" className="brand" onClick={onHome} aria-label="SUHAIL – back to the start">
          <LogoMark /><span className="brand-name">SUHAIL</span>
        </button>
        {view !== 'home' && <span className="mode-chip">{mode === 'expert' ? t('Expert mode', 'وضع الخبراء') : t('Student mode', 'وضع الطلاب')}</span>}
        {inFlow && (
          <nav className="acts" aria-label="Steps">
            {STEPS.map((s) => {
              const reachable = s.id === 'form' || hasRun;
              const on = cur === s.id;
              const done = order.indexOf(s.id) < order.indexOf(cur);
              return (
                <button key={s.id} type="button" className={`act-link ${on ? 'on' : ''} ${done ? 'done' : ''}`} disabled={!reachable} aria-current={on ? 'step' : undefined}
                  onClick={() => onNav(s.id === 'form' ? (view === 'replan' ? 'replan' : 'new') : s.id)}>
                  <span className="act-n">{s.n}</span><span className="act-t">{t(s.label, s.ar)}</span>
                </button>
              );
            })}
          </nav>
        )}
        <div className="lang-switch" role="group" aria-label="Language / اللغة">
          <button type="button" lang="en" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
          <button type="button" lang="ar" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')}>عربي</button>
        </div>
      </div>
    </header>
  );
}
