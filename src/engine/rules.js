// SUHAIL decision engine – Student-mode copy of the SRS rules.
// Pure functions, no React, no DOM → easy to unit-test and to swap for the real backend later.
//
import { decodeHourly } from './decode.js';

// Rules mirrored from the SRS (DECISION_RULES):
//   1. Levels (Off/Low/Medium/High) become numeric limits (team assumptions, editable).
//   2. Metrics are computed per site AND per window from the stored hourly arrays.
//   3. Hard constraints: pass / fail / unknown. Unknown is NEVER a pass.
//   4. Metric score = clamp(50 + 50·(m − L)/(E − L), 0, 100); 50 = exactly at the limit.
//   5. Aspect status: No-Go (a limit fails) > Unverified (data missing) > Marginal (lowest score < 70) > Go.
//   6. Overall = weighted mean of aspect scores (High 3 · Medium 2 · Low 1).
//   7. Eligible = no aspect is No-Go / Unverified. Rank by overall, tie → weakest aspect (maximin).
//   8. Best date = repeat for every start day; also report how many days stay eligible.

export const ASPECTS = ['sunlight', 'night', 'comms', 'terrain', 'science'];
export const LEVELS = ['off', 'low', 'medium', 'high'];
export const LEVEL_WEIGHT = { off: 0, low: 1, medium: 2, high: 3 };
export const SUN_LIMB_DEG = 0.27; // the Sun counts as "up" when its upper edge clears the horizon

/** Level → numeric limit. TEAM ASSUMPTIONS, not mission standards. */
export const LIMITS = {
  sunPct: { low: 30, medium: 50, high: 70 }, // % of window hours, higher is better
  earthPct: { low: 40, medium: 60, high: 80 }, // % of window hours, higher is better
  earthGapH: { low: 48, medium: 24, high: 12 }, // longest Earth blackout (h), lower is better
  slopeDeg: { low: 12, medium: 8, high: 5 }, // degrees, lower is better
  psrKm: { low: 30, medium: 15, high: 5 }, // km to nearest permanently shadowed region, lower is better
};
/** "Excellent" value E used by the 0-100 score. */
export const EXCELLENT = { sunPct: 90, earthPct: 90, earthGapH: 6, slopeDeg: 2, psrKm: 2 };
/** Which direction is good. */
export const BETTER = { sunPct: 'high', earthPct: 'high', maxDarkH: 'low', earthGapH: 'low', slopeDeg: 'low', psrKm: 'low' };

/** Which metrics belong to which aspect (character). */
export const ASPECT_METRICS = {
  sunlight: ['sunPct'],
  night: ['maxDarkH'],
  comms: ['earthPct', 'earthGapH'],
  terrain: ['slopeDeg'],
  science: ['psrKm'],
};
export const METRIC_UNIT = { sunPct: '%', earthPct: '%', maxDarkH: 'h', earthGapH: 'h', slopeDeg: '°', psrKm: ' km' };

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// ---------------------------------------------------------------------------------
// Data preparation
// ---------------------------------------------------------------------------------

/** Linear interpolation of the terrain horizon (deg) at azimuth az (deg). */
export function horizonAt(horizon, az) {
  const n = horizon.length;
  const step = 360 / n;
  const a = ((az % 360) + 360) % 360;
  const i = Math.floor(a / step) % n;
  const f = (a - i * step) / step;
  return horizon[i] * (1 - f) + horizon[(i + 1) % n] * f;
}

