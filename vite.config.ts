import { defineConfig } from 'vitest/config';
import { loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Valor provisório (TLD reservado .invalid) até existir um domínio. Defina VITE_SITE_URL no build.
const DEFAULT_SITE_URL = 'https://garridovisual.invalid';

function siteUrlPlugin(siteUrl: string): Plugin {
  return {
    name: 'garridovisual-site-url',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n</urlset>\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
  // VITE_BASE=/garridovisual/ no GitHub Pages (subcaminho); na raiz de um domínio, "/"
  const base = env.VITE_BASE || '/';
  return {
    base,
    plugins: [react(), tailwindcss(), siteUrlPlugin(siteUrl)],
    define: { __SITE_URL__: JSON.stringify(siteUrl) },
    build: { target: 'es2022', sourcemap: false },
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
      css: false,
    },
  };
});
