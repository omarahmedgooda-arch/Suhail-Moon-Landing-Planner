// Team-made character art (UI only: uses Vite's import.meta.glob).
import { POSE_OF_MOOD } from '../content/cast.js';

const figs = import.meta.glob('../assets/cast/*/*.webp', { eager: true, import: 'default', query: '?url' });
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

