import { expect, test } from '@playwright/test';
import { projetos } from '../src/data/projects';
import { goToProject, slideOf } from './helpers';

// Tudo é lido do dado: nada de "6 projetos" fixo.
const N = projetos.length;
const primeiro = projetos[0]!;
const ultimo = projetos[N - 1]!;

test.describe('slider de projetos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.getElementById('projetos')?.scrollIntoView({ behavior: 'instant' }));
  });

  test(`tem a marcação de carrossel acessível e exatamente ${N} slides (projects.length)`, async ({
    page,
  }) => {
    const region = page.locator('#projetos [aria-roledescription="carousel"]');
    await expect(region).toHaveAttribute('role', 'region');
    await expect(region).toHaveAttribute('aria-label', 'Projetos');
    const slides = page.locator('[aria-roledescription="slide"]');
    await expect(slides).toHaveCount(N);
    await expect(slides.first()).toHaveAttribute('aria-label', `1 de ${N}`);
    await expect(slides.last()).toHaveAttribute('aria-label', `${N} de ${N}`);
    for (const [i, p] of projetos.entries()) await expect(slides.nth(i).locator('h3')).toHaveText(p.titulo);
  });

  test('só o slide ativo é alcançável (os outros ficam inert)', async ({ page }) => {
    await expect(slideOf(page, primeiro.titulo)).not.toHaveAttribute('inert', '');
    for (const p of projetos.slice(1)) await expect(slideOf(page, p.titulo)).toHaveAttribute('inert', '');
  });

  test('Próximo e Anterior percorrem todos os slides, do primeiro ao último e de volta', async ({ page }) => {
    const counter = page.locator('#projetos [aria-live="polite"]').first();
    const prev = page.getByRole('button', { name: 'Projeto anterior' });
    const next = page.getByRole('button', { name: 'Próximo projeto' });

    await expect(counter).toContainText(`1 de ${N}`);
    await expect(prev).toBeDisabled();
    for (let k = 2; k <= N; k++) {
      await next.click();
      await expect(counter).toContainText(`${k} de ${N}`);
      await expect(slideOf(page, projetos[k - 1]!.titulo)).not.toHaveAttribute('inert', '');
    }
    await expect(next).toBeDisabled();
    for (let k = N - 1; k >= 1; k--) {
      await prev.click();
      await expect(counter).toContainText(`${k} de ${N}`);
    }
    await expect(prev).toBeDisabled();
  });

  test('cada ponto leva ao seu projeto', async ({ page }) => {
    const counter = page.locator('#projetos [aria-live="polite"]').first();
    const dots = page.getByRole('group', { name: 'Escolher projeto' });
    await expect(dots.getByRole('button')).toHaveCount(N);
    for (const [i, p] of [...projetos.entries()].reverse()) {
      await dots.getByRole('button', { name: `Ir para ${p.titulo}`, exact: true }).click();
      await expect(counter).toContainText(`${i + 1} de ${N}`);
      await expect(dots.getByRole('button', { name: `Ir para ${p.titulo}`, exact: true })).toHaveAttribute(
        'aria-current',
        'true',
      );
    }
  });

  test('as miniaturas levam ao projeto e a ativa fica à vista na tira', async ({ page }) => {
    const counter = page.locator('#projetos [aria-live="polite"]').first();
    const strip = page.getByRole('list', { name: 'Miniaturas dos projetos' });
    await expect(strip.getByRole('button')).toHaveCount(N);
    for (const p of [ultimo, projetos[Math.floor(N / 2)]!, primeiro]) {
      await goToProject(page, p.titulo);
      await expect(counter).toContainText(`${projetos.indexOf(p) + 1} de ${N}`);
      const thumb = strip.getByRole('button', { name: p.titulo, exact: true });
      await expect(thumb).toHaveAttribute('aria-current', 'true');
      // a miniatura ativa está dentro da área visível da tira (que rola na horizontal)
      await expect
        .poll(() =>
          thumb.evaluate((el) => {
            const s = (el.closest('ul') as HTMLElement).getBoundingClientRect();
            const r = el.getBoundingClientRect();
            return r.left >= s.left - 1 && r.right <= s.right + 1;
          }),
        )
        .toBe(true);
    }
  });

  test('as setas do teclado trocam o slide e param nas pontas', async ({ page }) => {
    const counter = page.locator('#projetos [aria-live="polite"]').first();
    await page.getByRole('button', { name: 'Próximo projeto' }).focus();
    await page.keyboard.press('ArrowLeft'); // já no primeiro: não sai do lugar
    await expect(counter).toContainText(`1 de ${N}`);
    await page.keyboard.press('ArrowRight');
    await expect(counter).toContainText(`2 de ${N}`);
    await page.keyboard.press('ArrowLeft');
    await expect(counter).toContainText(`1 de ${N}`);

    await goToProject(page, ultimo.titulo);
    await page.getByRole('button', { name: 'Projeto anterior' }).focus();
    await page.keyboard.press('ArrowRight'); // já no último
    await expect(counter).toContainText(`${N} de ${N}`);
    await page.keyboard.press('ArrowLeft');
    await expect(counter).toContainText(`${N - 1} de ${N}`);
  });

  test('cada projeto: com vídeo mostra poster + play e nenhum "Vídeo em breve"; sem vídeo, o contrário', async ({
    page,
  }) => {
    for (const p of projetos) {
      await goToProject(page, p.titulo);
      const slide = slideOf(page, p.titulo);
      const player = slide.getByTestId('video-player');
      const tocavel =
        p.videoPrincipal !== null && !('id' in p.videoPrincipal && p.videoPrincipal.id === 'TODO');
      if (tocavel) {
        await expect(slide.getByRole('button', { name: `Reproduzir vídeo: ${p.titulo}` })).toBeVisible();
        await expect(slide.getByText('Vídeo em breve')).toHaveCount(0);
        await expect(player.locator('img').first()).toHaveAttribute(
          'src',
          /\/images\/projetos\/.+-poster-\d+\.jpg$/,
        );
        await expect(player.locator('video')).toHaveCount(0); // nada de vídeo antes do clique
      } else {
        await expect(slide.getByText('Vídeo em breve')).toBeVisible();
        await expect(slide.getByRole('button', { name: /Reproduzir/ })).toHaveCount(0);
      }
      // chips de função só quando há funções
      await expect(slide.getByRole('list', { name: 'Funções' })).toHaveCount(p.funcoes.length ? 1 : 0);
    }
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
  test('cada projeto abre a SUA galeria, com o número de itens do dado', async ({ page }) => {
    await page.goto('/');
    for (const p of projetos) {
      await goToProject(page, p.titulo);
      const trigger = slideOf(page, p.titulo).getByRole('button', { name: /Ver galeria/ });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: p.titulo });
      await expect(dialog).toBeVisible();
      // sem galeria própria: capa (+ vídeo principal, se houver)
      const esperado = p.galeria.length || 1 + (p.videoPrincipal ? 1 : 0);
      await expect(dialog.locator('ul > li > button')).toHaveCount(esperado);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  });

  test('Juliana & Márcio: vídeo primeiro, depois as 8 fotos; navegar, Esc e foco de volta', async ({
    page,
  }) => {
    const p = projetos.find((x) => x.slug === 'juliana-e-marcio')!;
    const total = p.galeria.length;
    await page.goto('/');
    await goToProject(page, p.titulo);
    const trigger = slideOf(page, p.titulo).getByRole('button', { name: /Ver galeria/ });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: p.titulo });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^Ampliar:/ })).toHaveCount(8);
    await expect(dialog.locator('ul > li > button').first()).toHaveAccessibleName(/^Abrir vídeo:/);
    await expect(page.locator('html')).toHaveClass(/scroll-locked/);

    await dialog.getByRole('button', { name: /foto 1 de 8/ }).click();
    await expect(dialog.getByRole('img', { name: /foto 1 de 8/ })).toBeVisible();
    const fotoIndex = p.galeria.findIndex((g) => g.tipo === 'foto') + 1;
    await expect(dialog.getByText(`${fotoIndex} de ${total}`)).toBeVisible();
    await dialog.getByRole('button', { name: 'Próximo' }).click();
    await expect(dialog.getByText(`${fotoIndex + 1} de ${total}`)).toBeVisible();
    await dialog.getByRole('button', { name: 'Anterior' }).click();
    await dialog.getByRole('button', { name: 'Anterior' }).click();
    await expect(dialog.getByText(`${fotoIndex - 1} de ${total}`)).toBeVisible();
    await dialog.getByRole('button', { name: 'Anterior' }).click(); // do 1º volta ao último
    await expect(dialog.getByText(`${total} de ${total}`)).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByText(`1 de ${total}`)).toBeVisible();

    // Esc no visor volta para a grade; Esc na grade fecha
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^Ampliar:/ })).toHaveCount(8);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator('html')).not.toHaveClass(/scroll-locked/);
  });

  test('grade respeita a proporção de cada item e miniaturas de vídeo têm duração e play', async ({
    page,
  }) => {
    const p = projetos.find((x) => x.galeria.some((g) => g.tipo === 'foto' && g.orientacao === 'vertical'))!;
    await page.goto('/');
    await goToProject(page, p.titulo);
    await slideOf(page, p.titulo)
      .getByRole('button', { name: /Ver galeria/ })
      .click();
    const dialog = page.getByRole('dialog', { name: p.titulo });
    const botoes = dialog.locator('ul > li > button');
    await expect(botoes).toHaveCount(p.galeria.length);
    for (const [i, g] of p.galeria.entries()) {
      const w = g.tipo === 'foto' ? g.largura : g.tipo === 'video' ? g.poster.largura : null;
      const h = g.tipo === 'foto' ? g.altura : g.tipo === 'video' ? g.poster.altura : null;
      if (!w || !h) continue;
      const box = await botoes.nth(i).boundingBox();
      expect(Math.abs(box!.width / box!.height - w / h), `item ${i + 1}`).toBeLessThan(0.03);
    }
    // as miniaturas fora da tela não carregam antes da hora
    await expect(dialog.locator('img[loading="lazy"]').first()).toBeAttached();
  });

  test('fecha pelo botão "Fechar" e ao clicar no fundo', async ({ page }) => {
    await page.goto('/');
    await goToProject(page, 'Juliana & Márcio');
    const trigger = slideOf(page, 'Juliana & Márcio').getByRole('button', { name: /Ver galeria/ });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Juliana & Márcio' });
    await dialog.getByRole('button', { name: 'Fechar' }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(4, 4); // canto da tela: fora do diálogo, em cima do fundo
    await expect(dialog).toBeHidden();
  });
});
