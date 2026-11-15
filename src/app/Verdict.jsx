import { useEffect, useMemo, useRef, useState } from 'react';
import RegionMedia, { videoUrl } from '../components/RegionMedia.jsx';
import { EnergyCompare, EnergyPanel, SiteDossier } from './Science.jsx';
import { Speech } from '../components/Speech.jsx';
import { SkyView, Timeline } from '../components/SkyView.jsx';
import { StatusIcon, StatusPill, Term } from '../components/ui.jsx';
import { ASPECT_LABEL } from '../content/missions.js';
import { ORDER } from '../content/characters.js';
import { VERDICT } from '../engine/rules.js';
import { a_an, coord, metricText } from '../engine/banter.js';
import { fmtDay, fmtDayAr, fmtRange, fmtRangeAr } from '../engine/plan.js';
import { buildReportHtml, buildReportJson, downloadText, printHtml, requirementRows } from '../engine/report.js';
import { useReducedMotion } from '../hooks.js';
import { useLang, useT } from '../i18n.js';
import { ASPECT_LABEL_AR } from '../content/missions.js';
import { PlaceNumbers, RankTable, StartDays, limitText } from './Numbers.jsx';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'mission';

function SkyBlock({ site, day, mission, real }) {
  const hours = mission.durationDays * 24;
  const t0 = day * 24;
  const [scrub, setScrub] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setScrub(0); setPlaying(false); }, [day, site.id, mission.durationDays]);
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setScrub((s) => { if (s >= hours - 1) { setPlaying(false); return hours - 1; } return Math.min(hours - 1, s + 4); }), 110);
    return () => clearInterval(id);
  }, [playing, hours]);
  const t = Math.min(t0 + scrub, site.hourly.sun_el_deg.length - 1);
  const tr = useT();
  return (
    <div className="skyblock">
      <SkyView site={site} t={t} t0={t0} hours={hours} real={real} />
      <div className="sky-ctl">
        <button type="button" className="btn btn-ghost" aria-pressed={playing} onClick={() => { if (scrub >= hours - 1) setScrub(0); setPlaying((p) => !p); }}>{playing ? tr('❚❚ Pause', '❚❚ إيقاف مؤقت') : tr('▶ Play the mission', '▶ شغّل المهمة')}</button>
        <label className="range-label grow" htmlFor="v-scrub">{tr('Mission time:', 'زمن المهمة:')} <strong>{tr(`Day ${Math.floor(scrub / 24) + 1}, hour ${scrub % 24}`, `اليوم ${Math.floor(scrub / 24) + 1}، الساعة ${scrub % 24}`)}</strong></label>
        <input id="v-scrub" type="range" min="0" max={hours - 1} value={scrub} onChange={(e) => { setPlaying(false); setScrub(+e.target.value); }} />
      </div>
      <Timeline site={site} t0={t0} hours={hours} scrub={scrub} />
    </div>
  );
}

