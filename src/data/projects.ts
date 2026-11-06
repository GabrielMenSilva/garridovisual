import { midia } from './media.generated';
import { montarProjetos, type TextoProjeto } from './montarProjetos';
import { projetosSchema, type Projeto } from './schema';

/**
 * TEXTO dos projetos (escrito à mão). A MÍDIA (vídeos, fotos, posters) vem de
 * src/data/media.generated.ts, gerado por `pnpm media:import` a partir da pasta `videos e fotos`,
 * e é ligada pelo `slug`. Veja docs/como-editar-conteudo.md.
 *
 * - Ordem dos projetos no site = ordem deste arquivo (projetos novos da pasta entram no fim,
 *   com um rascunho automático, até ganharem texto aqui).
 * - `videoPrincipal`: omitido = o sugerido pelo import; '02-video.mp4' = outro vídeo do projeto;
 *   { tipo: 'youtube', id: '…' } ou { tipo: 'vimeo', id: '…' } = vídeo de fora; null = "Vídeo em breve".
 * - `funcoes: []` esconde os chips de função.
 */
export const textos = [
  {
    slug: 'hey-maringa',
    titulo: 'Hey Maringá',
    funcoes: ['Filmmaker', 'Editor', 'Diretor'],
    resumo:
      'Filmmaker e editor do Hey Maringá, perfil de lifestyle e dicas da cidade com mais de 200 mil seguidores. Cuido da captação, da direção e da edição de conteúdos dinâmicos e criativos. A ideia é sempre contar histórias de um jeito que prende, inspira e fica na memória.',
    capa: 'hey-maringa-capa',
    capaFoco: '50% 35%',
    // TODO(garrido): vídeo principal do Hey Maringá (pasta "Hey Maringá" em `videos e fotos`, ou YouTube/Vimeo)
  },
  {
    slug: 'el-piratas',
    titulo: 'El Piratas',
    funcoes: ['Editor', 'Motion design'],
    resumo:
      'Editei vídeos e criei motion design para o El Piratas, um restaurante de pegada única e cheio de energia. São conteúdos para redes sociais e campanhas promocionais, com animações que reforçam a identidade visual. A ideia foi captar o clima do lugar e o movimento.',
    capa: 'el-piratas-capa',
    // TODO(garrido): vídeo principal do El Piratas
  },
  {
    slug: 'ody-park',
    titulo: 'Ody Park',
    funcoes: ['Editor', 'Motion design'],
    resumo:
      'Editor e motion designer do Ody Park, parque aquático do Paraná. Produzi vídeos para campanhas sazonais, redes sociais e divulgação de eventos. A vibe do parque guiou tudo: cores, alegria e um clima leve.',
    capa: 'ody-park-capa',
    // TODO(garrido): vídeo principal do Ody Park
  },
  {
    slug: 'juliana-e-marcio',
    titulo: 'Juliana & Márcio',
    funcoes: ['Filmmaker', 'Editor', 'Fotógrafo'],
    resumo:
      'Registrei o casamento da Juliana e do Márcio em foto e vídeo, da captação à edição final. Um dia cheio de emoção, sorrisos e momentos únicos, contado de um jeito leve, natural e cheio de sentimento.',
    capa: 'juliana-marcio-capa',
    // Vídeo principal: casamento/casamento.mp4 (abre com o título "Juliana e Marcio"), ligado a este projeto
    // e endireitado em scripts/midia-ajustes.json. TODO(garrido): confirmar.
    fotosAntigas: [
      { imagem: 'juliana-marcio-galeria-28', alt: 'Casamento de Juliana e Márcio, foto 1 de 8' },
      { imagem: 'juliana-marcio-galeria-25', alt: 'Casamento de Juliana e Márcio, foto 2 de 8' },
      { imagem: 'juliana-marcio-galeria-31', alt: 'Casamento de Juliana e Márcio, foto 3 de 8' },
      { imagem: 'juliana-marcio-galeria-38', alt: 'Casamento de Juliana e Márcio, foto 4 de 8' },
      { imagem: 'juliana-marcio-galeria-43', alt: 'Casamento de Juliana e Márcio, foto 5 de 8' },
      {
        imagem: 'juliana-marcio-galeria-04-vertical',
        alt: 'Casamento de Juliana e Márcio, foto 6 de 8 (vertical)',
      },
      {
        imagem: 'juliana-marcio-galeria-14-vertical',
        alt: 'Casamento de Juliana e Márcio, foto 7 de 8 (vertical)',
      },
      {
        imagem: 'juliana-marcio-galeria-15-vertical',
        alt: 'Casamento de Juliana e Márcio, foto 8 de 8 (vertical)',
      },
    ],
  },
  {
    slug: 'mk5',
    titulo: 'MK5 Arquitetos',
    funcoes: ['Editor', 'Motion design'],
    resumo:
      'Cuidei da edição e do motion design para a MK5 Arquitetos, escritório de arquitetura. O objetivo foi comunicar os projetos com ritmo, identidade e movimento, do jeito que a marca pede.',
    capa: 'mk5-capa',
    capaAlt: 'Capa do projeto MK5 Arquitetos, com a marca do escritório',
    // TODO(garrido): vídeo principal da MK5
  },
  {
    slug: 'heitor-amatsu',
    titulo: 'Heitor Amatsu',
    funcoes: ['Editor'],
    resumo:
      'Editei os vídeos do canal de YouTube do Heitor Amatsu, criador do mangá "Lampião". Cuidei do ritmo, dos cortes e da identidade visual para deixar o conteúdo dinâmico e com o estilo do criador.',
    capa: 'heitor-amatsu-capa',
    // TODO(garrido): vídeo principal do canal do Heitor Amatsu
    linkExterno: { rotulo: 'Instagram do Heitor Amatsu', href: 'https://www.instagram.com/heitoramatsu/' },
  },

  // ── Projetos novos da pasta `videos e fotos` (Parte 2) ─────────────────────────────────────
  // Os textos abaixo são RASCUNHOS neutros: só dizem o que dá para ver nos vídeos e fotos, em
  // termos genéricos. Nada de cliente, número, ano ou função foi inventado.
  {
    slug: 'barberaria',
    // TODO(garrido): confirmar o título (o arquivo se chama "barberaria"; usei "Barbearia")
    titulo: 'Barbearia',
    // TODO(garrido): descrever este projeto e confirmar funções
    funcoes: [],
    resumo: 'Vídeo vertical gravado em uma barbearia.',
  },
  {
    slug: 'casamento',
    // As fotos da pasta "casamento" são de outro casal (o vídeo da pasta é da Juliana & Márcio).
    // TODO(garrido): confirmar o título (nome do casal?), descrever o projeto e confirmar as funções
    titulo: 'Casamento',
    funcoes: [],
    resumo: 'Fotos de um casamento, da cerimônia na igreja à assinatura e aos retratos do casal.',
  },
  {
    slug: 'fora-de-centro',
    // TODO(garrido): confirmar o título, descrever este projeto e confirmar funções
    titulo: 'Fora de Centro',
    funcoes: [],
    resumo: 'Vídeos verticais do projeto Fora de Centro.',
  },
  {
    slug: 'mg-natacao',
    // TODO(garrido): confirmar o título ("MG nataçao" na pasta), descrever este projeto e confirmar funções
    titulo: 'MG Natação',
    funcoes: [],
    resumo: 'Vídeos de aulas de natação e de exercícios na água.',
  },
  {
    slug: 'pedido-de-casamento',
    // TODO(garrido): descrever este projeto e confirmar funções
    titulo: 'Pedido de Casamento',
    funcoes: [],
    resumo: 'Vídeo de um pedido de casamento ao ar livre, em um jardim.',
  },
] as const satisfies readonly TextoProjeto[];

const montados = projetosSchema.parse(montarProjetos(textos, midia));

/**
 * Só no build de testes (`vite build --mode e2e`): liga vídeos fictícios do YouTube nos dois primeiros
 * projetos (que não têm vídeo) para testar o player de embed. Em produção este ramo é removido do bundle.
 */
export const projects: readonly Projeto[] =
  import.meta.env.MODE === 'e2e'
    ? montados.map((p, i) =>
        i < 2
          ? {
              ...p,
              videoPrincipal: {
                tipo: 'youtube' as const,
                id: `e2eFixture${i}`,
                titulo: p.titulo,
                poster: p.capa,
              },
            }
          : p,
      )
    : montados;

export type { Projeto, Item, ItemVideo, ItemFoto, ItemEmbed, Imagem } from './schema';
