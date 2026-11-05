import { buildEmbedUrl, isEmbed, type VideoMedia } from '../lib/media';
import type { ImagemId } from '../data/imagens.generated';
import { PlayIcon } from './Icons';
import { Picture } from './Picture';

interface VideoPlayerProps {
  title: string;
  video: VideoMedia | null;
  cover: ImagemId;
  coverAlt: string;
  coverFocus?: string;
  playing: boolean;
  onPlay: () => void;
  priority?: boolean;
  sizes?: string;
}

/**
 * Player com "fachada": mostra a capa e só monta o iframe/<video> depois do clique
 * (rápido e respeita privacidade). Sem vídeo: capa com o selo "Vídeo em breve", sem botão de play.
 */
export function VideoPlayer({
  title,
  video,
  cover,
  coverAlt,
  coverFocus = '50% 50%',
  playing,
  onPlay,
  priority = false,
  sizes = '(min-width: 1024px) 56vw, 100vw',
}: VideoPlayerProps) {
  const embedUrl = video && isEmbed(video) ? buildEmbedUrl(video, { autoplay: true }) : null;
  const unavailable = video !== null && isEmbed(video) && embedUrl === null;

  if (video && playing && !unavailable) {
    return (
      <div className="aspect-video w-full bg-black" data-testid="video-player">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={`Vídeo: ${title}`}
            className="h-full w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : video.type === 'file' ? (
          // Vídeos de portfólio, em geral sem fala; legendas entram junto do arquivo quando houver.
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={video.src}
            poster={video.poster}
            controls
            autoPlay
            playsInline
            className="h-full w-full"
            aria-label={`Vídeo: ${title}`}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-surface">
      <Picture
        id={cover}
        alt={coverAlt}
        sizes={sizes}
        priority={priority}
        className="h-full w-full object-cover"
        style={{ objectPosition: coverFocus }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent"
      />
      {video && !unavailable ? (
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Reproduzir vídeo: ${title}`}
          className="group absolute inset-0 flex items-center justify-center"
        >
          <span className="flex size-20 items-center justify-center border border-gold bg-bg/70 text-gold backdrop-blur-sm transition-[background-color,color,scale] duration-200 group-hover:scale-105 group-hover:bg-gold group-hover:text-on-gold">
            <PlayIcon className="size-8 translate-x-0.5" />
          </span>
        </button>
      ) : (
        <span className="absolute bottom-4 left-4 border border-gold-deep bg-bg/80 px-3 py-1 text-sm font-semibold tracking-wide text-gold-light">
          {unavailable ? 'Vídeo indisponível' : 'Vídeo em breve'}
        </span>
      )}
    </div>
  );
}
