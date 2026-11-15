import { useState } from 'react';
import { Avatar } from '../components/Avatar.jsx';
import { SourceLink, StatusIcon, StatusPill, STATUS_WORD, STATUS_WORD_AR } from '../components/ui.jsx';
import { ASPECT_LABEL } from '../content/missions.js';
import { CHARACTERS, ORDER } from '../content/characters.js';
import { limitSentence } from '../engine/dialogue.js';
import { METRIC_UNIT, VERDICT } from '../engine/rules.js';
import { metricText } from '../engine/banter.js';
import { dayDate } from '../engine/plan.js';
import { useLang, useT } from '../i18n.js';
import { ASPECT_LABEL_AR } from '../content/missions.js';

const CMP = { sunPct: '≥', earthPct: '≥', maxDarkH: '<', earthGapH: '≤', slopeDeg: '≤', psrKm: '≤' };
export const limitText = (m) => `${CMP[m.key]} ${m.limit}${METRIC_UNIT[m.key]}`;
const SHORT = { sunPct: 'Sun up', maxDarkH: 'Longest dark', earthPct: 'Earth visible', earthGapH: 'Longest gap', slopeDeg: 'Slope', psrKm: 'Nearest shadowed crater' };
const SHORT_AR = { sunPct: 'الشمس ظاهرة', maxDarkH: 'أطول ظلام', earthPct: 'الأرض ظاهرة', earthGapH: 'أطول انقطاع', slopeDeg: 'الميل', psrKm: 'أقرب فوهة مظللة' };
const UNIT_AR = { maxDarkH: ' ساعة', earthGapH: ' ساعة', psrKm: ' كم' };
const mText = (m, ar) => (ar ? (m.value == null ? 'لا بيانات' : `${Math.round(m.value * 10) / 10}${UNIT_AR[m.key] ?? METRIC_UNIT[m.key]}`) : metricText(m));
const lText = (m, ar) => (ar ? `${CMP[m.key]} ${m.limit}${UNIT_AR[m.key] ?? METRIC_UNIT[m.key]}` : limitText(m));

/** "Why does this matter?" card, same copy as the story. */
export function LearnCard({ aspect, ev, mission }) {
  const L = CHARACTERS[aspect].learn;
  const ar = useLang() === 'ar';
  const g = (k) => (ar && L[`${k}_ar`] ? L[`${k}_ar`] : L[k]);
  return (
    <div className="learn">
      <h4>{g('title')}</h4>
      <p>{g('what')}</p>
      <p><strong>{ar ? 'كيف يتحقق سهيل.' : 'How SUHAIL checks.'}</strong> {g('how')}</p>
      <p className="limit-sentence">{limitSentence(aspect, ev, mission, ar ? 'ar' : 'en')}</p>
      <p className="real"><strong>{ar ? 'حالة حقيقية.' : 'A real case.'}</strong> {ar && L.real_ar ? L.real_ar : L.real.text}</p>
      <SourceLink source={L.real.source} />
    </div>
  );
}

export function WhyButton({ aspect, ev, mission }) {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <>
      <button type="button" className="why-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? t('Hide', 'إخفاء') : t('Why?', 'لماذا؟')}</button>
      {open && <LearnCard aspect={aspect} ev={ev} mission={mission} />}
    </>
  );
}

