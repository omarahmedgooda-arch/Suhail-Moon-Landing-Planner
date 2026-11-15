// Scripts for the Council (five characters + guide) and the Leader.
// Every number is taken from the evaluation objects and recorded in `used`, so a unit test can prove the
// story never disagrees with the data. Mini-markup for <Rich/>:  **bold**   {{term-key|shown text}}

import { ORDER } from '../content/characters.js';
import { castFor } from '../content/cast.js';
import { SUITABILITY } from './energy.js';
import { ASPECT_LABEL, ASPECT_LABEL_AR } from '../content/missions.js';
import { MOOD, speak, speakExpert } from './dialogue.js';
import { fmtDay, fmtDayAr, fmtRange, fmtRangeAr, relaxHints } from './plan.js';
import { METRIC_UNIT } from './rules.js';

const n = (x) => (Number.isInteger(x) ? String(x) : (Math.round(x * 10) / 10).toString());
export { n as fmtNum };
const ACTIVE_STATUS = ['go', 'marginal', 'nogo', 'unknown'];
const a_an = (num) => (/^(8|11|18)/.test(String(num)) ? 'an' : 'a');
export { a_an };
const coord = (s) => `${Math.abs(s.lat_deg).toFixed(2)}°${s.lat_deg < 0 ? 'S' : 'N'}, ${s.lon_deg.toFixed(2)}°E`;

const CHEER = {
  sunlight: 'Plenty of light means plenty of power.',
  night: 'Short dark stretches mean we stay warm.',
  comms: 'A steady link means Earth can hear us.',
  terrain: 'Gentle ground means a safe landing.',
  science: 'The ice is right next door.',
};
const GRUMBLE = {
  sunlight: 'without light there is no power at all.',
  night: 'a long night would freeze everything.',
  comms: 'without a link, nobody hears us.',
  terrain: 'steep ground tips the lander over.',
  science: 'the ice is too far to reach.',
};
const NERVOUS = {
  sunlight: 'the light is just enough, and no more.',
  night: 'that dark stretch is close to our battery limit.',
  comms: 'the link works, but it is patchy.',
  terrain: 'the slope is near the edge of what the lander can take.',
  science: 'the ice is a long drive away.',
};

const X_CHEER = {
  sunlight: 'the energy balance is positive with margin.',
  night: 'the thermal envelope holds.',
  comms: 'the link budget is fine.',
  terrain: 'the pad is level.',
  science: 'the target is within reach.',
};
const X_GRUMBLE = {
  sunlight: 'the array cannot keep up with the load.',
  night: 'the battery does not survive the longest dark period.',
  comms: 'we lose Earth for longer than procedure allows.',
  terrain: 'the slope is outside the landing envelope.',
  science: 'the science target is out of reach.',
};
const X_NERVOUS = {
  sunlight: 'the power margin is thin.',
  night: 'the endurance margin is thin.',
  comms: 'the blackouts are close to the limit.',
  terrain: 'the slope is close to the limit.',
  science: 'the traverse is long.',
};

/** Opening words that tie a speaker's line to the previous speaker. */
function reaction(prev, cur, ev, C, X) {
  const p = ev.aspects[prev].status, c = ev.aspects[cur].status;
  const pn = C[prev].name;
  const good = (st) => st === 'go';
  const bad = (st) => st === 'nogo' || st === 'unknown';
  if (c === 'off') return '';
  if (X) {
    if (good(p) && good(c)) return `I agree with ${pn}. `;
    if (good(p) && bad(c)) return `${pn}, your column looks fine, but mine does not. `;
    if (bad(p) && good(c)) return `${pn} has a real problem there. On my side, though: `;
    if (bad(p) && bad(c)) return `And it gets worse, ${pn}. `;
    if (p === 'marginal' && good(c)) return `Noted, ${pn}. My numbers are cleaner. `;
    if (c === 'marginal') return `${pn}, I share your caution. `;
    return `Building on what ${pn} said: `;
  }
  if (good(p) && good(c)) return `${pn} is happy, and so am I! `;
  if (good(p) && bad(c)) return `Easy, ${pn}, not so fast! `;
  if (bad(p) && good(c)) return `Cheer up, ${pn}! `;
  if (bad(p) && bad(c)) return `${pn}, I’m with you, this is bad. `;
  return `${pn}, listen to this: `;
}

export { coord };
export const verdictPhrase = (v) => ({ go: 'a strong choice', risky: 'workable, but the margins are thin', nogo: 'it breaks at least one of your rules' }[v]);

/** One short factual phrase per aspect, with numbers. */
function fact(aspect, a, take) {
  const m = a.metrics;
  switch (aspect) {
    case 'sunlight': return `the Sun is up **${take(m[0].value)}%** of the mission`;
    case 'night': return m[0].value === 0 ? `it never goes dark during the mission (**${take(0)} h** without Sun)` : `the longest dark stretch is **${take(m[0].value)} h**`;
    case 'comms': return `Earth is visible **${take(m[0].value)}%** of the time, longest gap ${take(m[1].value)} h`;
    case 'terrain': return `the ground has a slope of **${take(m[0].value)}°**`;
    default: return `the nearest shadowed crater is **${take(m[0].value)} km** away`;
  }
}

export function metricText(m) {
  if (m.value == null) return 'no data';
  return `${n(m.value)}${METRIC_UNIT[m.key]}`;
}

