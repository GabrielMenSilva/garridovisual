import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { MidiaProjeto } from '../lib/tipos-midia';
import { midia } from './media.generated';
import { montarProjetos, type TextoProjeto } from './montarProjetos';
import { projects, textos } from './projects';
import { criarSchemaProjetos, type Imagem, type ItemVideo } from './schema';

const existeEmPublic = (caminho: string) => existsSync(join('public', caminho));
const schemaComArquivos = criarSchemaProjetos(existeEmPublic);

const ANTIGOS = ['hey-maringa', 'el-piratas', 'ody-park', 'juliana-e-marcio', 'mk5', 'heitor-amatsu'];

describe('projects (dados reais)', () => {
  it('passa no zod conferindo que TODO arquivo citado existe em public/', () => {
    const r = schemaComArquivos.projetos.safeParse(projects);
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues.slice(0, 5), null, 1)).toBe(true);
  });

  it('os 6 projetos antigos mantêm a ordem e os novos vêm depois', () => {
    expect(projects.slice(0, 6).map((p) => p.slug)).toEqual(ANTIGOS);
    expect(projects.length).toBe(textos.length);
  });

  it('tem slugs únicos', () => {
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length);
  });

  it('todo projeto tem título e texto; funções podem estar vazias', () => {
    for (const p of projects) {
      expect(p.titulo.length).toBeGreaterThan(1);
      expect(p.resumo.length).toBeGreaterThanOrEqual(10);
      expect(Array.isArray(p.funcoes)).toBe(true);
    }
  });

  it('o manifesto gerado cobre todos os projetos do projects.ts', () => {
    for (const t of textos) expect(midia, t.slug).toHaveProperty(t.slug);
  });

  it('todo projeto com vídeo no manifesto tem vídeo principal (sem "Vídeo em breve" por engano)', () => {
    for (const p of projects) {
      const m = (midia as Record<string, MidiaProjeto>)[p.slug];
      if (m && m.videos.length > 0) expect(p.videoPrincipal, p.slug).not.toBeNull();
    }
  });

  it('galeria: vídeos primeiro, depois as fotos; nº de itens = vídeos + fotos do manifesto', () => {
    for (const p of projects) {
      const m = (midia as Record<string, MidiaProjeto>)[p.slug];
      const tipos = p.galeria.map((g) => (g.tipo === 'foto' ? 'foto' : 'video'));
      expect(tipos.join(','), p.slug).toBe(
        [...tipos].sort((a, b) => (a === b ? 0 : a === 'video' ? -1 : 1)).join(','),
      );
      if (m && p.slug !== 'juliana-e-marcio') expect(p.galeria.length).toBe(m.videos.length + m.fotos.length);
    }
  });

  it('o casamento da Juliana e do Márcio mantém as 8 fotos antigas', () => {
    const jm = projects.find((p) => p.slug === 'juliana-e-marcio');
    expect(jm?.galeria.filter((g) => g.tipo === 'foto')).toHaveLength(8);
  });

  it('o link do Heitor Amatsu aponta para o Instagram dele', () => {
    expect(projects.find((p) => p.slug === 'heitor-amatsu')?.linkExterno?.href).toBe(
      'https://www.instagram.com/heitoramatsu/',
    );
  });

  it('vídeos verticais mantêm a proporção do arquivo', () => {
    const videos = projects.flatMap((p) => p.galeria.filter((g): g is ItemVideo => g.tipo === 'video'));
    for (const v of videos) {
      const r = v.largura / v.altura;
      if (v.orientacao === 'vertical') expect(r).toBeLessThan(0.95);
      if (v.orientacao === 'horizontal') expect(r).toBeGreaterThan(1.05);
    }
  });
});

