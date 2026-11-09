import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { imagemAntiga } from '../data/montarProjetos';
import type { Imagem, VideoPrincipal } from '../data/schema';
import { VideoPlayer } from './VideoPlayer';

const capa = imagemAntiga('hey-maringa-capa');
const poster: Imagem = {
  base: '/images/projetos/x/01-video-poster',
  largura: 1080,
  altura: 1920,
  larguras: [480, 800, 1080],
  formatos: ['avif', 'jpg'],
  blur: 'data:image/webp;base64,AAAA',
};
const youtube: VideoPrincipal = { tipo: 'youtube', id: 'dQw4w9WgXcQ', titulo: 'Hey Maringá' };
const vertical: VideoPrincipal = {
  tipo: 'video',
  src: '/media/projetos/x/01-video.mp4',
  poster,
  largura: 1080,
  altura: 1920,
  orientacao: 'vertical',
  duracao: 31.4,
  titulo: 'Edit estilo',
};
const base = { titulo: 'Hey Maringá', capa, capaAlt: 'Capa' } as const;

function Harness({ video }: { video: VideoPrincipal }) {
  const [playing, setPlaying] = useState(false);
  return <VideoPlayer {...base} video={video} playing={playing} onPlay={() => setPlaying(true)} />;
}

describe('VideoPlayer', () => {
  it('sem vídeo: mostra "Vídeo em breve" e nenhum botão de play', () => {
    render(<VideoPlayer {...base} video={null} playing={false} onPlay={() => {}} />);
    expect(screen.getByText('Vídeo em breve')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('com vídeo: mostra a fachada e NÃO carrega o iframe antes do clique', () => {
    const { container } = render(<VideoPlayer {...base} video={youtube} playing={false} onPlay={() => {}} />);
    expect(screen.getByRole('button', { name: /reproduzir vídeo: hey maringá/i })).toBeInTheDocument();
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.queryByText('Vídeo em breve')).not.toBeInTheDocument();
  });

  it('o clique chama onPlay e, ao tocar, monta o iframe do youtube-nocookie', async () => {
    const onPlay = vi.fn();
    function H() {
      const [playing, setPlaying] = useState(false);
      return (
        <VideoPlayer
          {...base}
          video={youtube}
          playing={playing}
          onPlay={() => {
            onPlay();
            setPlaying(true);
          }}
        />
      );
    }
    const { container } = render(<H />);
    await userEvent.click(screen.getByRole('button', { name: /reproduzir/i }));
    expect(onPlay).toHaveBeenCalledOnce();
    const iframe = container.querySelector('iframe');
    expect(new URL(iframe?.getAttribute('src') ?? '').origin).toBe('https://www.youtube-nocookie.com');
    expect(iframe).toHaveAttribute('title', 'Vídeo: Hey Maringá');
  });

  it('vídeo próprio: só monta o <video> depois do clique, com controles, playsinline, preload=metadata e som', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const { container } = render(<Harness video={vertical} />);
    expect(container.querySelector('video')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /reproduzir vídeo/i }));
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('src', '/media/projetos/x/01-video.mp4');
    expect(video).toHaveAttribute('preload', 'metadata');
    expect(video).toHaveAttribute('poster', '/images/projetos/x/01-video-poster-1080.jpg');
    expect(video?.hasAttribute('controls')).toBe(true);
    expect(video?.hasAttribute('playsinline')).toBe(true);
    expect(video?.muted).toBe(false);
    expect(play).toHaveBeenCalledOnce();
    play.mockRestore();
  });

  it('vertical: moldura 9:16 com o poster desfocado ao fundo, sem corte', () => {
    const { container } = render(
      <VideoPlayer {...base} video={vertical} playing={false} onPlay={() => {}} />,
    );
    const player = screen.getByTestId('video-player');
    expect(player).toHaveAttribute('data-orientacao', 'vertical');
    expect(screen.getByTestId('video-moldura').style.aspectRatio).toBe('1080 / 1920');
    expect(container.querySelector('[style*="background-image"][aria-hidden="true"]')).not.toBeNull();
  });

  it('vídeo esperando o YouTube (id TODO): só o poster, com "Vídeo em breve"', () => {
    render(
      <VideoPlayer
        {...base}
        video={{ tipo: 'youtube', id: 'TODO', titulo: 'Longo', poster }}
        playing
        onPlay={() => {}}
      />,
    );
    expect(screen.getByText('Vídeo em breve')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('ID inválido: mostra "Vídeo indisponível" e nenhum player', () => {
    const { container } = render(
      <VideoPlayer {...base} video={{ tipo: 'youtube', id: 'x', titulo: 'x' }} playing onPlay={() => {}} />,
    );
    expect(screen.getByText('Vídeo indisponível')).toBeInTheDocument();
    expect(container.querySelector('iframe')).toBeNull();
  });
});
