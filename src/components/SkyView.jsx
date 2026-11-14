import { Defs, Stars } from './Art.jsx';
import { horizonAt, SUN_LIMB_DEG } from '../engine/rules.js';
import { useWidth } from '../hooks.js';

const H = 250, Y0 = 176, K = 16; // 16 px per degree of elevation (vertical stretch is deliberate)
// Wide screens draw on a 720-unit canvas that scales up; on phones the canvas is the real width so text stays readable.
const canvasW = (px) => (px >= 720 ? 720 : Math.max(300, Math.round(px)));
const clampX = (x, W, pad = 44) => Math.min(W - pad, Math.max(pad, x));

const WIND = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
export const windName = (az) => WIND[Math.round((((az % 360) + 360) % 360) / 45) % 8];
const fy = (el) => Y0 - el * K;

export function describeBody(name, site, series, t) {
  const hourly = site.hourly;
  const el = name === 'Sun' ? hourly.sun_el_deg?.[t] : hourly.earth_el_deg?.[t];
  const az = name === 'Sun' ? hourly.sun_az_deg?.[t] : hourly.earth_az_deg?.[t];
  if (el == null) return `${name}: no data for this site yet.`;
  const hz = horizonAt(site.horizon_deg, az);
  const vis = series ? series[t] : 0;
  const where = el < -3 ? `${Math.abs(el).toFixed(1)}° below the horizon, so it is not in the sky at all` : `${Math.abs(el).toFixed(1)}° ${el >= 0 ? 'above' : 'below'} the horizon toward the ${windName(az)}`;
  const terrain = el < -3 ? '' : `. The terrain that way reaches ${hz.toFixed(1)}°, so it is ${vis ? 'visible' : 'hidden behind the ground'}`;
  return `${name}: ${where}${terrain}.`;
}

