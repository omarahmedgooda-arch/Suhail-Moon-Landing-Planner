// "Save the Mission" – the Student mode game. Static content, no data needed.
// Each round: one crew member makes a silly suggestion (one of the three options), the player picks.
// kind: 'silly' (the crew member's idea), 'good' (correct), 'bad' (another wrong idea).

export const GAME_MISSIONS = [
  { id: 'rover', name: 'Ice Hunter Rover', blurb: 'Drive to the edge of a frozen crater and look for water ice.', icon: '🛞' },
  { id: 'lab', name: 'Solar Science Lab', blurb: 'A small lab that runs experiments for two weeks on solar power.', icon: '🔬' },
  { id: 'relay', name: 'Signal Station', blurb: 'A radio station that keeps future astronauts in touch with Earth.', icon: '📡' },
];

export const GAME_ROUNDS_V2 = [
  {
    aspect: 'terrain', meter: 'Stability', title: 'Where do we touch down?',
    silly: 'Look at all those big rocks and craters! It looks AMAZING. Let’s land right there!',
    options: [
      { kind: 'silly', text: 'The crater edge full of boulders', scene: 'boulders' },
      { kind: 'good', text: 'A wide flat plain with gentle slopes', scene: 'flat' },
      { kind: 'bad', text: 'The steep side of a mountain', scene: 'steep' },
    ],
    win: 'Smooth touchdown! Flat ground keeps all four legs on the surface.',
    lose: { silly: 'CRUNCH. A leg hit a boulder and the lander tipped over, just like Odysseus in 2024.', bad: 'The lander slid down the slope and fell on its side.' },
    hint: 'A lander is tall and narrow like a stool. What kind of floor does a stool need?',
  },
  {
    aspect: 'sunlight', meter: 'Power', title: 'Where do we put the solar panels?',
    silly: 'Who needs the Sun? I packed a giant flashlight! Let’s park in the dark crater.',
    options: [
      { kind: 'silly', text: 'At the bottom of a dark crater (bring a flashlight)', scene: 'darkcrater' },
      { kind: 'bad', text: 'Right behind a tall mountain', scene: 'shadow' },
      { kind: 'good', text: 'On a high ridge that sees the Sun most of the time', scene: 'ridge' },
    ],
    win: 'Panels are glowing! At the pole the Sun skims the horizon, so high ground catches the light.',
    lose: { silly: 'The flashlight runs on… the batteries. Which need the Sun. The screens go black.', bad: 'The mountain’s shadow covers the panels for days. Power drops to zero.' },
    hint: 'Near the south pole the Sun stays very low. Do high places or low places see it?',
  },
  {
    aspect: 'night', meter: 'Heat', title: 'The night is coming. Brrr!',
    silly: 'It’s getting cold? Easy! We open the windows and let the warm air in!',
    options: [
      { kind: 'bad', text: 'Ignore it, electronics don’t feel cold', scene: 'ignore' },
      { kind: 'good', text: 'Pick a spot with short nights, and keep heaters on the battery', scene: 'heater' },
      { kind: 'silly', text: 'Open the windows for some warm air', scene: 'window' },
    ],
    win: 'Toasty inside! Short dark spells mean the battery and heaters can carry us to sunrise.',
    lose: { silly: 'There is no air on the Moon, warm or cold. Everything freezes in minutes!', bad: 'At about −170 °C the batteries freeze and the computer stops. Mission over.' },
    hint: 'The Moon has no air. What keeps electronics warm when there is no Sun?',
  },
  {
    aspect: 'comms', meter: 'Signal', title: 'How do we talk to Earth?',
    silly: 'Radio? Pfff. If we lose the signal I’ll just SHOUT really loud toward Earth!',
    options: [
      { kind: 'good', text: 'A spot where Earth is above the hills most of the time', scene: 'earthview' },
      { kind: 'silly', text: 'Behind a big hill, and shout if needed', scene: 'hill' },
      { kind: 'bad', text: 'Deep inside a crater', scene: 'pit' },
    ],
    win: 'Loud and clear! Radio travels in straight lines, so we need Earth in sight.',
    lose: { silly: 'Sound can’t travel through space. Earth hears nothing, and the hill blocks the radio too.', bad: 'The crater walls block Earth completely. No commands, no data home.' },
    hint: 'Radio waves go in straight lines, like light. Can you see Earth from there?',
  },
  {
    aspect: 'science', meter: 'Science', title: 'What are we here to study?',
    silly: 'Science? Boring! Let’s land next to any random rock and take selfies.',
    options: [
      { kind: 'bad', text: 'Inside the frozen crater itself (dark and −230 °C)', scene: 'icecrater' },
      { kind: 'silly', text: 'Next to any random rock', scene: 'rock' },
      { kind: 'good', text: 'A safe spot near a frozen crater that may hold water ice', scene: 'nearice' },
    ],
    win: 'Jackpot! Close enough to reach the ice, safe enough to stay alive.',
    lose: { silly: 'Nice selfies… but the mission learned nothing. The scientists are not amused.', bad: 'Too dark and too cold to survive. The rover never wakes up.' },
    hint: 'We want the ice, but we also want to survive. Near it, or inside it?',
  },
];

export const GAME_DOCTOR = {
  intro: 'Welcome, Commander. This crew means well… mostly. Every time one of them has an idea, you decide. Keep all five gauges up and the mission survives!',
  good: ['Excellent decision, Commander!', 'That is exactly what a real mission planner would do.', 'Science wins again!'],
  bad: ['Oh no… let me explain what went wrong.', 'That one hurt. Let’s learn from it.', 'Hmm. The Moon is not forgiving.'],
};

export function gameResult(meters) {
  const low = Object.entries(meters).filter(([, v]) => v < 50).map(([k]) => k);
  if (!low.length) return { ok: true, title: 'Mission saved!', text: 'Every system is green. You kept the crew’s ideas under control and chose like a real landing-site team.' };
  if (low.length <= 2) return { ok: false, title: 'Mission limping', text: `The lander survived, but ${low.join(' and ')} failed. Part of the science was lost.` };
  return { ok: false, title: 'Mission lost', text: `Too many systems failed (${low.join(', ')}). Don’t worry: real teams learn the same way. Try again!` };
}