const line = (key, speaker, who, mood, text, used = [], status = null) => ({ key, speaker, name: who.name, role: who.role, mood, status, text, used });

/** The whole conversation for one place: guide intro, five characters, cross-talk, guide close. */
export function placeScript(place, { index, total, data, mission, mode = 'student', energy = null, lang = 'en' }) {
  if (lang === 'ar' && mode === 'expert') return placeScriptAr(place, { index, total, data, mission, energy });
  const cast = castFor(mode);
  const CHARACTERS = cast.members, GUIDE = cast.guide;
  const X = mode === 'expert';
  const CH = X ? X_CHEER : CHEER, GR = X ? X_GRUMBLE : GRUMBLE, NV = X ? X_NERVOUS : NERVOUS;
  const ev = place.ev;
  const days = mission.durationDays;
  const lines = [];

  const first = index === 0, last = index === total - 1;
  const intro = first ? 'First stop' : last ? 'Last stop' : `Stop ${index + 1} of ${total}`;
  lines.push(line('guide-intro', 'guide', GUIDE, 'happy',
    `${intro}: **${place.regionName}**, site ${place.site.name.split('·')[1]?.trim() ?? ''}. Its best start day for your ${days}-day mission is **${fmtDay(data, place.day)}**. Let’s hear what the council thinks.`));

  // Each specialist answers the one before: agreement, pushback or a hand-off, then their own numbers.
  let prev = null;
  for (const a of ORDER) {
    const s = X ? speakExpert(a, ev, { scope: 'window', days, energy }) : speak(a, ev, { scope: 'window', days });
    const text = prev ? `${reaction(prev, a, ev, CHARACTERS, X)}${s.line}` : s.line;
    lines.push(line(`ch-${a}`, a, CHARACTERS[a], s.mood, text, s.used, s.status));
    if (ev.aspects[a].status !== 'off') prev = a;
  }

  // cross-talk between the happiest and the unhappiest character
  const active = ORDER.filter((a) => ACTIVE_STATUS.includes(ev.aspects[a].status));
  const ranked = [...active].sort((a, b) => ev.aspects[b].score - ev.aspects[a].score);
  const best = ranked[0], worst = ranked[ranked.length - 1];
  if (active.length >= 2) {
    const bs = ev.aspects[best].status, ws = ev.aspects[worst].status;
    const bn = CHARACTERS[best].name, wn = CHARACTERS[worst].name;
    if (bs === 'go' && (ws === 'nogo' || ws === 'unknown')) {
      if (X) {
        lines.push(line('talk-1', best, CHARACTERS[best], 'happy', `${wn}, on my side ${CH[best]} Can we mitigate yours?`));
        lines.push(line('talk-2', worst, CHARACTERS[worst], MOOD[ws], `${bn}, a good number in your column does not move mine: ${GR[worst]} That is a hard constraint, not a preference.`));
      } else {
        lines.push(line('talk-1', best, CHARACTERS[best], 'happy', `${wn}, I know you’re upset. ${CHEER[best]}`));
        lines.push(line('talk-2', worst, CHARACTERS[worst], MOOD[ws], `${bn}, that’s lovely, but ${GRUMBLE[worst]} Your good news doesn’t fix my problem.`));
      }
    } else if (bs === 'go' && ws === 'marginal') {
      lines.push(line('talk-1', best, CHARACTERS[best], 'happy', X ? `${wn}, you are frowning. On my side ${CH[best]}` : `${wn}, you look nervous. ${CHEER[best]}`));
      lines.push(line('talk-2', worst, CHARACTERS[worst], 'nervous', X ? `${bn}, agreed on yours. But ${NV[worst]} I would like that in the risk register.` : `${bn}, fair. But ${NERVOUS[worst]} I’d like some margin.`));
    } else if (ws === 'go') {
      lines.push(line('talk-1', 'guide', GUIDE, 'happy', X ? 'Every lead reports nominal. At the south pole that is rare; note it.' : 'A rare moment: every one of you is happy here. At the pole that almost never happens.'));
    } else {
      lines.push(line('talk-1', best, CHARACTERS[best], MOOD[bs], X ? `${wn}, I have reservations too: ${bs === 'marginal' ? NV[best] : GR[best]}` : `${wn}, I’m not thrilled either. ${bs === 'marginal' ? NERVOUS[best] : GRUMBLE[best]}`));
      lines.push(line('talk-2', worst, CHARACTERS[worst], MOOD[ws], X ? `${bn}, then we agree. I would not recommend this site to the flight director.` : `${bn}, we agree on one thing: this place is a tough sell.`));
    }
  }

  const score = Math.round(ev.overall);
  lines.push(line('guide-close', 'guide', GUIDE, ev.verdict === 'go' ? 'happy' : ev.verdict === 'risky' ? 'nervous' : 'worried',
    `${place.regionName} in one line: ${verdictPhrase(ev.verdict)}. Overall score **${score}/100**.${energy ? ` Power model: ${SUITABILITY[energy.rating].label.toLowerCase()}.` : ''}`, [score]));
  return lines;
}

