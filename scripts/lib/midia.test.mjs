import { describe, expect, it } from 'vitest';
import {
  chave,
  classificarArquivo,
  escolherPrincipal,
  ligarAoProjeto,
  nomeLimpo,
  nomeNoSite,
  ordenarMidia,
  orientacao,
  prefixoNumerico,
  slugify,
  tituloDeNome,
} from './midia.mjs';

const EXISTENTES = [
  { slug: 'hey-maringa', titulo: 'Hey Maringá' },
  { slug: 'el-piratas', titulo: 'El Piratas' },
  { slug: 'ody-park', titulo: 'Ody Park' },
  { slug: 'juliana-e-marcio', titulo: 'Juliana & Márcio' },
  { slug: 'mk5', titulo: 'MK5 Arquitetos' },
  { slug: 'heitor-amatsu', titulo: 'Heitor Amatsu' },
];

const c = (caminho) => ({ caminho });

describe('slugify', () => {
  it('tira acentos e põe tudo em minúsculas', () => {
    expect(slugify('Hey Maringá')).toBe('hey-maringa');
    expect(slugify('MG nataçao')).toBe('mg-natacao');
    expect(slugify('ÁÉÍÓÚ ÇÃÕ')).toBe('aeiou-cao');
  });
  it('troca espaços e símbolos por hífen, sem hífen nas pontas nem repetido', () => {
    expect(slugify('  fora   de centro ')).toBe('fora-de-centro');
    expect(slugify('foto (1)')).toBe('foto-1');
    expect(slugify('hey_maringa--final!!')).toBe('hey-maringa-final');
    expect(slugify('4.')).toBe('4');
  });
  it('lê "&" como "e"', () => {
    expect(slugify('Juliana & Márcio')).toBe('juliana-e-marcio');
  });
  it('nome com "cópia" continua um slug válido', () => {
    expect(slugify('Vídeo - Cópia (2)')).toBe('video-copia-2');
  });
});

describe('classificarArquivo', () => {
  it.each([
    ['a/b.mp4', 'video'],
    ['clip.MOV', 'video'],
    ['x.mkv', 'video'],
    ['f.jpg', 'foto'],
    ['f.JPEG', 'foto'],
    ['iphone.HEIC', 'foto'],
    ['raw.dng', 'foto'],
    ['sobre.txt', 'texto'],
    ['historia.md', 'texto'],
    ['texto.docx', 'texto'],
    ['.DS_Store', 'ignorar'],
    ['Thumbs.db', 'ignorar'],
    ['desktop.ini', 'ignorar'],
    ['._foto.jpg', 'ignorar'],
    ['planilha.xlsx', 'ignorar'],
    ['sem-extensao', 'ignorar'],
  ])('%s → %s', (arquivo, esperado) => {
    expect(classificarArquivo(arquivo)).toBe(esperado);
  });
});