export function SkyView({ site, t, t0, hours, real = false }) {
  const [ref, px] = useWidth(720);
  const W = canvasW(px);
  const fx = (az) => (az / 360) * W;
  const h = site.hourly;
  const sunEl = h.sun_el_deg[t], sunAz = h.sun_az_deg[t];
  const earthEl = h.earth_el_deg?.[t], earthAz = h.earth_az_deg?.[t];
  const sunVis = !!site.vis.sun[t];
  const earthVis = site.vis.earth ? !!site.vis.earth[t] : false;

  const profile = Array.from({ length: 73 }, (_, i) => `${fx(i * 5).toFixed(1)},${fy(site.horizon_deg[i % 72]).toFixed(1)}`);
  const terrain = `M0,${H} L${profile.join(' L')} L${W},${H} Z`;
  const edge = `M${profile.join(' L')}`;

  const trail = (el, az, color) => {
    if (!el) return null;
    const dots = [];
    for (let tt = t0; tt < Math.min(t0 + hours, el.length); tt += 6) {
      if (el[tt] > -2.5) dots.push(<circle key={tt} cx={fx(az[tt])} cy={fy(el[tt])} r="1.7" fill={color} opacity=".5" />);
    }
    return <g>{dots}</g>;
  };

  const body = (kind, el, az, vis) => {
    if (el == null || el < -3) return null;
    const x = fx(az), y = fy(el);
    return kind === 'sun' ? (
      <g>
        <circle cx={x} cy={y} r="34" fill="url(#g-sun)" opacity={vis ? 1 : .55} />
        <circle cx={x} cy={y} r="10" fill="var(--cream)" />
      </g>
    ) : (
      <g>
        <circle cx={x} cy={y} r="24" fill="url(#g-earth)" opacity=".7" />
        <circle cx={x} cy={y} r="8.5" fill="var(--indigo)" stroke="var(--lav)" strokeWidth="1.4" />
        <path d={`M${x - 4.6} ${y - 1.4}q2.4-3.4 5-1.2t1.8 3.2q-3.6 1.8-6.6-.4z`} fill="var(--cream)" opacity=".8" />
      </g>
    );
  };
  const ghost = (kind, el, az, vis) => {
    if (el == null || el < -3 || vis) return null;
    const x = fx(az), y = fy(el);
    return (
      <g>
        <circle cx={x} cy={y} r={kind === 'sun' ? 12 : 10.5} fill="none" stroke="var(--cream)" strokeWidth="1.6" strokeDasharray="3 3" />
        <text x={clampX(x, W)} y={y - 20} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--cream)">{kind === 'sun' ? 'Sun' : 'Earth'} hidden</text>
      </g>
    );
  };
  const label = (kind, el, az, vis) => (el == null || el < -3 || !vis ? null : (
    <text x={clampX(fx(az), W, 24)} y={fy(el) - (kind === 'sun' ? 40 : 24)} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill="var(--cream)">{kind === 'sun' ? 'Sun' : 'Earth'}</text>
  ));

  return (
    <figure className="sky" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} className="sky-svg" role="img" aria-label={`Sky seen from ${site.name}. ${describeBody('Sun', site, site.vis.sun, t)} ${describeBody('Earth', site, site.vis.earth, t)}`}>
        <Defs />
        <rect width={W} height={H} fill="url(#g-sky)" />
        <Stars w={W} h={Y0 - 10} n={70} seed={site.id.length * 11} />
        {[5, 10].map((e) => (<g key={e}><path d={`M0 ${fy(e)}H${W}`} stroke="var(--lav)" strokeOpacity=".28" strokeDasharray="2 7" /><text x="4" y={fy(e) - 3} fontFamily="var(--font-mono)" fontSize="9" fill="var(--text-muted)">{e}°</text></g>))}
        {trail(h.sun_el_deg, h.sun_az_deg, 'var(--cream)')}
        {trail(h.earth_el_deg, h.earth_az_deg, 'color-mix(in srgb, var(--lav) 55%, var(--cream))')}
        {body('sun', sunEl, sunAz, sunVis)}
        {body('earth', earthEl, earthAz, earthVis)}
        {/* terrain on top: it hides whatever is behind it */}
        <path d={terrain} fill="var(--ink)" stroke="none" />
        <path d={edge} fill="none" stroke="var(--cream)" strokeOpacity=".75" strokeWidth="1.8" strokeLinejoin="round" />
        <path d={`M0 ${Y0}H${W}`} stroke="var(--cream)" strokeOpacity=".4" strokeDasharray="4 6" />
        <text x="4" y={Y0 + 14} fontFamily="var(--font-mono)" fontSize="9" fill="var(--text-muted)">0° · flat horizon</text>
        {ghost('sun', sunEl, sunAz, sunVis)}
        {ghost('earth', earthEl, earthAz, earthVis)}
        {label('sun', sunEl, sunAz, sunVis)}
        {label('earth', earthEl, earthAz, earthVis)}
        {[0, 45, 90, 135, 180, 225, 270, 315, 360].map((a) => (<text key={a} x={Math.min(W - 12, Math.max(12, fx(a)))} y={H - 10} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--cream)">{{ 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW', 360: 'N' }[a]}</text>))}
      </svg>
      <figcaption className="sky-cap">
        <p><strong>{describeBody('Sun', site, site.vis.sun, t)}</strong></p>
        <p><strong>{describeBody('Earth', site, site.vis.earth, t)}</strong></p>
        <p className="muted">Dots show where each one travels during your mission. Heights are stretched so small angles are visible, and the terrain outline {real ? 'comes from NASA LOLA elevation data' : 'is sample data'}. The Sun counts as up once its top edge clears the horizon ({SUN_LIMB_DEG}° allowed).</p>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ mission timeline */
function runs(series, from, to) {
  const out = []; let s = -1;
  for (let i = from; i <= to; i++) {
    const up = i < to && series[i];
    if (up && s < 0) s = i;
    if (!up && s >= 0) { out.push([s, i]); s = -1; }
  }
  return out;
}
function longestDark(series, from, to) {
  let best = [from, from], s = -1;
  for (let i = from; i <= to; i++) {
    const dark = i < to && !series[i];
    if (dark && s < 0) s = i;
    if (!dark && s >= 0) { if (i - s > best[1] - best[0]) best = [s, i]; s = -1; }
  }
  return best;
}

export function Timeline({ site, t0, hours, scrub }) {
  const [ref, px] = useWidth(720);
  const TW = canvasW(px), X0 = 54, X1 = TW - 8, span = X1 - X0;
  const sx = (i) => X0 + ((i - t0) / hours) * span;
  const days = Math.round(hours / 24);
  const dark = longestDark(site.vis.sun, t0, t0 + hours);
  const rows = [
    { key: 'sun', label: 'Sun', y: 26, series: site.vis.sun, fill: 'var(--cream)' },
    { key: 'earth', label: 'Earth', y: 66, series: site.vis.earth, fill: 'color-mix(in srgb, var(--lav) 55%, var(--cream))' },
  ];
  return (
    <figure className="timeline" ref={ref}>
      <svg viewBox={`0 0 ${TW} 126`} className="timeline-svg" role="img" aria-label={`Mission timeline at ${site.name}: when the Sun and Earth are above the terrain horizon during the ${days}-day mission.`}>
        <defs><pattern id="tl-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--ink)" /><path d="M0 0v6" stroke="var(--lav)" strokeOpacity=".4" strokeWidth="1.2" /></pattern></defs>
        {Array.from({ length: days + 1 }, (_, d) => (<g key={d}><path d={`M${sx(t0 + d * 24)} 14V96`} stroke="var(--lav)" strokeOpacity=".35" strokeDasharray="1 4" />{d < days && <text x={sx(t0 + d * 24) + 3} y="11" fontFamily="var(--font-mono)" fontSize="9" fill="var(--text-muted)">D{d + 1}</text>}</g>))}
        {rows.map((r) => (
          <g key={r.key}>
            <text x="0" y={r.y + 17} fontFamily="var(--font-mono)" fontSize="11" fill="var(--cream)">{r.label}</text>
            <rect x={X0} y={r.y} width={span} height="26" fill="url(#tl-hatch)" stroke="var(--line-strong)" rx="3" />
            {r.series ? runs(r.series, t0, t0 + hours).map(([a, b]) => (<rect key={a} x={sx(a)} y={r.y} width={Math.max(1, sx(b) - sx(a))} height="26" fill={r.fill} />)) : (<text x={X0 + span / 2} y={r.y + 17} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--cream)">no Earth data for this site yet</text>)}
          </g>
        ))}
        {dark[1] - dark[0] > 0 && (
          <g>
            <path d={`M${sx(dark[0])} 98v6H${sx(dark[1])}v-6`} fill="none" stroke="var(--cream)" strokeWidth="1.6" />
            <text x={clampX((sx(dark[0]) + sx(dark[1])) / 2, TW, 88)} y="118" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--cream)">longest dark stretch: {dark[1] - dark[0]} h</text>
          </g>
        )}
        <g transform={`translate(${sx(t0 + Math.min(scrub, hours - 1))} 0)`}>
          <path d="M0 16V96" stroke="var(--cream)" strokeWidth="2.4" />
          <path d="M-5 12h10l-5 7z" fill="var(--cream)" />
        </g>
      </svg>
      <figcaption className="timeline-cap">Filled = up · hatched = down. The vertical marker is the moment shown in the sky above.</figcaption>
    </figure>
  );
}
