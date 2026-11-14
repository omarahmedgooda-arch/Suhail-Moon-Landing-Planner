// SUHAIL power & environment model.
// Dynamic: everything depends on the site's hourly Sun/Earth geometry, its terrain horizon, the
// landing date and the mission duration. Pure functions, no React → unit-tested.
//
// Model chain (one step per hour of the mission window):
//   Gn(t)  = S0 · (1 AU / r(t))²                        solar irradiance normal to the rays   [W/m²]
//   lit(t) = Sun's upper limb above the local terrain horizon (LOLA horizon mask)       [0/1]
//   Gh(t)  = Gn · max(0, sin α) · lit                    direct irradiance on level ground    [W/m²]
//            (α = solar elevation; sin α = cos of the solar zenith angle)
//   P(t)   = Gn · A · η · max(0, cos θ) · D · lit        array output                          [W]
//            θ = angle between the rays and the panel normal:
//              vertical, Sun-tracking array → cos θ = cos α      (usual choice at the poles)
//              horizontal array             → cos θ = sin α
//   Pload(t) = Σ Pi(t)   avionics + heaters (in darkness) + radio (Earth in view) + payload & mobility (in sunlight)
//   Battery:  E(t+Δt) = E + ηc·Pcharge·Δt − Pdischarge·Δt/ηd,  kept between (1−DoD)·Ecap and Ecap
//   Surface temperature: one-layer transient energy balance
//            C dT/dt = (1−A)·Gh + Q_other − εσT⁴ − (k/Δz)(T − T_deep)
//
// Parameter values are typical published values or TEAM ASSUMPTIONS and are shown in the UI.

export const SOLAR_CONSTANT = 1361; // W/m² at 1 AU (Kopp & Lean 2011)
const SIGMA = 5.670374e-8;

/** Thermal model constants (typical lunar regolith values; simplified, indicative only). */
export const THERMAL = {
  albedo: 0.12,        // bond albedo of highland regolith
  emissivity: 0.95,
  qOther: 2.0,         // W/m²: scattered sunlight + infrared from surrounding terrain + interior heat flow
  conductivity: 0.006, // W/(m·K), compacted regolith a few cm down
  layerM: 0.02,        // m, thermal skin represented by the surface node
  density: 1300,       // kg/m³
  heatCap: 600,        // J/(kg·K)
  depthM: 0.1,         // m, distance to the deep (constant-temperature) node
};

/** Power-system defaults per mission type (TEAM ASSUMPTIONS, editable in Expert mode). */
export const POWER_PRESETS = {
  'fast-demo':      { panelAreaM2: 1.2, panelEff: 0.29, derate: 0.85, panelMode: 'vertical', dod: 0.8, etaC: 0.95, etaD: 0.95, loads: { baseW: 60, heaterW: 45, commsW: 40, payloadW: 30, mobilityW: 0 } },
  'science-rover':  { panelAreaM2: 1.6, panelEff: 0.29, derate: 0.85, panelMode: 'vertical', dod: 0.8, etaC: 0.95, etaD: 0.95, loads: { baseW: 80, heaterW: 60, commsW: 50, payloadW: 60, mobilityW: 120 } },
  'crew-outpost':   { panelAreaM2: 14, panelEff: 0.30, derate: 0.85, panelMode: 'vertical', dod: 0.8, etaC: 0.95, etaD: 0.95, loads: { baseW: 2000, heaterW: 1500, commsW: 300, payloadW: 500, mobilityW: 0 } },
  'ice-drill':      { panelAreaM2: 2.6, panelEff: 0.29, derate: 0.85, panelMode: 'vertical', dod: 0.8, etaC: 0.95, etaD: 0.95, loads: { baseW: 120, heaterW: 110, commsW: 60, payloadW: 350, mobilityW: 0 } },
  'comms-relay':    { panelAreaM2: 1.8, panelEff: 0.29, derate: 0.85, panelMode: 'vertical', dod: 0.8, etaC: 0.95, etaD: 0.95, loads: { baseW: 70, heaterW: 60, commsW: 220, payloadW: 0, mobilityW: 0 } },
  'night-survival': { panelAreaM2: 1.5, panelEff: 0.29, derate: 0.85, panelMode: 'vertical', dod: 0.8, etaC: 0.95, etaD: 0.95, loads: { baseW: 50, heaterW: 70, commsW: 30, payloadW: 20, mobilityW: 0 } },
  'geology':        { panelAreaM2: 2.2, panelEff: 0.29, derate: 0.85, panelMode: 'vertical', dod: 0.8, etaC: 0.95, etaD: 0.95, loads: { baseW: 90, heaterW: 70, commsW: 50, payloadW: 90, mobilityW: 160 } },
  'observatory':    { panelAreaM2: 3.4, panelEff: 0.29, derate: 0.85, panelMode: 'vertical', dod: 0.8, etaC: 0.95, etaD: 0.95, loads: { baseW: 150, heaterW: 140, commsW: 120, payloadW: 250, mobilityW: 0 } },
  custom:           { panelAreaM2: 1.6, panelEff: 0.29, derate: 0.85, panelMode: 'vertical', dod: 0.8, etaC: 0.95, etaD: 0.95, loads: { baseW: 80, heaterW: 60, commsW: 50, payloadW: 60, mobilityW: 0 } },
};

