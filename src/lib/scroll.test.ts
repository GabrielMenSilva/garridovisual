import { describe, expect, it } from 'vitest';
import { clamp, easeOutCubic, lerp, sectionProgress, shouldSeek, smoothTo } from './scroll';

describe('clamp', () => {
  it('limita ao intervalo', () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(0.4)).toBe(0.4);
    expect(clamp(7)).toBe(1);
    expect(clamp(5, 2, 4)).toBe(4);
  });
  it('trata NaN como o mínimo', () => {
    expect(clamp(Number.NaN)).toBe(0);
  });
});

describe('sectionProgress', () => {
  const height = 2520; // 280% de 900
  const viewport = 900;
  it('é 0 no início (topo da seção no topo da janela)', () => {
    expect(sectionProgress(0, height, viewport)).toBe(0);
  });
  it('é 0.5 no meio', () => {
    expect(sectionProgress(-(height - viewport) / 2, height, viewport)).toBeCloseTo(0.5, 6);
  });
  it('é 1 no fim', () => {
    expect(sectionProgress(-(height - viewport), height, viewport)).toBe(1);
  });
  it('fica em 0 antes da seção e em 1 depois dela', () => {
    expect(sectionProgress(400, height, viewport)).toBe(0);
    expect(sectionProgress(-99999, height, viewport)).toBe(1);
  });
  it('não divide por zero quando a seção não é mais alta que a janela', () => {
    expect(sectionProgress(-100, 900, 900)).toBe(0);
    expect(sectionProgress(-100, 500, 900)).toBe(0);
  });
});

describe('lerp / smoothTo', () => {
  it('interpola', () => {
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });
  it('aproxima o alvo sem ultrapassar', () => {
    const a = smoothTo(0, 1, 16);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(1);
  });
  it('chega exatamente no alvo quando está perto', () => {
    expect(smoothTo(0.9999, 1, 16)).toBe(1);
  });
  it('quadros mais longos andam mais', () => {
    expect(smoothTo(0, 1, 100)).toBeGreaterThan(smoothTo(0, 1, 16));
  });
});

describe('shouldSeek', () => {
  it('ignora diferenças menores que um quadro a 60 fps', () => {
    expect(shouldSeek(2, 2.01)).toBe(false);
    expect(shouldSeek(2, 2.1)).toBe(true);
  });
});

describe('easeOutCubic', () => {
  it('vai de 0 a 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});
