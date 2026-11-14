// The two casts. Student mode: the team's six comic astronauts (the "moon landing" crew from the
// team's favourite sketch show, drawn by the team). Expert mode: five original specialists whose
// FIELD and temperament were inspired by real Arab space scientists and astronauts. Their dialogue
// is invented; it is never presented as words of the real people.
//
// Figures: team-made art in src/assets/cast/<mode>/<id>-<pose>.webp (poses: explain, idea, warn, portrait).
// To swap which picture belongs to which character, change FIGURE_OF below. Nothing else depends on it.
//
// Card photos of the real inspirations are NOT bundled (we do not copy people's photos from the web).
// Drop a licensed or team-taken photo at public/inspired/<file> (file names below) and the card shows it.

import { CHARACTERS, GUIDE, LEADER, ORDER } from './characters.js';

/** mood → pose */
export const POSE_OF_MOOD = { happy: 'explain', thinking: 'idea', confused: 'idea', nervous: 'idea', worried: 'portrait', asleep: 'portrait' };

/* ------------------------------------------------------------------ STUDENT cast */
const STUDENT = {
  sunlight: { name: 'Hagras', role: 'Solar radiation', meaning: 'the crew’s “power expert”', quirk: 'Thinks a giant flashlight can replace the Sun.' },
  night: { name: 'Dr. Rabie', role: 'Thermal & day cycle', meaning: 'the crew’s “doctor of heat”', quirk: 'Wants to open the windows when it gets cold.' },
  comms: { name: 'Am Ba’zaq', role: 'Earth communication', meaning: 'the shuttle driver, hates the radio', quirk: 'Plans to shout really loudly toward Earth.' },
  terrain: { name: 'Hazalqum', role: 'Terrain slope', meaning: 'the crew’s impulsive pilot', quirk: 'Wants to land wherever it looks “interesting”.' },
  science: { name: 'Ashraf', role: 'Scientific target', meaning: 'came for the trip, not the science', quirk: 'Happy to land next to any random rock.' },
};
const STUDENT_LEADER = { id: 'leader', name: 'The Wise Doctor', role: 'Mission expert', meaning: 'the calm one who fixes everything' };

/* ------------------------------------------------------------------ EXPERT cast */
// Names are Arabic sky names, like Suhail itself. Inspirations chosen by the team.
export const EXPERT = {
  terrain: {
    name: 'Dr. Badr', meaning: 'Badr = the full Moon', role: 'Surface geologist · terrain lead',
    voice: 'The elder of the room. Speaks slowly, in short certain sentences, and trusts the ground more than any model. Has seen landers fall over and does not want to see it again.',
    cares: 'Slope, boulders, a level pad, a clean approach path.', redLine: 'Will veto any site where the slope is over the limit, whatever the sunlight.',
    risk: 'Low', argues: 'From experience and precedent.',
    inspired: { who: 'Farouk El-Baz', where: 'Egypt / USA', what: 'Geologist who worked with NASA on the Apollo programme, helping select lunar landing sites and training astronauts in lunar geology.', photo: 'el-baz.jpg', source: { label: 'Wikipedia – Farouk El-Baz', url: 'https://en.wikipedia.org/wiki/Farouk_El-Baz' } },
  },
  sunlight: {
    name: 'Tariq', meaning: 'at-Tariq = the morning star', role: 'Power systems engineer · solar lead',
    voice: 'Young, quick, numbers first. Talks in watts, hours and kilowatt-hours, and gets impatient with anything that cannot be measured.',
    cares: 'Sunlit hours, array output, energy margin, battery state of charge.', redLine: 'No site where the battery hits its depth-of-discharge floor.',
    risk: 'Medium', argues: 'From the energy balance.',
    inspired: { who: 'Sultan Alneyadi', where: 'United Arab Emirates', what: 'Astronaut who flew a six-month ISS mission in 2023 and made the first spacewalk by an Arab astronaut, preparing the station for its solar-array power upgrade.', photo: 'alneyadi.jpg', source: { label: 'NASA – Astronauts begin spacewalk to upgrade station power (28 Apr 2023)', url: 'https://www.nasa.gov/blogs/spacestation/2023/04/28/astronauts-begin-spacewalk-to-upgrade-station-power/' } },
  },
  night: {
    name: 'Dr. Thuraya', meaning: 'ath-Thuraya = the Pleiades', role: 'Thermal engineer · night-survival lead',
    voice: 'Precise and quietly stubborn. Thinks in kelvin and in worst cases; asks “and what happens in the longest dark hour?” every single time.',
    cares: 'Longest darkness, surface temperature range, heater power, battery endurance.', redLine: 'No darkness longer than the battery endurance on the night-time load.',
    risk: 'Low', argues: 'From worst-case analysis.',
    inspired: { who: 'Dina Tantawy', where: 'Egypt', what: 'Egyptian engineer in the space industry, chosen by the team as a role model for young Arab women engineers.', photo: 'tantawy.jpg', source: null },
  },
  comms: {
    name: 'Nasr', meaning: 'an-Nasr = the eagle stars (Vega, Altair)', role: 'Communications officer · link lead',
    voice: 'Calm, formal, a veteran of procedures. Measures everything against the link to Earth and reminds the room that a lander nobody can hear is a lander that is lost.',
    cares: 'Earth in view, longest blackout, antenna pointing, data volume.', redLine: 'No blackout longer than the limit during critical operations.',
    risk: 'Low', argues: 'From procedure and redundancy.',
    inspired: { who: 'Sultan bin Salman Al Saud', where: 'Saudi Arabia', what: 'Payload specialist on Space Shuttle mission STS-51-G (June 1985), the first Arab and first Muslim in space; the crew deployed the Arabsat-1B communications satellite.', photo: 'sultan-bin-salman.jpg', source: { label: 'Wikipedia – STS-51-G', url: 'https://en.wikipedia.org/wiki/STS-51-G' } },
  },
  science: {
    name: 'Dr. Najm', meaning: 'Najm = star', role: 'Planetary scientist · science lead',
    voice: 'Enthusiastic and persuasive. Always pulls the conversation toward the ice and the cold traps, and is the one most willing to accept risk for a better target.',
    cares: 'Distance to permanently shadowed regions, water-ice potential, traverse length.', redLine: 'A safe site too far from the target is “a beautiful parking lot”.',
    risk: 'High', argues: 'From science return.',
    inspired: { who: 'Essam Heggy', where: 'Egypt / USA', what: 'Planetary scientist (University of Southern California, NASA JPL) who uses radar sounding to look for water and ice beneath planetary surfaces and desert sand.', photo: 'heggy.jpg', source: { label: 'Heggy Research Group, USC', url: 'https://heggyresearch.usc.edu' } },
  },
};
const EXPERT_LEADER = { id: 'leader', name: 'Hakim', role: 'Flight director', meaning: '“Wise” in Arabic' };

/** The cast for a mode: members keyed by aspect id (learn cards are shared), plus guide and leader. */
export function castFor(mode) {
  const src = mode === 'expert' ? EXPERT : STUDENT;
  const members = {};
  for (const a of ORDER) members[a] = { ...CHARACTERS[a], ...src[a], id: a };
  return { mode, members, guide: GUIDE, leader: mode === 'expert' ? { ...LEADER, ...EXPERT_LEADER } : { ...LEADER, ...STUDENT_LEADER } };
}
export { ORDER };
