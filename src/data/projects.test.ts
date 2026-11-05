import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { imagens, type ImagemId } from './imagens.generated';
import { projectSchema, projects } from './projects';

const arquivosDe = (id: ImagemId) =>
  imagens[id].widths.flatMap((w) => [`public/images/${id}-${w}.avif`, `public/images/${id}-${w}.webp`]);

describe('projects', () => {
  it('passa no schema zod e tem os 6 projetos, na ordem combinada', () => {
    expect(projects).toHaveLength(6);
    expect(projects.map((p) => p.slug)).toEqual([
      'hey-maringa',
      'el-piratas',
      'ody-park',
      'juliana-e-marcio',
      'mk5',
      'heitor-amatsu',
    ]);
    for (const p of projects) expect(() => projectSchema.parse(p)).not.toThrow();
  });
  it('tem slugs únicos', () => {
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length);
  });
  it('todo projeto tem título, funções e texto', () => {
    for (const p of projects) {
      expect(p.title.length).toBeGreaterThan(1);
      expect(p.roles.length).toBeGreaterThan(0);
      expect(p.summary.length).toBeGreaterThan(40);
    }
  });
  it('toda imagem referenciada existe em public/images/ (AVIF e WebP)', () => {
    const ids = new Set<ImagemId>();
    for (const p of projects) {
      ids.add(p.cover);
      for (const g of p.gallery) if (g.kind === 'image') ids.add(g.image);
    }
    for (const id of ids) {
      for (const arquivo of arquivosDe(id)) expect(existsSync(resolve(arquivo)), arquivo).toBe(true);
    }
  });
  it('a galeria do casamento tem as 8 fotos (5 horizontais e 3 verticais)', () => {
    const casamento = projects.find((p) => p.slug === 'juliana-e-marcio');
    expect(casamento?.gallery).toHaveLength(8);
    const ids = casamento?.gallery.flatMap((g) => (g.kind === 'image' ? [g.image] : [])) ?? [];
    expect(ids.filter((i) => i.endsWith('vertical'))).toHaveLength(3);
  });
  it('o link do Heitor Amatsu aponta para o Instagram dele', () => {
    expect(projects.find((p) => p.slug === 'heitor-amatsu')?.link?.href).toBe(
      'https://www.instagram.com/heitoramatsu/',
    );
  });
  it('o schema recusa vídeo com ID inválido e imagem desconhecida', () => {
    const base = projects[0]!;
    expect(() => projectSchema.parse({ ...base, video: { type: 'youtube', id: 'x' } })).toThrow();
    expect(() => projectSchema.parse({ ...base, cover: 'nao-existe' })).toThrow();
  });
});
