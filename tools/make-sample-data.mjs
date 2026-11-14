// SUHAIL – SAMPLE DATA generator (Student mode)
// ------------------------------------------------------------------
// Produces src/data/sample-sites.json in the SAME SHAPE the analysis
// pipeline is expected to output (hourly Sun/Earth az+el per site, a
// terrain-horizon profile per site, static metrics, PSR blobs).
//
// !! This is NOT SPICE and NOT LOLA. It is a simplified spherical-geometry
// !! model so the UI has numbers that are internally consistent
// !! (percentages are computed from the very same hourly arrays the Sky View draws).
// !! Replace the JSON with the real pipeline output when it is ready.
//
// Run:  npm run sample
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'sample-sites.json');

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const HOURS = 720; // 30 days, step 1 h
const SYNODIC_H = 29.530589 * 24; // Sun goes round the lunar sky once per synodic month
const ANOMALISTIC_H = 27.554550 * 24; // libration in longitude
const DRACONIC_H = 27.212221 * 24; // libration in latitude
const R_MOON_KM = 1737.4;

// small deterministic PRNG so the file is reproducible
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// altitude / azimuth (N = 0°, E = 90°) of a body at declination dec seen from (lat, lon)
// with hour angle H (east-positive longitude minus body's sub-point longitude)
function altAz(latDeg, dec, H) {
  const φ = latDeg * D2R, δ = dec * D2R, h = H * D2R;
  const sinEl = Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(h);
  const el = Math.asin(Math.max(-1, Math.min(1, sinEl))) * R2D;
  const az = Math.atan2(-Math.cos(δ) * Math.sin(h), Math.sin(δ) * Math.cos(φ) - Math.cos(δ) * Math.sin(φ) * Math.cos(h)) * R2D;
  return { el, az: ((az % 360) + 360) % 360 };
}

// --- Sun & Earth sub-points over the 30-day window --------------------
const subSolarLon = (t) => 10 - 360 * (t / SYNODIC_H); // moves west
const subSolarLat = (t) => -1.54 * Math.sin((2 * Math.PI * (t / 24 + 40)) / 346.62); // ±1.54° (axial tilt to ecliptic)
const subEarthLon = (t) => 6.8 * Math.sin((2 * Math.PI * t) / ANOMALISTIC_H + 0.6);
const subEarthLat = (t) => 6.7 * Math.sin((2 * Math.PI * t) / DRACONIC_H + 2.1);

// --- terrain horizon profile (72 bins × 5°) ----------------------------
function horizon(seed, base, bumps) {
  const rnd = mulberry32(seed);
  const out = [];
  for (let i = 0; i < 72; i++) {
    const az = i * 5;
    let h = base;
    for (const b of bumps) {
      let d = Math.abs(az - b.az);
      d = Math.min(d, 360 - d);
      h += b.amp * Math.exp(-(d * d) / (2 * b.width * b.width));
    }
    h += (rnd() - 0.5) * 0.25; // tiny roughness
    out.push(+h.toFixed(2));
  }
  return out;
}

// --- permanently shadowed regions (sample blobs) -----------------------
// Each blob is described relative to a site: bearing + centre distance + radius, so the
// distance-to-ice we later report is easy to reason about (edge distance = centre − radius).
const PSR_SPEC = [
  { id: 'p1', near: 'bravo',   brg: 20,  centre_km: 9,    radius_km: 6 },   // ice right next to the basin
  { id: 'p2', near: 'delta',   brg: 200, centre_km: 15,   radius_km: 10 },
  { id: 'p3', near: 'alpha',   brg: 120, centre_km: 15.5, radius_km: 7 },
  { id: 'p4', near: 'echo',    brg: 300, centre_km: 18,   radius_km: 6 },
  { id: 'p5', near: 'charlie', brg: 60,  centre_km: 34,   radius_km: 12 },
  { id: 'p6', near: 'foxtrot', brg: 250, centre_km: 34,   radius_km: 9 },
];

function destination(latDeg, lonDeg, brgDeg, distKm) {
  const δ = distKm / R_MOON_KM, θ = brgDeg * D2R, φ1 = latDeg * D2R, λ1 = lonDeg * D2R;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: φ2 * R2D, lon: ((λ2 * R2D + 540) % 360) - 180 };
}

function gcKm(lat1, lon1, lat2, lon2) {
  const φ1 = lat1 * D2R, φ2 = lat2 * D2R, dλ = (lon2 - lon1) * D2R;
  const c = Math.acos(Math.min(1, Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(dλ)));
  return c * R_MOON_KM;
}

