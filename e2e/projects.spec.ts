import { expect, test } from '@playwright/test';
import { goToProject, slideOf } from './helpers';

test.describe('slider de projetos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.getElementById('projetos')?.scrollIntoView({ behavior: 'instant' }));
  });

  test('tem a marcação de carrossel acessível e 6 slides', async ({ page }) => {
    const region = page.locator('#projetos [aria-roledescription="carousel"]');
    await expect(region).toHaveAttribute('role', 'region');
    await expect(region).toHaveAttribute('aria-label', 'Projetos');
    await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    await expect(page.locator('[aria-roledescription="slide"]')).toHaveCount(6);
    await expect(page.locator('[aria-roledescription="slide"]').first()).toHaveAttribute(
      'aria-label',
      '1 de 6',
    );
  });

  test('só o slide ativo é alcançável (os outros ficam inert)', async ({ page }) => {
    await expect(slideOf(page, 'Hey Maringá')).not.toHaveAttribute('inert', '');
    await expect(slideOf(page, 'El Piratas')).toHaveAttribute('inert', '');
    await expect(slideOf(page, 'Heitor Amatsu')).toHaveAttribute('inert', '');
  });

  test('Próximo e Anterior trocam o slide e o contador', async ({ page }) => {
    const counter = page.locator('[aria-live="polite"]').filter({ hasText: /de 6/ }).first();
    const prev = page.getByRole('button', { name: 'Projeto anterior' });
    const next = page.getByRole('button', { name: 'Próximo projeto' });

    await expect(counter).toContainText('1 de 6');
    await expect(prev).toBeDisabled();

    await next.click();
    await expect(counter).toContainText('2 de 6');
    await expect(slideOf(page, 'El Piratas')).not.toHaveAttribute('inert', '');
    await expect(slideOf(page, 'Hey Maringá')).toHaveAttribute('inert', '');

    await prev.click();
    await expect(counter).toContainText('1 de 6');
  });

  test('os pontos e as miniaturas levam ao projeto escolhido', async ({ page }) => {
    const counter = page.locator('[aria-live="polite"]').filter({ hasText: /de 6/ }).first();
    await page
      .getByRole('group', { name: 'Escolher projeto' })
      .getByRole('button', { name: 'Ir para Ody Park' })
      .click();
    await expect(counter).toContainText('3 de 6');
    await expect(
      page.getByRole('group', { name: 'Escolher projeto' }).getByRole('button', { name: 'Ir para Ody Park' }),
    ).toHaveAttribute('aria-current', 'true');

    await page
      .getByRole('list', { name: 'Miniaturas dos projetos' })
      .getByRole('button', { name: 'MK5 Arquitetos' })
      .click();
    await expect(counter).toContainText('5 de 6');
    await expect(slideOf(page, 'MK5 Arquitetos')).not.toHaveAttribute('inert', '');
  });

  test('as setas do teclado trocam o slide quando o foco está no carrossel', async ({ page }) => {
    const counter = page.locator('[aria-live="polite"]').filter({ hasText: /de 6/ }).first();
    await page.getByRole('button', { name: 'Próximo projeto' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(counter).toContainText('2 de 6');
    await page.keyboard.press('ArrowRight');
    await expect(counter).toContainText('3 de 6');
    await page.keyboard.press('ArrowLeft');
    await expect(counter).toContainText('2 de 6');
  });

  test('sem vídeo, o slide mostra "Vídeo em breve" e nenhum botão de play', async ({ page }) => {
    await expect(page.getByText('Vídeo em breve').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Reproduzir vídeo/ })).toHaveCount(0);
    await expect(page.locator('#projetos iframe')).toHaveCount(0);
  });

  test('o projeto do Heitor Amatsu tem o link do Instagram dele com rel seguro', async ({ page }) => {
    await goToProject(page, 'Heitor Amatsu');
    const link = slideOf(page, 'Heitor Amatsu').getByRole('link', { name: /Instagram do Heitor Amatsu/ });
    await expect(link).toHaveAttribute('href', 'https://www.instagram.com/heitoramatsu/');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

test.describe('galeria', () => {
  test('o casamento abre a galeria com as 8 fotos; navegar, Esc e foco de volta', async ({ page }) => {
    await page.goto('/');
    await goToProject(page, 'Juliana & Márcio');
    const trigger = slideOf(page, 'Juliana & Márcio').getByRole('button', { name: /Ver galeria/ });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Juliana & Márcio' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^Ampliar:/ })).toHaveCount(8);
    await expect(page.locator('html')).toHaveClass(/scroll-locked/);

    // abre a primeira foto ampliada e navega
    await dialog.getByRole('button', { name: /foto 1 de 8/ }).click();
    await expect(dialog.getByRole('img', { name: /foto 1 de 8/ })).toBeVisible();
    await expect(dialog.getByText('1 de 8')).toBeVisible();
    await dialog.getByRole('button', { name: 'Próximo' }).click();
    await expect(dialog.getByText('2 de 8')).toBeVisible();
    await dialog.getByRole('button', { name: 'Anterior' }).click();
    await dialog.getByRole('button', { name: 'Anterior' }).click();
    await expect(dialog.getByText('8 de 8')).toBeVisible(); // volta ao fim
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByText('1 de 8')).toBeVisible();

    // Esc na imagem ampliada volta para a grade; Esc na grade fecha
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^Ampliar:/ })).toHaveCount(8);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator('html')).not.toHaveClass(/scroll-locked/);
  });

  test('fecha pelo botão "Fechar" e devolve o foco', async ({ page }) => {
    await page.goto('/');
    await goToProject(page, 'Juliana & Márcio');
    const trigger = slideOf(page, 'Juliana & Márcio').getByRole('button', { name: /Ver galeria/ });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Juliana & Márcio' });
    await dialog.getByRole('button', { name: 'Fechar' }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('fecha ao clicar no fundo', async ({ page }) => {
    await page.goto('/');
    await goToProject(page, 'Juliana & Márcio');
    await slideOf(page, 'Juliana & Márcio')
      .getByRole('button', { name: /Ver galeria/ })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Juliana & Márcio' });
    await expect(dialog).toBeVisible();
    await page.mouse.click(4, 4); // canto da tela: fora do diálogo, em cima do fundo
    await expect(dialog).toBeHidden();
  });

  test('projeto sem mídia extra: a galeria mostra a capa e o botão continua existindo', async ({ page }) => {
    await page.goto('/');
    await goToProject(page, 'El Piratas');
    await slideOf(page, 'El Piratas')
      .getByRole('button', { name: /Ver galeria/ })
      .click();
    const dialog = page.getByRole('dialog', { name: 'El Piratas' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^Ampliar:/ })).toHaveCount(1);
  });
});
