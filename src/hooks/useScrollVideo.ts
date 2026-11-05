import { useEffect, type RefObject } from 'react';
import { sectionProgress, shouldSeek, smoothTo } from '../lib/scroll';

interface Options {
  sectionRef: RefObject<HTMLElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
}

/**
 * Liga a rolagem ao tempo do vídeo: `currentTime = progresso × duration`.
 * - lê o layout só dentro de requestAnimationFrame (nunca no evento de scroll);
 * - suaviza o alvo (lerp com constante de tempo) para não "engasgar";
 * - só escreve `currentTime` quando a diferença passa de ~1/60 s;
 * - o laço para sozinho quando tudo está parado.
 * Também publica o progresso na variável CSS `--hero-progress` da seção (parallax do texto).
 */
export function useScrollVideo({ sectionRef, videoRef, enabled }: Options): void {
  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!enabled || !section || !video) return;

    let raf = 0;
    let last = 0;
    let current = sectionProgress(
      section.getBoundingClientRect().top,
      section.offsetHeight,
      window.innerHeight,
    );

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? now - last : 16;
      last = now;
      const rect = section.getBoundingClientRect();
      const target = sectionProgress(rect.top, rect.height, window.innerHeight);
      current = smoothTo(current, target, dt);
      section.style.setProperty('--hero-progress', current.toFixed(4));

      const duration = video.duration;
      let waiting = false;
      if (Number.isFinite(duration) && duration > 0) {
        const wanted = Math.min(current * duration, Math.max(0, duration - 0.001));
        if (video.seeking) waiting = true;
        else if (shouldSeek(video.currentTime, wanted)) video.currentTime = wanted;
      }
      if (current !== target || waiting) request();
      else last = 0;
    };

    const request = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    video.addEventListener('loadedmetadata', request);
    video.addEventListener('seeked', request);
    request();

    return () => {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      video.removeEventListener('loadedmetadata', request);
      video.removeEventListener('seeked', request);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sectionRef, videoRef, enabled]);
}
