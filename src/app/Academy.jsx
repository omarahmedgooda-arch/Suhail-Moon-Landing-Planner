import { useState } from 'react';
import { Avatar } from '../components/Avatar.jsx';
import { SourceLink } from '../components/ui.jsx';
import StoryScene from '../components/StoryScene.jsx';
import { castFor } from '../content/cast.js';
import { tx, useLang, useT } from '../i18n.js';
import Game from './Game.jsx';
import { ACADEMY_ASPECTS, MISSION_STORIES } from '../content/academy.js';

const cast = castFor('student');
const STAGES = [
  { id: 'watch', n: '01', title: 'Mission stories', blurb: 'Two real lunar landers, what they set out to do and what went wrong on touchdown.', cta: 'Start watching',
    title_ar: 'قصص المهمات', blurb_ar: 'مركبتين حقيقيتين نزلوا على القمر: كانوا رايحين يعملوا إيه، وإيه اللي باظ لحظة الهبوط.', cta_ar: 'يلا نتفرج' },
  { id: 'learn', n: '02', title: 'Become a landing expert', blurb: 'The five aspects scientists check before choosing where to land.', cta: 'Start learning',
    title_ar: 'خليك خبير هبوط', blurb_ar: 'الخمس حاجات اللي العلماء بيراجعوها قبل ما يختاروا مكان الهبوط.', cta_ar: 'يلا نتعلم' },
  { id: 'play', n: '03', title: 'Try it yourself: Save the Mission', blurb: 'A 2D game: command a very silly crew, make five landing decisions and keep the lander alive.', cta: 'Play now',
    title_ar: 'جرّب بنفسك: أنقذ المهمة', blurb_ar: 'لعبة 2D: قود طاقم أفكاره عجيبة جدًا، خد خمس قرارات هبوط، وخلي المركبة عايشة.', cta_ar: 'العب دلوقتي' },
];

