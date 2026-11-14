import test from 'node:test';
import assert from 'node:assert/strict';
import { data, MISSIONS } from './helpers.mjs';
import { ASPECTS, evaluate } from '../src/engine/rules.js';
import { speak, limitSentence, MOOD } from '../src/engine/dialogue.js';

const fmt = (x) => (Number.isInteger(x) ? String(x) : (Math.round(x * 10) / 10).toString());

test('every number a character says comes from the data (and appears in the sentence)', () => {
  let checked = 0;
  for (const m of MISSIONS) {
    for (const s of data.sites) {
      for (const day of [0, 5, 12, 20]) {
        const days = m.durationDays;
        if (day * 24 + days * 24 > data.window.hours) continue;
        const ev = evaluate(s, m, day * 24, days * 24);
        for (const a of ASPECTS) {
          const out = speak(a, ev, { scope: 'window', days });
          const allowed = new Set();
          for (const mm of ev.aspects[a].metrics ?? []) { allowed.add(mm.value); allowed.add(mm.limit); allowed.add(mm.excellent); }
          for (const used of out.used) {
            assert.ok([...allowed].some((v) => v === used || Math.abs(v - used) < 1e-9), `${a}/${s.id}/d${day}: ${used} is not a metric, limit or excellent value`);
            assert.ok(out.line.includes(fmt(used)), `${a}/${s.id}/d${day}: "${fmt(used)}" missing from "${out.line}"`);
            checked++;
          }
        }
      }
    }
  }
  assert.ok(checked > 200, `only ${checked} numbers checked`);
});

test('mood follows status and every character always says something', () => {
  const m = MISSIONS[1];
  for (const s of data.sites) {
    const ev = evaluate(s, m, 0, m.durationDays * 24);
    for (const a of ASPECTS) {
      const out = speak(a, ev, { scope: 'window', days: m.durationDays });
      assert.equal(out.status, ev.aspects[a].status);
      assert.equal(out.mood, MOOD[ev.aspects[a].status]);
      assert.ok(out.line.length > 20);
    }
  }
});

test('"unknown is not a pass" is spoken out loud when Earth data is missing', () => {
  const m = MISSIONS[0];
  const foxtrot = data.sites.find((s) => s.id === 'foxtrot');
  const ev = evaluate(foxtrot, m, 0, m.durationDays * 24);
  const out = speak('comms', ev, { scope: 'window', days: m.durationDays });
  assert.equal(out.status, 'unknown');
  assert.match(out.line, /unknown/i);
});

test('average scope names the data window length, window scope says the mission length', () => {
  const m = MISSIONS[1];
  const s = data.sites[0];
  const ev = evaluate(s, m, 0, data.window.hours);
  assert.match(speak('sunlight', ev, { scope: 'average' }).line, /30-day data window/);
  assert.match(speak('sunlight', ev, { scope: 'average', windowDays: 180 }).line, /180-day data window/);
  const ev2 = evaluate(s, m, 0, m.durationDays * 24);
  assert.match(speak('sunlight', ev2, { scope: 'window', days: m.durationDays }).line, new RegExp(`${m.durationDays}-day mission`));
});

test('limitSentence gives a plain sentence for every active aspect', () => {
  const m = MISSIONS[1];
  const ev = evaluate(data.sites[0], m, 0, m.durationDays * 24);
  for (const a of ASPECTS) {
    const t = limitSentence(a, ev, m);
    assert.equal(typeof t, 'string');
  }
});
