import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), iframe, video[controls], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Mantém o Tab circulando dentro do elemento. O foco é movido pelo código em toda tecla Tab,
 * porque o comportamento nativo varia: o <dialog> do Chromium deixa o foco sair para a interface
 * do navegador, e o Safari (por padrão) pula links no Tab.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (n) => n.getClientRects().length > 0,
      );
      if (!items.length) return;
      e.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const step = e.shiftKey ? -1 : 1;
      const next =
        index === -1 ? (e.shiftKey ? items.length - 1 : 0) : (index + step + items.length) % items.length;
      items[next]?.focus();
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [ref, active]);
}
