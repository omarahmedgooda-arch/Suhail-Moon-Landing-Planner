import { lazy, Suspense, useState } from 'react';
import { RegionMap } from './MapViews.jsx';

const maps = import.meta.glob('../assets/maps2/*.webp', { eager: true, query: '?url', import: 'default' });
const vids = import.meta.glob('../assets/video/*.mp4', { eager: true, query: '?url', import: 'default' });
export const mapLayer = (region, layer) => maps[`../assets/maps2/${region}-${layer}.webp`];
export const legend = (layer) => maps[`../assets/maps2/legend-${layer}.webp`];
export const videoUrl = (name) => vids[`../assets/video/${name}.mp4`];

const Terrain3D = lazy(() => import('./Terrain3D.jsx'));

/** Site position inside the region's 80 km crop, in % (x right, y down). */
function sitePct(data, regionId, site) {
  const r = data.map.regions.find((q) => q.id === regionId);
  const [cx, cy] = r.crop.center_km; const s = r.crop.size_km;
  return { x: ((site.x_km - (cx - s / 2)) / s) * 100, y: (((cy + s / 2) - site.y_km) / s) * 100, r };
}

function LayerMap({ data, regionId, site, layer }) {
  const { x, y, r } = sitePct(data, regionId, site);
  const [cx, cy] = r.crop.center_km; const s = r.crop.size_km;
  const poly = r.polygon_km.map(([px, py]) => `${((px - (cx - s / 2)) / s) * 100},${(((cy + s / 2) - py) / s) * 100}`).join(' ');
  return (
    <figure className="layer-map">
      <div className="layer-box">
        <img src={mapLayer(regionId, layer)} alt={`${layer === 'elev' ? 'Colour-coded elevation' : 'Slope'} map of ${r.name}`} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polygon points={poly} className="lm-region" />
          <circle cx={x} cy={y} r="1.6" className="lm-site" /><circle cx={x} cy={y} r="3.4" className="lm-ring" />
        </svg>
        <span className="scale-bar"><i /> 10 km</span>
        <span className="north">↑ 0° lon</span>
      </div>
      <figcaption>
        <img className="legend" src={legend(layer)} alt="" />
        {layer === 'elev'
          ? <span className="legend-txt"><span>low</span><span>elevation (LOLA, 1–99 % stretch)</span><span>high</span></span>
          : <span className="legend-txt"><span>0°</span><span>5°</span><span>10°</span><span>15°</span><span>20°</span><span>30°+</span></span>}
        <span className="muted small">Pale-blue outlines = permanently shadowed regions (LOLA LPSR ≥ 1 km²). Dashed box = NASA Artemis III candidate region. Dot = this site.</span>
      </figcaption>
    </figure>
  );
}

/** Tabs: NASA flyover · elevation · slope · LOLA relief · 3D. */
export default function RegionMedia({ data, regionId, site, startHour = 0, hours = 240, defaultTab = 'video' }) {
  const [tab, setTab] = useState(videoUrl(regionId) ? defaultTab : 'elev');
  const TABS = [
    videoUrl(regionId) && ['video', 'Flyover'],
    ['relief', 'Moon view'], ['3d', '3D terrain'], ['elev', 'Elevation map'], ['slope', 'Slope map'],
  ].filter(Boolean);
  return (
    <div className="region-media">
      <div className="rm-tabs" role="tablist" aria-label="Views of this region">
        {TABS.map(([id, label]) => (<button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>))}
      </div>
      <div className="rm-body" role="tabpanel">
        {tab === 'video' && (
          <figure className="rm-video">
            <video key={regionId} src={videoUrl(regionId)} autoPlay muted loop playsInline controls preload="metadata" />
            <figcaption className="muted small">Flyover of this Artemis III candidate region. Credit: NASA’s Scientific Visualization Studio (Artemis III candidate landing regions, 2022).</figcaption>
          </figure>
        )}
        {(tab === 'elev' || tab === 'slope') && <LayerMap data={data} regionId={regionId} site={site} layer={tab} />}
        {tab === 'relief' && (<>
          <RegionMap data={data} regionId={regionId} siteId={site.id} />
          <p className="muted small">Shaded relief from NASA LOLA elevation (80 m/pixel), lit from the upper left.</p>
        </>)}
        {tab === '3d' && (
          <Suspense fallback={<p className="muted">Loading the 3D terrain…</p>}>
            <Terrain3D data={data} regionId={regionId} site={site} startHour={startHour} hours={hours} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
