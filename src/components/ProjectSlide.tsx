import type { Projeto } from '../data/projects';
import { GridIcon } from './Icons';
import { VideoPlayer } from './VideoPlayer';

interface ProjectSlideProps {
  project: Projeto;
  index: number;
  total: number;
  active: boolean;
  playing: boolean;
  onPlay: () => void;
  onOpenGallery: (trigger: HTMLButtonElement) => void;
}

export function ProjectSlide({
  project,
  index,
  total,
  active,
  playing,
  onPlay,
  onOpenGallery,
}: ProjectSlideProps) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} de ${total}`}
      inert={!active}
      className="min-w-0 flex-[0_0_100%] pr-0"
    >
      <article
        aria-labelledby={`projeto-${project.slug}`}
        className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14"
      >
        {/* o slide 1 fica abaixo da dobra (o hero tem 280svh): o poster carrega preguiçoso */}
        <VideoPlayer
          titulo={project.titulo}
          video={project.videoPrincipal}
          capa={project.capa}
          capaAlt={project.capaAlt}
          capaFoco={project.capaFoco}
          playing={playing && active}
          onPlay={onPlay}
        />
        <div>
          {project.funcoes.length > 0 && (
            <ul className="mb-5 flex flex-wrap gap-2" aria-label="Funções">
              {project.funcoes.map((funcao) => (
                <li key={funcao} className="chip">
                  {funcao}
                </li>
              ))}
            </ul>
          )}
          <h3 id={`projeto-${project.slug}`} className="text-[clamp(1.9rem,1.1rem+2.4vw,3.25rem)] text-ink">
            {project.titulo}
          </h3>
          <p className="mt-5 max-w-prose text-[length:var(--text-lead)] text-muted">{project.resumo}</p>
          {project.descricao && <p className="mt-4 max-w-prose text-muted">{project.descricao}</p>}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button
              type="button"
              onClick={(e) => onOpenGallery(e.currentTarget)}
              className="btn btn-primary"
              aria-haspopup="dialog"
            >
              <GridIcon className="size-5" />
              Ver galeria
              <span className="sr-only"> de {project.titulo}</span>
            </button>
            {project.linkExterno && (
              <a
                href={project.linkExterno.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-gold underline decoration-gold-deep underline-offset-4 hover:text-gold-light"
              >
                {project.linkExterno.rotulo}
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
