import { expect, type Page } from '@playwright/test';

/** Hosts permitidos nas requisições da página (nenhum domínio externo no carregamento). */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

/**
 * Bloqueia qualquer requisição para fora do localhost (Instagram, WhatsApp, YouTube, Vimeo…)
 * e devolve a lista do que tentou sair. Os testes NUNCA abrem sites externos de verdade.
 */
export async function blockExternal(page: Page): Promise<string[]> {
  const blocked: string[] = [];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    if (LOCAL_HOSTS.has(new URL(url).hostname)) return route.continue();
    blocked.push(url);
    return route.abort();
  });
  return blocked;
}

/** Recolhe erros de console e exceções não tratadas da página. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Posição (px) do topo de uma seção em relação ao topo da janela. */
export function topOf(page: Page, id: string): Promise<number> {
  return page.evaluate((i) => Math.round(document.getElementById(i)?.getBoundingClientRect().top ?? NaN), id);
}

/** Rola a página inteira, devagar, até todas as seções terem sido reveladas. */
export async function revealAll(page: Page): Promise<void> {
  // uma seção por vez: o IntersectionObserver precisa "ver" cada uma
  for (const id of ['projetos', 'sobre', 'contato']) {
    await page.evaluate((i) => document.getElementById(i)?.scrollIntoView({ behavior: 'instant' }), id);
    await expect
      .poll(() =>
        page.evaluate((i) => document.querySelectorAll(`#${i} .reveal:not(.is-visible)`).length, id),
      )
      .toBe(0);
  }
}

/** O slide (grupo) de um projeto. */
export function slideOf(page: Page, title: string) {
  return page
    .locator('[aria-roledescription="slide"]')
    .filter({ has: page.locator('h3', { hasText: title }) });
}

/** Vai até um projeto no slider pela miniatura e espera ele ficar ativo (sem inert). */
export async function goToProject(page: Page, title: string): Promise<void> {
  await page.evaluate(() => document.getElementById('projetos')?.scrollIntoView({ behavior: 'instant' }));
  await page
    .getByRole('list', { name: 'Miniaturas dos projetos' })
    .getByRole('button', { name: title })
    .click();
  await expect(slideOf(page, title)).not.toHaveAttribute('inert', '');
}
