// From "mission requirements" to "the five best places and a verdict".
// Pure functions (no React) so the unit tests can run them on the real data file.
//
//   planMission(data, mission)  -> best start day per site, best site per REGION, top-N regions
//   replanCompare(...)          -> what happens to an old plan under new requirements
//   relaxHints(ev)              -> "what would I have to relax to make this pass?"

import { ASPECTS, ASPECT_METRICS, BETTER, bestPlan, compareEvals, evaluate, limitFor } from './rules.js';

const DAY_MS = 86400000;

export const dayDate = (data, day, hourOffset = 0) => new Date(Date.parse(data.window.start_utc) + day * DAY_MS + hourOffset * 3600000);
export const fmtDay = (data, day) => dayDate(data, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const fmtRange = (data, day, days) => {
  const a = dayDate(data, day), b = dayDate(data, day + days);
  const f = (d, y) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(y ? { year: 'numeric' } : {}), timeZone: 'UTC' });
  return `${f(a, a.getUTCFullYear() !== b.getUTCFullYear())} → ${f(b, true)}`;
};
export const windowDays = (data) => Math.round(data.window.hours / 24);
export const windowEndDay = (data) => windowDays(data) - 1;
/** yyyy-mm-dd (UTC) <-> day index inside the data window. */
export const isoToDay = (data, iso) => Math.floor((Date.parse(`${iso}T00:00:00Z`) - Date.parse(data.window.start_utc)) / DAY_MS);
export const dayToIso = (data, day) => dayDate(data, day).toISOString().slice(0, 10);

export const regionName = (data, id) => data.map?.regions?.find((r) => r.id === id)?.name ?? id;

/** Best site of each region (on its best start day), regions sorted best first. */
export function planMission(data, mission, { top = 5 } = {}) {
  const plan = bestPlan(data, mission);
  const byRegion = new Map();
  for (const s of data.sites) {
    const f = plan.flex[s.id];
    const ev = f.bestEval;
    if (!ev) continue;
    const r = byRegion.get(s.region) ?? { region: s.region, regionName: regionName(data, s.region), best: null, siteCount: 0, eligibleSites: 0 };
    r.siteCount++;
    if (ev.eligible) r.eligibleSites++;
    if (!r.best || compareEvals(ev, r.best.ev) < 0) r.best = { site: s, ev, flex: f };
    byRegion.set(s.region, r);
  }
  const ranked = [...byRegion.values()].sort((a, b) => compareEvals(a.best.ev, b.best.ev) || a.regionName.localeCompare(b.regionName));
  const places = ranked.slice(0, top).map((r, i) => ({
    rank: i + 1, region: r.region, regionName: r.regionName, site: r.best.site, ev: r.best.ev, day: r.best.ev.day,
    flex: r.best.flex, siteCount: r.siteCount, eligibleSites: r.eligibleSites,
  }));
  return {
    mission, plan, places, ranked, window: { first: plan.firstDay, last: plan.lastDay },
    winner: places[0] ?? null, hasWinner: !!places[0]?.ev.eligible,
    eligibleRegions: ranked.filter((r) => r.best.ev.eligible).length, regionCount: ranked.length,
  };
}

/** For every failed metric: what the site has, what was asked, and a rounded value that would pass. */
export function relaxHints(ev) {
  const out = [];
  for (const a of ASPECTS) {
    const as = ev.aspects[a];
    if (!as || as.status === 'off') continue;
    for (const m of as.metrics) {
      if (m.pass !== false) continue;
      const high = BETTER[m.key] === 'high';
      const need = high ? Math.floor(m.value) : Math.ceil(m.value * 10) / 10;
      out.push({ aspect: a, key: m.key, value: m.value, limit: m.limit, direction: high ? 'at least' : 'at most', relaxTo: need });
    }
  }
  return out;
}

export const REQUIREMENT_FIELDS = [
  { key: 'sunPct', aspect: 'sunlight', unit: '%', better: 'high', label: 'Sunlight: Sun up at least' },
  { key: 'maxDarkH', aspect: 'night', unit: 'h', better: 'low', label: 'Night & cold: longest dark under' },
  { key: 'earthPct', aspect: 'comms', unit: '%', better: 'high', label: 'Radio link: Earth visible at least' },
  { key: 'earthGapH', aspect: 'comms', unit: 'h', better: 'low', label: 'Radio link: longest gap at most' },
  { key: 'slopeDeg', aspect: 'terrain', unit: '°', better: 'low', label: 'Ground: slope at most' },
  { key: 'psrKm', aspect: 'science', unit: ' km', better: 'low', label: 'Science: within' },
];

/** What changed between two sets of requirements (for the replan report). */
export function diffRequirements(oldM, newM) {
  const changes = [];
  for (const f of REQUIREMENT_FIELDS) {
    const lvOld = oldM.levels[f.aspect], lvNew = newM.levels[f.aspect];
    const a = lvOld === 'off' ? null : limitFor(f.key, oldM);
    const b = lvNew === 'off' ? null : limitFor(f.key, newM);
    if (a !== b) changes.push({ aspect: f.aspect, key: f.key, label: f.label, unit: f.unit, from: a, to: b });
  }
  if (oldM.durationDays !== newM.durationDays) changes.push({ aspect: 'mission', key: 'durationDays', label: 'Mission length', unit: ' days', from: oldM.durationDays, to: newM.durationDays });
  return changes;
}

/**
 * old = { siteId, startDay (index in the data window, or null/out of range), mission (old requirements), reasons[], note }
 * Evaluates the OLD site on the OLD start day under both the old and the new requirements, then compares with
 * the new best plan.
 */
export function replanCompare(data, old, result) {
  const site = data.sites.find((s) => s.id === old.siteId) ?? null;
  const newMission = result.mission;
  const hoursOld = old.mission.durationDays * 24;
  const hoursNew = newMission.durationDays * 24;
  const inWindow = site && old.startDay != null && old.startDay >= 0 && old.startDay * 24 + Math.max(hoursOld, hoursNew) <= data.window.hours;
  const underOld = inWindow ? evaluate(site, old.mission, old.startDay * 24, hoursOld) : null;
  const underNew = inWindow ? evaluate(site, newMission, old.startDay * 24, hoursNew) : null;
  const siteFlex = site ? result.plan.flex[site.id] : null;
  const winner = result.winner;

  let recommendation = 'unknown';
  if (inWindow && underNew) {
    if (underNew.eligible) {
      recommendation = winner && winner.site.id !== site.id && winner.ev.eligible && winner.ev.overall - underNew.overall >= 5 ? 'move-better' : 'keep';
    } else if (siteFlex && siteFlex.eligibleDays > 0) recommendation = 'shift';
    else recommendation = 'move';
  }
  return {
    site, startDay: old.startDay, inWindow: !!inWindow, underOld, underNew, siteFlex, winner, recommendation,
    changes: diffRequirements(old.mission, newMission), reasons: old.reasons ?? [], note: old.note ?? '',
    shiftTo: siteFlex?.bestEval && siteFlex.bestEval.eligible ? siteFlex.bestEval : null,
  };
}
