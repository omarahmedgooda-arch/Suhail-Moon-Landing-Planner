// Tests on the REAL LOLA-derived data file (src/data/real-sites.json) and the flow built on it:
// plan -> council scripts -> leader -> report. The old sample file stays in the other test files.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareData, compareEvals } from '../src/engine/rules.js';
import { decodeHourly } from '../src/engine/decode.js';
import { planMission, replanCompare, relaxHints } from '../src/engine/plan.js';
import { placeScript, leaderScript, mapIntro, fmtNum } from '../src/engine/banter.js';
import { buildReportHtml, buildReportJson } from '../src/engine/report.js';
import { MISSIONS, missionFromPreset } from '../src/content/missions.js';
import { ORDER } from '../src/content/characters.js';

const raw = JSON.parse(readFileSync(new URL('../src/data/real-sites.json', import.meta.url), 'utf8'));
const data = prepareData(raw);
const preset = (id, over = {}) => missionFromPreset(MISSIONS.find((m) => m.id === id), over);

test('real-sites.json has the documented shape and is marked as real', () => {
  assert.equal(raw.schema ?? raw.format ?? 'suhail.sites/v0', 'suhail.sites/v0');
  assert.equal(raw.is_sample, false);
  assert.ok(raw.sites.length >= 50, `only ${raw.sites.length} sites`);
  assert.equal(raw.horizon.bins, 72);
  for (const k of ['terrain', 'psr', 'regions', 'sun_earth', 'candidates']) assert.ok(raw.provenance[k], `provenance.${k} missing`);
  assert.ok(raw.map.regions.length >= 5);
  for (const s of raw.sites) {
    assert.ok(s.id && s.name && s.region, 'id/name/region');
    assert.equal(s.horizon_deg.length, 72, s.id);
    assert.ok(s.lat_deg < -80 && s.lat_deg > -90, `${s.id} lat ${s.lat_deg}`);
    assert.ok(Number.isFinite(s.static.slope_deg) && s.static.slope_deg <= 15.01, `${s.id} slope`);
    assert.ok(raw.map.regions.some((r) => r.id === s.region), `${s.id} region`);
  }
});

test('decodeHourly: centi-degree base64 decodes to the right length and physical ranges', () => {
  const hours = raw.window.hours;
  for (const s of raw.sites) {
    const h = decodeHourly(s.hourly);
    for (const key of ['sun_el_deg', 'sun_az_deg', 'earth_el_deg', 'earth_az_deg']) assert.equal(h[key].length, hours, `${s.id}.${key}`);
    const maxEl = Math.max(...h.sun_el_deg);
    // Sub-solar latitude is within about +/-1.6 deg, so from 80-90 S the Sun never climbs above ~12 deg.
    assert.ok(maxEl < 12, `${s.id}: Sun reaches ${maxEl} deg`);
    for (const a of h.sun_az_deg) assert.ok(a >= 0 && a < 360.01);
  }
  // plain arrays (old sample format) pass straight through
  const plain = { sun_el_deg: [1, 2] };
  assert.equal(decodeHourly(plain), plain);
});

test('the data window is the south-pole summer window and sunlight behaves', () => {
  assert.equal(raw.window.start_utc.slice(0, 10), '2027-07-15');
  const pct = data.sites.map((s) => s.vis.sun.reduce((a, b) => a + b, 0) / s.vis.sun.length * 100);
  assert.ok(Math.max(...pct) > 80, 'some site should be lit most of the window');
  assert.ok(Math.min(...pct) < 60, 'some site should be dark much of the window');
});

for (const m of MISSIONS) {
  test(`planMission(${m.id}): five distinct regions, best first, winner = first place`, () => {
    const r = planMission(data, m);
    assert.ok(r.places.length >= 1 && r.places.length <= 5);
    assert.equal(new Set(r.places.map((p) => p.region)).size, r.places.length);
    for (let i = 1; i < r.places.length; i++) assert.ok(compareEvals(r.places[i - 1].ev, r.places[i].ev) <= 0, `place ${i} out of order`);
    assert.equal(r.winner, r.places[0]);
    r.places.forEach((p, i) => {
      assert.equal(p.rank, i + 1);
      assert.ok(p.day >= r.window.first && p.day <= r.window.last);
      assert.equal(p.site.region, p.region);
    });
    assert.equal(r.hasWinner, r.places[0].ev.eligible);
  });
}

test('fromDay / toDay restrict the start dates', () => {
  const m = { ...preset('science-rover'), fromDay: 60, toDay: 90 };
  const r = planMission(data, m);
  for (const p of r.places) assert.ok(p.day >= 60 && p.day <= 90, `day ${p.day}`);
});

