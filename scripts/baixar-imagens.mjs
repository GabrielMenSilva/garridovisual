#!/usr/bin/env node
// Baixa as imagens do site de referência (Wix) do GarridoVisual em resolução original.
// Uso: node scripts/baixar-imagens.mjs   (Node 18+; sem dependências)
// Saída: assets-originais/*.{jpg,png} + assets-originais/manifest.json
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR = process.argv[2] ?? 'assets-originais';
const BASE = 'https://static.wixstatic.com/media/';

// [arquivo no Wix, nome local, onde aparece no site de referência]
const IMAGENS = [
  ['11062b_2a21543d073044d3bb407f6818a6151f~mv2.jpg', 'fundo-preto-banner.jpg', 'Banner da home (fundo preto)'],
  ['f6fff7_546fc68de2c9482aa3c55ae8e130c2e0~mv2.jpg', 'hey-maringa-capa.jpg', 'Capa do projeto Hey Maringá'],
  ['f6fff7_866eda8b49504dd6b25a72b37bf664a3~mv2.jpg', 'el-piratas-capa.jpg', 'Capa do projeto El Piratas'],
  ['f6fff7_82a79997c059475382324ac7b31d8822~mv2.jpg', 'ody-park-capa.jpg', 'Capa do projeto Ody Park'],
  ['f6fff7_92422791cae34f679f5e78c14fa8ca1a~mv2.png', 'juliana-marcio-capa.png', 'Capa do projeto Juliana & Márcio'],
  ['f6fff7_f251c46117544c31a2c60afa7650adf3~mv2.jpg', 'mk5-capa.jpg', 'Capa do projeto MK5'],
  ['f6fff7_f9eb0e133d8a497b991036e4eeb60887~mv2.jpg', 'heitor-amatsu-capa.jpg', 'Capa do projeto Heitor Amatsu'],
  // Galeria do casamento Juliana & Márcio (página de projeto 4)
  ['f6fff7_9c9dadf088914d12a791ba306f8edaa1~mv2.png', 'juliana-marcio-galeria-28.png', 'Galeria casamento (horizontal)'],
  ['f6fff7_e769bb455ae2444d8bebdcde4fa44e34~mv2.png', 'juliana-marcio-galeria-25.png', 'Galeria casamento (horizontal)'],
  ['f6fff7_564a592707444326949d68ad90b106d1~mv2.png', 'juliana-marcio-galeria-31.png', 'Galeria casamento (horizontal)'],
  ['f6fff7_342eb15647724f488957d42a051e02e9~mv2.png', 'juliana-marcio-galeria-38.png', 'Galeria casamento (horizontal)'],
  ['f6fff7_6a55b80fa3e04c8a93f6dbf102348000~mv2.png', 'juliana-marcio-galeria-43.png', 'Galeria casamento (horizontal)'],
  ['f6fff7_7fb3a0b10ef24668a68445778aed9408~mv2.png', 'juliana-marcio-galeria-04-vertical.png', 'Galeria casamento (vertical)'],
  ['f6fff7_9fc3b873b4954012ae2f2a992238be20~mv2.png', 'juliana-marcio-galeria-14-vertical.png', 'Galeria casamento (vertical)'],
  ['f6fff7_153bac131df2457bbd16747b1a5f72a0~mv2.png', 'juliana-marcio-galeria-15-vertical.png', 'Galeria casamento (vertical)'],
  // Achadas na varredura com Playwright (scripts/varrer-site.mjs)
  ['f6fff7_c40a7200146f464ab3ae14d56c788eb3f000.jpg', 'hey-maringa-video-01-poster.jpg', 'Quadro de capa de um vídeo do projeto hey-maringa (página projeto-1)'],
  ['f6fff7_b1432c8ede454a60b4b4002ff759b65cf000.jpg', 'hey-maringa-video-02-poster.jpg', 'Quadro de capa de um vídeo do projeto hey-maringa (página projeto-1)'],
  ['f6fff7_935886c32ccf478e8fe1ba921772473df000.jpg', 'hey-maringa-video-03-poster.jpg', 'Quadro de capa de um vídeo do projeto hey-maringa (página projeto-1)'],
  ['f6fff7_bbd7c35ffe864665aa4f8fbf95e3be2ef000.jpg', 'hey-maringa-video-04-poster.jpg', 'Quadro de capa de um vídeo do projeto hey-maringa (página projeto-1)'],
  ['f6fff7_2375b357f32449b4a0205da8fa1acc0ff000.jpg', 'el-piratas-video-01-poster.jpg', 'Quadro de capa de um vídeo do projeto el-piratas (página projeto-2)'],
  ['f6fff7_f5c9c0fcf24e4460b72f7849a8d68124f002.jpg', 'el-piratas-video-02-poster.jpg', 'Quadro de capa de um vídeo do projeto el-piratas (página projeto-2)'],
  ['f6fff7_d6bed14baa334b5f858345e0bdd57683f001.jpg', 'el-piratas-video-03-poster.jpg', 'Quadro de capa de um vídeo do projeto el-piratas (página projeto-2)'],
  ['f6fff7_2bae852a0c524fa5b6a8cf93d15cad50f001.jpg', 'el-piratas-video-04-poster.jpg', 'Quadro de capa de um vídeo do projeto el-piratas (página projeto-2)'],
  ['f6fff7_2b7ca91a719249a080b202c96a9fe0abf000.jpg', 'ody-park-video-01-poster.jpg', 'Quadro de capa de um vídeo do projeto ody-park (página projeto-3)'],
  ['f6fff7_1130a8ec7c67448da59f25b45a9c4408f001.jpg', 'ody-park-video-02-poster.jpg', 'Quadro de capa de um vídeo do projeto ody-park (página projeto-3)'],
  ['f6fff7_bad2ff32b12a4c88b79d623d4bbbb94af002.jpg', 'ody-park-video-03-poster.jpg', 'Quadro de capa de um vídeo do projeto ody-park (página projeto-3)'],
  ['f6fff7_7f408d65225d4b1ab686adb8ea850f1ff002.jpg', 'ody-park-video-04-poster.jpg', 'Quadro de capa de um vídeo do projeto ody-park (página projeto-3)'],
  ['f6fff7_47afb8af3d3a4951afe06311a65e0af2f002.jpg', 'juliana-marcio-video-01-poster.jpg', 'Quadro de capa de um vídeo do projeto juliana-marcio (página projeto-4)'],
  ['f6fff7_7f05d333b2994a8a8f814ab692e20e28f000.jpg', 'mk5-video-01-poster.jpg', 'Quadro de capa de um vídeo do projeto mk5 (página projeto-5)'],
  ['f6fff7_e1ce4911346946b4b305064cd7e440b3f000.jpg', 'mk5-video-02-poster.jpg', 'Quadro de capa de um vídeo do projeto mk5 (página projeto-5)'],
  ['f6fff7_12198c87ed7b43a8a6576291dfaa5169f002.jpg', 'mk5-video-03-poster.jpg', 'Quadro de capa de um vídeo do projeto mk5 (página projeto-5)'],
  ['f6fff7_b0d89949987541ad80951c695e3d36acf000.jpg', 'mk5-video-04-poster.jpg', 'Quadro de capa de um vídeo do projeto mk5 (página projeto-5)'],
  ['f6fff7_f87445334c394f1eba058bc00339c7a9f001.jpg', 'heitor-amatsu-video-01-poster.jpg', 'Quadro de capa de um vídeo do projeto heitor-amatsu (página projeto-6)'],
];