/** Guide line shown when the map first appears. */
export function mapIntro(result, mode = 'student', lang = 'en') {
  const GUIDE = castFor(mode).guide;
  const shown = result.places.length;
  const ok = result.places.filter((p) => p.ev.eligible).length;
  const used = [shown];
  if (lang === 'ar') {
    let text = `بناءً على متطلباتك، هذه أفضل **${shown}** مواقع لمهمتك. لنمرّ عليها واحدًا تلو الآخر.`;
    if (ok === 0) text = `فحصت كل المواقع المرشحة مقابل متطلباتك، و**لا يوجد** موقع يجتاز كل القواعد. هذه أقرب **${shown}** مواقع إلى النجاح. لنرَ أين يقصّر كل منها.`;
    else if (ok < shown) { used.push(ok); text = `بناءً على متطلباتك، هذه أفضل **${shown}** مواقع. **${ok}** منها تجتاز كل القواعد، والباقي هي الأقرب إلى النجاح. لنمرّ عليها واحدًا تلو الآخر.`; }
    return { text, used, line: lineAr('map-intro', 'guide', GUIDE, 'happy', text, used) };
  }
  let text = `After seeing your requirements, these are the best **${shown}** places for your trip. Let’s go and look at each one.`;
  if (ok === 0) text = `I searched every candidate site against your requirements and **none** passes every rule. These are the **${shown}** nearest misses. Let’s see where each one falls short.`;
  else if (ok < shown) { used.push(ok); text = `After seeing your requirements, here are the best **${shown}** places. **${ok}** of them pass every rule; the rest are the nearest misses. Let’s look at each one.`; }
  return { text, used, line: line('map-intro', 'guide', GUIDE, 'happy', text, used) };
}

