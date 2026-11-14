import { useEffect, useMemo, useRef, useState } from 'react';
import { mapUrl } from '../assets/mapUrls.js';
import { useReducedMotion } from '../hooks.js';

/* South-pole polar stereographic maps. x_km / y_km are map coordinates from the pipeline
   (pole at 0,0; up on the map = toward 0° longitude). Hillshade from NASA LOLA (80 m per pixel). */

const R_KM = 1737.4;
const ringKm = (latS) => (2 * R_KM * Math.tan(((90 - latS) * Math.PI) / 360));

export function PoleMap({ data, places = [], focus = null, selected = null, onSelect, label = 'Map of the Moon’s south pole with the candidate landing regions' }) {
  const reduced = useReducedMotion();
  const ext = data.map.extent_km;
  const S = 1000 / (2 * ext); // px per km
  const px = (x) => 500 + x * S;
  const py = (y) => 500 - y * S;
  const regions = data.map.regions;
  const target = useMemo(() => {
    const r = focus && regions.find((q) => q.id === focus);
    return r ? { x: px(r.centroid.x_km) - 150, y: py(r.centroid.y_km) - 150, w: 300 } : { x: 0, y: 0, w: 1000 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, regions]);
  const [vb, setVb] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    if (reduced) { cur.current = target; setVb(target); return undefined; }
    const from = { ...cur.current }; const t0 = performance.now(); let raf;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 800); const e = 1 - (1 - k) ** 3;
      const v = { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, w: from.w + (target.w - from.w) * e };
      cur.current = v; setVb(v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);

  const k = vb.w / 1000;               // 1 on the full map, 0.3 when zoomed to a region
  const rank = Object.fromEntries(places.map((p) => [p.region, p]));
  const sitesByRegion = useMemo(() => {
    const m = {};
    for (const s of data.sites) (m[s.region] ??= []).push(s);
    return m;
  }, [data]);

  return (
    <figure className="polemap">
      <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.w}`} role="img" aria-label={label}>
        <image href={mapUrl(data.map.global_image)} x="0" y="0" width="1000" height="1000" preserveAspectRatio="none" />
        <circle cx="500" cy="500" r="500" fill="none" stroke="var(--lav)" strokeOpacity=".5" strokeWidth={1.5 * k} />
        {[85, 88].map((lat) => (
          <g key={lat}>
            <circle cx="500" cy="500" r={ringKm(lat) * S} fill="none" stroke="var(--cream)" strokeOpacity=".35" strokeDasharray={`${3 * k} ${7 * k}`} strokeWidth={1.2 * k} />
            <text x="500" y={500 - ringKm(lat) * S - 5 * k} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={11 * k} fill="var(--cream)" opacity=".8">{lat}°S</text>
          </g>
        ))}
        <text x="500" y={20 * k + vb.y * 0 + 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill="var(--cream)" opacity={k > 0.6 ? 0.85 : 0}>80°S (edge of the elevation data)</text>
        <circle cx="500" cy="500" r={3.5 * k} fill="var(--cream)" /><text x="508" y="494" fontFamily="var(--font-mono)" fontSize={11 * k} fill="var(--cream)">pole</text>

        {regions.map((r) => {
          const p = rank[r.id];
          const on = selected === r.id || focus === r.id;
          const pts = r.polygon_km.map(([x, y]) => `${px(x)},${py(y)}`).join(' ');
          return (
            <g key={r.id}>
              <polygon points={pts} fill={p ? 'var(--cream)' : 'none'} fillOpacity={p ? (on ? 0.24 : 0.12) : 0} stroke="var(--cream)" strokeOpacity={p ? 0.95 : 0.4} strokeWidth={(on ? 3 : 1.6) * k} strokeDasharray={p ? undefined : `${4 * k} ${4 * k}`} strokeLinejoin="round" />
              {(sitesByRegion[r.id] ?? []).map((s) => (<circle key={s.id} cx={px(s.x_km)} cy={py(s.y_km)} r={(p ? 2.4 : 1.8) * k} fill="var(--cream)" opacity={p ? 0.85 : 0.45} />))}
            </g>
          );
        })}

        {places.map((p) => {
          const r = regions.find((q) => q.id === p.region);
          const cx = px(r.centroid.x_km), cy = py(r.centroid.y_km);
          const on = selected === p.region || focus === p.region;
          const status = p.ev.verdict;
          return (
            <g key={p.region} className={`pin ${on ? 'on' : ''}`} transform={`translate(${cx} ${cy})`} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined}
              aria-label={`Place ${p.rank}: ${p.regionName}, ${status === 'go' ? 'Go' : status === 'risky' ? 'Risky' : 'No-Go'}`}
              onClick={() => onSelect?.(p.region)} onKeyDown={(e) => { if (onSelect && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(p.region); } }}>
              <circle r={22 * k} fill="var(--ink)" stroke="var(--cream)" strokeWidth={(on ? 4 : 2.4) * k} />
              {status === 'nogo' && <circle r={26 * k} fill="none" stroke="var(--cream)" strokeWidth={1.4 * k} strokeDasharray={`${3 * k} ${3 * k}`} />}
              <text y={7 * k} textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize={21 * k} fill="var(--cream)">{p.rank}</text>
              <text y={-30 * k} textAnchor="middle" fontFamily="var(--font-body)" fontWeight="700" fontSize={14 * k} fill="var(--cream)" stroke="var(--ink)" strokeWidth={4 * k} paintOrder="stroke" strokeLinejoin="round">{p.regionName}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/** Close-up of one region: hillshade crop, region outline, every candidate site, the chosen one highlighted. */
export function RegionMap({ data, regionId, siteId }) {
  const reg = data.map.regions.find((r) => r.id === regionId);
  const sites = data.sites.filter((s) => s.region === regionId);
  const [cx, cy] = reg.crop.center_km, size = reg.crop.size_km;
  const P = 800 / size;
  const X = (x) => (x - (cx - size / 2)) * P;
  const Y = (y) => ((cy + size / 2) - y) * P;
  const chosen = sites.find((s) => s.id === siteId);
  return (
    <figure className="regionmap">
      <svg viewBox="0 0 800 800" role="img" aria-label={`Close-up of ${reg.name} with ${sites.length} candidate sites. The chosen site is marked.`}>
        <image href={mapUrl(reg.crop.file)} width="800" height="800" />
        <polygon points={reg.polygon_km.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')} fill="none" stroke="var(--cream)" strokeWidth="2.4" strokeDasharray="10 7" strokeLinejoin="round" />
        {sites.map((s) => (<circle key={s.id} cx={X(s.x_km)} cy={Y(s.y_km)} r="5" fill="var(--cream)" stroke="var(--ink)" strokeWidth="1.6" opacity=".9" />))}
        {chosen && (
          <g transform={`translate(${X(chosen.x_km)} ${Y(chosen.y_km)})`}>
            <circle r="26" fill="none" stroke="var(--cream)" strokeWidth="3" className="pulse-ring" />
            <circle r="9" fill="var(--cream)" stroke="var(--ink)" strokeWidth="3" />
            <text y="-34" textAnchor="middle" fontFamily="var(--font-body)" fontWeight="700" fontSize="22" fill="var(--cream)" stroke="var(--ink)" strokeWidth="6" paintOrder="stroke" strokeLinejoin="round">here</text>
          </g>
        )}
        <g transform="translate(24 770)"><path d={`M0 0H${10 * P}`} stroke="var(--cream)" strokeWidth="4" /><path d={`M0 -7V7M${10 * P} -7V7`} stroke="var(--cream)" strokeWidth="3" /><text x={10 * P + 10} y="6" fontFamily="var(--font-mono)" fontSize="18" fill="var(--cream)" stroke="var(--ink)" strokeWidth="5" paintOrder="stroke">10 km</text></g>
        <g transform="translate(760 40)" fill="var(--cream)" fontFamily="var(--font-mono)" fontSize="16"><path d="M0 24V-4M-6 4l6-8 6 8" stroke="var(--cream)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /><text x="-16" y="46" stroke="var(--ink)" strokeWidth="4" paintOrder="stroke">0°E</text></g>
      </svg>
      <figcaption className="map-cap">Shaded relief from NASA LOLA elevation data. Up is toward 0° longitude (polar view).</figcaption>
    </figure>
  );
}