describe('ligarAoProjeto', () => {
  it.each([
    ['Hey Maringá/a.mp4', 'hey-maringa'],
    ['hey_maringa/a.mp4', 'hey-maringa'],
    ['HEYMARINGA/a.mp4', 'hey-maringa'],
    ['hey maringa 2.mp4', 'hey-maringa'],
    ['El Piratas/videos/1.mp4', 'el-piratas'],
    ['el-piratas.mp4', 'el-piratas'],
    ['ODY PARK/fotos/x.jpg', 'ody-park'],
    ['Juliana & Marcio/x.jpg', 'juliana-e-marcio'],
    ['juliana e márcio/x.jpg', 'juliana-e-marcio'],
    ['JulianaMarcio (1).mp4', 'juliana-e-marcio'],
    ['MK5/x.mp4', 'mk5'],
    ['MK5 Arquitetos/x.mp4', 'mk5'],
    ['Heitor Amatsu/x.mp4', 'heitor-amatsu'],
    ['heitor-amatsu_03.mp4', 'heitor-amatsu'],
  ])('%s → projeto existente %s', (caminho, slug) => {
    const r = ligarAoProjeto(caminho, EXISTENTES);
    expect(r?.slug).toBe(slug);
    expect(r?.existente).toBe(true);
  });

  it('pasta que não casa vira projeto novo, com slug da pasta', () => {
    expect(ligarAoProjeto('MG nataçao/4..mp4', EXISTENTES)).toMatchObject({
      slug: 'mg-natacao',
      existente: false,
      regra: 'pasta',
      pasta: 'MG nataçao',
    });
  });

  it('arquivo solto na raiz: o nome do arquivo é o projeto', () => {
    expect(ligarAoProjeto('pedido de casamento.mp4', EXISTENTES)).toMatchObject({
      slug: 'pedido-de-casamento',
      existente: false,
      regra: 'arquivo-solto',
    });
  });

  it('prefixo numérico da pasta vira a ordem e não entra no slug', () => {
    expect(ligarAoProjeto('03-Clínica X/a.mp4', EXISTENTES)).toMatchObject({ slug: 'clinica-x', ordem: 3 });
    expect(ligarAoProjeto('01-Hey Maringá/a.mp4', EXISTENTES)).toMatchObject({
      slug: 'hey-maringa',
      ordem: 1,
    });
  });

  it('candidatos a hero, foto do Garrido e logo soltos na raiz não viram projeto', () => {
    expect(ligarAoProjeto('showreel 2026.mp4', EXISTENTES)).toBeNull();
    expect(ligarAoProjeto('foto garrido.jpg', EXISTENTES)).toBeNull();
    expect(ligarAoProjeto('logo.png', EXISTENTES)).toBeNull();
    expect(ligarAoProjeto('historia.txt', EXISTENTES)).toBeNull();
  });

  it('dentro de uma pasta, "capa" não tira o arquivo do projeto', () => {
    expect(ligarAoProjeto('casamento/capa.mp4', EXISTENTES)?.slug).toBe('casamento');
  });

  it('apelido força a ligação com um projeto existente', () => {
    expect(
      ligarAoProjeto('casamento J&M/a.jpg', EXISTENTES, { [chave('casamento J&M')]: 'juliana-e-marcio' }),
    ).toMatchObject({ slug: 'juliana-e-marcio', existente: true });
  });
});

describe('ordenarMidia', () => {
  it('ordem natural: 2 antes de 10', () => {
    const r = ordenarMidia([c('p/10.jpg'), c('p/2.jpg'), c('p/1.jpg')]).map((x) => x.caminho);
    expect(r).toEqual(['p/1.jpg', 'p/2.jpg', 'p/10.jpg']);
  });
  it('usa o prefixo numérico do nome, mesmo em subpastas diferentes', () => {
    const r = ordenarMidia([c('p/v/2.jpg'), c('p/h/3.jpg'), c('p/h/2.jpg'), c('p/v/1.jpg')]).map(
      (x) => x.caminho,
    );
    expect(r).toEqual(['p/v/1.jpg', 'p/h/2.jpg', 'p/v/2.jpg', 'p/h/3.jpg']);
  });
  it('quem tem número vem antes; o resto em ordem alfabética natural', () => {
    const r = ordenarMidia([
      c('p/video 1.2.mp4'),
      c('p/edit estilo.mp4'),
      c('p/02-abertura.mp4'),
      c('p/1.1.1.1.mp4'),
    ]).map((x) => x.caminho);
    expect(r).toEqual(['p/1.1.1.1.mp4', 'p/02-abertura.mp4', 'p/edit estilo.mp4', 'p/video 1.2.mp4']);
  });
  it('lê prefixos com pontos: "4..mp4" é 4, "3.3" é 3', () => {
    expect(prefixoNumerico('4..mp4')).toBe(4);
    expect(prefixoNumerico('3.3.mp4')).toBe(3);
    expect(prefixoNumerico('video 1.2.mp4')).toBeNull();
  });
  it('não altera a lista original', () => {
    const lista = [c('b.mp4'), c('a.mp4')];
    ordenarMidia(lista);
    expect(lista[0]?.caminho).toBe('b.mp4');
  });
});

