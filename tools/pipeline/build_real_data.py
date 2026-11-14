#!/usr/bin/env python3
"""
SUHAIL real-data pipeline  ->  src/data/real-sites.json  (schema suhail.sites/v0, is_sample=false)
                              src/assets/map/*.webp      (hillshade maps for the UI)

Inputs (NASA PGDA product 90, Barker et al. 2023 - LOLA south-pole products):
  --dem   LDEM_80S_80MPP_ADJ.tiff              elevation, metres, 80 m/px, south polar stereographic
  --psr   LPSR_80S_20MPP_ADJ_1km2   (.shp)     permanently shadowed regions >= 1 km2 (give the path without extension)
Candidate regions: the Artemis candidate landing regions as drawn in NASA Quickmap
("A3: Candidate Landing Regions 2022" layer), see REGIONS below.

What is computed, per candidate site:
  * horizon_deg[72]  terrain horizon every 5 deg of azimuth, ray-marched on the DEM out to 150 km
                     (sphere curvature included).
  * slope_deg        90th percentile of the local slope within 300 m (80 m DEM, 160 m baseline), i.e. a
                     cautious value. The DEM is 80 m/px, so metre-scale hazards are NOT visible in it.
  * psr_distance_km  distance to the nearest PSR of at least PSR_MIN_AREA_KM2.
  * hourly Sun and Earth azimuth/elevation (centre of disc, airless, observer on the surface), from
    astropy's built-in ephemeris plus the IAU 2009 lunar rotation model (WGCCRE 2009). This is an
    approximation of what NASA SPICE/Horizons gives; validate with tools/validate_horizons.py.

Run:  python3 build_real_data.py --dem ... --psr ... --start 2027-07-15 --hours 4320
"""
import argparse, json, math, os, sys, time
from datetime import datetime, timezone
import numpy as np

R = 1737400.0            # Moon reference sphere, m (matches the DEM's datum)
PIXEL = 80.0
SUN_RADIUS_DEG = 0.27
PSR_MIN_AREA_KM2 = 10.0  # PSRs smaller than this are ignored for "distance to ice" (team assumption)
MAX_RANGE_KM = 150.0
N_AZ = 72

# Quickmap polygons (lat, lon_east), planetocentric, from the "A3: Candidate Landing Regions 2022" layer.
REGIONS = {
    'de_gerlache_rim_2': ('de Gerlache Rim 2', [(-87.78529, 299.42746), (-88.32789, 310.60129), (-88.65999, 288.65789), (-88.02393, 282.52881)]),
    'nobile_rim_2': ('Nobile Rim 2', [(-84.04794, 54.46232), (-83.50155, 57.84068), (-83.82634, 63.02472), (-84.40462, 59.96216)]),
    'nobile_rim_1': ('Nobile Rim 1', [(-85.35325, 31.66075), (-84.97628, 38.07278), (-85.47632, 43.22853), (-85.89922, 36.50144)]),
    'malapert_massif': ('Malapert Massif', [(-85.63394, 355.23636), (-85.63656, 4.33231), (-86.32589, 5.14788), (-86.32279, 354.34052)]),
    'haworth': ('Haworth', [(-86.11240, 333.34804), (-86.44277, 347.63822), (-87.39353, 343.00918), (-86.95784, 325.01815)]),
    'faustini_rim_a': ('Faustini Rim A', [(-88.18907, 79.50852), (-87.53783, 82.30395), (-87.53783, 97.69605), (-88.18907, 100.49148)]),
    'leibnitz_beta_plateau': ('Leibnitz Beta Plateau', [(-85.32705, 27.28799), (-85.06330, 32.73523), (-85.49737, 36.36658), (-85.78834, 30.57923)]),
}

# ------------------------------------------------------------------ projection
def rho(lat_deg):
    return 2 * R * np.tan(np.radians(90 + np.asarray(lat_deg, float)) / 2)

def to_xy(lat_deg, lon_deg):
    """lat/lon (planetocentric, east +) -> polar stereographic metres. Verified against crater floors."""
    r = rho(lat_deg); l = np.radians(lon_deg)
    return r * np.sin(l), r * np.cos(l)

def to_latlon(x, y):
    r = np.hypot(x, y)
    lat = -90 + np.degrees(2 * np.arctan(r / (2 * R)))
    lon = np.degrees(np.arctan2(x, y)) % 360
    return lat, lon

