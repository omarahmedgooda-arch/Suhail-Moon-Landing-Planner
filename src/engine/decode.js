// The pipeline stores each hourly series as little-endian 16-bit integers in hundredths of a degree,
// base64-encoded ("centideg-b64"), because 74 sites x 4,320 hours x 4 series is too much as JSON text.
// Plain arrays (the old sample file) pass through untouched.

function bytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function decode(b64, Type) {
  const u8 = bytes(b64);
  const view = new DataView(u8.buffer);
  const n = u8.length / 2;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = (Type === 'i16' ? view.getInt16(i * 2, true) : view.getUint16(i * 2, true)) / 100;
  return out;
}

export function decodeHourly(h) {
  if (h?.enc !== 'centideg-b64') return h;
  return {
    sun_el_deg: decode(h.sun_el_deg, 'i16'),
    sun_az_deg: decode(h.sun_az_deg, 'u16'),
    earth_el_deg: h.earth_el_deg ? decode(h.earth_el_deg, 'i16') : null,
    earth_az_deg: h.earth_az_deg ? decode(h.earth_az_deg, 'u16') : null,
  };
}
