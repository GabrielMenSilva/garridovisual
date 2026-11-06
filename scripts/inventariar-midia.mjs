#!/usr/bin/env node
// Inventário da pasta de mídia do Garrido (SOMENTE LEITURA) → docs/inventario-midia.md
// Uso: pnpm media:inventory   (ou: node scripts/inventariar-midia.mjs --origem "C:\outra\pasta")
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import {
  ORIGEM_PADRAO,
  acharFfprobe,
  argumento,
  emParalelo,
  lerProjetosConhecidos,
  listarArquivos,
  sha256,
  sondarVideo,
} from './lib/ferramentas.mjs';
import {
  EXT_FOTO_RAW,
  EXT_INCOMUM,
  bytesLegiveis,
  candidatoEspecial,
  classificarArquivo,
  duracaoLegivel,
  escolherPrincipal,
  extensao,
  ligarAoProjeto,
  ordenarMidia,
  orientacao,
  problemasDoNome,
  proporcao,
  tituloDeNome,
} from './lib/midia.mjs';

const origem = argumento('origem', ORIGEM_PADRAO);
const saida = argumento('saida', 'docs/inventario-midia.md');
const ffprobe = acharFfprobe();
const conhecidos = await lerProjetosConhecidos();
const arquivos = (await listarArquivos(origem)).sort((a, b) => a.rel.localeCompare(b.rel, 'pt-BR', { numeric: true }));
const GRANDE = 500 * 1024 * 1024;

console.log(`Inventário de "${origem}": ${arquivos.length} arquivos`);
const limite = Math.max(1, Math.floor(cpus().length / 2));
let feitos = 0;

const itens = await emParalelo(arquivos, limite, async (a) => {
  const classe = classificarArquivo(a.rel);
  const it = { ...a, classe, ext: extensao(a.rel), hash: await sha256(a.abs), erro: null, info: null };
  try {
    if (a.bytes === 0) throw new Error('arquivo vazio');
    if (classe === 'video') it.info = await sondarVideo(ffprobe, a.abs);
    else if (classe === 'foto') {
      if (EXT_FOTO_RAW.includes(it.ext)) throw new Error('RAW de câmera: o sharp não abre');
      if (it.ext !== 'heic' && it.ext !== 'heif') {
        const m = await sharp(a.abs).metadata();
        const virada = (m.orientation ?? 1) >= 5;
        it.info = {
          largura: virada ? m.height : m.width,
          altura: virada ? m.width : m.height,
          exif: m.orientation ?? 1,
          temGps: Boolean(m.exif && m.exif.includes(Buffer.from('GPS'))),
        };
      } else it.info = { largura: 0, altura: 0, exif: '?', temGps: false };
    }
  } catch (e) {
    it.erro = e instanceof Error ? e.message : String(e);
  }
  feitos++;
  process.stdout.write(`\r  ${feitos} de ${arquivos.length}: ${a.rel.slice(0, 60).padEnd(60)}`);
  return it;
});
process.stdout.write('\n');

// ligação com projetos
for (const it of itens) {
  it.especial = it.rel.includes('/') ? null : candidatoEspecial(it.rel);
  it.projeto = it.classe === 'ignorar' ? null : ligarAoProjeto(it.rel, conhecidos);
}

const porHash = new Map();
for (const it of itens) porHash.set(it.hash, [...(porHash.get(it.hash) ?? []), it]);
const duplicados = [...porHash.values()].filter((g) => g.length > 1);
const corrompidos = itens.filter((i) => i.erro);
const incomuns = itens.filter((i) => EXT_INCOMUM.includes(i.ext));
const gigantes = itens.filter((i) => i.bytes > GRANDE);
const nomesRuins = itens.map((i) => ({ i, p: problemasDoNome(i.rel.split('/').pop() ?? '') })).filter((x) => x.p.length);
const pastasRuins = [...new Set(itens.flatMap((i) => i.rel.split('/').slice(0, -1)))]
  .map((p) => ({ p, prob: problemasDoNome(p) }))
  .filter((x) => x.prob.length);