/** The five aspects of one evaluation: value, your limit, status. */
export function PlaceNumbers({ ev, caption }) {
  const ar = useLang() === 'ar';
  const t = useT();
  return (
    <div className="table-scroll">
      <table className="bench nums">
        <caption className="sr-only">{caption ?? t('The five aspects: measured value, your limit and the result', 'الجوانب الخمسة: القيمة المقيسة، وحدّك، والنتيجة')}</caption>
        <thead><tr><th scope="col">{t('Aspect', 'الجانب')}</th><th scope="col">{t('This place', 'هذا الموقع')}</th><th scope="col">{t('Your limit', 'حدّك')}</th><th scope="col">{t('Result', 'النتيجة')}</th></tr></thead>
        <tbody>
          {ORDER.map((a) => {
            const as = ev.aspects[a];
            return (
              <tr key={a} className={as.status === 'nogo' ? 'is-out' : ''}>
                <th scope="row"><span className="who"><Avatar id={a} mood={as.status === 'off' ? 'asleep' : as.status === 'go' ? 'happy' : as.status === 'marginal' ? 'nervous' : 'worried'} size={30} />{ar ? ASPECT_LABEL_AR[a] : ASPECT_LABEL[a]}</span></th>
                <td className="mono">{as.status === 'off' ? '—' : as.metrics.map((m) => <span key={m.key} className="line">{ar ? SHORT_AR[m.key] : SHORT[m.key]} <span className="num">{mText(m, ar)}</span></span>)}</td>
                <td className="mono">{as.status === 'off' ? '—' : as.metrics.map((m) => <span key={m.key} className="line num">{lText(m, ar)}</span>)}</td>
                <td><StatusPill status={as.status} />{as.score != null && <small className="mono"> {Math.round(as.score)}/100</small>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The five places side by side. */
export function RankTable({ places, data, highlight }) {
  const ar = useLang() === 'ar';
  const t = useT();
  return (
    <div className="table-scroll">
      <table className="bench rank-table">
        <caption className="sr-only">{t('The five places compared on the five aspects', 'مقارنة المواقع الخمسة في الجوانب الخمسة')}</caption>
        <thead>
          <tr><th scope="col">#</th><th scope="col">{t('Place', 'الموقع')}</th><th scope="col">{t('Best start', 'أفضل بدء')}</th><th scope="col">{t('Score', 'الدرجة')}</th>{ORDER.map((a) => (<th scope="col" key={a}>{ar ? ASPECT_LABEL_AR[a] : ASPECT_LABEL[a]}</th>))}</tr>
        </thead>
        <tbody>
          {places.map((p) => (
            <tr key={p.region} className={highlight === p.region ? 'is-in' : ''}>
              <td className="mono">{p.rank}</td>
              <th scope="row">{p.regionName}<small>{t('site', 'الموقع')} {p.site.name.split('·')[1]?.trim()}</small></th>
              <td className="mono">{dayDate(data, p.day).toLocaleDateString(ar ? 'ar-EG-u-nu-latn' : 'en-GB', { day: 'numeric', month: ar ? 'long' : 'short', timeZone: 'UTC' })}</td>
              <td className="result"><span className="mono">{Math.round(p.ev.overall)}</span><small>{ar ? { go: 'مناسب', risky: 'بحذر', nogo: 'غير مناسب' }[p.ev.verdict] : VERDICT[p.ev.verdict].label}</small></td>
              {ORDER.map((a) => {
                const as = p.ev.aspects[a];
                return (
                  <td key={a} className={`cell s-${as.status}`}>
                    <StatusIcon status={as.status} size={18} />
                    <span className="mono num">{as.status === 'off' ? '—' : as.metrics.map((m) => mText(m, ar)).join('\n')}</span>
                    <span className="sr-only"> {ar ? STATUS_WORD_AR[as.status] : STATUS_WORD[as.status]}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One bar per possible start day: how good a start on that day would be at this site. */
export function StartDays({ flex, bestDay, data }) {
  const ar = useLang() === 'ar';
  const n = flex.days.length, W = 720, bw = W / n;
  const month = (d) => dayDate(data, d).toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { month: ar ? 'long' : 'short', timeZone: 'UTC' });
  const ticks = flex.days.filter((d, i) => i === 0 || month(d.day) !== month(flex.days[i - 1].day));
  return (
    <figure className="startdays">
      <svg viewBox={`0 0 ${W} 112`} role="img" aria-label={ar ? `أيام البدء المختبرة في هذا الموقع: ${flex.eligibleDays} من ${flex.totalDays} تجتاز كل القواعد.` : `Start days tested at this site: ${flex.eligibleDays} of ${flex.totalDays} pass every rule.`}>
        <defs><pattern id="sd-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--ink)" /><path d="M0 0v5" stroke="var(--cream)" strokeWidth="1.6" /></pattern></defs>
        {flex.days.map((d, i) => {
          const h = 8 + 0.62 * d.overall, x = i * bw;
          if (!d.eligible) return <rect key={d.day} x={x + 0.3} y={72 - 5} width={Math.max(1, bw - 0.6)} height="5" fill="var(--plum)" stroke="var(--lav)" strokeWidth=".6" />;
          return <rect key={d.day} x={x + 0.3} y={72 - h} width={Math.max(1, bw - 0.6)} height={h} fill={d.verdict === 'go' ? 'var(--cream)' : 'url(#sd-hatch)'} stroke={d.verdict === 'go' ? 'none' : 'var(--cream)'} strokeWidth=".8" />;
        })}
        {bestDay != null && (() => { const i = flex.days.findIndex((d) => d.day === bestDay); const x = i * bw + bw / 2; return (<g><path d={`M${x} 78l-6 11h12z`} fill="var(--cream)" /><text x={Math.min(W - 44, Math.max(44, x))} y="106" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill="var(--cream)">{ar ? 'أفضل بدء' : 'best start'}</text></g>); })()}
        {ticks.map((d) => { const x = flex.days.findIndex((q) => q.day === d.day) * bw; return (<g key={d.day}><path d={`M${x} 74v6`} stroke="var(--lav)" /><text x={Math.min(x + 2, W - 26)} y="95" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-muted)">{month(d.day)}</text></g>); })}
      </svg>
      <figcaption className="timeline-cap">{ar ? `العمود المصمت = يوم بدء مناسب · العمود المخطط = بحذر · العمود القصير المحدد = غير مناسب. وكلما طال العمود كانت الدرجة أفضل. ${flex.eligibleDays} من ${flex.totalDays} يوم بدء تجتاز كل القواعد هنا.` : `Solid bar = a Go start day · hatched bar = Risky · low outlined stub = No-Go. Taller means a better score. ${flex.eligibleDays} of ${flex.totalDays} start days pass every rule here.`}</figcaption>
    </figure>
  );
}
