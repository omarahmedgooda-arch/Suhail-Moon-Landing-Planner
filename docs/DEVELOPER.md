# SUHAIL (سهيل) · Lunar Landing Site Navigator

**FASA Destination Team** · NASA Space Apps Cairo 2026 · challenge *Lunar Landing Site Navigator*.

SUHAIL looks at **real NASA LOLA terrain data** around the Moon's south pole, finds the five best
places for a mission, lets five characters argue about each one, and then a wise leader says where
and **when** to land. It ends with one report file.

This repository is the web app with two modes that share one flow and one look:

* **Student** – presets and plain words (pick a mission type and a length).
* **Expert** – every limit, weight, date range and battery number is editable.

## The flow (source of truth: `docs/product-flow.md`)

1. **Home** – *Start a new mission* or *Replan an old mission*.
2. **Assessment form** – mission type, length and requirements for the five aspects
   (Sunlight, Night & cold, Radio link, Ground, Science). *Replan* also asks for the old plan,
   the reasons, and the new terms.
3. **Map** – the Moon's south pole with the five best places pinned. The guide (Suhail) opens the tour.
4. **Council** – place by place, the five characters react (happy, grumpy, nervous) and talk to each other.
5. **Verdict** – the leader (Hakim) compares the five, names the best place, shows the numbers for the
   five aspects and the best dates, sky view and timeline, and (for a replan) how the old plan holds up.
6. **Report** – one standalone HTML file (print to PDF) and one JSON file with all the data.

A short **story** page (why landing sites are hard) is linked from the home page.

## Run it

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # 31 tests (Node's built-in runner)
npm run build          # dist/ → any static host
npm run build:single   # dist-single/index.html → ONE file, opens by double-click
```

Node 20+ (tested on 22).

## The real data

`src/data/real-sites.json` (3.4 MB, `schema: "suhail.sites/v0"`, `is_sample: false`) and the map
images in `src/assets/map/` are produced by `tools/pipeline/build_real_data.py`:

```bash
pip install rasterio numpy scipy shapely pyproj pyshp astropy pillow
python3 tools/pipeline/build_real_data.py \
  --dem  LDEM_80S_80MPP_ADJ.tiff \
  --psr  LPSR_80S_20MPP_ADJ_1km2          # the shapefile base name (no extension)
