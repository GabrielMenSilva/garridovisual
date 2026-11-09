#!/usr/bin/env node
// Pré-renderiza a página: injeta o HTML gerado por src/entry-server.tsx dentro do <div id="root">.
// Uso (o `pnpm build` já faz isso): node scripts/prerender.mjs <pasta-do-site> <pasta-do-build-ssr>
import { existsSync } from 'node:fs';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [site = 'dist', ssr = 'dist-ssr'] = process.argv.slice(2);
const htmlPath = join(site, 'index.html');
const { render, projects, criarSchemaProjetos } = await import(
  pathToFileURL(resolve(ssr, 'entry-server.js')).href
);

// zod no build: falha se algum vídeo, poster ou foto citado nos projetos não existir no site gerado
const validacao = criarSchemaProjetos((caminho) => existsSync(join(site, caminho))).projetos.safeParse(
  projects,
);
if (!validacao.success) {
  console.error('Mídia inválida nos projetos:');
  for (const i of validacao.error.issues.slice(0, 20)) console.error(`  - ${i.path.join('.')}: ${i.message}`);
  process.exit(1);
}
console.log(`mídia conferida: ${projects.length} projetos, todos os arquivos existem em ${site}/`);

const html = await readFile(htmlPath, 'utf8');
const marcador = '<div id="root"></div>';
if (!html.includes(marcador)) throw new Error(`${htmlPath}: não achei ${marcador} (já pré-renderizado?)`);
const app = render();
await writeFile(htmlPath, html.replace(marcador, `<div id="root">${app}</div>`));
await rm(ssr, { recursive: true, force: true });
console.log(`pré-renderizado ${htmlPath} (${(app.length / 1024).toFixed(1)} KB de HTML)`);
