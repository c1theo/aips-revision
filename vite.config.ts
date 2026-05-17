import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// For GitHub Pages: set BASE_PATH env to '/<repo-name>/' before building.
// E.g. BASE_PATH=/aips-revision/ npm run build
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [svelte()],
  build: {
    chunkSizeWarningLimit: 800,
  },
});
