/** Limita `n` ao intervalo [min, max]. */
export function clamp(n: number, min = 0, max = 1): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * Progresso (0..1) de uma seção "alta" com palco sticky.
 * @param top posição do topo da seção em relação ao topo da janela (getBoundingClientRect().top)
 * @param height altura total da seção
 * @param viewport altura da janela
 * 0 = o topo da seção está no topo da janela; 1 = a seção acabou de "soltar" o palco.
 */
export function sectionProgress(top: number, height: number, viewport: number): number {
  const distance = height - viewport;
  if (!(distance > 0)) return 0;
  return clamp(-top / distance);
}

/** Interpolação linear. */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * clamp(t);
}

/**
 * Suavização independente da taxa de quadros: aproxima `current` de `target`
 * com constante de tempo `tauMs`. Devolve exatamente `target` quando está perto o bastante.
 */
export function smoothTo(
  current: number,
  target: number,
  dtMs: number,
  tauMs = 90,
  epsilon = 0.0005,
): number {
  const k = 1 - Math.exp(-Math.max(0, dtMs) / tauMs);
  const next = lerp(current, target, k);
  return Math.abs(target - next) < epsilon ? target : next;
}

/** Só vale escrever `currentTime` quando a diferença passa de um quadro a 60 fps. */
export function shouldSeek(currentTime: number, wantedTime: number, minStep = 1 / 60): boolean {
  return Math.abs(wantedTime - currentTime) > minStep;
}

/** Easing de saída cúbica (0..1). */
export function easeOutCubic(t: number): number {
  const x = clamp(t);
  return 1 - Math.pow(1 - x, 3);
}