/** Add 0/1 visibility series (Sun & Earth above the terrain horizon) to each site. */
export function prepareData(raw) {
  const hours = raw.window.hours;
  const sites = raw.sites.map((s) => {
    const hourly = decodeHourly(s.hourly);
    const sun = new Uint8Array(hours);
    for (let t = 0; t < hours; t++) {
      sun[t] = hourly.sun_el_deg[t] + SUN_LIMB_DEG > horizonAt(s.horizon_deg, hourly.sun_az_deg[t]) ? 1 : 0;
    }
    let earth = null;
    if (hourly.earth_el_deg && hourly.earth_az_deg) {
      earth = new Uint8Array(hours);
      for (let t = 0; t < hours; t++) {
        earth[t] = hourly.earth_el_deg[t] > horizonAt(s.horizon_deg, hourly.earth_az_deg[t]) ? 1 : 0;
      }
    }
    return { ...s, hourly, vis: { sun, earth } };
  });
  return { ...raw, sites };
}

// ---------------------------------------------------------------------------------
// Metrics for a site over a window [startHour, startHour + hours)
// ---------------------------------------------------------------------------------

function runStats(series, from, to) {
  let up = 0, run = 0, longestGap = 0;
  for (let t = from; t < to; t++) {
    if (series[t]) { up++; run = 0; } else { run++; if (run > longestGap) longestGap = run; }
  }
  return { upPct: (100 * up) / (to - from), longestGap };
}

export function windowMetrics(site, startHour, hours) {
  const to = Math.min(startHour + hours, site.vis.sun.length);
  const sun = runStats(site.vis.sun, startHour, to);
  const earth = site.vis.earth ? runStats(site.vis.earth, startHour, to) : null;
  return {
    sunPct: round1(sun.upPct),
    maxDarkH: sun.longestGap,
    earthPct: earth ? round1(earth.upPct) : null,
    earthGapH: earth ? earth.longestGap : null,
    slopeDeg: site.static.slope_deg ?? null,
    psrKm: site.static.psr_distance_km ?? null,
  };
}
const round1 = (x) => Math.round(x * 10) / 10;

// ---------------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------------

/** Numeric limit for one metric given the mission's levels. */
export function limitFor(metric, mission) {
  if (metric === 'maxDarkH') return mission.batteryH;
  const custom = mission.limits?.[metric]; // Expert mode can type its own number
  if (custom != null && Number.isFinite(custom)) return custom;
  const aspect = Object.keys(ASPECT_METRICS).find((a) => ASPECT_METRICS[a].includes(metric));
  const level = mission.levels[aspect];
  return LIMITS[metric]?.[level] ?? null;
}
export function excellentFor(metric, mission) {
  if (metric === 'maxDarkH') return mission.batteryH * 0.25;
  // "Excellent" must lie on the good side of the limit, also when the user types a very strict number.
  const L = limitFor(metric, mission);
  if (L == null) return EXCELLENT[metric];
  return BETTER[metric] === 'high' ? Math.max(EXCELLENT[metric], L + (100 - L) / 2) : Math.min(EXCELLENT[metric], L / 2);
}

export function metricScore(metric, value, mission) {
  if (value == null) return 0;
  const L = limitFor(metric, mission);
  const E = excellentFor(metric, mission);
  if (Math.abs(E - L) < 1e-9) return (BETTER[metric] === 'high' ? value >= L : value <= L) ? 100 : 0;
  return clamp(50 + (50 * (value - L)) / (E - L), 0, 100);
}
export function metricPasses(metric, value, mission) {
  if (value == null) return null; // unknown
  const L = limitFor(metric, mission);
  return BETTER[metric] === 'high' ? value >= L : value <= L;
}

export function aspectWeight(aspect, mission) {
  return mission.weights?.[aspect] ?? LEVEL_WEIGHT[mission.levels[aspect]];
}

