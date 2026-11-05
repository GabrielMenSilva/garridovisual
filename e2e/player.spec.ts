import { expect, test } from '@playwright/test';
import { blockExternal, goToProject, slideOf } from './helpers';

// Este arquivo roda no build de testes (vite build --mode e2e), com vídeos fictícios
// do YouTube nos dois primeiros projetos. Nenhuma requisição externa de verdade sai daqui.
test.use({ baseURL: 'http://localhost:4174' });

test.describe('player de vídeo com fachada', () => {
  test('não carrega o YouTube antes do clique e só o slide ativo tem player', async ({ page }) => {
    const external = await blockExternal(page);
    await page.goto('/');
    await page.evaluate(() => document.getElementById('projetos')?.scrollIntoView({ behavior: 'instant' }));
    await expect(
      slideOf(page, 'Hey Maringá').getByRole('button', { name: 'Reproduzir vídeo: Hey Maringá' }),
    ).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(external).toEqual([]);
  });

  test('clicar no play monta o iframe youtube-nocookie; trocar de slide para o vídeo', async ({ page }) => {
    const external = await blockExternal(page);
    await page.goto('/');
    await page.evaluate(() => document.getElementById('projetos')?.scrollIntoView({ behavior: 'instant' }));

    await slideOf(page, 'Hey Maringá').getByRole('button', { name: 'Reproduzir vídeo: Hey Maringá' }).click();
    const frame = page.locator('#projetos iframe');
    await expect(frame).toHaveCount(1);
    const src = (await frame.getAttribute('src')) ?? '';
    expect(new URL(src).origin).toBe('https://www.youtube-nocookie.com');
    expect(new URL(src).searchParams.get('autoplay')).toBe('1');

    // próximo slide: o player do anterior desmonta, e o novo só aparece como fachada
    await page.getByRole('button', { name: 'Próximo projeto' }).click();
    await expect(slideOf(page, 'El Piratas')).not.toHaveAttribute('inert', '');
    await expect(page.locator('#projetos iframe')).toHaveCount(0);
    await expect(
      slideOf(page, 'El Piratas').getByRole('button', { name: 'Reproduzir vídeo: El Piratas' }),
    ).toBeVisible();

    // toca o segundo: continua só um player
    await slideOf(page, 'El Piratas').getByRole('button', { name: 'Reproduzir vídeo: El Piratas' }).click();
    await expect(page.locator('#projetos iframe')).toHaveCount(1);

    // volta ao primeiro: o segundo para
    await page.getByRole('button', { name: 'Projeto anterior' }).click();
    await expect(page.locator('#projetos iframe')).toHaveCount(0);

    // a única coisa que tentou sair foi o YouTube sem cookies (bloqueado pelo teste)
    expect(external.length).toBeGreaterThan(0);
    for (const url of external) expect(new URL(url).origin).toBe('https://www.youtube-nocookie.com');
  });

  test('projetos sem vídeo continuam com "Vídeo em breve" e sem play', async ({ page }) => {
    await blockExternal(page);
    await page.goto('/');
    await goToProject(page, 'Ody Park');
    await expect(slideOf(page, 'Ody Park').getByText('Vídeo em breve')).toBeVisible();
    await expect(slideOf(page, 'Ody Park').getByRole('button', { name: /Reproduzir/ })).toHaveCount(0);
  });
});
