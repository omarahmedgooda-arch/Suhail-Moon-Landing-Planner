import test from 'node:test';
import assert from 'node:assert/strict';
import { raw, data, MISSIONS } from './helpers.mjs';
import {
  ASPECTS, SUN_LIMB_DEG, horizonAt, evaluate, metricScore, limitFor, excellentFor,
  bestPlan, compareEvals, windowMetrics, prepareData,
} from '../src/engine/rules.js';

const mission = (id) => MISSIONS.find((m) => m.id === id);
const site = (id) => data.sites.find((s) => s.id === id);

test('sample data has the agreed suhail.sites/v0 shape and says it is sample', () => {
  assert.equal(raw.schema, 'suhail.sites/v0');
  assert.equal(raw.is_sample, true);
  assert.equal(raw.horizon.bins, 72);
  assert.equal(raw.horizon.step_deg, 5);
  assert.equal(raw.window.hours, 720);
  for (const s of raw.sites) {
    assert.equal(s.horizon_deg.length, 72, `${s.id} horizon`);
    assert.equal(s.hourly.sun_el_deg.length, raw.window.hours, `${s.id} sun_el`);
    assert.equal(s.hourly.sun_az_deg.length, raw.window.hours, `${s.id} sun_az`);
    assert.ok(typeof s.static.slope_deg === 'number' && typeof s.static.psr_distance_km === 'number');
  }
});

test('horizonAt interpolates and wraps around 360°', () => {
  const h = Array.from({ length: 72 }, (_, i) => (i === 0 ? 2 : 0));
  assert.equal(horizonAt(h, 0), 2);
  assert.equal(horizonAt(h, 2.5), 1); // halfway between 2 and 0
  assert.equal(horizonAt(h, 360), 2); // wraps
  assert.ok(Math.abs(horizonAt(h, 357.5) - 1) < 1e-9);
});

test('Sun visibility = top edge clears the terrain horizon', () => {
  for (const s of data.sites) {
    for (let t = 0; t < raw.window.hours; t += 7) {
      const up = s.hourly.sun_el_deg[t] + SUN_LIMB_DEG > horizonAt(s.horizon_deg, s.hourly.sun_az_deg[t]);
      assert.equal(!!s.vis.sun[t], up, `${s.id} t=${t}`);
    }
  }
});

test('metricScore: 50 at the limit, 100 at excellent, clamped to 0..100', () => {
  const m = mission('science-rover');
  const L = limitFor('sunPct', m), E = excellentFor('sunPct', m);
  assert.equal(metricScore('sunPct', L, m), 50);
  assert.equal(metricScore('sunPct', E, m), 100);
  assert.equal(metricScore('sunPct', 100, m), 100);
  assert.equal(metricScore('sunPct', 0, m), 0);
  // lower-is-better metrics work the same way
  const Ls = limitFor('slopeDeg', m), Es = excellentFor('slopeDeg', m);
  assert.equal(metricScore('slopeDeg', Ls, m), 50);
  assert.equal(metricScore('slopeDeg', Es, m), 100);
  assert.equal(metricScore('slopeDeg', Ls + 10, m), 0);
});

test('unknown is not a pass: a site with no Earth data cannot be eligible when comms matter', () => {
  const foxtrot = site('foxtrot');
  assert.equal(foxtrot.vis.earth, null);
  const m = mission('fast-demo'); // comms: low
  const ev = evaluate(foxtrot, m, 0, m.durationDays * 24);
  assert.equal(ev.aspects.comms.status, 'unknown');
  assert.equal(ev.eligible, false);
  assert.equal(ev.verdict, 'nogo');
  // switching comms off removes the requirement (and only that)
  const off = { ...m, levels: { ...m.levels, comms: 'off' } };
  const ev2 = evaluate(foxtrot, off, 0, off.durationDays * 24);
  assert.equal(ev2.aspects.comms.status, 'off');
  assert.notEqual(ev2.aspects.comms.status, 'unknown');
});