function ReplanCard({ rp, data, winner }) {
  const ar = useLang() === 'ar';
  const t = useT();
  const FD = ar ? fmtDayAr : fmtDay;
  const recAr = {
    keep: ['go', 'أبقِ على خطتك القديمة', 'ما زالت تجتاز كل القواعد تحت المتطلبات الجديدة.'],
    'move-better': ['marginal', 'يمكنك الإبقاء عليها، لكن يوجد موقع أفضل', `درجة ${winner.regionName} أصبحت أعلى بوضوح.`],
    shift: ['marginal', 'أبقِ الموقع وغيّر التاريخ', rp.shiftTo ? `الموقع نفسه يجتاز إذا بدأت في ${fmtDayAr(data, rp.shiftTo.day)}.` : ''],
    move: ['nogo', 'انتقل إلى موقع جديد', 'الموقع القديم يخالف قاعدة في كل تواريخ البدء الممكنة.'],
    unknown: ['unknown', 'تعذّر اختبار الخطة القديمة', 'تاريخ بدئها خارج نافذة البيانات.'],
  };
  const recEn = {
    keep: ['go', 'Keep your old plan', 'It still passes every rule under the new requirements.'],
    'move-better': ['marginal', 'You can keep it, but a better place exists', `${winner.regionName} now scores clearly higher.`],
    shift: ['marginal', 'Keep the site, change the date', rp.shiftTo ? `The same site passes starting ${fmtDay(data, rp.shiftTo.day)}.` : ''],
    move: ['nogo', 'Move to a new place', 'The old site breaks a rule on every possible start date.'],
    unknown: ['unknown', 'The old plan could not be tested', 'Its start date is outside the data window.'],
  };
  const rec = (ar ? recAr : recEn)[rp.recommendation];
  return (
    <div className="panel replan-card">
      <h3 className="panel-title">{t('Your old plan under the new requirements', 'خطتك القديمة تحت المتطلبات الجديدة')}</h3>
      {rp.site && <p className="panel-text">{t('Old plan:', 'الخطة القديمة:')} <strong>{rp.site.name}</strong>{rp.inWindow && <> {t('starting', 'تبدأ في')} <strong>{FD(data, rp.startDay)}</strong></>}. {t('Reasons you gave:', 'الأسباب التي ذكرتها:')} {rp.reasons.length ? rp.reasons.join(ar ? '، ' : ', ') : t('none selected', 'لم تختر سببًا')}.{rp.note && <> “{rp.note}”</>}</p>}
      <p className="rec"><StatusPill status={rec[0]} label={rec[1]} /> <span>{rec[2]}</span></p>
      {rp.underNew && (
        <div className="old-new">
          <div><h4>{t('Old plan, old requirements', 'الخطة القديمة بالمتطلبات القديمة')}</h4>{rp.underOld ? <p><StatusPill status={rp.underOld.verdict} label={VERDICT[rp.underOld.verdict].label} /> <span className="mono">{t('score', 'الدرجة')} {Math.round(rp.underOld.overall)}</span></p> : <p className="muted">{t('not tested', 'لم تُختبر')}</p>}</div>
          <div><h4>{t('Old plan, new requirements', 'الخطة القديمة بالمتطلبات الجديدة')}</h4><p><StatusPill status={rp.underNew.verdict} label={VERDICT[rp.underNew.verdict].label} /> <span className="mono">{t('score', 'الدرجة')} {Math.round(rp.underNew.overall)}</span></p></div>
        </div>
      )}
      {rp.underNew && !rp.underNew.eligible && (
        <ul className="reasons">{ORDER.filter((a) => ['nogo', 'unknown'].includes(rp.underNew.aspects[a].status)).map((a) => (<li key={a}><StatusIcon status={rp.underNew.aspects[a].status} size={18} /> <span><strong>{ar ? ASPECT_LABEL_AR[a] : ASPECT_LABEL[a]}</strong>: <span className="num">{rp.underNew.aspects[a].metrics.filter((m) => m.pass !== true).map((m) => `${metricText(m)} (${ar ? 'المطلوب' : 'needs'} ${limitText(m)})`).join(', ')}</span></span></li>))}</ul>
      )}
      {rp.changes.length > 0 && (
        <details className="limits" open>
          <summary>{t('What changed in the requirements', 'ما الذي تغيّر في المتطلبات')}</summary>
          <ul>{rp.changes.map((c) => (<li key={c.key}><span>{c.label ?? c.key}</span><span className="mono">{c.from ?? 'off'}{c.from == null ? '' : c.unit} → {c.to ?? 'off'}{c.to == null ? '' : c.unit}</span></li>))}</ul>
        </details>
      )}
    </div>
  );
}

