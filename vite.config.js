import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`         -> dist/            (normal multi-file build, serve it from any static host)
// `npm run build:single`  -> dist-single/     (ONE index.html with everything inlined; opens by double-click)
// (uses --mode single instead of an env var so it also works in Windows cmd/PowerShell)
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
  base: './',
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
  build: {
    outDir: single ? 'dist-single' : 'dist',
    assetsInlineLimit: single ? 100_000_000 : 4096,
    chunkSizeWarningLimit: 900,
  },
  };
});
