#!/usr/bin/env node
// Importa os vídeos e fotos da pasta do Garrido para o site.
//
//   pnpm media:import              só processa o que é novo ou mudou (cache em .cache/media/index.json)
//   pnpm media:import --dry-run    mostra o que faria, sem gerar nem apagar nada
//   pnpm media:import --force      reprocessa tudo
//   pnpm media:import --origem "C:\outra\pasta"
//
// A pasta de origem é SOMENTE LEITURA. Tudo que é gerado vai para:
//   public/media/projetos/<slug>/<nn>-<nome>.mp4     vídeos (H.264 + AAC, faststart, sem metadados)
//   public/images/projetos/<slug>/<nn>-<nome>-<w>.*  fotos (AVIF/WebP) e posters (AVIF/JPG)
//   src/data/media.generated.ts                       manifesto com tipos (não edite à mão)
// O texto dos projetos fica em src/data/projects.ts (escrito à mão): este script nunca mexe nele.
import sharp from 'sharp';
import { copyFile, mkdir, readFile, readdir, rename, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { cpus } from 'node:os';
import { dirname, join } from 'node:path';
import {
  ORIGEM_PADRAO,
  acharFfmpeg,
  acharFfprobe,
  argumento,
  emParalelo,
  lerProjetosConhecidos,
  listarArquivos,
  rodar,
  sha256,
  sondarVideo,
} from './lib/ferramentas.mjs';
import {
  EXT_FOTO_RAW,
  bytesLegiveis,
  classificarArquivo,
  compararNatural,
  escolherPrincipal,
  extensao,
  ligarAoProjeto,
  nomeDoArquivo,
  nomeLimpo,
  nomeNoSite,
  ordenarMidia,
  orientacao,
  tituloDeNome,
} from './lib/midia.mjs';

/** Mude quando as configurações de conversão mudarem: força reprocessar tudo. */
const VERSAO = 1;
const MB = 1024 * 1024;
const LIMITE_REFAZER = 20 * MB; // passou disso: refaz em 720p
const LIMITE_SITE = 24 * MB; // passou disso: não vai para o site (hospedar no YouTube/Vimeo)
const AVISO_TOTAL = 150 * MB;
const LARGURAS_FOTO = [480, 800, 1200, 1600];
const LARGURAS_POSTER = [480, 800, 1200];
const DIR_VIDEOS = 'public/media/projetos';
const DIR_IMAGENS = 'public/images/projetos';
const CACHE = '.cache/media';
const INDICE = join(CACHE, 'index.json');
const MANIFESTO = 'src/data/media.generated.ts';
const AJUSTES = 'scripts/midia-ajustes.json';

const seco = process.argv.includes('--dry-run');
const forcar = process.argv.includes('--force');
const origem = argumento('origem', ORIGEM_PADRAO);
const nucleos = cpus().length;
const paralelo = Math.max(1, Math.floor(nucleos / 4)); // cada tarefa usa 2 threads → até metade dos núcleos
const threads = '2';
sharp.concurrency(2);

if (!existsSync(origem)) {
  console.error(`Pasta de mídia não encontrada: "${origem}". Use --origem "<caminho>".`);
  process.exit(1);
}

const require = createRequire(import.meta.url);
const ffmpeg = acharFfmpeg();
const ffprobe = acharFfprobe();

/** @type {{ versao: number, arquivos: Record<string, any> }} */
const indice = existsSync(INDICE)
  ? JSON.parse(await readFile(INDICE, 'utf8'))
  : { versao: VERSAO, arquivos: {} };

/** Ajustes manuais por arquivo: { projeto?: slug, girar?: 90 | 180 | 270 } (ver scripts/midia-ajustes.json). */
const ajustes = existsSync(AJUSTES) ? (JSON.parse(await readFile(AJUSTES, 'utf8')).arquivos ?? {}) : {};
for (const [rel, aj] of Object.entries(ajustes)) {
  if (aj.girar !== undefined && ![0, 90, 180, 270].includes(aj.girar))
    throw new Error(`${AJUSTES}: "${rel}" tem girar=${aj.girar}; use 90, 180 ou 270`);
}

// ── 1. Descobre e liga os arquivos aos projetos ────────────────────────────────────────────────
const conhecidos = await lerProjetosConhecidos();
const todos = await listarArquivos(origem);
const projetos = new Map(); // slug → { slug, pasta, ordem, existente, videos[], fotos[], textos[] }
for (const p of conhecidos)
  projetos.set(p.slug, {
    slug: p.slug,
    pasta: null,
    ordem: null,
    existente: true,
    videos: [],
    fotos: [],
    textos: [],
  });

const ignorados = [];
for (const a of todos) {
  const classe = classificarArquivo(a.rel);
  const aj = ajustes[a.rel] ?? {};
  let lig = classe === 'ignorar' ? null : ligarAoProjeto(a.rel, conhecidos);
  if (lig && aj.projeto) {
    console.log(`ajuste manual: ${a.rel} → projeto ${aj.projeto}${aj.girar ? `, girar ${aj.girar}°` : ''}`);
    lig = {
      ...lig,
      slug: aj.projeto,
      existente: conhecidos.some((c) => c.slug === aj.projeto),
      forcado: true,
    };
  }
  if (!lig) {
    ignorados.push(a.rel);
    continue;
  }
  const p = projetos.get(lig.slug) ?? {
    slug: lig.slug,
    pasta: null,
    ordem: null,
    existente: lig.existente,
    videos: [],
    fotos: [],
    textos: [],
  };
  if (!lig.forcado) {
    p.pasta ??= lig.pasta;
    p.ordem ??= lig.ordem;
  }
  const item = { ...a, caminho: a.rel, classe, girar: aj.girar ?? 0 };
  if (classe === 'video') p.videos.push(item);
  else if (classe === 'foto') p.fotos.push(item);
  else if (classe === 'texto') p.textos.push(item);
  projetos.set(lig.slug, p);
}

// ── 2. Monta as tarefas (nome no site, se precisa processar) ───────────────────────────────────
const tarefas = [];
for (const p of projetos.values()) {
  p.videos = ordenarMidia(p.videos).map((v, i) => ({
    ...v,
    nome: nomeNoSite(i + 1, v.rel, 'video'),
    slug: p.slug,
  }));
  p.fotos = ordenarMidia(p.fotos).map((f, i) => ({
    ...f,
    nome: nomeNoSite(i + 1, f.rel, 'foto'),
    slug: p.slug,
  }));
  tarefas.push(...p.videos, ...p.fotos);
}

const caminhosDe = (t) =>
  t.classe === 'video'
    ? {
        video: join(DIR_VIDEOS, t.slug, `${t.nome}.mp4`),
        base: join(DIR_IMAGENS, t.slug, `${t.nome}-poster`),
      }
    : { base: join(DIR_IMAGENS, t.slug, t.nome) };

/** Lista dos arquivos que uma saída já pronta ocupa (para conferir que existem e para a limpeza). */
function arquivosDaSaida(meta) {
  if (!meta) return [];
  const lista = [];
  if (meta.videoArquivo) lista.push(meta.videoArquivo);
  const img = meta.imagem;
  if (img)
    for (const w of img.larguras) for (const ext of img.formatos) lista.push(`${img.baseDisco}-${w}.${ext}`);
  return lista;
}

let feitos = 0;
const total = tarefas.length;
const resumo = { criados: 0, renomeados: 0, pulados: 0, falharam: 0, erros: [] };
const progresso = (t, acao) => {
  feitos++;
  console.log(`[${String(feitos).padStart(String(total).length)}/${total}] ${acao.padEnd(10)} ${t.rel}`);
};

async function hashDe(t) {
  const anterior = indice.arquivos[t.rel];
  if (anterior && anterior.bytes === t.bytes && anterior.mtimeMs === t.mtimeMs && anterior.sha256)
    return anterior.sha256;
  return sha256(t.abs);
}

// ── 3. Vídeo: converte, mede, escolhe poster ───────────────────────────────────────────────────
const GIRO = { 90: 'transpose=1,', 180: 'hflip,vflip,', 270: 'transpose=2,' };

async function converter(entrada, saida, ladoMaior, crf, temAudio, girar = 0) {
  const lado = `trunc(min(${ladoMaior},iw)/2)*2`;
  const ladoV = `trunc(min(${ladoMaior},ih)/2)*2`;
  const escala = `${GIRO[girar] ?? ''}scale=w='if(gte(iw,ih),${lado},-2)':h='if(gte(iw,ih),-2,${ladoV})':out_range=tv,format=yuv420p`;
  await rodar(ffmpeg, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-threads',
    threads,
    '-i',
    entrada,
    '-map',
    '0:v:0',
    ...(temAudio ? ['-map', '0:a:0'] : []),
    '-vf',
    escala,
    '-fpsmax',
    '30',
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-preset',
    'medium',
    '-crf',
    String(crf),
    '-pix_fmt',
    'yuv420p',
    ...(temAudio ? ['-c:a', 'aac', '-b:a', '128k', '-ac', '2'] : ['-an']),
    '-threads',
    threads,
    '-map_metadata',
    '-1',
    '-map_metadata:s:v',
    '-1',
    '-map_metadata:s:a',
    '-1',
    '-map_chapters',
    '-1',
    '-metadata:s:v',
    'handler_name=',
    '-metadata:s:a',
    'handler_name=',
    '-fflags',
    '+bitexact',
    '-flags:v',
    '+bitexact',
    '-flags:a',
    '+bitexact',
    '-movflags',
    '+faststart',
    saida,
  ]);
  return (await stat(saida)).size;
}

