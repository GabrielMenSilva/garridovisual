#!/usr/bin/env node
// Publica o site no GitHub Pages: https://<usuário>.github.io/<repositório>/
//
//   pnpm deploy:pages              gera o site com o subcaminho e envia para a branch `gh-pages`
//   pnpm deploy:pages --dry-run    só gera e confere (dist-pages/), sem enviar nada
//
// O site é gerado em dist-pages/ com VITE_BASE=/<repositório>/ e VITE_SITE_URL=https://<usuário>.github.io/<repositório>,
// copiado para um worktree da branch `gh-pages` (.cache/gh-pages) e enviado com um commit normal
// (sem --force). O GitHub Pages serve essa branch. Para domínio próprio, troque BASE e URL.
import { spawnSync } from 'node:child_process';
import { cp, readdir, rm, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const seco = process.argv.includes('--dry-run');
const WORKTREE = '.cache/gh-pages';
const SAIDA = 'dist-pages';

function roda(cmd, args, opcoes = {}) {
  const r = spawnSync(cmd, args, {
    stdio: opcoes.silencioso ? 'pipe' : 'inherit',
    encoding: 'utf8',
    shell: false,
    ...opcoes,
  });
  if (r.status !== 0 && !opcoes.podeFalhar) {
    console.error(`falhou: ${cmd} ${args.join(' ')}\n${r.stderr ?? ''}`);
    process.exit(r.status ?? 1);
  }
  return r;
}
const git = (args, o) => roda('git', args, o);

// dono e nome do repositório a partir do remoto "origin"
const remoto = git(['remote', 'get-url', 'origin'], { silencioso: true }).stdout.trim();
const m = /github\.com[:/]([^/]+)\/([^/.]+)(\.git)?$/.exec(remoto);
if (!m) {
  console.error(`O remoto "origin" não é um repositório do GitHub: ${remoto}`);
  process.exit(1);
}
const [, dono, repo] = m;
const BASE = `/${repo}/`;
const URL_SITE = `https://${dono.toLowerCase()}.github.io/${repo}`;

// 1. build com o subcaminho
console.log(`Gerando o site para ${URL_SITE}/ …`);
const env = { ...process.env, VITE_BASE: BASE, VITE_SITE_URL: URL_SITE };
const vite = ['node_modules/vite/bin/vite.js'];
roda('node', ['node_modules/typescript/bin/tsc', '--noEmit']);
roda('node', [...vite, 'build', '--outDir', SAIDA, '--emptyOutDir'], { env });
roda(
  'node',
  [...vite, 'build', '--ssr', 'src/entry-server.tsx', '--outDir', 'dist-ssr-pages', '--emptyOutDir'],
  { env },
);
roda('node', ['scripts/prerender.mjs', SAIDA, 'dist-ssr-pages'], { env });
await writeFile(join(SAIDA, '.nojekyll'), ''); // o Pages não passa o site pelo Jekyll

// confere que nenhum arquivo passa do limite e que nada da mídia bruta foi junto
let total = 0;
async function anda(dir) {
  for (const it of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, it.name);
    if (it.isDirectory()) await anda(p);
    else {
      const { size } = await stat(p);
      total += size;
      if (size > 95 * 1024 * 1024) throw new Error(`${p} passa de 95 MB (limite do GitHub: 100 MB)`);
      if (/videos e fotos|\.cache/.test(p)) throw new Error(`mídia bruta no site: ${p}`);
    }
  }
}
await anda(SAIDA);
console.log(`ok ${SAIDA}/ (${(total / 1048576).toFixed(1)} MB)`);
if (seco) {
  console.log('[dry-run] nada foi enviado.');
  process.exit(0);
}

// 2. worktree da branch gh-pages
git(['fetch', 'origin', 'gh-pages'], { podeFalhar: true, silencioso: true });
const temRemota =
  git(['rev-parse', '--verify', '--quiet', 'refs/remotes/origin/gh-pages'], {
    podeFalhar: true,
    silencioso: true,
  }).status === 0;
const temLocal =
  git(['rev-parse', '--verify', '--quiet', 'refs/heads/gh-pages'], { podeFalhar: true, silencioso: true })
    .status === 0;
if (!existsSync(join(WORKTREE, '.git'))) {
  git(['worktree', 'prune']);
  if (temLocal) git(['worktree', 'add', WORKTREE, 'gh-pages']);
  else if (temRemota) git(['worktree', 'add', '--track', '-b', 'gh-pages', WORKTREE, 'origin/gh-pages']);
  else git(['worktree', 'add', '--orphan', '-b', 'gh-pages', WORKTREE]);
}
if (temRemota) git(['-C', WORKTREE, 'merge', '--ff-only', 'origin/gh-pages'], { podeFalhar: true });

// 3. troca o conteúdo pelo site novo (só dentro do worktree)
for (const nome of await readdir(WORKTREE))
  if (nome !== '.git') await rm(join(WORKTREE, nome), { recursive: true, force: true });
await cp(SAIDA, WORKTREE, { recursive: true });
git(['-C', WORKTREE, 'add', '-A']);
const mudou = git(['-C', WORKTREE, 'diff', '--cached', '--quiet'], { podeFalhar: true }).status !== 0;
if (!mudou) {
  console.log('O site no GitHub Pages já está igual. Nada a enviar.');
  process.exit(0);
}
const origemCommit = git(['rev-parse', '--short', 'HEAD'], { silencioso: true }).stdout.trim();
git(['-C', WORKTREE, 'commit', '-q', '-m', `deploy: site gerado de ${origemCommit}`]);
git(['-C', WORKTREE, 'push', '-u', 'origin', 'gh-pages']);
console.log(`\nEnviado. Em 1 a 2 minutos o site atualiza em ${URL_SITE}/`);
