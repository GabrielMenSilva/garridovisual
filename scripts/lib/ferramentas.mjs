// Acesso a disco e aos binários (ffmpeg/ffprobe) usado pelo inventário e pelo import de mídia.
// A pasta de origem é SOMENTE LEITURA: nada aqui escreve nela.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';

const require = createRequire(import.meta.url);

/** Pasta de mídia padrão (pode ser trocada com --origem "<caminho>"). */
export const ORIGEM_PADRAO = 'videos e fotos';

/** Lê `--nome valor` dos argumentos. */
export function argumento(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

function noSistema(bin) {
  const r = spawnSync(bin, ['-version'], { encoding: 'utf8' });
  return r.status === 0;
}

/** ffmpeg do sistema ou o do `ffmpeg-static` (devDependency). */
export function acharFfmpeg() {
  if (noSistema('ffmpeg')) return 'ffmpeg';
  return require('ffmpeg-static');
}

/** ffprobe do sistema ou o do `ffprobe-static` (devDependency). */
export function acharFfprobe() {
  if (noSistema('ffprobe')) return 'ffprobe';
  return require('ffprobe-static').path;
}

/** Lista todos os arquivos (recursivo), com caminho relativo usando "/". */
export async function listarArquivos(raiz) {
  const saida = [];
  async function anda(dir) {
    const itens = await readdir(dir, { withFileTypes: true });
    for (const it of itens) {
      const abs = join(dir, it.name);
      if (it.isDirectory()) await anda(abs);
      else if (it.isFile()) {
        const s = await stat(abs);
        saida.push({ abs, rel: relative(raiz, abs).split(sep).join('/'), bytes: s.size, mtimeMs: s.mtimeMs });
      }
    }
  }
  await anda(raiz);
  return saida;
}

/** SHA-256 de um arquivo, lendo em stream. */
export function sha256(arquivo) {
  return new Promise((ok, erro) => {
    const h = createHash('sha256');
    createReadStream(arquivo)
      .on('data', (d) => h.update(d))
      .on('error', erro)
      .on('end', () => ok(h.digest('hex')));
  });
}

/**
 * Roda um processo e devolve stdout (Buffer) e stderr. Rejeita se o código de saída não for 0.
 * O processo é morto se o Node encerrar, para nunca ficar preso.
 */
export function rodar(bin, args, { timeoutMs = 30 * 60_000 } = {}) {
  return new Promise((ok, erro) => {
    const p = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const out = [];
    let err = '';
    const mata = () => p.kill('SIGKILL');
    process.once('exit', mata);
    const t = setTimeout(() => {
      mata();
      erro(new Error(`tempo esgotado: ${bin} ${args.join(' ')}`));
    }, timeoutMs);
    p.stdout.on('data', (d) => out.push(d));
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('error', (e) => {
      clearTimeout(t);
      process.off('exit', mata);
      erro(e);
    });
    p.on('close', (code) => {
      clearTimeout(t);
      process.off('exit', mata);
      if (code === 0) ok({ stdout: Buffer.concat(out), stderr: err });
      else erro(new Error(`${bin} saiu com código ${code}: ${err.trim().split('\n').slice(-3).join(' | ')}`));
    });
  });
}

/**
 * Dados de um vídeo via ffprobe: duração, dimensões já com a rotação aplicada,
 * codec, perfil, quadros por segundo e se tem áudio.
 */
export async function sondarVideo(ffprobe, arquivo) {
  const { stdout } = await rodar(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', arquivo]);
  const j = JSON.parse(stdout.toString());
  const v = (j.streams ?? []).find((s) => s.codec_type === 'video');
  if (!v) throw new Error('sem trilha de vídeo');
  const rot = Number(v.tags?.rotate ?? v.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? 0);
  const deitado = Math.abs(rot) % 180 === 90;
  const [n, d] = String(v.avg_frame_rate && v.avg_frame_rate !== '0/0' ? v.avg_frame_rate : v.r_frame_rate)
    .split('/')
    .map(Number);
  return {
    duracao: Number(j.format?.duration ?? v.duration ?? 0),
    largura: deitado ? v.height : v.width,
    altura: deitado ? v.width : v.height,
    rotacao: rot,
    codec: v.codec_name,
    perfil: v.profile ?? '',
    pixFmt: v.pix_fmt ?? '',
    fps: d ? n / d : n,
    temAudio: (j.streams ?? []).some((s) => s.codec_type === 'audio'),
    tags: { ...(j.format?.tags ?? {}) },
  };
}

/** Executa tarefas com no máximo `limite` ao mesmo tempo. */
export async function emParalelo(itens, limite, tarefa) {
  const resultados = new Array(itens.length);
  let proximo = 0;
  async function trabalhador() {
    while (proximo < itens.length) {
      const i = proximo++;
      resultados[i] = await tarefa(itens[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limite, itens.length)) }, trabalhador));
  return resultados;
}

/**
 * Projetos escritos à mão em src/data/projects.ts: slug e título (lidos por expressão regular,
 * sem executar o arquivo). Mantém a ordem do arquivo.
 */
export async function lerProjetosConhecidos(arquivo = 'src/data/projects.ts') {
  const { readFile } = await import('node:fs/promises');
  const texto = await readFile(arquivo, 'utf8');
  const projetos = [];
  const re = /slug:\s*'([a-z0-9-]+)'\s*,\s*(?:titulo|title):\s*'([^']*)'/g;
  for (const m of texto.matchAll(re)) projetos.push({ slug: m[1], titulo: m[2] });
  return projetos;
}
