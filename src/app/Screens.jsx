import { useState } from 'react';
import { tx, useLang, useT } from '../i18n.js';
import { PoleMap } from '../components/MapViews.jsx';
import { videoUrl } from '../components/RegionMedia.jsx';
import { useReducedMotion } from '../hooks.js';
import { Speech } from '../components/Speech.jsx';
import { SuhailStar } from '../components/Avatar.jsx';
import { StatusPill, Term } from '../components/ui.jsx';
import { GUIDE } from '../content/characters.js';
import { DATA_RESOURCES, STORY_RESOURCES, TEAM } from '../content/about.js';
import { VERDICT } from '../engine/rules.js';
import { requirementRows } from '../engine/report.js';
import { dayToIso, fmtDay, isoToDay, planMission, windowDays } from '../engine/plan.js';
import { DataWindowNote, ReasonChips, RequirementsEditor, SitePicker, StudentPicker, defaultExpert, studentToMission } from './Forms.jsx';

/* ------------------------------------------------------------------ home */
export function Home({ onStudent, onExpert }) {
  const t = useT();
  const lang = useLang();
  return (
    <section className="home calm" aria-labelledby="home-t">
      <div className="wrap">
        <header className="home-head">
          <SuhailStar size={120} label={t('Suhail, the guiding star', 'سهيل، النجم الهادي')} />
          <div>
            <p className="eyebrow">{t('Lunar Landing Site Navigator', 'دليل اختيار موقع الهبوط على القمر')}</p>
            <h1 className="display brand-word" id="home-t">SUHAIL</h1>
            <p className="lead">{t('Choosing where to land near the Moon’s south pole, explained and computed. SUHAIL is named after Suhail (Canopus), the star Arab navigators steered by.',
              'نختار أين نهبط قرب القطب الجنوبي للقمر، بالحساب والشرح. سُمّي المشروع على اسم نجم سهيل (Canopus)، النجم الذي اهتدى به الملاحون العرب.')}</p>
          </div>
        </header>

        <h2 className="sec-h">{t('Choose your mode', 'اختر الوضع')}</h2>
        <ul className="mode-cards">
          <li>
            <button type="button" className="mode-card" onClick={onStudent}>
              <span className="hc-k">{t('Student', 'للطلاب')}</span>
              <strong>{t('Lunar Landing Academy', 'أكاديمية الهبوط على القمر')}</strong>
              <span>{t('Watch two real missions that tipped over, learn the five things that decide a landing site, then save a mission run by a very silly crew.',
                'اتفرج على مهمتين حقيقيتين اتقلبوا على القمر، واتعلم الخمس حاجات اللي بتحدد مكان الهبوط، وبعدين أنقذ مهمة مع طاقم غلبان جدًا.')}</span>
              <span className="hc-go" aria-hidden="true">{t('Start learning →', 'يلا نتعلم ←')}</span>
            </button>
          </li>
          <li>
            <button type="button" className="mode-card" onClick={onExpert}>
              <span className="hc-k">{t('Expert', 'للخبراء')}</span>
              <strong>{t('Mission planner', 'مخطِّط المهمة')}</strong>
              <span>{t('Enter your mission’s requirements, screen NASA’s Artemis III regions on every date, simulate power and temperature, and get a go / no-go with dates.',
                'أدخل متطلبات مهمتك، وافحص مناطق Artemis III التابعة لناسا في كل تاريخ ممكن، وحاكِ الطاقة ودرجة الحرارة، واحصل على قرار الهبوط مع أفضل التواريخ.')}</span>
              <span className="hc-go" aria-hidden="true">{t('Plan a mission →', 'خطّط مهمة ←')}</span>
            </button>
          </li>
        </ul>

        <div className="about-grid">
          <section aria-labelledby="ov-t">
            <h2 className="sec-h" id="ov-t">{t('Overview', 'نظرة عامة')}</h2>
            <p>{t('Landers have reached the Moon and still failed because of where they touched down: a slope, a shadow, a hill between them and Earth. SUHAIL checks the five things that decide a landing site — solar radiation, thermal environment, Earth communication, terrain slope and distance to science targets — using real NASA elevation data and hour-by-hour Sun and Earth geometry.',
              'مركبات وصلت إلى القمر ثم فشلت بسبب المكان الذي هبطت فيه: منحدر، أو ظل، أو تل يحجب الأرض. يفحص سهيل العوامل الخمسة التي تحدد موقع الهبوط — الإشعاع الشمسي، والبيئة الحرارية، والاتصال بالأرض، وميل التضاريس، والقرب من الأهداف العلمية — باستخدام بيانات ارتفاعات حقيقية من ناسا ومواقع الشمس والأرض ساعة بساعة.')}</p>
          </section>
          <section aria-labelledby="team-t">
            <h2 className="sec-h" id="team-t">{t('The team', 'الفريق')}</h2>
            <p>{t(<><strong>{TEAM.name}</strong> is six engineering and computing students from three Egyptian universities, building SUHAIL for the {TEAM.event}, challenge “{TEAM.challenge}”.</>,
              <><strong>{TEAM.name}</strong>: ستة طلاب هندسة وحاسبات من ثلاث جامعات مصرية، صمّمنا سهيل لتحدي ناسا Space Apps بالقاهرة 2026، تحدي «{TEAM.challenge}».</>)}</p>
            <p className="team-links"><a href={TEAM.repo} target="_blank" rel="noreferrer">{t('Source code on GitHub ↗', 'الكود على GitHub ↗')}</a></p>
          </section>
        </div>

        <section aria-labelledby="mem-t" className="members">
          <h2 className="sec-h" id="mem-t">{t('Meet the team', 'تعرّف على الفريق')}</h2>
          <ul className="member-grid">
            {TEAM.members.map((m) => (
              <li key={m.name} className="member">
                <span className="member-mono" aria-hidden="true">{m.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('')}</span>
                <div className="member-body">
                  <strong>{tx(m, 'name', lang)}</strong>
                  <span className="member-field">{tx(m, 'field', lang) ?? tx(m, 'faculty', lang)}</span>
                  <span className="member-uni">{[m.field ? tx(m, 'faculty', lang) : null, tx(m, 'university', lang)].filter(Boolean).join(lang === 'ar' ? '، ' : ', ')}</span>
                  {m.linkedin && <a className="member-in" href={m.linkedin} target="_blank" rel="noreferrer" aria-label={`${m.name} on LinkedIn`}>LinkedIn ↗</a>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="res-t" className="resources">
          <h2 className="sec-h" id="res-t">{t('Resources we used', 'المصادر التي استخدمناها')}</h2>
          <h3 className="mini-h">{t('Data', 'البيانات')}</h3>
          <ul className="res-list">
            {DATA_RESOURCES.map((r) => (<li key={r.label + r.use}><a href={r.url} target="_blank" rel="noreferrer">{r.label} ↗</a><span className="muted small">{tx(r, 'use', lang)}</span></li>))}
          </ul>
          <h3 className="mini-h">{t('Mission stories', 'قصص المهمات')}</h3>
          <ul className="res-list">
            {STORY_RESOURCES.map((r) => (<li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.label} ↗</a></li>))}
          </ul>
          <p className="field-note">{t('Honest limits: the elevation grid is 80 m per pixel, Sun/Earth positions come from an astronomy model (not NASA SPICE), and the requirement levels are team assumptions, not NASA standards.',
            'حدود نذكرها بصراحة: دقة شبكة الارتفاعات 80 مترًا للبكسل، ومواقع الشمس والأرض محسوبة بنموذج فلكي (وليس NASA SPICE)، ومستويات المتطلبات افتراضات من الفريق وليست معايير ناسا.')}</p>
        </section>
      </div>
    </section>
  );
}

export function ExpertStart({ onNew, onReplan, onCast }) {
  const t = useT();
  return (
    <section className="stage" aria-labelledby="xs-t">
      <div className="wrap narrow">
        <p className="eyebrow">{t('Expert mode', 'وضع الخبراء')}</p>
        <h2 className="title" id="xs-t">{t('What do you want to do?', 'ماذا تريد أن تفعل؟')}</h2>
        <ul className="mode-cards">
          <li><button type="button" className="mode-card" onClick={onNew}><span className="hc-k">{t('Option 1', 'الخيار 1')}</span><strong>{t('Create a new mission', 'إنشاء مهمة جديدة')}</strong><span>{t('Enter the requirements; SUHAIL finds the best places and dates.', 'أدخل المتطلبات، ويجد سهيل أفضل المواقع والتواريخ.')}</span><span className="hc-go" aria-hidden="true">{t('Begin →', 'ابدأ ←')}</span></button></li>
          <li><button type="button" className="mode-card" onClick={onReplan}><span className="hc-k">{t('Option 2', 'الخيار 2')}</span><strong>{t('Replan an old mission', 'إعادة تخطيط مهمة سابقة')}</strong><span>{t('Enter the old plan, why it changed and the new terms.', 'أدخل الخطة القديمة وسبب تغييرها والشروط الجديدة.')}</span><span className="hc-go" aria-hidden="true">{t('Replan →', 'أعد التخطيط ←')}</span></button></li>
        </ul>
        <p className="home-learn"><button type="button" className="link-btn" onClick={onCast}>{t('Meet the council: the five specialists who argue about every site', 'تعرّف على المجلس: خمسة متخصصين يتناقشون في كل موقع')}</button></p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ new mission */
export function NewMission({ mode, data, student, setStudent, expert, setExpert, onCreate, busy }) {
  const allOff = mode === 'expert' && Object.values(expert.levels).every((l) => l === 'off');
  return (
    <section className="stage" aria-labelledby="new-t">
      <div className="wrap narrow">
        <p className="eyebrow">Step 1 · Assessment</p>
        <h2 className="title" id="new-t">{mode === 'expert' ? 'What does your mission need?' : 'What kind of mission is it?'}</h2>
        <p className="lead small">{mode === 'expert' ? 'Enter your requirements for the five aspects. SUHAIL will test every candidate site on every possible start date.' : 'Pick the one that sounds most like yours. SUHAIL turns it into limits for the five aspects.'}</p>
        <div className="panel">
          {mode === 'expert'
            ? <RequirementsEditor value={expert} onChange={setExpert} data={data} idp="new" mode={mode} />
            : <><StudentPicker value={student} onChange={setStudent} idp="new" mode={mode} /><DataWindowNote data={data} /></>}
          <div className="cta-row"><button type="button" className="btn btn-primary" disabled={busy || allOff} onClick={onCreate}>{busy ? 'Analysing…' : 'Create mission'}</button></div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ replan */
export function ReplanMission({ mode, data, draft, setDraft, onReplan, busy }) {
  const set = (patch) => setDraft({ ...draft, ...patch });
  const last = windowDays(data) - 1;
  const oldDay = isoToDay(data, draft.oldIso);
  const dateOk = oldDay >= 0 && oldDay <= last;
  const allOff = mode === 'expert' && Object.values(draft.newExpert.levels).every((l) => l === 'off');
  return (
    <section className="stage" aria-labelledby="rp-t">
      <div className="wrap narrow">
        <p className="eyebrow">Step 1 · Replan assessment</p>
        <h2 className="title" id="rp-t">Replan an old mission</h2>
        <p className="lead small">Tell us what the old plan was, why it has to change, and what the mission needs now. SUHAIL then runs the same analysis and shows how the old plan holds up.</p>

        <div className="panel">
          <h3 className="panel-title">1 · The old mission</h3>
          <div className="req-top">
            <label className="numfield wide" htmlFor="rp-site"><span>Planned landing site</span><SitePicker id="rp-site" data={data} value={draft.siteId} onChange={(v) => set({ siteId: v })} /></label>
            <label className="numfield" htmlFor="rp-date"><span>Planned start date</span><input id="rp-date" type="date" min={dayToIso(data, 0)} max={dayToIso(data, last)} value={draft.oldIso} onChange={(e) => set({ oldIso: e.target.value })} /></label>
          </div>
          {!dateOk && <p className="callout small" role="status">That date is outside the data ({fmtDay(data, 0)} → {fmtDay(data, last)}). SUHAIL can still replan, but it cannot test the old plan.</p>}
          {mode === 'expert'
            ? <details className="limits"><summary>Old requirements <span>(optional, to show what changed)</span></summary><RequirementsEditor value={draft.oldExpert} onChange={(v) => set({ oldExpert: v })} data={data} idp="old" showDates={false} /></details>
            : <><p className="panel-text small">Which kind of mission was it?</p><StudentPicker value={draft.oldStudent} onChange={(v) => set({ oldStudent: v })} idp="old" /></>}
        </div>

        <div className="panel">
          <h3 className="panel-title">2 · Why replan?</h3>
          <ReasonChips value={draft.reasons} onChange={(v) => set({ reasons: v })} />
          <label className="numfield wide" htmlFor="rp-note"><span>Anything else? (optional)</span><input id="rp-note" type="text" maxLength={140} value={draft.note} onChange={(e) => set({ note: e.target.value })} placeholder="For example: new rover is 40 kg heavier" /></label>
        </div>

        <div className="panel">
          <h3 className="panel-title">3 · The new terms</h3>
          {mode === 'expert'
            ? <>
                <div className="cta-row tight"><button type="button" className="btn btn-ghost" onClick={() => set({ newExpert: { ...draft.oldExpert, fromIso: draft.newExpert.fromIso, toIso: draft.newExpert.toIso, name: `${draft.oldExpert.name} (replan)` } })}>Copy the old requirements</button></div>
                <RequirementsEditor value={draft.newExpert} onChange={(v) => set({ newExpert: v })} data={data} idp="newr" />
              </>
            : <><StudentPicker value={draft.newStudent} onChange={(v) => set({ newStudent: v })} idp="newr" /><DataWindowNote data={data} /></>}
          <div className="cta-row"><button type="button" className="btn btn-primary" disabled={busy || allOff} onClick={onReplan}>{busy ? 'Analysing…' : 'Replan'}</button></div>
        </div>
      </div>
    </section>
  );
}

/** A believable starting point for the replan demo: the old plan is the best place and date for the
 *  old (small) mission, and the reasons already match what changed (longer mission, new science goal). */
export function defaultReplan(data) {
  const oldStudent = { presetId: 'fast-demo', durationDays: 4, batteryH: 36, levels: {} };
  const oldRun = planMission(data, studentToMission(oldStudent));
  const best = oldRun.places[0];
  return {
    siteId: best ? best.site.id : data.sites[0].id,
    oldIso: dayToIso(data, best ? best.day : Math.min(20, windowDays(data) - 12)),
    reasons: ['Mission got longer or shorter', 'New science target'], note: '',
    oldExpert: { ...defaultExpert('fast-demo', data), name: 'Old mission' }, newExpert: { ...defaultExpert('science-rover', data), name: 'Replanned mission' },
    oldStudent, newStudent: { presetId: 'science-rover', durationDays: 8, batteryH: 60, levels: {} },
  };
}

/* ------------------------------------------------------------------ map: top five places */
export function MapStage({ run, data, onStart, onBack, selected, setSelected }) {
  const { result, mission, intro } = run;
  const ln = intro.line;
  const reduced = useReducedMotion();
  const [introOn, setIntroOn] = useState(!reduced && !!videoUrl('intro-dive'));
  return (
    <section className="stage" aria-labelledby="map-t">
      <div className="wrap">
        <p className="eyebrow">Step 2 · The map</p>
        <h2 className="title" id="map-t">{result.hasWinner ? 'Your best five places' : 'The five nearest misses'}</h2>
        <div className="map-grid">
          <div className="map-left">
            {introOn && (
              <figure className="intro-dive">
                <video src={videoUrl('intro-dive')} autoPlay muted playsInline onEnded={() => setIntroOn(false)} />
                <figcaption><span className="muted small">Approaching the Moon… (illustrative footage)</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => setIntroOn(false)}>Skip ▸</button></figcaption>
              </figure>
            )}
            <PoleMap data={data} places={result.places} selected={selected} onSelect={setSelected} />
            <p className="map-cap">The Moon’s south pole seen from above. Outlined areas are NASA’s Artemis <Term k="region">candidate regions</Term>; dots are the {data.sites.length} points SUHAIL tested. Numbered markers are your top {result.places.length}. Shaded relief from NASA LOLA elevation data.</p>
          </div>
          <div className="map-right">
            <Speech id="guide" mood={ln.mood} name={GUIDE.name} role={GUIDE.role} text={ln.text} size={84} tone="guide" restartKey={run.madeAt} />
            <ol className="place-list" aria-label="The five places">
              {result.places.map((p) => (
                <li key={p.region}>
                  <button type="button" className={`place-row ${selected === p.region ? 'on' : ''}`} onClick={() => setSelected(p.region)} aria-pressed={selected === p.region}>
                    <span className="pr-n">{p.rank}</span>
                    <span className="pr-name"><strong>{p.regionName}</strong><small>site {p.site.name.split('·')[1]?.trim()}</small></span>
                    <StatusPill status={p.ev.verdict} label={VERDICT[p.ev.verdict].label} />
                    <span className="mono pr-score">{Math.round(p.ev.overall)}</span>
                  </button>
                </li>
              ))}
            </ol>
            <details className="limits">
              <summary>Your requirements</summary>
              <ul>{requirementRows(mission).map(([a, l, t]) => (<li key={a}><span>{a} · {l}</span><span className="mono">{t}</span></li>))}</ul>
            </details>
            <div className="cta-row tight">
              <button type="button" className="btn btn-primary" onClick={onStart}>Start the tour →</button>
              <button type="button" className="btn btn-ghost" onClick={onBack}>Change requirements</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
