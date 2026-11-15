import { useMemo, useState } from 'react';
import { StatusPill, Term } from '../components/ui.jsx';
import { ASPECT_LABEL } from '../content/missions.js';
import { ORDER } from '../content/characters.js';
import { SOLAR_CONSTANT, SUITABILITY, SUITABILITY_RULES, THERMAL, energyRows, simulateEnergy } from '../engine/energy.js';
import { coord } from '../engine/banter.js';
import { dayDate, fmtDay, fmtRange } from '../engine/plan.js';
import { limitText } from './Numbers.jsx';
import { useLang, useT } from '../i18n.js';
import { ASPECT_LABEL_AR } from '../content/missions.js';
import { fmtDayAr, fmtRangeAr } from '../engine/plan.js';
const ROW_AR = ["حرارة السطح المتوقعة (الأدنى / المتوسط / الأعلى)", "الإشعاع الشمسي على أرض مستوية (الذروة / المتوسط)", "القدرة الكهربائية للألواح (الذروة / المتوسط)", "إجمالي الطاقة الشمسية المنتجة", "إجمالي الطاقة الكهربائية المستهلكة", "إجمالي التعرض للشمس", "أطول ظلام متواصل", "تحمّل البطارية مع أحمال الظلام", "شحن البطارية (الأدنى / النهائي)", "فائض (+) أو عجز (−) الطاقة", "الملاءمة العامة للطاقة الشمسية"];
const UNIT_AR = { h: 'ساعة', '': '' };
const coordAr = (st) => `${Math.abs(st.lat_deg).toFixed(2)}° جنوبًا، ${st.lon_deg.toFixed(2)}° شرقًا`;

const r0 = (x) => Math.round(x).toLocaleString('en-GB');
const r1 = (x) => (Math.round(x * 10) / 10).toLocaleString('en-GB');

/* ------------------------------------------------------------------ small SVG line chart */
export function TimeChart({ title, unit, series, lit, hours, height = 150, yMin, yMax, startLabel, note }) {
  const ar = useLang() === 'ar';
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
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ar ? `${title} خلال المهمة` : `${title} over the mission`} style={{ direction: 'ltr' }}>
        {bands.map(([a, b]) => (<rect key={a} x={x(a)} y={T} width={Math.max(1.5, x(b) - x(a))} height={H - T - B} className="tc-dark" />))}
        {ticks.map((v, i) => (<g key={i}><path d={`M${L} ${y(v)}H${W - R}`} className="tc-grid" /><text x={L - 6} y={y(v) + 4} textAnchor="end" className="tc-t">{Math.abs(hi - lo) < 10 ? r1(v) : r0(v)}</text></g>))}
        {dayTicks.map((d) => (<text key={d} x={x(Math.min(hours - 1, d * 24))} y={H - 6} textAnchor="middle" className="tc-t">{d === 0 ? (startLabel ?? (ar ? 'اليوم 0' : 'day 0')) : (ar ? `ي${d}` : `d${d}`)}</text>))}
        {series.map((s) => (<path key={s.name} d={path(s.values)} className={`tc-line tc-${s.tone}`} />))}
      </svg>
      {note && <p className="tc-note">{note}</p>}
    </figure>
  );
}

