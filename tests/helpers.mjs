import { readFileSync } from 'node:fs';
import { prepareData } from '../src/engine/rules.js';

export const raw = JSON.parse(readFileSync(new URL('../src/data/sample-sites.json', import.meta.url), 'utf8'));
export const data = prepareData(raw);
export { MISSIONS } from '../src/content/missions.js';
