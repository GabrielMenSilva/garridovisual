import markSvg from '../assets/logo-mark.svg?raw';

type Variant = 'mark' | 'horizontal' | 'hero';

// Tamanhos padrão responsivos (classes Tailwind); `size` força um valor fixo em px.
const sizeClass: Record<Variant, string> = {
  mark: 'size-[30px] md:size-9',
  horizontal: 'size-[30px] md:size-9',
  hero: 'size-24 md:size-28',
};

interface LogoProps {
  variant?: Variant;
  /** Altura da marca em px (sobrescreve o padrão da variante). */
  size?: number;
  className?: string;
}

/**
 * Marca do GarridoVisual (losango com o "G" em espiral e o "V"), sempre na cor do texto atual (`--gold`).
 * Regras: nunca distorcer, girar, trocar de cor nem aplicar sombra/contorno; área de respiro
 * mínima = 1/4 da altura da marca.
 * O SVG é gerado por scripts/gerar-marca.mjs a partir da logo enviada (assets-originais/logo-garridovisual-enviada.jpg).
 */
export function Logo({ variant = 'horizontal', size, className = '' }: LogoProps) {
  const h = size ?? (variant === 'hero' ? 112 : 36);
  const mark = (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 text-gold [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${size ? '' : sizeClass[variant]}`}
      style={size ? { width: size, height: size } : undefined}
      dangerouslySetInnerHTML={{ __html: markSvg }}
    />
  );
  if (variant !== 'horizontal') return <span className={`inline-flex ${className}`}>{mark}</span>;
  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: h / 3 }}>
      {mark}
      <span className="font-display text-lg font-extrabold tracking-tight text-ink">GarridoVisual</span>
    </span>
  );
}
