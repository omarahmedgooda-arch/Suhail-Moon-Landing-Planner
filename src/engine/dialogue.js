// Template dialogue. Every number in a sentence comes from the evaluation object,
// so the story can never disagree with the data (SRS T-07 idea). `used` lists the numbers
// so the unit test can compare them with the data.
//
// Mini-markup understood by <Rich/>:  **bold**   {{term-key|shown text}}

import { LIMITS, METRIC_UNIT } from './rules.js';

const n = (x) => (Number.isInteger(x) ? String(x) : (Math.round(x * 10) / 10).toString());
const metric = (a, key) => a.metrics.find((m) => m.key === key);

export const MOOD = { go: 'happy', marginal: 'nervous', nogo: 'worried', unknown: 'confused', off: 'asleep' };

function scopePhrase(ctx) {
  return ctx.scope === 'average' ? ` across the whole ${ctx.windowDays ?? 30}-day data window` : ` during your ${ctx.days}-day mission`;
}

/** Returns { mood, status, line, used[] } for one aspect of one evaluation. */
export function speak(aspect, evalResult, ctx) {
  const a = evalResult.aspects[aspect];
  const status = a.status;
  const used = [];
  const take = (x) => { used.push(x); return n(x); };
  let line = '';

  if (status === 'off') {
    line = {
      sunlight: 'You turned sunlight off for this mission. I’ll stay quiet, but panels do like light.',
      night: 'You turned the night off, so I’ll stay quiet. The lunar night doesn’t care, though.',
      comms: 'You said the link to Earth doesn’t matter. Then nobody will hear us, but fine.',
      terrain: 'You turned the ground off. I’d like a word about that…',
      science: 'Science isn’t the goal of this mission, so I’m just here for the view.',
    }[aspect];
    return { mood: MOOD.off, status, line, used };
  }

  if (aspect === 'sunlight') {
    const m = metric(a, 'sunPct');
    if (status === 'unknown') line = 'I can’t see any lighting numbers for this site, and {{unknown|unknown is not a pass}}. I can’t say yes.';
    else if (status === 'go') line = `Solar panels are like a phone charger: no light, no power. Here the Sun is up **${take(m.value)}%** of the time${scopePhrase(ctx)}. You asked for ${take(m.limit)}% or more, so I’m smiling.`;
    else if (status === 'marginal') line = `Just enough. The Sun is up **${take(m.value)}%** of the time${scopePhrase(ctx)}, only ${n(Math.max(0, m.value - m.limit))} points over your ${take(m.limit)}% limit. One long shadow and I get nervous.`;
    else line = `Too dark for me. The Sun is up only **${take(m.value)}%** of the time${scopePhrase(ctx)} and you need ${take(m.limit)}% or more. My panels would sit in the shade.`;
  }

  if (aspect === 'night') {
    const m = metric(a, 'maxDarkH');
    if (status === 'unknown') line = 'I have no dark-stretch data for this site, and {{unknown|unknown is not a pass}}.';
    else if (m.value === 0) { line = `The Sun never sets on this window: **${take(0)} h** of darkness, so there is no night to survive. I’m toasty!`; }
    else if (status === 'go') line = `Lunar nights are long and freezing. The longest stretch without Sun here is **${take(m.value)} h**, and your battery lasts ${take(m.limit)} h. We stay warm.`;
    else if (status === 'marginal') line = `Longest dark stretch: **${take(m.value)} h**. Battery: ${take(m.limit)} h. That’s cutting it close, like a phone at 5%.`;
    else line = `Brrr! **${take(m.value)} hours** without Sun, but the battery only lasts ${take(m.limit)} h. We’d freeze before the light comes back.`;
  }

  if (aspect === 'comms') {
    const p = metric(a, 'earthPct');
    const g = metric(a, 'earthGapH');
    if (status === 'unknown') line = 'There is no Earth-visibility data for this site yet. I can’t promise a link, and {{unknown|unknown is not a pass}}.';
    else if (status === 'go') line = `Earth is our phone line. From here it’s above the horizon **${take(p.value)}%** of the time, and the longest silence is only ${take(g.value)} h. Loud and clear!`;
    else if (status === 'marginal') line = `I can reach Earth **${take(p.value)}%** of the time, and the longest silence is ${take(g.value)} h. It works, but expect some static.`;
    else if (p.pass === false) line = `Radio silence! Earth is hidden ${n(100 - p.value)}% of the time (it is visible ${take(p.value)}% and you need ${take(p.limit)}%). A hill is in the way, like a phone behind a mountain.`;
    else line = `Earth shows up often enough, but the longest blackout is **${take(g.value)} h** and your limit is ${take(g.limit)} h. Too long without a link.`;
  }

  if (aspect === 'terrain') {
    const m = metric(a, 'slopeDeg');
    if (status === 'unknown') line = 'I have no slope data for this site, and {{unknown|unknown is not a pass}}.';
    else if (status === 'go') line = `Landing here is like parking on flat ground. The {{slope|slope}} is **${take(m.value)}°**, well under your ${take(m.limit)}° limit. Legs steady.`;
    else if (status === 'marginal') line = `{{slope|Slope}}: **${take(m.value)}°**. Limit: ${take(m.limit)}°. It’s like parking on a gentle hill: doable, but I’d pull the handbrake.`;
    else line = `Whoa, **${take(m.value)}°**! Your limit is ${take(m.limit)}°. A lander is tall and narrow like a stool, and on a hillside it tips over.`;
  }

  if (aspect === 'science') {
    const m = metric(a, 'psrKm');
    if (status === 'unknown') line = 'I have no shadow-map data for this site, and {{unknown|unknown is not a pass}}.';
    else if (status === 'go') line = `Ice hunters love this spot! The nearest {{psr|permanently shadowed crater}} is only **${take(m.value)} km** away, inside your ${take(m.limit)} km reach.`;
    else if (status === 'marginal') line = `The nearest shadowed crater is **${take(m.value)} km** away and your limit is ${take(m.limit)} km. A long drive, but possible.`;
    else line = `Too far from the ice: **${take(m.value)} km** to the nearest shadowed crater, and your limit is ${take(m.limit)} km.`;
  }

  return { mood: MOOD[status], status, line, used };
}

