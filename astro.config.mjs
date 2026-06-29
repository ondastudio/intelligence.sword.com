// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Canonical origin — lets pages build absolute URLs (e.g. og:image) via Astro.site.
  site: 'https://intelligence.sword.com',
  vite: {
    plugins: [tailwindcss()]
  }
});