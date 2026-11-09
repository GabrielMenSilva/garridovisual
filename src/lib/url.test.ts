import { describe, expect, it } from 'vitest';
import { comBase } from './url';

describe('comBase', () => {
  it('na raiz do domínio não muda nada', () => {
    expect(comBase('/images/a-480.avif', '/')).toBe('/images/a-480.avif');
  });
  it('num subcaminho (GitHub Pages) prefixa o base', () => {
    expect(comBase('/media/projetos/x/01-video.mp4', '/garridovisual/')).toBe(
      '/garridovisual/media/projetos/x/01-video.mp4',
    );
  });
  it('não mexe em URLs completas, data: nem caminhos relativos', () => {
    expect(comBase('https://x.com/a.jpg', '/g/')).toBe('https://x.com/a.jpg');
    expect(comBase('//cdn.x.com/a.jpg', '/g/')).toBe('//cdn.x.com/a.jpg');
    expect(comBase('data:image/webp;base64,AA', '/g/')).toBe('data:image/webp;base64,AA');
    expect(comBase('a.jpg', '/g/')).toBe('a.jpg');
  });
  it('usa o BASE_URL do build por padrão', () => {
    expect(comBase('/images/a.jpg')).toBe(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/images/a.jpg`);
  });
});