async function quadro(arquivo, segundo) {
  const { stdout } = await rodar(ffmpeg, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-ss',
    segundo.toFixed(2),
    '-i',
    arquivo,
    '-frames:v',
    '1',
    '-f',
    'image2pipe',
    '-vcodec',
    'png',
    '-',
  ]);
  return stdout;
}

/** Poster: quadro a ~15% da duração; se for quase preto, tenta os próximos. */
async function escolherQuadro(arquivo, duracao) {
  const fracoes = [0.15, 0.25, 0.35, 0.5, 0.65, 0.08];
  let melhor = null;
  for (const f of fracoes) {
    const png = await quadro(arquivo, Math.max(0, Math.min(duracao - 0.1, duracao * f)));
    if (!png.length) continue;
    const { channels } = await sharp(png).stats();
    const [r, g, b] = channels.map((c) => c.mean);
    const brilho = 0.2126 * r + 0.7152 * g + 0.0722 * (b ?? g);
    if (!melhor || brilho > melhor.brilho) melhor = { png, brilho, fracao: f };
    if (brilho >= 28) return { png, brilho, fracao: f };
  }
  if (!melhor) throw new Error('não consegui extrair um quadro para o poster');
  return melhor;
}

/** Gera as larguras de uma imagem (sem ampliar) nos formatos pedidos + blur placeholder. */
async function gerarImagem(entrada, baseDisco, larguras, formatos, girar = 0) {
  const m = await sharp(entrada, { failOn: 'error' }).metadata();
  const deitada = (m.orientation ?? 1) >= 5; // EXIF 5–8: a foto é girada 90°
  const deitadaFinal = deitada !== (girar === 90 || girar === 270);
  const width = deitadaFinal ? m.height : m.width;
  const height = deitadaFinal ? m.width : m.height;
  const orientar = (img) => (girar ? img.rotate().rotate(girar) : img.rotate());
  let ls = larguras.filter((w) => w <= width);
  if (!ls.length) ls = [width];
  await mkdir(dirname(baseDisco), { recursive: true });
  for (const w of ls) {
    for (const ext of formatos) {
      const r = orientar(sharp(entrada)).resize({ width: w, withoutEnlargement: true });
      const destino = `${baseDisco}-${w}.${ext}`;
      if (ext === 'avif') await r.avif({ quality: 55, effort: 4 }).toFile(destino);
      else if (ext === 'webp') await r.webp({ quality: 78 }).toFile(destino);
      else await r.jpeg({ quality: 80, mozjpeg: true, progressive: true }).toFile(destino);
    }
  }
  const blur = await orientar(sharp(entrada)).resize({ width: 16 }).blur(1).webp({ quality: 25 }).toBuffer();
  return {
    baseDisco: baseDisco.split('\\').join('/'),
    base:
      '/' +
      baseDisco
        .split('\\')
        .join('/')
        .replace(/^public\//, ''),
    largura: width,
    altura: height,
    larguras: ls,
    formatos,
    blur: `data:image/webp;base64,${blur.toString('base64')}`,
  };
}

async function processarVideo(t, sha) {
  const { video, base } = caminhosDe(t);
  const fonte = await sondarVideo(ffprobe, t.abs);
  const tmp = join(CACHE, 'tmp', `${sha}.mp4`);
  await mkdir(dirname(tmp), { recursive: true });
  let tentativa = '1080p crf 23';
  let bytes = await converter(t.abs, tmp, 1920, 23, fonte.temAudio, t.girar);
  if (bytes > LIMITE_REFAZER) {
    tentativa = '720p crf 26';
    bytes = await converter(t.abs, tmp, 1280, 26, fonte.temAudio, t.girar);
  }
  const final = await sondarVideo(ffprobe, tmp);
  const quadroPoster = await escolherQuadro(tmp, final.duracao);
  const imagem = await gerarImagem(quadroPoster.png, base, LARGURAS_POSTER, ['avif', 'jpg']);
  const noSite = bytes <= LIMITE_SITE;
  if (noSite) {
    await mkdir(dirname(video), { recursive: true });
    await rename(tmp, video).catch(async () => {
      await copyFile(tmp, video);
      await rm(tmp, { force: true });
    });
  } else await rm(tmp, { force: true });
  return {
    tipo: 'video',
    noSite,
    videoArquivo: noSite ? video.split('\\').join('/') : null,
    src: noSite
      ? '/' +
        video
          .split('\\')
          .join('/')
          .replace(/^public\//, '')
      : null,
    imagem,
    largura: final.largura,
    altura: final.altura,
    duracao: Math.round(final.duracao * 10) / 10,
    bytes,
    temAudio: final.temAudio,
    tentativa,
    posterEm: quadroPoster.fracao,
    metadadosRestantes: Object.keys(final.tags).filter(
      (k) => !['major_brand', 'minor_version', 'compatible_brands', 'encoder'].includes(k),
    ),
    origem: {
      largura: fonte.largura,
      altura: fonte.altura,
      fps: Math.round(fonte.fps * 100) / 100,
      bytes: t.bytes,
    },
  };
}

async function processarFoto(t) {
  const { base } = caminhosDe(t);
  let entrada = t.abs;
  const ext = extensao(t.rel);
  if (EXT_FOTO_RAW.includes(ext)) throw new Error('RAW de câmera: exporte em JPG para entrar no site');
  if (ext === 'heic' || ext === 'heif') {
    const heicConvert = require('heic-convert');
    entrada = Buffer.from(
      await heicConvert({ buffer: await readFile(t.abs), format: 'JPEG', quality: 0.92 }),
    );
  }
  const imagem = await gerarImagem(entrada, base, LARGURAS_FOTO, ['avif', 'webp'], t.girar);
  return { tipo: 'foto', imagem, largura: imagem.largura, altura: imagem.altura };
}

/** Move/copia as saídas de um arquivo que só mudou de nome (mesmo conteúdo). */
async function renomearSaidas(anterior, t) {
  const novo = caminhosDe(t);
  const meta = structuredClone(anterior.meta);
  const copias = [];
  if (meta.videoArquivo) {
    const destino = novo.video.split('\\').join('/');
    copias.push([meta.videoArquivo, destino]);
    meta.videoArquivo = destino;
    meta.src = '/' + destino.replace(/^public\//, '');
  }
  const img = meta.imagem;
  const baseNova = novo.base.split('\\').join('/');
  for (const w of img.larguras)
    for (const e of img.formatos) copias.push([`${img.baseDisco}-${w}.${e}`, `${baseNova}-${w}.${e}`]);
  img.baseDisco = baseNova;
  img.base = '/' + baseNova.replace(/^public\//, '');
  for (const [de, para] of copias) {
    await mkdir(dirname(para), { recursive: true });
    await copyFile(de, para);
  }
  return meta;
}

// ── 4. Executa ─────────────────────────────────────────────────────────────────────────────────
console.log(
  `${seco ? '[dry-run] ' : ''}${tarefas.length} arquivos de mídia em "${origem}" → ${projetos.size} projetos; ${paralelo} tarefas em paralelo (${nucleos} núcleos)`,
);

// os maiores primeiro: os vídeos longos começam cedo e não ficam sozinhos no fim
const fila = [...tarefas].sort((a, b) => b.bytes - a.bytes);
await emParalelo(fila, paralelo, async (t) => {
  try {
    const sha = await hashDe(t);
    const anterior = indice.arquivos[t.rel];
    const mesmaVersao =
      anterior &&
      anterior.versao === VERSAO &&
      anterior.sha256 === sha &&
      (anterior.girar ?? 0) === t.girar &&
      anterior.meta;
    const prontoNoNome =
      mesmaVersao &&
      anterior.nome === `${t.slug}/${t.nome}` &&
      arquivosDaSaida(anterior.meta).every((f) => existsSync(f));
    const prontoEmOutroNome =
      mesmaVersao &&
      anterior.nome !== `${t.slug}/${t.nome}` &&
      arquivosDaSaida(anterior.meta).every((f) => existsSync(f));

    if (!forcar && prontoNoNome) {
      t.meta = anterior.meta;
      resumo.pulados++;
      progresso(t, 'pulado');
    } else if (!forcar && prontoEmOutroNome) {
      if (!seco) t.meta = await renomearSaidas(anterior, t);
      else t.meta = anterior.meta;
      resumo.renomeados++;
      progresso(t, seco ? 'renomearia' : 'renomeado');
    } else if (seco) {
      resumo.criados++;
      progresso(t, 'criaria');
      return;
    } else {
      console.log(`  … ${t.classe === 'video' ? 'convertendo' : 'otimizando'} ${t.rel}`);
      t.meta = t.classe === 'video' ? await processarVideo(t, sha) : await processarFoto(t);
      resumo.criados++;
      progresso(t, 'criado');
    }
    if (!seco)
      indice.arquivos[t.rel] = {
        bytes: t.bytes,
        mtimeMs: t.mtimeMs,
        sha256: sha,
        versao: VERSAO,
        nome: `${t.slug}/${t.nome}`,
        girar: t.girar,
        meta: t.meta,
      };
  } catch (e) {
    resumo.falharam++;
    resumo.erros.push(`${t.rel}: ${e instanceof Error ? e.message : String(e)}`);
    progresso(t, 'FALHOU');
  }
});

// arquivos que saíram da pasta somem do índice
for (const rel of Object.keys(indice.arquivos))
  if (!tarefas.some((t) => t.rel === rel)) delete indice.arquivos[rel];

// ── 5. Lê textos da pasta do projeto (.txt/.md): 1ª linha = título; "funcoes:", "youtube:", "vimeo:" ─
async function lerTexto(p) {
  const arq = p.textos.find((x) => ['txt', 'md'].includes(extensao(x.rel)));
  if (!arq) {
    if (p.textos.length)
      console.warn(`aviso: ${p.textos[0].rel} é .docx; salve como .txt para o import ler.`);
    return undefined;
  }
  const linhas = (await readFile(arq.abs, 'utf8')).replace(/^\uFEFF/, '').split(/\r?\n/);
  const texto = { descricao: '' };
  const corpo = [];
  for (const l of linhas) {
    const m = /^\s*(funcoes|funções|youtube|vimeo)\s*:\s*(.*)$/i.exec(l);
    if (m) {
      const k = m[1].toLowerCase().replace('ç', 'c').replace('õ', 'o');
      if (k === 'funcoes')
        texto.funcoes = m[2]
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean);
      else texto[k] = m[2].trim();
    } else if (texto.titulo === undefined && l.trim()) texto.titulo = l.replace(/^#+\s*/, '').trim();
    else corpo.push(l);
  }
  texto.descricao = corpo.join('\n').trim();
  return texto;
}

// ── 6. Manifesto ───────────────────────────────────────────────────────────────────────────────
const imagemPublica = (img) => ({
  base: img.base,
  largura: img.largura,
  altura: img.altura,
  larguras: img.larguras,
  formatos: img.formatos,
  blur: img.blur,
});
const manifesto = {};
const relatorioPrincipais = [];
const foraDoSite = [];
const ordemConhecidos = conhecidos.map((p) => p.slug);
const listaProjetos = [...projetos.values()].sort((a, b) => {
  const ia = ordemConhecidos.indexOf(a.slug);
  const ib = ordemConhecidos.indexOf(b.slug);
  if (ia > -1 || ib > -1) return (ia > -1 ? ia : 1e9) - (ib > -1 ? ib : 1e9);
  return compararNatural(a.pasta ?? a.slug, b.pasta ?? b.slug);
});
for (const p of listaProjetos) {
  const videos = p.videos
    .filter((v) => v.meta)
    .map((v) => {
      const m = v.meta;
      const comum = {
        arquivo: `${v.nome}.mp4`,
        poster: imagemPublica(m.imagem),
        largura: m.largura,
        altura: m.altura,
        orientacao: orientacao(m.largura, m.altura),
        duracao: m.duracao,
        titulo: nomeLimpo(nomeDoArquivo(v.rel)) ? tituloDeNome(nomeLimpo(nomeDoArquivo(v.rel))) : '',
      };
      if (!m.noSite) {
        foraDoSite.push(`${v.rel} (${bytesLegiveis(m.bytes)} mesmo em 720p)`);
        return { tipo: 'youtube', id: 'TODO', ...comum, bytes: m.bytes, temAudio: m.temAudio };
      }
      return { tipo: 'video', src: m.src, ...comum, bytes: m.bytes, temAudio: m.temAudio };
    });
  const fotos = p.fotos
    .filter((f) => f.meta)
    .map((f) => ({
      tipo: 'foto',
      arquivo: f.nome,
      imagem: imagemPublica(f.meta.imagem),
      largura: f.meta.largura,
      altura: f.meta.altura,
      orientacao: orientacao(f.meta.largura, f.meta.altura),
    }));
  const principalOrigem = escolherPrincipal(seco ? p.videos : p.videos.filter((v) => v.meta));
  const principal = principalOrigem ? `${principalOrigem.nome}.mp4` : null;
  if (p.videos.length) relatorioPrincipais.push(`${p.slug}: ${principal} (origem: ${principalOrigem?.rel})`);
  const textoDaPasta = await lerTexto(p);
  const titulo = textoDaPasta?.titulo || tituloDeNome(p.pasta ?? p.slug);
  manifesto[p.slug] = {
    slug: p.slug,
    pasta: p.pasta,
    ordem: p.ordem,
    tituloSugerido: titulo,
    principal,
    videos,
    fotos,
    ...(textoDaPasta ? { textoDaPasta } : {}),
    ...(p.existente
      ? {}
      : {
          // TODO(garrido): descrever este projeto e confirmar funções (rascunho automático)
          rascunho: {
            titulo,
            funcoes: textoDaPasta?.funcoes ?? [],
            resumo: textoDaPasta?.descricao || `Vídeos e imagens do projeto ${titulo}.`,
          },
        }),
  };
}

const ts = `// ARQUIVO GERADO por scripts/importar-midia.mjs (\`pnpm media:import\`). Não edite à mão:
// o texto dos projetos fica em src/data/projects.ts. Projetos com "rascunho" ainda não têm texto
// escrito à mão. TODO(garrido): descrever esses projetos e confirmar funções.
import type { MidiaProjeto } from '../lib/tipos-midia';

export const midia = ${JSON.stringify(manifesto, null, 2)} as const satisfies Record<string, MidiaProjeto>;

export type SlugComMidia = keyof typeof midia;
`;

// ── 7. Limpeza: só dentro das pastas geradas ───────────────────────────────────────────────────
async function listarGerados(dir) {
  if (!existsSync(dir)) return [];
  return (await listarArquivos(dir)).map((f) => `${dir}/${f.rel}`);
}
const esperados = new Set(Object.values(indice.arquivos).flatMap((e) => arquivosDaSaida(e.meta)));
// itens de dry-run ainda não processados não têm saída: nada a apagar por causa deles
const orfaos = [...(await listarGerados(DIR_VIDEOS)), ...(await listarGerados(DIR_IMAGENS))].filter(
  (f) => !esperados.has(f) && !(seco && tarefas.some((t) => !t.meta)),
);

if (!seco) {
  await mkdir(dirname(MANIFESTO), { recursive: true });
  await writeFile(MANIFESTO, ts);
  await mkdir(CACHE, { recursive: true });
  await writeFile(INDICE, JSON.stringify({ versao: VERSAO, arquivos: indice.arquivos }, null, 1));
  if (resumo.falharam === 0 && orfaos.length) {
    console.log(`\nApagando ${orfaos.length} arquivo(s) gerado(s) sem origem:`);
    for (const f of orfaos) console.log(`  - ${f}`);
    for (const f of orfaos) {
      if (!f.startsWith(`${DIR_VIDEOS}/`) && !f.startsWith(`${DIR_IMAGENS}/`)) continue; // nunca fora das pastas geradas
      await rm(f, { force: true });
    }
    for (const dir of [DIR_VIDEOS, DIR_IMAGENS]) {
      if (!existsSync(dir)) continue;
      for (const sub of await readdir(dir)) {
        const caminho = join(dir, sub);
        if ((await readdir(caminho).catch(() => ['x'])).length === 0) await rmdir(caminho);
      }
    }
  } else if (orfaos.length)
    console.log(`\n${orfaos.length} arquivo(s) sem origem NÃO foram apagados porque houve falhas.`);
  await rm(join(CACHE, 'tmp'), { recursive: true, force: true });
} else if (orfaos.length) {
  console.log(`\n[dry-run] apagaria ${orfaos.length} arquivo(s) sem origem:`);
  for (const f of orfaos) console.log(`  - ${f}`);
}

// ── 8. Relatório ───────────────────────────────────────────────────────────────────────────────
async function tamanhoDe(dir) {
  if (!existsSync(dir)) return 0;
  return (await listarArquivos(dir)).reduce((s, f) => s + f.bytes, 0);
}
const tMedia = await tamanhoDe('public/media');
const tImagens = await tamanhoDe('public/images');
console.log('\n── Resumo ──────────────────────────────');
console.log(
  `criados: ${resumo.criados} · renomeados: ${resumo.renomeados} · pulados: ${resumo.pulados} · falharam: ${resumo.falharam}`,
);
for (const e of resumo.erros) console.log(`  ✗ ${e}`);
if (ignorados.length) console.log(`fora de projeto (ignorados ou especiais): ${ignorados.join(', ')}`);
console.log(`vídeo principal por projeto:\n  ${relatorioPrincipais.join('\n  ') || '(nenhum)'}`);
if (foraDoSite.length)
  console.log(`PRECISA HOSPEDAR FORA (YouTube não listado ou Vimeo):\n  ${foraDoSite.join('\n  ')}`);
console.log(
  `public/media: ${bytesLegiveis(tMedia)} · public/images: ${bytesLegiveis(tImagens)} · total: ${bytesLegiveis(tMedia + tImagens)}`,
);
if (tMedia + tImagens > AVISO_TOTAL)
  console.warn(
    `AVISO: a mídia do site passou de ${bytesLegiveis(AVISO_TOTAL)}. Considere YouTube/Vimeo para os vídeos longos.`,
  );
if (!seco) console.log(`ok ${MANIFESTO}`);
if (resumo.falharam) process.exitCode = 1;
