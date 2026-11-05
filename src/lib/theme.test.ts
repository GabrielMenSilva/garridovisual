import { describe, expect, it } from 'vitest';
import { contrast, theme } from './theme';

// [texto, fundo, mínimo]: 4.5 para texto normal; 3 para texto grande e ícones
const pares: [keyof typeof theme, keyof typeof theme, number][] = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['textMuted', 'bg', 4.5],
  ['textMuted', 'surface', 4.5],
  ['textMuted', 'surface2', 4.5],
  ['gold', 'bg', 4.5],
  ['gold', 'surface', 4.5],
  ['gold', 'surface2', 4.5],
  ['goldLight', 'bg', 4.5],
  ['goldLight', 'surface', 4.5],
  ['onGold', 'gold', 4.5],
  ['onGold', 'goldLight', 4.5],
  ['goldDeep', 'surface', 3],
  ['goldDeep', 'bg', 3],
];

describe('contraste das cores do tema', () => {
  it.each(pares)('%s sobre %s ≥ %s:1', (fg, bg, minimo) => {
    expect(contrast(theme[fg], theme[bg])).toBeGreaterThanOrEqual(minimo);
  });
  it('bate com os valores documentados', () => {
    expect(contrast(theme.gold, theme.surface)).toBeCloseTo(8.1, 0);
    expect(contrast(theme.text, theme.bg)).toBeCloseTo(17, 0);
  });
});
