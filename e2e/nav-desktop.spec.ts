import { expect, test } from '@playwright/test';
import { topOf } from './helpers';

const HEADER = 68; // --header-h = 4.25rem

test.describe('navegação (desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  for (const [label, id, top] of [
    ['Projetos', 'projetos', HEADER],
    ['Sobre', 'sobre', HEADER],
    ['Contato', 'contato', HEADER],
  ] as const) {
    test(`o link "${label}" rola até a seção, marca aria-current e atualiza o hash`, async ({ page }) => {
      const nav = page.getByRole('navigation', { name: 'Principal' });
      await nav.getByRole('link', { name: label }).click();
      await expect.poll(() => topOf(page, id)).toBeGreaterThanOrEqual(top - 3);
      await expect.poll(() => topOf(page, id)).toBeLessThanOrEqual(top + 3);
      await expect(nav.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'location');
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
    });
  }

  test('o link "Home" volta ao topo', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Principal' });
    await nav.getByRole('link', { name: 'Contato' }).click();
    await expect(nav.getByRole('link', { name: 'Contato' })).toHaveAttribute('aria-current', 'location');
    await nav.getByRole('link', { name: 'Home' }).click();
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
    await expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'location');
  });

  test('o logo leva ao início', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Sobre' }).click();
    await page.getByRole('link', { name: 'GarridoVisual, ir para o início' }).click();
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  });

  test('o header ganha fundo escuro depois de rolar', async ({ page }) => {
    const header = page.getByRole('banner');
    await expect(header).toHaveAttribute('data-scrolled', 'false');
    await page.mouse.wheel(0, 300);
    await expect(header).toHaveAttribute('data-scrolled', 'true');
  });

  test('o botão "Fale comigo" aponta para o WhatsApp', async ({ page }) => {
    const link = page.getByRole('banner').getByRole('link', { name: 'Fale comigo' });
    await expect(link).toHaveAttribute('href', /^https:\/\/wa\.me\/5544991697273\?text=/);
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

test.describe('navegação por URL', () => {
  test('abrir com #contato cai na seção de contato', async ({ page }) => {
    await page.goto('/#contato');
    await expect.poll(() => topOf(page, 'contato')).toBeLessThanOrEqual(HEADER + 3);
    await expect.poll(() => topOf(page, 'contato')).toBeGreaterThanOrEqual(HEADER - 3);
  });

  test('o link "Pular para o conteúdo" é o primeiro item focável e aparece ao receber foco', async ({
    page,
    browserName,
  }) => {
    await page.goto('/');
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(skip).toBeAttached(); // espera o React montar a página
    const first = await page.evaluate(() =>
      document.querySelector('a[href], button, [tabindex]:not([tabindex="-1"])')?.textContent?.trim(),
    );
    expect(first).toBe('Pular para o conteúdo');

    // O Safari só leva o Tab até links quando a opção do sistema está ligada;
    // no WebKit o foco é dado direto no link, no Chromium pela tecla Tab.
    if (browserName === 'webkit') await skip.focus();
    else await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await skip.press('Enter');
    await expect(page).toHaveURL(/#conteudo$/);
  });
});
