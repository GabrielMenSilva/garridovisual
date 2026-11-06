import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { projetos } from '../src/data/projects';
import { blockExternal, collectErrors, goToProject, revealAll, settle, slideOf } from './helpers';

async function axe(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
}

test.describe('qualidade', () => {
  test('axe: sem violações na página inteira', async ({ page }) => {
    await blockExternal(page);
    await page.goto('/');
    await revealAll(page);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await settle(page);
    expect(await axe(page)).toEqual([]);
  });

  test('axe: sem violações com a galeria aberta (grade e imagem ampliada)', async ({ page }) => {
    await blockExternal(page);
    await page.goto('/');
    await goToProject(page, 'Juliana & Márcio');
    await slideOf(page, 'Juliana & Márcio')
      .getByRole('button', { name: /Ver galeria/ })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Juliana & Márcio' });
    await expect(dialog).toBeVisible();
    await settle(page);
    expect(await axe(page)).toEqual([]);
    await dialog.getByRole('button', { name: /foto 1 de 8/ }).click();
    await expect(dialog.getByRole('img', { name: /foto 1 de 8/ })).toBeVisible();
    await settle(page);
    expect(await axe(page)).toEqual([]);
  });

  test('axe: sem violações com a galeria de fotos novas e com um vídeo tocando no visor', async ({
    page,
  }) => {
    await blockExternal(page);
    await page.goto('/');
    const comFotos = projetos.find((p) => p.galeria.filter((g) => g.tipo === 'foto').length > 20)!;
    await goToProject(page, comFotos.titulo);
    await slideOf(page, comFotos.titulo)
      .getByRole('button', { name: /Ver galeria/ })
      .click();
    let dialog = page.getByRole('dialog', { name: comFotos.titulo });
    await expect(dialog).toBeVisible();
    await settle(page);
    expect(await axe(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    const comVideo = projetos.find((p) => p.videoPrincipal?.tipo === 'video')!;
    await goToProject(page, comVideo.titulo);
    // fachada do vídeo no slide
    await settle(page);
    expect(await axe(page)).toEqual([]);
    await slideOf(page, comVideo.titulo)
      .getByRole('button', { name: /Ver galeria/ })
      .click();
    dialog = page.getByRole('dialog', { name: comVideo.titulo });
    await dialog.locator('ul > li > button').first().click();
    await dialog.getByRole('button', { name: /^Reproduzir vídeo/ }).click();
    await expect(dialog.locator('video')).toHaveCount(1);
    await settle(page);
    expect(await axe(page)).toEqual([]);
  });

  test('sem erros de console nem exceções, e nenhuma requisição para domínio externo', async ({ page }) => {
    const errors = collectErrors(page);
    const external = await blockExternal(page);
    await page.goto('/');
    await revealAll(page);
    await goToProject(page, 'Juliana & Márcio');
    await slideOf(page, 'Juliana & Márcio')
      .getByRole('button', { name: /Ver galeria/ })
      .click();
    await expect(page.getByRole('dialog', { name: 'Juliana & Márcio' })).toBeVisible();
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });

  test('a mídia bruta (videos e fotos) e o .cache nunca são servidos nem pedidos', async ({
    page,
    request,
  }) => {
    const pedidos: string[] = [];
    page.on('request', (r) => pedidos.push(decodeURIComponent(r.url())));
    await blockExternal(page);
    await page.goto('/');
    await revealAll(page);
    const p = projetos.find((x) => x.videoPrincipal?.tipo === 'video')!;
    await goToProject(page, p.titulo);
    await slideOf(page, p.titulo)
      .getByRole('button', { name: `Reproduzir vídeo: ${p.titulo}` })
      .click();
    await expect(slideOf(page, p.titulo).locator('video')).toHaveCount(1);
    expect(pedidos.filter((u) => /videos e fotos|\/\.cache\//.test(u))).toEqual([]);
    // pedir direto também não entrega nada (o preview cai no index.html, nunca no arquivo bruto)
    for (const caminho of ['/videos%20e%20fotos/barberaria.mp4', '/.cache/media/index.json']) {
      const r = await request.get(caminho);
      expect(r.headers()['content-type'] ?? '').not.toMatch(/video|json/);
      expect((await r.body()).length).toBeLessThan(500_000);
    }
  });

  test('não há rolagem horizontal em 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    await revealAll(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    // e continua sem rolagem com um vídeo vertical na tela
    const vertical = projetos.find(
      (p) => p.videoPrincipal?.tipo === 'video' && p.videoPrincipal.orientacao === 'vertical',
    );
    if (vertical) {
      await goToProject(page, vertical.titulo);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(0);
    }
  });

  test('Sobre: sem foto do Garrido, mostra o bloco "GV" decorativo em 4:5', async ({ page }) => {
    await page.goto('/');
    const sobre = page.locator('#sobre');
    await expect(sobre.locator('img')).toHaveCount(0); // ainda não há retrato na pasta
    const bloco = sobre.locator('[aria-hidden="true"]', { hasText: 'GV' }).first();
    await expect(bloco).toBeAttached();
    const box = await bloco.boundingBox();
    expect(Math.abs(box!.width / box!.height - 4 / 5)).toBeLessThan(0.02);
  });

  test('há um único h1 e a hierarquia de títulos é coerente', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main h2')).toHaveText(['Projetos', 'Sobre', 'Contato']);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.locator('header, nav, main, footer').first()).toBeAttached();
  });

  test('tem os metadados de SEO esperados', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/GarridoVisual — Filmmaker, Fotógrafo e Editor em Maringá, PR/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Maringá/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/.+\/$/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.jpg$/);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0E0E0E');
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
    expect(ld['@type']).toBe('ProfessionalService');
    expect(ld.telephone).toBe('+5544991697273');
    expect(ld.sameAs).toContain('https://www.instagram.com/garridovisual/');
  });
});