/* ------------------------------------------------------------------ horizon profile */
export function HorizonChart({ site, t }) {
  const ar = useLang() === 'ar';
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
      <figcaption><strong>{ar ? 'أفق التضاريس حول الموقع' : 'Terrain horizon around the site'}</strong> <span className="muted">{ar ? '(زاوية الارتفاع مقابل الاتجاه، من LOLA؛ النقاط = الشمس · الحلقات = الأرض خلال 30 يومًا)' : '(elevation angle vs azimuth, from LOLA; dots = Sun · rings = Earth over 30 days)'}</span></figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ar ? 'أفق التضاريس كما يُرى من الموقع' : 'Horizon profile seen from the site'} style={{ direction: 'ltr' }}>
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
  const ar = useLang() === 'ar';
  const t = useT();
  const u = (k) => (k === 'psrKm' ? (ar ? ' كم' : ' km') : k === 'slopeDeg' ? '°' : k.endsWith('Pct') ? '%' : (ar ? ' ساعة' : ' h'));
  return (
    <div className="dossier">
      <div className="dossier-grid">
        <dl className="kv2">
          <div><dt>{t('Site', 'الموقع')}</dt><dd>{s.name}</dd></div>
          <div><dt>{t('Selenographic position', 'الإحداثيات القمرية')}</dt><dd className="mono">{ar ? coordAr(s) : coord(s)}</dd></div>
          <div><dt>{t('Polar-stereographic map position', 'الموقع على الخريطة القطبية')}</dt><dd className="mono num">x {r1(s.x_km)} km · y {r1(s.y_km)} km</dd></div>
          <div><dt>{t('Elevation (LOLA, vs 1737.4 km sphere)', 'الارتفاع (LOLA، نسبة إلى كرة نصف قطرها 1737.4 كم)')}</dt><dd className="mono num">{r0(s.elevation_m)} m</dd></div>
          <div><dt>{t('Local slope (80 m/px DEM)', 'الميل المحلي (نموذج ارتفاعات 80 م/بكسل)')}</dt><dd className="mono num">{s.static.slope_deg}°</dd></div>
          <div><dt>{t('Nearest PSR ≥ 10 km² / any PSR', 'أقرب منطقة مظللة ≥ 10 كم² / أي منطقة مظللة')}</dt><dd className="mono num">{s.static.psr_distance_km} km / {s.static.psr_distance_any_km ?? '—'} km</dd></div>
          <div><dt>{t('Region', 'المنطقة')}</dt><dd>{ar ? `${region?.name} · منطقة مرشحة لـ Artemis III · ${region?.n_sites} نقاط مرشحة` : `${region?.name} · Artemis III candidate region · ${region?.n_sites} candidate points`}</dd></div>
          <div><dt>{t('Mission window (UTC)', 'نافذة المهمة (UTC)')}</dt><dd>{ar ? fmtRangeAr(data, place.day, mission.durationDays) : fmtRange(data, place.day, mission.durationDays)}</dd></div>
          <div><dt>{t('Sun above terrain horizon', 'الشمس فوق أفق التضاريس')}</dt><dd className="mono">{ar ? `${m.sunPct}% · أطول ظلام ${m.maxDarkH} ساعة` : `${m.sunPct}% · longest dark ${m.maxDarkH} h`}</dd></div>
          <div><dt>{t('Earth above terrain horizon', 'الأرض فوق أفق التضاريس')}</dt><dd className="mono">{ar ? `${m.earthPct ?? '—'}% · أطول انقطاع ${m.earthGapH ?? '—'} ساعة` : `${m.earthPct ?? '—'}% · longest blackout ${m.earthGapH ?? '—'} h`}</dd></div>
          <div><dt>{t('Start days passing every rule', 'أيام البدء التي تجتاز كل القواعد')}</dt><dd className="mono num">{place.flex.eligibleDays} / {place.flex.totalDays}</dd></div>
          <div><dt>{t('Data products', 'منتجات البيانات')}</dt><dd className="small">{q.dem ?? 'LOLA LDEM'} · {ar ? `حساب الأفق حتى ${q.horizon_range_km ?? 150} كم${q.edge_limited ? ' (محدود بالحافة)' : ''} · المواقع الفلكية: ${q.geometry ?? 'تقريبية'}` : `horizon ray-cast to ${q.horizon_range_km ?? 150} km${q.edge_limited ? ' (edge-limited)' : ''} · ephemeris: ${q.geometry ?? 'approximate'}`}</dd></div>
        </dl>
        <div>
          <h4 className="mini-h">{t('Constraints for this mission', 'قيود هذه المهمة')}</h4>
          <ul className="constraint-list">
            {constraints.map((a) => {
              const as = ev.aspects[a];
              return (<li key={a}><StatusPill status={as.status} /> <span><strong>{ar ? ASPECT_LABEL_AR[a] : ASPECT_LABEL[a]}</strong>: {as.metrics.map((x) => `${x.value ?? '—'}${u(x.key)} (${ar ? 'الحد' : 'limit'} ${limitText(x)})`).join(' · ')}{as.score != null && <span className="muted"> · {t('score', 'الدرجة')} {Math.round(as.score)}/100</span>}</span></li>);
            })}
          </ul>
          <h4 className="mini-h">{t('Features', 'المميزات')}</h4>
          <ul className="feature-list">
            <li>{s.static.slope_deg <= 5 ? t('Gentle landing pad by DEM standards', 'منطقة هبوط لطيفة بمقاييس نموذج الارتفاعات') : s.static.slope_deg <= 10 ? t('Moderate slopes; landing ellipse must avoid the steeper cells', 'منحدرات متوسطة؛ يجب أن يتجنب نطاق الهبوط الخلايا الأشد انحدارًا') : t('Steep terrain at DEM scale', 'تضاريس شديدة الانحدار بمقياس نموذج الارتفاعات')} ({s.static.slope_deg}°).</li>
            <li>{m.sunPct >= 90 ? t('Near-continuous illumination during this window — a classic polar “peak of light”.', 'إضاءة شبه مستمرة خلال هذه النافذة، وهي «قمة ضوء» قطبية نموذجية.') : m.sunPct >= 60 ? t('Mostly sunlit, with terrain-driven dark spells.', 'مضاء معظم الوقت، مع فترات ظلام تسببها التضاريس.') : t('Frequent terrain shadowing.', 'التضاريس تحجب الشمس كثيرًا.')}</li>
            <li>{s.static.psr_distance_km <= 5 ? t('A large cold trap (PSR) within walking/roving distance.', 'مصيدة باردة كبيرة (منطقة مظللة) على مسافة قريبة جدًا.') : s.static.psr_distance_km <= 15 ? t('A large cold trap within a rover traverse.', 'مصيدة باردة كبيرة في متناول رحلة مركبة جوّالة.') : t('Large cold traps are distant.', 'المصائد الباردة الكبيرة بعيدة.')}</li>
            <li>{t('Highest terrain on the horizon:', 'أعلى تضاريس على الأفق:')} <span className="num">{r1(Math.max(...s.horizon_deg))}°</span> {t('at azimuth', 'عند الاتجاه')} <span className="num">{s.horizon_deg.indexOf(Math.max(...s.horizon_deg)) * (360 / s.horizon_deg.length)}°</span>.</li>
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
  const ar = useLang() === 'ar';
  const t = useT();
  const start = dayDate(data, day).toLocaleDateString(ar ? 'ar-EG-u-nu-latn' : 'en-GB', { day: 'numeric', month: ar ? 'long' : 'short', timeZone: 'UTC' });
  const p = mission.power;
  return (
    <div className="energy">
      <p className="energy-verdict"><StatusPill status={rating.status} label={ar ? rating.label_ar : rating.label.toUpperCase()} /> <span>{ar ? rating.text_ar : rating.text}</span></p>
      <div className="table-scroll">
        <table className="bench nums energy-table">
          <caption className="sr-only">{t('Simulation outputs', 'نتائج المحاكاة')}</caption>
          <thead><tr><th scope="col">#</th><th scope="col">{t('Calculated parameter', 'المؤشر المحسوب')}</th><th scope="col">{t('Value', 'القيمة')}</th><th scope="col">{t('Unit', 'الوحدة')}</th></tr></thead>
          <tbody>{rows.map(([k, v, u], i) => (<tr key={k}><td className="mono">{i + 1}</td><th scope="row">{ar ? ROW_AR[i] : k}</th><td className="mono num">{ar && i === rows.length - 1 ? SUITABILITY[sim.rating].label_ar : v}</td><td className="mono">{ar ? (UNIT_AR[u] ?? u) : u}</td></tr>))}</tbody>
        </table>
      </div>
      <div className="chart-grid">
        <TimeChart title={t('Solar irradiance on level ground Gₕ(t)', 'الإشعاع الشمسي على أرض مستوية Gₕ(t)')} unit="W/m²" hours={h} lit={S.lit} startLabel={start} series={[{ name: 'Gh', tone: 'cream', values: S.gh }]} yMin={0} />
        <TimeChart title={t('Array power vs electrical load', 'قدرة الألواح مقابل الحمل الكهربائي')} unit="W" hours={h} lit={S.lit} startLabel={start} series={[{ name: t('Array P(t)', 'الألواح P(t)'), tone: 'cream', values: S.pv }, { name: t('Load', 'الحمل'), tone: 'lav', values: S.load }]} yMin={0} />
        <TimeChart title={t('Battery state of charge', 'شحن البطارية')} unit="%" hours={h} lit={S.lit} startLabel={start} yMin={0} yMax={100} series={[{ name: 'SoC', tone: 'cream', values: S.soc }]} note={ar ? `الحد الأدنى المسموح ${r0(100 - p.dod * 100)}% (عمق التفريغ ${r0(p.dod * 100)}%). أدنى شحن ${r0(o.minSocPct)}% عند الساعة ${o.minSocHour}.` : `Floor at ${r0(100 - p.dod * 100)} % (depth of discharge ${r0(p.dod * 100)} %). Minimum ${r0(o.minSocPct)} % at hour ${o.minSocHour}.`} />
        <TimeChart title={t('Predicted surface temperature', 'حرارة السطح المتوقعة')} unit="°C" hours={h} lit={S.lit} startLabel={start} series={[{ name: 'T', tone: 'cream', values: S.tempC }]} note={ar ? `حرارة التربة العميقة ${r0(sim.tDeepC)} °م. الأشرطة المظللة = الشمس تحت أفق التضاريس.` : `Deep-soil node ${r0(sim.tDeepC)} °C. Shaded bands = Sun below the terrain horizon.`} />
      </div>
      {!compact && (
        <details className="limits">
          <summary>{t('Model, equations and parameters', 'النموذج والمعادلات والمعاملات')}</summary>
          {ar && <p className="small">المعادلات والمعاملات التالية مكتوبة بالإنجليزية كما هي في الكود، للمراجعة العلمية.</p>}
          <div className="eqs" dir="ltr" lang="en">
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
  const ar = useLang() === 'ar';
  const t = useT();
  const sims = useMemo(() => places.map((p) => {
    const day = same ? places[0].day : p.day;
    return { p, day, sim: simulateEnergy(p.site, day * 24, mission.durationDays * 24, mission.power, data.window.start_utc) };
  }), [places, data, mission, same]);
  return (
    <div>
      <div className="seg small-seg" role="radiogroup" aria-label={t('Dates for the comparison', 'تواريخ المقارنة')}>
        <button type="button" role="radio" aria-checked={same} className={same ? 'on' : ''} onClick={() => setSame(true)}>{t('Same dates for all', 'التواريخ نفسها للجميع')} ({ar ? fmtDayAr(data, places[0].day) : fmtDay(data, places[0].day)})</button>
        <button type="button" role="radio" aria-checked={!same} className={!same ? 'on' : ''} onClick={() => setSame(false)}>{t('Each place on its own best date', 'كل موقع في أفضل تاريخ له')}</button>
      </div>
      <div className="table-scroll">
        <table className="bench rank-table">
          <caption className="sr-only">{t('Energy comparison of the five places', 'مقارنة الطاقة بين المواقع الخمسة')}</caption>
          <thead><tr><th scope="col">{t('Place', 'الموقع')}</th><th scope="col">{t('Start', 'البدء')}</th><th scope="col">{t('Sunlit', 'مضاء')}</th><th scope="col">{t('Longest dark', 'أطول ظلام')}</th><th scope="col">{t('E solar', 'الطاقة المنتجة')}</th><th scope="col">{t('E load', 'الطاقة المستهلكة')}</th><th scope="col">{t('Balance', 'الفرق')}</th><th scope="col">{t('Min SoC', 'أدنى شحن')}</th><th scope="col">{t('T min / max', 'الحرارة الدنيا / العليا')}</th><th scope="col">{t('Rating', 'التقييم')}</th></tr></thead>
          <tbody>
            {sims.map(({ p, day, sim }) => { const o = sim.out; return (
              <tr key={p.region}>
                <th scope="row">{p.regionName}<small>{t('site', 'الموقع')} {p.site.name.split('·')[1]?.trim()}</small></th>
                <td className="mono">{dayDate(data, day).toLocaleDateString(ar ? 'ar-EG-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</td>
                <td className="mono">{r1(o.illumPct)}%</td>
                <td className="mono num">{o.longestDarkH} {t('h', 'ساعة')}</td>
                <td className="mono">{r1(o.eSolarKWh)} kWh</td>
                <td className="mono">{r1(o.eLoadKWh)} kWh</td>
                <td className="mono">{o.eBalanceKWh >= 0 ? '+' : '−'}{r1(Math.abs(o.eBalanceKWh))}</td>
                <td className="mono">{r0(o.minSocPct)}%</td>
                <td className="mono">{r0(o.tempMinC)} / {r0(o.tempMaxC)} °C</td>
                <td><StatusPill status={SUITABILITY[sim.rating].status} label={ar ? SUITABILITY[sim.rating].label_ar : SUITABILITY[sim.rating].label} /></td>
              </tr>); })}
          </tbody>
        </table>
      </div>
      <p className="field-note">{ar ? `المهمة نفسها ونظام الطاقة نفسه${same ? ' ونافذة المهمة نفسها' : ''}: الفروق تأتي فقط من أفق تضاريس كل موقع ومواقع الشمس والأرض. والتقييمات تتبع القواعد المذكورة في ملاحظات النموذج.` : <>Same mission, same power system{same ? ', same mission window' : ''}: the differences come only from each site’s terrain horizon and Sun/Earth geometry. Ratings use the rules in <Term k="dealbreaker">the model notes</Term>.</>}</p>
    </div>
  );
}
