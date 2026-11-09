import { expect, test, type Locator, type Page } from '@playwright/test';
import { projetos } from '../src/data/projects';
import type { ItemVideo, Projeto } from '../src/data/schema';
import { blockExternal, collectErrors, goToProject, slideOf, videosTocando } from './helpers';

// Vídeos próprios (public/media/projetos). O Chromium e o WebKit do Playwright 1.64 decodificam
// H.264/AAC (conferido antes de escrever estes testes), então a reprodução é testada de verdade nos dois.

const comVideoProprio = projetos.filter(
  (p): p is Projeto & { videoPrincipal: ItemVideo } => p.videoPrincipal?.tipo === 'video',
);
const verticais = comVideoProprio.filter((p) => p.videoPrincipal.orientacao === 'vertical');
const horizontal = comVideoProprio.find((p) => p.videoPrincipal.orientacao === 'horizontal')!;

/** Caixa do elemento em coordenadas da página (independe da rolagem que o clique causa). */
async function caixa(loc: Locator) {
  return loc.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
  });
}

async function semRolagemHorizontal(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

/** Espera o <video> tocar de verdade: não pausado e com o tempo andando. */
async function esperaTocando(video: Locator) {
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0);
}

test.describe('vídeos próprios dos projetos', () => {
  test('há projetos com vídeo vertical e horizontal no dado', () => {
    expect(verticais.length).toBeGreaterThan(0);
    expect(horizontal).toBeTruthy();
  });

  test('vertical: moldura 9:16 sem corte, sem rolagem horizontal e sem salto ao dar play', async ({
    page,
  }) => {
    await blockExternal(page);
    await page.goto('/');
    const viewport = page.viewportSize()!;
    for (const p of verticais) {
      await goToProject(page, p.titulo);
      const slide = slideOf(page, p.titulo);
      const player = slide.getByTestId('video-player');
      const moldura = slide.getByTestId('video-moldura');
      await expect(player).toHaveAttribute('data-orientacao', 'vertical');
      const antes = await caixa(moldura);
      const { largura, altura } = p.videoPrincipal;
      expect(Math.abs(antes.width / antes.height - largura / altura)).toBeLessThan(0.02);
      if (viewport.width >= 1024) expect(antes.height).toBeLessThanOrEqual(viewport.height * 0.7 + 1);
      else expect(Math.abs(antes.width - (await caixa(player)).width)).toBeLessThanOrEqual(1); // largura total
      expect(await semRolagemHorizontal(page)).toBeLessThanOrEqual(0);

      await slide.getByRole('button', { name: `Reproduzir vídeo: ${p.titulo}` }).click();
      const video = slide.locator('video');
      await expect(video).toHaveCount(1);
      const depois = await caixa(moldura);
      // nada pula: a moldura tem o mesmo tamanho e lugar antes e depois do play
      expect(Math.abs(depois.width - antes.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(depois.height - antes.height)).toBeLessThanOrEqual(1);
      expect(Math.abs(depois.y - antes.y)).toBeLessThanOrEqual(1);
      // sem esticar: o quadro decodificado tem a proporção do manifesto e o <video> usa object-fit: contain.
      // (Proporção, não pixels: o WebKit do Playwright no Windows informa em videoWidth/videoHeight o
      // tamanho exibido, ex.: 354×630 para um arquivo 720×1280. As dimensões exatas do arquivo já são
      // conferidas pelo manifesto/zod.)
      await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.videoWidth)).toBeGreaterThan(0);
      const proporcao = await video.evaluate((v: HTMLVideoElement) => v.videoWidth / v.videoHeight);
      expect(Math.abs(proporcao - largura / altura)).toBeLessThan(0.01);
      await expect(video).toHaveCSS('object-fit', 'contain');
      expect(await semRolagemHorizontal(page)).toBeLessThanOrEqual(0);
    }
  });

  test('play monta o <video> com som e toca; trocar de slide pausa; nunca dois tocando', async ({ page }) => {
    const errors = collectErrors(page);
    await blockExternal(page);
    await page.goto('/');
    const [a, b] = comVideoProprio;
    await goToProject(page, a!.titulo);
    const slideA = slideOf(page, a!.titulo);
    await expect(slideA.locator('video')).toHaveCount(0);
    await slideA.getByRole('button', { name: `Reproduzir vídeo: ${a!.titulo}` }).click();
    const videoA = slideA.locator('video');
    await expect(videoA).toHaveAttribute('src', a!.videoPrincipal.src);
    await expect(videoA).toHaveAttribute('preload', 'metadata');
    await expect(videoA).toHaveAttribute('poster', /-poster-\d+\.jpg$/);
    await expect(videoA).toHaveAttribute('controls', '');
    await expect(videoA).toHaveAttribute('playsinline', '');
    expect(await videoA.evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
    await esperaTocando(videoA);
    expect(await videosTocando(page)).toBe(1);

    // trocar de slide pausa o vídeo (e o player volta a ser fachada)
    const handleA = await videoA.elementHandle();
    await goToProject(page, b!.titulo);
    expect(await handleA!.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    expect(await videosTocando(page)).toBe(0);
    await expect(slideA.locator('video')).toHaveCount(0);

    // o segundo toca sozinho
    const slideB = slideOf(page, b!.titulo);
    await slideB.getByRole('button', { name: `Reproduzir vídeo: ${b!.titulo}` }).click();
    await esperaTocando(slideB.locator('video'));
    expect(await videosTocando(page)).toBe(1);

    // abrir a galeria pausa o vídeo do slide
    const handleB = await slideB.locator('video').elementHandle();
    await slideB.getByRole('button', { name: /Ver galeria/ }).click();
    const dialog = page.getByRole('dialog', { name: b!.titulo });
    await expect(dialog).toBeVisible();
    expect(await handleB!.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    expect(await videosTocando(page)).toBe(0);
    expect(errors).toEqual([]);
  });

  test('só um vídeo toca por vez no site inteiro (regra global)', async ({ page }) => {
    await blockExternal(page);
    await page.goto('/');
    const p = comVideoProprio[0]!;
    await goToProject(page, p.titulo);
    const slide = slideOf(page, p.titulo);
    await slide.getByRole('button', { name: `Reproduzir vídeo: ${p.titulo}` }).click();
    await esperaTocando(slide.locator('video'));
    // um segundo vídeo qualquer começa a tocar: o primeiro tem de pausar sozinho
    await page.evaluate(async (src) => {
      const v = document.createElement('video');
      v.id = 'segundo';
      v.muted = true;
      v.src = src;
      document.body.append(v);
      await v.play();
    }, comVideoProprio[1]!.videoPrincipal.src);
    await expect.poll(() => slide.locator('video').evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    expect(await videosTocando(page)).toBe(1);
    await page.evaluate(() => document.getElementById('segundo')?.remove());
  });

  test('galeria: o vídeo toca no visor; Esc volta à grade e pausa; Esc fecha e devolve o foco', async ({
    page,
  }) => {
    await blockExternal(page);
    await page.goto('/');
    await goToProject(page, horizontal.titulo);
    const trigger = slideOf(page, horizontal.titulo).getByRole('button', { name: /Ver galeria/ });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: horizontal.titulo });
    const itens = dialog.locator('ul > li > button');
    await expect(itens).toHaveCount(horizontal.galeria.length);
    const primeiro = horizontal.galeria[0] as ItemVideo;
    await expect(itens.first()).toHaveAccessibleName(
      `Abrir vídeo: ${primeiro.titulo}, duração ${Math.floor(Math.round(primeiro.duracao) / 60)}:${String(Math.round(primeiro.duracao) % 60).padStart(2, '0')}`,
    );
    await expect(itens.first()).toContainText(/\d+:\d\d/); // selo de duração

    await itens.first().click();
    await expect(dialog.getByText(`1 de ${horizontal.galeria.length}`)).toBeVisible();
    await dialog.getByRole('button', { name: `Reproduzir vídeo: ${primeiro.titulo}` }).click();
    const video = dialog.locator('video');
    await esperaTocando(video);
    expect(await videosTocando(page)).toBe(1);
    const handle = await video.elementHandle();

    await page.keyboard.press('Escape'); // visor → grade
    await expect(dialog).toBeVisible();
    await expect(itens).toHaveCount(horizontal.galeria.length);
    expect(await handle!.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    expect(await videosTocando(page)).toBe(0);

    await page.keyboard.press('Escape'); // grade → fecha
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('galeria: trocar de item pausa o vídeo e navega por todos os itens', async ({ page }) => {
    await blockExternal(page);
    await page.goto('/');
    const p = projetos.find((x) => x.galeria.filter((g) => g.tipo === 'video').length > 1)!;
    const total = p.galeria.length;
    await goToProject(page, p.titulo);
    await slideOf(page, p.titulo)
      .getByRole('button', { name: /Ver galeria/ })
      .click();
    const dialog = page.getByRole('dialog', { name: p.titulo });
    await dialog.locator('ul > li > button').first().click();
    await dialog.getByRole('button', { name: /^Reproduzir vídeo/ }).click();
    await esperaTocando(dialog.locator('video'));
    for (let k = 2; k <= total; k++) {
      await dialog.getByRole('button', { name: 'Próximo' }).click();
      await expect(dialog.getByText(`${k} de ${total}`)).toBeVisible();
      expect(await videosTocando(page)).toBe(0);
    }
  });

  test('vídeos que esperam o YouTube/Vimeo mostram só o poster com "Vídeo em breve"', async ({ page }) => {
    const ehPendente = (g: Projeto['galeria'][number]) =>
      g.tipo !== 'foto' && g.tipo !== 'video' && g.id === 'TODO';
    await blockExternal(page);
    await page.goto('/');
    // hoje: os dois vídeos do MG Natação que passam de 24 MB (ver docs/site-garridovisual.md)
    for (const p of projetos.filter((x) => x.galeria.some(ehPendente))) {
      await goToProject(page, p.titulo);
      const trigger = slideOf(page, p.titulo).getByRole('button', { name: /Ver galeria/ });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: p.titulo });
      const botoes = dialog.getByRole('button', { name: /^Abrir vídeo \(em breve\)/ });
      await expect(botoes).toHaveCount(p.galeria.filter(ehPendente).length);
      await botoes.first().click();
      await expect(dialog.getByText('Vídeo em breve')).toBeVisible();
      await expect(dialog.getByRole('button', { name: /^Reproduzir/ })).toHaveCount(0);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    }
  });
});