// ── zod ──────────────────────────────────────────────────────────────────────────────────────
const img: Imagem = {
  base: '/images/hey-maringa-capa',
  largura: 722,
  altura: 1283,
  larguras: [240, 480, 722],
  formatos: ['avif', 'webp'],
  blur: 'data:image/webp;base64,AAAA',
};
const projetoValido = {
  slug: 'teste',
  titulo: 'Teste',
  funcoes: [],
  resumo: 'Um resumo qualquer.',
  capa: img,
  capaAlt: 'Capa do teste',
  capaFoco: '50% 50%',
  videoPrincipal: null,
  galeria: [],
};
const videoOk: ItemVideo = {
  tipo: 'video',
  src:
    projects.flatMap((p) => p.galeria).find((g): g is ItemVideo => g.tipo === 'video')?.src ?? '/media/x.mp4',
  poster: img,
  largura: 1080,
  altura: 1920,
  orientacao: 'vertical',
  duracao: 10,
  titulo: 'Vídeo',
};

describe('schema zod', () => {
  it('aceita funcoes: [] e projeto sem vídeo', () => {
    expect(schemaComArquivos.projeto.safeParse(projetoValido).success).toBe(true);
  });
  it('aceita um vídeo próprio que existe em public/', () => {
    expect(schemaComArquivos.item.safeParse(videoOk).success).toBe(true);
  });
  it('rejeita vídeo sem poster', () => {
    const semPoster: Partial<ItemVideo> = { ...videoOk };
    delete semPoster.poster;
    expect(schemaComArquivos.item.safeParse(semPoster).success).toBe(false);
  });
  it('rejeita vídeo sem src', () => {
    const semSrc: Partial<ItemVideo> = { ...videoOk };
    delete semSrc.src;
    expect(schemaComArquivos.item.safeParse(semSrc).success).toBe(false);
  });
  it('rejeita src que não existe em public/', () => {
    expect(
      schemaComArquivos.item.safeParse({ ...videoOk, src: '/media/projetos/nao/existe.mp4' }).success,
    ).toBe(false);
  });
  it('rejeita poster cujos arquivos não existem', () => {
    const r = schemaComArquivos.item.safeParse({
      ...videoOk,
      poster: { ...img, base: '/images/nao-existe' },
    });
    expect(r.success).toBe(false);
  });
  it('rejeita src fora de /media/ e ID do YouTube inválido', () => {
    expect(schemaComArquivos.item.safeParse({ ...videoOk, src: 'https://x.com/a.mp4' }).success).toBe(false);
    expect(schemaComArquivos.item.safeParse({ tipo: 'youtube', id: 'x', titulo: 'x' }).success).toBe(false);
    expect(schemaComArquivos.item.safeParse({ tipo: 'youtube', id: 'TODO', titulo: 'x' }).success).toBe(true);
  });
});

// ── montarProjetos (com mídia de mentira) ────────────────────────────────────────────────────
const poster = (n: string): Imagem => ({ ...img, base: `/images/projetos/${n}-poster` });
function midiaDe(slug: string, extra: Partial<MidiaProjeto> = {}): MidiaProjeto {
  return {
    slug,
    pasta: slug,
    ordem: null,
    tituloSugerido: slug,
    principal: null,
    videos: [],
    fotos: [],
    ...extra,
  };
}
const v = (arquivo: string, largura = 1920, altura = 1080) => ({
  tipo: 'video' as const,
  arquivo,
  src: `/media/projetos/p/${arquivo}`,
  poster: poster(arquivo),
  largura,
  altura,
  orientacao: largura > altura ? ('horizontal' as const) : ('vertical' as const),
  duracao: 12,
  bytes: 1,
  temAudio: true,
  titulo: '',
});
const texto = (slug: string, extra: Partial<TextoProjeto> = {}): TextoProjeto => ({
  slug,
  titulo: `Projeto ${slug}`,
  funcoes: [],
  resumo: 'Resumo do projeto.',
  ...extra,
});

