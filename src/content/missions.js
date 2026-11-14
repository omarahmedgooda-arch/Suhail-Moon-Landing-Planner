import { LIMITS } from '../engine/rules.js';
import { batteryForHours, powerPreset } from '../engine/energy.js';

// Mission presets for Student mode. Plain-language cards on top, the same numeric
// levels the Expert form uses underneath. All numbers here are TEAM ASSUMPTIONS.
// levels: off | low | medium | high  (how demanding the mission is about that aspect)

export const MISSIONS = [
  {
    id: 'fast-demo',
    name: 'Fast demo lander',
    icon: 'bolt',
    blurb: 'A small lander that just has to prove the landing works, say hello to Earth, and take photos.',
    needs: ['Gentle ground', 'A few sunny days', 'Any link to Earth'],
    durationDays: 4,
    batteryH: 36,
    levels: { sunlight: 'low', night: 'low', comms: 'low', terrain: 'medium', science: 'off' },
  },
  {
    id: 'science-rover',
    name: 'Science rover',
    icon: 'rover',
    blurb: 'A rover that drives to the edge of a permanently shadowed crater and scoops up samples that may contain ice.',
    needs: ['Close to the ice', 'Solid ground', 'Light most days'],
    durationDays: 8,
    batteryH: 60,
    levels: { sunlight: 'medium', night: 'medium', comms: 'low', terrain: 'medium', science: 'medium' },
    weights: { science: 3 },
  },
  {
    id: 'crew-outpost',
    name: 'Crew outpost',
    icon: 'outpost',
    blurb: 'A landing for a longer stay. Power, flat ground and a strong sunny stretch matter more than anything else.',
    needs: ['Plenty of sunlight', 'Very flat ground', 'Short dark gaps'],
    durationDays: 10,
    batteryH: 96,
    levels: { sunlight: 'high', night: 'high', comms: 'low', terrain: 'high', science: 'low' },
  },
  {
    id: 'ice-drill',
    name: 'Ice drilling (ISRU)',
    icon: 'drill',
    blurb: 'A stationary drill that digs into the cold soil next to a shadowed crater to test for water ice.',
    needs: ['Right next to the ice', 'Power for the drill', 'Survives dark spells'],
    durationDays: 12,
    batteryH: 72,
    levels: { sunlight: 'medium', night: 'high', comms: 'medium', terrain: 'medium', science: 'high' },
  },
  {
    id: 'comms-relay',
    name: 'Radio relay station',
    icon: 'relay',
    blurb: 'A small station on a high rim that keeps a radio link open between Earth and other landers.',
    needs: ['Earth almost always in view', 'Short blackouts', 'Enough sun'],
    durationDays: 14,
    batteryH: 48,
    levels: { sunlight: 'medium', night: 'medium', comms: 'high', terrain: 'low', science: 'off' },
  },
  {
    id: 'night-survival',
    name: 'Night-survival test',
    icon: 'moonnight',
    blurb: 'A technology test that must ride out the longest dark spell of the season on its battery and heaters.',
    needs: ['Long sunny stretch', 'Battery and heaters', 'Steady link'],
    durationDays: 14,
    batteryH: 120,
    levels: { sunlight: 'high', night: 'high', comms: 'low', terrain: 'medium', science: 'off' },
  },
  {
    id: 'geology',
    name: 'Geology traverse',
    icon: 'rock',
    blurb: 'A rover that drives across old crater rims collecting rock samples, so the ground must be safe to drive.',
    needs: ['Very gentle slopes', 'Daylight to drive', 'Interesting rocks nearby'],
    durationDays: 6,
    batteryH: 48,
    levels: { sunlight: 'medium', night: 'low', comms: 'low', terrain: 'high', science: 'medium' },
  },
  {
    id: 'observatory',
    name: 'Polar science station',
    icon: 'dish',
    blurb: 'A long-lived station with instruments that need steady power and a steady data link to Earth.',
    needs: ['Steady sun', 'Steady link', 'Flat pad'],
    durationDays: 14,
    batteryH: 72,
    levels: { sunlight: 'high', night: 'medium', comms: 'high', terrain: 'medium', science: 'low' },
  },
];

