// Builds SUHAIL-offline.html: the whole site in ONE file that opens with a double-click (no server,
// no internet). Run with `npm run offline` (it runs `build:single` first).
// The council photos in public/inspired/ are embedded as data URLs, because a single file
// opened from disk cannot load images that sit in a folder next to it on every browser.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const single = readFileSync('dist-single/index.html', 'utf8');
const needle = 'src:`./inspired/${e}`';
if (single.split(needle).length !== 2) {
  throw new Error('make-offline: the photo path in CastPage.jsx changed; update the needle in tools/make-offline.mjs');
}

const photos = {};
for (const f of readdirSync('public/inspired').filter((n) => n.endsWith('.jpg'))) {
  photos[f] = `data:image/jpeg;base64,${readFileSync(join('public/inspired', f)).toString('base64')}`;
}

let html = single.replace(needle, 'src:(window.__INSP||{})[e]||`./inspired/${e}`');
const at = html.indexOf('<script');
html = `${html.slice(0, at)}<script>window.__INSP=${JSON.stringify(photos)}</script>${html.slice(at)}`;

writeFileSync('SUHAIL-offline.html', html);
console.log(`SUHAIL-offline.html written (${Object.keys(photos).length} photos embedded, ${(html.length / 1e6).toFixed(1)} MB)`);
