// The report file: everything the user saw, in one document.
//   buildReportHtml(run, data)  -> a standalone, printable HTML page (Save as PDF from the browser)
//   buildReportJson(run, data)  -> the same facts as machine-readable JSON (schema suhail.report/v0)
// `run` = { kind: 'new'|'replan', mission, result, scripts, leader, replan, madeAt }

import { ASPECT_LABEL, LEVEL_WORDS } from '../content/missions.js';
import { ORDER } from '../content/characters.js';
import { METRIC_UNIT, VERDICT } from './rules.js';
import { coord, metricText } from './banter.js';
import { dayDate, fmtDay, fmtRange } from './plan.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rich = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\{\{[a-z]+\|([^}]+)\}\}/g, '$1');
const plain = (t) => String(t).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\{\{[a-z]+\|([^}]+)\}\}/g, '$1');
const WORD = { go: 'Go', marginal: 'Marginal', nogo: 'No-Go', unknown: 'Unverified', off: 'Off' };
const siteLabel = (p) => `${p.regionName}, site ${p.site.name.split('·')[1]?.trim()}`;

export function requirementRows(mission) {
  const rows = [];
  const lv = (a) => LEVEL_WORDS[mission.levels[a]].label;
  const L = mission.limits ?? {};
  rows.push(['Sunlight', lv('sunlight'), mission.levels.sunlight === 'off' ? '—' : `Sun up at least ${L.sunPct ?? '?'}% of the mission`]);
  rows.push(['Night & cold', lv('night'), mission.levels.night === 'off' ? '—' : `Longest dark stretch under the ${mission.batteryH} h battery`]);
  rows.push(['Radio link', lv('comms'), mission.levels.comms === 'off' ? '—' : `Earth visible at least ${L.earthPct ?? '?'}%, longest gap at most ${L.earthGapH ?? '?'} h`]);
  rows.push(['Ground', lv('terrain'), mission.levels.terrain === 'off' ? '—' : `Slope at most ${L.slopeDeg ?? '?'}°`]);
  rows.push(['Science', lv('science'), mission.levels.science === 'off' ? '—' : `Within ${L.psrKm ?? '?'} km of a permanently shadowed region`]);
  return rows;
}

const runsOf = (series, from, to) => {
  const out = []; let s = -1;
  for (let i = from; i <= to; i++) { const up = i < to && series[i]; if (up && s < 0) s = i; if (!up && s >= 0) { out.push([s, i]); s = -1; } }
  return out;
};

function stripSvg(site, t0, hours) {
  const W = 640, X0 = 56, span = W - X0 - 6;
  const sx = (i) => X0 + ((i - t0) / hours) * span;
  const rows = [['Sun', site.vis.sun, 8, '#C8C793'], ['Earth', site.vis.earth, 40, '#7C679E']];
  const days = Math.round(hours / 24);
  let g = '';
  for (let d = 0; d <= days; d++) g += `<line x1="${sx(t0 + d * 24)}" x2="${sx(t0 + d * 24)}" y1="4" y2="72" stroke="#7C679E" stroke-opacity=".5" stroke-dasharray="1 3"/>`;
  for (const [label, series, y, fill] of rows) {
    g += `<text x="0" y="${y + 17}" font-size="12" fill="#C8C793" font-family="monospace">${label}</text><rect x="${X0}" y="${y}" width="${span}" height="24" fill="#24201A" stroke="#7C679E" rx="3"/>`;
    if (series) for (const [a, b] of runsOf(series, t0, t0 + hours)) g += `<rect x="${sx(a)}" y="${y}" width="${Math.max(1, sx(b) - sx(a))}" height="24" fill="${fill}"/>`;
  }
  return `<svg viewBox="0 0 ${W} 80" width="100%" role="img" aria-label="Sun and Earth visibility during the mission">${g}</svg><p class="cap">Filled = above the terrain horizon. Marks every 24 h.</p>`;
}

