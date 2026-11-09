import { projetos, type Projeto } from './projects';

/**
 * Projetos usados pelos componentes. Só no build de testes (`vite build --mode e2e`): liga vídeos
 * fictícios do YouTube nos dois primeiros projetos (que não têm vídeo) para testar o player de embed.
 * Em produção `import.meta.env.MODE` é 'production' e este ramo é removido do bundle.
 */
export const projects: readonly Projeto[] =
  import.meta.env.MODE === 'e2e'
    ? projetos.map((p, i) =>
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
    : projetos;
