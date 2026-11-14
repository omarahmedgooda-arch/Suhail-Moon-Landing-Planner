import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import terrain from '../data/terrain3d.json';
import { mapLayer } from './RegionMedia.jsx';
import { mapUrl } from '../assets/mapUrls.js';
import { useReducedMotion } from '../hooks.js';

const DEG = Math.PI / 180;

function decodeHeights(b64, n) {
  const bin = atob(b64); const out = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) out[i] = (bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8)) / 65535;
  return out;
}

/** Sun direction in scene coordinates (x = map x, z = −map y, y = up) from local azimuth/elevation. */
function sunVector(site, az, el) {
  const lon = site.lon_deg * DEG;
  const N = [Math.sin(lon), Math.cos(lon)], E = [Math.cos(lon), -Math.sin(lon)];
  const h = Math.cos(el * DEG);
  const mx = h * (Math.sin(az * DEG) * E[0] + Math.cos(az * DEG) * N[0]);
  const my = h * (Math.sin(az * DEG) * E[1] + Math.cos(az * DEG) * N[1]);
  return new THREE.Vector3(mx, Math.sin(el * DEG), -my).normalize();
}

/**
 * 3D LOLA terrain of the 80 km region box, textured with the natural shaded relief and lit by the Sun
 * from the site's real azimuth/elevation at the chosen mission hour (shadows are cast by the terrain).
 */