function daysSvg(flex, bestDay) {
  const n = flex.days.length, W = 640, bw = W / n;
  let g = '';
  flex.days.forEach((d, i) => {
    const h = 6 + 0.5 * d.overall;
    const x = i * bw;
    if (d.eligible && d.verdict === 'go') g += `<rect x="${x}" y="${60 - h}" width="${Math.max(1, bw - 0.6)}" height="${h}" fill="#C8C793"/>`;
    else if (d.eligible) g += `<rect x="${x}" y="${60 - h}" width="${Math.max(1, bw - 0.6)}" height="${h}" fill="#7C679E"/>`;
    else g += `<rect x="${x}" y="56" width="${Math.max(1, bw - 0.6)}" height="4" fill="#3F2548" stroke="#7C679E" stroke-width=".5"/>`;
    if (d.day === bestDay) g += `<path d="M${x + bw / 2} 64l-4 8h8z" fill="#C8C793"/>`;
  });
  return `<svg viewBox="0 0 ${W} 74" width="100%" role="img" aria-label="Which start days pass">${g}</svg><p class="cap">Tall cream bar = Go day · lavender bar = Risky day · low outlined stub = No-Go day. The triangle marks the recommended start.</p>`;
}

const CSS = `
:root{--ink:#24201A;--plum:#3F2548;--indigo:#35369C;--lav:#7C679E;--cream:#C8C793}
*{box-sizing:border-box}body{margin:0;background:var(--ink);color:var(--cream);font:16px/1.55 system-ui,-apple-system,'Segoe UI',sans-serif}
main{max-width:920px;margin:0 auto;padding:32px 20px 60px}
h1,h2,h3{font-family:Georgia,'Iowan Old Style',serif;line-height:1.2;margin:0 0 .4em}h1{font-size:2.1rem}h2{font-size:1.4rem;margin-top:2em;border-top:1px solid var(--lav);padding-top:.8em}h3{font-size:1.1rem}
.eyebrow{font:12px/1 monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--lav)}
.box{background:var(--plum);border:1px solid var(--lav);border-radius:14px;padding:16px 18px;margin:14px 0}
table{width:100%;border-collapse:collapse;margin:10px 0;font-size:.92rem}th,td{border-bottom:1px solid #7C679E66;padding:7px 8px;text-align:left;vertical-align:top}th{font:12px/1.2 monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--lav)}
.stamp{display:inline-block;border:2px solid var(--cream);border-radius:8px;padding:2px 10px;font:700 .95rem monospace;letter-spacing:.08em}.stamp.nogo{background:var(--cream);color:var(--ink)}
.say{margin:.35em 0;padding-left:.7em;border-left:3px solid var(--lav)}.say b.who{font-family:monospace;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--lav);margin-right:.5em}
.cap,.small{font-size:.8rem;color:#b9b78f99;opacity:.85}.big{font-size:1.15rem}
@media print{body{background:#fff;color:#111}:root{--ink:#fff;--plum:#f3f0f7;--lav:#555;--cream:#222}.box{background:#f3f0f7}}
`;

