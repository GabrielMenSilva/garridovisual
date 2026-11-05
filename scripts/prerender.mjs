#!/usr/bin/env node
// Pré-renderiza a página: injeta o HTML gerado por src/entry-server.tsx dentro do <div id="root">.
// Uso (o `pnpm build` já faz isso): node scripts/prerender.mjs <pasta-do-site> <pasta-do-build-ssr>
import { readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [site = 'dist', ssr = 'dist-ssr'] = process.argv.slice(2);
const htmlPath = join(site, 'index.html');
const { render } = await import(pathToFileURL(resolve(ssr, 'entry-server.js')).href);

const html = await readFile(htmlPath, 'utf8');
const marcador = '<div id="root"></div>';
if (!html.includes(marcador)) throw new Error(`${htmlPath}: não achei ${marcador} (já pré-renderizado?)`);
const app = render();
await writeFile(htmlPath, html.replace(marcador, `<div id="root">${app}</div>`));
await rm(ssr, { recursive: true, force: true });
console.log(`pré-renderizado ${htmlPath} (${(app.length / 1024).toFixed(1)} KB de HTML)`);
