import { expect, test, type Page } from '@playwright/test';

const currentTime = (page: Page) =>
  page.evaluate(() => document.querySelector<HTMLVideoElement>('#home video')?.currentTime ?? -1);

/** O navegador consegue decodificar o MP4 H.264 do hero? (o WebKit do Playwright no Windows pode não conseguir) */
const canDecode = (page: Page) =>
  page.evaluate(() => document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"') !== '');

test.describe('hero com vídeo no scroll', () => {
  test('mostra o nome, a função e o botão "Ver projetos"', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'GarridoVisual' })).toBeVisible();
    await expect(page.getByText('Filmmaker, Fotógrafo e Editor').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver projetos' }).first()).toBeVisible();
  });

  test('ao rolar 0 → 50% → 100% da seção, o currentTime do vídeo aumenta', async ({ page }) => {
    await page.goto('/');
    if (!(await canDecode(page))) {
      // sem decodificador: cai no poster, sem scrub e sem quebrar a página
      await expect(page.locator('#home')).toHaveAttribute('data-scrub', 'false');
      await expect(page.getByRole('heading', { level: 1, name: 'GarridoVisual' })).toBeVisible();
      return;
    }
    const video = page.locator('#home video');
    await expect(video).toBeAttached();
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThanOrEqual(2);
    const duration = await video.evaluate((v: HTMLVideoElement) => v.duration);
    expect(duration).toBeGreaterThan(1);

    const scrollTo = (fraction: number) =>
      page.evaluate((f) => {
        const home = document.getElementById('home') as HTMLElement;
        window.scrollTo({ top: (home.offsetHeight - window.innerHeight) * f, behavior: 'instant' });
      }, fraction);

    await scrollTo(0);
    await expect.poll(() => currentTime(page)).toBeLessThan(0.2);

    await scrollTo(0.5);
    await expect.poll(() => currentTime(page)).toBeGreaterThan(duration * 0.35);
    await expect.poll(() => currentTime(page)).toBeLessThan(duration * 0.65);
    const middle = await currentTime(page);

    await scrollTo(1);
    await expect.poll(() => currentTime(page)).toBeGreaterThan(duration * 0.85);
    expect(await currentTime(page)).toBeGreaterThan(middle);

    // e volta
    await scrollTo(0);
    await expect.poll(() => currentTime(page)).toBeLessThan(duration * 0.1);
  });

  test('o indicador "role para explorar" some no primeiro scroll', async ({ page }) => {
    await page.goto('/');
    if (!(await canDecode(page))) return; // sem scrub, sem indicador (coberto no teste acima)
    const hint = page.getByText('Role para explorar');
    await expect(hint).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'instant' }));
    await expect
      .poll(() => hint.evaluate((el) => Number(getComputedStyle(el.parentElement as HTMLElement).opacity)))
      .toBeLessThan(0.05);
  });
});

test.describe('hero com movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('não monta o vídeo, mostra o poster e deixa a altura normal', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home video')).toHaveCount(0);
    await expect(page.locator('#home')).toHaveAttribute('data-scrub', 'false');
    const poster = page.locator('#home img').first();
    await expect(poster).toBeVisible();
    const { sectionH, vh } = await page.evaluate(() => ({
      sectionH: (document.getElementById('home') as HTMLElement).offsetHeight,
      vh: window.innerHeight,
    }));
    expect(Math.abs(sectionH - vh)).toBeLessThanOrEqual(2);
    await expect(page.getByRole('heading', { level: 1, name: 'GarridoVisual' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver projetos' }).first()).toBeVisible();
    await expect(page.getByText('Role para explorar')).toHaveCount(0);
  });
});

test.describe('hero sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('mostra o texto e os botões de contato', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'GarridoVisual' })).toBeVisible();
    await expect(page.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute(
      'href',
      /wa\.me\/5544991697273/,
    );
    await expect(page.getByRole('link', { name: /Instagram/ })).toBeVisible();
  });
});