const existe = (p) => access(p).then(() => true, () => false);

function tipoPorBytes(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

async function baixar(arquivo) {
  // 1) original sem transformação; 2) se falhar, versão grande renderizada pelo Wix
  const tentativas = [
    `${BASE}${arquivo}`,
    `${BASE}${arquivo}/v1/fill/w_2400,h_2400,al_c,q_90/${arquivo}`,
  ];
  let ultimoErro = 'desconhecido';
  for (const url of tentativas) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (assets-download)' } });
      if (!r.ok) { ultimoErro = `HTTP ${r.status}`; continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      const tipo = tipoPorBytes(buf);
      if (!tipo) { ultimoErro = 'conteúdo não é imagem'; continue; }
      return { buf, tipo, via: url === tentativas[0] ? 'original' : 'fill-2400' };
    } catch (e) {
      ultimoErro = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(ultimoErro);
}

await mkdir(OUT_DIR, { recursive: true });
const manifestPath = join(OUT_DIR, 'manifest.json');
const manifest = (await existe(manifestPath)) ? JSON.parse(await readFile(manifestPath, 'utf8')) : {};

let ok = 0, pulados = 0, falhas = 0;
for (const [arquivo, nome, descricao] of IMAGENS) {
  const destino = join(OUT_DIR, nome);
  if (await existe(destino)) { pulados++; console.log(`= já existe  ${nome}`); continue; }
  try {
    const { buf, tipo, via } = await baixar(arquivo);
    await writeFile(destino, buf);
    manifest[nome] = {
      descricao,
      origem: `${BASE}${arquivo}`,
      via,
      formato: tipo,
      bytes: buf.length,
      sha256: createHash('sha256').update(buf).digest('hex'),
      baixadoEm: new Date().toISOString(),
    };
    ok++;
    console.log(`+ baixada    ${nome} (${(buf.length / 1024).toFixed(0)} KB, ${via})`);
  } catch (e) {
    falhas++;
    console.error(`! falhou     ${nome}: ${e instanceof Error ? e.message : e}`);
  }
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nResumo: ${ok} baixadas, ${pulados} já existiam, ${falhas} falhas (de ${IMAGENS.length}).`);
process.exit(falhas ? 1 : 0);