/** Plain-language limit sentence for the "Why?" card. */
export function limitSentence(aspect, evalResult, mission) {
  const a = evalResult.aspects[aspect];
  if (a.status === 'off') return 'This aspect is switched off for this mission.';
  const L = (key) => a.metrics.find((m) => m.key === key)?.limit;
  const table = (key) => `Low ${LIMITS[key].low} · Medium ${LIMITS[key].medium} · High ${LIMITS[key].high}`;
  const note = '(team assumptions, not NASA standards)';
  switch (aspect) {
    case 'sunlight': return `Your limit: the Sun up at least ${L('sunPct')}% of the mission. Levels: ${table('sunPct')} ${note}.`;
    case 'night': return `Your limit: no dark stretch longer than the ${mission.batteryH} h battery.`;
    case 'comms': return `Your limits: Earth visible at least ${L('earthPct')}% of the mission and no gap longer than ${L('earthGapH')} h. Levels: ${table('earthPct')} ${note}.`;
    case 'terrain': return `Your limit: slope up to ${L('slopeDeg')}°. Levels: ${table('slopeDeg')} ${note}.`;
    case 'science': return `Your limit: within ${L('psrKm')} km of a permanently shadowed region. Levels: ${table('psrKm')} ${note}.`;
    default: return '';
  }
}

export { METRIC_UNIT };

/**
 * Expert-mode voices (English, technical). Each specialist argues from their own discipline; Tariq and
 * Dr. Thuraya also cite the power simulation when it is available (ctx.energy = simulateEnergy output).
 */
