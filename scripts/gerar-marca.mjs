#!/usr/bin/env node
// Gera a marca (losango em espiral), favicons, ícones do manifest e og-image.
// TODO(garrido): a logo original (logo-garridovisual-recorte.png) não foi entregue.
// Este script desenha uma marca PROVISÓRIA. Quando a logo real chegar, vetorize-a em
// src/assets/logo-mark.svg (fill="currentColor") e rode este script só para os derivados
// (passe --sem-marca para não sobrescrever o SVG).
import sharp from 'sharp';
import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const OURO = '#D5A75A';
const GRAFITE = '#171717';
const semMarca = process.argv.includes('--sem-marca');

await mkdir('src/assets', { recursive: true });
await mkdir('public', { recursive: true });

// --- 1. Marca provisória: espiral de losangos aninhados ---
function espiral() {
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // espiral quadrada girada 45°: cada ponto novo fica a 13% do caminho entre dois anteriores
  const s = [
    [50, 3],
    [97, 50],
    [50, 97],
    [3, 50],
  ];
  for (let k = 0; k < 52; k++) s.push(lerp(s[k], s[k + 1], 0.13));
  return s.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('');
}

const marca = (cor, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${extra}><path d="${espiral()}" fill="none" stroke="${cor}" stroke-width="2.4" stroke-linejoin="miter" stroke-linecap="butt"/></svg>`;

if (!semMarca) {
  await writeFile(
    'src/assets/logo-mark.svg',
    marca('currentColor', 'role="img" aria-hidden="true"').replace(
      '<svg ',
      '<!-- TODO(garrido): marca provisória; trocar pela logo real --><svg ',
    ),
  );
}

// --- 2. Favicons e ícones (marca dourada sobre grafite) ---
const iconeSvg = (tam, margem) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}">
    <rect width="${tam}" height="${tam}" fill="${GRAFITE}"/>
    <g transform="translate(${margem} ${margem}) scale(${(tam - margem * 2) / 100})">
      <path d="${espiral()}" fill="none" stroke="${OURO}" stroke-width="2.8"/>
    </g></svg>`;

await writeFile('public/favicon.svg', iconeSvg(64, 6).replace(/width="64" height="64" /, ''));
const png = (svg, tam, destino) => sharp(Buffer.from(svg)).resize(tam, tam).png().toFile(destino);
await png(iconeSvg(256, 24), 32, 'public/favicon-32.png');
await png(iconeSvg(512, 90), 180, 'public/apple-touch-icon.png');
await png(iconeSvg(512, 64), 192, 'public/icon-192.png');
await png(iconeSvg(512, 64), 512, 'public/icon-512.png');

await writeFile(
  'public/manifest.webmanifest',
  JSON.stringify(
    {
      name: 'GarridoVisual',
      short_name: 'GarridoVisual',
      description: 'Filmmaker, Fotógrafo e Editor em Maringá, PR',
      lang: 'pt-BR',
      start_url: '/',
      display: 'standalone',
      background_color: '#0E0E0E',
      theme_color: '#0E0E0E',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    null,
    2,
  ) + '\n',
);

// --- 3. og-image 1200x630 (renderizada no Chromium com as fontes do projeto) ---
const fonte = async (nome, peso) =>
  `data:font/woff2;base64,${(await readFile(resolve(`node_modules/@fontsource/${nome}/files/${nome}-latin-${peso}-normal.woff2`))).toString('base64')}`;
const syne = await fonte('syne', 800);
const manrope = await fonte('manrope', 500);
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Syne;font-weight:800;src:url(${syne})}
@font-face{font-family:Manrope;font-weight:500;src:url(${manrope})}
html,body{margin:0;width:1200px;height:630px;background:${GRAFITE};}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;color:#F5F0E6}
svg{width:150px;height:150px}
h1{font:800 84px Syne;margin:0;letter-spacing:-1px}
p{font:500 30px Manrope;margin:0;color:#B5AFA3;letter-spacing:.5px}
.f{position:absolute;left:0;right:0;bottom:0;height:6px;background:${OURO}}
</style>${marca(OURO)}<h1>GarridoVisual</h1><p>Filmmaker, Fotógrafo e Editor</p><div class="f"></div>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og-image.jpg', type: 'jpeg', quality: 88 });
await browser.close();
console.log('marca, favicons, manifest e og-image gerados.');
