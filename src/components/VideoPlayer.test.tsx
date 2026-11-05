import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { VideoPlayer } from './VideoPlayer';

const youtube = { type: 'youtube', id: 'dQw4w9WgXcQ' } as const;
const base = { title: 'Hey Maringá', cover: 'hey-maringa-capa', coverAlt: 'Capa' } as const;

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
  });

  it('o clique chama onPlay e, ao tocar, monta o iframe do youtube-nocookie', async () => {
    const onPlay = vi.fn();
    function Harness() {
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
    const { container } = render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: /reproduzir/i }));
    expect(onPlay).toHaveBeenCalledOnce();
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(new URL(iframe?.getAttribute('src') ?? '').origin).toBe('https://www.youtube-nocookie.com');
    expect(iframe).toHaveAttribute('title', 'Vídeo: Hey Maringá');
  });

  it('ID inválido: mostra "Vídeo indisponível" e nenhum player', () => {
    const { container } = render(
      <VideoPlayer {...base} video={{ type: 'youtube', id: 'x' }} playing onPlay={() => {}} />,
    );
    expect(screen.getByText('Vídeo indisponível')).toBeInTheDocument();
    expect(container.querySelector('iframe')).toBeNull();
  });
});