describe('escolherPrincipal', () => {
  it('prefere o nome com principal/main/destaque/capa', () => {
    expect(escolherPrincipal([c('p/1.mp4'), c('p/2 destaque.mp4')])?.caminho).toBe('p/2 destaque.mp4');
    expect(escolherPrincipal([c('p/1.mp4'), c('p/Main.mp4')])?.caminho).toBe('p/Main.mp4');
    expect(escolherPrincipal([c('p/a.mp4'), c('p/capa-final.mp4')])?.caminho).toBe('p/capa-final.mp4');
    expect(escolherPrincipal([c('p/a.mp4'), c('p/PRINCIPAL.mp4')])?.caminho).toBe('p/PRINCIPAL.mp4');
  });
  it('senão, o de menor número de ordem', () => {
    expect(escolherPrincipal([c('p/3.mp4'), c('p/10.mp4'), c('p/2.mp4')])?.caminho).toBe('p/2.mp4');
  });
  it('senão, o primeiro em ordem natural', () => {
    expect(escolherPrincipal([c('p/video 1.2.mp4'), c('p/edit estilo.mp4')])?.caminho).toBe(
      'p/edit estilo.mp4',
    );
  });
  it('não confunde palavras que só contêm "capa" (ex.: "escapada")', () => {
    expect(escolherPrincipal([c('p/1.mp4'), c('p/escapada.mp4')])?.caminho).toBe('p/1.mp4');
  });
  it('sem vídeos: null', () => {
    expect(escolherPrincipal([])).toBeNull();
  });
});

describe('orientacao', () => {
  it('horizontal, vertical e quadrado', () => {
    expect(orientacao(1920, 1080)).toBe('horizontal');
    expect(orientacao(1276, 720)).toBe('horizontal');
    expect(orientacao(1080, 1920)).toBe('vertical');
    expect(orientacao(1080, 1080)).toBe('quadrado');
    expect(orientacao(1080, 1050)).toBe('quadrado'); // até 5% conta como quadrado
    expect(orientacao(1080, 1350)).toBe('vertical'); // 4:5
  });
  it('rejeita dimensões inválidas', () => {
    expect(() => orientacao(0, 100)).toThrow();
    expect(() => orientacao(Number.NaN, 100)).toThrow();
  });
});

describe('nomes e títulos', () => {
  it('nome no site: número de ordem + slug sem o prefixo; vazio vira o tipo', () => {
    expect(nomeNoSite(1, 'MG nataçao/1.1.1.1.mp4', 'video')).toBe('01-video');
    expect(nomeNoSite(2, 'fora de centro/video 1.2.mp4', 'video')).toBe('02-video-1-2');
    expect(nomeNoSite(12, 'casamento/fotos vertical/19.jpg', 'foto')).toBe('12-foto');
    expect(nomeNoSite(3, 'x/02 - Abertura.mp4', 'video')).toBe('03-abertura');
  });
  it('nome limpo para rótulo: sem extensão nem números', () => {
    expect(nomeLimpo('edit estilo.mp4')).toBe('edit estilo');
    expect(nomeLimpo('video 1.2.mp4')).toBe('video');
    expect(nomeLimpo('1.1.1.1.mp4')).toBe('');
    expect(nomeLimpo('festa_final (2).mov')).toBe('festa final');
  });
  it('título a partir do nome da pasta', () => {
    expect(tituloDeNome('marketing-clinica-x')).toBe('Marketing Clínica X');
    expect(tituloDeNome('MG nataçao')).toBe('MG Natação');
    expect(tituloDeNome('pedido de casamento')).toBe('Pedido de Casamento');
    expect(tituloDeNome('fora de centro')).toBe('Fora de Centro');
    expect(tituloDeNome('02-hey maringa')).toBe('Hey Maringá');
  });
});
