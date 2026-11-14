import { useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar.jsx';
import { Rover } from '../components/Art.jsx';
import { Term } from '../components/ui.jsx';
import { ASPECT_HINT, ASPECT_LABEL, CUSTOM_MISSION, LEVEL_WORDS, METRIC_BY_ASPECT, MISSIONS, MISSION_TYPES, limitsFromLevels, missionFromPreset, presetById } from '../content/missions.js';
import { CHARACTERS, ORDER } from '../content/characters.js';
import { LEVELS, LIMITS } from '../engine/rules.js';
import { batteryForHours, darkLoadW, enduranceHours, powerPreset } from '../engine/energy.js';
import { castFor } from '../content/cast.js';
import { dayToIso, fmtDay, isoToDay, windowDays } from '../engine/plan.js';

/* ------------------------------------------------------------------ shared bits */
function MissionIcon({ kind }) {
  const p = { width: 44, height: 44, viewBox: '0 0 44 44', 'aria-hidden': true, focusable: false, fill: 'none', stroke: 'var(--cream)', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (kind === 'bolt') return (<svg {...p}><path d="M24 4L10 24h10l-3 16 15-22H22z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="1.4" /></svg>);
  if (kind === 'rover') return (<svg {...p} viewBox="-26 -44 52 52"><Rover s={1} /></svg>);
  if (kind === 'drill') return (<svg {...p}><path d="M22 4v22M14 10h16M17 26h10l-5 12z" /><path d="M6 40h32" /></svg>);
  if (kind === 'relay') return (<svg {...p}><path d="M22 40V20M14 40h16" /><path d="M12 14a14 14 0 0120 0M16 18a8 8 0 0112 0" /><circle cx="22" cy="20" r="2.6" fill="var(--cream)" /></svg>);
  if (kind === 'moonnight') return (<svg {...p}><path d="M28 6a15 15 0 1010 26A13 13 0 0128 6z" fill="var(--indigo)" /><path d="M10 10l2 4M6 22h4M34 8l1 3" /></svg>);
  if (kind === 'rock') return (<svg {...p}><path d="M6 36l6-14 9-6 10 4 7 16z" fill="var(--indigo)" /><path d="M12 22l8 6 11-8M20 28l-2 8" /></svg>);
  if (kind === 'dish') return (<svg {...p}><path d="M10 12a18 18 0 0022 22z" fill="var(--indigo)" /><path d="M21 23l9-9M30 14l3-3M16 30l-4 10h16l-4-6" /></svg>);
  if (kind === 'outpost') return (<svg {...p}><path d="M6 36V24a16 16 0 0132 0v12z" fill="var(--indigo)" /><path d="M6 36h32M22 8v-4M16 36V26h12v10" /></svg>);
  return (<svg {...p}><path d="M6 12h32M6 22h32M6 32h32" /><circle cx="14" cy="12" r="3.4" fill="var(--ink)" /><circle cx="28" cy="22" r="3.4" fill="var(--ink)" /><circle cx="20" cy="32" r="3.4" fill="var(--ink)" /></svg>);
}

function Importance({ aspect, value, onChange }) {
  return (
    <div className="seg" role="radiogroup" aria-label={`${ASPECT_LABEL[aspect]} importance`}>
      {LEVELS.map((lv) => (
        <button key={lv} type="button" role="radio" aria-checked={value === lv} className={value === lv ? 'on' : ''} onClick={() => onChange(lv)} title={LEVEL_WORDS[lv].plain}>{LEVEL_WORDS[lv].label}</button>
      ))}
    </div>
  );
}

export function DataWindowNote({ data }) {
  const days = windowDays(data);
  return <p className="field-note">The data covers <strong>{fmtDay(data, 0)} → {fmtDay(data, days - 1)}</strong> (UTC), {days} days, so every date you can pick is inside it.</p>;
}

/* ------------------------------------------------------------------ STUDENT: pick a mission */
export function defaultStudent() { return { presetId: 'science-rover', durationDays: MISSIONS[1].durationDays, batteryH: MISSIONS[1].batteryH, levels: { ...MISSIONS[1].levels } }; }

export function studentToMission(s) {
  const preset = presetById(s.presetId);
  return s.presetId === 'custom'
    ? missionFromPreset(CUSTOM_MISSION, { levels: s.levels, durationDays: s.durationDays, batteryH: s.batteryH })
    : missionFromPreset(preset, { durationDays: s.durationDays, batteryH: preset.batteryH });
}

export function StudentPicker({ value, onChange, idp = 's', mode = 'student' }) {
  const CAST = castFor(mode).members;
  const set = (patch) => onChange({ ...value, ...patch });
  const pick = (id) => { const p = presetById(id); set({ presetId: id, durationDays: p.durationDays, batteryH: p.batteryH, levels: { ...p.levels } }); };
  return (
    <div className="picker">
      <ul className="mission-grid">
        {[...MISSIONS, CUSTOM_MISSION].map((m) => (
          <li key={m.id}>
            <button type="button" className={`mission-card ${value.presetId === m.id ? 'on' : ''}`} aria-pressed={value.presetId === m.id} onClick={() => pick(m.id)}>
              <MissionIcon kind={m.icon} />
              <strong>{m.name}</strong>
              <span>{m.blurb}</span>
              {m.needs.length > 0 && <ul className="needs">{m.needs.map((n) => (<li key={n}>{n}</li>))}</ul>}
            </button>
          </li>
        ))}
      </ul>
      {value.presetId === 'custom' && (
        <div className="custom">
          <div className="ctrls">
            {ORDER.map((a) => (
              <fieldset className="ctrl" key={a}>
                <legend><Avatar id={a} mood="happy" size={34} mode={mode} /> <span><strong>{ASPECT_LABEL[a]}</strong><small>{CAST[a].name}</small></span></legend>
                <Importance aspect={a} value={value.levels[a]} onChange={(lv) => set({ levels: { ...value.levels, [a]: lv } })} />
              </fieldset>
            ))}
          </div>
          <label className="range-label" htmlFor={`${idp}-bat`}>Battery lasts in the dark: <strong>{value.batteryH} h</strong></label>
          <input id={`${idp}-bat`} type="range" min="24" max="120" step="6" value={value.batteryH} onChange={(e) => set({ batteryH: +e.target.value })} />
        </div>
      )}
      <label className="range-label" htmlFor={`${idp}-dur`}>Mission duration: <strong>{value.durationDays} days</strong></label>
      <input id={`${idp}-dur`} type="range" min="3" max="14" value={value.durationDays} onChange={(e) => set({ durationDays: +e.target.value })} />
    </div>
  );
}

/* ------------------------------------------------------------------ EXPERT: the full requirements form */
export function defaultExpert(typeId = 'science-rover', data) {
  const p = presetById(typeId);
  return {
    name: p.id === 'custom' ? 'My mission' : p.name, typeId, durationDays: p.durationDays, batteryH: p.batteryH,
    levels: { ...p.levels }, limits: limitsFromLevels(p.levels), dirty: {}, power: presetPower(typeId, p.batteryH),
    transitDays: 5, fromIso: data ? dayToIso(data, -5) : '', toIso: data ? dayToIso(data, windowDays(data) - 1) : '',
  };
}

const num = (v) => (v === '' || v == null ? NaN : Number(v));

/** The importance level a typed limit corresponds to (team level tables in rules.js). */
export function levelForValue(key, v) {
  const t = LIMITS[key];
  const higherIsBetter = key === 'sunPct' || key === 'earthPct';
  for (const lv of ['high', 'medium', 'low']) if (higherIsBetter ? v >= t[lv] : v <= t[lv]) return lv;
  return 'low';
}

/** Power-system defaults for a mission type, with the battery sized for `batteryH` hours of darkness. */
export function presetPower(typeId, batteryH) {
  const pw = powerPreset(typeId);
  pw.batteryKWh = batteryForHours(pw, batteryH);
  return pw;
}
/** Clean numeric copy of the (possibly half-typed) power form. */
export function cleanPower(pw, typeId) {
  const base = powerPreset(typeId);
  const f = (v, d, lo, hi) => { const x = num(v); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; };
  const loads = {};
  for (const k of Object.keys(base.loads)) loads[k] = f(pw?.loads?.[k], base.loads[k], 0, 1e6);
  return {
    panelAreaM2: f(pw?.panelAreaM2, base.panelAreaM2, 0, 1e4), panelEff: f(pw?.panelEff, base.panelEff, 0.01, 0.6), derate: f(pw?.derate, base.derate, 0.1, 1),
    panelMode: pw?.panelMode === 'horizontal' ? 'horizontal' : 'vertical', batteryKWh: f(pw?.batteryKWh, 1, 0, 1e5), dod: f(pw?.dod, base.dod, 0.05, 1),
    etaC: f(pw?.etaC, base.etaC, 0.5, 1), etaD: f(pw?.etaD, base.etaD, 0.5, 1), loads,
  };
}

export function expertToMission(d, data) {
  const defaults = limitsFromLevels(d.levels);
  const limits = {};
  for (const k of Object.keys(defaults)) { const v = num(d.limits[k]); limits[k] = Number.isFinite(v) ? v : defaults[k]; }
  // Ground take-off (Earth launch) + transit = earliest landing day; Moon lift-off − duration = latest landing day.
  const last = windowDays(data) - 1;
  const dur = Math.max(1, Math.round(num(d.durationDays) || 1));
  const transit = Math.max(0, Math.round(num(d.transitDays) || 0));
  const from = Math.min(Math.max(0, isoToDay(data, d.fromIso) + transit), last);
  const to = Math.min(Math.max(from, isoToDay(data, d.toIso) - dur), last);
  const power = cleanPower(d.power, d.typeId);
  return {
    id: 'expert', name: d.name?.trim() || 'My mission', typeId: d.typeId,
    durationDays: Math.max(1, Math.round(num(d.durationDays) || 1)), batteryH: Math.max(1, enduranceHours(power) || 1),
    levels: { ...d.levels }, limits, fromDay: from, toDay: to, power,
  };
}

const FIELD_META = {
  sunPct: { unit: '%', min: 0, max: 100, step: 1 },
  earthPct: { unit: '%', min: 0, max: 100, step: 1 },
  earthGapH: { unit: 'h', min: 0, max: 240, step: 1 },
  slopeDeg: { unit: '°', min: 0, max: 30, step: 0.5 },
  psrKm: { unit: 'km', min: 0, max: 150, step: 0.5 },
};

function NumField({ id, label, k, d, setLimit, disabled }) {
  const m = FIELD_META[k];
  return (
    <label className="numfield" htmlFor={id}>
      <span>{label}</span>
      <span className="numbox">
        <input id={id} type="number" inputMode="decimal" min={m.min} max={m.max} step={m.step} value={d.limits[k] ?? ''} disabled={disabled} onChange={(e) => setLimit(k, e.target.value)} />
        <b aria-hidden="true">{m.unit}</b>
      </span>
    </label>
  );
}

export function RequirementsEditor({ value: d, onChange, data, idp = 'x', showDates = true, showName = true, mode = 'expert' }) {
  const CAST = castFor(mode).members;
  const set = (patch) => onChange({ ...d, ...patch });
  const setType = (typeId) => { const p = presetById(typeId); onChange({ ...d, typeId, name: p.id === 'custom' ? d.name : p.name, durationDays: p.durationDays, batteryH: p.batteryH, levels: { ...p.levels }, limits: limitsFromLevels(p.levels), dirty: {}, power: presetPower(typeId, p.batteryH) }); };
  // Choosing a level ALWAYS resets that aspect's numbers to the level's defaults (a typed number is an override of the level, not a lock).
  const setLevel = (a, lv) => {
    const levels = { ...d.levels, [a]: lv };
    const defaults = limitsFromLevels(levels);
    const limits = { ...d.limits };
    const dirty = { ...d.dirty };
    for (const k of METRIC_BY_ASPECT[a] ?? []) { limits[k] = defaults[k]; delete dirty[k]; }
    onChange({ ...d, levels, limits, dirty });
  };
  const pw = d.power ?? presetPower(d.typeId, d.batteryH);
  const setPw = (patch) => set({ power: { ...pw, ...patch } });
  const setLoad = (k, v) => set({ power: { ...pw, loads: { ...pw.loads, [k]: v } } });
  const clean = cleanPower(pw, d.typeId);
  const endurance = enduranceHours(clean);
  // Typing a number moves the level selector to the level that number corresponds to (two-way sync).
  const setLimit = (k, raw) => {
    const v = raw === '' ? '' : Number(raw);
    const aspect = Object.keys(METRIC_BY_ASPECT).find((a) => METRIC_BY_ASPECT[a].includes(k));
    const levels = { ...d.levels };
    if (v !== '' && Number.isFinite(v) && aspect) levels[aspect] = levelForValue(k, v);
    onChange({ ...d, levels, limits: { ...d.limits, [k]: v }, dirty: { ...d.dirty, [k]: true } });
  };
  const lastDay = windowDays(data) - 1;
  const maxStart = dayToIso(data, Math.max(0, lastDay - Math.round(num(d.durationDays) || 1) + 1));
  const allOff = ORDER.every((a) => d.levels[a] === 'off');
  const lim = (a) => d.levels[a] === 'off';
  return (
    <div className="req">
      {showName && (
        <div className="req-top">
          <label className="numfield wide" htmlFor={`${idp}-name`}><span>Mission name</span><input id={`${idp}-name`} type="text" maxLength={60} value={d.name} onChange={(e) => set({ name: e.target.value })} /></label>
          <label className="numfield wide" htmlFor={`${idp}-type`}><span>Type of mission</span>
            <select id={`${idp}-type`} value={d.typeId} onChange={(e) => setType(e.target.value)}>{MISSION_TYPES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}</select>
          </label>
        </div>
      )}
      <div className="req-top">
        <NumberBox id={`${idp}-dur`} label="Mission duration" unit="days" min={1} max={30} value={d.durationDays} onChange={(v) => set({ durationDays: v })} />
        <p className="req-auto">Battery endurance on the night-time load: <strong className="mono">{endurance} h</strong> <small>(= capacity × DoD × η<sub>d</sub> ÷ {darkLoadW(clean)} W)</small></p>
      </div>

      <ul className="req-rows">
        {ORDER.map((a) => (
          <li key={a} className={`req-row ${lim(a) ? 'is-off' : ''}`}>
            <div className="req-who"><Avatar id={a} mood={lim(a) ? 'asleep' : 'happy'} size={46} mode={mode} /><span><strong>{ASPECT_LABEL[a]}</strong><small>{CAST[a].name} · {ASPECT_HINT[a]}</small></span></div>
            <Importance aspect={a} value={d.levels[a]} onChange={(lv) => setLevel(a, lv)} />
            <div className="req-fields">
              {a === 'sunlight' && <NumField id={`${idp}-sun`} label="Sunlit time at least" k="sunPct" d={d} setLimit={setLimit} disabled={lim(a)} />}
              {a === 'night' && <p className="req-auto">Longest continuous darkness must stay under the battery endurance (<span className="mono">{endurance} h</span>).</p>}
              {a === 'comms' && (<><NumField id={`${idp}-ep`} label="Earth in view at least" k="earthPct" d={d} setLimit={setLimit} disabled={lim(a)} /><NumField id={`${idp}-eg`} label="Longest blackout at most" k="earthGapH" d={d} setLimit={setLimit} disabled={lim(a)} /></>)}
              {a === 'terrain' && <NumField id={`${idp}-sl`} label="Max. surface slope" k="slopeDeg" d={d} setLimit={setLimit} disabled={lim(a)} />}
              {a === 'science' && <NumField id={`${idp}-ps`} label="Max. distance to target" k="psrKm" d={d} setLimit={setLimit} disabled={lim(a)} />}
            </div>
          </li>
        ))}
      </ul>
      <p className="field-note">Importance sets how much an aspect counts in the score (Off 0 · Low 1 · Medium 2 · High 3). The limits are <Term k="dealbreaker">dealbreakers</Term>: break one and the site is out. Default numbers per level are team assumptions, not NASA standards.</p>
      {allOff && <p className="callout small" role="alert">Switch at least one aspect on, or there is nothing to judge.</p>}

      <details className="limits power-box" open>
        <summary>Power system <span>(drives the solar-energy and battery simulation)</span></summary>
        <div className="req-top grid3">
          <PField id={`${idp}-pa`} label="Solar array area" unit="m²" step="0.1" value={pw.panelAreaM2} onChange={(v) => setPw({ panelAreaM2: v })} />
          <PField id={`${idp}-pe`} label="Cell efficiency" unit="%" step="0.5" value={pct(pw.panelEff)} onChange={(v) => setPw({ panelEff: unpct(v) })} />
          <PField id={`${idp}-pd`} label="Derating factor" unit="×" step="0.01" value={pw.derate} onChange={(v) => setPw({ derate: v })} />
          <label className="numfield" htmlFor={`${idp}-pm`}><span>Array orientation</span>
            <select id={`${idp}-pm`} value={pw.panelMode} onChange={(e) => setPw({ panelMode: e.target.value })}>
              <option value="vertical">Vertical, Sun-tracking (cos θ = cos α)</option>
              <option value="horizontal">Horizontal, fixed (cos θ = sin α)</option>
            </select>
          </label>
          <PField id={`${idp}-bk`} label="Battery capacity" unit="kWh" step="0.1" value={pw.batteryKWh} onChange={(v) => setPw({ batteryKWh: v })} />
          <PField id={`${idp}-dod`} label="Max. depth of discharge" unit="%" step="1" value={pct(pw.dod)} onChange={(v) => setPw({ dod: unpct(v) })} />
          <PField id={`${idp}-ec`} label="Charge efficiency" unit="%" step="1" value={pct(pw.etaC)} onChange={(v) => setPw({ etaC: unpct(v) })} />
          <PField id={`${idp}-ed`} label="Discharge efficiency" unit="%" step="1" value={pct(pw.etaD)} onChange={(v) => setPw({ etaD: unpct(v) })} />
        </div>
        <p className="panel-text small">Electrical loads. Avionics run all the time, heaters only in darkness, the radio when Earth is in view, payload and mobility only in sunlight.</p>
        <div className="req-top grid3">
          <PField id={`${idp}-lb`} label="Avionics & base" unit="W" step="5" value={pw.loads.baseW} onChange={(v) => setLoad('baseW', v)} />
          <PField id={`${idp}-lh`} label="Survival heaters (dark)" unit="W" step="5" value={pw.loads.heaterW} onChange={(v) => setLoad('heaterW', v)} />
          <PField id={`${idp}-lc`} label="Radio (Earth in view)" unit="W" step="5" value={pw.loads.commsW} onChange={(v) => setLoad('commsW', v)} />
          <PField id={`${idp}-lp`} label="Science payload (sunlit)" unit="W" step="5" value={pw.loads.payloadW} onChange={(v) => setLoad('payloadW', v)} />
          <PField id={`${idp}-lm`} label="Mobility / drill (sunlit)" unit="W" step="5" value={pw.loads.mobilityW} onChange={(v) => setLoad('mobilityW', v)} />
          <div className="numfield"><span>Size battery for</span><span className="cta-row tight">{[24, 48, 72, 120].map((h) => (<button key={h} type="button" className="btn btn-ghost btn-sm" onClick={() => setPw({ batteryKWh: batteryForHours(clean, h) })}>{h} h</button>))}</span></div>
        </div>
        <p className="field-note">Defaults per mission type are team assumptions (array η ≈ 29 % triple-junction cells, D = 0.85 for temperature, dust, wiring and conversion losses that η does not already include).</p>
      </details>

      {showDates && (
        <div className="req-top grid3">
          <label className="numfield" htmlFor={`${idp}-from`}><span>Ground take-off date (Earth launch)</span><input id={`${idp}-from`} type="date" min={dayToIso(data, -30)} max={maxStart} value={d.fromIso} onChange={(e) => set({ fromIso: e.target.value })} /></label>
          <NumberBox id={`${idp}-tr`} label="Earth–Moon transit" unit="days" min={0} max={120} value={d.transitDays ?? 5} onChange={(v) => set({ transitDays: v })} />
          <label className="numfield" htmlFor={`${idp}-to`}><span>Moon lift-off date (end of surface ops)</span><input id={`${idp}-to`} type="date" min={d.fromIso || dayToIso(data, 0)} max={dayToIso(data, lastDay)} value={d.toIso} onChange={(e) => set({ toIso: e.target.value })} /></label>
        </div>
      )}
      {showDates && <p className="field-note">Landing can happen from take-off + transit; the surface mission ({num(d.durationDays) || 1} days) must end by the lift-off date. SUHAIL tests every landing day in between.</p>}
      {showDates && <DataWindowNote data={data} />}
    </div>
  );
}

const pct = (x) => (x === '' || x == null ? '' : Math.round(Number(x) * 1000) / 10);
const unpct = (v) => (v === '' ? '' : Number(v) / 100);

function PField({ id, label, unit, step, value, onChange }) {
  return (
    <label className="numfield" htmlFor={id}>
      <span>{label}</span>
      <span className="numbox"><input id={id} type="number" inputMode="decimal" min="0" step={step} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} /><b aria-hidden="true">{unit}</b></span>
    </label>
  );
}

function NumberBox({ id, label, unit, min, max, value, onChange }) {
  return (
    <label className="numfield" htmlFor={id}>
      <span>{label}</span>
      <span className="numbox"><input id={id} type="number" inputMode="numeric" min={min} max={max} step="1" value={value} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} /><b aria-hidden="true">{unit}</b></span>
    </label>
  );
}

/* ------------------------------------------------------------------ REPLAN pieces */
export const REASONS = [
  'Launch date moved',
  'Lander or payload changed',
  'Battery or power changed',
  'Communication problem',
  'New science target',
  'Safety review of the old site',
  'Mission got longer or shorter',
  'Other',
];

export function ReasonChips({ value, onChange }) {
  const toggle = (r) => onChange(value.includes(r) ? value.filter((x) => x !== r) : [...value, r]);
  return (
    <div className="chips" role="group" aria-label="Reasons for replanning">
      {REASONS.map((r) => (<button key={r} type="button" className={`chip ${value.includes(r) ? 'on' : ''}`} aria-pressed={value.includes(r)} onClick={() => toggle(r)}>{r}</button>))}
    </div>
  );
}

export function SitePicker({ data, value, onChange, id }) {
  const groups = useMemo(() => data.map.regions.map((r) => ({ r, sites: data.sites.filter((s) => s.region === r.id) })), [data]);
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {groups.map(({ r, sites }) => (
        <optgroup key={r.id} label={r.name}>
          {sites.map((s) => (<option key={s.id} value={s.id}>{s.name} · {Math.abs(s.lat_deg).toFixed(2)}°S {s.lon_deg.toFixed(1)}°E</option>))}
        </optgroup>
      ))}
    </select>
  );
}
