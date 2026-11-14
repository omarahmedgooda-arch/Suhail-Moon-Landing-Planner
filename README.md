# SUHAIL

**A lunar landing site navigator. Chart the sky. Choose the landing.**

> **Live demo:** [suhail-moon-landing-planner.vercel.app](https://suhail-moon-landing-planner.vercel.app/)
>
> **Project video:** [Watch on YouTube](https://youtu.be/gso-zLadcoE)

SUHAIL is the **FASA Destination Team**’s entry for the **NASA Space Apps Challenge, Cairo 2026**,
challenge **Lunar Landing Site Navigator**. It helps mission planners, students and the public choose
*where* and *when* to land near the Moon’s south pole, using real NASA elevation data and hour-by-hour
Sun and Earth geometry.

The name comes from **Suhail (Canopus)**, the star Arab navigators steered by. We want SUHAIL to be a
compass for choosing where to land.

---

## The problem

Reaching the Moon is not enough. **Odysseus (IM-1, 2024)** and **Athena (IM-2, 2025)** both reached
the south-polar region and both ended up on their sides, which limited their power, communication and
science. Near the pole the Sun skims the horizon, mountains cast shadows for days, and hills can hide
Earth. A landing site has to be judged on several things at once, on a specific date, and most tools
that do this are built for specialists only.

## What SUHAIL does

SUHAIL has two modes, chosen on the home page.

### Student mode: Lunar Landing Academy

1. **Watch.** The stories of Odysseus and Athena: what each mission aimed for, what happened on
   touchdown and what we learn from it, with NASA flyover footage of the regions they targeted.
2. **Learn.** The five aspects of a landing site (terrain, sunlight, temperature, link to Earth,
   science), each with a quick check question.
3. **Play: *Save the Mission*.** A 2D game. The player commands a comic crew who keep suggesting
   terrible ideas (“Who needs the Sun? I brought a flashlight!”). Five decisions, five mission gauges,
   animated consequences (the lander tips over, the panels go dark, the signal drops), hints from the
   Wise Doctor and a final mission report.

### Expert mode: Mission planner

1. **Create a new mission** or **replan an old one**.
2. **Requirements.** Mission type (8 presets), duration, Earth launch date, transit time, Moon lift-off
   date, and Off / Low / Medium / High importance for five aspects:
   solar radiation, thermal environment & day cycle, Earth communication, terrain slope and scientific
   target proximity. Each level maps to an editable numeric limit; typing a number moves the level to
   match. A power-system panel sets array area, efficiency, orientation, battery, depth of discharge and
   the electrical loads.
3. **Map.** SUHAIL tests **74 candidate points** in NASA’s **seven Artemis III candidate regions** on
   **every possible start date** and shows the best five places.
4. **Council.** Five specialists, one per aspect, debate each place in an auto-playing meeting chat,
   reacting to each other with the real numbers. Each place has a NASA flyover clip, a natural shaded
   relief map, colour elevation and slope maps, and a **3D terrain view lit by the Sun’s computed
   position** at any mission hour.
5. **Full site analysis.** A site dossier (position, elevation, slope, distance to permanently
   shadowed regions, terrain horizon profile, constraints) and an hour-by-hour **solar energy and
   thermal simulation**: irradiance, array power, loads, battery state of charge, surface temperature,
   and a four-class rating (highly suitable · suitable with constraints · high energy risk · not feasible).
6. **Verdict.** The user picks the place they would choose; the flight director, Hakim, answers that
   choice, explains why the winner beat the runner-up, gives the best dates and the watch-outs, and
   compares all five places under identical mission conditions. The result can be downloaded as an
   HTML report or JSON data.

## How decisions are made

1. **Hard limits first.** A site that breaks a limit is *No-Go*. Missing data is *Unverified* and is
   never treated as a pass.
2. **Score per aspect** from 0 to 100 (50 means exactly at the limit). An aspect is Go, Marginal or
   No-Go based on its weakest metric.
3. **Overall score** is the weighted mean of the aspects (High 3 · Medium 2 · Low 1). Ties are broken by
   the weakest aspect.
4. **Best date.** Every start day in the window is tested, and SUHAIL reports how many days pass,
   so planners can see how much the schedule can slip.
5. **Every number in the dialogue comes from the data.** Character lines are templates filled from the
   evaluation, and the tests check that each number shown matches the computed value.

The default limits per level are **team assumptions**, not NASA standards, and are editable.

## Data and models

| What | Source |
|---|---|
| Terrain, slopes, horizon profiles, maps, 3D terrain | NASA LOLA south-pole elevation model, 80 m/px ([PGDA product 90](https://pgda.gsfc.nasa.gov/products/90), Barker et al. 2023) |
| Permanently shadowed regions | NASA LOLA LPSR (same PGDA product) |
| Candidate regions | [NASA Artemis III candidate landing regions (2022)](https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-Moon/), outlines from [LROC QuickMap](https://quickmap.lroc.asu.edu) |
| Region flyover clips | [NASA SVS – Artemis III Landing Region Candidates (5013)](https://svs.gsfc.nasa.gov/5013) |
| Sun and Earth positions, hourly | [Astropy](https://www.astropy.org) ephemeris + IAU 2009 lunar rotation model |
| Power and temperature | Hourly model in `src/engine/energy.js`: irradiance with terrain shadowing, array power P = Gₙ·A·η·cos θ·D, battery state of charge with charge/discharge efficiency, one-layer surface energy balance |

The data window is **15 Jul 2027 + 180 days** (south-pole summer).

## Limits

SUHAIL is a **decision-support tool, not a mission guarantee**.

- The elevation grid is 80 m per pixel: it cannot see boulders or small craters, so slope screening
  is regional, not touchdown safety.
- Sun and Earth positions come from an astronomy model that is close to, but not exactly, NASA
  SPICE / JPL Horizons. Validation against Horizons is the next step.
- Earth visibility is geometric. It is not a radio link budget.
- The temperature model is a simplified one-layer energy balance for level ground; it is indicative.
- Distance to a permanently shadowed region is only a proxy for access to possible water ice.
- Rankings depend on the stated assumptions. They are not a probability of success.

## Run it locally

Requires [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # 38 tests: engine, dialogue, real data, power model, replan, report
npm run build          # production build in dist/
npm run build:single   # one self-contained file in dist-single/index.html (works offline)
```

Deployment: the repository includes `vercel.json` (Vite, output `dist/`). Importing the repo in
Vercel deploys it with no extra settings.

Regenerating the data needs Python 3 with `numpy`, `scipy`, `rasterio`, `pyshp`, `shapely`, `astropy`
and `Pillow`, plus the LOLA files listed above:

```bash
python3 tools/pipeline/build_real_data.py --dem LDEM_80S_80MPP_ADJ.TIF --psr LPSR_80S_20MPP_ADJ_1km2
python3 tools/pipeline/build_maps.py      --dem LDEM_80S_80MPP_ADJ.TIF --psr LPSR_80S_20MPP_ADJ_1km2
```

## Project structure

```
src/
  App.jsx                 navigation, modes, run state
  app/                    screens: Home, Academy, Game, Forms, Council, Verdict, Science panels
  components/             avatars, speech bubbles, maps, region media, 3D terrain
  content/                characters, casts, missions, academy and game text, sources
  engine/                 rules, planner, power & thermal model, dialogue, report builders
  data/                   real-sites.json (74 sites, hourly geometry), terrain3d.json
  assets/                 maps, character art, flyover clips, fonts
tests/                    node --test suites
tools/pipeline/           Python data pipeline (LOLA → sites, maps, heightmaps)
docs/                     product flow and developer notes
```

More detail for contributors is in [`docs/DEVELOPER.md`](docs/DEVELOPER.md) and [`CLAUDE.md`](CLAUDE.md).

## Team

**FASA Destination Team** · Elsewedy University of Technology (SUT) · NASA Space Apps Challenge Cairo 2026

## Credits

- Elevation, shadowed-region and region data: NASA LOLA / PGDA, NASA Artemis, LROC QuickMap.
- Flyover clips: NASA’s Scientific Visualization Studio.
- Mission stories: NPR (Odysseus), Spaceflight Now (Athena), NASA, Space.com and others, linked in the app.
- Character art was made by the team. The Expert-mode specialists are original characters inspired by
  the fields of real Arab scientists and astronauts (credited on their cards); their dialogue is invented
  and is never presented as the words of those people.
- Odysseus and Athena are Intuitive Machines missions.

## License

[MIT](LICENSE)