/** The Leader: quick comparison, the verdict and why, the date, the watch-outs. */
export function leaderScript(result, { data, replan = null, mode = 'student', energy = null, vote = undefined, lang = 'en' }) {
  if (lang === 'ar' && mode === 'expert') return leaderScriptAr(result, { data, replan, energy, vote });
  const cast = castFor(mode);
  const LEADER = cast.leader;
  const { places, winner, mission } = result;
  const lines = [];
  if (!winner) return [line('l-none', 'leader', LEADER, 'thinking', 'I could not find any candidate site in the data. Check the date range and try again.')];
  const ev = winner.ev;
  const days = mission.durationDays;
  const used = [];
  const take = (x) => { used.push(x); return n(x); };

  const list = places.map((p, i) => `${i + 1}. ${p.regionName} (**${take(Math.round(p.ev.overall))}**)`).join(', ');
  const u0 = [...used]; used.length = 0;
  lines.push(line('l-compare', 'leader', LEADER, 'thinking',
    `I have listened to the council on all **${places.length}** places. Ranked by overall score out of 100: ${list}.`, [places.length, ...u0]));

  // What the room said about the front-runner: who was most confident, who objected.
  {
    const act = ORDER.filter((a) => ACTIVE_STATUS.includes(ev.aspects[a].status));
    if (act.length >= 2) {
      const sorted = [...act].sort((a, b) => ev.aspects[b].score - ev.aspects[a].score);
      const top = cast.members[sorted[0]].name, low = sorted[sorted.length - 1];
      const lowSt = ev.aspects[low].status;
      const txt = lowSt === 'go'
        ? `On ${winner.regionName} the whole council was on side; even ${cast.members[low].name}, the hardest to please, had no objection.`
        : `On ${winner.regionName}, ${top} was the most confident and ${cast.members[low].name} raised the strongest concern, about ${ASPECT_LABEL[low].toLowerCase()}. I weighed both.`;
      lines.push(line('l-council', 'leader', LEADER, 'thinking', txt, []));
    }
  }

  if (ev.eligible) {
    const active = ORDER.filter((a) => ACTIVE_STATUS.includes(ev.aspects[a].status));
    const top2 = [...active].sort((a, b) => ev.aspects[b].score - ev.aspects[a].score).slice(0, 2);
    const why = top2.map((a) => fact(a, ev.aspects[a], take)).join(', and ');
    const u1 = [...used]; used.length = 0;
    lines.push(line('l-verdict', 'leader', LEADER, 'happy',
      `My advice: land at **${winner.regionName}**, site **${winner.site.name.split('·')[1]?.trim()}** at ${coord(winner.site)} (${ev.verdict === 'go' ? 'GO' : 'RISKY'}). The reasons: ${why}.`, u1, ev.verdict));

    const second = places[1];
    if (second) {
      let bestA = null, bestD = -1;
      for (const a of active) {
        const d = ev.aspects[a].score - (second.ev.aspects[a]?.score ?? 0);
        if (d > bestD) { bestD = d; bestA = a; }
      }
      const m1 = ev.aspects[bestA].metrics[0], m2 = second.ev.aspects[bestA].metrics[0];
      // Gap from the SHOWN (rounded) scores, so the sentence never disagrees with the list above it.
      const gap = Math.round(ev.overall) - Math.round(second.ev.overall);
      const sc = (x) => { used.push(x); return n(x); };
      const lead = gap > 0
        ? `It beats ${second.regionName} by **${sc(gap)}** ${gap === 1 ? 'point' : 'points'}.`
        : `It ties with ${second.regionName} on score, and wins the tie-break because its weakest aspect is stronger.`;
      const txt = `${lead} The biggest difference is ${ASPECT_LABEL[bestA].toLowerCase()}: **${sc(m1.value)}${METRIC_UNIT[m1.key]}** here against ${sc(m2.value)}${METRIC_UNIT[m2.key]} there.`;
      lines.push(line('l-second', 'leader', LEADER, 'thinking', txt, [...used]));
      used.length = 0;

      // Honest trade-off: a higher-scoring place with thin margins vs a clean GO elsewhere.
      if (ev.verdict === 'risky') {
        const safer = places.slice(1).find((p) => p.ev.verdict === 'go');
        if (safer) {
          const thin = active.filter((a) => ev.aspects[a].status === 'marginal').map((a) => ASPECT_LABEL[a].toLowerCase());
          const sTxt = `One honest note: ${winner.regionName} scores higher, but it is thin on ${thin.join(' and ')}. ${safer.regionName} passes every aspect with room to spare (**${sc(Math.round(safer.ev.overall))}**/100). If you care about safety margin more than the last few points, choose ${safer.regionName}.`;
          lines.push(line('l-safer', 'leader', LEADER, 'thinking', sTxt, [...used]));
          used.length = 0;
        }
      }
    }

    const f = winner.flex;
    const sc = (x) => { used.push(x); return n(x); };
    const dateTxt = `Best window: **${fmtRange(data, winner.day, days)}** (UTC), ${a_an(days)} ${sc(days)}-day mission starting on ${fmtDay(data, winner.day)}. At this site **${sc(f.eligibleDays)}** of ${sc(f.totalDays)} possible start days pass every rule, ${f.eligibleDays >= 5 ? 'so you have room to slip' : f.eligibleDays > 1 ? 'so the schedule has little room to slip' : 'so the date is tight: this is the only day that works'}.`;
    lines.push(line('l-date', 'leader', LEADER, 'happy', dateTxt, [...used]));
    used.length = 0;

    if (energy) {
      const o = energy.out;
      const k = (x) => { const v = Math.round(x); used.push(v); return n(v); };
      const eTxt = `Power and heat, from the simulation: the array makes **${k(o.eSolarKWh)} kWh** against ${k(o.eLoadKWh)} kWh of load, the battery never drops below **${k(o.minSocPct)}%**, and the ground swings between ${k(o.tempMinC)} °C and ${k(o.tempMaxC)} °C. Rating: **${SUITABILITY[energy.rating].label}**.`;
      lines.push(line('l-energy', 'leader', LEADER, energy.rating === 'high' ? 'happy' : 'nervous', eTxt, [...used]));
      used.length = 0;
    }

    const weak = active.filter((a) => ev.aspects[a].status === 'marginal');
    if (weak.length) {
      const a = weak[0];
      const wl = `Watch out for ${ASPECT_LABEL[a].toLowerCase()}: it passes, but only just (${fact(a, ev.aspects[a], (x) => { used.push(x); return n(x); })}, against your limit of ${(() => { const L = ev.aspects[a].metrics[0].limit; used.push(L); return n(L); })()}${METRIC_UNIT[ev.aspects[a].metrics[0].key]}).`;
      lines.push(line('l-watch', 'leader', LEADER, 'nervous', wl, [...used]));
      used.length = 0;
    }
  } else {
    const hints = relaxHints(ev);
    const fails = hints.map((h) => `${ASPECT_LABEL[h.aspect].toLowerCase()} (it has **${(used.push(h.value), n(h.value))}${METRIC_UNIT[h.key]}**, you asked for ${h.direction} ${(used.push(h.limit), n(h.limit))}${METRIC_UNIT[h.key]})`).join('; ');
    lines.push(line('l-verdict', 'leader', LEADER, 'thinking',
      `The honest answer: **no place passes every rule.** The nearest miss is **${winner.regionName}**, site ${winner.site.name.split('·')[1]?.trim()}, and it fails on ${fails}.`, [...used], 'nogo'));
    used.length = 0;
    if (hints.length) {
      const h = hints[0];
      lines.push(line('l-relax', 'leader', LEADER, 'happy',
        `If your mission can live with ${h.direction} **${(used.push(h.relaxTo), n(h.relaxTo))}${METRIC_UNIT[h.key]}** for ${ASPECT_LABEL[h.aspect].toLowerCase()}, this site would pass. Otherwise try a different start window or a shorter mission.`, [...used]));
      used.length = 0;
    }
  }

  if (vote !== undefined && winner) {
    let txt; const vu = [];
    const vn = (x) => { vu.push(x); return n(x); };
    if (vote == null) txt = `You left the choice to me, and that is my answer.`;
    else if (vote === winner.region) txt = `You chose **${winner.regionName}** too. We agree, and for the same reasons the numbers give.`;
    else {
      const p = places.find((q) => q.region === vote);
      if (p) {
        const weak = ORDER.filter((a) => ['nogo', 'unknown', 'marginal'].includes(p.ev.aspects[a].status)).map((a) => ASPECT_LABEL[a].toLowerCase());
        const a = Math.round(p.ev.overall), b = Math.round(winner.ev.overall);
        txt = a === b
          ? `You chose **${p.regionName}**. A close call: it ties on score (**${vn(a)}**)${weak.length ? `, but the council flagged its ${weak.join(' and ')}` : ''}, and ${winner.regionName} has the stronger weakest aspect. That tips it for me.`
          : `You chose **${p.regionName}**. A fair instinct, but it scores **${vn(a)}** against ${vn(b)} here${weak.length ? `, and the council flagged its ${weak.join(' and ')}` : ''}. That is why I would not take it.`;
      }
    }
    if (txt) lines.push(line('l-vote', 'leader', LEADER, vote === winner.region || vote == null ? 'happy' : 'thinking', txt, vu));
  }

  if (replan) {
    let txt;
    const oldName = replan.site ? `${replan.site.name}` : 'your old site';
    if (!replan.inWindow) txt = `About your old plan: its date is outside the data window, so I cannot test it. Everything above is a fresh answer for your new requirements.`;
    else if (replan.recommendation === 'keep') txt = `About your old plan at **${oldName}**: it still passes under the new requirements (score **${(used.push(Math.round(replan.underNew.overall)), n(Math.round(replan.underNew.overall)))}**). You can keep it.`;
    else if (replan.recommendation === 'move-better') txt = `About your old plan at **${oldName}**: it still passes, but **${winner.regionName}** now scores clearly higher. Moving is worth thinking about.`;
    else if (replan.recommendation === 'shift') txt = `About your old plan at **${oldName}**: on the old date it breaks a rule under the new requirements, but the same site works on **${fmtDay(data, replan.shiftTo.day)}**. A new date can save the plan.`;
    else txt = `About your old plan at **${oldName}**: under the new requirements it breaks a rule on every possible date. It is time to move to a new place.`;
    lines.push(line('l-replan', 'leader', LEADER, replan.recommendation === 'keep' ? 'happy' : 'thinking', txt, [...used]));
    used.length = 0;
  }
  return lines;
}

