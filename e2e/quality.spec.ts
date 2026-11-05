import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
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
    await expect(dialog.getByText('1 de 8')).toBeVisible();
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

  test('não há rolagem horizontal em 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    await revealAll(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
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
