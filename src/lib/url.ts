/**
 * Prefixa um caminho de `public/` ("/images/…", "/media/…") com o `base` do build.
 * Na raiz de um domínio o base é "/" e nada muda; no GitHub Pages (`/garridovisual/`)
 * vira "/garridovisual/images/…". Os dados guardam sempre o caminho a partir da raiz.
 */
export function comBase(caminho: string, base: string = import.meta.env.BASE_URL): string {
  if (!caminho.startsWith('/') || caminho.startsWith('//')) return caminho;
  return `${base.replace(/\/$/, '')}${caminho}`;
}