export default function Terrain3D({ data, regionId, site, startHour = 0, hours = 240 }) {
  const host = useRef(null);
  const api = useRef({});
  const reduced = useReducedMotion();
  const [hour, setHour] = useState(0);
  const [exag, setExag] = useState(3);
  const [layer, setLayer] = useState('natural');
  const T = terrain.regions[regionId];
  const n = terrain.grid, size = terrain.size_km;
  const heights = useMemo(() => (T ? decodeHeights(T.h, n) : null), [T, n]);
  const r = data.map.regions.find((q) => q.id === regionId);
  const t = Math.min(startHour + hour, site.hourly.sun_el_deg.length - 1);
  const az = site.hourly.sun_az_deg[t], el = site.hourly.sun_el_deg[t];
  const lit = site.vis?.sun?.[t] === 1;

  // build scene once per region
  useEffect(() => {
    if (!heights || !host.current) return undefined;
    const el0 = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
    catch { el0.textContent = 'WebGL is not available in this browser.'; return undefined; }
    const W = el0.clientWidth || 600, H = Math.round(W * 0.66);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x0b0a12);
    el0.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(42, W / H, 0.1, 1000);
    cam.position.set(0, 55, 62);
    const ctl = new OrbitControls(cam, renderer.domElement);
    ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI * 0.49; ctl.minDistance = 12; ctl.maxDistance = 160;

    const geo = new THREE.PlaneGeometry(size, size, n - 1, n - 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);
    scene.add(new THREE.AmbientLight(0xffffff, 0.08));
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.6);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 400 });
    sun.shadow.bias = -0.0006;
    scene.add(sun); scene.add(sun.target);

    // site marker: a thin pole + ring
    const [cx, cy] = r.crop.center_km;
    const sx = site.x_km - cx, sz = -(site.y_km - cy);
    const marker = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 8), new THREE.MeshBasicMaterial({ color: 0xc8c793 }));
    pole.position.y = 3; marker.add(pole);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.12, 8, 32), new THREE.MeshBasicMaterial({ color: 0xc8c793 }));
    ring.rotation.x = Math.PI / 2; marker.add(ring);
    scene.add(marker);

    let raf, alive = true;
    const loop = () => { if (!alive) return; ctl.update(); renderer.render(scene, cam); raf = requestAnimationFrame(loop); };
    loop();
    const onResize = () => { const w = el0.clientWidth || W, h = Math.round(w * 0.66); renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    window.addEventListener('resize', onResize);
    api.current = { geo, mat, sun, marker, sx, sz, renderer };
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); ctl.dispose(); geo.dispose(); mat.dispose(); renderer.dispose(); el0.innerHTML = ''; };
  }, [heights, n, size, r, site]);

  // heights × exaggeration
  useEffect(() => {
    const { geo, marker, sx, sz } = api.current;
    if (!geo || !heights) return;
    const pos = geo.attributes.position;
    const range = (T.zmax - T.zmin) / 1000; // km
    for (let i = 0; i < pos.count; i++) pos.setY(i, heights[i] * range * exag);
    pos.needsUpdate = true; geo.computeVertexNormals();
    // marker height: sample the grid
    const col = Math.round(((sx + size / 2) / size) * (n - 1)), row = Math.round(((sz + size / 2) / size) * (n - 1));
    const hi = heights[Math.max(0, Math.min(n - 1, row)) * n + Math.max(0, Math.min(n - 1, col))] * range * exag;
    marker.position.set(sx, hi, sz);
  }, [exag, heights, T, n, size]);

  // texture
  useEffect(() => {
    const { mat } = api.current;
    if (!mat) return undefined;
    const url = layer === 'grey' ? null : layer === 'natural' ? mapUrl(`${regionId}.webp`) : mapLayer(regionId, layer);
    if (!url) { mat.map = null; mat.color.set(0xb9b6a8); mat.needsUpdate = true; return undefined; }
    let cancelled = false;
    new THREE.TextureLoader().load(url, (tex) => { if (cancelled) return; tex.colorSpace = THREE.SRGBColorSpace; mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true; });
    return () => { cancelled = true; };
  }, [layer, regionId, heights]);

  // sun
  useEffect(() => {
    const { sun } = api.current;
    if (!sun) return;
    const v = sunVector(site, az, Math.max(el, -2));
    sun.position.copy(v.clone().multiplyScalar(200));
    sun.intensity = el > -0.3 ? 2.6 : 0.0;
  }, [az, el, site, heights]);

  // play
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setHour((h) => (h + 2) % hours), reduced ? 400 : 90);
    return () => clearInterval(id);
  }, [playing, hours, reduced]);

  if (!T) return <p className="muted">No 3D terrain for this region.</p>;
  return (
    <div className="t3d">
      <div ref={host} className="t3d-canvas" aria-label={`3D terrain of ${r.name}; drag to rotate, scroll to zoom`} role="img" />
      <div className="t3d-ctl">
        <button type="button" className="btn btn-ghost btn-sm" aria-pressed={playing} onClick={() => setPlaying((p) => !p)}>{playing ? '❚❚ Pause' : '▶ Play the Sun'}</button>
        <label className="range-label grow" htmlFor={`t3d-h-${regionId}`}>Mission hour <strong className="mono">{hour}</strong> · Sun az <span className="mono">{az.toFixed(1)}°</span> el <span className="mono">{el.toFixed(2)}°</span> · {lit ? 'site in sunlight' : 'site in shadow'}</label>
        <input id={`t3d-h-${regionId}`} type="range" min="0" max={hours - 1} value={hour} onChange={(e) => { setPlaying(false); setHour(+e.target.value); }} />
        <label className="numfield" htmlFor={`t3d-x-${regionId}`}><span>Vertical exaggeration ×{exag}</span><input id={`t3d-x-${regionId}`} type="range" min="1" max="8" step="0.5" value={exag} onChange={(e) => setExag(+e.target.value)} /></label>
        <label className="numfield" htmlFor={`t3d-l-${regionId}`}><span>Surface colour</span>
          <select id={`t3d-l-${regionId}`} value={layer} onChange={(e) => setLayer(e.target.value)}><option value="natural">Moon (natural)</option><option value="elev">Elevation colours</option><option value="slope">Slope colours</option><option value="grey">Plain regolith</option></select>
        </label>
      </div>
      <p className="muted small">NASA LOLA elevation (80 m/px resampled to 400 m for 3D), 80 × 80 km box, relief range {Math.round(T.zmin)} … {Math.round(T.zmax)} m. Lighting uses the Sun’s computed azimuth and elevation at this site, so the shadows you see are the shadows the mission would see. Drag to rotate, scroll to zoom.</p>
    </div>
  );
}
