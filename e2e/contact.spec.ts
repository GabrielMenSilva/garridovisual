import { expect, test } from '@playwright/test';
import { blockExternal } from './helpers';

test.describe('contato e rodapé', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternal(page);
    await page.goto('/');
    await page.evaluate(() => document.getElementById('contato')?.scrollIntoView({ behavior: 'instant' }));
  });

  test('o WhatsApp tem o link wa.me certo, com a mensagem, abre em nova aba e com rel seguro', async ({
    page,
  }) => {
    const link = page.locator('#contato').getByRole('link', { name: /^WhatsApp .*Chamar no WhatsApp/ });
    const href = (await link.getAttribute('href')) ?? '';
    expect(href.startsWith('https://wa.me/5544991697273?text=')).toBe(true);
    expect(decodeURIComponent(href.split('text=')[1] ?? '')).toBe(
      'Olá, Garrido! Vim pelo site e gostaria de falar sobre um projeto.',
    );
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toContainText('(44) 99169-7273');
  });

  test('o Instagram aponta para o perfil certo, com rel seguro', async ({ page }) => {
    const link = page
      .locator('#contato')
      .getByRole('link', { name: /^Instagram @garridovisual .*Abrir Instagram do GarridoVisual/ });
    await expect(link).toHaveAttribute('href', 'https://www.instagram.com/garridovisual/');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toContainText('@garridovisual');
  });

  test('não há formulário nem e-mail visível', async ({ page }) => {
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  });

  test('o rodapé tem o texto exato', async ({ page }) => {
    const ano = new Date().getFullYear();
    await expect(page.getByRole('contentinfo')).toContainText(
      `© ${ano} GarridoVisual. Todos os direitos reservados.`,
    );
    await expect(page.getByRole('contentinfo').getByRole('link', { name: /Voltar ao topo/ })).toHaveAttribute(
      'href',
      '#home',
    );
  });
});
