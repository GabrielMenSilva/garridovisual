import { describe, expect, it } from 'vitest';
import { buildEmbedUrl } from './media';

describe('buildEmbedUrl', () => {
  it('usa youtube-nocookie.com para YouTube', () => {
    const url = buildEmbedUrl({ type: 'youtube', id: 'dQw4w9WgXcQ' });
    expect(url).not.toBeNull();
    const parsed = new URL(url as string);
    expect(parsed.origin).toBe('https://www.youtube-nocookie.com');
    expect(parsed.pathname).toBe('/embed/dQw4w9WgXcQ');
  });
  it('usa dnt=1 no Vimeo', () => {
    const parsed = new URL(buildEmbedUrl({ type: 'vimeo', id: '123456789' }) as string);
    expect(parsed.origin).toBe('https://player.vimeo.com');
    expect(parsed.searchParams.get('dnt')).toBe('1');
  });
  it('não liga autoplay sem pedido explícito', () => {
    const yt = new URL(buildEmbedUrl({ type: 'youtube', id: 'dQw4w9WgXcQ' }) as string);
    const vm = new URL(buildEmbedUrl({ type: 'vimeo', id: '123456789' }) as string);
    expect(yt.searchParams.get('autoplay')).toBe('0');
    expect(vm.searchParams.get('autoplay')).toBe('0');
  });
  it('liga autoplay só quando pedido (depois do clique)', () => {
    const yt = new URL(buildEmbedUrl({ type: 'youtube', id: 'dQw4w9WgXcQ' }, { autoplay: true }) as string);
    expect(yt.searchParams.get('autoplay')).toBe('1');
  });
  it('recusa IDs inválidos (sem injetar nada na URL)', () => {
    expect(buildEmbedUrl({ type: 'youtube', id: 'curto' })).toBeNull();
    expect(buildEmbedUrl({ type: 'youtube', id: 'abc"><script>x' })).toBeNull();
    expect(buildEmbedUrl({ type: 'vimeo', id: 'abc' })).toBeNull();
    expect(buildEmbedUrl({ type: 'vimeo', id: '123456789', hash: '../x' })).toBeNull();
  });
});