export const CUSTOM_MISSION = {
  id: 'custom',
  name: 'Build your own',
  icon: 'custom',
  blurb: 'Set your own limits for each aspect and see how the answer changes.',
  needs: [],
  durationDays: 7,
  batteryH: 60,
  levels: { sunlight: 'medium', night: 'medium', comms: 'low', terrain: 'medium', science: 'low' },
};

export const LEVEL_WORDS = {
  off: { label: 'Off', plain: "Doesn't matter" },
  low: { label: 'Low', plain: 'Nice to have' },
  medium: { label: 'Medium', plain: 'Important' },
  high: { label: 'High', plain: 'Critical' },
};

export const ASPECT_LABEL = {
  sunlight: 'Solar radiation',
  night: 'Thermal environment & day cycle',
  comms: 'Earth communication',
  terrain: 'Terrain slope',
  science: 'Scientific target proximity',
};
/** Short labels for tight spots (tables, chips). */
export const ASPECT_SHORT = {
  sunlight: 'Solar',
  night: 'Thermal',
  comms: 'Comms',
  terrain: 'Slope',
  science: 'Science',
};
/** One-line explanation shown under each aspect in the forms. */
export const ASPECT_HINT = {
  sunlight: 'Share of mission hours with the Sun above the local terrain horizon (drives array power).',
  night: 'Longest continuous darkness must be shorter than the battery endurance on the night-time load.',
  comms: 'Maintaining the radio link with Earth: share of hours Earth is above the horizon, and the longest blackout.',
  terrain: 'Terrain slope constraint: maximum acceptable surface slope for a safe landing.',
  science: 'Maximum distance to a scientifically valuable target (nearest permanently shadowed region, a water-ice proxy).',
};

/** Mission types offered by the Expert form. Choosing one fills the form with that preset's numbers. */
export const MISSION_TYPES = [
  { id: 'science-rover', label: 'Science rover / ice prospecting' },
  { id: 'ice-drill', label: 'ISRU: ice drilling & extraction test' },
  { id: 'geology', label: 'Geology traverse & sampling' },
  { id: 'observatory', label: 'Long-duration polar science station' },
  { id: 'comms-relay', label: 'Communications relay station' },
  { id: 'night-survival', label: 'Night-survival technology demo' },
  { id: 'fast-demo', label: 'Short technology demo lander' },
  { id: 'crew-outpost', label: 'Crewed landing / surface outpost' },
  { id: 'custom', label: 'Other (set everything yourself)' },
];

export const METRIC_BY_ASPECT = { sunlight: ['sunPct'], comms: ['earthPct', 'earthGapH'], terrain: ['slopeDeg'], science: ['psrKm'] };

/** The numeric limit each importance level stands for (team assumptions). */
export function limitsFromLevels(levels) {
  const out = {};
  for (const [aspect, keys] of Object.entries(METRIC_BY_ASPECT)) {
    const lv = levels[aspect];
    for (const k of keys) out[k] = lv && lv !== 'off' ? LIMITS[k][lv] : LIMITS[k].medium;
  }
  return out;
}

export const presetById = (id) => (id === 'custom' ? CUSTOM_MISSION : MISSIONS.find((m) => m.id === id) ?? CUSTOM_MISSION);

/** Mission object the engine understands, from a preset (Student mode). */
export function missionFromPreset(preset, over = {}) {
  const levels = over.levels ?? preset.levels;
  const batteryH = over.batteryH ?? preset.batteryH;
  const power = powerPreset(preset.id);
  power.batteryKWh = batteryForHours(power, batteryH);
  return {
    id: preset.id, name: preset.name, typeId: preset.id,
    durationDays: over.durationDays ?? preset.durationDays, batteryH,
    levels: { ...levels }, limits: limitsFromLevels(levels), weights: over.levels ? undefined : preset.weights, power,
  };
}
