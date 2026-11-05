declare const __SITE_URL__: string;

/** URL pública do site. Provisória até o domínio existir: defina VITE_SITE_URL no build. */
export const SITE_URL: string = __SITE_URL__;

export const site = {
  name: 'GarridoVisual',
  role: 'Filmmaker, Fotógrafo e Editor',
  city: 'Maringá, PR',
  description: 'GarridoVisual — Filmmaker, Fotógrafo e Editor em Maringá, PR',
  hero: {
    // TODO(garrido): trocar pelo vídeo real do hero (ver docs/site-garridovisual.md, "Vídeo do hero").
    // Enquanto isso, é um vídeo de teste gerado com ffmpeg (public/media/hero-placeholder.mp4).
    video: { mp4: '/media/hero-placeholder.mp4', isPlaceholder: true },
    poster: 'fundo-preto-banner',
  },
} as const;

export const sections = [
  { id: 'home', label: 'Home' },
  { id: 'projetos', label: 'Projetos' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'contato', label: 'Contato' },
] as const;

export type SectionId = (typeof sections)[number]['id'];
