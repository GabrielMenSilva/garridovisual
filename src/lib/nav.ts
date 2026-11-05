import type { MouseEvent } from 'react';

/**
 * Rola até a seção e atualiza o hash sem pular a página.
 * Se algo mudar de altura durante a rolagem suave (ex.: troca de fonte, imagem carregando),
 * corrige a posição ao final, sem animação.
 */
export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView(); // suavidade vem do CSS (desligada com prefers-reduced-motion)
  history.replaceState(null, '', `#${id}`);

  if ('onscrollend' in window) {
    window.addEventListener(
      'scrollend',
      () => {
        const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        if (Math.abs(el.getBoundingClientRect().top - margin) > 2) el.scrollIntoView({ behavior: 'instant' });
      },
      { once: true },
    );
  }
}

/** onClick para links âncora internos: mantém o `href` (funciona sem JS e com Ctrl+clique). */
export function handleAnchorClick(id: string, after?: () => void) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)
      return;
    event.preventDefault();
    scrollToSection(id);
    after?.();
  };
}
