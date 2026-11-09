import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import type { Imagem, VideoPrincipal } from '../data/schema';
import { buildEmbedUrl, type EmbedMedia } from '../lib/media';
import { comBase } from '../lib/url';
import { PlayIcon } from './Icons';
import { Picture } from './Picture';

interface VideoPlayerProps {
  /** Usado nos rótulos: "Reproduzir vídeo: {titulo}". */
  titulo: string;
  video: VideoPrincipal | null;
  /** Fachada quando não há poster próprio (e capa dos projetos sem vídeo). */
  capa: Imagem;
  capaAlt: string;
  capaFoco?: string;
  playing: boolean;
  onPlay: () => void;
  /** 'slide': moldura na proporção do vídeo (vertical com fundo desfocado). 'visor': ocupa a área toda (galeria). */
  variante?: 'slide' | 'visor';
  sizes?: string;
}

function paraEmbed(v: Extract<VideoPrincipal, { tipo: 'youtube' | 'vimeo' }>): EmbedMedia {
  return v.tipo === 'youtube' ? { type: 'youtube', id: v.id } : { type: 'vimeo', id: v.id, hash: v.hash };
}

/** URL de um tamanho grande do poster, no formato de reserva (JPG nos posters), para o atributo `poster`. */
function urlDoPoster(img: Imagem): string {
  const ext = img.formatos.includes('jpg') ? 'jpg' : (img.formatos[img.formatos.length - 1] ?? 'webp');
  return `${img.base}-${img.larguras[img.larguras.length - 1]}.${ext}`;
}

/**
 * Player com "fachada": mostra o poster e só monta o <video>/iframe depois do clique (nada de vídeo
 * baixado antes). Vídeo próprio toca com som, `controls`, `playsinline`, `preload="metadata"`.
 * Vertical (9:16) e quadrado ficam numa moldura centralizada com o poster desfocado ao fundo,
 * sem corte e sem esticar; a proporção vem do manifesto, então nada pula de lugar.
 * Sem vídeo (ou esperando subir no YouTube/Vimeo): capa com o selo "Vídeo em breve", sem play.
 */
export function VideoPlayer({
  titulo,
  video,
  capa,
  capaAlt,
  capaFoco = '50% 50%',
  playing,
  onPlay,
  variante = 'slide',
  sizes = '(min-width: 1024px) 56vw, 100vw',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendente = video !== null && video.tipo !== 'video' && video.id === 'TODO';
  const embedUrl =
    video && video.tipo !== 'video' && !pendente ? buildEmbedUrl(paraEmbed(video), { autoplay: true }) : null;
  const indisponivel = video !== null && video.tipo !== 'video' && !pendente && embedUrl === null;
  const tocavel = video !== null && !pendente && !indisponivel;
  const ativo = tocavel && playing;

  // monta e já toca (o clique que montou é o gesto do usuário); ao desmontar, pausa
  useLayoutEffect(() => {
    const el = videoRef.current;
    if (!ativo || !el) return;
    el.play().catch(() => {
      /* o navegador recusou o autoplay com som: os controles continuam lá para a pessoa tocar */
    });
    return () => el.pause();
  }, [ativo]);

  const poster = video && 'poster' in video && video.poster ? video.poster : null;
  const fachada = poster ?? capa;
  // proporção da moldura: a do vídeo próprio; embed é 16:9; sem vídeo, a capa recortada em 16:9
  const [w, h] =
    video?.tipo === 'video'
      ? [video.largura, video.altura]
      : pendente && poster
        ? [poster.largura, poster.altura]
        : [16, 9];
  const deitado = w > h * 1.05;
  const recorta = !video || indisponivel; // capa antiga em 16:9 (object-cover), como antes

  const conteudo =
    ativo && video ? (
      video.tipo === 'video' ? (
        // Vídeos de portfólio, em geral sem fala; legendas entram junto do arquivo quando houver.
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          ref={videoRef}
          src={comBase(video.src)}
          poster={comBase(urlDoPoster(video.poster))}
          controls
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full bg-black object-contain"
          aria-label={`Vídeo: ${titulo}`}
          data-testid="video-proprio"
        />
      ) : embedUrl ? (
        <iframe
          src={embedUrl}
          title={`Vídeo: ${titulo}`}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : null
    ) : (
      <>
        <Picture
          imagem={fachada}
          alt={poster ? '' : capaAlt}
          sizes={sizes}
          className={`absolute inset-0 h-full w-full ${recorta || variante === 'slide' ? 'object-cover' : 'object-contain'}`}
          style={{ objectPosition: recorta ? capaFoco : '50% 50%' }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent"
        />
        {tocavel ? (
          <button
            type="button"
            onClick={onPlay}
            aria-label={`Reproduzir vídeo: ${titulo}`}
            className="group absolute inset-0 flex items-center justify-center"
          >
            <span className="flex size-20 items-center justify-center border border-gold bg-bg/70 text-gold backdrop-blur-sm transition-[background-color,color,scale] duration-200 group-hover:scale-105 group-hover:bg-gold group-hover:text-on-gold">
              <PlayIcon className="size-8 translate-x-0.5" />
            </span>
          </button>
        ) : (
          <span className="absolute bottom-4 left-4 border border-gold-deep bg-bg/80 px-3 py-1 text-sm font-semibold tracking-wide text-gold-light">
            {indisponivel ? 'Vídeo indisponível' : 'Vídeo em breve'}
          </span>
        )}
      </>
    );

  if (variante === 'visor') {
    return (
      <div className="relative h-full w-full bg-black" data-testid="video-player">
        {conteudo}
      </div>
    );
  }

  // altura = largura disponível × proporção; no desktop, no máximo 70svh (o vertical fica centralizado)
  const moldura = { '--r': String(h / w), aspectRatio: `${w} / ${h}` } as CSSProperties;
  return (
    <div
      className="relative w-full overflow-hidden bg-surface [container-type:inline-size]"
      data-testid="video-player"
      data-orientacao={deitado ? 'horizontal' : w < h ? 'vertical' : 'quadrado'}
    >
      {!deitado && (
        <div
          aria-hidden="true"
          className="absolute inset-0 scale-125 bg-cover bg-center blur-2xl brightness-[0.35]"
          style={{ backgroundImage: `url("${fachada.blur}")` }}
        />
      )}
      <div
        className="relative mx-auto h-[calc(100cqw*var(--r))] max-w-full lg:h-[min(70svh,calc(100cqw*var(--r)))]"
        style={moldura}
        data-testid="video-moldura"
      >
        {conteudo}
      </div>
    </div>
  );
}