test('hard constraints come first: any failing aspect makes the site ineligible whatever the score', () => {
  const m = mission('science-rover');
  const ev = evaluate(site('charlie'), m, 3 * 24, m.durationDays * 24);
  const failing = ASPECTS.filter((a) => ev.aspects[a].status === 'nogo');
  assert.ok(failing.length > 0, 'charlie on day 4 should break a rule for the science rover (science distance)');
  assert.equal(ev.eligible, false);
});

test('a site that passes with a thin margin is RISKY, not GO', () => {
  const m = mission('fast-demo');
  let found = null;
  for (const s of data.sites) {
    for (let d = 0; d <= 26 && !found; d++) {
      const ev = evaluate(s, m, d * 24, m.durationDays * 24);
      if (ev.eligible && ASPECTS.some((a) => ev.aspects[a].status === 'marginal')) found = ev;
    }
  }
  assert.ok(found, 'expected at least one eligible-but-marginal case in the sample');
  assert.equal(found.verdict, 'risky');
});

test('weights: the science rover counts science as 3, others by level', () => {
  const m = mission('science-rover');
  const ev = evaluate(site('bravo'), m, 0, m.durationDays * 24);
  assert.equal(ev.aspects.science.weight, 3);
  assert.equal(ev.aspects.sunlight.weight, 2); // medium
  assert.equal(ev.aspects.comms.weight, 1); // low
});

test('compareEvals: eligible beats ineligible, then overall, then the weakest link (maximin)', () => {
  const base = { siteName: 'x', eligible: true, overall: 80, minScore: 60 };
  assert.ok(compareEvals({ ...base }, { ...base, eligible: false, overall: 99 }) < 0);
  assert.ok(compareEvals({ ...base, overall: 85 }, { ...base, overall: 80 }) < 0);
  // averages tie → the safer weakest aspect wins (Steady Sam beats Spiky Sue)
  const sam = { ...base, siteName: 'Sam', overall: 90, minScore: 90 };
  const sue = { ...base, siteName: 'Sue', overall: 90, minScore: 50 };
  assert.ok(compareEvals(sam, sue) < 0);
  assert.ok(compareEvals(sue, sam) > 0);
  // with maximin off, the tie is not broken by weakest link
  assert.equal(Math.sign(compareEvals(sam, sue, { maximin: false })), 0);
});

test('bestPlan: best is eligible, ranked first, and flexibility counts are consistent', () => {
  for (const m of MISSIONS) {
    const plan = bestPlan(data, m);
    const lastDay = Math.floor((raw.window.hours - m.durationDays * 24) / 24);
    assert.equal(plan.lastStartDay, lastDay);
    for (const s of data.sites) {
      const f = plan.flex[s.id];
      assert.equal(f.totalDays, lastDay + 1);
      assert.equal(f.days.length, lastDay + 1);
      assert.equal(f.eligibleDays, f.days.filter((d) => d.eligible).length);
    }
    if (plan.best) {
      assert.equal(plan.best.eligible, true);
      // nothing eligible scores higher overall by more than the tie band
      for (const s of data.sites) {
        for (const d of plan.flex[s.id].days) {
          if (d.eligible) assert.ok(d.overall <= plan.best.overall + 0.5, `${m.id} ${s.id} day ${d.day}`);
        }
      }
    } else {
      assert.ok(plan.nearestMiss, 'no eligible plan → there must be a nearest miss');
    }
  }
});

test('bestPlan is deterministic', () => {
  const m = mission('science-rover');
  const a = bestPlan(data, m), b = bestPlan(data, m);
  assert.equal(a.best.siteId, b.best.siteId);
  assert.equal(a.best.day, b.best.day);
});

test('windowMetrics: whole-window sunlight % equals share of lit hours', () => {
  const s = site('alpha');
  const m = windowMetrics(s, 0, raw.window.hours);
  const lit = s.vis.sun.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(m.sunPct - Math.round((1000 * lit) / raw.window.hours) / 10) < 0.11);
});

test('prepareData does not mutate the raw input', () => {
  const copy = JSON.stringify(raw);
  prepareData(raw);
  assert.equal(JSON.stringify(raw), copy);
});
