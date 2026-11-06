import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { projects } from '../data/projetosDoSite';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useReveal } from '../hooks/useReveal';
import { ArrowIcon } from './Icons';
import { GalleryDialog } from './GalleryDialog';
import { Picture } from './Picture';
import { ProjectSlide } from './ProjectSlide';
import { SectionHeading } from './SectionHeading';

export function Projects() {
  const reduced = usePrefersReducedMotion();
  const [viewportRef, embla] = useEmblaCarousel({ loop: false, align: 'start', duration: reduced ? 0 : 28 });
  const [selected, setSelected] = useState(0);
  const [playingSlug, setPlayingSlug] = useState<string | null>(null);
  const [gallerySlug, setGallerySlug] = useState<string | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLUListElement>(null);
  const galleryTrigger = useRef<HTMLElement | null>(null);
  const reveal = useReveal<HTMLDivElement>();
  const total = projects.length;

  const onSelect = useCallback(() => {
    if (!embla) return;
    setSelected(embla.selectedScrollSnap());
    setPlayingSlug(null); // trocar de slide para o vídeo anterior
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on('select', onSelect).on('reInit', onSelect);
    return () => {
      embla.off('select', onSelect).off('reInit', onSelect);
    };
  }, [embla, onSelect]);

  // setas do teclado quando o foco está dentro do carrossel
  useEffect(() => {
    const region = regionRef.current;
    if (!region || !embla) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') embla.scrollNext();
      else if (e.key === 'ArrowLeft') embla.scrollPrev();
    };
    region.addEventListener('keydown', handler);
    return () => region.removeEventListener('keydown', handler);
  }, [embla]);

  // leva a miniatura ativa à vista na tira (rola só a tira, nunca a página)
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.children[selected] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const left = thumb.offsetLeft - strip.offsetLeft;
    const right = left + thumb.offsetWidth;
    if (left < strip.scrollLeft || right > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({
        left: left - (strip.clientWidth - thumb.offsetWidth) / 2,
        behavior: reduced ? 'auto' : 'smooth',
      });
    }
  }, [selected, reduced]);

  const galleryProject = projects.find((p) => p.slug === gallerySlug) ?? null;

  return (
    <section id="projetos" aria-labelledby="projetos-titulo" className="relative py-24 sm:py-32">
      <div className="container-x">
        <SectionHeading
          number="01"
          label="Trabalhos selecionados"
          id="projetos-titulo"
          title="Projetos"
          intro="Uma seleção dos trabalhos que produzi nos últimos tempos, do vídeo à edição final."
        />

        <div ref={reveal} className="reveal mt-14">
          <div ref={regionRef} role="region" aria-roledescription="carousel" aria-label="Projetos">
            <div ref={viewportRef} className="overflow-hidden">
              <div className="flex">
                {projects.map((project, index) => (
                  <ProjectSlide
                    key={project.slug}
                    project={project}
                    index={index}
                    total={total}
                    active={index === selected}
                    playing={playingSlug === project.slug}
                    onPlay={() => setPlayingSlug(project.slug)}
                    onOpenGallery={(trigger) => {
                      galleryTrigger.current = trigger;
                      setPlayingSlug(null); // abrir a galeria pausa o vídeo do slide
                      setGallerySlug(project.slug);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-5 border-t border-line pt-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => embla?.scrollPrev()}
                  disabled={selected === 0}
                  aria-label="Projeto anterior"
                  className="inline-flex size-11 items-center justify-center border border-gold text-gold transition-colors hover:bg-gold hover:text-on-gold disabled:border-line disabled:text-gold-deep disabled:hover:bg-transparent disabled:hover:text-gold-deep"
                >
                  <ArrowIcon direction="left" className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => embla?.scrollNext()}
                  disabled={selected === total - 1}
                  aria-label="Próximo projeto"
                  className="inline-flex size-11 items-center justify-center border border-gold text-gold transition-colors hover:bg-gold hover:text-on-gold disabled:border-line disabled:text-gold-deep disabled:hover:bg-transparent disabled:hover:text-gold-deep"
                >
                  <ArrowIcon className="size-5" />
                </button>
                <p
                  aria-live="polite"
                  aria-atomic="true"
                  className="ml-2 min-w-16 text-sm font-semibold tabular-nums text-muted"
                >
                  <span className="sr-only">Projeto </span>
                  {selected + 1} de {total}
                </p>
              </div>

              <div
                className="flex flex-wrap items-center gap-x-0.5"
                role="group"
                aria-label="Escolher projeto"
              >
                {projects.map((project, i) => (
                  <button
                    key={project.slug}
                    type="button"
                    onClick={() => embla?.scrollTo(i)}
                    aria-label={`Ir para ${project.titulo}`}
                    aria-current={i === selected ? 'true' : undefined}
                    className="group inline-flex size-11 items-center justify-center"
                  >
                    <span
                      aria-hidden="true"
                      className={`block size-2.5 rotate-45 border border-gold-deep transition-colors group-hover:bg-gold-light ${i === selected ? 'bg-gold' : 'bg-transparent'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <ul
              ref={thumbsRef}
              className="mt-6 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]"
              aria-label="Miniaturas dos projetos"
            >
              {projects.map((project, i) => (
                <li
                  key={project.slug}
                  className="w-[calc((100%-1.5rem)/3)] shrink-0 snap-start sm:w-[calc((100%-3.75rem)/6)]"
                >
                  <button
                    type="button"
                    onClick={() => embla?.scrollTo(i)}
                    aria-label={project.titulo}
                    aria-current={i === selected ? 'true' : undefined}
                    className={`relative block aspect-video w-full overflow-hidden border transition-[border-color,opacity] ${i === selected ? 'border-gold opacity-100' : 'border-line opacity-60 hover:opacity-100'}`}
                  >
                    <Picture
                      imagem={project.capa}
                      alt=""
                      sizes="(min-width: 640px) 15vw, 30vw"
                      className="h-full w-full object-cover"
                      style={{ objectPosition: project.capaFoco }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {galleryProject && (
        <GalleryDialog
          key={galleryProject.slug}
          project={galleryProject}
          onClose={() => {
            setGallerySlug(null);
            galleryTrigger.current?.focus();
          }}
        />
      )}
    </section>
  );
}
