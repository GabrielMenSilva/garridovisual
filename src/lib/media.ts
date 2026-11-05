export type EmbedMedia =
  | { readonly type: 'youtube'; readonly id: string }
  | { readonly type: 'vimeo'; readonly id: string; readonly hash?: string };

export type FileMedia = { readonly type: 'file'; readonly src: string; readonly poster?: string };
export type VideoMedia = EmbedMedia | FileMedia;

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{5,12}$/;
const VIMEO_HASH = /^[a-f0-9]{6,20}$/i;

export const EMBED_ORIGINS = ['https://www.youtube-nocookie.com', 'https://player.vimeo.com'] as const;

/**
 * URL do iframe para YouTube (domínio sem cookies) ou Vimeo (com `dnt=1`).
 * `autoplay` só liga quando pedido de forma explícita (a pessoa clicou no play).
 * Devolve `null` quando o ID não é válido.
 */
export function buildEmbedUrl(media: EmbedMedia, options: { autoplay?: boolean } = {}): string | null {
  const autoplay = options.autoplay === true ? '1' : '0';
  if (media.type === 'youtube') {
    if (!YOUTUBE_ID.test(media.id)) return null;
    const params = new URLSearchParams({ autoplay, rel: '0', modestbranding: '1', playsinline: '1' });
    return `https://www.youtube-nocookie.com/embed/${media.id}?${params.toString()}`;
  }
  if (!VIMEO_ID.test(media.id)) return null;
  if (media.hash !== undefined && !VIMEO_HASH.test(media.hash)) return null;
  const params = new URLSearchParams({ dnt: '1', autoplay });
  if (media.hash) params.set('h', media.hash);
  return `https://player.vimeo.com/video/${media.id}?${params.toString()}`;
}

export function isEmbed(media: VideoMedia): media is EmbedMedia {
  return media.type === 'youtube' || media.type === 'vimeo';
}
