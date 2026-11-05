import type { MouseEvent } from 'react';

/** Rola até a seção e atualiza o hash sem pular a página. */
export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView(); // suavidade vem do CSS (desligada com prefers-reduced-motion)
  history.replaceState(null, '', `#${id}`);
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
