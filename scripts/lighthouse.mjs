#!/usr/bin/env node
// Roda o Lighthouse (perfil móvel padrão: Moto G Power, 4G lento simulado) no que está servido.
// Uso: pnpm build && pnpm preview   (em outro terminal)   e então   pnpm lighthouse [url] [rodadas]
// O Chromium é aberto pelo Playwright (o chrome-launcher do Lighthouse falha em alguns Windows).
import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';

const url = process.argv[2] ?? 'http://localhost:4173/';
const rodadas = Number(process.argv[3] ?? 3);
const PORT = 9333;

const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
const resultados = [];
try {
  for (let i = 0; i < rodadas; i++) {
    const r = await lighthouse(url, {
      port: PORT,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    const lhr = r.lhr;
    const n = (id) => lhr.audits[id]?.numericValue;
    resultados.push({
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
      lcpMs: Math.round(n('largest-contentful-paint')),
      cls: Number(n('cumulative-layout-shift').toFixed(3)),
      tbtMs: Math.round(n('total-blocking-time')),
      fcpMs: Math.round(n('first-contentful-paint')),
      totalKB: Math.round(n('total-byte-weight') / 1024),
      falhas: Object.values(lhr.audits)
        .filter(
          (a) =>
            a.score !== null &&
            a.score < 0.9 &&
            a.scoreDisplayMode !== 'informative' &&
            a.scoreDisplayMode !== 'manual' &&
            a.scoreDisplayMode !== 'notApplicable',
        )
        .map((a) => `${a.id} (${a.displayValue ?? a.score})`),
    });
    if (i === rodadas - 1) {
      await mkdir('lighthouse', { recursive: true });
      await writeFile('lighthouse/ultimo-relatorio.json', r.report);
    }
  }
} finally {
  await browser.close();
}

const mediana = (k) => {
  const v = resultados.map((r) => r[k]).sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
};
console.table(resultados.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'falhas'))));
console.log(
  'Mediana:',
  Object.fromEntries(
    ['performance', 'accessibility', 'bestPractices', 'seo', 'lcpMs', 'cls', 'tbtMs', 'totalKB'].map((k) => [
      k,
      mediana(k),
    ]),
  ),
);
console.log('Auditorias abaixo de 0,9 (última rodada):', resultados.at(-1).falhas);
