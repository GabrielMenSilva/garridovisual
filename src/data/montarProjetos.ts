import { imagens, type ImagemId } from './imagens.generated';
import type { MidiaProjeto, MidiaVideoArquivo, MidiaVideoExterno } from '../lib/tipos-midia';
import type { Imagem, Item, ItemFoto, Projeto, VideoPrincipal } from './schema';

/** Embed do YouTube/Vimeo escrito à mão em projects.ts. */
export type EmbedEscrito =
  | { readonly tipo: 'youtube'; readonly id: string }
  | { readonly tipo: 'vimeo'; readonly id: string; readonly hash?: string };

/** O que se escreve à mão para cada projeto em src/data/projects.ts. */
export interface TextoProjeto {
  readonly slug: string;
  readonly titulo: string;
  /** Pode ficar vazia: os chips de função somem. */
  readonly funcoes: readonly string[];
  /** Texto principal do slide (1 a 3 frases). */
  readonly resumo: string;
  /** Parágrafo extra opcional, mostrado abaixo do resumo. */
  readonly descricao?: string;
  /** Capa vinda das imagens antigas (src/data/imagens.generated.ts). Sem ela: poster do vídeo principal ou 1ª foto. */
  readonly capa?: ImagemId;
  readonly capaAlt?: string;
  readonly capaFoco?: string;
  /**
   * Vídeo principal. Omitido: o sugerido pelo `pnpm media:import`.
   * Texto: o `arquivo` de um vídeo do projeto (ex.: '02-video.mp4'). Objeto: YouTube/Vimeo. `null`: sem vídeo.
   */
  readonly videoPrincipal?: string | EmbedEscrito | null;
  /** Fotos antigas (imagens.generated.ts) que entram na galeria antes das fotos novas. */
  readonly fotosAntigas?: readonly { readonly imagem: ImagemId; readonly alt: string }[];
  /** Texto alternativo por foto nova, pelo `arquivo` do manifesto (ex.: { '03-foto': 'Noivos na saída da igreja' }). */
  readonly altDasFotos?: Readonly<Record<string, string>>;
  readonly linkExterno?: { readonly rotulo: string; readonly href: string };
}

/** Converte uma imagem antiga (imagens.generated.ts) para o formato comum. */
export function imagemAntiga(id: ImagemId): Imagem {
  const m = imagens[id];
  return {
    base: `/images/${id}`,
    largura: m.width,
    altura: m.height,
    larguras: [...m.widths],
    formatos: ['avif', 'webp'],
    blur: m.blur,
  };
}

function orientacaoDe(largura: number, altura: number): ItemFoto['orientacao'] {
  const r = largura / altura;
  if (Math.abs(r - 1) <= 0.05) return 'quadrado';
  return r > 1 ? 'horizontal' : 'vertical';
}

function videoDoManifesto(v: MidiaVideoArquivo | MidiaVideoExterno, titulo: string): Item {
  const poster: Imagem = { ...v.poster, larguras: [...v.poster.larguras], formatos: [...v.poster.formatos] };
  if (v.tipo === 'video')
    return {
      tipo: 'video',
      src: v.src,
      poster,
      largura: v.largura,
      altura: v.altura,
      orientacao: v.orientacao,
      duracao: v.duracao,
      titulo,
    };
  return { tipo: v.tipo, id: v.id, titulo, poster };
}

/** Rótulo de um vídeo: o nome do arquivo limpo; sem nome, "Vídeo n". */
function tituloDoVideo(v: { titulo: string }, n: number, total: number): string {
  if (v.titulo) return v.titulo;
  return total > 1 ? `Vídeo ${n}` : 'Vídeo';
}

/**
 * Junta o texto escrito à mão (projects.ts) com a mídia gerada (media.generated.ts).
 * Ordem: a de projects.ts; depois os projetos que só existem na mídia (rascunho), em ordem natural;
 * por fim, quem tem prefixo numérico na pasta ("03-…") vai para essa posição.
 */
