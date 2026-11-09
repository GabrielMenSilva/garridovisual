import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { site } from '../data/site';
import { handleAnchorClick } from '../lib/nav';
import { useScrollVideo } from '../hooks/useScrollVideo';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { Logo } from './Logo';
import { Picture } from './Picture';
import { imagemAntiga } from '../data/montarProjetos';

/**
 * Home: o vídeo do fundo anda junto com o scroll (ver useScrollVideo).
 * Com prefers-reduced-motion: só o poster, altura normal, texto fixo.
 * Se o vídeo falhar, o poster (atrás do vídeo) continua visível.
 */
export function Hero() {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [preload, setPreload] = useState<'metadata' | 'auto'>('metadata');

  const scrub = !reduced && !failed;
  useScrollVideo({ sectionRef, videoRef, enabled: scrub });

  // metadados primeiro; o vídeo completo só depois do primeiro quadro pintado
  useEffect(() => {
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setPreload('auto'));
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, []);

  // O HTML vem pré-renderizado: o vídeo pode ter carregado (ou falhado) antes da hidratação,
  // quando o React ainda não ouvia `loadeddata`/`error`. Confere o estado atual ao montar.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const id = requestAnimationFrame(() => {
      if (video.error) setFailed(true);
      else if (video.readyState >= 2) setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, [scrub]);

  const fade: CSSProperties = scrub
    ? {
        opacity: 'calc(1 - var(--hero-progress, 0) * 3)',
        transform: 'translateY(calc(var(--hero-progress, 0) * -64px))',
      }
    : {};

  return (
    <section
      id="home"
      ref={sectionRef}
      aria-label="Início"
      data-scrub={scrub}
      style={{ '--hero-progress': 0 } as CSSProperties}
      className={`relative ${scrub ? 'h-[280svh]' : 'h-svh'}`}
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden bg-bg">
        <Picture
          imagem={imagemAntiga(site.hero.poster)}
          alt=""
          sizes="100vw"
          priority
          className="absolute inset-0 h-full w-full object-cover"
        />
        {scrub && (
          <video
            ref={videoRef}
            src={site.hero.video.mp4}
            muted
            playsInline
            preload={preload}
            tabIndex={-1}
            aria-hidden="true"
            disablePictureInPicture
            disableRemotePlayback
            onLoadedData={() => setReady(true)}
            onError={() => setFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_top,var(--bg)_0%,rgb(14_14_14/0.55)_45%,rgb(14_14_14/0.7)_100%)]"
        />

        <div
          className="container-x relative flex h-full flex-col items-center justify-center text-center"
          style={fade}
        >
          <Logo
            variant="hero"
            className="mb-6 animate-[fade-in_900ms_var(--ease)_both] motion-reduce:animate-none"
          />
          <h1 className="text-[length:var(--text-display)] text-ink">GarridoVisual</h1>
          <p className="mt-4 text-[length:var(--text-lead)] tracking-wide text-muted">{site.role}</p>
          <a href="#projetos" onClick={handleAnchorClick('projetos')} className="btn btn-primary mt-10">
            Ver projetos
          </a>
        </div>

        {scrub && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted"
            style={{ opacity: 'calc(1 - var(--hero-progress, 0) * 40)' }}
          >
            <span>Role para explorar</span>
            <span className="block h-10 w-px animate-[scroll-hint_1.8s_var(--ease)_infinite] bg-gold motion-reduce:animate-none" />
          </div>
        )}
      </div>
    </section>
  );
}
