// Team-made character art (UI only: uses Vite's import.meta.glob).
import { POSE_OF_MOOD } from '../content/cast.js';

const figs = import.meta.glob('../assets/cast/*/*.webp', { eager: true, import: 'default', query: '?url' });
// Horizontal centre of the head in each Expert picture (0..1 of the image width), measured from the
// cut-outs so the zoomed portrait frame is centred on the face, not on the body/arm.
const EXPERT_HEAD_X = {"comms-explain": 0.549, "comms-idea": 0.494, "comms-portrait": 0.51, "night-explain": 0.674, "night-idea": 0.605, "night-portrait": 0.476, "science-explain": 0.583, "science-idea": 0.502, "science-portrait": 0.533, "sunlight-explain": 0.604, "sunlight-idea": 0.527, "sunlight-portrait": 0.548, "terrain-explain": 0.585, "terrain-idea": 0.522, "terrain-portrait": 0.535};
export const headX = (mode, id, mood = 'happy') => {
  const who = FIGURE_OF[mode]?.[id];
  return mode === 'expert' && who ? EXPERT_HEAD_X[`${who}-${POSE_OF_MOOD[mood] ?? 'explain'}`] ?? 0.5 : 0.5;
};
const figureUrl = (mode, who, pose) => figs[`../assets/cast/${mode}/${who}-${pose}.webp`] ?? null;


const FIGURE_OF = {
  student: { sunlight: 'sunlight', night: 'night', comms: 'comms', terrain: 'terrain', science: 'science', leader: 'leader' },
  expert: { sunlight: 'sunlight', night: 'night', comms: 'comms', terrain: 'terrain', science: 'science', leader: null },
};

export function figureFor(mode, id, mood = 'happy') {
  const who = FIGURE_OF[mode]?.[id];
  if (!who) return null;
  return figureUrl(mode, who, POSE_OF_MOOD[mood] ?? 'explain');
}

