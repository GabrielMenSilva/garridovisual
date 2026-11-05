/** Espelho dos tokens de src/styles/tokens.css, usado nos testes de contraste. */
export const theme = {
  bg: '#0E0E0E',
  surface: '#171717',
  surface2: '#1F1F1F',
  line: '#2E2B26',
  gold: '#D5A75A',
  goldLight: '#E6C27F',
  goldDeep: '#A8803A',
  text: '#F5F0E6',
  textMuted: '#B5AFA3',
  onGold: '#171717',
} as const;

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`Cor inválida: ${hex}`);
  const n = parseInt(m[1] as string, 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** Razão de contraste WCAG entre duas cores hex (1 a 21). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
