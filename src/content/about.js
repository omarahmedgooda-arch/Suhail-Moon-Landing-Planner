// Home-page content: overview, team, resources. Edit names here.
import { SOURCES } from './characters.js';

export const TEAM = {
  name: 'FASA Destination Team',
  university: 'Elsewedy University of Technology (SUT)',
  event: 'NASA Space Apps Challenge · Cairo 2026',
  challenge: 'Lunar Landing Site Navigator',
  // Add member names here, e.g. ['Omar …', 'Joudy Ahmed', …]. An empty list hides the line.
  members: [],
};

export const DATA_RESOURCES = [
  { label: 'NASA LOLA – A New View of the Lunar South Pole (80 m/px elevation model, PGDA product 90, Barker et al. 2023)', use: 'Terrain, slopes, horizon profiles, 3D terrain and maps', url: 'https://pgda.gsfc.nasa.gov/products/90' },
  { label: 'NASA LOLA – permanently shadowed regions (LPSR, same PGDA product)', use: 'Distance to cold traps / water-ice targets', url: 'https://pgda.gsfc.nasa.gov/products/90' },
  { label: 'NASA – Artemis III candidate landing regions (2022)', use: 'The seven candidate regions we test', url: 'https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-Moon/' },
  { label: 'LROC QuickMap', use: 'Region outlines (layer “A3: Candidate Landing Regions 2022”)', url: 'https://quickmap.lroc.asu.edu' },
  { label: 'NASA SVS – Artemis III Landing Region Candidates (visualization 5013)', use: 'Region flyover clips', url: 'https://svs.gsfc.nasa.gov/5013' },
  { label: 'Astropy + IAU 2009 lunar rotation model', use: 'Hourly Sun and Earth positions (approximate, not SPICE)', url: 'https://www.astropy.org' },
];

export const STORY_RESOURCES = Object.values(SOURCES);
