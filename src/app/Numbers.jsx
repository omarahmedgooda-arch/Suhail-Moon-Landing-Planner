import { useState } from 'react';
import { Avatar } from '../components/Avatar.jsx';
import { SourceLink, StatusIcon, StatusPill, STATUS_WORD } from '../components/ui.jsx';
import { ASPECT_LABEL } from '../content/missions.js';
import { CHARACTERS, ORDER } from '../content/characters.js';
import { limitSentence } from '../engine/dialogue.js';
import { METRIC_UNIT, VERDICT } from '../engine/rules.js';
import { metricText } from '../engine/banter.js';
import { dayDate } from '../engine/plan.js';

const CMP = { sunPct: '≥', earthPct: '≥', maxDarkH: '<', earthGapH: '≤', slopeDeg: '≤', psrKm: '≤' };
export const limitText = (m) => `${CMP[m.key]} ${m.limit}${METRIC_UNIT[m.key]}`;
const SHORT = { sunPct: 'Sun up', maxDarkH: 'Longest dark', earthPct: 'Earth visible', earthGapH: 'Longest gap', slopeDeg: 'Slope', psrKm: 'Nearest shadowed crater' };

/** "Why does this matter?" card, same copy as the story. */
export function LearnCard({ aspect, ev, mission }) {
  const L = CHARACTERS[aspect].learn;
  return (
    <div className="learn">
      <h4>{L.title}</h4>
      <p>{L.what}</p>
      <p><strong>How SUHAIL checks.</strong> {L.how}</p>
      <p className="limit-sentence">{limitSentence(aspect, ev, mission)}</p>
      <p className="real"><strong>A real case.</strong> {L.real.text}</p>
      <SourceLink source={L.real.source} />
    </div>
  );
}

export function WhyButton({ aspect, ev, mission }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="why-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? 'Hide' : 'Why?'}</button>
      {open && <LearnCard aspect={aspect} ev={ev} mission={mission} />}
    </>
  );
}

/** The five aspects of one evaluation: value, your limit, status. */
export function PlaceNumbers({ ev, caption }) {
  return (
    <div className="table-scroll">
      <table className="bench nums">
        <caption className="sr-only">{caption ?? 'The five aspects: measured value, your limit and the result'}</caption>
        <thead><tr><th scope="col">Aspect</th><th scope="col">This place</th><th scope="col">Your limit</th><th scope="col">Result</th></tr></thead>
        <tbody>
          {ORDER.map((a) => {
            const as = ev.aspects[a];
            return (
              <tr key={a} className={as.status === 'nogo' ? 'is-out' : ''}>
                <th scope="row"><span className="who"><Avatar id={a} mood={as.status === 'off' ? 'asleep' : as.status === 'go' ? 'happy' : as.status === 'marginal' ? 'nervous' : 'worried'} size={30} />{ASPECT_LABEL[a]}</span></th>
                <td className="mono">{as.status === 'off' ? '—' : as.metrics.map((m) => <span key={m.key} className="line">{SHORT[m.key]} {metricText(m)}</span>)}</td>
                <td className="mono">{as.status === 'off' ? '—' : as.metrics.map((m) => <span key={m.key} className="line">{limitText(m)}</span>)}</td>
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
  return (
    <div className="table-scroll">
      <table className="bench rank-table">
        <caption className="sr-only">The five places compared on the five aspects</caption>
        <thead>
          <tr><th scope="col">#</th><th scope="col">Place</th><th scope="col">Best start</th><th scope="col">Score</th>{ORDER.map((a) => (<th scope="col" key={a}>{ASPECT_LABEL[a]}</th>))}</tr>
        </thead>
        <tbody>
          {places.map((p) => (
            <tr key={p.region} className={highlight === p.region ? 'is-in' : ''}>
              <td className="mono">{p.rank}</td>
              <th scope="row">{p.regionName}<small>site {p.site.name.split('·')[1]?.trim()}</small></th>
              <td className="mono">{dayDate(data, p.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</td>
              <td className="result"><span className="mono">{Math.round(p.ev.overall)}</span><small>{VERDICT[p.ev.verdict].label}</small></td>
              {ORDER.map((a) => {
                const as = p.ev.aspects[a];
                return (
                  <td key={a} className={`cell s-${as.status}`}>
                    <StatusIcon status={as.status} size={18} />
                    <span className="mono">{as.status === 'off' ? '—' : as.metrics.map(metricText).join('\n')}</span>
                    <span className="sr-only"> {STATUS_WORD[as.status]}</span>
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
  const n = flex.days.length, W = 720, bw = W / n;
  const month = (d) => dayDate(data, d).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
  const ticks = flex.days.filter((d, i) => i === 0 || month(d.day) !== month(flex.days[i - 1].day));
  return (
    <figure className="startdays">
      <svg viewBox={`0 0 ${W} 112`} role="img" aria-label={`Start days tested at this site: ${flex.eligibleDays} of ${flex.totalDays} pass every rule.`}>
        <defs><pattern id="sd-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--ink)" /><path d="M0 0v5" stroke="var(--cream)" strokeWidth="1.6" /></pattern></defs>
        {flex.days.map((d, i) => {
          const h = 8 + 0.62 * d.overall, x = i * bw;
          if (!d.eligible) return <rect key={d.day} x={x + 0.3} y={72 - 5} width={Math.max(1, bw - 0.6)} height="5" fill="var(--plum)" stroke="var(--lav)" strokeWidth=".6" />;
          return <rect key={d.day} x={x + 0.3} y={72 - h} width={Math.max(1, bw - 0.6)} height={h} fill={d.verdict === 'go' ? 'var(--cream)' : 'url(#sd-hatch)'} stroke={d.verdict === 'go' ? 'none' : 'var(--cream)'} strokeWidth=".8" />;
        })}
        {bestDay != null && (() => { const i = flex.days.findIndex((d) => d.day === bestDay); const x = i * bw + bw / 2; return (<g><path d={`M${x} 78l-6 11h12z`} fill="var(--cream)" /><text x={Math.min(W - 44, Math.max(44, x))} y="106" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill="var(--cream)">best start</text></g>); })()}
        {ticks.map((d) => { const x = flex.days.findIndex((q) => q.day === d.day) * bw; return (<g key={d.day}><path d={`M${x} 74v6`} stroke="var(--lav)" /><text x={Math.min(x + 2, W - 26)} y="95" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-muted)">{month(d.day)}</text></g>); })}
      </svg>
      <figcaption className="timeline-cap">Solid bar = a Go start day · hatched bar = Risky · low outlined stub = No-Go. Taller means a better score. {flex.eligibleDays} of {flex.totalDays} start days pass every rule here.</figcaption>
    </figure>
  );
}
