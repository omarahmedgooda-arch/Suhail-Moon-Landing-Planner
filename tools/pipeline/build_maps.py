"""Scientific map layers + 3D heightmaps for each Artemis region (from NASA LOLA LDEM 80 m/px).

  python3 tools/pipeline/build_maps.py --dem LDEM_80S_80MPP_ADJ.TIF --psr LPSR_80S_20MPP_ADJ_1km2
Writes src/assets/maps2/<region>-{elev,slope}.webp and src/data/terrain3d.json
(80 km box per region, same frame as the pipeline's crops: up = toward 0° longitude).
"""
import argparse, json, os, sys, base64
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
import build_real_data as P

ap = argparse.ArgumentParser()
ap.add_argument('--dem', required=True); ap.add_argument('--psr', required=True)
ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', '..'))
a = ap.parse_args()
root = os.path.abspath(a.out)
real = json.load(open(os.path.join(root, 'src/data/real-sites.json')))
dem = P.Dem(a.dem)
import shapefile
sf = shapefile.Reader(a.psr)
polys = []
for shp in sf.shapes():
    pts = np.array(shp.points); parts = list(shp.parts) + [len(pts)]
    for i in range(len(parts) - 1):
        ring = pts[parts[i]:parts[i + 1]]
        if len(ring) > 2:
            x, y = ring[:, 0], ring[:, 1]
            area = 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1))) / 1e6
            if area >= 1.0: polys.append(ring)

# QuickMap-like elevation ramp (LOLA colour-shaded relief convention: violet/blue low → green → yellow → red/white high)
RAMP = [(0.00, (60, 20, 110)), (0.15, (35, 60, 190)), (0.32, (30, 150, 210)), (0.48, (40, 175, 90)), (0.62, (215, 210, 60)), (0.78, (225, 120, 40)), (0.90, (190, 40, 40)), (1.00, (250, 235, 235))]
SLOPE = [(0, (32, 120, 60)), (5, (130, 190, 70)), (10, (235, 210, 60)), (15, (235, 130, 40)), (20, (200, 40, 40)), (30, (120, 20, 60))]

def ramp(t, stops):
    out = np.zeros(t.shape + (3,), float)
    for (a0, c0), (a1, c1) in zip(stops[:-1], stops[1:]):
        m = (t >= a0) & (t <= a1)
        f = ((t - a0) / (a1 - a0))[m][:, None]
        out[m] = np.array(c0) * (1 - f) + np.array(c1) * f
    return out

def psr_outline(img, x0, y0, px_m, size):
    d = ImageDraw.Draw(img)
    for ring in polys:
        c = (ring[:, 0] - x0) / px_m; r = (y0 - ring[:, 1]) / px_m
        if c.max() < 0 or c.min() > size or r.max() < 0 or r.min() > size: continue
        d.line(list(zip(c, r)) + [(c[0], r[0])], fill=(150, 230, 255), width=2)

