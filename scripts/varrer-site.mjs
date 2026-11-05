#!/usr/bin/env node
// Varre o site de referência (Wix) renderizado e lista imagens, vídeos, iframes e textos.
// Uso: node scripts/varrer-site.mjs  → grava assets-originais/varredura.json
import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';

const BASE = 'https://eduardogarridoguil.wixsite.com/my-site';
const PAGINAS = [
  { nome: 'home', url: `${BASE}` },
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ nome: `projeto-${n}`, url: `${BASE}/pagina-de-projeto-${n}` })),
];

const browser = await chromium.launch();
const resultado = {};

for (const pagina of PAGINAS) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const rede = new Set();
  page.on('response', (r) => {
    const u = r.url();
    if (/video\.wixstatic\.com|\.mp4|\.webm|\.m3u8|youtube|vimeo/i.test(u)) rede.add(u);
  });
  try {
    await page.goto(pagina.url, { waitUntil: 'load', timeout: 90000 });
    // rola até o fim para disparar carregamentos preguiçosos
    await page.evaluate(async () => {
      await new Promise((ok) => {
        let y = 0;
        const t = setInterval(() => {
          window.scrollBy(0, 600);
          y += 600;
          if (y >= document.body.scrollHeight + 600) { clearInterval(t); ok(); }
        }, 250);
      });
    });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    const dom = await page.evaluate(() => {
      const abs = (u) => { try { return new URL(u, location.href).href; } catch { return u; } };
      const imgs = [...document.querySelectorAll('img')].map((i) => ({ src: abs(i.currentSrc || i.src), alt: i.alt }));
      const sources = [...document.querySelectorAll('source')].map((s) => abs(s.src || s.srcset));
      const videos = [...document.querySelectorAll('video')].map((v) => ({ src: abs(v.currentSrc || v.src), poster: v.poster }));
      const iframes = [...document.querySelectorAll('iframe')].map((f) => abs(f.src));
      const bgs = [...document.querySelectorAll('*')]
        .map((el) => getComputedStyle(el).backgroundImage)
        .filter((b) => b && b !== 'none')
        .map((b) => b.replace(/^url\("?|"?\)$/g, ''));
      const texto = document.body.innerText.replace(/\n{3,}/g, '\n\n').trim();
      return { imgs, sources, videos, iframes, bgs, texto };
    });
    resultado[pagina.nome] = { url: pagina.url, ...dom, redeVideo: [...rede] };
    console.log(`ok ${pagina.nome}: ${dom.imgs.length} img, ${dom.videos.length} video, ${dom.iframes.length} iframe, ${rede.size} rede-video`);
  } catch (e) {
    resultado[pagina.nome] = { url: pagina.url, erro: String(e) };
    console.error(`falhou ${pagina.nome}: ${e}`);
  }
  await page.close();
}
await browser.close();
await mkdir('assets-originais', { recursive: true });
await writeFile('assets-originais/varredura.json', JSON.stringify(resultado, null, 2));
