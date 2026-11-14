// Where the site data comes from.
//
//  • Default: the bundled REAL-data file (is_sample: false), built by tools/pipeline/build_real_data.py.
//    (src/data/sample-sites.json is the old synthetic file; the unit tests still use it.)
//  • When the analysis team's API is up, build/run with  VITE_SUHAIL_API_URL=https://host/api
//    and this will GET  <url>/sites  – the response must have the same shape as sample-sites.json:
//      { schema, is_sample:false, window:{start_utc, step_hours, hours},
//        psr:[{id,lat_deg,lon_deg,radius_km}],
//        sites:[{ id, name, note, lat_deg, lon_deg,
//                 static:{slope_deg, psr_distance_km},
//                 horizon_deg:[72 values, azimuth 0..355° step 5],
//                 hourly:{ sun_el_deg[], sun_az_deg[], earth_el_deg[]|null, earth_az_deg[]|null } }] }
//  • If you have JSON per site (the pipeline's native output), assemble it with assembleSites() below.

import real from './real-sites.json'; // built by tools/pipeline/build_real_data.py from NASA LOLA data

export async function loadSites() {
  const url = import.meta.env?.VITE_SUHAIL_API_URL;
  if (!url) return real;
  const res = await fetch(`${url.replace(/\/$/, '')}/sites`);
  if (!res.ok) throw new Error(`API answered ${res.status}`);
  return res.json();
}

/** Combine "one JSON per site" files into the shape the UI expects. */
export function assembleSites({ window, psr, sites }) {
  return { schema: 'suhail.sites/v0', is_sample: false, window, psr, sites };
}