const semProjeto = itens.filter((i) => i.classe !== 'ignorar' && !i.projeto && !i.especial);

const projetos = new Map();
for (const it of itens) {
  if (!it.projeto) continue;
  const p = projetos.get(it.projeto.slug) ?? { ...it.projeto, videos: [], fotos: [], textos: [] };
  if (it.classe === 'video') p.videos.push({ ...it, caminho: it.rel });
  if (it.classe === 'foto') p.fotos.push({ ...it, caminho: it.rel });
  if (it.classe === 'texto') p.textos.push(it);
  projetos.set(it.projeto.slug, p);
}

const tot = (f) => itens.filter(f).reduce((s, i) => s + i.bytes, 0);
const videos = itens.filter((i) => i.classe === 'video');
const fotos = itens.filter((i) => i.classe === 'foto');
const textos = itens.filter((i) => i.classe === 'texto');

// árvore
function arvore() {
  const linhas = [`${origem}/`];
  const pastas = new Map();
  for (const it of itens) {
    const partes = it.rel.split('/');
    const pasta = partes.slice(0, -1).join('/');
    pastas.set(pasta, [...(pastas.get(pasta) ?? []), partes.at(-1)]);
  }
  for (const [pasta, nomes] of [...pastas].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR', { numeric: true }))) {
    const nivel = pasta ? pasta.split('/').length : 0;
    if (pasta) linhas.push(`${'  '.repeat(nivel - 1)}├─ ${pasta.split('/').at(-1)}/`);
    const ord = [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
    linhas.push(`${'  '.repeat(nivel)}│  ${ord.length > 8 ? `${ord.length} arquivos: ${ord.join(', ')}` : ord.join(', ')}`);
  }
  return linhas.join('\n');
}

const md = [];
md.push('# Inventário da mídia (`videos e fotos`)');
md.push('');
md.push(
  `Gerado por \`pnpm media:inventory\` (\`scripts/inventariar-midia.mjs\`). A pasta é **somente leitura**: nada nela é renomeado, movido ou apagado, e ela não vai para o Git.`,
);
md.push('');
md.push('## Resumo');
md.push('');
md.push('| | Arquivos | Tamanho |');
md.push('|---|---:|---:|');
md.push(`| Vídeos | ${videos.length} | ${bytesLegiveis(tot((i) => i.classe === 'video'))} |`);
md.push(`| Fotos | ${fotos.length} | ${bytesLegiveis(tot((i) => i.classe === 'foto'))} |`);
md.push(`| Textos | ${textos.length} | ${bytesLegiveis(tot((i) => i.classe === 'texto'))} |`);
md.push(`| Ignorados | ${itens.filter((i) => i.classe === 'ignorar').length} | ${bytesLegiveis(tot((i) => i.classe === 'ignorar'))} |`);
md.push(`| **Total** | **${itens.length}** | **${bytesLegiveis(tot(() => true))}** (${tot(() => true)} bytes) |`);
md.push('');
md.push('## Árvore');
md.push('');
md.push('```');
md.push(arvore());
md.push('```');
md.push('');
md.push('## Como cada arquivo foi ligado a um projeto');
md.push('');
md.push(
  'A pasta mistura dois jeitos de organizar, e o script aceita os três previstos:',
);
md.push('');
md.push('- **(A) uma subpasta por projeto** (`casamento/`, `fora de centro/`, `MG nataçao/`): a **primeira pasta** do caminho é o projeto; subpastas internas (`fotos horizontal/`, `fotos vertical/`, ou `videos/` e `fotos/` no caso B) só organizam.');
md.push('- **(B) subpasta por projeto com `videos/` e `fotos/` dentro**: mesma regra do A.');
md.push('- **(C) arquivo solto na raiz** (`barberaria.mp4`, `pedido de casamento.mp4`): o **nome do arquivo** (sem extensão e sem número final, ex.: `hey maringa 2.mp4` → `hey maringa`) é o projeto.');
md.push('');
md.push(
  'O nome é comparado **sem acento, sem maiúsculas, sem espaços/hífens e sem o "e"/"&"** com o slug e o título dos projetos que o site já tem (`Hey Maringá`, `hey_maringa`, `HEYMARINGA` → `hey-maringa`). O que não casa vira **projeto novo**. Prefixo numérico na pasta (`01-`) define a ordem do projeto no site. Arquivos soltos com `hero`, `home`, `showreel`, `intro`, `capa`, `garrido`, `sobre`, `retrato`, `perfil`, `eu`, `logo` (ou `.svg`) no nome são tratados como candidatos especiais, não como projeto.',
);
md.push('');
md.push('### Projetos existentes com mídia nova');
md.push('');
const existentes = [...projetos.values()].filter((p) => p.existente);
if (!existentes.length) md.push('_Nenhum._ Nenhuma pasta ou arquivo casou com os 6 projetos do site (`hey-maringa`, `el-piratas`, `ody-park`, `juliana-e-marcio`, `mk5`, `heitor-amatsu`). Eles continuam como estão.');
else {
  md.push('| Projeto | Origem | Vídeos | Fotos |');
  md.push('|---|---|---:|---:|');
  for (const p of existentes) md.push(`| \`${p.slug}\` | \`${p.nomeOrigem}\` (${p.regra}) | ${p.videos.length} | ${p.fotos.length} |`);
}
md.push('');
md.push('### Projetos novos');
md.push('');
md.push('| Slug | Título sugerido | Origem | Regra | Vídeos | Fotos | Textos | Vídeo principal (sugestão) |');
md.push('|---|---|---|---|---:|---:|---:|---|');
for (const p of [...projetos.values()].filter((x) => !x.existente)) {
  const pr = escolherPrincipal(p.videos);
  md.push(
    `| \`${p.slug}\` | ${tituloDeNome(p.nomeOrigem)} | \`${p.nomeOrigem}\` | ${p.regra === 'pasta' ? 'A (pasta)' : 'C (arquivo solto)'} | ${p.videos.length} | ${p.fotos.length} | ${p.textos.length} | ${pr ? `\`${pr.rel.split('/').pop()}\`` : '—'} |`,
  );
}
md.push('');
if (semProjeto.length) {
  md.push(`**Sem projeto (${semProjeto.length}):** ${semProjeto.map((i) => `\`${i.rel}\``).join(', ')}`);
  md.push('');
}
md.push('## Candidatos especiais');
md.push('');
const cand = (tipo) => itens.filter((i) => i.especial === tipo).map((i) => `\`${i.rel}\``);
md.push(`- **Hero** (\`hero\`, \`home\`, \`showreel\`, \`intro\`, \`capa\`): ${cand('hero').join(', ') || 'nenhum'}`);
md.push(`- **Foto do Garrido** (\`garrido\`, \`sobre\`, \`retrato\`, \`perfil\`, \`eu\`): ${cand('garrido').join(', ') || 'nenhum'}`);
md.push(`- **Logo** (\`logo\`, \`.svg\`): ${cand('logo').join(', ') || 'nenhum'}`);
md.push(`- **Textos** (\`.txt\`, \`.md\`, \`.docx\`): ${textos.map((i) => `\`${i.rel}\``).join(', ') || 'nenhum'}`);
md.push('');
md.push('## Problemas encontrados');
md.push('');
md.push(`- **Duplicados (mesmo SHA-256):** ${duplicados.length ? duplicados.map((g) => g.map((i) => `\`${i.rel}\``).join(' = ')).join('; ') : 'nenhum'}`);
md.push(`- **Vazios ou corrompidos:** ${corrompidos.length ? corrompidos.map((i) => `\`${i.rel}\` (${i.erro})`).join('; ') : 'nenhum'}`);
md.push(`- **Formatos fora do comum:** ${incomuns.length ? incomuns.map((i) => `\`${i.rel}\``).join(', ') : 'nenhum (só `.mp4` e `.jpg`)'}`);
md.push(`- **Maiores que 500 MB:** ${gigantes.length ? gigantes.map((i) => `\`${i.rel}\` (${bytesLegiveis(i.bytes)})`).join(', ') : 'nenhum'}`);
md.push(
  `- **Nomes de arquivo problemáticos:** ${nomesRuins.length ? nomesRuins.map((x) => `\`${x.i.rel}\` (${x.p.join(', ')})`).join('; ') : 'nenhum'}`,
);
md.push(`- **Nomes de pasta problemáticos:** ${pastasRuins.length ? pastasRuins.map((x) => `\`${x.p}\` (${x.prob.join(', ')})`).join('; ') : 'nenhum'}`);
const gps = fotos.filter((i) => i.info?.temGps);
md.push(`- **Fotos com dados de GPS no EXIF:** ${gps.length} de ${fotos.length} (as cópias do site saem **sem** metadados).`);
md.push('');
md.push('Os nomes problemáticos **não** são renomeados (a pasta é só leitura); o import gera nomes limpos para o site.');
md.push('');
md.push('## Vídeos');
md.push('');
md.push('| Arquivo | Tamanho | Duração | Resolução | Orientação | Proporção | Codec | Quadros/s | Áudio |');
md.push('|---|---:|---:|---|---|---|---|---:|---|');
for (const p of [...projetos.values()]) {
  for (const it of ordenarMidia(p.videos)) {
    const i = it.info;
    if (!i) {
      md.push(`| \`${it.rel}\` | ${bytesLegiveis(it.bytes)} | — | — | — | — | erro: ${it.erro} | — | — |`);
      continue;
    }
    md.push(
      `| \`${it.rel}\` | ${bytesLegiveis(it.bytes)} | ${duracaoLegivel(i.duracao)} | ${i.largura}×${i.altura}${i.rotacao ? ` (rot. ${i.rotacao}°)` : ''} | ${orientacao(i.largura, i.altura)} | ${proporcao(i.largura, i.altura)} | ${i.codec} ${i.perfil} ${i.pixFmt} | ${i.fps.toFixed(2)} | ${i.temAudio ? 'sim' : 'não'} |`,
    );
  }
}
md.push('');
md.push('## Fotos');
md.push('');
md.push('| Arquivo | Tamanho | Dimensões (já giradas) | Orientação | EXIF orientation |');
md.push('|---|---:|---|---|---:|');
for (const p of [...projetos.values()]) {
  for (const it of ordenarMidia(p.fotos)) {
    const i = it.info;
    md.push(
      i
        ? `| \`${it.rel}\` | ${bytesLegiveis(it.bytes)} | ${i.largura}×${i.altura} | ${i.largura ? orientacao(i.largura, i.altura) : '?'} | ${i.exif} |`
        : `| \`${it.rel}\` | ${bytesLegiveis(it.bytes)} | erro: ${it.erro} | — | — |`,
    );
  }
}
md.push('');
md.push('## Conferência de integridade');
md.push('');
md.push(`Contagem e tamanho total no momento do inventário: **${itens.length} arquivos, ${tot(() => true)} bytes**. O fechamento confere que a pasta continua idêntica.`);
md.push('');

await writeFile(saida, md.join('\n'));
console.log(`\nok ${saida}`);
console.log(
  `${videos.length} vídeos (${bytesLegiveis(tot((i) => i.classe === 'video'))}), ${fotos.length} fotos (${bytesLegiveis(tot((i) => i.classe === 'foto'))}), ${textos.length} textos`,
);
console.log(`projetos existentes com mídia: ${existentes.map((p) => p.slug).join(', ') || 'nenhum'}`);
console.log(`projetos novos: ${[...projetos.values()].filter((p) => !p.existente).map((p) => p.slug).join(', ')}`);
console.log(`duplicados: ${duplicados.length}, corrompidos: ${corrompidos.length}, > 500 MB: ${gigantes.length}, sem projeto: ${semProjeto.length}`);