/** Thresholds of the four-class suitability rating (TEAM ASSUMPTIONS, configurable). */
export const SUITABILITY_RULES = {
  reserveSocPct: 40,       // "Highly suitable" keeps at least this State of Charge at all times
  marginFrac: 0.15,        // ... and generates at least 15 % more energy than it uses
  notFeasibleUnmetFrac: 0.1, // more than 10 % of mission hours with unmet load → not feasible
  notFeasibleRatio: 0.5,   // solar energy below half the load energy → not feasible
};

export const SUITABILITY = {
  high: { label: 'Highly suitable', status: 'go', text: 'Solar generation and battery storage carry every essential load through the whole mission with a comfortable reserve.' },
  constrained: { label: 'Suitable with constraints', status: 'marginal', text: 'Feasible, but the reserve is thin: plan for more battery, lower loads or better array pointing.' },
  risk: { label: 'High energy risk', status: 'nogo', text: 'The battery runs down to its depth-of-discharge floor during at least one dark period; some loads would go unpowered.' },
  infeasible: { label: 'Not feasible', status: 'nogo', text: 'The modelled array and battery cannot meet the essential loads for this mission.' },
};

export function powerPreset(typeId) {
  const p = POWER_PRESETS[typeId] ?? POWER_PRESETS.custom;
  return { ...p, loads: { ...p.loads } };
}

/** Power drawn while the lander sits in darkness (avionics + heaters + radio). */
export const darkLoadW = (power) => power.loads.baseW + power.loads.heaterW + power.loads.commsW;

/** Battery size (kWh) that carries the dark load for `hours`. */
export function batteryForHours(power, hours) {
  return Math.round(((hours * darkLoadW(power)) / (power.dod * power.etaD)) / 100) / 10;
}
/** How long (h) a full battery carries the dark load: T = Ecap·DoD·ηd / Pdark. */
export function enduranceHours(power) {
  if (!power.batteryKWh || !darkLoadW(power)) return 0;
  return Math.round((power.batteryKWh * 1000 * power.dod * power.etaD) / darkLoadW(power));
}

/** Earth–Sun distance in AU for a date (good to ~0.1 %); the Moon's own ±0.0026 AU is ignored. */
export function sunDistanceAu(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const doy = (date.getTime() - start) / 86400000;
  return 1 - 0.01671 * Math.cos((2 * Math.PI * (doy - 3.5)) / 365.256);
}

const DEG = Math.PI / 180;

/** Deep-soil temperature (K) estimated from the long-term mean absorbed flux at the site. */
function deepTemperature(site) {
  const el = site.hourly.sun_el_deg, lit = site.vis.sun;
  let sum = 0;
  for (let t = 0; t < el.length; t++) if (lit[t]) sum += SOLAR_CONSTANT * Math.max(0, Math.sin(el[t] * DEG));
  const mean = sum / el.length;
  return Math.max(40, Math.pow(((1 - THERMAL.albedo) * mean + THERMAL.qOther) / (THERMAL.emissivity * SIGMA), 0.25));
}

