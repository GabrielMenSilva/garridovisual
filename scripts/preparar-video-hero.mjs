#!/usr/bin/env node
// Converte um vídeo para o formato "scrubável" do hero (o scroll controla o tempo do vídeo).
//
// Uso:
//   node scripts/preparar-video-hero.mjs caminho/do/video.mp4      → public/media/hero.mp4 (+ hero.webm)
//   node scripts/preparar-video-hero.mjs --placeholder             → public/media/hero-placeholder.mp4 (vídeo de teste)
//
// Por que: para o scroll andar o vídeo sem engasgar, todo quadro precisa ser um quadro-chave
// (-g 1). Sem isso, cada "pulo" no tempo obriga o navegador a decodificar vários quadros e trava.
// Resultado: H.264, sem áudio, até 1920 px de largura, com faststart. Meta: ≤ 8 MB para ~10 s.
import { spawnSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const placeholder = args.includes('--placeholder');
const entrada = args.find((a) => !a.startsWith('--'));
const comWebm = args.includes('--webm');

function achaFfmpeg() {
  const teste = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (teste.status === 0) return 'ffmpeg';
  try {
    return require('ffmpeg-static'); // devDependency do projeto
  } catch {
    console.error('ffmpeg não encontrado. Instale (winget install Gyan.FFmpeg) ou rode `pnpm install`.');
    process.exit(1);
  }
}

const ffmpeg = achaFfmpeg();
mkdirSync('public/media', { recursive: true });

function roda(argv) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...argv], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
const mb = (f) => (statSync(f).size / 1048576).toFixed(2) + ' MB';

if (placeholder) {
  // 10 s, 1280x720, gradiente escuro com brilho dourado em movimento lento
  const saida = 'public/media/hero-placeholder.mp4';
  roda([
    '-f',
    'lavfi',
    '-i',
    'gradients=s=1280x720:c0=0E0E0E:c1=8a6a30:c2=171717:c3=0E0E0E:nb_colors=4:speed=0.012:duration=10:rate=30',
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '30',
    '-g',
    '1',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    saida,
  ]);
  console.log(`ok ${saida} (${mb(saida)}) — vídeo de TESTE, troque pelo vídeo real do Garrido.`);
} else {
  if (!entrada) {
    console.error('Uso: node scripts/preparar-video-hero.mjs <video> [--webm]   ou   --placeholder');
    process.exit(1);
  }
  const mp4 = 'public/media/hero.mp4';
  roda([
    '-i',
    entrada,
    '-an',
    '-vf',
    "scale='min(1920,iw)':-2",
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '26',
    '-g',
    '1',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    mp4,
  ]);
  console.log(`ok ${mp4} (${mb(mp4)})`);
  if (comWebm) {
    const webm = 'public/media/hero.webm';
    roda([
      '-i',
      entrada,
      '-an',
      '-vf',
      "scale='min(1920,iw)':-2",
      '-c:v',
      'libvpx-vp9',
      '-crf',
      '36',
      '-b:v',
      '0',
      '-g',
      '2',
      webm,
    ]);
    console.log(`ok ${webm} (${mb(webm)})`);
  }
  console.log(
    'Agora aponte site.hero.video.mp4 para /media/hero.mp4 em src/data/site.ts e ponha isPlaceholder: false.',
  );
  if (statSync(mp4).size > 8 * 1048576)
    console.warn('Aviso: passou de 8 MB. Reduza a duração ou aumente o -crf.');
}
