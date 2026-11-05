import { useEffect } from 'react';

let locks = 0;

/** Trava o scroll do fundo enquanto `active` for true (suporta vários diálogos). */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    locks += 1;
    document.documentElement.classList.add('scroll-locked');
    return () => {
      locks -= 1;
      if (locks <= 0) {
        locks = 0;
        document.documentElement.classList.remove('scroll-locked');
      }
    };
  }, [active]);
}
