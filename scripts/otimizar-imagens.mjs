#!/usr/bin/env node
// Gera AVIF e WebP em 480/800/1200/1600 px a partir de assets-originais/
// e escreve src/data/imagens.generated.ts (dimensões + blur placeholder).
// Uso: node scripts/otimizar-imagens.mjs
import sharp from 'sharp';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, parse } from 'node:path';

const ORIGENS = 'assets-originais';
const SAIDA = 'public/images';
const LARGURAS = [240, 480, 800, 1200, 1600];

// Imagens usadas no site. Os quadros de vídeo (*-poster.jpg) ficam só em assets-originais/.
const USADAS = [
  'fundo-preto-banner.jpg',
  'hey-maringa-capa.jpg',
  'el-piratas-capa.jpg',
  'ody-park-capa.jpg',
  'juliana-marcio-capa.png',
  'mk5-capa.jpg',
  'heitor-amatsu-capa.jpg',
  'juliana-marcio-galeria-28.png',
  'juliana-marcio-galeria-25.png',
  'juliana-marcio-galeria-31.png',
  'juliana-marcio-galeria-38.png',
  'juliana-marcio-galeria-43.png',
  'juliana-marcio-galeria-04-vertical.png',
  'juliana-marcio-galeria-14-vertical.png',
  'juliana-marcio-galeria-15-vertical.png',
];

const existe = (p) =>
  access(p).then(
    () => true,
    () => false,
  );
await mkdir(SAIDA, { recursive: true });
await mkdir('src/data', { recursive: true });

const meta = {};
let gerados = 0;
let pulados = 0;

for (const arquivo of USADAS) {
  const origem = join(ORIGENS, arquivo);
  if (!(await existe(origem))) {
    console.error(`! faltando ${origem} (rode pnpm assets:download)`);
    process.exitCode = 1;
    continue;
  }
  const base = parse(arquivo).name;
  const img = sharp(origem).rotate();
  const info = await img.metadata();
  const larguras = LARGURAS.filter((w) => w <= info.width);
  if (!larguras.length || larguras.at(-1) < Math.min(info.width, 1600))
    larguras.push(Math.min(info.width, 1600));

  for (const w of larguras) {
    for (const [ext, opcoes] of [
      ['avif', { quality: 55, effort: 4 }],
      ['webp', { quality: 78 }],
    ]) {
      const destino = join(SAIDA, `${base}-${w}.${ext}`);
      if (await existe(destino)) {
        pulados++;
        continue;
      }
      const redimensionada = sharp(origem).rotate().resize({ width: w, withoutEnlargement: true });
      await (ext === 'avif' ? redimensionada.avif(opcoes) : redimensionada.webp(opcoes)).toFile(destino);
      gerados++;
    }
  }

  const blur = await sharp(origem).rotate().resize({ width: 16 }).blur(1).webp({ quality: 25 }).toBuffer();
  meta[base] = {
    width: info.width,
    height: info.height,
    widths: larguras,
    blur: `data:image/webp;base64,${blur.toString('base64')}`,
  };
  if (meta[base].blur.length > 1400)
    console.warn(`aviso: blur de ${base} com ${meta[base].blur.length} bytes`);
  console.log(`ok ${arquivo} → ${larguras.join(', ')}`);
}

const ts = `// ARQUIVO GERADO por scripts/otimizar-imagens.mjs. Não edite à mão.
export interface ImagemMeta {
  readonly width: number;
  readonly height: number;
  readonly widths: readonly number[];
  readonly blur: string;
}

export const imagens = ${JSON.stringify(meta, null, 2)} as const satisfies Record<string, ImagemMeta>;

export type ImagemId = keyof typeof imagens;
`;
await writeFile('src/data/imagens.generated.ts', ts);
console.log(`\n${gerados} arquivos gerados, ${pulados} já existiam.`);
