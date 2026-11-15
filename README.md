<div align="center">

# ✦ SUHAIL · سهيل

### Lunar Landing Site Navigator

**Chart the sky. Choose the landing.**

*FASA Destination Team · NASA Space Apps Challenge Cairo 2026*

[**Live demo**](https://suhail-moon-landing-planner.vercel.app/) ·
[**Project video**](https://youtu.be/gso-zLadcoE) ·
[**Run it locally**](#run-it-locally) ·
[**The team**](#the-team)

English · العربية — both languages built in

</div>

---

SUHAIL helps mission planners, students and the public decide **where** and **when** to land near the
Moon’s south pole. It tests NASA’s seven Artemis III candidate regions on every possible date, using
**real NASA LOLA elevation data** and **hour-by-hour Sun and Earth geometry**, and explains every
decision in plain language.

The name comes from **Suhail (Canopus)**, the star Arab navigators steered by. We want SUHAIL to be a
compass for choosing where to land.

## The problem

Reaching the Moon is not enough. **Odysseus (IM-1, 2024)** and **Athena (IM-2, 2025)** both reached the
south-polar region and both ended up on their sides, which cut their power, communication and science.
Near the pole the Sun skims the horizon, mountains cast shadows for days, and hills can hide the Earth.
A landing site has to be judged on several things at once, on a specific date, and most tools that do
this are built for specialists only.

## What SUHAIL does

The same app, two ways in.

### 🎓 Student mode — Lunar Landing Academy

| Step | What happens |
|---|---|
| **Watch** | Animated, step-by-step stories of Odysseus and Athena: the goal, what went wrong on touchdown, the lesson. The student guesses before each reveal. |
| **Learn** | The five things that decide a landing site, each with a quick check question. |
| **Play** | *Save the Mission*: command a comic crew full of terrible ideas (“Who needs the Sun? I brought a flashlight!”). Five decisions, five gauges, animated consequences and a final mission report. |

### 🛰️ Expert mode — Mission planner

| Step | What happens |
|---|---|
| **Requirements** | Mission type (8 presets), dates, duration and an importance level for each of the five aspects. Every level maps to an editable numeric limit. A power panel sets the solar array, battery and loads. |
| **Map** | **74 candidate points** in the **7 Artemis III regions**, tested on **every start date**; the best five are shown. |
| **Council** | Five specialists, one per aspect, debate each place with the real numbers, next to a NASA flyover clip, slope and elevation maps and a **3D terrain view lit by the computed Sun**. |
| **Analysis** | Site dossier and an hour-by-hour **power and thermal simulation**: irradiance, array output, battery charge, surface temperature and a four-class rating. |
| **Verdict** | The flight director gives the go / no-go, the best dates and the watch-outs, and compares all five places. Download the report as HTML or JSON. |

**The five aspects:** solar radiation · thermal environment & day cycle · Earth communication ·
terrain slope · scientific target proximity.

## How decisions are made

1. **Hard limits first.** A site that breaks a limit is *No-Go*. Missing data is *Unverified*, never a pass.
2. **Score per aspect** from 0 to 100 (50 = exactly at the limit); each aspect is Go, Marginal or No-Go by its weakest metric.
3. **Overall score** is the weighted mean of the aspects (High 3 · Medium 2 · Low 1); ties go to the stronger weakest aspect.
4. **Best date.** Every start day in the window is tested, so planners see how much the schedule can slip.
5. **No invented numbers.** Character lines are templates filled from the evaluation, and the tests check every number shown against the computed value.

The default limits are **team assumptions**, not NASA standards, and every one is editable.

## Data and models

| What | Source |
|---|---|
| Terrain, slopes, horizon profiles, maps, 3D terrain | NASA LOLA south-pole elevation model, 80 m/px ([PGDA product 90](https://pgda.gsfc.nasa.gov/products/90), Barker et al. 2023) |
| Permanently shadowed regions | NASA LOLA LPSR (same PGDA product) |
| Candidate regions | [NASA Artemis III candidate landing regions (2022)](https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-Moon/), outlines from [LROC QuickMap](https://quickmap.lroc.asu.edu) |
| Region flyover clips | [NASA SVS – Artemis III Landing Region Candidates (5013)](https://svs.gsfc.nasa.gov/5013) |
| Sun and Earth positions, hourly | [Astropy](https://www.astropy.org) ephemeris + IAU 2009 lunar rotation model |
| Power and temperature | Hourly model in `src/engine/energy.js`: irradiance with terrain shadowing, array power P = Gₙ·A·η·cos θ·D, battery state of charge, one-layer surface energy balance |

Data window: **15 Jul 2027 + 180 days** (south-pole summer).

## Honest limits

SUHAIL is a **decision-support tool, not a mission guarantee**.

- The 80 m/px grid cannot see boulders or small craters: slope screening is regional, not touchdown safety.
- Sun and Earth positions come from an astronomy model close to, but not exactly, NASA SPICE / JPL Horizons.
- Earth visibility is geometric, not a radio link budget.
- The temperature model is a simplified one-layer balance for level ground.
- Distance to a permanently shadowed region is only a proxy for access to possible water ice.

## Run it locally

**Windows, no setup:** double-click **`OPEN-OFFLINE.bat`** (or open `SUHAIL-offline.html`) — the whole
site in one file, no internet needed.

**With Node.js 20+** ([nodejs.org](https://nodejs.org)) — double-click **`RUN.bat`**, or:

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # 39 tests: engine, dialogue, Arabic dialogue, real data, power model, replan, report
npm run build          # production build in dist/
npm run offline        # SUHAIL-offline.html: one self-contained file, photos included
```

Deployment: `vercel.json` is included (Vite, output `dist/`); importing the repo in Vercel deploys it with no extra settings.

<details>
<summary>Regenerating the data (Python)</summary>

Needs Python 3 with `numpy`, `scipy`, `rasterio`, `pyshp`, `shapely`, `astropy` and `Pillow`, plus the LOLA files above:

```bash
python3 tools/pipeline/build_real_data.py --dem LDEM_80S_80MPP_ADJ.TIF --psr LPSR_80S_20MPP_ADJ_1km2
python3 tools/pipeline/build_maps.py      --dem LDEM_80S_80MPP_ADJ.TIF --psr LPSR_80S_20MPP_ADJ_1km2
```
</details>

## Project structure

```
RUN.bat · OPEN-OFFLINE.bat · TEST.bat   one-click run, offline view and tests (Windows)
src/
  App.jsx        navigation, modes, language, run state
  i18n.js        English / Arabic switch (Arabic is right-to-left)
  app/           screens: Home, Academy, Game, Forms, Council, Verdict, science panels
  components/    figures, speech bubbles, story scenes, maps, region media, 3D terrain
  content/       all text: characters, academy, game, missions, glossary, team
  engine/        rules, planner, power & thermal model, dialogue, report
  data/          real-sites.json (74 sites, hourly geometry), terrain3d.json
  assets/        maps, character and team art, flyover clips, fonts
tests/           node --test suites
tools/           data pipeline (Python) and the offline-file builder
handoff/         JPL Horizons cross-check script
docs/            product flow and developer notes
```

More for contributors: [`docs/DEVELOPER.md`](docs/DEVELOPER.md) and [`CLAUDE.md`](CLAUDE.md).

## The team

**FASA Destination Team** — six engineering and computing students from three Egyptian universities.

| Member | Field | University | |
|---|---|---|---|
| **Omar Ahmed Gooda** | Network & Cyber Security | Elsewedy University of Technology (SUTech), Faculty of Computer Engineering | [LinkedIn](https://www.linkedin.com/in/omar-ahmed-gooda-7486ab388/) |
| **Sara Ibrahim Sobhy** | Electrical Power Engineering | Cairo University, Faculty of Engineering | [LinkedIn](https://www.linkedin.com/in/sara-i-919356247/) |
| **Bilal Magdy Abdel Malk** | Network & Cyber Security | Elsewedy University of Technology (SUTech), Faculty of Computer Engineering | [LinkedIn](https://www.linkedin.com/in/bilal-magdy-abdelmalk/) |
| **Sara Hassan Ayyad** | AI & Data Science | Elsewedy University of Technology (SUTech), Faculty of Computer Engineering | [LinkedIn](https://www.linkedin.com/in/sara-hassan-ayyad-8759a6367/) |
| **Jody Ahmed Reda** | Computer Engineering | Cairo University, Faculty of Engineering | [LinkedIn](https://www.linkedin.com/in/jody-ahmed-reda2006/) |
| **Mohamed Shabban** | Information Technology | Thebes Academy | [LinkedIn](https://www.linkedin.com/in/mohamed-shabban-b28174344/) |

## The characters

- **Student crew** — the team’s own comic astronauts, each one sure of a terrible idea, and the Wise Doctor who sets them straight.
- **Expert council** — five original specialists named after the night sky Arab navigators knew: **Tariq** (solar), **Dr. Thuraya** (thermal), **Nasr** (communication), **Dr. Badr** (terrain) and **Dr. Saad** (science), led by the flight director **Hakim**. Each is *inspired by* the field of a real Arab scientist or astronaut — Sultan Alneyadi, Tahani Amer, Sultan bin Salman Al Saud, Farouk El-Baz and Essam Heggy — credited with photos on their cards. Their dialogue is invented and is never presented as the words of those people.

## Credits

- Elevation, shadowed-region and region data: NASA LOLA / PGDA, NASA Artemis, LROC QuickMap.
- Flyover clips: NASA’s Scientific Visualization Studio.
- Mission stories: NASA, NPR, Spaceflight Now, Space.com and others, linked in the app. Odysseus and Athena are Intuitive Machines missions.
- Character and team art by the FASA Destination Team.
- **Use of AI:** the team used an AI assistant (Claude) to help write code, process the NASA data and edit text. The idea, workflow and characters are the team’s.

## License

[MIT](LICENSE) · Source: [github.com/omarahmedgooda-arch/suhail-moon-landing-planner](https://github.com/omarahmedgooda-arch/suhail-moon-landing-planner)
