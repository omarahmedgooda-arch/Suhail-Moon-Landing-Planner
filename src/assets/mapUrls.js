// Resolves the hillshade images produced by tools/pipeline/build_real_data.py.
const files = import.meta.glob('./map/*.webp', { eager: true, query: '?url', import: 'default' });
export const mapUrl = (file) => files[`./map/${file}`];