export function buildReportHtml(run, data) {
  const { mission, result, scripts, leader, replan } = run;
  const w = result.winner;
  const ev = w?.ev;
  const made = new Date(run.madeAt ?? Date.now()).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const real = !data.is_sample;
  const head = ev
    ? `<div class="box"><span class="eyebrow">${ev.eligible ? 'Recommended landing site' : 'Nearest miss: no site passes every rule'}</span>
       <h2 style="border:0;margin-top:.2em;padding:0">${esc(siteLabel(w))}</h2>
       <p class="big">${esc(coord(w.site))} · elevation ${w.site.elevation_m ?? '?'} m · <span class="stamp ${ev.verdict === 'nogo' ? 'nogo' : ''}">${VERDICT[ev.verdict].label}</span> · score ${Math.round(ev.overall)}/100</p>
       <p>Best start: <b>${esc(fmtDay(data, w.day))}</b> · mission window <b>${esc(fmtRange(data, w.day, mission.durationDays))}</b> (UTC) · ${w.flex.eligibleDays} of ${w.flex.totalDays} start days pass every rule at this site.</p></div>`
    : '<p>No candidate sites were found.</p>';

  const reqs = requirementRows(mission).map(([a, l, t]) => `<tr><td>${a}</td><td>${l}</td><td>${esc(t)}</td></tr>`).join('');
  const rank = result.places.map((p) => {
    const cells = ORDER.map((a) => { const as = p.ev.aspects[a]; return `<td>${as.status === 'off' ? '—' : esc(as.metrics.map(metricText).join(' · '))}<br><span class="small">${WORD[as.status]}</span></td>`; }).join('');
    return `<tr><td>${p.rank}</td><td><b>${esc(p.regionName)}</b><br><span class="small">site ${esc(p.site.name.split('·')[1]?.trim())} · ${esc(coord(p.site))}</span></td><td>${esc(fmtDay(data, p.day))}</td><td>${Math.round(p.ev.overall)}<br><span class="small">${VERDICT[p.ev.verdict].label}</span></td>${cells}</tr>`;
  }).join('');

  const talks = result.places.map((p, i) => `<h3>${p.rank}. ${esc(p.regionName)}</h3>${(scripts?.[i] ?? []).map((l) => `<p class="say"><b class="who">${esc(l.name)}</b>${rich(l.text)}</p>`).join('')}`).join('');
  const lead = (leader ?? []).map((l) => `<p class="say"><b class="who">${esc(l.name)}</b>${rich(l.text)}</p>`).join('');

  const detail = ev ? `
    <h2>Why this site: the numbers</h2>
    <table><thead><tr><th>Aspect</th><th>This site</th><th>Your limit</th><th>Status</th></tr></thead><tbody>
    ${ORDER.map((a) => { const as = ev.aspects[a]; if (as.status === 'off') return `<tr><td>${ASPECT_LABEL[a]}</td><td>—</td><td>—</td><td>Off</td></tr>`; return as.metrics.map((m, i) => `<tr>${i === 0 ? `<td rowspan="${as.metrics.length}">${ASPECT_LABEL[a]}</td>` : ''}<td>${esc(metricText(m))}</td><td>${(m.key === 'maxDarkH' ? '<' : (m.key === 'sunPct' || m.key === 'earthPct') ? '≥' : '≤')} ${m.limit}${METRIC_UNIT[m.key]}</td>${i === 0 ? `<td rowspan="${as.metrics.length}">${WORD[as.status]} (score ${Math.round(as.score)})</td>` : ''}</tr>`).join(''); }).join('')}
    </tbody></table>
    <h3>Sun and Earth during the mission</h3>${stripSvg(w.site, w.day * 24, mission.durationDays * 24)}
    <h3>Which start days work at this site</h3>${daysSvg(w.flex, w.day)}` : '';

  const rp = replan ? `
    <h2>Replan: old plan against the new requirements</h2>
    <div class="box"><p><b>Reasons given:</b> ${esc(replan.reasons.join(', ') || '—')}${replan.note ? ` · ${esc(replan.note)}` : ''}</p>
    ${replan.changes.length ? `<table><thead><tr><th>Requirement</th><th>Old</th><th>New</th></tr></thead><tbody>${replan.changes.map((c) => `<tr><td>${esc(c.label ?? c.key)}</td><td>${c.from ?? 'off'}${c.from == null ? '' : c.unit}</td><td>${c.to ?? 'off'}${c.to == null ? '' : c.unit}</td></tr>`).join('')}</tbody></table>` : '<p>The requirements did not change.</p>'}
    <p>${replan.inWindow ? `Old plan: <b>${esc(replan.site.name)}</b> starting ${esc(fmtDay(data, replan.startDay))}. Under the new requirements it is <b>${replan.underNew.eligible ? VERDICT[replan.underNew.verdict].label : 'NO-GO'}</b> (score ${Math.round(replan.underNew.overall)}). Recommendation: <b>${{ keep: 'keep it', 'move-better': 'consider moving', shift: 'keep the site, change the date', move: 'move to a new site' }[replan.recommendation]}</b>.` : 'The old start date is outside the data window, so the old plan could not be tested.'}</p></div>` : '';

  const prov = data.provenance ? Object.entries(data.provenance).map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join('') : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SUHAIL report · ${esc(mission.name)}</title><style>${CSS}</style></head><body><main>
  <p class="eyebrow">SUHAIL · Lunar Landing Site Navigator · FASA Destination Team</p>
  <h1>${run.kind === 'replan' ? 'Replan report' : 'Landing site report'}: ${esc(mission.name)}</h1>
  <p class="small">Made ${made} · ${mission.durationDays}-day mission · data window ${esc(fmtDay(data, 0))} → ${esc(fmtDay(data, Math.round(data.window.hours / 24) - 1))} (UTC)</p>
  ${head}
  <h2>The leader’s advice</h2>${lead}
  ${detail}
  ${rp}
  <h2>Your requirements</h2><table><thead><tr><th>Aspect</th><th>Importance</th><th>Limit</th></tr></thead><tbody>${reqs}</tbody></table>
  <h2>The five places compared</h2><div style="overflow-x:auto"><table><thead><tr><th>#</th><th>Place</th><th>Start</th><th>Score</th>${ORDER.map((a) => `<th>${ASPECT_LABEL[a]}</th>`).join('')}</tr></thead><tbody>${rank}</tbody></table></div>
  <h2>What the council said</h2>${talks}
  <h2>Data and honesty notes</h2>
  <ul>${prov}</ul>
  <p class="small">${real ? 'Terrain, slopes and shadowed craters are derived from NASA LOLA elevation data (80 m per pixel), so metre-scale boulders and craters are not visible. ' : 'This report uses SAMPLE data. '}Sun and Earth positions come from an astronomy model that is close to, but not exactly, NASA SPICE/Horizons. Importance levels and default limits are team assumptions, not NASA standards. SUHAIL supports a decision; it does not replace a mission’s own engineering review.</p>
  </main></body></html>`;
}

const strip = (m) => ({ key: m.key, value: m.value, limit: m.limit, pass: m.pass, score: Math.round(m.score * 10) / 10 });
const evJson = (ev) => ({ verdict: ev.verdict, eligible: ev.eligible, overall: Math.round(ev.overall * 10) / 10, aspects: Object.fromEntries(ORDER.map((a) => [a, { status: ev.aspects[a].status, score: ev.aspects[a].score == null ? null : Math.round(ev.aspects[a].score * 10) / 10, metrics: ev.aspects[a].metrics.map(strip) }])) });

export function buildReportJson(run, data) {
  const { mission, result, scripts, leader, replan } = run;
  return {
    schema: 'suhail.report/v0', kind: run.kind, generated_utc: new Date(run.madeAt ?? Date.now()).toISOString(),
    is_sample: !!data.is_sample, provenance: data.provenance ?? null,
    window_utc: { start: data.window.start_utc, hours: data.window.hours },
    mission: { name: mission.name, type: mission.typeId, duration_days: mission.durationDays, battery_h: mission.batteryH, importance: mission.levels, limits: mission.limits, earliest_start_day: mission.fromDay ?? 0, latest_start_day: mission.toDay ?? null },
    recommendation: result.winner ? { eligible: result.winner.ev.eligible, region: result.winner.regionName, site_id: result.winner.site.id, start_utc: dayDate(data, result.winner.day).toISOString(), end_utc: dayDate(data, result.winner.day + mission.durationDays).toISOString() } : null,
    places: result.places.map((p, i) => ({
      rank: p.rank, region: p.regionName, site: { id: p.site.id, name: p.site.name, lat_deg: p.site.lat_deg, lon_deg_east: p.site.lon_deg, elevation_m: p.site.elevation_m ?? null },
      start_utc: dayDate(data, p.day).toISOString(), start_days_that_pass: p.flex.eligibleDays, start_days_tested: p.flex.totalDays,
      evaluation: evJson(p.ev), council: (scripts?.[i] ?? []).map((l) => ({ speaker: l.name, text: plain(l.text) })),
    })),
    leader: (leader ?? []).map((l) => plain(l.text)),
    replan: replan ? { reasons: replan.reasons, note: replan.note, old_site: replan.site?.id ?? null, old_start_utc: replan.inWindow ? dayDate(data, replan.startDay).toISOString() : null, old_plan_under_new_requirements: replan.underNew ? evJson(replan.underNew) : null, requirement_changes: replan.changes, recommendation: replan.recommendation } : null,
  };
}

/** Save a text file. Inside a claude.ai Artifact the page may not download by itself, so the viewer's
 *  `downloads` capability is used when it exists (the viewer confirms). Everywhere else: a normal download. */
export async function downloadText(filename, text, mime) {
  try {
    const claude = typeof window !== 'undefined' ? window.claude : null;
    if (claude && typeof claude.use === 'function') {
      const downloads = await claude.use('downloads');
      if (downloads) {
        try { await downloads.save({ filename, data: text }); return 'saved'; }
        catch (e) { if (e && e.code === 'declined') return 'declined'; /* anything else: fall through to the plain download */ }
      }
    }
  } catch { /* no capability layer: plain download below */ }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}

/** Print through a hidden iframe so only the report is printed. */
export function printHtml(html) {
  const f = document.createElement('iframe');
  f.setAttribute('aria-hidden', 'true');
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  f.srcdoc = html;
  f.onload = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch { /* blocked */ } setTimeout(() => f.remove(), 3000); };
  document.body.appendChild(f);
}