outdir = os.path.join(root, 'src/assets/maps2'); os.makedirs(outdir, exist_ok=True)
CROP_KM, PX, N3 = 80.0, 800, 200
terrain = {'size_km': CROP_KM, 'grid': N3, 'regions': {}}
for rg in real['map']['regions']:
    cx, cy = rg['crop']['center_km'][0] * 1000, rg['crop']['center_km'][1] * 1000
    half = CROP_KM * 500
    pm = CROP_KM * 1000 / PX
    xs = cx - half + (np.arange(PX) + 0.5) * pm; ys = cy + half - (np.arange(PX) + 0.5) * pm
    X, Y = np.meshgrid(xs, ys); z = dem.sample(X, Y)
    z = np.where(np.isnan(z), np.nanmean(z), z)
    shade = P.hillshade(z, pm, exag=1.6)
    lo, hi = np.percentile(z, 1), np.percentile(z, 99)
    col = ramp(np.clip((z - lo) / (hi - lo), 0, 1), RAMP)
    col = col * (0.45 + 0.75 * shade[..., None])
    img = Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)); psr_outline(img, cx - half, cy + half, pm, PX)
    img.save(os.path.join(outdir, f"{rg['id']}-elev.webp"), quality=80, method=6)
    lat, _ = P.to_latlon(X, Y); k = P.scale_k(lat)
    gy, gx = np.gradient(z, pm); sl = np.degrees(np.arctan(np.hypot(gx, gy) * k))
    scol = ramp(np.clip(sl, 0, 30), SLOPE) * (0.65 + 0.45 * shade[..., None])
    img = Image.fromarray(np.clip(scol, 0, 255).astype(np.uint8)); psr_outline(img, cx - half, cy + half, pm, PX)
    img.save(os.path.join(outdir, f"{rg['id']}-slope.webp"), quality=80, method=6)
    # heightmap for 3D
    xs3 = cx - half + (np.arange(N3) + 0.5) * (CROP_KM * 1000 / N3); ys3 = cy + half - (np.arange(N3) + 0.5) * (CROP_KM * 1000 / N3)
    X3, Y3 = np.meshgrid(xs3, ys3); z3 = dem.sample(X3, Y3); z3 = np.where(np.isnan(z3), np.nanmean(z3), z3)
    zmin, zmax = float(z3.min()), float(z3.max())
    q = np.round((z3 - zmin) / max(1, zmax - zmin) * 65535).astype('<u2')
    terrain['regions'][rg['id']] = {'zmin': round(zmin, 1), 'zmax': round(zmax, 1), 'elev_lo': round(float(lo)), 'elev_hi': round(float(hi)), 'h': base64.b64encode(q.tobytes()).decode()}
    print(rg['id'], round(zmin), round(zmax))
json.dump(terrain, open(os.path.join(root, 'src/data/terrain3d.json'), 'w'))
# legends
leg = Image.new('RGB', (256, 14)); t = np.linspace(0, 1, 256)[None, :].repeat(14, 0)
Image.fromarray(ramp(t, RAMP).astype(np.uint8)).save(os.path.join(outdir, 'legend-elev.webp'))
t = np.linspace(0, 30, 256)[None, :].repeat(14, 0)
Image.fromarray(ramp(t, SLOPE).astype(np.uint8)).save(os.path.join(outdir, 'legend-slope.webp'))

# ---------------------------------------------------------------- natural (moon-grey) relief: pole + region crops
def natural(z, spacing, mask=None):
    sh = P.hillshade(z, spacing, azimuth=315.0, altitude=28.0, exag=1.8)
    g = 0.10 + 0.82 * sh ** 0.9
    rgb = np.dstack([g * 236, g * 232, g * 224])   # regolith grey, a touch warm
    if mask is not None: rgb[mask] *= 0.55
    return np.clip(rgb, 0, 255).astype(np.uint8)
mapdir = os.path.join(root, 'src/assets/map')
ext = real['map']['extent_km'] * 1000
G = 1600; gp = 2 * ext / G
xs = -ext + (np.arange(G) + 0.5) * gp; ys = ext - (np.arange(G) + 0.5) * gp
X, Y = np.meshgrid(xs, ys); zg = dem.sample(X, Y); zg = np.where(np.isnan(zg), np.nanmean(zg), zg)
img = Image.fromarray(natural(zg, gp)); img.save(os.path.join(mapdir, 'pole.webp'), quality=74, method=6)
for rg in real['map']['regions']:
    cx, cy = rg['crop']['center_km'][0] * 1000, rg['crop']['center_km'][1] * 1000
    half = CROP_KM * 500; pm = CROP_KM * 1000 / PX
    xs = cx - half + (np.arange(PX) + 0.5) * pm; ys = cy + half - (np.arange(PX) + 0.5) * pm
    X, Y = np.meshgrid(xs, ys); z = dem.sample(X, Y); z = np.where(np.isnan(z), np.nanmean(z), z)
    Image.fromarray(natural(z, pm)).save(os.path.join(mapdir, f"{rg['id']}.webp"), quality=78, method=6)
print('natural maps done')