def scale_k(lat_deg):
    """Map distance / ground distance."""
    th = np.radians(90 + np.asarray(lat_deg, float))
    return 2 / (1 + np.cos(th))

# ------------------------------------------------------------------ DEM sampling
class Dem:
    def __init__(self, path):
        import rasterio
        with rasterio.open(path) as ds:
            self.z = ds.read(1).astype(np.float32)
            self.left, self.top = ds.bounds.left, ds.bounds.top
        self.n = self.z.shape[0]

    def rc(self, x, y):
        return (self.top - y) / PIXEL - 0.5, (x - self.left) / PIXEL - 0.5

    def sample(self, x, y):
        from scipy.ndimage import map_coordinates
        r, c = self.rc(np.asarray(x), np.asarray(y))
        return map_coordinates(self.z, [r.ravel(), c.ravel()], order=1, mode='constant', cval=np.nan).reshape(np.shape(x))

    def slope_p90(self, x, y, radius_m=300.0):
        """90th percentile of local slope (deg) inside radius, central differences over +-1 px."""
        r0, c0 = self.rc(x, y)
        r0, c0 = int(round(float(r0))), int(round(float(c0)))
        k = int(radius_m / PIXEL) + 1
        sub = self.z[r0 - k - 1:r0 + k + 2, c0 - k - 1:c0 + k + 2]
        if sub.shape != (2 * k + 3, 2 * k + 3) or np.isnan(sub).any():
            return None
        gy = (sub[:-2, 1:-1] - sub[2:, 1:-1]) / (2 * PIXEL)   # north positive (row index grows southwards on the map)
        gx = (sub[1:-1, 2:] - sub[1:-1, :-2]) / (2 * PIXEL)
        lat, _ = to_latlon(x, y)
        kk = float(scale_k(lat))                              # ground distance is shorter than map distance
        slope = np.degrees(np.arctan(np.hypot(gx, gy) * kk))
        ii, jj = np.mgrid[-k:k + 1, -k:k + 1]
        mask = np.hypot(ii, jj) * PIXEL <= radius_m
        return float(np.percentile(slope[mask], 90))

# ------------------------------------------------------------------ horizon
def ray_steps_m():
    a = np.arange(100, 10_000, 100.0)
    b = np.arange(10_000, 40_000, 250.0)
    c = np.arange(40_000, MAX_RANGE_KM * 1000 + 1, 500.0)
    return np.concatenate([a, b, c])

STEPS = ray_steps_m()

def horizon_profile(dem, lat, lon, h0):
    """Terrain elevation angle (deg) for N_AZ azimuths (0=N, clockwise), plus a flag if a ray left the DEM."""
    az = np.radians(np.arange(N_AZ) * (360 / N_AZ))[:, None]
    d = (STEPS / R)[None, :]
    p1, l1 = math.radians(lat), math.radians(lon)
    p2 = np.arcsin(math.sin(p1) * np.cos(d) + math.cos(p1) * np.sin(d) * np.cos(az))
    l2 = l1 + np.arctan2(np.sin(az) * np.sin(d) * math.cos(p1), np.cos(d) - math.sin(p1) * np.sin(p2))
    x, y = to_xy(np.degrees(p2), np.degrees(l2))
    z = dem.sample(x, y)                                   # (N_AZ, steps)
    rt = R + z
    ro = R + h0
    vert = rt * np.cos(d) - ro
    horiz = rt * np.sin(d)
    el = np.degrees(np.arctan2(vert, horiz))
    el[np.isnan(z)] = np.nan
    hz = np.full(N_AZ, np.nan)
    for i in range(N_AZ):
        row = el[i]
        if not np.all(np.isnan(row)):
            hz[i] = np.nanmax(row)
    edge = bool(np.isnan(z).any())
    return hz, edge

# ------------------------------------------------------------------ sun / earth geometry
def julian_days_tdb(times_utc):
    from astropy.time import Time
    t = Time(times_utc, scale='utc')
    return t, (t.tdb.jd - 2451545.0)