/**
 * Simulate one site for one mission window.
 * @param site prepared site (hourly arrays + vis series)
 * @param startHour index in the data window
 * @param hours mission length in hours
 * @param power { panelAreaM2, panelEff, derate, panelMode, batteryKWh, dod, etaC, etaD, loads }
 * @param startUtc ISO string of hour 0 of the data window
 */
export function simulateEnergy(site, startHour, hours, power, startUtc) {
  const el = site.hourly.sun_el_deg, lit = site.vis.sun, earth = site.vis.earth;
  const end = Math.min(startHour + hours, el.length);
  const n = end - startHour;
  const t0 = Date.parse(startUtc);
  const cap = power.batteryKWh * 1000;
  const floor = cap * (1 - power.dod);
  const L = power.loads;

  const series = { gh: new Float32Array(n), pv: new Float32Array(n), load: new Float32Array(n), soc: new Float32Array(n), tempC: new Float32Array(n), lit: new Uint8Array(n), elev: new Float32Array(n), incidence: new Float32Array(n) };
  let E = cap, eSolar = 0, eLoad = 0, unmetWh = 0, unmetHours = 0, minSoc = 100, minSocHour = 0, depletedAt = null;
  let sunH = 0, curDark = 0, curSun = 0, longestDark = 0, longestSun = 0, transitions = 0, peakPv = 0, peakGh = 0, sumGh = 0, chargeH = 0, dischargeH = 0;

  // thermal state
  const C = THERMAL.density * THERMAL.heatCap * THERMAL.layerM;
  const G = THERMAL.conductivity / THERMAL.depthM;
  const Tdeep = deepTemperature(site);
  let T = null;

  for (let i = 0; i < n; i++) {
    const t = startHour + i;
    const date = new Date(t0 + t * 3600000);
    const r = sunDistanceAu(date);
    const gn = SOLAR_CONSTANT / (r * r);
    const a = el[t] * DEG;
    const on = lit[t] === 1;
    const gh = on ? gn * Math.max(0, Math.sin(a)) : 0;
    const cosTheta = power.panelMode === 'horizontal' ? Math.max(0, Math.sin(a)) : Math.max(0, Math.cos(a));
    const pv = on ? gn * power.panelAreaM2 * power.panelEff * cosTheta * power.derate : 0;
    const load = L.baseW + (on ? L.payloadW + L.mobilityW : L.heaterW) + (earth && earth[t] ? L.commsW : 0);

    // battery (Δt = 1 h → W·h)
    const bal = pv - load;
    if (bal >= 0) { E = Math.min(cap, E + power.etaC * bal); if (bal > 0 && E < cap) chargeH++; }
    else {
      const need = -bal / power.etaD;
      dischargeH++;
      if (E - need < floor) { const got = Math.max(0, E - floor); unmetWh += (need - got) * power.etaD; unmetHours++; E = floor; if (depletedAt == null) depletedAt = i; }
      else E -= need;
    }
    const soc = cap > 0 ? (100 * E) / cap : 0;
    if (soc < minSoc) { minSoc = soc; minSocHour = i; }

    // surface temperature (explicit integration, 6 sub-steps of 10 min)
    const absorbed = (1 - THERMAL.albedo) * gh + THERMAL.qOther;
    if (T == null) T = Math.max(Tdeep, Math.pow(absorbed / (THERMAL.emissivity * SIGMA), 0.25));
    for (let k = 0; k < 6; k++) T += (600 / C) * (absorbed - THERMAL.emissivity * SIGMA * T ** 4 - G * (T - Tdeep));

    series.gh[i] = gh; series.pv[i] = pv; series.load[i] = load; series.soc[i] = soc; series.tempC[i] = T - 273.15; series.lit[i] = on ? 1 : 0;
    series.elev[i] = el[t]; series.incidence[i] = Math.acos(Math.min(1, cosTheta)) / DEG;
    eSolar += pv; eLoad += load; sumGh += gh; peakPv = Math.max(peakPv, pv); peakGh = Math.max(peakGh, gh);
    if (on) { sunH++; curSun++; curDark = 0; longestSun = Math.max(longestSun, curSun); }
    else { curDark++; curSun = 0; longestDark = Math.max(longestDark, curDark); }
    if (i > 0 && series.lit[i] !== series.lit[i - 1]) transitions++;
  }

  let tMin = Infinity, tMax = -Infinity, tSum = 0;
  for (let i = 0; i < n; i++) { const v = series.tempC[i]; tMin = Math.min(tMin, v); tMax = Math.max(tMax, v); tSum += v; }
  const litIdx = []; for (let i = 0; i < n; i++) if (series.lit[i]) litIdx.push(series.incidence[i]);
  const meanIncidence = litIdx.length ? litIdx.reduce((s, v) => s + v, 0) / litIdx.length : null;

  const R = SUITABILITY_RULES;
  let rating;
  if (unmetHours > R.notFeasibleUnmetFrac * n || eSolar < R.notFeasibleRatio * eLoad) rating = 'infeasible';
  else if (unmetHours > 0) rating = 'risk';
  else if (minSoc < R.reserveSocPct || eSolar - eLoad < R.marginFrac * eLoad) rating = 'constrained';
  else rating = 'high';

  return {
    hours: n, series, rating, tDeepC: Tdeep - 273.15,
    out: {
      tempMinC: tMin, tempMaxC: tMax, tempMeanC: tSum / n,
      ghPeak: peakGh, ghMean: sumGh / n, pvPeakW: peakPv, pvMeanW: eSolar / n,
      eSolarKWh: eSolar / 1000, eLoadKWh: eLoad / 1000, eBalanceKWh: (eSolar - eLoad) / 1000,
      sunH, darkH: n - sunH, illumPct: (100 * sunH) / n, longestDarkH: longestDark, longestSunH: longestSun, transitions,
      enduranceH: enduranceHours(power), minSocPct: minSoc, minSocHour, finalSocPct: series.soc[n - 1],
      unmetHours, unmetKWh: unmetWh / 1000, depletedAtHour: depletedAt, chargeH, dischargeH, meanIncidenceDeg: meanIncidence,
      darkLoadW: darkLoadW(power), peakLoadW: L.baseW + Math.max(L.payloadW + L.mobilityW, L.heaterW) + L.commsW,
    },
  };
}