/* ===================================================================== Arabic (Expert council) */
// Written as natural Modern Standard Arabic, not a word-for-word translation. Same numbers, same `used`.

const iso = (x) => `\u2068${x}\u2069`;
const lineAr = (key, speaker, who, mood, text, used = [], status = null) => ({ key, speaker, name: who.name_ar ?? who.name, role: who.role_ar ?? who.role, mood, status, text, used });
const LBL = (a) => ASPECT_LABEL_AR[a];
const siteNo = (p) => p.site.name.split('·')[1]?.trim() ?? '';
const coordAr = (s) => `${Math.abs(s.lat_deg).toFixed(2)}° ${s.lat_deg < 0 ? 'جنوبًا' : 'شمالًا'}، ${s.lon_deg.toFixed(2)}° شرقًا`;
const UNIT_AR = { sunPct: '%', maxDarkH: ' ساعة', earthPct: '%', earthGapH: ' ساعة', slopeDeg: '°', psrKm: ' كم' };
const unitAr = (key) => UNIT_AR[key] ?? METRIC_UNIT[key];
const verdictPhraseAr = (v) => ({ go: 'خيار قوي', risky: 'ممكن، لكن الهوامش ضيقة', nogo: 'يخالف قاعدة واحدة على الأقل من قواعدك' }[v]);

const X_CHEER_AR = {
  sunlight: 'ميزانية الطاقة موجبة وبهامش جيد.',
  night: 'الغلاف الحراري صامد.',
  comms: 'ميزانية الاتصال سليمة.',
  terrain: 'منطقة الهبوط مستوية.',
  science: 'الهدف في المتناول.',
};
const X_GRUMBLE_AR = {
  sunlight: 'الألواح لا تستطيع مجاراة الحمل.',
  night: 'البطارية لا تصمد خلال أطول فترة ظلام.',
  comms: 'نفقد الأرض مدة أطول مما تسمح به الإجراءات.',
  terrain: 'الميل خارج حدود الهبوط الآمن.',
  science: 'الهدف العلمي بعيد عن متناولنا.',
};
const X_NERVOUS_AR = {
  sunlight: 'هامش الطاقة ضيق.',
  night: 'هامش التحمّل ضيق.',
  comms: 'فترات الانقطاع قريبة من الحد.',
  terrain: 'الميل قريب من الحد.',
  science: 'الرحلة إلى الهدف طويلة.',
};

function reactionAr(prev, cur, ev, C) {
  const p = ev.aspects[prev].status, c = ev.aspects[cur].status;
  const pn = C[prev].name_ar ?? C[prev].name;
  const good = (st) => st === 'go';
  const bad = (st) => st === 'nogo' || st === 'unknown';
  if (c === 'off') return '';
  if (good(p) && good(c)) return `أتفق مع ${pn}. `;
  if (good(p) && bad(c)) return `يا ${pn}، أرقامك جيدة، لكن أرقامي ليست كذلك. `;
  if (bad(p) && good(c)) return `عند ${pn} مشكلة حقيقية. أما من جهتي: `;
  if (bad(p) && bad(c)) return `والأمر يزداد سوءًا يا ${pn}. `;
  if (p === 'marginal' && good(c)) return `ملاحظة مسجلة يا ${pn}. أرقامي أوضح. `;
  if (c === 'marginal') return `أشاركك الحذر يا ${pn}. `;
  return `بناءً على ما قاله ${pn}: `;
}

function factAr(aspect, a, take) {
  const m = a.metrics;
  switch (aspect) {
    case 'sunlight': return `الشمس ظاهرة **${take(m[0].value)}%** من زمن المهمة`;
    case 'night': return m[0].value === 0 ? `لا يحلّ الظلام طوال المهمة (**${take(0)} ساعة** بلا شمس)` : `أطول فترة ظلام **${take(m[0].value)} ساعة**`;
    case 'comms': return `الأرض ظاهرة **${take(m[0].value)}%** من الوقت، وأطول انقطاع ${take(m[1].value)} ساعة`;
    case 'terrain': return `ميل الأرض **${take(m[0].value)}°**`;
    default: return `أقرب فوهة مظللة على بعد **${take(m[0].value)} كم**`;
  }
}

