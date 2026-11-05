import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { topOf } from './helpers';

test.describe('menu mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('abre, prende o foco, fecha com Esc e devolve o foco ao botão', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Menu' });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();

    const dialog = page.getByRole('dialog', { name: 'Menu principal' });
    await expect(dialog).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('html')).toHaveClass(/scroll-locked/);

    // o foco nunca sai do painel, mesmo apertando Tab várias vezes
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null)).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('html')).not.toHaveClass(/scroll-locked/);
  });

  test('o botão "Fechar" fecha o menu', async ({ page }) => {
    await page.getByRole('button', { name: 'Menu' }).click();
    const dialog = page.getByRole('dialog', { name: 'Menu principal' });
    await dialog.getByRole('button', { name: 'Fechar' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();
  });

  test('clicar num link fecha o menu e rola até a seção', async ({ page }) => {
    await page.getByRole('button', { name: 'Menu' }).click();
    const dialog = page.getByRole('dialog', { name: 'Menu principal' });
    await dialog.getByRole('link', { name: /Sobre/ }).click();
    await expect(dialog).toBeHidden();
    await expect.poll(() => topOf(page, 'sobre')).toBeLessThanOrEqual(71);
    await expect.poll(() => topOf(page, 'sobre')).toBeGreaterThanOrEqual(65);
    await expect(page).toHaveURL(/#sobre$/);
  });

  test('o link "Fale comigo" do menu aponta para o WhatsApp', async ({ page }) => {
    await page.getByRole('button', { name: 'Menu' }).click();
    const link = page
      .getByRole('dialog', { name: 'Menu principal' })
      .getByRole('link', { name: 'Fale comigo' });
    await expect(link).toHaveAttribute('href', /^https:\/\/wa\.me\/5544991697273\?text=/);
  });

  test('axe: sem violações com o menu aberto', async ({ page }) => {
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('dialog', { name: 'Menu principal' })).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations.map((v) => v.id)).toEqual([]);
  });
});
