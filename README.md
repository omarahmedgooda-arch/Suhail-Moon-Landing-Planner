# SUHAIL (سهيل)

**A lunar landing site navigator. Chart the sky. Choose the landing.**

SUHAIL is our entry for the **NASA Space Apps Challenge, Cairo 2026**, for the challenge
**Lunar Landing Site Navigator**.
It helps mission planners, educators and the public compare candidate landing sites near the
Moon's south pole by date, using the Sun and Earth positions relative to the local horizon, so
power and direct-to-Earth communication conditions can be judged in one place.

The name comes from **Suhail (Canopus)**, the star Arab sailors used to find their way. We want
SUHAIL to be a compass for choosing where to land.

> **Project video:** [Watch on YouTube](https://youtu.be/gso-zLadcoE)

---

## Status

**Planning stage. Development starts at the hackathon (Nov 13, 2026).**
No application code or data has been committed before the event. Everything in this README
describes what we plan to build.

---

## The problem

Missions to the lunar south pole face extreme lighting and communication limits. Tools that
compute Sun and Earth positions exist, but their interfaces are built for specialists, and every
change of landing date or site means starting the analysis again. Recent landers such as
Odysseus (2024) and Athena (2025) both ended up on their sides near the pole, which shows how
much the landing environment matters.

## What SUHAIL will do

- **Set priorities.** The user picks levels (High / Medium / Low) for lighting, communication,
  terrain safety and scientific value, plus landing date, flexibility, mission duration and
  battery hours. Each level maps to an editable numeric limit.
- **Compare sites by date.** Candidate south-pole sites are evaluated over the mission window.
- **Show the sky.** Sun and Earth positions relative to the horizon, including time left before
  sunset or Earthset.
- **Decide with clear rules.** Sites that break a hard limit are removed. Each role (power,
  communication, safety, science) gets Go / Marginal / No-Go. Remaining sites are ranked and the
  best site and date are recommended with the reason.
- **Replan.** If the launch date slips, the same sites are re-evaluated and the tool shows
  what changed.
- **Two audiences.** Experts get the numbers and limits. Students and the public get plain
  language explanations.

## Decision rules (planned)

1. Hard constraints first. Missing data is shown as *Unverified* and is never treated as a pass.
2. Each role status comes from the weakest of its metrics.
3. Overall score is a weighted mean of the role scores. Ties are broken by the weakest role.
4. Every number is labelled **measured**, **computed** or **estimated**, with its source.

## Planned architecture

| Layer | Plan |
|---|---|
| Data preparation (offline) | Python: slope and roughness from terrain, hourly Sun and Earth positions per site, terrain horizon |
| Site store | One JSON file per site with hourly arrays and the source of every value |
| Engine and API | Python, FastAPI: constraints, role status, scoring, ranking, replan diff |
| Web app | React: mission form, results, sky view, comparison, replan, export |

## Planned data sources

All free and public. Exact products and versions will be recorded here when used.

- NASA **LOLA** lunar topography (via NASA PGDA)
- NASA **PGDA** illumination products (for cross-checking)
- NASA **SPICE / NAIF** ephemeris kernels
- **JPL Horizons** (validation of Sun and Earth positions)

## Limits

SUHAIL is a **decision-support tool, not a mission guarantee**.

- Earth visibility is geometric. It is not a communication link budget.
- Sunlight percentage is not power. Panel angle, dust, temperature and batteries are not modelled.
- 80 m terrain data gives a regional slope screening. It cannot see rocks or small craters, so
  "safety" here is not touchdown safety.
- Distance to a permanently shadowed region is only a proxy for scientific access. SUHAIL makes no
  claim about water ice at any coordinate.
- Rankings depend on stated assumptions. They are not a probability of success.

## Hackathon plan

| Block | Goal |
|---|---|
| 1 | Repository, environment, download and open all data files |
| 2 | Data pipeline: slope, candidate sites, Sun and Earth positions, horizon |
| 3 | Engine and API, first screens with real site files |
| 4 | Replan, comparison, site details, explanations |
| 5 | Validation against JPL Horizons, usability and accessibility checks |
| 6 | Submission: video or slides, public repository, project page |

## Getting started

Not available yet. Setup and run instructions will be added once the code exists.

## Team

**FASA**

## Credits

NASA data and tools are credited to their sources, with full references added as they are used.
Mission names (Odysseus, Athena) refer to Intuitive Machines missions. Any lander imagery in
our materials is an illustration, not a real photograph.

## License

[MIT](LICENSE)