function placeScriptAr(place, { index, total, data, mission, energy }) {
  const cast = castFor('expert');
  const C = cast.members, GUIDE = cast.guide;
  const ev = place.ev;
  const days = mission.durationDays;
  const lines = [];
  const first = index === 0, last = index === total - 1;
  const intro = first ? 'المحطة الأولى' : last ? 'المحطة الأخيرة' : `المحطة ${index + 1} من ${total}`;
  lines.push(lineAr('guide-intro', 'guide', GUIDE, 'happy',
    `${intro}: **${iso(place.regionName)}**، الموقع ${siteNo(place)}. أفضل يوم لبدء مهمتك التي تستمر ${days} يومًا هنا هو **${fmtDayAr(data, place.day)}**. لنسمع رأي المجلس.`));

  let prev = null;
  for (const a of ORDER) {
    const sp = speakExpert(a, ev, { scope: 'window', days, energy, lang: 'ar' });
    const text = prev ? `${reactionAr(prev, a, ev, C)}${sp.line}` : sp.line;
    lines.push(lineAr(`ch-${a}`, a, C[a], sp.mood, text, sp.used, sp.status));
    if (ev.aspects[a].status !== 'off') prev = a;
  }

  const active = ORDER.filter((a) => ACTIVE_STATUS.includes(ev.aspects[a].status));
  const ranked = [...active].sort((a, b) => ev.aspects[b].score - ev.aspects[a].score);
  const best = ranked[0], worst = ranked[ranked.length - 1];
  if (active.length >= 2) {
    const bs = ev.aspects[best].status, ws = ev.aspects[worst].status;
    const bn = C[best].name_ar ?? C[best].name, wn = C[worst].name_ar ?? C[worst].name;
    if (bs === 'go' && (ws === 'nogo' || ws === 'unknown')) {
      lines.push(lineAr('talk-1', best, C[best], 'happy', `يا ${wn}، من جهتي ${X_CHEER_AR[best]} هل يمكننا تخفيف مشكلتك؟`));
      lines.push(lineAr('talk-2', worst, C[worst], MOOD[ws], `يا ${bn}، الرقم الجيد عندك لا يغيّر رقمي: ${X_GRUMBLE_AR[worst]} هذا قيد صارم، وليس تفضيلًا.`));
    } else if (bs === 'go' && ws === 'marginal') {
      lines.push(lineAr('talk-1', best, C[best], 'happy', `يا ${wn}، تبدو قلقًا. من جهتي ${X_CHEER_AR[best]}`));
      lines.push(lineAr('talk-2', worst, C[worst], 'nervous', `متفق معك فيما يخصك يا ${bn}. لكن ${X_NERVOUS_AR[worst]} وأريد تسجيل ذلك في سجل المخاطر.`));
    } else if (ws === 'go') {
      lines.push(lineAr('talk-1', 'guide', GUIDE, 'happy', 'كل المتخصصين يقولون إن الوضع طبيعي. عند القطب الجنوبي هذا نادر، فلنسجّله.'));
    } else {
      lines.push(lineAr('talk-1', best, C[best], MOOD[bs], `يا ${wn}، لديّ تحفظات أنا أيضًا: ${bs === 'marginal' ? X_NERVOUS_AR[best] : X_GRUMBLE_AR[best]}`));
      lines.push(lineAr('talk-2', worst, C[worst], MOOD[ws], `إذن نحن متفقان يا ${bn}. لن أوصي بهذا الموقع لمدير الرحلة.`));
    }
  }

  const score = Math.round(ev.overall);
  lines.push(lineAr('guide-close', 'guide', GUIDE, ev.verdict === 'go' ? 'happy' : ev.verdict === 'risky' ? 'nervous' : 'worried',
    `${iso(place.regionName)} باختصار: ${verdictPhraseAr(ev.verdict)}. الدرجة الإجمالية **${score}/100**.${energy ? ` نموذج الطاقة: ${SUITABILITY[energy.rating].label_ar}.` : ''}`, [score]));
  return lines;
}