/** Evaluate one site on one window. */
export function evaluate(site, mission, startHour, hours) {
  const metrics = windowMetrics(site, startHour, hours);
  const aspects = {};
  let wSum = 0, wScore = 0, minScore = 100, eligible = true, anyMarginal = false;

  for (const a of ASPECTS) {
    const level = mission.levels[a];
    if (level === 'off') { aspects[a] = { aspect: a, level, status: 'off', score: null, weight: 0, metrics: [] }; continue; }
    const list = ASPECT_METRICS[a].map((m) => {
      const value = metrics[m];
      const pass = metricPasses(m, value, mission);
      return { key: m, value, limit: limitFor(m, mission), excellent: excellentFor(m, mission), pass, score: metricScore(m, value, mission) };
    });
    const failed = list.filter((m) => m.pass === false).map((m) => m.key);
    const unknown = list.some((m) => m.pass === null);
    const score = list.reduce((s, m) => s + m.score, 0) / list.length;
    const lowest = Math.min(...list.map((m) => m.score));
    let status;
    if (failed.length) status = 'nogo';
    else if (unknown) status = 'unknown';
    else if (lowest < 70) status = 'marginal';
    else status = 'go';
    const weight = aspectWeight(a, mission);
    aspects[a] = { aspect: a, level, status, score, weight, metrics: list, failed };
    wSum += weight; wScore += weight * score;
    minScore = Math.min(minScore, score);
    if (status === 'nogo' || status === 'unknown') eligible = false;
    if (status === 'marginal') anyMarginal = true;
  }
  const overall = wSum ? wScore / wSum : 0;
  const verdict = !eligible ? 'nogo' : anyMarginal ? 'risky' : 'go';
  return { siteId: site.id, siteName: site.name, startHour, hours, metrics, aspects, eligible, verdict, overall, minScore };
}

/** Higher is better: eligible first, then overall, then the weakest aspect (maximin). */
export function compareEvals(a, b, { maximin = true } = {}) {
  if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
  if (Math.abs(a.overall - b.overall) > 0.5 || !maximin) return b.overall - a.overall;
  if (Math.abs(a.minScore - b.minScore) > 0.01) return b.minScore - a.minScore;
  return a.siteName.localeCompare(b.siteName);
}

export function rankSites(data, mission, startHour, hours, opts) {
  return data.sites.map((s) => evaluate(s, mission, startHour, hours)).sort((a, b) => compareEvals(a, b, opts));
}

/** Evaluate every site on every start day. Returns the best plan + flexibility per site. */
export function bestPlan(data, mission) {
  const hours = mission.durationDays * 24;
  const totalHours = data.window.hours;
  const lastStartDay = Math.floor((totalHours - hours) / 24); // inclusive
  // Optional "earliest / latest start day" from the mission form (day 0 = first day of the data window).
  const firstDay = clamp(Math.round(mission.fromDay ?? 0), 0, Math.max(0, lastStartDay));
  const lastDay = clamp(Math.round(mission.toDay ?? lastStartDay), firstDay, Math.max(firstDay, lastStartDay));
  const all = [];
  const flex = {};
  for (const s of data.sites) {
    flex[s.id] = { eligibleDays: 0, totalDays: lastDay - firstDay + 1, bestDay: null, bestEval: null, days: [] };
    for (let d = firstDay; d <= lastDay; d++) {
      const ev = evaluate(s, mission, d * 24, hours);
      ev.day = d;
      all.push(ev);
      flex[s.id].days.push({ day: d, eligible: ev.eligible, verdict: ev.verdict, overall: ev.overall });
      if (ev.eligible) flex[s.id].eligibleDays++;
      const cur = flex[s.id].bestEval;
      if (!cur || compareEvals(ev, cur) < 0) { flex[s.id].bestEval = ev; flex[s.id].bestDay = d; }
    }
  }
  const sorted = [...all].sort((a, b) => compareEvals(a, b) || a.day - b.day);
  const best = sorted[0];
  return { best: best && best.eligible ? best : null, nearestMiss: best && !best.eligible ? best : null, flex, lastStartDay, firstDay, lastDay, hours };
}

/** Verdict labels shown to students. */
export const VERDICT = {
  go: { label: 'GO', short: 'Ready to launch' },
  risky: { label: 'RISKY', short: 'Passes, but with thin margins' },
  nogo: { label: 'NO-GO', short: 'Breaks at least one rule' },
};