test('every number the story says comes from the evaluation (placeScript, leaderScript, mapIntro)', () => {
  const m = preset('science-rover');
  const r = planMission(data, m);
  const lines = [mapIntro(r).line];
  r.places.forEach((p, i) => lines.push(...placeScript(p, { index: i, total: r.places.length, data, mission: m })));
  lines.push(...leaderScript(r, { data }));
  for (const l of lines) {
    assert.ok(l.text && !/undefined|NaN|\[object/.test(l.text), `bad text: ${l.text}`);
    for (const u of l.used) assert.ok(l.text.includes(fmtNum(u)), `"${fmtNum(u)}" not in "${l.text}"`);
  }
});

test('placeScript: guide opens and closes, the five characters all speak', () => {
  const m = preset('science-rover');
  const r = planMission(data, m);
  const s = placeScript(r.places[0], { index: 0, total: 5, data, mission: m });
  assert.equal(s[0].speaker, 'guide');
  assert.equal(s.at(-1).speaker, 'guide');
  const speakers = new Set(s.map((l) => l.speaker));
  for (const a of ORDER) assert.ok(speakers.has(a), `${a} is silent`);
});

test('the leader names the winner and a date window, and flags a safer GO when the winner is only RISKY', () => {
  const m = preset('science-rover');
  const r = planMission(data, m);
  const L = leaderScript(r, { data });
  const all = L.map((l) => l.text).join(' ');
  assert.ok(all.includes(r.winner.regionName));
  assert.ok(/Best window/.test(all));
  const safer = r.places.slice(1).find((p) => p.ev.verdict === 'go');
  if (r.winner.ev.verdict === 'risky' && safer) assert.ok(L.some((l) => l.key === 'l-safer' && l.text.includes(safer.regionName)));
  // the "beats by N points" sentence agrees with the rounded scores shown in the list
  const second = L.find((l) => l.key === 'l-second');
  const gap = Math.round(r.winner.ev.overall) - Math.round(r.places[1].ev.overall);
  if (gap > 0) assert.ok(second.text.includes(`**${gap}**`));
});

test('impossible requirements: honest "no place passes" branch with a relax hint', () => {
  const m = { ...preset('science-rover'), limits: { sunPct: 99.9, slopeDeg: 1, psrKm: 0.2, maxDarkH: 1, earthPct: 99.9, earthGapH: 1 } };
  const r = planMission(data, m);
  assert.equal(r.hasWinner, false);
  const L = leaderScript(r, { data });
  assert.ok(L.some((l) => /none|no place|nearest miss/i.test(l.text)));
  assert.ok(relaxHints(r.winner.ev).length > 0);
});

test('replanCompare: recommendation and requirement diff', () => {
  const oldM = preset('fast-demo');
  const oldRun = planMission(data, oldM);
  const old = { siteId: oldRun.winner.site.id, startDay: oldRun.winner.day, mission: oldM, reasons: ['Mission got longer or shorter'], note: '' };
  const newM = preset('crew-outpost');
  const rp = replanCompare(data, old, planMission(data, newM));
  assert.ok(['keep', 'move-better', 'shift', 'move', 'unknown'].includes(rp.recommendation));
  assert.ok(rp.underOld && rp.underNew, 'old plan evaluated under both requirement sets');
  assert.ok(rp.changes.length > 0 && rp.changes.every((c) => c.label), 'changes carry readable labels');
  // same requirements, same plan: nothing to change
  const same = replanCompare(data, { ...old, mission: oldM }, planMission(data, oldM));
  assert.equal(same.changes.length, 0);
  assert.equal(same.recommendation, 'keep');
  // a date outside the data window is reported as unknown, never as a pass
  const out = replanCompare(data, { ...old, startDay: 9999 }, planMission(data, newM));
  assert.equal(out.recommendation, 'unknown');
});

test('report builders: standalone HTML and JSON carry the data, caveats and the five places', () => {
  const m = preset('science-rover');
  const result = planMission(data, m);
  const run = { kind: 'new', mission: m, result, scripts: [], leader: leaderScript(result, { data }), replan: null, madeAt: Date.UTC(2026, 10, 13) };
  const html = buildReportHtml(run, data);
  assert.ok(html.startsWith('<!doctype html>') || html.startsWith('<!DOCTYPE html>'));
  for (const p of result.places) assert.ok(html.includes(p.regionName), p.regionName);
  assert.ok(!/<script/i.test(html), 'report must not contain scripts');
  const json = buildReportJson(run, data);
  assert.equal(json.schema, 'suhail.report/v0');
  assert.equal(json.places?.length ?? json.ranking?.length, result.places.length);
  assert.doesNotThrow(() => JSON.stringify(json));
});

test('expert voices + power simulation: every number said comes from the data, and the energy model is sane', async () => {
  const { simulateEnergy } = await import('../src/engine/energy.js');
  for (const id of ['science-rover', 'crew-outpost', 'ice-drill', 'night-survival']) {
    const m = preset(id);
    const r = planMission(data, m);
    const lines = [mapIntro(r, 'expert').line];
    const sims = r.places.map((p) => simulateEnergy(p.site, p.day * 24, m.durationDays * 24, m.power, data.window.start_utc));
    for (const s of sims) {
      assert.ok(s.out.tempMinC > -250 && s.out.tempMaxC < 130, 'temperature range');
      assert.ok(s.out.minSocPct >= 0 && s.out.minSocPct <= 100);
      assert.ok(s.out.eSolarKWh >= 0 && s.out.eLoadKWh > 0);
      assert.equal(s.out.sunH + s.out.darkH, m.durationDays * 24);
    }
    r.places.forEach((p, i) => lines.push(...placeScript(p, { index: i, total: r.places.length, data, mission: m, mode: 'expert', energy: sims[i] })));
    lines.push(...leaderScript(r, { data, mode: 'expert', energy: sims[0] }));
    for (const l of lines) {
      assert.ok(l.text && !/undefined|NaN|\[object/.test(l.text), `bad text: ${l.text}`);
      for (const u of l.used) assert.ok(l.text.includes(fmtNum(u)), `"${fmtNum(u)}" not in "${l.text}"`);
    }
  }
});

test('leader answers the user vote with numbers that match the data', () => {
  const m = preset('science-rover');
  const r = planMission(data, m);
  for (const vote of [null, r.places[0].region, r.places[1].region, r.places[4].region]) {
    const L = leaderScript(r, { data, mode: 'expert', vote });
    const v = L.find((l) => l.key === 'l-vote');
    assert.ok(v, 'vote line present');
    for (const u of v.used) assert.ok(v.text.includes(fmtNum(u)), `"${fmtNum(u)}" not in "${v.text}"`);
  }
});