function leaderScriptAr(result, { data, replan, energy, vote }) {
  const cast = castFor('expert');
  const LEADER = cast.leader;
  const C = cast.members;
  const nm = (a) => C[a].name_ar ?? C[a].name;
  const { places, winner, mission } = result;
  const lines = [];
  if (!winner) return [lineAr('l-none', 'leader', LEADER, 'thinking', 'لم أجد أي موقع مرشح في البيانات. راجع نطاق التواريخ وحاول مرة أخرى.')];
  const ev = winner.ev;
  const days = mission.durationDays;
  const used = [];
  const take = (x) => { used.push(x); return n(x); };

  const list = places.map((p, i) => `${iso(`${i + 1}. ${p.regionName} (**${take(Math.round(p.ev.overall))}**)`)}`).join('، ');
  const u0 = [...used]; used.length = 0;
  lines.push(lineAr('l-compare', 'leader', LEADER, 'thinking',
    `استمعت إلى المجلس في كل المواقع الـ**${places.length}**. ترتيبها حسب الدرجة الإجمالية من 100: ${list}.`, [places.length, ...u0]));

  {
    const act = ORDER.filter((a) => ACTIVE_STATUS.includes(ev.aspects[a].status));
    if (act.length >= 2) {
      const sorted = [...act].sort((a, b) => ev.aspects[b].score - ev.aspects[a].score);
      const top = nm(sorted[0]), low = sorted[sorted.length - 1];
      const txt = ev.aspects[low].status === 'go'
        ? `في ${iso(winner.regionName)} كان المجلس كله موافقًا، حتى ${nm(low)}، وهو الأصعب إرضاءً، لم يعترض.`
        : `في ${iso(winner.regionName)} كان ${top} الأكثر ثقة، وأبدى ${nm(low)} أقوى تحفظ، وكان بشأن ${LBL(low)}. وقد وازنت بين الرأيين.`;
      lines.push(lineAr('l-council', 'leader', LEADER, 'thinking', txt, []));
    }
  }

  if (ev.eligible) {
    const active = ORDER.filter((a) => ACTIVE_STATUS.includes(ev.aspects[a].status));
    const top2 = [...active].sort((a, b) => ev.aspects[b].score - ev.aspects[a].score).slice(0, 2);
    const why = top2.map((a) => factAr(a, ev.aspects[a], take)).join('، كما أن ');
    const u1 = [...used]; used.length = 0;
    lines.push(lineAr('l-verdict', 'leader', LEADER, 'happy',
      `نصيحتي: اهبطوا في **${iso(winner.regionName)}**، الموقع **${siteNo(winner)}** عند ${coordAr(winner.site)} (${ev.verdict === 'go' ? 'مناسب للهبوط' : 'ممكن بحذر'}). والأسباب: ${why}.`, u1, ev.verdict));

    const second = places[1];
    if (second) {
      let bestA = null, bestD = -1;
      for (const a of active) {
        const d = ev.aspects[a].score - (second.ev.aspects[a]?.score ?? 0);
        if (d > bestD) { bestD = d; bestA = a; }
      }
      const m1 = ev.aspects[bestA].metrics[0], m2 = second.ev.aspects[bestA].metrics[0];
      const gap = Math.round(ev.overall) - Math.round(second.ev.overall);
      const sc = (x) => { used.push(x); return n(x); };
      const lead = gap > 0
        ? `يتفوق على ${iso(second.regionName)} بفارق **${sc(gap)}** ${gap === 1 ? 'نقطة' : gap === 2 ? 'نقطتين' : gap <= 10 ? 'نقاط' : 'نقطة'}.`
        : `يتعادل مع ${iso(second.regionName)} في الدرجة، ويفوز بالترجيح لأن أضعف جوانبه أقوى.`;
      const txt = `${lead} الفرق الأكبر في ${LBL(bestA)}: **${sc(m1.value)}${unitAr(m1.key)}** هنا مقابل ${sc(m2.value)}${unitAr(m2.key)} هناك.`;
      lines.push(lineAr('l-second', 'leader', LEADER, 'thinking', txt, [...used]));
      used.length = 0;

      if (ev.verdict === 'risky') {
        const safer = places.slice(1).find((p) => p.ev.verdict === 'go');
        if (safer) {
          const thin = active.filter((a) => ev.aspects[a].status === 'marginal').map(LBL);
          const sTxt = `ملاحظة بصراحة: درجة ${iso(winner.regionName)} أعلى، لكن هامشه ضيق في ${thin.join(' و')}. أما ${iso(safer.regionName)} فيجتاز كل الجوانب بهامش مريح (**${sc(Math.round(safer.ev.overall))}**/100). إن كان هامش الأمان أهم عندك من النقاط الأخيرة، فاختر ${iso(safer.regionName)}.`;
          lines.push(lineAr('l-safer', 'leader', LEADER, 'thinking', sTxt, [...used]));
          used.length = 0;
        }
      }
    }

    const f = winner.flex;
    const sc = (x) => { used.push(x); return n(x); };
    const room = f.eligibleDays >= 5 ? 'فلديك مرونة في التأجيل' : f.eligibleDays > 1 ? 'فالجدول لا يحتمل تأجيلًا كبيرًا' : 'فالموعد ضيق: هذا هو اليوم الوحيد المناسب';
    const dateTxt = `أفضل نافذة: **${fmtRangeAr(data, winner.day, days)}** (بتوقيت UTC)، لمهمة مدتها ${sc(days)} يومًا تبدأ في ${fmtDayAr(data, winner.day)}. في هذا الموقع يجتاز **${sc(f.eligibleDays)}** يومًا من أصل ${sc(f.totalDays)} يومًا ممكنًا كل القواعد، ${room}.`;
    lines.push(lineAr('l-date', 'leader', LEADER, 'happy', dateTxt, [...used]));
    used.length = 0;

    if (energy) {
      const o = energy.out;
      const k = (x) => { const v = Math.round(x); used.push(v); return n(v); };
      const eTxt = `الطاقة والحرارة حسب المحاكاة: تنتج الألواح **${k(o.eSolarKWh)} كيلوواط ساعة** مقابل حمل ${k(o.eLoadKWh)} كيلوواط ساعة، ولا ينخفض شحن البطارية عن **${k(o.minSocPct)}%**، وتتراوح حرارة الأرض بين ${k(o.tempMinC)} °م و${k(o.tempMaxC)} °م. التقييم: **${SUITABILITY[energy.rating].label_ar}**.`;
      lines.push(lineAr('l-energy', 'leader', LEADER, energy.rating === 'high' ? 'happy' : 'nervous', eTxt, [...used]));
      used.length = 0;
    }

    const weak = active.filter((a) => ev.aspects[a].status === 'marginal');
    if (weak.length) {
      const a = weak[0];
      const fx = factAr(a, ev.aspects[a], (x) => { used.push(x); return n(x); });
      const L = ev.aspects[a].metrics[0].limit; used.push(L);
      const wl = `انتبه إلى ${LBL(a)}: يجتاز الحد، لكن بالكاد (${fx}، وحدّك ${n(L)}${unitAr(ev.aspects[a].metrics[0].key)}).`;
      lines.push(lineAr('l-watch', 'leader', LEADER, 'nervous', wl, [...used]));
      used.length = 0;
    }
  } else {
    const hints = relaxHints(ev);
    const dir = (d) => (d === 'at least' ? 'على الأقل' : 'على الأكثر');
    const fails = hints.map((h) => `${LBL(h.aspect)} (القيمة **${(used.push(h.value), n(h.value))}${unitAr(h.key)}**، وطلبت ${(used.push(h.limit), n(h.limit))}${unitAr(h.key)} ${dir(h.direction)})`).join('؛ ');
    lines.push(lineAr('l-verdict', 'leader', LEADER, 'thinking',
      `الإجابة الصريحة: **لا يوجد موقع يجتاز كل القواعد.** الأقرب هو **${iso(winner.regionName)}**، الموقع ${siteNo(winner)}، ويقصّر في ${fails}.`, [...used], 'nogo'));
    used.length = 0;
    if (hints.length) {
      const h = hints[0];
      lines.push(lineAr('l-relax', 'leader', LEADER, 'happy',
        `إذا كانت مهمتك تحتمل **${(used.push(h.relaxTo), n(h.relaxTo))}${unitAr(h.key)}** ${dir(h.direction)} في ${LBL(h.aspect)}، فسيجتاز هذا الموقع. وإلا فجرّب نافذة بدء أخرى أو مهمة أقصر.`, [...used]));
      used.length = 0;
    }
  }

  if (vote !== undefined && winner) {
    let txt; const vu = [];
    const vn = (x) => { vu.push(x); return n(x); };
    if (vote == null) txt = 'تركت لي الاختيار، وهذا هو جوابي.';
    else if (vote === winner.region) txt = `اخترت **${iso(winner.regionName)}** أنت أيضًا. نحن متفقان، وللأسباب نفسها التي تقولها الأرقام.`;
    else {
      const p = places.find((q) => q.region === vote);
      if (p) {
        const weak = ORDER.filter((a) => ['nogo', 'unknown', 'marginal'].includes(p.ev.aspects[a].status)).map(LBL);
        const a = Math.round(p.ev.overall), b = Math.round(winner.ev.overall);
        txt = a === b
          ? `اخترت **${iso(p.regionName)}**. قرار متقارب: يتعادل في الدرجة (**${vn(a)}**)${weak.length ? `، لكن المجلس نبّه إلى ${weak.join(' و')}` : ''}، و${iso(winner.regionName)} أقوى في أضعف جوانبه. وهذا ما يرجّح الكفة عندي.`
          : `اخترت **${iso(p.regionName)}**. حدس معقول، لكن درجته **${vn(a)}** مقابل ${vn(b)} هنا${weak.length ? `، كما نبّه المجلس إلى ${weak.join(' و')}` : ''}. لهذا لن أختاره.`;
      }
    }
    if (txt) lines.push(lineAr('l-vote', 'leader', LEADER, vote === winner.region || vote == null ? 'happy' : 'thinking', txt, vu));
  }

  if (replan) {
    let txt;
    const oldName = replan.site ? `${replan.site.name}` : 'موقعك القديم';
    if (!replan.inWindow) txt = 'بخصوص خطتك القديمة: تاريخها خارج نافذة البيانات، فلا أستطيع اختبارها. كل ما سبق إجابة جديدة لمتطلباتك الجديدة.';
    else if (replan.recommendation === 'keep') txt = `بخصوص خطتك القديمة في **${iso(oldName)}**: ما زالت تجتاز المتطلبات الجديدة (الدرجة **${(used.push(Math.round(replan.underNew.overall)), n(Math.round(replan.underNew.overall)))}**). يمكنك الإبقاء عليها.`;
    else if (replan.recommendation === 'move-better') txt = `بخصوص خطتك القديمة في **${iso(oldName)}**: ما زالت تجتاز، لكن درجة **${iso(winner.regionName)}** أصبحت أعلى بوضوح. الانتقال يستحق التفكير.`;
    else if (replan.recommendation === 'shift') txt = `بخصوص خطتك القديمة في **${iso(oldName)}**: في التاريخ القديم تخالف قاعدة تحت المتطلبات الجديدة، لكن الموقع نفسه يصلح في **${fmtDayAr(data, replan.shiftTo.day)}**. تاريخ جديد قد ينقذ الخطة.`;
    else txt = `بخصوص خطتك القديمة في **${iso(oldName)}**: تحت المتطلبات الجديدة تخالف قاعدة في كل التواريخ الممكنة. حان وقت الانتقال إلى مكان جديد.`;
    lines.push(lineAr('l-replan', 'leader', LEADER, replan.recommendation === 'keep' ? 'happy' : 'thinking', txt, [...used]));
    used.length = 0;
  }
  return lines;
}
