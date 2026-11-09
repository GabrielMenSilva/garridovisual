#!/usr/bin/env node
// Gera a marca do GarridoVisual (src/assets/logo-mark.svg), favicons, ícones do manifest e og-image.
//
// A marca é a logo enviada pelo Gabriel (assets-originais/logo-garridovisual-enviada.jpg), redesenhada
// em vetor com as medidas exatas: um quadrado de 545 unidades girado 45°, feito de faixas de 77 e
// vãos de 40 — o "G" em espiral no centro e o "V" (um L) por fora. Conferida contra a imagem original
// (sobreposição de 95,6% no recorte, com a borda do JPEG borrada).
import sharp from 'sharp';
import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const OURO = '#D5A75A';
const GRAFITE = '#171717';

await mkdir('src/assets', { recursive: true });
await mkdir('public', { recursive: true });

// --- 1. Marca: duas formas num quadrado 545×545, giradas 45° ---
const FORMA_V = 'M468 0H545V545H0V468H468Z';
const FORMA_G = 'M0 0H428V77H77V351H351V194H194V234H311V311H117V117H428V428H0Z';
const ESCALA = (94 / (545 * Math.SQRT2)).toFixed(6); // o losango ocupa de 3 a 97 numa caixa 100×100

/** Grupo SVG da marca dentro de uma caixa 100×100. */
const grupo = (cor) =>
  `<g transform="translate(50 50) scale(${ESCALA}) rotate(45) translate(-272.5 -272.5)" fill="${cor}"><path d="${FORMA_V}"/><path d="${FORMA_G}"/></g>`;

const marca = (cor, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${extra}>${grupo(cor)}</svg>`;

await writeFile('src/assets/logo-mark.svg', marca('currentColor', 'role="img" aria-hidden="true"') + '\n');

// --- 2. Favicons e ícones (marca dourada sobre grafite) ---
const iconeSvg = (tam, margem) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}">
    <rect width="${tam}" height="${tam}" fill="${GRAFITE}"/>
    <g transform="translate(${margem} ${margem}) scale(${(tam - margem * 2) / 100})">
      ${grupo(OURO)}
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
      start_url: './',
      display: 'standalone',
      background_color: '#0E0E0E',
      theme_color: '#0E0E0E',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
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