export function speakExpert(aspect, evalResult, ctx) {
  const a = evalResult.aspects[aspect];
  const status = a.status;
  const used = [];
  const take = (x) => { used.push(x); return n(x); };
  const r0 = (x) => Math.round(x);
  const E = ctx.energy?.out;
  let line = '';
  if (status === 'off') {
    line = {
      sunlight: 'Solar is switched off as a criterion. For the record: I will still size the array, I just will not score it.',
      night: 'Thermal is out of scope for this run. I will note that the night does not read our requirements.',
      comms: 'Link criteria are off. Procedure says I log that as an accepted risk.',
      terrain: 'Terrain is not being scored. I would not sign a landing on that basis.',
      science: 'No science criterion here. Then this is an engineering run, and I am an observer.',
    }[aspect];
    return { mood: MOOD.off, status, line, used };
  }
  if (status === 'unknown') return { mood: MOOD.unknown, status, line: 'No data for my criterion at this site. Under our rules an {{unknown|unverified}} value is not a pass.', used };

  if (aspect === 'sunlight') {
    const m = metric(a, 'sunPct');
    const pre = status === 'go' ? 'Power case closes.' : status === 'marginal' ? 'Power case closes, barely.' : 'Power case does not close.';
    line = `${pre} Sun above the local horizon **${take(m.value)}%** of the window against a ${take(m.limit)}% requirement.`;
    if (E) line += ` The array yields **${take(r0(E.eSolarKWh))} kWh** for a load of ${take(r0(E.eLoadKWh))} kWh, peak ${take(r0(E.pvPeakW))} W.`;
  }
  if (aspect === 'night') {
    const m = metric(a, 'maxDarkH');
    if (m.value === 0) line = `No darkness in this window: **${take(0)} h**. Battery endurance is ${take(m.limit)} h, so the heaters never have to fight a night.`;
    else if (status === 'go') line = `Longest continuous darkness **${take(m.value)} h**, battery endurance ${take(m.limit)} h. Survivable with margin.`;
    else if (status === 'marginal') line = `Longest darkness **${take(m.value)} h** against ${take(m.limit)} h of endurance. That is inside the envelope, but not by much. I want the worst hour modelled, not averaged.`;
    else line = `Longest darkness **${take(m.value)} h**, endurance only ${take(m.limit)} h. The heaters would draw the battery to its floor. I cannot accept this.`;
    if (E) line += ` Surface model: **${take(r0(E.tempMinC))} °C** to ${take(r0(E.tempMaxC))} °C; minimum state of charge ${take(r0(E.minSocPct))}%.`;
  }
  if (aspect === 'comms') {
    const p = metric(a, 'earthPct');
    const g = metric(a, 'earthGapH');
    if (status === 'go') line = `Earth in view **${take(p.value)}%** of the time, longest blackout ${take(g.value)} h. The link is nominal.`;
    else if (status === 'marginal') line = `Earth in view **${take(p.value)}%**, longest blackout ${take(g.value)} h. Acceptable, but critical events must be scheduled inside the visibility windows.`;
    else if (p.pass === false) line = `Earth in view only **${take(p.value)}%** of the time; the requirement is ${take(p.limit)}%. Terrain is in the line of sight. I would need a relay.`;
    else line = `Visibility is adequate, but the longest blackout is **${take(g.value)} h** against a ${take(g.limit)} h limit. Too long without telemetry.`;
  }
  if (aspect === 'terrain') {
    const m = metric(a, 'slopeDeg');
    if (status === 'go') line = `Slope **${take(m.value)}°**, limit ${take(m.limit)}°. The ground is honest here.`;
    else if (status === 'marginal') line = `Slope **${take(m.value)}°** with a ${take(m.limit)}° limit. At 80 metres per pixel the real surface is rougher than this number. I would want a closer look.`;
    else line = `**${take(m.value)}°**. The limit is ${take(m.limit)}°. I have seen landers tip on less. My answer is no.`;
  }
  if (aspect === 'science') {
    const m = metric(a, 'psrKm');
    if (status === 'go') line = `Nearest permanently shadowed region **${take(m.value)} km** away, inside the ${take(m.limit)} km reach. That is a cold trap we can actually sample.`;
    else if (status === 'marginal') line = `Cold trap at **${take(m.value)} km**, limit ${take(m.limit)} km. Reachable, but the traverse eats the schedule.`;
    else line = `**${take(m.value)} km** to the nearest cold trap, beyond the ${take(m.limit)} km reach. A safe site this far from the target is a beautiful parking lot.`;
  }
  return { mood: MOOD[status], status, line, used };
}