function StageBar({ stage, done, onGo }) {
  const lang = useLang();
  return (
    <ol className="ac-steps" aria-label={lang === 'ar' ? 'مراحل الأكاديمية' : 'Academy stages'}>
      {STAGES.map((s) => (
        <li key={s.id}><button type="button" className={`ac-step ${stage === s.id ? 'on' : ''} ${done[s.id] ? 'done' : ''}`} aria-current={stage === s.id ? 'step' : undefined} onClick={() => onGo(s.id)}>
          <span className="ac-n">{done[s.id] ? '✓' : s.n}</span><span>{tx(s, 'title', lang)}</span></button></li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ WATCH */
function Story({ m, onDone }) {
  const lang = useLang();
  const t = useT();
  const L = cast.leader;
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
        {st.badge && <div className="ms-badge"><strong>{tx(st, 'badge', lang)}</strong><span>{t('on the Moon', 'على القمر')}</span></div>}
      </div>
      <p className="ms-k">{tx(m, 'name', lang)} · {tx(st, 'k', lang)}</p>
      <div className="ms-say" key={`say-${m.id}-${i}`}>
        <Avatar id="leader" mood={st.guess ? 'thinking' : last ? 'happy' : 'happy'} size={110} mode="student" />
        <div className="bubble"><div className="bubble-head"><strong>{tx(L, 'name', lang)}</strong><span>{tx(L, 'role', lang)}</span></div>
          <p>{tx(st, 'say', lang)}</p>
          {g && <p className="small" role="status" style={{ marginTop: 8 }}>{g.ok ? t('Exactly right! Let’s see it happen.', 'إجابة صحيحة تمامًا! لنرَ ما حدث.') : t('Good guess, but not this time. Let’s see what really happened.', 'تخمين جيد، لكن ليس هذه المرة. لنرَ ما حدث فعلًا.')}</p>}
        </div>
      </div>
      {st.guess && (
        <ul className="ms-guess" aria-label={t('Your guess', 'تخمينك')}>
          {st.guess.options.map((o, k) => (
            <li key={o.t}><button type="button" disabled={guess != null} aria-pressed={guess === k}
              className={guess == null ? '' : o.ok ? 'right' : guess === k ? 'wrong' : ''} onClick={() => pickGuess(k)}>{tx(o, 't', lang)}</button></li>
          ))}
        </ul>
      )}
      <div className="ms-nav">
        <div className="dots" aria-label={t(`Step ${i + 1} of ${m.steps.length}`, `المشهد ${i + 1} من ${m.steps.length}`)}>
          {m.steps.map((x, k) => (<button key={k} type="button" className={`dot ${k === i ? 'on' : ''} ${k < i ? 'seen' : ''}`} aria-label={`${t('Step', 'المشهد')} ${k + 1}: ${tx(x, 'k', lang)}`} disabled={k > i} onClick={() => go(k)} />))}
        </div>
        <button type="button" className="btn btn-ghost" disabled={i === 0} onClick={() => go(i - 1)}>{t('← Back', '→ رجوع')}</button>
        {!last && <button type="button" className="btn btn-primary" disabled={needGuess} onClick={() => go(i + 1)}>{needGuess ? t('Make a guess first', 'خمّن الأول') : t('Next →', 'التالي ←')}</button>}
        {!last && <button type="button" className="btn btn-ghost ms-skip" onClick={() => go(m.steps.length - 1)}>{t('Skip to the lesson', 'روح للدرس على طول')}</button>}
      </div>
      <SourceLink source={m.source} />
    </div>
  );
}

function Watch({ onNext }) {
  const lang = useLang();
  const t = useT();
  const [cur, setCur] = useState(MISSION_STORIES[0].id);
  const [seen, setSeen] = useState({});
  const m = MISSION_STORIES.find((x) => x.id === cur);
  const allSeen = MISSION_STORIES.every((x) => seen[x.id]);
  return (
    <section aria-labelledby="ac-watch">
      <h3 className="title" id="ac-watch">{t('Mission stories', 'قصص المهمات')}</h3>
      <p className="lead small">{t('Reaching the Moon is not enough. Two landers made it to the surface near the south pole, and both ended up on their side. Watch what happened, and guess before the Wise Doctor tells you.', 'الوصول للقمر مش كفاية. مركبتين وصلوا للسطح قرب القطب الجنوبي، والاتنين اتقلبوا على جنبهم. اتفرج على اللي حصل، وخمّن قبل ما الدكتور الحكيم يقولك.')}</p>
      <div className="ms-tabs" role="tablist" aria-label={t('Missions', 'المهمات')}>
        {MISSION_STORIES.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={cur === x.id} className={`ms-tab ${seen[x.id] ? 'done' : ''}`} onClick={() => setCur(x.id)}>
            <strong>{tx(x, 'name', lang)}</strong><span>{x.code} · {x.year}</span>
          </button>
        ))}
      </div>
      <Story key={m.id} m={m} onDone={() => setSeen((s) => ({ ...s, [m.id]: true }))} />
      {seen[m.id] && !allSeen && (
        <div className="cta-row"><button type="button" className="btn btn-primary" onClick={() => setCur(MISSION_STORIES.find((x) => !seen[x.id]).id)}>{t('Next mission:', 'المهمة اللي بعدها:')} {tx(MISSION_STORIES.find((x) => !seen[x.id]), 'name', lang)} {t('→', '←')}</button></div>
      )}
      {allSeen && (<>
        <p className="callout">{t('Landing on the Moon is only the beginning. Choosing the right landing site can make all the difference!', 'الهبوط على القمر مجرد البداية. اختيار المكان الصح هو اللي بيفرق!')}</p>
        <div className="cta-row"><button type="button" className="btn btn-primary" onClick={onNext}>{t('Ready to discover how scientists choose a landing site? →', 'جاهز تعرف العلماء بيختاروا مكان الهبوط إزاي؟ ←')}</button></div>
      </>)}
      {!allSeen && <div className="cta-row"><button type="button" className="btn btn-ghost" onClick={onNext}>{t('Skip to the five aspects →', 'روح للخمس حاجات على طول ←')}</button></div>}
    </section>
  );
}

/* ------------------------------------------------------------------ LEARN */
function Learn({ onNext }) {
  const lang = useLang();
  const t = useT();
  const [i, setI] = useState(0);
  const [ans, setAns] = useState({});
  const a = ACADEMY_ASPECTS[i];
  const who = cast.members[a.id];
  const picked = ans[a.id];
  const last = i === ACADEMY_ASPECTS.length - 1;
  return (
    <section aria-labelledby="ac-learn">
      <h3 className="title" id="ac-learn">{t('The five aspects', 'الخمس حاجات')}</h3>
      <div className="dots" aria-label={t(`Aspect ${i + 1} of 5`, `الحاجة ${i + 1} من 5`)}>{ACADEMY_ASPECTS.map((x, k) => (<button key={x.id} type="button" className={`dot ${k === i ? 'on' : ''} ${ans[x.id] != null ? 'seen' : ''}`} aria-label={`${t('Aspect', 'الحاجة')} ${k + 1}: ${tx(x, 'name', lang)}`} onClick={() => setI(k)} />))}</div>
      <article className="aspect-card panel">
        <div className="aspect-head"><Avatar id={a.id} mood="happy" size={120} mode="student" /><div><p className="eyebrow">{t('Aspect', 'الحاجة')} {a.n}</p><h4 className="story-name">{tx(a, 'name', lang)}</h4><p className="muted small">{t('Crew member in charge:', 'المسؤول عنها في الطاقم:')} <strong>{tx(who, 'name', lang)}</strong></p></div></div>
        <dl className="story-dl">
          <div><dt>{t('What is it?', 'يعني إيه؟')}</dt><dd>{tx(a, 'what', lang)}</dd></div>
          <div><dt>{t('Why does it matter?', 'ليه مهمة؟')}</dt><dd>{tx(a, 'why', lang)}</dd></div>
          <div><dt>{t('What happens if we ignore it?', 'لو طنّشناها يحصل إيه؟')}</dt><dd>{tx(a, 'ignore', lang)}</dd></div>
        </dl>
        <div className="quick-q">
          <p><strong>{t('Quick check:', 'سؤال سريع:')}</strong> {tx(a, 'q', lang)}</p>
          <div className="cta-row tight">
            {[true, false].map((v) => (<button key={String(v)} type="button" className={`btn ${picked === v ? (v === a.a ? 'btn-primary' : 'btn-wrong') : 'btn-ghost'}`} aria-pressed={picked === v} onClick={() => setAns((x) => ({ ...x, [a.id]: v }))}>{v ? t('Yes', 'آه') : t('No', 'لأ')}</button>))}
          </div>
          {picked != null && <p className={`callout small ${picked === a.a ? '' : 'warn'}`} role="status">{picked === a.a ? tx(a, 'fb', lang) : (lang === 'ar' ? `مش بالظبط. ${tx(a, 'fb', lang).replace(/^صح: /, '')}` : `Not quite. ${a.fb.replace(/^Right: /, '')}`)}</p>}
        </div>
      </article>
      <div className="cta-row">
        <button type="button" className="btn btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>{t('← Previous', '→ اللي قبلها')}</button>
        {!last && <button type="button" className="btn btn-primary" onClick={() => setI(i + 1)}>{t('Next aspect →', 'اللي بعدها ←')}</button>}
        {last && <button type="button" className="btn btn-primary" onClick={onNext}>{t('Start the mission game! →', 'يلا نلعب لعبة المهمة! ←')}</button>}
      </div>
      {last && <p className="callout">{t('Excellent! You now know the five aspects of choosing a lunar landing site. But can you use them to save a real mission?', 'ممتاز! دلوقتي إنت عارف الخمس حاجات اللي بيتختار بيها مكان الهبوط. بس تقدر تستخدمهم وتنقذ مهمة بجد؟')}</p>}
    </section>
  );
}

/** Student "Lunar Landing Academy": WATCH → LEARN → PLAY, then hand over to the real planner. */
export default function Academy({ onHome }) {
  const lang = useLang();
  const t = useT();
  const [stage, setStage] = useState(null);
  const [done, setDone] = useState({});
  const finish = (id, next) => { setDone((d) => ({ ...d, [id]: true })); setStage(next); window.scrollTo?.({ top: 0 }); };
  return (
    <section className="stage academy" aria-labelledby="ac-t">
      <div className="wrap">
        <p className="eyebrow">{t('Student mode', 'وضع الطلاب')}</p>
        <h2 className="display" id="ac-t">{t('Lunar Landing Academy', 'أكاديمية الهبوط على القمر')}</h2>
        <p className="lead">{t('Your mission to become a Lunar Landing Expert starts here!', 'رحلتك علشان تبقى خبير هبوط على القمر بتبدأ من هنا!')} <span className="muted">{t('Watch → Learn → Play.', 'اتفرج ← اتعلم ← العب.')}</span></p>
        {stage == null ? (
          <>
            <ul className="ac-cards">
              {STAGES.map((s) => (
                <li key={s.id}><button type="button" className="home-card" onClick={() => setStage(s.id)}>
                  <span className="hc-k">{t('Stage', 'المرحلة')} {s.n}{done[s.id] ? t(' · done ✓', ' · خلصت ✓') : ''}</span><strong>{tx(s, 'title', lang)}</strong><span>{tx(s, 'blurb', lang)}</span><span className="hc-go" aria-hidden="true">{tx(s, 'cta', lang)} {t('→', '←')}</span>
                </button></li>
              ))}
            </ul>
            <div className="crew-strip" aria-label={t('The crew', 'الطاقم')}>
              {['terrain', 'sunlight', 'night', 'comms', 'science'].map((a) => (<figure key={a}><Avatar id={a} mood="happy" size={110} mode="student" /><figcaption><strong>{tx(cast.members[a], 'name', lang)}</strong><small>{tx(cast.members[a], 'role', lang)}</small></figcaption></figure>))}
              <figure><Avatar id="leader" mood="happy" size={110} mode="student" /><figcaption><strong>{tx(cast.leader, 'name', lang)}</strong><small>{tx(cast.leader, 'role', lang)}</small></figcaption></figure>
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
