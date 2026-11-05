import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * Ano atual do relógio de quem visita. No HTML pré-renderizado vem o ano do build;
 * na hidratação o React troca pelo ano do navegador sem erro de hidratação.
 */
export function useCurrentYear(): number {
  return useSyncExternalStore(
    noop,
    () => new Date().getFullYear(),
    () => new Date().getFullYear(),
  );
}
