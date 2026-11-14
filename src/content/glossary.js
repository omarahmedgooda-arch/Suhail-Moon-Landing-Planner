// Plain-language glossary used by <Term/> tooltips.
export const GLOSSARY = {
  unknown: { term: 'Unknown is not a pass', def: 'If SUHAIL can’t measure something, it doesn’t guess. Missing data counts against the site until it’s filled in.' },
  slope: { term: 'Slope', def: 'How steep the ground is, in degrees. 0° is perfectly flat. 10° is steeper than almost any road you have driven.' },
  psr: { term: 'Permanently shadowed region (PSR)', def: 'A crater floor the Sun never reaches. It stays extremely cold, so water ice could last there for a very long time.' },
  horizon: { term: 'Horizon', def: 'Where ground meets sky as seen from the lander. On the Moon it is bumpy: hills and crater rims stick up into the sky.' },
  azimuth: { term: 'Azimuth', def: 'Compass direction. 0° is north, 90° east, 180° south, 270° west.' },
  elevation: { term: 'Elevation angle', def: 'How high something is above the horizon, in degrees. 0° is sitting on the horizon, 90° is straight overhead.' },
  maximin: { term: 'Weakest link (maximin)', def: 'When two sites score the same overall, pick the one whose worst aspect is better. The best of the worst.' },
  dealbreaker: { term: 'Dealbreaker', def: 'A limit a site must meet. Break one and the site is out, however good it looks everywhere else.' },
  score: { term: 'Score (0–100)', def: '50 means a site sits exactly at your limit. 100 means excellent. Below 50 it has failed the limit.' },
  lola: { term: 'LOLA', def: 'The Lunar Orbiter Laser Altimeter on NASA’s LRO spacecraft. It measured the height of the Moon’s surface with a laser.' },
  realdata: { term: 'What is real here', def: 'Terrain, slopes and shadowed craters come from NASA’s LOLA laser altimeter (80 m per pixel). The Sun and Earth positions come from a fast astronomy model that is close to, but not exactly, NASA’s SPICE/Horizons. Level limits are team assumptions.' },
  region: { term: 'Candidate region', def: 'A landing region NASA drew on the Moon’s south pole for Artemis. SUHAIL tests several points inside each one and shows the best.' },
  sample: { term: 'Sample data', def: 'These numbers come from a simplified geometry model built for this prototype. They are not real SPICE or LOLA results yet. The real pipeline output uses the same file shape.' },
};
