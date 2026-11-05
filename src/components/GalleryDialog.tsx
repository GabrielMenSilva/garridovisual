import { useEffect, useMemo, useRef, useState } from 'react';
import type { GalleryItem, Project } from '../data/projects';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useScrollLock } from '../hooks/useScrollLock';
import { ArrowIcon, CloseIcon } from './Icons';
import { Picture } from './Picture';
import { VideoPlayer } from './VideoPlayer';

interface GalleryDialogProps {
  project: Project;
  onClose: () => void;
}

/** Galeria de um projeto num <dialog> modal, com visualização ampliada (Anterior/Próximo). */
export function GalleryDialog({ project, onClose }: GalleryDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [playingVideo, setPlayingVideo] = useState(false);
  useScrollLock(true);
  useFocusTrap(ref, true);

  // sem mídia extra: a galeria mostra a capa e o vídeo principal
  const items = useMemo<GalleryItem[]>(() => {
    if (project.gallery.length) return [...project.gallery];
    const base: GalleryItem[] = [{ kind: 'image', image: project.cover, alt: project.coverAlt }];
    if (project.video) base.push({ kind: 'video', video: project.video, title: `Vídeo: ${project.title}` });
    return base;
  }, [project]);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Listeners nativos (o <dialog> não é um elemento interativo para o jsx-a11y):
  // Esc na imagem ampliada volta à grade; Esc na grade fecha; clique no fundo fecha; setas navegam.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      if (current !== null) {
        e.preventDefault();
        setCurrent(null);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (current === null) return;
      if (e.key === 'ArrowRight') setCurrent((i) => (i === null ? i : (i + 1) % items.length));
      if (e.key === 'ArrowLeft') setCurrent((i) => (i === null ? i : (i - 1 + items.length) % items.length));
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

  const total = items.length;
  const item = current === null ? undefined : items[current];
  const go = (delta: number) => {
    setPlayingVideo(false);
    setCurrent((i) => (i === null ? i : (i + delta + total) % total));
  };

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
              {project.title}
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
            <ul className="columns-2 gap-3 md:columns-3 [&>li]:mb-3 [&>li]:break-inside-avoid">
              {items.map((it, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-label={it.kind === 'image' ? `Ampliar: ${it.alt}` : `Abrir vídeo: ${it.title}`}
                    className="group relative block w-full overflow-hidden bg-surface-2"
                  >
                    {it.kind === 'image' ? (
                      <Picture
                        id={it.image}
                        alt=""
                        sizes="(min-width: 768px) 30vw, 46vw"
                        className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="flex aspect-video items-center justify-center text-gold">Vídeo</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col" aria-roledescription="visualizador">
            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black p-2 sm:p-4">
              {item.kind === 'image' ? (
                <Picture
                  id={item.image}
                  alt={item.alt}
                  sizes="94vw"
                  priority
                  className="max-h-full max-w-full object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                />
              ) : (
                <div className="w-full max-w-4xl">
                  <VideoPlayer
                    title={item.title}
                    video={item.video}
                    cover={project.cover}
                    coverAlt={project.coverAlt}
                    playing={playingVideo}
                    onPlay={() => setPlayingVideo(true)}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 sm:px-8">
              <button
                type="button"
                onClick={() => setCurrent(null)}
                className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-gold hover:text-gold-light"
              >
                Voltar à grade
              </button>
              <p aria-live="polite" className="text-sm text-muted">
                <span className="sr-only">Mídia </span>
                {current + 1} de {total}
                {item.caption ? <span> — {item.caption}</span> : null}
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
