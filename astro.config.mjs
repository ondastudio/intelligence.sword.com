// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Canonical origin — lets pages build absolute URLs (e.g. og:image) via Astro.site.
  // Netlify sets `URL` to the primary site address at build time (the *.netlify.app
  // subdomain today, and intelligence.sword.com once the custom domain is attached),
  // so absolute OG/canonical URLs always resolve to the host actually serving the site.
  // Falls back to the canonical domain for local builds.
  site: process.env.URL || 'https://intelligence.sword.com',
  // Excludes the internal component catalog (/styleguide) — not real content.
  integrations: [sitemap({ filter: (page) => !page.includes('/styleguide') })],
  vite: {
    plugins: [tailwindcss()]
  }
});