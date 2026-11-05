import { useEffect, useState } from 'react';

/** Devolve o id da seção que cruza a faixa central da janela. */
export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState<string>(ids[0] ?? '');

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!elements.length) return;
    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
          else visible.delete(entry.target.id);
        }
        // na ordem da página, vence a última seção que está na faixa
        const current = [...ids].reverse().find((id) => visible.has(id));
        if (current) setActive(current);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.01, 0.5, 1] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
