import type { CSSProperties } from 'react';
import { imagens, type ImagemId } from '../data/imagens.generated';

interface PictureProps {
  id: ImagemId;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** <picture> com AVIF/WebP, srcset, width/height reais e blur placeholder. */
export function Picture({ id, alt, sizes, priority = false, className, style }: PictureProps) {
  const meta = imagens[id];
  const srcSet = (ext: 'avif' | 'webp') =>
    meta.widths.map((w) => `/images/${id}-${w}.${ext} ${w}w`).join(', ');
  const largest = meta.widths[meta.widths.length - 1];

  return (
    <picture>
      <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
      <img
        src={`/images/${id}-${largest}.webp`}
        alt={alt}
        width={meta.width}
        height={meta.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        className={className}
        style={{ backgroundImage: `url("${meta.blur}")`, backgroundSize: 'cover', ...style }}
      />
    </picture>
  );
}
