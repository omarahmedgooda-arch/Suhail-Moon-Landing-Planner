// Act 1 – the story. Every historical claim below was checked against the linked source
// (see SOURCES in characters.js). If you change a claim, re-check it and update the source.

import { SOURCES } from './characters.js';

export const HERO = {
  eyebrow: 'Student mode',
  title: 'The Moon doesn’t care how good your rocket is.',
  lead: 'Getting there is only half the job. The other half is choosing where, and on which day, to land. Hear the story, learn how the choice is made, then make it yourself.',
  meta: 'About 10 minutes · no space knowledge needed',
};

export const SCENES = [
  {
    id: 'checklist',
    stamp: 'February 1968',
    title: 'Before the first footstep, there was a checklist.',
    body: [
      'NASA’s Apollo Site Selection Board had a list of 30 possible spots and a job: narrow it to five. It didn’t pick the prettiest place. It checked boxes.',
    ],
    cards: [
      { key: 'Smooth', text: 'Few craters, and a general slope under **2°**.', art: 'flat' },
      { key: 'Clear approach', text: 'No large hills, tall cliffs or deep craters on the way in.', art: 'approach' },
      { key: 'Right light', text: 'Sun **7° to 20°** behind the lander. That gives one launch window per month for a given site.', art: 'light' },
    ],
    callout: 'Terrain. Light. Timing. Remember those three words. They never stopped mattering.',
    source: SOURCES.apolloSites,
  },
  {
    id: 'eagle',
    stamp: 'July 1969',
    title: 'And even then, the spot nearly bit back.',
    body: [
      'Apollo 11’s lander, Eagle, was running long. Below it, the target area turned out to be a crater field full of boulders, some **2 to 3 metres** across.',
      'At about 700 feet Neil Armstrong said, “Pretty rocky area.” He took manual control and levelled off at about **400 feet** (122 m) to hunt for a smoother patch. A low-fuel light came on while Eagle was still about 100 feet up. (Later analysis showed fuel sloshing had fooled the sensor, and there was more left than the crew thought.)',
      'Then: “The Eagle has landed.”',
    ],
    source: SOURCES.apollo11,
  },
  {
    id: 'pole',
    stamp: 'Today',
    title: 'Now we’re heading for the poles.',
    body: [
      'Some craters near the Moon’s poles never see sunlight. They are cold enough that water ice could survive there, and water could mean drinking water, breathable air and rocket fuel for future missions.',
      'But the poles are tricky. NASA notes the Sun there is **never more than 1.5°** above or below the horizon. Shadows are perpetually long, and mountains as far as 120 km away can throw them across your landing site.',
    ],
    source: SOURCES.poleShadows,
  },
];

export const CHAPTERS_INTRO = {
  title: 'Five worries, five characters.',
  body: 'Every landing has to satisfy five different specialists. Meet them. Each one has watched a real mission go wrong.',
};

export const CHAPTERS = [
  {
    aspect: 'sunlight',
    heading: 'Light',
    speech: 'I turn sunlight into electricity. But near the pole the Sun hugs the horizon, so every ridge throws a shadow that can stretch for kilometres. If my panels sit in the shade, the batteries run down.',
    caseTitle: 'Athena · March 2025',
    caseBody: 'Athena landed about 250 m from its target, inside a crater near Mons Mouton, and came to rest on its side. With the Sun’s direction, the panels’ orientation and the extreme cold, it could not recharge. The company declared the mission over the next day.',
  },
  {
    aspect: 'night',
    heading: 'Night & cold',
    speech: 'When the Sun hides, I am the one keeping everything warm. Lunar nights are long and brutal. Some shadowed craters have been measured colder than −238 °C. If the dark lasts longer than the battery, it is over.',
    caseTitle: 'Odysseus · February 2024',
    caseBody: 'The first US craft on the Moon since Apollo was expected to work for only about nine or ten days at most, before lunar nightfall. The clock was always ticking.',
  },
  {
    aspect: 'comms',
    heading: 'Radio link',
    speech: 'Earth is our only phone line, and from the pole it hangs low over the horizon. One hill in the way and… silence.',
    caseTitle: 'Odysseus · February 2024',
    caseBody: 'Odysseus came to rest on its side near Malapert A, less than 300 km from the south pole. Some of its high-mounted antennas pointed at the surface, which limited how much data flight controllers could send back.',
  },
  {
    aspect: 'terrain',
    heading: 'Ground',
    speech: 'A lander is tall and narrow, like a stool. Slopes, boulders and crater edges can tip it over. I want the flattest, safest ground we can find, and plenty of room around it.',
    caseTitle: 'Odysseus, then Chandrayaan-3',
    caseBody: 'Odysseus was “coming in too fast” and “caught a foot in the surface.” After India’s Chandrayaan-2 crashed in 2019, Chandrayaan-3 got a much bigger target area, 4.2 × 2.5 km instead of 500 × 500 m, plus more fuel and stronger legs. It landed near the south pole on 23 August 2023.',
  },
  {
    aspect: 'science',
    heading: 'Science',
    speech: 'I am here for the ice. It hides in craters that never see the Sun, the coldest and darkest places there are. So we don’t land inside. We land safely close by, within reach of a rover.',
    caseTitle: 'The coldest places',
    caseBody: 'NASA’s Diviner instrument measured below −238 °C (−397 °F) in parts of permanently shadowed craters, which supports the idea that they could hold water ice.',
  },
];

export const BAD_DAY = {
  stamp: 'One more thing',
  title: 'A good site on a bad day can ruin the whole mission.',
  body: 'Everything above changes with the calendar. The Sun circles the sky once a month and Earth drifts up and down, so the same spot can be perfect on one day and useless a week later. Pick a landing day and watch.',
};

export const TO_ACT2 = {
  title: 'So how does SUHAIL choose?',
  body: 'It follows the same recipe every time. Four steps. You’re about to play with each of them.',
};