// --- candidate sites (fictional code-names, SAMPLE) --------------------
const SITES = [
  {
    id: 'alpha', name: 'Ridge Alpha', kind: 'ridge', lat: -87.6, lon: 25, slope: 6.1,
    note: 'A high, exposed ridge. Lots of sky, a steeper slope.',
    horizon: horizon(11, -0.55, [{ az: 80, amp: 1.4, width: 30 }, { az: 250, amp: 1.1, width: 25 }]),
  },
  {
    id: 'bravo', name: 'Basin Bravo', kind: 'basin', lat: -88.9, lon: 205, slope: 2.2,
    note: 'A flat crater floor ringed by high walls. Very calm, very dim.',
    horizon: horizon(22, 1.5, [{ az: 20, amp: 1.0, width: 40 }, { az: 200, amp: 1.6, width: 50 }]),
  },
  {
    id: 'charlie', name: 'Plateau Charlie', kind: 'plateau', lat: -85.8, lon: 340, slope: 3.4,
    note: 'A wide, gentle plateau. A balanced all-rounder, far from the ice.',
    horizon: horizon(33, 0.2, [{ az: 130, amp: 1.3, width: 30 }, { az: 300, amp: 0.9, width: 25 }]),
  },
  {
    id: 'delta', name: 'Rim Delta', kind: 'rim', lat: -86.9, lon: 95, slope: 9.3,
    note: 'On the rim of a crater. Great view of the sky, steep ground.',
    horizon: horizon(44, -0.6, [{ az: 270, amp: 3.4, width: 38 }, { az: 70, amp: 0.8, width: 20 }]),
  },
  {
    id: 'echo', name: 'Saddle Echo', kind: 'saddle', lat: -88.2, lon: 290, slope: 4.1,
    note: 'A pass between two peaks. Sheltered, but the peaks block the sky.',
    horizon: horizon(55, 0.5, [{ az: 90, amp: 3.6, width: 28 }, { az: 270, amp: 3.6, width: 28 }]),
  },
  {
    id: 'foxtrot', name: 'Mesa Foxtrot', kind: 'mesa', lat: -85.2, lon: 160, slope: 5.0, missingEarth: true,
    note: 'A flat-topped mesa. We have no Earth-visibility data for it yet.',
    horizon: horizon(66, 0.9, [{ az: 0, amp: 1.5, width: 35 }, { az: 180, amp: 1.0, width: 40 }]),
  },
];

const r1 = (x) => Math.round(x * 10) / 10;

const PSR = PSR_SPEC.map((p) => {
  const base = SITES.find((x) => x.id === p.near);
  const c = destination(base.lat, base.lon, p.brg, p.centre_km);
  return { id: p.id, lat_deg: +c.lat.toFixed(3), lon_deg: +(((c.lon % 360) + 360) % 360).toFixed(2), radius_km: p.radius_km };
});


const sites = SITES.map((s) => {
  const sun_el = [], sun_az = [], earth_el = [], earth_az = [];
  for (let t = 0; t < HOURS; t++) {
    const sun = altAz(s.lat, subSolarLat(t), s.lon - subSolarLon(t));
    sun_el.push(r1(sun.el)); sun_az.push(Math.round(sun.az));
    const ea = altAz(s.lat, subEarthLat(t), s.lon - subEarthLon(t));
    earth_el.push(r1(ea.el)); earth_az.push(Math.round(ea.az));
  }
  let psr = Infinity;
  for (const p of PSR) psr = Math.min(psr, Math.max(0, gcKm(s.lat, s.lon, p.lat_deg, p.lon_deg) - p.radius_km));
  return {
    id: s.id,
    name: s.name,
    kind: s.kind,
    note: s.note,
    lat_deg: s.lat,
    lon_deg: s.lon,
    static: { slope_deg: s.slope, psr_distance_km: r1(psr) },
    horizon_deg: s.horizon,
    hourly: {
      sun_el_deg: sun_el,
      sun_az_deg: sun_az,
      earth_el_deg: s.missingEarth ? null : earth_el,
      earth_az_deg: s.missingEarth ? null : earth_az,
    },
    data_quality: { earth: s.missingEarth ? 'missing' : 'computed' },
  };
});

const out = {
  schema: 'suhail.sites/v0',
  is_sample: true,
  generated_by: 'tools/make-sample-data.mjs – simplified geometry, NOT SPICE / LOLA',
  window: { start_utc: '2027-03-01T00:00:00Z', step_hours: 1, hours: HOURS },
  horizon: { bins: 72, step_deg: 5, note: 'terrain horizon elevation (deg) by azimuth, N = 0° clockwise' },
  map: { projection: 'south-polar, lon 0° up, lon 90°E to the right', outer_lat_deg: -84 },
  psr: PSR,
  sites,
};

writeFileSync(OUT, JSON.stringify(out));
console.log('wrote', OUT);

// quick summary so you can eyeball the sample
const vis = (el, az, h) => {
  const n = h.length, step = 360 / n, i = Math.floor(az / step), f = (az - i * step) / step;
  return el > h[i] * (1 - f) + h[(i + 1) % n] * f;
};
for (const s of sites) {
  let sun = 0, earth = 0;
  for (let t = 0; t < HOURS; t++) {
    if (vis(s.hourly.sun_el_deg[t] + 0.27, s.hourly.sun_az_deg[t], s.horizon_deg)) sun++;
    if (s.hourly.earth_el_deg && vis(s.hourly.earth_el_deg[t], s.hourly.earth_az_deg[t], s.horizon_deg)) earth++;
  }
  console.log(s.id.padEnd(8), 'sun', ((sun / HOURS) * 100).toFixed(0).padStart(3) + '%', ' earth', s.hourly.earth_el_deg ? ((earth / HOURS) * 100).toFixed(0).padStart(3) + '%' : ' n/a', ' slope', s.static.slope_deg, ' psr', s.static.psr_distance_km, 'km');
}
