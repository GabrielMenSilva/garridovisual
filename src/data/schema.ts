import { z } from 'zod';

/**
 * Modelo de dados dos projetos, validado com zod.
 * No navegador, só a estrutura é conferida. No build (scripts/prerender.mjs) e nos testes,
 * `criarSchemaProjetos(existe)` também confere que cada arquivo citado existe em public/.
 */

export type ArquivoExiste = (caminhoPublico: string) => boolean;

const orientacao = z.enum(['horizontal', 'vertical', 'quadrado']);
const positivo = z.number().positive();

function criarImagem(existe?: ArquivoExiste) {
  return z
    .object({
      base: z.string().regex(/^\/images\/[\w./-]+$/, 'Imagens ficam em /images/ (public/images/)'),
      largura: positivo,
      altura: positivo,
      larguras: z.array(positivo).min(1),
      formatos: z.array(z.enum(['avif', 'webp', 'jpg'])).min(1),
      blur: z.string().startsWith('data:image/'),
    })
    .superRefine((img, ctx) => {
      if (!existe) return;
      for (const w of img.larguras)
        for (const f of img.formatos) {
          const caminho = `${img.base}-${w}.${f}`;
          if (!existe(caminho))
            ctx.addIssue({ code: 'custom', message: `Arquivo não existe em public/: ${caminho}` });
        }
    });
}

export function criarSchemaProjetos(existe?: ArquivoExiste) {
  const imagem = criarImagem(existe);
  const srcVideo = z
    .string()
    .regex(/^\/media\/[\w./-]+\.(mp4|webm)$/, 'Vídeos ficam em /media/ (public/media/)')
    .refine((src) => !existe || existe(src), { message: 'Vídeo não existe em public/' });

  const video = z.object({
    tipo: z.literal('video'),
    src: srcVideo,
    poster: imagem,
    largura: positivo,
    altura: positivo,
    orientacao,
    duracao: z.number().nonnegative(),
    titulo: z.string().min(1),
  });
  // 'TODO' = vídeo grande demais esperando subir no YouTube/Vimeo: mostra só o poster
  const youtube = z.object({
    tipo: z.literal('youtube'),
    id: z.union([z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'ID do YouTube inválido'), z.literal('TODO')]),
    titulo: z.string().min(1),
    poster: imagem.optional(),
  });
  const vimeo = z.object({
    tipo: z.literal('vimeo'),
    id: z.union([z.string().regex(/^\d{5,12}$/, 'ID do Vimeo inválido'), z.literal('TODO')]),
    hash: z
      .string()
      .regex(/^[a-f0-9]{6,20}$/i)
      .optional(),
    titulo: z.string().min(1),
    poster: imagem.optional(),
  });
  const foto = z.object({
    tipo: z.literal('foto'),
    imagem,
    alt: z.string().min(3),
    largura: positivo,
    altura: positivo,
    orientacao,
  });
  const item = z.discriminatedUnion('tipo', [video, youtube, vimeo, foto]);
  const principal = z.discriminatedUnion('tipo', [video, youtube, vimeo]);

  const projeto = z.object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    titulo: z.string().min(2),
    /** Pode ser vazia: aí os chips de função não aparecem. */
    funcoes: z.array(z.string().min(2)),
    resumo: z.string().min(10),
    descricao: z.string().optional(),
    capa: imagem,
    capaAlt: z.string().min(3),
    /** Ponto de foco da capa quando cortada (CSS object-position). */
    capaFoco: z.string(),
    /** `null` = "Vídeo em breve". */
    videoPrincipal: principal.nullable(),
    galeria: z.array(item),
    linkExterno: z.object({ rotulo: z.string().min(3), href: z.url() }).optional(),
  });

  return { imagem, item, principal, projeto, projetos: z.array(projeto).min(1) };
}

const base = criarSchemaProjetos();
export type Imagem = z.infer<typeof base.imagem>;
export type Item = z.infer<typeof base.item>;
export type ItemVideo = Extract<Item, { tipo: 'video' }>;
export type ItemFoto = Extract<Item, { tipo: 'foto' }>;
export type ItemEmbed = Extract<Item, { tipo: 'youtube' | 'vimeo' }>;
export type VideoPrincipal = z.infer<typeof base.principal>;
export type Projeto = z.infer<typeof base.projeto>;
export const projetosSchema = base.projetos;
