import type { CSSProperties } from 'react';
import type { Imagem } from '../data/schema';
import { comBase } from '../lib/url';

interface PictureProps {
  imagem: Imagem;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

const TIPOS: Record<string, string> = { avif: 'image/avif', webp: 'image/webp', jpg: 'image/jpeg' };

/**
 * <picture> com srcset em cada formato (AVIF primeiro), width/height reais e blur placeholder.
 * O último formato da imagem é o de reserva do <img> (WebP nas fotos, JPG nos posters).
 */
export function Picture({ imagem, alt, sizes, priority = false, className, style }: PictureProps) {
  const base = comBase(imagem.base);
  const srcSet = (ext: string) => imagem.larguras.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ');
  const reserva = imagem.formatos[imagem.formatos.length - 1] ?? 'webp';
  const maior = imagem.larguras[imagem.larguras.length - 1];

  return (
    <picture>
      {imagem.formatos.slice(0, -1).map((ext) => (
        <source key={ext} type={TIPOS[ext]} srcSet={srcSet(ext)} sizes={sizes} />
      ))}
      <img
        src={`${base}-${maior}.${reserva}`}
        srcSet={srcSet(reserva)}
        sizes={sizes}
        alt={alt}
        width={imagem.largura}
        height={imagem.altura}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        className={className}
        style={{ backgroundImage: `url("${imagem.blur}")`, backgroundSize: 'cover', ...style }}
      />
    </picture>
  );
}