def iau2009_moon(d):
    """alpha0, delta0, W in degrees. d = days from J2000 (TDB), T = Julian centuries."""
    T = d / 36525.0
    E = {1: (125.045, -0.0529921), 2: (250.089, -0.1059842), 3: (260.008, 13.0120009), 4: (176.625, 13.3407154),
         5: (357.529, 0.9856003), 6: (311.589, 26.4057084), 7: (134.963, 13.0649930), 8: (276.617, 0.3287146),
         9: (34.226, 1.7484877), 10: (15.134, -0.1589763), 11: (119.743, 0.0036096), 12: (239.961, 0.1643573),
         13: (25.053, 12.9590088)}
    e = {k: np.radians(a + b * d) for k, (a, b) in E.items()}
    s = lambda k: np.sin(e[k]); c = lambda k: np.cos(e[k])
    a0 = (269.9949 + 0.0031 * T - 3.8787 * s(1) - 0.1204 * s(2) + 0.0700 * s(3) - 0.0172 * s(4)
          + 0.0072 * s(6) - 0.0052 * s(10) + 0.0043 * s(13))
    d0 = (66.5392 + 0.0130 * T + 1.5419 * c(1) + 0.0239 * c(2) - 0.0278 * c(3) + 0.0068 * c(4)
          - 0.0029 * c(6) + 0.0009 * c(7) + 0.0008 * c(10) - 0.0009 * c(13))
    W = (38.3213 + 13.17635815 * d - 1.4e-12 * d * d + 3.5610 * s(1) + 0.1208 * s(2) - 0.0642 * s(3)
         + 0.0158 * s(4) + 0.0252 * s(5) - 0.0066 * s(6) - 0.0047 * s(7) - 0.0046 * s(8) + 0.0028 * s(9)
         + 0.0052 * s(10) + 0.0040 * s(11) + 0.0019 * s(12) - 0.0044 * s(13))
    return a0, d0, W % 360

def body_fixed_vectors(times_utc):
    """Moon->Sun and Moon->Earth vectors (km) in the Moon body-fixed frame, shape (T,3) each."""
    from astropy.coordinates import get_body_barycentric, solar_system_ephemeris
    t, d = julian_days_tdb(times_utc)
    with solar_system_ephemeris.set('builtin'):
        sun = get_body_barycentric('sun', t); earth = get_body_barycentric('earth', t); moon = get_body_barycentric('moon', t)
    to_km = lambda c: np.stack([c.x.to('km').value, c.y.to('km').value, c.z.to('km').value], axis=-1)
    v_sun = to_km(sun) - to_km(moon)
    v_earth = to_km(earth) - to_km(moon)
    a0, d0, W = iau2009_moon(d)
    ra, dec, w = np.radians(a0), np.radians(d0), np.radians(W)
    def R3(a):
        c, s = np.cos(a), np.sin(a); o, z = np.ones_like(a), np.zeros_like(a)
        return np.stack([np.stack([c, s, z], -1), np.stack([-s, c, z], -1), np.stack([z, z, o], -1)], -2)
    def R1(a):
        c, s = np.cos(a), np.sin(a); o, z = np.ones_like(a), np.zeros_like(a)
        return np.stack([np.stack([o, z, z], -1), np.stack([z, c, s], -1), np.stack([z, -s, c], -1)], -2)
    M = R3(w) @ R1(np.pi / 2 - dec) @ R3(np.pi / 2 + ra)      # ICRF -> body fixed
    f = lambda v: np.einsum('tij,tj->ti', M, v)
    return f(v_sun), f(v_earth)

def az_el(vec_km, lat, lon, h_m=0.0):
    """Azimuth (0=N, clockwise) and elevation (deg) of a body-fixed vector seen from the surface point."""
    la, lo = np.radians(lat), np.radians(lon)
    up = np.array([math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)])
    east = np.array([-math.sin(lo), math.cos(lo), 0.0])
    north = np.array([-math.sin(la) * math.cos(lo), -math.sin(la) * math.sin(lo), math.cos(la)])
    d = vec_km - (R + h_m) / 1000.0 * up
    dn = np.linalg.norm(d, axis=1)
    el = np.degrees(np.arcsin(np.clip(d @ up / dn, -1, 1)))
    az = np.degrees(np.arctan2(d @ east, d @ north)) % 360
    return az, el

def horizon_at(hz, az):
    step = 360 / len(hz)
    a = np.mod(az, 360)
    i = (np.floor(a / step).astype(int)) % len(hz)
    f = (a - i * step) / step
    h = np.asarray(hz)
    return h[i] * (1 - f) + h[(i + 1) % len(hz)] * f

# ------------------------------------------------------------------ maps
PALETTE = {'ink': (0x24, 0x20, 0x1A), 'plum': (0x3F, 0x25, 0x48), 'indigo': (0x35, 0x36, 0x9C), 'lav': (0x7C, 0x67, 0x9E), 'cream': (0xC8, 0xC7, 0x93)}

