import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://szmidtke.pl',
  // Astro 5: output='static' jest domyślny. Endpointy z `export const prerender = false`
  // (np. src/pages/api/subscribe.ts) renderują się on-demand dzięki adapterowi Node.
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  redirects: {
    '/atom.html': '/feed',
    '/atom': '/feed',
    '/rss': '/feed',
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/api/') &&
        !page.endsWith('/zapisany') &&
        !page.endsWith('/zapisany/'),
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
