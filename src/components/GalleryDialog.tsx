import { useEffect, useMemo, useRef, useState } from 'react';
import type { Item, Projeto } from '../data/projects';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useScrollLock } from '../hooks/useScrollLock';
import { ArrowIcon, CloseIcon, PlayIcon } from './Icons';
import { Picture } from './Picture';
import { VideoPlayer } from './VideoPlayer';

interface GalleryDialogProps {
  project: Projeto;
  onClose: () => void;
}

function duracaoLegivel(segundos: number): string {
  const s = Math.round(segundos);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Vídeo grande demais esperando subir no YouTube/Vimeo: só o poster. */
function pendente(it: Item): boolean {
  return (it.tipo === 'youtube' || it.tipo === 'vimeo') && it.id === 'TODO';
}

function rotulo(it: Item): string {
  if (it.tipo === 'foto') return `Ampliar: ${it.alt}`;
  if (pendente(it)) return `Abrir vídeo (em breve): ${it.titulo}`;
  // a duração visível na miniatura entra no nome (WCAG 2.5.3, "label in name")
  return it.tipo === 'video'
    ? `Abrir vídeo: ${it.titulo}, duração ${duracaoLegivel(it.duracao)}`
    : `Abrir vídeo: ${it.titulo}`;
}

/**
 * Galeria de um projeto num <dialog> modal: grade em colunas (alvenaria) que respeita a proporção
 * de cada foto/vídeo, e um visor com Anterior/Próximo. As miniaturas carregam preguiçosas (só as que
 * aparecem). O vídeo do visor só monta depois do clique e pausa ao trocar de item ou fechar.
 */
export function GalleryDialog({ project, onClose }: GalleryDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [playingVideo, setPlayingVideo] = useState(false);
  useScrollLock(true);
  useFocusTrap(ref, true);

  // sem mídia extra: a galeria mostra a capa e o vídeo principal
  const items = useMemo<Item[]>(() => {
    if (project.galeria.length) return [...project.galeria];
    const base: Item[] = [
      {
        tipo: 'foto',
        imagem: project.capa,
        alt: project.capaAlt,
        largura: project.capa.largura,
        altura: project.capa.altura,
        orientacao: project.capa.largura >= project.capa.altura ? 'horizontal' : 'vertical',
      },
    ];
    if (project.videoPrincipal) base.push(project.videoPrincipal);
    return base;
  }, [project]);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const total = items.length;
  const abrir = (i: number) => {
    setPlayingVideo(false);
    setCurrent(i);
  };
  const go = (delta: number) => {
    setPlayingVideo(false);
    setCurrent((i) => (i === null ? i : (i + delta + total) % total));
  };

  // Listeners nativos (o <dialog> não é um elemento interativo para o jsx-a11y):
  // Esc no visor volta à grade; Esc na grade fecha; clique no fundo fecha; setas navegam.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      if (current !== null) {
        e.preventDefault();
        setPlayingVideo(false);
        setCurrent(null);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (current === null) return;
      // nos controles do <video>, as setas avançam o vídeo: não troca de item
      if (e.target instanceof HTMLVideoElement) return;
      if (e.key === 'ArrowRight') {
        setPlayingVideo(false);
        setCurrent((i) => (i === null ? i : (i + 1) % items.length));
      }
      if (e.key === 'ArrowLeft') {
        setPlayingVideo(false);
        setCurrent((i) => (i === null ? i : (i - 1 + items.length) % items.length));
      }
    };
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('click', onClick);
    dialog.addEventListener('keydown', onKey);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('click', onClick);
      dialog.removeEventListener('keydown', onKey);
    };
  }, [current, items.length]);

  const item = current === null ? undefined : items[current];

  return (
    <dialog
      ref={ref}
      aria-labelledby="galeria-titulo"
      onClose={onClose}
      className="m-auto h-[min(92dvh,60rem)] w-[min(94vw,80rem)] max-w-none border border-line p-0"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-light">Galeria</p>
            <h2 id="galeria-titulo" className="text-2xl text-ink sm:text-3xl">
              {project.titulo}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="inline-flex min-h-11 items-center gap-2 border border-line px-4 text-sm font-semibold text-ink hover:border-gold"
          >
            <CloseIcon className="size-5" />
            Fechar
          </button>
        </div>

        {!item || current === null ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
            <p className="sr-only">{total === 1 ? '1 item' : `${total} itens`}</p>
            <ul className="columns-2 gap-3 md:columns-3 [&>li]:mb-3 [&>li]:break-inside-avoid">
              {items.map((it, i) => {
                const img = it.tipo === 'foto' ? it.imagem : (it.poster ?? project.capa);
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => abrir(i)}
                      aria-label={rotulo(it)}
                      className="group relative block w-full overflow-hidden bg-surface-2"
                      style={{ aspectRatio: `${img.largura} / ${img.altura}` }}
                    >
                      <Picture
                        imagem={img}
                        alt=""
                        sizes="(min-width: 768px) 30vw, 46vw"
                        className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      {pendente(it) && (
                        <span className="absolute bottom-2 left-2 border border-gold-deep bg-bg/85 px-2 py-0.5 text-xs font-semibold text-gold-light">
                          Vídeo em breve
                        </span>
                      )}
                      {it.tipo !== 'foto' && !pendente(it) && (
                        <>
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 flex items-center justify-center bg-bg/20"
                          >
                            <span className="flex size-14 items-center justify-center border border-gold bg-bg/70 text-gold">
                              <PlayIcon className="size-6 translate-x-0.5" />
                            </span>
                          </span>
                          {it.tipo === 'video' && (
                            <span className="absolute bottom-2 right-2 bg-bg/85 px-2 py-0.5 text-xs font-semibold tabular-nums text-ink">
                              {duracaoLegivel(it.duracao)}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col" aria-roledescription="visualizador">
            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black p-2 sm:p-4">
              {item.tipo === 'foto' ? (
                <Picture
                  key={current}
                  imagem={item.imagem}
                  alt={item.alt}
                  sizes="94vw"
                  priority
                  className="max-h-full max-w-full object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                />
              ) : (
                <VideoPlayer
                  key={current}
                  titulo={item.titulo}
                  video={item}
                  capa={project.capa}
                  capaAlt={project.capaAlt}
                  playing={playingVideo}
                  onPlay={() => setPlayingVideo(true)}
                  variante="visor"
                  sizes="94vw"
                />
              )}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 sm:px-8">
              <button
                type="button"
                onClick={() => {
                  setPlayingVideo(false);
                  setCurrent(null);
                }}
                className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-gold hover:text-gold-light"
              >
                Voltar à grade
              </button>
              <p aria-live="polite" className="text-sm text-muted">
                <span className="sr-only">Mídia </span>
                {current + 1} de {total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Anterior"
                  className="inline-flex size-11 items-center justify-center border border-line text-ink hover:border-gold"
                >
                  <ArrowIcon direction="left" className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Próximo"
                  className="inline-flex size-11 items-center justify-center border border-line text-ink hover:border-gold"
                >
                  <ArrowIcon className="size-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