export function montarProjetos(
  textos: readonly TextoProjeto[],
  midia: Readonly<Record<string, MidiaProjeto>>,
): Projeto[] {
  const slugsEscritos = new Set(textos.map((t) => t.slug));
  const rascunhos: TextoProjeto[] = Object.values(midia)
    .filter((m) => !slugsEscritos.has(m.slug) && (m.videos.length > 0 || m.fotos.length > 0))
    .sort((a, b) => (a.pasta ?? a.slug).localeCompare(b.pasta ?? b.slug, 'pt-BR', { numeric: true }))
    .map((m) => {
      const t = m.textoDaPasta;
      const r = m.rascunho;
      const embed: EmbedEscrito | undefined = t?.youtube
        ? { tipo: 'youtube', id: t.youtube }
        : t?.vimeo
          ? { tipo: 'vimeo', id: t.vimeo }
          : undefined;
      return {
        slug: m.slug,
        titulo: t?.titulo || r?.titulo || m.tituloSugerido,
        funcoes: t?.funcoes ?? r?.funcoes ?? [],
        resumo: t?.descricao || r?.resumo || `Vídeos e imagens do projeto ${m.tituloSugerido}.`,
        ...(embed ? { videoPrincipal: embed } : {}),
      };
    });

  const todos = [...textos, ...rascunhos].map((texto) => montarUm(texto, midia[texto.slug]));

  // prefixo numérico da pasta manda na posição
  const comOrdem = todos
    .map((p) => ({ p, ordem: midia[p.slug]?.ordem ?? null }))
    .filter((x): x is { p: Projeto; ordem: number } => x.ordem !== null)
    .sort((a, b) => a.ordem - b.ordem);
  if (!comOrdem.length) return todos;
  const resto = todos.filter((p) => !comOrdem.some((x) => x.p === p));
  for (const { p, ordem } of comOrdem) resto.splice(Math.min(Math.max(ordem - 1, 0), resto.length), 0, p);
  return resto;
}

function montarUm(texto: TextoProjeto, m: MidiaProjeto | undefined): Projeto {
  const videosMidia = m?.videos ?? [];
  const videos = videosMidia.map((v, i) => videoDoManifesto(v, tituloDoVideo(v, i + 1, videosMidia.length)));
  const fotosAntigas: Item[] = (texto.fotosAntigas ?? []).map((f) => {
    const imagem = imagemAntiga(f.imagem);
    return {
      tipo: 'foto',
      imagem,
      alt: f.alt,
      largura: imagem.largura,
      altura: imagem.altura,
      orientacao: orientacaoDe(imagem.largura, imagem.altura),
    };
  });
  const fotosNovas: Item[] = (m?.fotos ?? []).map((f, i) => ({
    tipo: 'foto',
    imagem: { ...f.imagem, larguras: [...f.imagem.larguras], formatos: [...f.imagem.formatos] },
    // TODO(garrido): descrever melhor cada foto (texto alternativo)
    alt: texto.altDasFotos?.[f.arquivo] ?? `${texto.titulo} — foto ${fotosAntigas.length + i + 1}`,
    largura: f.largura,
    altura: f.altura,
    orientacao: f.orientacao,
  }));

  let videoPrincipal: VideoPrincipal | null = null;
  const escolha = texto.videoPrincipal === undefined ? (m?.principal ?? null) : texto.videoPrincipal;
  if (typeof escolha === 'string') {
    const i = videosMidia.findIndex((v) => v.arquivo === escolha);
    if (i === -1)
      throw new Error(
        `${texto.slug}: videoPrincipal "${escolha}" não existe. Opções: ${videosMidia.map((v) => v.arquivo).join(', ') || 'nenhuma'}`,
      );
    videoPrincipal = videos[i] as VideoPrincipal;
  } else if (escolha) {
    videoPrincipal = { ...escolha, titulo: texto.titulo };
  }

  const primeiraFoto = [...fotosAntigas, ...fotosNovas].find((f) => f.tipo === 'foto');
  const capa: Imagem | undefined = texto.capa
    ? imagemAntiga(texto.capa)
    : videoPrincipal && 'poster' in videoPrincipal && videoPrincipal.poster
      ? videoPrincipal.poster
      : ((videos.find((v) => 'poster' in v && v.poster) as { poster?: Imagem } | undefined)?.poster ??
        (primeiraFoto?.tipo === 'foto' ? primeiraFoto.imagem : undefined));
  if (!capa)
    throw new Error(`${texto.slug}: sem capa (defina \`capa\` em projects.ts ou adicione mídia na pasta)`);

  // embed escrito à mão sem poster próprio usa a capa como fachada
  if (videoPrincipal && videoPrincipal.tipo !== 'video' && !videoPrincipal.poster)
    videoPrincipal = { ...videoPrincipal, poster: capa };

  return {
    slug: texto.slug,
    titulo: texto.titulo,
    funcoes: [...texto.funcoes],
    resumo: texto.resumo,
    ...(texto.descricao ? { descricao: texto.descricao } : {}),
    capa,
    capaAlt: texto.capaAlt ?? `Capa do projeto ${texto.titulo}`,
    capaFoco: texto.capaFoco ?? '50% 50%',
    videoPrincipal,
    // vídeos primeiro (ordem do manifesto), depois as fotos
    galeria: [...videos, ...fotosAntigas, ...fotosNovas],
    ...(texto.linkExterno ? { linkExterno: { ...texto.linkExterno } } : {}),
  };
}
