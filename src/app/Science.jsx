import { useMemo, useState } from 'react';
import { StatusPill, Term } from '../components/ui.jsx';
import { ASPECT_LABEL } from '../content/missions.js';
import { ORDER } from '../content/characters.js';
import { SOLAR_CONSTANT, SUITABILITY, SUITABILITY_RULES, THERMAL, energyRows, simulateEnergy } from '../engine/energy.js';
import { coord } from '../engine/banter.js';
import { dayDate, fmtDay, fmtRange } from '../engine/plan.js';
import { limitText } from './Numbers.jsx';

const r0 = (x) => Math.round(x).toLocaleString('en-GB');
const r1 = (x) => (Math.round(x * 10) / 10).toLocaleString('en-GB');

/* ------------------------------------------------------------------ small SVG line chart */
export function TimeChart({ title, unit, series, lit, hours, height = 150, yMin, yMax, startLabel, note }) {
  const W = 720, H = height, L = 46, R = 10, T = 12, B = 24;
  const all = series.flatMap((s) => Array.from(s.values));
  const lo = yMin ?? Math.min(...all), hi0 = yMax ?? Math.max(...all);
  const hi = hi0 - lo < 1e-6 ? lo + 1 : hi0;
  const x = (i) => L + ((W - L - R) * i) / Math.max(1, hours - 1);
  const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const path = (vals) => { let d = ''; for (let i = 0; i < vals.length; i++) d += `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(vals[i]).toFixed(1)}`; return d; };
  const bands = [];
  if (lit) { let s0 = null; for (let i = 0; i <= lit.length; i++) { const dark = i < lit.length && !lit[i]; if (dark && s0 == null) s0 = i; if (!dark && s0 != null) { bands.push([s0, i]); s0 = null; } } }
  const ticks = [lo, (lo + hi) / 2, hi];
  const days = Math.floor(hours / 24);
  const dayTicks = Array.from({ length: days + 1 }, (_, d) => d).filter((d) => days <= 16 || d % 2 === 0);
  return (
    <figure className="tchart">
      <figcaption><strong>{title}</strong> <span className="muted">({unit})</span>{series.length > 1 && <span className="legend">{series.map((s) => (<span key={s.name} className={`lg lg-${s.tone}`}>{s.name}</span>))}</span>}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title} over the mission`}>
        {bands.map(([a, b]) => (<rect key={a} x={x(a)} y={T} width={Math.max(1.5, x(b) - x(a))} height={H - T - B} className="tc-dark" />))}
        {ticks.map((v, i) => (<g key={i}><path d={`M${L} ${y(v)}H${W - R}`} className="tc-grid" /><text x={L - 6} y={y(v) + 4} textAnchor="end" className="tc-t">{Math.abs(hi - lo) < 10 ? r1(v) : r0(v)}</text></g>))}
        {dayTicks.map((d) => (<text key={d} x={x(Math.min(hours - 1, d * 24))} y={H - 6} textAnchor="middle" className="tc-t">{d === 0 ? (startLabel ?? 'day 0') : `d${d}`}</text>))}
        {series.map((s) => (<path key={s.name} d={path(s.values)} className={`tc-line tc-${s.tone}`} />))}
      </svg>
      {note && <p className="tc-note">{note}</p>}
    </figure>
  );
}

/* ------------------------------------------------------------------ horizon profile */
export function HorizonChart({ site, t }) {
  const W = 720, H = 140, L = 34, B = 22, T = 10;
  const hz = site.horizon_deg;
  const max = Math.max(4, ...hz) + 1, min = Math.min(-3, ...hz) - 0.5;
  const x = (az) => L + ((W - L - 8) * az) / 360;
  const y = (v) => T + (H - T - B) * (1 - (v - min) / (max - min));
  let d = `M${x(0)} ${y(min)}`;
  hz.forEach((v, i) => { d += `L${x(i * (360 / hz.length))} ${y(v)}`; });
  d += `L${x(360)} ${y(hz[0])}L${x(360)} ${y(min)}Z`;
  const sunPath = [];
  for (let k = 0; k < 24 * 30; k += 3) { const i = (t ?? 0) + k; if (i >= site.hourly.sun_az_deg.length) break; sunPath.push([site.hourly.sun_az_deg[i], site.hourly.sun_el_deg[i]]); }
  const earthPath = [];
  if (site.hourly.earth_az_deg) for (let k = 0; k < 24 * 30; k += 3) { const i = (t ?? 0) + k; if (i >= site.hourly.earth_az_deg.length) break; earthPath.push([site.hourly.earth_az_deg[i], site.hourly.earth_el_deg[i]]); }
  return (
    <figure className="tchart">
      <figcaption><strong>Terrain horizon around the site</strong> <span className="muted">(elevation angle vs azimuth, from LOLA; dots = Sun · rings = Earth over 30 days)</span></figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Horizon profile seen from the site">
        <path d={`M${L} ${y(0)}H${W - 8}`} className="tc-grid" />
        <text x={L - 4} y={y(0) + 4} textAnchor="end" className="tc-t">0°</text>
        <text x={L - 4} y={y(max - 1) + 4} textAnchor="end" className="tc-t">{r0(max - 1)}°</text>
        <path d={d} className="hz-ground" />
        {sunPath.map(([az, el], i) => (<circle key={`s${i}`} cx={x(az)} cy={y(el)} r="1.6" className="hz-sun" />))}
        {earthPath.map(([az, el], i) => (i % 3 === 0 ? <circle key={`e${i}`} cx={x(az)} cy={y(Math.max(min, Math.min(max, el)))} r="2.4" className="hz-earth" /> : null))}
        {[0, 90, 180, 270, 360].map((a) => (<text key={a} x={x(a)} y={H - 5} textAnchor="middle" className="tc-t">{a}°</text>))}
      </svg>
    </figure>
  );
}

/* ------------------------------------------------------------------ site dossier */
export function SiteDossier({ place, data, mission }) {
  const s = place.site, ev = place.ev, m = ev.metrics;
  const region = data.map.regions.find((r) => r.id === place.region);
  const q = s.data_quality ?? {};
  const constraints = ORDER.filter((a) => ev.aspects[a].status !== 'off');
  return (
    <div className="dossier">
      <div className="dossier-grid">
        <dl className="kv2">
          <div><dt>Site</dt><dd>{s.name}</dd></div>
          <div><dt>Selenographic position</dt><dd className="mono">{coord(s)}</dd></div>
          <div><dt>Polar-stereographic map position</dt><dd className="mono">x {r1(s.x_km)} km · y {r1(s.y_km)} km</dd></div>
          <div><dt>Elevation (LOLA, vs 1737.4 km sphere)</dt><dd className="mono">{r0(s.elevation_m)} m</dd></div>
          <div><dt>Local slope (80 m/px DEM)</dt><dd className="mono">{s.static.slope_deg}°</dd></div>
          <div><dt>Nearest PSR ≥ 10 km² / any PSR</dt><dd className="mono">{s.static.psr_distance_km} km / {s.static.psr_distance_any_km ?? '—'} km</dd></div>
          <div><dt>Region</dt><dd>{region?.name} · Artemis III candidate region · {region?.n_sites} candidate points</dd></div>
          <div><dt>Mission window (UTC)</dt><dd>{fmtRange(data, place.day, mission.durationDays)}</dd></div>
          <div><dt>Sun above terrain horizon</dt><dd className="mono">{m.sunPct}% · longest dark {m.maxDarkH} h</dd></div>
          <div><dt>Earth above terrain horizon</dt><dd className="mono">{m.earthPct ?? '—'}% · longest blackout {m.earthGapH ?? '—'} h</dd></div>
          <div><dt>Start days passing every rule</dt><dd className="mono">{place.flex.eligibleDays} / {place.flex.totalDays}</dd></div>
          <div><dt>Data products</dt><dd className="small">{q.dem ?? 'LOLA LDEM'} · horizon ray-cast to {q.horizon_range_km ?? 150} km{q.edge_limited ? ' (edge-limited)' : ''} · ephemeris: {q.geometry ?? 'approximate'}</dd></div>
        </dl>
        <div>
          <h4 className="mini-h">Constraints for this mission</h4>
          <ul className="constraint-list">
            {constraints.map((a) => {
              const as = ev.aspects[a];
              return (<li key={a}><StatusPill status={as.status} /> <span><strong>{ASPECT_LABEL[a]}</strong>: {as.metrics.map((x) => `${x.value ?? '—'}${x.key === 'psrKm' ? ' km' : x.key === 'slopeDeg' ? '°' : x.key.endsWith('Pct') ? '%' : ' h'} (limit ${limitText(x)})`).join(' · ')}{as.score != null && <span className="muted"> · score {Math.round(as.score)}/100</span>}</span></li>);
            })}
          </ul>
          <h4 className="mini-h">Features</h4>
          <ul className="feature-list">
            <li>{s.static.slope_deg <= 5 ? 'Gentle landing pad by DEM standards' : s.static.slope_deg <= 10 ? 'Moderate slopes; landing ellipse must avoid the steeper cells' : 'Steep terrain at DEM scale'} ({s.static.slope_deg}°).</li>
            <li>{m.sunPct >= 90 ? 'Near-continuous illumination during this window — a classic polar “peak of light”.' : m.sunPct >= 60 ? 'Mostly sunlit, with terrain-driven dark spells.' : 'Frequent terrain shadowing.'}</li>
            <li>{s.static.psr_distance_km <= 5 ? 'A large cold trap (PSR) within walking/roving distance.' : s.static.psr_distance_km <= 15 ? 'A large cold trap within a rover traverse.' : 'Large cold traps are distant.'}</li>
            <li>Highest terrain on the horizon: {r1(Math.max(...s.horizon_deg))}° at azimuth {s.horizon_deg.indexOf(Math.max(...s.horizon_deg)) * (360 / s.horizon_deg.length)}°.</li>
          </ul>
        </div>
      </div>
      <HorizonChart site={s} t={place.day * 24} />
    </div>
  );
}

/* ------------------------------------------------------------------ energy & environment assessment */
export function EnergyPanel({ sim, data, day, mission, compact = false }) {
  const S = sim.series, o = sim.out, h = sim.hours;
  const rows = energyRows(sim);
  const rating = SUITABILITY[sim.rating];
  const start = dayDate(data, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const p = mission.power;
  return (
    <div className="energy">
      <p className="energy-verdict"><StatusPill status={rating.status} label={rating.label.toUpperCase()} /> <span>{rating.text}</span></p>
      <div className="table-scroll">
        <table className="bench nums energy-table">
          <caption className="sr-only">Simulation outputs</caption>
          <thead><tr><th scope="col">#</th><th scope="col">Calculated parameter</th><th scope="col">Value</th><th scope="col">Unit</th></tr></thead>
          <tbody>{rows.map(([k, v, u], i) => (<tr key={k}><td className="mono">{i + 1}</td><th scope="row">{k}</th><td className="mono">{v}</td><td className="mono">{u}</td></tr>))}</tbody>
        </table>
      </div>
      <div className="chart-grid">
        <TimeChart title="Solar irradiance on level ground Gₕ(t)" unit="W/m²" hours={h} lit={S.lit} startLabel={start} series={[{ name: 'Gh', tone: 'cream', values: S.gh }]} yMin={0} />
        <TimeChart title="Array power vs electrical load" unit="W" hours={h} lit={S.lit} startLabel={start} series={[{ name: 'Array P(t)', tone: 'cream', values: S.pv }, { name: 'Load', tone: 'lav', values: S.load }]} yMin={0} />
        <TimeChart title="Battery state of charge" unit="%" hours={h} lit={S.lit} startLabel={start} yMin={0} yMax={100} series={[{ name: 'SoC', tone: 'cream', values: S.soc }]} note={`Floor at ${r0(100 - p.dod * 100)} % (depth of discharge ${r0(p.dod * 100)} %). Minimum ${r0(o.minSocPct)} % at hour ${o.minSocHour}.`} />
        <TimeChart title="Predicted surface temperature" unit="°C" hours={h} lit={S.lit} startLabel={start} series={[{ name: 'T', tone: 'cream', values: S.tempC }]} note={`Deep-soil node ${r0(sim.tDeepC)} °C. Shaded bands = Sun below the terrain horizon.`} />
      </div>
      {!compact && (
        <details className="limits">
          <summary>Model, equations and parameters</summary>
          <div className="eqs">
            <p><strong>Irradiance.</strong> G<sub>n</sub>(t) = S<sub>0</sub>(1 AU / r)², S<sub>0</sub> = {SOLAR_CONSTANT} W/m². Direct irradiance on level ground G<sub>h</sub> = G<sub>n</sub>·max(0, sin α)·lit(t), α = solar elevation; lit(t) = 1 when the Sun’s upper limb clears the LOLA terrain horizon at the Sun’s azimuth. (The team spec wrote cos α; with α measured as <em>elevation</em> the correct factor is sin α = cos of the zenith angle.)</p>
            <p><strong>Array.</strong> P(t) = G<sub>n</sub>·A·η·max(0, cos θ)·D, θ measured from the panel normal: {p.panelMode === 'horizontal' ? 'horizontal array, cos θ = sin α' : 'vertical Sun-tracking array, cos θ = cos α'}. A = {p.panelAreaM2} m², η = {r1(p.panelEff * 100)} %, D = {p.derate}. Mean incidence while lit: {o.meanIncidenceDeg == null ? '—' : `${r1(o.meanIncidenceDeg)}°`}.</p>
            <p><strong>Energy.</strong> E<sub>solar</sub> = Σ P<sub>j</sub>Δt, E<sub>load</sub> = Σ P<sub>load</sub>Δt with Δt = 1 h. Loads: avionics {p.loads.baseW} W always, heaters {p.loads.heaterW} W in darkness, radio {p.loads.commsW} W while Earth is in view, payload {p.loads.payloadW} W + mobility {p.loads.mobilityW} W in sunlight.</p>
            <p><strong>Battery.</strong> E<sub>b</sub>(t+Δt) = E<sub>b</sub> + η<sub>c</sub>P<sub>charge</sub>Δt − P<sub>discharge</sub>Δt/η<sub>d</sub>, bounded by (1−DoD)·E<sub>cap</sub> and E<sub>cap</sub>; E<sub>cap</sub> = {p.batteryKWh} kWh, DoD = {r0(p.dod * 100)} %, η<sub>c</sub> = {r0(p.etaC * 100)} %, η<sub>d</sub> = {r0(p.etaD * 100)} %. Endurance on the dark load T = E<sub>cap</sub>·DoD·η<sub>d</sub>/P<sub>dark</sub> = {o.enduranceH} h. Unmet load: {r1(o.unmetKWh)} kWh over {o.unmetHours} h.</p>
            <p><strong>Surface temperature.</strong> C dT/dt = (1−A<sub>B</sub>)G<sub>h</sub> + Q<sub>other</sub> − εσT⁴ − (k/Δz)(T − T<sub>deep</sub>), A<sub>B</sub> = {THERMAL.albedo}, ε = {THERMAL.emissivity}, Q<sub>other</sub> = {THERMAL.qOther} W/m², k = {THERMAL.conductivity} W/(m·K), C = ρ c d = {THERMAL.density}·{THERMAL.heatCap}·{THERMAL.layerM} J/(m²·K). Level ground only: Sun-facing slopes and the lander itself run warmer. Indicative, not a Diviner-calibrated thermal model.</p>
            <p><strong>Rating rules</strong> (team assumptions): not feasible if unmet hours &gt; {SUITABILITY_RULES.notFeasibleUnmetFrac * 100} % of the mission or E<sub>solar</sub> &lt; {SUITABILITY_RULES.notFeasibleRatio}·E<sub>load</sub>; high risk if any hour is unmet; constrained if the minimum SoC &lt; {SUITABILITY_RULES.reserveSocPct} % or the surplus &lt; {SUITABILITY_RULES.marginFrac * 100} % of the load; otherwise highly suitable.</p>
            <p className="muted small">Light-time to Earth, regolith dust on the array, array degradation, partial Sun disc below the limb and the 0.0026 AU Moon–Earth offset are ignored. Sun/Earth geometry: astronomy model, not SPICE.</p>
          </div>
        </details>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ all five places, identical mission conditions */
export function EnergyCompare({ places, data, mission }) {
  const [same, setSame] = useState(true);
  const sims = useMemo(() => places.map((p) => {
    const day = same ? places[0].day : p.day;
    return { p, day, sim: simulateEnergy(p.site, day * 24, mission.durationDays * 24, mission.power, data.window.start_utc) };
  }), [places, data, mission, same]);
  return (
    <div>
      <div className="seg small-seg" role="radiogroup" aria-label="Dates for the comparison">
        <button type="button" role="radio" aria-checked={same} className={same ? 'on' : ''} onClick={() => setSame(true)}>Same dates for all ({fmtDay(data, places[0].day)})</button>
        <button type="button" role="radio" aria-checked={!same} className={!same ? 'on' : ''} onClick={() => setSame(false)}>Each place on its own best date</button>
      </div>
      <div className="table-scroll">
        <table className="bench rank-table">
          <caption className="sr-only">Energy comparison of the five places</caption>
          <thead><tr><th scope="col">Place</th><th scope="col">Start</th><th scope="col">Sunlit</th><th scope="col">Longest dark</th><th scope="col">E solar</th><th scope="col">E load</th><th scope="col">Balance</th><th scope="col">Min SoC</th><th scope="col">T min / max</th><th scope="col">Rating</th></tr></thead>
          <tbody>
            {sims.map(({ p, day, sim }) => { const o = sim.out; return (
              <tr key={p.region}>
                <th scope="row">{p.regionName}<small>site {p.site.name.split('·')[1]?.trim()}</small></th>
                <td className="mono">{dayDate(data, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</td>
                <td className="mono">{r1(o.illumPct)}%</td>
                <td className="mono">{o.longestDarkH} h</td>
                <td className="mono">{r1(o.eSolarKWh)} kWh</td>
                <td className="mono">{r1(o.eLoadKWh)} kWh</td>
                <td className="mono">{o.eBalanceKWh >= 0 ? '+' : '−'}{r1(Math.abs(o.eBalanceKWh))}</td>
                <td className="mono">{r0(o.minSocPct)}%</td>
                <td className="mono">{r0(o.tempMinC)} / {r0(o.tempMaxC)} °C</td>
                <td><StatusPill status={SUITABILITY[sim.rating].status} label={SUITABILITY[sim.rating].label} /></td>
              </tr>); })}
          </tbody>
        </table>
      </div>
      <p className="field-note">Same mission, same power system{same ? ', same mission window' : ''}: the differences come only from each site’s terrain horizon and Sun/Earth geometry. Ratings use the rules in <Term k="dealbreaker">the model notes</Term>.</p>
    </div>
  );
}