# options: --start 2027-07-15 --hours 4320 --per-region 12 --grid-km 3
```

| Input | What it is |
|---|---|
| `LDEM_80S_80MPP_ADJ.tiff` | LOLA elevation, 80 m/pixel, 80°S–90°S, south-polar stereographic on a 1737.4 km sphere |
| `LPSR_80S_20MPP_ADJ_1km2.*` | LOLA permanently shadowed regions (1531 polygons; those ≥ 10 km² are used) |
| Quickmap region polygons | Seven Artemis candidate regions (typed into the script, `REGIONS`) |

What it computes per candidate site:

* **Terrain horizon** – ray-march 72 azimuths (5° step) out to 150 km on the DEM, sphere curvature included.
* **Slope** – 90th percentile inside 300 m at a 160 m baseline.
* **Distance to the nearest PSR** of at least 10 km².
* **Sun and Earth azimuth/elevation, hourly** – astropy built-in ephemeris plus IAU 2009 lunar rotation
  (observer on the surface). Sanity checks: the Sun's selenographic longitude moves 12.19°/day, the
  sub-solar latitude swings ±1.54°, Earth libration is ±7.5° lon / ±6.8° lat.
* **Candidates** – a 3 km grid inside each region (600 m inside the edge), outside PSRs, slope ≤ 15°;
  per region the 4 best-lit sites (≥ 3 km apart) plus spread-out fill up to 12 → 74 sites.

**Why the window is 15 Jul 2027 + 180 days:** near the south pole the Sun's season follows the
sub-solar latitude (period ≈ 347 days). Winter 2027 (Mar–Apr) leaves most sites dark; the summer peak
is about 27 Oct 2027, so the window is centred on it.

The hourly series are stored as base64 little-endian 16-bit integers in hundredths of a degree
(`"enc": "centideg-b64"`); `src/engine/decode.js` decodes them. The old plain-array shape still loads.

`src/data/sample-sites.json` (six fictional sites) is **only for the unit tests** now.

### Validate against NASA Horizons (recommended)

`handoff/fetch_horizons.py` (kept next to this repo's hand-off notes) downloads Sun/Earth az/el from
JPL Horizons for every site so the astronomy model can be compared with NASA's own numbers. Use the
**same window**: `--start 2027-07-15`, and regenerate `sites.csv` from `real-sites.json`.

## How it decides (`src/engine/rules.js`, pure JS, no React)

1. Levels (Off/Low/Medium/High) become numeric limits (`LIMITS`, **team assumptions**). Expert mode can
   override each number (`mission.limits`).
2. Hourly arrays give metrics per site and window. The Sun counts as up when its **top edge** clears the
   terrain horizon (0.27°).
3. Hard limits: pass / fail / **unknown (never a pass)**.
4. Metric score = `clamp(50 + 50·(m − L)/(E − L), 0, 100)`; 50 is exactly at the limit.
5. Aspect status: **No-Go** > **Unverified** > **Marginal** (lowest score < 70) > **Go**.
6. Overall = weighted mean (High 3 · Medium 2 · Low 1 · Off 0). Eligible = no No-Go/Unverified.
   Rank: eligible first, then overall, then the weakest aspect (maximin).
7. `plan.js` tries every start day, keeps the best site per **region**, and takes the top five regions.
   When the winner is only RISKY and another top-five place is a clean GO, the leader says so.
8. `replanCompare` re-evaluates the old site and date under the new requirements and recommends
   `keep | shift | move-better | move`.

Character lines (`dialogue.js`, `banter.js`) are templates filled from the evaluation object and record
every number in `used`; tests prove the story never quotes a number the data does not contain.

## Honest notes (also shown in the app)

* **Real:** terrain, slopes and shadowed craters come from NASA LOLA; the regions are NASA's Artemis candidates.
* **Close, not exact:** Sun/Earth positions come from an astronomy model, not NASA SPICE/Horizons.
* **Not visible:** the DEM is 80 m/pixel, so boulders and small craters are invisible and slopes are smoother
  than lander-scale truth. A passing site still needs a close-up check.
* **Assumptions:** importance levels, default limits, the 10 km² PSR cut-off and "4 best-lit per region" are
  the team's choices, not NASA standards.
* The preview/Artifact sandbox blocks downloads; the report panel offers a preview and *Copy data* there.

## Design rules

* Palette is exactly `#24201A` ink · `#3F2548` plum · `#35369C` indigo · `#7C679E` lavender · `#C8C793` cream;
  everything else is a `color-mix` in `src/styles/tokens.css`.
* Status is never colour-only (shape icon + word + border style).
* `prefers-reduced-motion`, keyboard use, skip link, and screen-reader copies of typed text all work.
* CSS logical properties keep an Arabic/RTL version mostly translation work.
* Original SVG art only. Fonts (Fraunces, Figtree, IBM Plex Mono; OFL) are bundled.

## Folder map

```
src/
  App.jsx                 state machine: home | learn | new | replan | map | council | verdict
  app/                    Screens (Home, NewMission, ReplanMission, MapStage) · Forms · Council · Verdict · Numbers · TopBar
  components/             Act1/Act2 (story) · MapViews · SkyView · Avatar · Speech · Art …
  content/                story, characters (+ LEADER), missions, glossary
  engine/                 rules · plan · banter · dialogue · report · decode
  data/                   real-sites.json · sample-sites.json (tests only) · loadSites.js
  assets/map/             pole.webp + one hillshade crop per region
tools/pipeline/           build_real_data.py   tools/make-sample-data.mjs
docs/product-flow.md      the teammate's flow (English + Arabic original)
tests/                    node --test
```
