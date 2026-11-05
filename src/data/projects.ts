import { z } from 'zod';
import { imagens, type ImagemId } from './imagens.generated';

/**
 * Para adicionar um projeto, vídeo ou foto, edite SÓ este arquivo.
 * Veja exemplos em docs/como-editar-conteudo.md.
 */

const imageId = z.custom<ImagemId>((v) => typeof v === 'string' && v in imagens, {
  message:
    'Imagem desconhecida: rode `pnpm assets:optimize` ou confira o nome em src/data/imagens.generated.ts',
});

const youtube = z.object({
  type: z.literal('youtube'),
  id: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'ID do YouTube inválido'),
});
const vimeo = z.object({
  type: z.literal('vimeo'),
  id: z.string().regex(/^\d{5,12}$/, 'ID do Vimeo inválido'),
  hash: z
    .string()
    .regex(/^[a-f0-9]{6,20}$/i)
    .optional(),
});
const file = z.object({
  type: z.literal('file'),
  src: z
    .string()
    .regex(/^\/media\/[\w./-]+\.(mp4|webm)$/, 'Arquivos de vídeo ficam em /media/ (public/media/)'),
  poster: z.string().optional(),
});
export const videoSchema = z.discriminatedUnion('type', [youtube, vimeo, file]);

const galleryItem = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('image'),
    image: imageId,
    alt: z.string().min(3),
    caption: z.string().optional(),
  }),
  z.object({
    kind: z.literal('video'),
    video: videoSchema,
    title: z.string().min(3),
    caption: z.string().optional(),
  }),
]);

export const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().min(2),
  roles: z.array(z.string().min(2)).min(1),
  summary: z.string().min(40),
  cover: imageId,
  coverAlt: z.string().min(3),
  /** Ponto de foco da capa quando cortada em 16:9 (CSS object-position). */
  coverFocus: z.string().default('50% 50%'),
  /** Vídeo principal. `null` = "Vídeo em breve". */
  video: videoSchema.nullable(),
  gallery: z.array(galleryItem),
  link: z.object({ label: z.string(), href: z.url() }).optional(),
});

export type Project = z.infer<typeof projectSchema>;
export type GalleryItem = z.infer<typeof galleryItem>;

const casamento = (n: string, alt: string): GalleryItem => ({
  kind: 'image',
  image: `juliana-marcio-galeria-${n}` as ImagemId,
  alt,
});

const rawProjects = [
  {
    slug: 'hey-maringa',
    title: 'Hey Maringá',
    roles: ['Filmmaker', 'Editor', 'Diretor'],
    summary:
      'Filmmaker e editor do Hey Maringá, perfil de lifestyle e dicas da cidade com mais de 200 mil seguidores. Cuido da captação, da direção e da edição de conteúdos dinâmicos e criativos. A ideia é sempre contar histórias de um jeito que prende, inspira e fica na memória.',
    cover: 'hey-maringa-capa',
    coverAlt: 'Capa do projeto Hey Maringá',
    coverFocus: '50% 35%',
    // TODO(garrido): vídeo principal do Hey Maringá (YouTube, Vimeo ou arquivo em public/media/)
    video: null,
    gallery: [],
  },
  {
    slug: 'el-piratas',
    title: 'El Piratas',
    roles: ['Editor', 'Motion design'],
    summary:
      'Editei vídeos e criei motion design para o El Piratas, um restaurante de pegada única e cheio de energia. São conteúdos para redes sociais e campanhas promocionais, com animações que reforçam a identidade visual. A ideia foi captar o clima do lugar e o movimento.',
    cover: 'el-piratas-capa',
    coverAlt: 'Capa do projeto El Piratas',
    // TODO(garrido): vídeo principal do El Piratas
    video: null,
    gallery: [],
  },
  {
    slug: 'ody-park',
    title: 'Ody Park',
    roles: ['Editor', 'Motion design'],
    summary:
      'Editor e motion designer do Ody Park, parque aquático do Paraná. Produzi vídeos para campanhas sazonais, redes sociais e divulgação de eventos. A vibe do parque guiou tudo: cores, alegria e um clima leve.',
    cover: 'ody-park-capa',
    coverAlt: 'Capa do projeto Ody Park',
    // TODO(garrido): vídeo principal do Ody Park
    video: null,
    gallery: [],
  },
  {
    slug: 'juliana-e-marcio',
    title: 'Juliana & Márcio',
    roles: ['Filmmaker', 'Editor', 'Fotógrafo'],
    summary:
      'Registrei o casamento da Juliana e do Márcio em foto e vídeo, da captação à edição final. Um dia cheio de emoção, sorrisos e momentos únicos, contado de um jeito leve, natural e cheio de sentimento.',
    cover: 'juliana-marcio-capa',
    coverAlt: 'Capa do projeto Juliana & Márcio',
    // TODO(garrido): vídeo principal do casamento
    video: null,
    gallery: [
      casamento('28', 'Casamento de Juliana e Márcio, foto 1 de 8'),
      casamento('25', 'Casamento de Juliana e Márcio, foto 2 de 8'),
      casamento('31', 'Casamento de Juliana e Márcio, foto 3 de 8'),
      casamento('38', 'Casamento de Juliana e Márcio, foto 4 de 8'),
      casamento('43', 'Casamento de Juliana e Márcio, foto 5 de 8'),
      casamento('04-vertical', 'Casamento de Juliana e Márcio, foto 6 de 8 (vertical)'),
      casamento('14-vertical', 'Casamento de Juliana e Márcio, foto 7 de 8 (vertical)'),
      casamento('15-vertical', 'Casamento de Juliana e Márcio, foto 8 de 8 (vertical)'),
    ],
  },
  {
    slug: 'mk5',
    title: 'MK5 Arquitetos',
    roles: ['Editor', 'Motion design'],
    summary:
      'Cuidei da edição e do motion design para a MK5 Arquitetos, escritório de arquitetura. O objetivo foi comunicar os projetos com ritmo, identidade e movimento, do jeito que a marca pede.',
    cover: 'mk5-capa',
    coverAlt: 'Capa do projeto MK5 Arquitetos, com a marca do escritório',
    // TODO(garrido): vídeo principal da MK5
    video: null,
    gallery: [],
  },
  {
    slug: 'heitor-amatsu',
    title: 'Heitor Amatsu',
    roles: ['Editor'],
    summary:
      'Editei os vídeos do canal de YouTube do Heitor Amatsu, criador do mangá "Lampião". Cuidei do ritmo, dos cortes e da identidade visual para deixar o conteúdo dinâmico e com o estilo do criador.',
    cover: 'heitor-amatsu-capa',
    coverAlt: 'Capa do projeto Heitor Amatsu',
    // TODO(garrido): vídeo principal do canal do Heitor Amatsu
    video: null,
    gallery: [],
    link: { label: 'Instagram do Heitor Amatsu', href: 'https://www.instagram.com/heitoramatsu/' },
  },
] satisfies z.input<typeof projectSchema>[];

export const projects: readonly Project[] = z.array(projectSchema).min(1).parse(rawProjects);