describe('montarProjetos', () => {
  it('liga a mídia pelo slug; principal sugerido; capa = poster do principal', () => {
    const [p] = montarProjetos([texto('a')], {
      a: midiaDe('a', { videos: [v('01-video.mp4'), v('02-video.mp4')], principal: '02-video.mp4' }),
    });
    expect(p?.videoPrincipal?.tipo).toBe('video');
    expect(p?.videoPrincipal && 'src' in p.videoPrincipal ? p.videoPrincipal.src : '').toContain(
      '02-video.mp4',
    );
    expect(p?.capa.base).toBe('/images/projetos/02-video.mp4-poster');
    expect(p?.galeria.map((g) => g.tipo)).toEqual(['video', 'video']);
    expect(p?.galeria.map((g) => (g.tipo === 'video' ? g.titulo : ''))).toEqual(['Vídeo 1', 'Vídeo 2']);
  });

  it('videoPrincipal escrito à mão troca o principal; nome errado avisa', () => {
    const m = {
      a: midiaDe('a', { videos: [v('01-video.mp4'), v('02-video.mp4')], principal: '02-video.mp4' }),
    };
    const [p] = montarProjetos([texto('a', { videoPrincipal: '01-video.mp4' })], m);
    expect(p?.videoPrincipal && 'src' in p.videoPrincipal ? p.videoPrincipal.src : '').toContain(
      '01-video.mp4',
    );
    expect(() => montarProjetos([texto('a', { videoPrincipal: '09-x.mp4' })], m)).toThrow(/não existe/);
    const [semVideo] = montarProjetos([texto('a', { videoPrincipal: null })], m);
    expect(semVideo?.videoPrincipal).toBeNull();
  });

  it('embed escrito à mão usa a capa como fachada', () => {
    const [p] = montarProjetos(
      [texto('a', { capa: 'mk5-capa', videoPrincipal: { tipo: 'vimeo', id: '123456789' } })],
      {},
    );
    expect(p?.videoPrincipal).toMatchObject({
      tipo: 'vimeo',
      id: '123456789',
      poster: { base: '/images/mk5-capa' },
    });
  });

  it('projeto só na pasta ganha rascunho e entra depois dos escritos, em ordem natural', () => {
    const r = montarProjetos([texto('a', { capa: 'mk5-capa' })], {
      'pasta-10': midiaDe('pasta-10', {
        videos: [v('01-video.mp4')],
        rascunho: { titulo: 'Pasta 10', funcoes: [], resumo: 'Vídeos e imagens do projeto Pasta 10.' },
      }),
      'pasta-2': midiaDe('pasta-2', { videos: [v('01-video.mp4')] }),
      vazio: midiaDe('vazio'),
    });
    expect(r.map((p) => p.slug)).toEqual(['a', 'pasta-2', 'pasta-10']);
    expect(r[2]?.titulo).toBe('Pasta 10');
    expect(r[2]?.funcoes).toEqual([]);
  });

  it('prefixo numérico da pasta manda na posição', () => {
    const r = montarProjetos(
      [texto('a', { capa: 'mk5-capa' }), texto('b', { capa: 'mk5-capa' }), texto('c', { capa: 'mk5-capa' })],
      {
        novo: midiaDe('novo', { ordem: 1, videos: [v('01-video.mp4')] }),
      },
    );
    expect(r.map((p) => p.slug)).toEqual(['novo', 'a', 'b', 'c']);
  });

  it('fotos: alt padrão "{Título} — foto n" e capa = 1ª foto quando não há vídeo', () => {
    const foto = {
      tipo: 'foto' as const,
      arquivo: '01-foto',
      imagem: poster('f1'),
      largura: 6000,
      altura: 4000,
      orientacao: 'horizontal' as const,
    };
    const [p] = montarProjetos([texto('a')], {
      a: midiaDe('a', { fotos: [foto, { ...foto, arquivo: '02-foto' }] }),
    });
    expect(p?.galeria.map((g) => (g.tipo === 'foto' ? g.alt : ''))).toEqual([
      'Projeto a — foto 1',
      'Projeto a — foto 2',
    ]);
    expect(p?.capa.base).toBe('/images/projetos/f1-poster');
    expect(p?.videoPrincipal).toBeNull();
  });

  it('sem mídia e sem capa: erro claro', () => {
    expect(() => montarProjetos([texto('a')], {})).toThrow(/sem capa/);
  });
});