/** Step 4: the leader gives the verdict, then the data that confirms it, then the report file. */
export default function Verdict({ run, data, mode, onReplan, onNew, onBack }) {
  const { result, mission, leader, replan, energy } = run;
  const reduced = useReducedMotion();
  const w = result.winner;
  const [count, setCount] = useState(mode === 'expert' ? leader.length : 1);
  const endRef = useRef(null);
  const nextRef = useRef(null);
  const first = useRef(true);
  const [note, setNote] = useState('');
  const done = count >= leader.length;
  const real = !data.is_sample;
  const t = useT();
  const lang = useLang();
  const ar = lang === 'ar';
  const FD = ar ? fmtDayAr : fmtDay, FR = ar ? fmtRangeAr : fmtRange;
  const coordL = (st) => (ar ? `${Math.abs(st.lat_deg).toFixed(2)}° جنوبًا، ${st.lon_deg.toFixed(2)}° شرقًا` : coord(st));
  const SHORT_AR = { go: 'جاهز للإطلاق', risky: 'يجتاز، لكن بهوامش ضيقة', nogo: 'يخالف قاعدة واحدة على الأقل' };

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    endRef.current?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    nextRef.current?.focus({ preventScroll: true });
  }, [count, reduced]);

  const html = useMemo(() => buildReportHtml(run, data), [run, data]);
  const file = `suhail-${run.kind}-${slug(mission.name)}`;
  const flash = (m) => { setNote(m); setTimeout(() => setNote(''), 5200); };
  const copyJson = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(buildReportJson(run, data), null, 2)); flash(t('Data copied to the clipboard as JSON.', 'نُسخت البيانات بصيغة JSON.')); }
    catch { flash(t('Your browser blocked copying. Use the Download button in the standalone version.', 'المتصفح منع النسخ. استخدم زر التنزيل في النسخة المستقلة.')); }
  };

  if (!w) return <section className="stage"><div className="wrap"><p>{t('No candidate sites in the data.', 'لا توجد مواقع مرشحة في البيانات.')}</p><button className="btn btn-ghost" onClick={onNew}>{t('Start over', 'ابدأ من جديد')}</button></div></section>;
  const ev = w.ev;

  return (
    <section className="stage" aria-labelledby="verdict-t">
      <div className="wrap">
        <p className="eyebrow">{t('Step 4 · The leader’s verdict', 'الخطوة 4 · قرار مدير الرحلة')}</p>
        <h2 className="title" id="verdict-t">{ev.eligible ? t(`Land at ${w.regionName}`, `اهبطوا في ${w.regionName}`) : t('No place passes every rule', 'لا يوجد موقع يجتاز كل القواعد')}</h2>

        <div className="chat leader-chat" role="log" aria-live="polite" aria-label={t('The leader speaking', 'مدير الرحلة يتحدث')}>
          {leader.slice(0, count).map((l, i) => (
            <Speech key={l.key} id="leader" mood={l.mood} name={l.name} role={l.role} text={l.text} size={88} typing={i === count - 1} active={i === count - 1} tone="leader" />
          ))}
          <div ref={endRef} />
        </div>
        {!done && (
          <div className="chat-ctl">
            <button ref={nextRef} type="button" className="btn btn-primary" onClick={() => setCount((c) => c + 1)}>{t('Next ▸', 'التالي ◂')}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setCount(leader.length)}>{t('Show everything', 'اعرض كل شيء')}</button>
          </div>
        )}

        {done && (
          <div className="verdict-data">
            <div className="hero-card">
              <div className="hero-card-main">
                <p className="eyebrow">{ev.eligible ? t('Best place to land', 'أفضل مكان للهبوط') : t('Nearest miss', 'الأقرب إلى النجاح')}</p>
                <h3 className="hero-name">{w.regionName} <small>{t('site', 'الموقع')} {w.site.name.split('·')[1]?.trim()}</small></h3>
                <p className="mono coords">{coordL(w.site)} · {t('elevation', 'الارتفاع')} <span className="num">{w.site.elevation_m} m</span></p>
                <p className={`stamp-verdict v-${ev.verdict}`}><StatusPill status={ev.verdict} label={VERDICT[ev.verdict].label} /> <span>{ar ? SHORT_AR[ev.verdict] : VERDICT[ev.verdict].short}</span></p>
                <dl className="kv">
                  <div><dt>{t('Overall score', 'الدرجة الإجمالية')}</dt><dd className="num">{Math.round(ev.overall)}<small>/100</small></dd></div>
                  <div><dt>{t('Best start', 'أفضل موعد للبدء')}</dt><dd>{FD(data, w.day)}</dd></div>
                  <div><dt>{t('Mission window (UTC)', 'نافذة المهمة (UTC)')}</dt><dd>{FR(data, w.day, mission.durationDays)}</dd></div>
                  <div><dt>{t('Start days that pass', 'أيام البدء الناجحة')}</dt><dd>{w.flex.eligibleDays}<small> {t('of', 'من')} {w.flex.totalDays}</small></dd></div>
                </dl>
              </div>
              <div className="hero-card-map"><RegionMedia data={data} regionId={w.region} site={w.site} startHour={w.day * 24} hours={mission.durationDays * 24} defaultTab="video" /></div>
            </div>

            <div className="panel"><h3 className="panel-title">{t('The five aspects, with numbers', 'الجوانب الخمسة بالأرقام')}</h3><PlaceNumbers ev={ev} caption={t(`Numbers for ${w.regionName}`, `أرقام ${w.regionName}`)} /></div>

            <div className="panel"><h3 className="panel-title">{t('Site dossier', 'ملف الموقع')} · {w.regionName}</h3><SiteDossier place={w} data={data} mission={mission} /></div>

            <div className="panel"><h3 className="panel-title">{t('Solar energy & thermal environment assessment', 'تقييم الطاقة الشمسية والبيئة الحرارية')}</h3>
              <p className="panel-text small">{t('Dynamic simulation for the chosen landing date and duration: irradiance, array power, loads, battery state of charge and surface temperature, hour by hour.', 'محاكاة لتاريخ الهبوط والمدة المختارين: الإشعاع، وقدرة الألواح، والأحمال، وشحن البطارية، وحرارة السطح، ساعة بساعة.')}</p>
              <EnergyPanel sim={energy[0]} data={data} day={w.day} mission={mission} />
            </div>

            <div className="panel"><h3 className="panel-title">{t('The five places under identical mission conditions', 'المواقع الخمسة تحت شروط المهمة نفسها')}</h3><EnergyCompare places={result.places} data={data} mission={mission} /></div>

            {replan && <ReplanCard rp={replan} data={data} winner={w} />}

            <div className="panel"><h3 className="panel-title">{t('The five places compared', 'مقارنة المواقع الخمسة')}</h3><RankTable places={result.places} data={data} highlight={w.region} /></div>

            <div className="panel">
              <h3 className="panel-title">{t('Which start days work here', 'أيام البدء التي تنجح هنا')}</h3>
              <p className="panel-text small">{t(`SUHAIL tested every possible start day for ${a_an(mission.durationDays)} ${mission.durationDays}-day mission at this site.`, `اختبر سهيل كل يوم بدء ممكن لمهمة مدتها ${mission.durationDays} يومًا في هذا الموقع.`)}</p>
              <StartDays flex={w.flex} bestDay={w.day} data={data} />
            </div>

            <div className="panel">
              <h3 className="panel-title">{t('The sky from this site during your mission', 'السماء من هذا الموقع أثناء مهمتك')}</h3>
              <p className="panel-text small">{ar ? <>حرّك شريط الزمن وشاهد <Term k="elevation">الشمس والأرض</Term> تتحركان على امتداد <Term k="horizon">الأفق</Term>. وعندما يغطيهما خط الأرض تختفيان.</> : <>Scrub through the mission and watch the <Term k="elevation">Sun and Earth</Term> slide along the <Term k="horizon">horizon</Term>. When the ground outline covers them, they are hidden.</>}</p>
              <SkyBlock site={w.site} day={w.day} mission={mission} real={real} />
            </div>

            <div className="panel report-panel">
              <h3 className="panel-title">{t('The report file', 'ملف التقرير')}</h3>
              <p className="panel-text">{t('One file with your requirements, all five places, what the council said, the leader’s advice, the numbers and the dates.', 'ملف واحد فيه متطلباتك، والمواقع الخمسة، وما قاله المجلس، ونصيحة مدير الرحلة، والأرقام والتواريخ. (التقرير باللغة الإنجليزية)')}</p>
              <div className="cta-row">
                <button type="button" className="btn btn-primary" onClick={() => downloadText(`${file}.html`, html, 'text/html')}>{t('Download report (HTML)', 'نزّل التقرير (HTML)')}</button>
                <button type="button" className="btn btn-ghost" onClick={() => downloadText(`${file}.json`, JSON.stringify(buildReportJson(run, data), null, 2), 'application/json')}>{t('Download data (JSON)', 'نزّل البيانات (JSON)')}</button>
                <button type="button" className="btn btn-ghost" onClick={() => printHtml(html)}>{t('Print / save as PDF', 'اطبع / احفظ PDF')}</button>
                <button type="button" className="btn btn-ghost" onClick={copyJson}>{t('Copy data', 'انسخ البيانات')}</button>
              </div>
              {note && <p className="callout small" role="status">{note}</p>}
              <details className="limits"><summary>{t('Preview the report', 'معاينة التقرير')}</summary><iframe className="report-frame" title="Report preview" srcDoc={html} sandbox="" /></details>
              <details className="limits"><summary>{t('Your requirements', 'متطلباتك')}</summary><ul>{requirementRows(mission, lang).map(([a, l, t]) => (<li key={a}><span>{a} · {l}</span><span className="mono">{t}</span></li>))}</ul></details>
            </div>

            <div className="panel honest">
              <h3 className="panel-title">{t('How far to trust this', 'إلى أي حد يمكن الوثوق بهذا')}</h3>
              <ul className="honest-list">
                {ar ? (<>
                  <li><strong>حقيقي:</strong> التضاريس والمنحدرات والفوهات المظللة من بيانات الارتفاع <Term k="lola">LOLA</Term> التابعة لناسا، والمناطق هي المناطق المرشحة لبرنامج Artemis.</li>
                  <li><strong>قريب لا مطابق:</strong> مواقع الشمس والأرض من نموذج فلكي، وليست من ملفات SPICE التابعة لناسا بعد. والفرق جزء صغير من الدرجة، لكنه يهم قرب الأفق.</li>
                  <li><strong>لا يظهر هنا:</strong> دقة الشبكة 80 مترًا للبكسل، فالصخور والفوهات الصغيرة لا تظهر. والموقع الذي يجتاز هنا ما زال يحتاج فحصًا عن قرب.</li>
                  <li><strong>افتراضات:</strong> مستويات الأهمية وأرقامها الافتراضية من وضع الفريق، وليست معايير ناسا، ويمكن تغييرها في وضع الخبراء.</li>
                </>) : (<>
                <li><strong>Real:</strong> terrain, slopes and shadowed craters come from NASA’s <Term k="lola">LOLA</Term> elevation data. The five regions are NASA’s Artemis candidate regions.</li>
                <li><strong>Close, not exact:</strong> the Sun and Earth positions come from an astronomy model, not NASA’s SPICE files yet. It should be within a small fraction of a degree, which matters near the horizon.</li>
                <li><strong>Not visible here:</strong> the elevation grid is 80 m per pixel, so boulders and small craters are invisible. A site that passes here still needs a close-up check.</li>
                <li><strong>Assumptions:</strong> the importance levels and their default numbers are the team’s own, not NASA standards. Change them in Expert mode.</li>
                </>)}
              </ul>
            </div>

            <div className="cta-row end">
              <button type="button" className="btn btn-primary" onClick={onReplan}>{t('Replan this mission', 'أعد تخطيط هذه المهمة')}</button>
              <button type="button" className="btn btn-ghost" onClick={onNew}>{t('Start a new mission', 'ابدأ مهمة جديدة')}</button>
              <button type="button" className="btn btn-ghost" onClick={onBack}>{t('← Back to the council', '→ العودة إلى المجلس')}</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
