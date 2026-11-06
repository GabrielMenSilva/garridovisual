/**
 * Só um vídeo toca por vez no site inteiro: quando um <video>/<audio> começa a tocar,
 * os outros que estiverem tocando são pausados. O evento `play` não borbulha, por isso a captura.
 * Devolve a função que desinstala (usada nos testes).
 */
export function instalarUmVideoPorVez(doc: Document = document): () => void {
  const onPlay = (e: Event) => {
    const alvo = e.target;
    if (!(alvo instanceof HTMLMediaElement)) return;
    for (const m of doc.querySelectorAll<HTMLMediaElement>('video, audio')) {
      if (m !== alvo && !m.paused) m.pause();
    }
  };
  doc.addEventListener('play', onPlay, true);
  return () => doc.removeEventListener('play', onPlay, true);
}
