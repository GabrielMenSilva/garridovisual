import { afterEach, describe, expect, it, vi } from 'vitest';
import { instalarUmVideoPorVez } from './umVideoPorVez';

function videoFalso(tocando: boolean): HTMLVideoElement {
  const v = document.createElement('video');
  Object.defineProperty(v, 'paused', { configurable: true, get: () => !tocando });
  v.pause = vi.fn();
  document.body.append(v);
  return v;
}

describe('instalarUmVideoPorVez', () => {
  let desinstalar = () => {};
  afterEach(() => {
    desinstalar();
    document.body.innerHTML = '';
  });

  it('quando um vídeo começa a tocar, pausa os outros que estão tocando', () => {
    desinstalar = instalarUmVideoPorVez();
    const tocando = videoFalso(true);
    const parado = videoFalso(false);
    const novo = videoFalso(true);
    novo.dispatchEvent(new Event('play')); // `play` não borbulha: o listener é de captura
    expect(tocando.pause).toHaveBeenCalledOnce();
    expect(parado.pause).not.toHaveBeenCalled();
    expect(novo.pause).not.toHaveBeenCalled();
  });

  it('desinstala sem deixar o listener', () => {
    instalarUmVideoPorVez()();
    const tocando = videoFalso(true);
    videoFalso(true).dispatchEvent(new Event('play'));
    expect(tocando.pause).not.toHaveBeenCalled();
  });
});
