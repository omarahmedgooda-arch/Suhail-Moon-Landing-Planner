#!/usr/bin/env python3
"""
SUHAIL: fetch hourly Sun and Earth azimuth/elevation for each landing site from
NASA JPL Horizons (observer = a point on the Moon's surface).

Usage:
    python fetch_horizons.py                    # reads sites.csv, writes horizons_out.json (74 sites x 2 bodies x 4320 h)
    python fetch_horizons.py --dry-run          # prints the first request URL, calls nothing
    python fetch_horizons.py --selftest         # tests the parser on a fake response (no internet)
    python fetch_horizons.py --start 2027-07-15 # window start (UTC); the app uses 15 Jul 2027 + 180 days

Needs Python 3.8+ and internet. No extra packages.
Raw responses are cached in ./horizons_raw/ so a re-run skips finished requests.
Send horizons_out.json back; that is all that is needed from this step.

Notes
- Elevation/azimuth are relative to the local horizontal plane of an ideal sphere at the site.
  Terrain is NOT included here; the terrain horizon profile is computed separately from the LOLA DEM.
- Angles are for the CENTRE of the Sun/Earth disc (the engine adds the Sun's 0.27 deg radius).
- Horizons parameter names are from the official API docs. The Az/El quantity code (4)
  and the body ids (10 = Sun, 399 = Earth, 301 = Moon) are standard but, if a request fails,
  check them in the Horizons manual. The script prints the server's message.
"""
import argparse
import csv
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

API = "https://ssd.jpl.nasa.gov/api/horizons.api"
BODIES = {"sun": "10", "earth": "399"}
HOURS = 4320  # 180 days, hourly (south-pole summer window used by the app)


def build_params(body_id, lat, lon_east, start, hours=HOURS):
    stop = start + timedelta(hours=hours - 1)  # inclusive end => exactly `hours` rows
    q = lambda s: "'" + s + "'"
    return {
        "format": "text",
        "COMMAND": q(body_id),
        "OBJ_DATA": q("NO"),
        "MAKE_EPHEM": q("YES"),
        "EPHEM_TYPE": q("OBSERVER"),
        "CENTER": q("coord@301"),
        "COORD_TYPE": q("GEODETIC"),
        "SITE_COORD": q(f"{lon_east:.6f},{lat:.6f},0"),
        "START_TIME": q(start.strftime("%Y-%m-%d %H:%M")),
        "STOP_TIME": q(stop.strftime("%Y-%m-%d %H:%M")),
        "STEP_SIZE": q("60 m"),
        "QUANTITIES": q("4"),
        "APPARENT": q("AIRLESS"),
        "ANG_FORMAT": q("DEG"),
        "CSV_FORMAT": q("YES"),
    }


def url_for(params):
    return API + "?" + urllib.parse.urlencode(params, quote_via=urllib.parse.quote)


def _is_num(s):
    try:
        float(s)
        return True
    except ValueError:
        return False


def parse_response(text):
    """Return (az_list, el_list) from a Horizons OBSERVER CSV response."""
    if "$$SOE" not in text or "$$EOE" not in text:
        raise ValueError("no $$SOE/$$EOE block. Server said:\n" + text[:1500])
    block = text.split("$$SOE", 1)[1].split("$$EOE", 1)[0]
    az, el = [], []
    for line in block.strip().splitlines():
        toks = [t.strip() for t in line.split(",")]
        nums = [float(t) for t in toks[1:] if _is_num(t)]  # flags like '*', 'C', 'N' are skipped
        if len(nums) < 2:
            raise ValueError("cannot read azimuth/elevation from line: " + line)
        az.append(nums[-2])
        el.append(nums[-1])
    return az, el


def fetch(url, tries=3):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return r.read().decode("utf-8", "replace")
        except (urllib.error.URLError, TimeoutError) as e:
            last = e
            time.sleep(2 * (i + 1))
    raise RuntimeError(f"request failed after {tries} tries: {last}")


def selftest():
    fake = """*******************
Ephemeris
$$SOE
 2027-Mar-01 00:00, , ,  10.250000,  -1.500000,
 2027-Mar-01 01:00,*, ,  10.750000,  -1.250000,
 2027-Mar-01 02:00, ,N,  11.250000,  -1.000000,
$$EOE
"""
    az, el = parse_response(fake)
    assert az == [10.25, 10.75, 11.25] and el == [-1.5, -1.25, -1.0], (az, el)
    p = build_params("10", -85.43810, 37.36667, datetime(2027, 3, 1, tzinfo=timezone.utc), hours=720)
    assert p["STOP_TIME"] == "'2027-03-30 23:00'", p["STOP_TIME"]
    assert "coord%40301" in url_for(p)
    try:
        parse_response("API error: something")
    except ValueError:
        pass
    else:
        raise AssertionError("should raise on missing block")
    print("selftest OK")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sites", default="sites.csv")
    ap.add_argument("--out", default="horizons_out.json")
    ap.add_argument("--start", default="2027-07-15", help="UTC date, YYYY-MM-DD")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()

    if a.selftest:
        selftest()
        return

    start = datetime.strptime(a.start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    with open(a.sites, newline="", encoding="utf-8") as f:
        sites = list(csv.DictReader(f))
    if a.dry_run:
        s = sites[0]
        print(url_for(build_params(BODIES["sun"], float(s["lat"]), float(s["lon_east"]), start)))
        return

    raw_dir = Path("horizons_raw")
    raw_dir.mkdir(exist_ok=True)
    out = {
        "source": "NASA JPL Horizons API, observer on the Moon surface (CENTER=coord@301)",
        "window": {"start_utc": start.strftime("%Y-%m-%dT%H:%M:%SZ"), "step_hours": 1, "hours": HOURS},
        "sites": {},
    }
    total = len(sites) * len(BODIES)
    n = 0
    for s in sites:
        sid, lat, lon = s["id"], float(s["lat"]), float(s["lon_east"])
        rec = {}
        for bname, bid in BODIES.items():
            n += 1
            cache = raw_dir / f"{sid}_{bname}.txt"
            if cache.exists():
                text = cache.read_text(encoding="utf-8")
            else:
                text = fetch(url_for(build_params(bid, lat, lon, start)))
                cache.write_text(text, encoding="utf-8")
                time.sleep(1.0)  # be polite to the server
            try:
                az, el = parse_response(text)
            except ValueError as e:
                cache.unlink(missing_ok=True)
                sys.exit(f"[{n}/{total}] {sid}/{bname}: {e}")
            if len(az) != HOURS:
                sys.exit(f"[{n}/{total}] {sid}/{bname}: got {len(az)} rows, expected {HOURS}")
            rec[f"{bname}_az_deg"] = az
            rec[f"{bname}_el_deg"] = el
            print(f"[{n}/{total}] {sid}/{bname}: {len(az)} rows, "
                  f"elevation {min(el):.2f} .. {max(el):.2f} deg")
        out["sites"][sid] = rec

    Path(a.out).write_text(json.dumps(out), encoding="utf-8")
    print(f"\nDone. Send me: {a.out}")


if __name__ == "__main__":
    main()