def hillshade(z, spacing, azimuth=315.0, altitude=32.0, exag=2.2):
    zz = np.nan_to_num(z, nan=float(np.nanmean(z))) * exag
    gy, gx = np.gradient(zz, spacing)
    slope = np.arctan(np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    az, alt = math.radians(360 - azimuth + 90), math.radians(altitude)
    shade = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    return np.clip(shade, 0, 1)

def colorize(shade, psr_mask=None):
    stops = [(0.0, PALETTE['ink']), (0.38, PALETTE['plum']), (0.68, PALETTE['lav']), (1.0, PALETTE['cream'])]
    s = np.clip((shade - 0.15) / 0.75, 0, 1)
    out = np.zeros(shade.shape + (3,), float)
    for (a, ca), (b, cb) in zip(stops[:-1], stops[1:]):
        m = (s >= a) & (s <= b)
        t = ((s - a) / (b - a))[m][:, None]
        out[m] = np.array(ca) * (1 - t) + np.array(cb) * t
    if psr_mask is not None:
        ind = np.array(PALETTE['indigo']); ink = np.array(PALETTE['ink'])
        tint = ind * 0.62 + ink * 0.38
        out[psr_mask] = out[psr_mask] * 0.30 + tint * 0.70
    return out.astype(np.uint8)

def rasterize_psr(polys, x0, y0, size_px, pix_m):
    """Boolean mask of PSR for a window with top-left corner (x0,y0) metres."""
    from PIL import Image, ImageDraw
    img = Image.new('L', (size_px, size_px), 0)
    dr = ImageDraw.Draw(img)
    box_w = size_px * pix_m
    from shapely.geometry import box
    window = box(x0, y0 - box_w, x0 + box_w, y0)
    for g in polys:
        if not g.intersects(window):
            continue
        for part in (g.geoms if hasattr(g, 'geoms') else [g]):
            pts = [((x - x0) / pix_m, (y0 - y) / pix_m) for x, y in part.exterior.coords]
            dr.polygon(pts, fill=255)
            for hole in part.interiors:
                dr.polygon([((x - x0) / pix_m, (y0 - y) / pix_m) for x, y in hole.coords], fill=0)
    return np.array(img) > 0

# ------------------------------------------------------------------ compact hourly arrays
def pack_i16(v):
    import base64
    return base64.b64encode(np.round(np.asarray(v) * 100).astype('<i2').tobytes()).decode('ascii')

def pack_u16(v):
    import base64
    return base64.b64encode(np.round((np.asarray(v) % 360) * 100).astype('<u2').tobytes()).decode('ascii')

# ------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dem', required=True)
    ap.add_argument('--psr', required=True, help='path to the LPSR shapefile without extension')
    ap.add_argument('--start', default='2027-07-15', help='window start (UTC). Chosen so the window contains the south-pole summer (Sun over the southern hemisphere)')
    ap.add_argument('--hours', type=int, default=4320)
    ap.add_argument('--per-region', type=int, default=12)
    ap.add_argument('--grid-km', type=float, default=3.0)
    ap.add_argument('--out', default='src/data/real-sites.json')
    ap.add_argument('--map-dir', default='src/assets/map')
    a = ap.parse_args()
    t0 = time.time()
    log = lambda *m: print(f'[{time.time() - t0:6.1f}s]', *m, flush=True)

    import shapefile
    from shapely.geometry import Polygon, Point, shape
    from shapely.strtree import STRtree
    from PIL import Image

    log('loading DEM'); dem = Dem(a.dem)
    log('loading PSR'); sf = shapefile.Reader(a.psr)
    psr_all = [shape(s) for s in sf.shapes()]
    areas = [float(r[1]) for r in sf.records()]
    psr_big = [g for g, ar in zip(psr_all, areas) if ar >= PSR_MIN_AREA_KM2]
    tree_big, tree_all = STRtree(psr_big), STRtree(psr_all)
    log(f'PSR polygons: {len(psr_all)} total, {len(psr_big)} with area >= {PSR_MIN_AREA_KM2} km2')

    start = datetime.strptime(a.start, '%Y-%m-%d').replace(tzinfo=timezone.utc)
    times = [start.replace(tzinfo=None) + __import__('datetime').timedelta(hours=i) for i in range(a.hours)]
    log('Sun/Earth vectors (astropy builtin + IAU 2009 rotation)')
    v_sun, v_earth = body_fixed_vectors(np.array(times, dtype='datetime64[s]'))
    # sanity: libration of the Earth in the Moon frame
    elat = np.degrees(np.arcsin(v_earth[:, 2] / np.linalg.norm(v_earth, axis=1)))
    elon = np.degrees(np.arctan2(v_earth[:, 1], v_earth[:, 0]))
    log(f'Earth sub-point: lon {elon.min():.2f}..{elon.max():.2f}, lat {elat.min():.2f}..{elat.max():.2f} (expected within +-8 / +-7)')
    assert abs(elon).max() < 9 and abs(elat).max() < 8, 'rotation model looks wrong'

    # ---------------- candidate generation
    rng_cache = {}
    all_sites, region_meta = [], []
    for rid, (rname, ll) in REGIONS.items():
        xy = [to_xy(la, lo) for la, lo in ll]
        poly = Polygon([(float(x), float(y)) for x, y in xy])
        inner = poly.buffer(-600)
        minx, miny, maxx, maxy = inner.bounds
        step = a.grid_km * 1000
        cand = []
        for gx in np.arange(minx, maxx, step):
            for gy in np.arange(miny, maxy, step):
                p = Point(gx, gy)
                if not inner.contains(p):
                    continue
                if tree_all.query(p, predicate='within').size:
                    continue                                   # inside a PSR: not a landing candidate
                lat, lon = to_latlon(gx, gy)
                sl = dem.slope_p90(gx, gy)
                if sl is None or sl > 15:
                    continue
                cand.append((float(gx), float(gy), float(lat), float(lon), sl))
        log(f'{rname}: {len(cand)} candidate grid points')
        # horizons + sun fraction for all candidates
        scored = []
        for gx, gy, lat, lon, sl in cand:
            h0 = float(dem.sample(np.array([gx]), np.array([gy]))[0])
            hz, edge = horizon_profile(dem, lat, lon, h0)
            if np.isnan(hz).all():
                continue
            hz = np.where(np.isnan(hz), np.nanmin(hz), hz)
            saz, sel = az_el(v_sun, lat, lon, h0)
            frac = float(np.mean(sel + SUN_RADIUS_DEG > horizon_at(hz, saz)))
            scored.append(dict(x=gx, y=gy, lat=lat, lon=lon, slope=sl, h0=h0, hz=hz, edge=edge, sunfrac=frac))
        # pick: 4 best-lit (>= 3 km apart) then spread the rest
        chosen = []
        def far_enough(c, mind):
            return all(math.hypot(c['x'] - o['x'], c['y'] - o['y']) >= mind for o in chosen)
        for c in sorted(scored, key=lambda c: -c['sunfrac']):
            if len(chosen) >= 4: break
            if far_enough(c, 3000): chosen.append(c)
        while len(chosen) < min(a.per_region, len(scored)):
            best, bd = None, -1
            for c in scored:
                if c in chosen: continue
                dmin = min(math.hypot(c['x'] - o['x'], c['y'] - o['y']) for o in chosen) if chosen else 1e9
                if dmin > bd: best, bd = c, dmin
            if best is None: break
            chosen.append(best)
        log(f'{rname}: kept {len(chosen)} sites (sun fraction {min(c["sunfrac"] for c in chosen):.0%}..{max(c["sunfrac"] for c in chosen):.0%} in the window)')
        cen = np.mean(np.array(xy), axis=0)
        clat, clon = to_latlon(cen[0], cen[1])
        region_meta.append(dict(id=rid, name=rname, polygon_km=[[round(float(x) / 1000, 3), round(float(y) / 1000, 3)] for x, y in xy],
                                centroid=dict(lat_deg=round(float(clat), 4), lon_deg=round(float(clon), 4), x_km=round(float(cen[0]) / 1000, 3), y_km=round(float(cen[1]) / 1000, 3)),
                                n_sites=len(chosen)))
        for i, c in enumerate(sorted(chosen, key=lambda c: -c['sunfrac']), 1):
            p = Point(c['x'], c['y'])
            dbig = float(psr_big[tree_big.nearest(p)].distance(p)) / 1000 / float(scale_k(c['lat']))
            dany = float(psr_all[tree_all.nearest(p)].distance(p)) / 1000 / float(scale_k(c['lat']))
            saz, sel = az_el(v_sun, c['lat'], c['lon'], c['h0'])
            eaz, eel = az_el(v_earth, c['lat'], c['lon'], c['h0'])
            all_sites.append(dict(
                id=f'{rid}_{i:02d}', name=f'{rname} · {i}', region=rid, kind='candidate',
                note=f'Elevation {c["h0"]:.0f} m.' + (' Terrain beyond the DEM edge is not seen from here.' if c['edge'] else ''),
                lat_deg=round(c['lat'], 5), lon_deg=round(c['lon'], 5), x_km=round(c['x'] / 1000, 3), y_km=round(c['y'] / 1000, 3),
                elevation_m=round(c['h0']),
                static=dict(slope_deg=round(c['slope'], 2), psr_distance_km=round(dbig, 2), psr_distance_any_km=round(dany, 2)),
                horizon_deg=[round(float(v), 3) for v in c['hz']],
                hourly=dict(enc='centideg-b64', sun_el_deg=pack_i16(sel), sun_az_deg=pack_u16(saz),
                            earth_el_deg=pack_i16(eel), earth_az_deg=pack_u16(eaz)),
                data_quality=dict(dem='LOLA LDEM 80 m/px', horizon_range_km=MAX_RANGE_KM, edge_limited=c['edge'],
                                  geometry='astropy builtin ephemeris + IAU 2009 rotation (approximate)')))

    # ---------------- maps
    os.makedirs(a.map_dir, exist_ok=True)
    log('rendering maps')
    ext = 304000.0
    for old in os.listdir(a.map_dir):
        if old.endswith('.webp'): os.remove(os.path.join(a.map_dir, old))
    # global map 1600 px = 380 m/px
    G = 1600; gp = 2 * ext / G
    z_small = np.array(Image.fromarray(dem.z).resize((G, G), Image.BILINEAR))
    mask = rasterize_psr(psr_big, -ext, ext, G, gp)
    img = colorize(hillshade(z_small, gp), mask)
    Image.fromarray(img).save(os.path.join(a.map_dir, 'pole.webp'), quality=72, method=6)
    # region crops: 80 km box at 100 m/px (800 px)
    CROP_KM, CROP_PX = 80.0, 800
    for rm in region_meta:
        cx, cy = rm['centroid']['x_km'] * 1000, rm['centroid']['y_km'] * 1000
        half = CROP_KM * 1000 / 2
        xs = cx - half + (np.arange(CROP_PX) + 0.5) * (CROP_KM * 1000 / CROP_PX)
        ys = cy + half - (np.arange(CROP_PX) + 0.5) * (CROP_KM * 1000 / CROP_PX)
        X, Y = np.meshgrid(xs, ys)
        z = dem.sample(X, Y)
        mask = rasterize_psr(psr_big, cx - half, cy + half, CROP_PX, CROP_KM * 1000 / CROP_PX)
        img = colorize(hillshade(z, CROP_KM * 1000 / CROP_PX), mask)
        Image.fromarray(img).save(os.path.join(a.map_dir, f'{rm["id"]}.webp'), quality=76, method=6)
        rm['crop'] = dict(file=f'{rm["id"]}.webp', center_km=[round(cx / 1000, 3), round(cy / 1000, 3)], size_km=CROP_KM)

    out = dict(
        schema='suhail.sites/v0', is_sample=False,
        provenance=dict(
            terrain='NASA LOLA LDEM_80S_80MPP_ADJ (PGDA product 90, Barker et al. 2023): horizon, slope, elevation',
            psr=f'NASA LOLA LPSR_80S_20MPP_ADJ_1km2 (PGDA product 90), polygons >= {PSR_MIN_AREA_KM2:g} km2 used for distance',
            regions='Artemis candidate landing regions, vertices read from NASA Quickmap layer "A3: Candidate Landing Regions 2022"',
            sun_earth='astropy built-in ephemeris + IAU 2009 lunar rotation model; approximate, not SPICE/Horizons',
            candidates=f'{a.per_region} points per region: 4 best-lit plus an even spread, slope <= 15 deg, outside PSRs',
            built_utc=datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%MZ')),
        window=dict(start_utc=start.strftime('%Y-%m-%dT%H:%M:%SZ'), step_hours=1, hours=a.hours),
        horizon=dict(bins=N_AZ, step_deg=360 // N_AZ),
        map=dict(kind='south_polar_stereographic', extent_km=ext / 1000, global_image='pole.webp', regions=region_meta),
        psr=[], sites=all_sites)
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    with open(a.out, 'w') as f:
        json.dump(out, f, separators=(',', ':'))
    log(f'wrote {a.out}  ({os.path.getsize(a.out) / 1e6:.2f} MB), {len(all_sites)} sites')

if __name__ == '__main__':
    main()
