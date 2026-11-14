# CLAUDE.md · SUHAIL

Context for Claude Code (or any new contributor) picking this project up.

## What this is
**SUHAIL (سهيل)**, the Lunar Landing Site Navigator, by the **FASA Destination Team** (SUT) for
**NASA Space Apps Cairo 2026**. Owner of the Student mode: Omar. The product flow was written by a
teammate and lives in `docs/product-flow.md` (English + the Arabic original). **Implement that flow;
if the code and the doc disagree, ask the author.** English only for now.

Read `README.md` first (run commands, data pipeline, decision rules, folder map).

## Rules of the house
- **Palette is fixed**: `--ink #24201A`, `--plum #3F2548`, `--indigo #35369C`, `--lav #7C679E`,
  `--cream #C8C793`. Never add a new hex. Derive with `color-mix(...)` in `src/styles/tokens.css`.
- **Same UI for Student and Expert.** Only the form differs (presets vs every number) and the numbers
  panel is open by default in Expert. Keep both workflows simple.
- **Status is never colour-only.** Use `StatusIcon` / `StatusPill` (shape + word).
- **Real data stays honest.** Keep the footer caveats and the "Honest notes" panel on the verdict screen
  (LOLA terrain real · Sun/Earth from a model, not SPICE · 80 m/pixel DEM · limits are team assumptions).
  If `data.is_sample` is true, show the "SAMPLE DATA" badge.
- **Level limits are team assumptions** (`LIMITS` in `src/engine/rules.js`), not NASA numbers. Say so wherever shown.
- **Unknown is never a pass.** Missing data means "Unverified", not Go.
- **Story claims need a source.** Every historical fact in `src/content/story.js` / `characters.js`
  is verified against a link in `SOURCES`.
- **Character lines are templates**: build sentences in `src/engine/dialogue.js` / `banter.js` from the
  evaluation object and record each number in `used`. No hand-typed numbers. The tests guard this.
- **Images.** Character art is the team's own (`src/assets/cast/<mode>/<id>-<pose>.webp`, cut out from the
  team's PNGs; swap pictures in `src/components/figures.js` → `FIGURE_OF`). Maps come from LOLA data
  (`tools/pipeline/build_real_data.py`, `tools/pipeline/build_maps.py`). Region flyover clips are NASA SVS
  (credited in the UI). Never bundle photos of real people copied from the web; `public/inspired/` is for
  licensed/team photos only. Don't draw real mission logos.
- **Two casts** (`src/content/cast.js`): Student = the team's comic crew + the Wise Doctor; Expert = five original
  specialists (Arabic sky names) inspired by real Arab scientists/astronauts, credited on the "Meet the council"
  cards. Expert dialogue is in `speakExpert` (`dialogue.js`); never present invented lines as the real people's words.
- **Power & thermal model** lives in `src/engine/energy.js` (hourly; irradiance, array power, loads, battery SoC,
  one-layer surface temperature, 4-class rating). Its constants are typical values / team assumptions; keep the
  "Model, equations and parameters" box in sync when you change them.
- **Reduced motion and keyboard** must keep working (`useReducedMotion`, focus rings, `role=button` pins).
- Use CSS **logical properties** so RTL stays possible.
- A single-column CSS grid whose child holds a wide table needs `grid-template-columns: minmax(0, 1fr)`,
  otherwise the page scrolls sideways on phones (seen on the Expert council screen; see the end of `app.css`).
- Old `.map-cap` rules from the removed MoonMap still exist earlier in `app.css`; the later override wins.

## Commands
`npm run dev` · `npm test` · `npm run build` · `npm run build:single` (one-file `dist-single/index.html`).
`npm test` must stay green before every commit (37 tests: engine, dialogue, real data, replan, report).

## Regenerating the data
`python3 tools/pipeline/build_real_data.py --dem <LDEM tif> --psr <LPSR shapefile base name>` (≈ 7 s).
Window defaults to **2027-07-15 + 4320 h** (south-pole summer; the peak is about 27 Oct 2027).
If you change the window, the "Best start" dates, the Horizons validation script and the tests that check the
start date (`tests/realdata.test.mjs`) must change with it.
Output: `src/data/real-sites.json` + `src/assets/map/*.webp`. Do not hand-edit them.

## Known limits / ideas
- Validate the astronomy model against JPL Horizons (`handoff/fetch_horizons.py --start 2027-07-15`).
- DEM is 80 m/pixel: slopes are smoother than lander-scale truth; add a 20 m product if it becomes available.
- The "4 best-lit sites per region + spread" candidate rule and the 10 km² PSR cut-off are team choices.
- Arabic version (strings in `src/content/*.js`, `src/engine/banter.js`, components; layout is RTL-ready).
- Report as PDF without the print dialog; share link; saving missions between visits.

## Commit attribution
If you commit through Claude Code, follow the attribution lines in the session's system reminder.