/** The 11 outputs of the team's specification, as table rows [label, value, unit]. */
export function energyRows(sim) {
  const o = sim.out;
  const r1 = (x) => (Math.round(x * 10) / 10).toLocaleString('en-GB');
  const r0 = (x) => Math.round(x).toLocaleString('en-GB');
  return [
    ['Predicted surface temperature (min / mean / max)', `${r0(o.tempMinC)} / ${r0(o.tempMeanC)} / ${r0(o.tempMaxC)}`, '°C'],
    ['Solar irradiance on level ground (peak / mean)', `${r0(o.ghPeak)} / ${r1(o.ghMean)}`, 'W/m²'],
    ['Array electrical power (peak / mean)', `${r0(o.pvPeakW)} / ${r0(o.pvMeanW)}`, 'W'],
    ['Total solar energy generated', r1(o.eSolarKWh), 'kWh'],
    ['Total electrical energy consumed', r1(o.eLoadKWh), 'kWh'],
    ['Total sunlight exposure', `${r0(o.sunH)} (${r1(o.illumPct)} %)`, 'h'],
    ['Longest continuous darkness', r0(o.longestDarkH), 'h'],
    ['Battery endurance on the dark load', r0(o.enduranceH), 'h'],
    ['Battery State of Charge (minimum / end)', `${r0(o.minSocPct)} / ${r0(o.finalSocPct)}`, '%'],
    ['Energy surplus (+) or deficit (−)', `${o.eBalanceKWh >= 0 ? '+' : '−'}${r1(Math.abs(o.eBalanceKWh))}`, 'kWh'],
    ['Overall solar-energy suitability', SUITABILITY[sim.rating].label, ''],
  ];
}
