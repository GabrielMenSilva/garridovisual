/** Tipos do manifesto gerado por `pnpm media:import` (src/data/media.generated.ts). */

export type Orientacao = 'horizontal' | 'vertical' | 'quadrado';

/**
 * Imagem responsiva gerada pelos scripts: os arquivos ficam em `${base}-${largura}.${formato}`.
 * Fotos: AVIF + WebP. Posters de vídeo: AVIF + JPG. O último formato é o de reserva do <img>.
 */
export interface Imagem {
  readonly base: string;
  readonly largura: number;
  readonly altura: number;
  readonly larguras: readonly number[];
  readonly formatos: readonly ('avif' | 'webp' | 'jpg')[];
  /** Miniatura minúscula (data URL) mostrada enquanto a imagem carrega. */
  readonly blur: string;
}

interface MidiaVideoBase {
  /** Nome do arquivo no site (ex.: "01-video.mp4"). Use em `videoPrincipal` para trocar o principal. */
  readonly arquivo: string;
  readonly poster: Imagem;
  readonly largura: number;
  readonly altura: number;
  readonly orientacao: Orientacao;
  /** Segundos. */
  readonly duracao: number;
  readonly bytes: number;
  readonly temAudio: boolean;
  /** Nome do arquivo de origem, limpo (sem extensão nem números). Pode ser vazio. */
  readonly titulo: string;
}

/** Vídeo hospedado no próprio site (public/media/projetos/<slug>/). */
export interface MidiaVideoArquivo extends MidiaVideoBase {
  readonly tipo: 'video';
  readonly src: string;
}

/** Vídeo grande demais para o site: precisa subir no YouTube/Vimeo e trocar o `id` em projects.ts. */
export interface MidiaVideoExterno extends MidiaVideoBase {
  readonly tipo: 'youtube' | 'vimeo';
  readonly id: 'TODO';
}

export interface MidiaFoto {
  readonly tipo: 'foto';
  readonly arquivo: string;
  readonly imagem: Imagem;
  readonly largura: number;
  readonly altura: number;
  readonly orientacao: Orientacao;
}

/** Texto lido de um .txt/.md na pasta do projeto. */
export interface TextoDaPasta {
  readonly titulo?: string;
  readonly descricao: string;
  readonly funcoes?: readonly string[];
  readonly youtube?: string;
  readonly vimeo?: string;
}

export interface MidiaProjeto {
  readonly slug: string;
  /** Pasta (ou arquivo solto) de origem. `null` para projetos sem mídia na pasta. */
  readonly pasta: string | null;
  /** Prefixo numérico da pasta ("01-…"), que define a posição do projeto no site. */
  readonly ordem: number | null;
  readonly tituloSugerido: string;
  /** `arquivo` do vídeo principal sugerido. */
  readonly principal: string | null;
  readonly videos: readonly (MidiaVideoArquivo | MidiaVideoExterno)[];
  readonly fotos: readonly MidiaFoto[];
  readonly textoDaPasta?: TextoDaPasta;
  /** Só em projetos que ainda não estão em projects.ts. */
  readonly rascunho?: {
    readonly titulo: string;
    readonly funcoes: readonly string[];
    readonly resumo: string;
  };
}
