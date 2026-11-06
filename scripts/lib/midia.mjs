// @ts-check
// Funções puras do processo de mídia (inventário e `pnpm media:import`).
// Sem acesso a disco: tudo aqui é testado em scripts/lib/midia.test.mjs.

/** Extensões reconhecidas. */
export const EXT_VIDEO = ['mp4', 'mov', 'm4v', 'mkv', 'avi', 'webm', 'wmv', 'mts', 'm2ts', '3gp'];
export const EXT_FOTO = [
  'jpg',
  'jpeg',
  'png',
  'heic',
  'heif',
  'webp',
  'tif',
  'tiff',
  'avif',
  'gif',
  'dng',
  'raw',
  'cr2',
  'nef',
  'arw',
];
export const EXT_TEXTO = ['txt', 'md', 'docx'];
/** Formatos fora do comum: entram no inventário como alerta. */
export const EXT_INCOMUM = [
  'mov',
  'mkv',
  'avi',
  'wmv',
  'mts',
  'm2ts',
  '3gp',
  'heic',
  'heif',
  'webp',
  'tif',
  'tiff',
  'dng',
  'raw',
  'cr2',
  'nef',
  'arw',
];
/** Formatos de foto que o sharp não abre (RAW de câmera): ficam de fora com aviso. */
export const EXT_FOTO_RAW = ['dng', 'raw', 'cr2', 'nef', 'arw'];

const LIXO = /^(\.ds_store|thumbs\.db|desktop\.ini|\._.*|~\$.*|\.gitkeep|icon\r?)$/i;

/** Nome do arquivo (último segmento) de um caminho com / ou \. */
export function nomeDoArquivo(caminho) {
  return caminho.split(/[\\/]/).pop() ?? '';
}

/** Extensão em minúsculas, sem ponto ("" se não houver). */
export function extensao(caminho) {
  const nome = nomeDoArquivo(caminho);
  const i = nome.lastIndexOf('.');
  return i > 0 ? nome.slice(i + 1).toLowerCase() : '';
}

/** Nome sem a extensão. "4..mp4" → "4." */
export function semExtensao(caminho) {
  const nome = nomeDoArquivo(caminho);
  const i = nome.lastIndexOf('.');
  return i > 0 ? nome.slice(0, i) : nome;
}

/**
 * Minúsculas, sem acento, hífens no lugar de espaços e símbolos.
 * "Hey Maringá" → "hey-maringa"; "foto (1)" → "foto-1"; "Juliana & Márcio" → "juliana-e-marcio".
 */
export function slugify(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Chave para comparar nomes: slug sem hífens e sem o conector "e". "Juliana & Márcio" → "julianamarcio". */
export function chave(texto) {
  return slugify(texto)
    .split('-')
    .filter((t) => t && t !== 'e')
    .join('');
}

/** @typedef {'video' | 'foto' | 'texto' | 'ignorar'} Classe */

/** Classifica um arquivo pela extensão (e descarta lixo de sistema). @returns {Classe} */
export function classificarArquivo(caminho) {
  const nome = nomeDoArquivo(caminho);
  if (!nome || LIXO.test(nome)) return 'ignorar';
  const ext = extensao(nome);
  if (EXT_VIDEO.includes(ext)) return 'video';
  if (EXT_FOTO.includes(ext)) return 'foto';
  if (EXT_TEXTO.includes(ext)) return 'texto';
  return 'ignorar';
}

/**
 * Prefixo numérico do nome (sem extensão), ou null. "1.1.1.1" → 1; "02-abertura" → 2; "4." → 4;
 * "video 1.2" → null.
 */
export function prefixoNumerico(nome) {
  const m = /^\s*(\d+)/.exec(semExtensao(nome));
  return m ? Number(m[1]) : null;
}

/** Tira o prefixo numérico e separadores do começo. "02 - Abertura" → "Abertura"; "1.1.1.1" → "". */
export function semPrefixo(nome) {
  return semExtensao(nome)
    .replace(/^\s*\d[\d.\-_\s]*/, '')
    .replace(/^[\s.\-_]+/, '')
    .trim();
}

/** Nome "limpo" para rótulo: sem extensão, sem números e sem separadores repetidos. "video 1.2" → "video". */
export function nomeLimpo(nome) {
  return semExtensao(nome)
    .replace(/\(\d+\)/g, ' ')
    .replace(/[\d]+/g, ' ')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Primeira letra maiúscula. */
function capitaliza(s) {
  return s ? s[0].toLocaleUpperCase('pt-BR') + s.slice(1) : s;
}

/** Palavras que não levam maiúscula no meio de um título. */
const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'a', 'o', 'para', 'com']);

/** Correções de acento comuns em nomes de pasta (sem inventar nada além do acento). */
const ACENTOS = {
  natacao: 'natação',
  nataçao: 'natação',
  clinica: 'clínica',
  maringa: 'Maringá',
  marcio: 'Márcio',
  video: 'vídeo',
  videos: 'vídeos',
  musica: 'música',
  gastronomia: 'gastronomia',
  publicidade: 'publicidade',
  cafe: 'café',
  academia: 'academia',
};

/**
 * Título legível a partir do nome de uma pasta ou arquivo.
 * "marketing-clinica-x" → "Marketing Clínica X"; "MG nataçao" → "MG Natação"; "pedido de casamento" → "Pedido de Casamento".
 * Siglas (só maiúsculas) ficam como estão.
 */
export function tituloDeNome(nome) {
  const base = semPrefixo(nome) || semExtensao(nome);
  const palavras = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  return palavras
    .map((p, i) => {
      if (p.length > 1 && p === p.toUpperCase() && /[A-Z]/.test(p)) return p; // sigla
      const baixa = p.toLocaleLowerCase('pt-BR');
      const corrigida = ACENTOS[baixa] ?? baixa;
      if (i > 0 && MINUSCULAS.has(corrigida)) return corrigida;
      return capitaliza(corrigida);
    })
    .join(' ');
}

/** Palavras que indicam arquivos especiais na raiz da pasta (não são projetos). */
const PALAVRAS_HERO = ['hero', 'home', 'showreel', 'reel', 'intro', 'capa'];
const PALAVRAS_GARRIDO = ['garrido', 'sobre', 'retrato', 'perfil', 'eu'];
const PALAVRAS_LOGO = ['logo', 'logotipo', 'marca'];

/** Tokens do slug de um nome. */
function tokens(nome) {
  return slugify(semExtensao(nome)).split('-').filter(Boolean);
}

/**
 * Candidato a arquivo especial: 'hero', 'garrido', 'logo' ou null.
 * Só vale para arquivos soltos na raiz (dentro de uma pasta de projeto, "capa" marca o vídeo principal).
 */
export function candidatoEspecial(nome) {
  const t = tokens(nome);
  if (extensao(nome) === 'svg' || t.some((x) => PALAVRAS_LOGO.includes(x))) return 'logo';
  if (t.some((x) => PALAVRAS_HERO.includes(x))) return 'hero';
  if (t.some((x) => PALAVRAS_GARRIDO.includes(x))) return 'garrido';
  return null;
}

/**
 * @typedef {{ slug: string, titulo?: string }} ProjetoConhecido
 * @typedef {{ slug: string, pasta: string, nomeOrigem: string, existente: boolean, ordem: number | null, regra: 'pasta' | 'arquivo-solto' }} Ligacao
 */

/**
 * Liga um arquivo (caminho relativo à pasta de mídia) a um projeto.
 * Regra: (A/B) arquivo dentro de uma subpasta → a primeira pasta é o projeto;
 * (C) arquivo solto na raiz → o nome do arquivo (sem extensão e sem número final) é o projeto.
 * Nomes são comparados sem acento, sem maiúsculas, sem espaços/hífens e sem o "e"/"&"
 * com o slug e o título dos projetos que o site já tem. Prefixo numérico na pasta ("01-") define a ordem.
 * Devolve null para arquivos especiais soltos na raiz (hero, foto do Garrido, logo) e textos soltos.
 *
 * @param {string} caminhoRelativo
 * @param {ProjetoConhecido[]} conhecidos
 * @param {Record<string, string>} [apelidos] chave(nome) → slug, para casos que o Garrido quiser forçar
 * @returns {Ligacao | null}
 */
export function ligarAoProjeto(caminhoRelativo, conhecidos, apelidos = {}) {
  const partes = caminhoRelativo.split(/[\\/]/).filter(Boolean);
  let nomeOrigem;
  let regra;
  if (partes.length > 1) {
    nomeOrigem = partes[0];
    regra = /** @type {const} */ ('pasta');
  } else {
    const arquivo = partes[0] ?? '';
    if (candidatoEspecial(arquivo)) return null;
    if (classificarArquivo(arquivo) === 'texto') return null;
    // "hey maringa 2.mp4" → "hey maringa"; "barberaria.mp4" → "barberaria"
    nomeOrigem = semExtensao(arquivo)
      .replace(/[\s_\-.]*\(?\d+\)?$/, '')
      .trim();
    regra = /** @type {const} */ ('arquivo-solto');
  }
  const ordem = regra === 'pasta' ? prefixoNumerico(nomeOrigem) : null;
  const nomeBase = regra === 'pasta' ? semPrefixo(nomeOrigem) || nomeOrigem : nomeOrigem;
  const k = chave(nomeBase);
  if (!k) return null;

  const forcado = apelidos[k];
  const achado =
    conhecidos.find((p) => p.slug === forcado) ??
    conhecidos.find((p) => chave(p.slug) === k || (p.titulo !== undefined && chave(p.titulo) === k));
  if (achado) return { slug: achado.slug, pasta: nomeOrigem, nomeOrigem, existente: true, ordem, regra };
  return {
    slug: forcado ?? slugify(nomeBase),
    pasta: nomeOrigem,
    nomeOrigem,
    existente: false,
    ordem,
    regra,
  };
}

const colador = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

/** Comparação "natural": "2" antes de "10", sem diferenciar acento e maiúscula. */
export function compararNatural(a, b) {
  return colador.compare(a, b);
}

/**
 * Ordena mídias: primeiro pelo prefixo numérico do nome do arquivo (1, 2, 10…),
 * depois quem não tem número, em ordem alfabética natural. Empates: caminho natural.
 * @template {{ caminho: string }} T
 * @param {readonly T[]} itens
 * @returns {T[]}
 */
export function ordenarMidia(itens) {
  return [...itens].sort((a, b) => {
    const na = prefixoNumerico(nomeDoArquivo(a.caminho));
    const nb = prefixoNumerico(nomeDoArquivo(b.caminho));
    if (na !== null && nb !== null && na !== nb) return na - nb;
    if (na !== null && nb === null) return -1;
    if (na === null && nb !== null) return 1;
    return compararNatural(a.caminho, b.caminho);
  });
}

const PALAVRAS_PRINCIPAL = ['principal', 'main', 'destaque', 'capa'];

/**
 * Vídeo principal: o que tem "principal", "main", "destaque" ou "capa" no nome;
 * senão o de menor número de ordem; senão o primeiro (ordem natural).
 * @template {{ caminho: string }} T
 * @param {readonly T[]} videos
 * @returns {T | null}
 */
export function escolherPrincipal(videos) {
  if (!videos.length) return null;
  const marcado = videos.find((v) =>
    tokens(nomeDoArquivo(v.caminho)).some((t) => PALAVRAS_PRINCIPAL.includes(t)),
  );
  if (marcado) return marcado;
  return ordenarMidia(videos)[0] ?? null;
}

/** @typedef {'horizontal' | 'vertical' | 'quadrado'} Orientacao */

/**
 * Orientação pela proporção (até 5% de diferença conta como quadrado).
 * @returns {Orientacao}
 */
export function orientacao(largura, altura) {
  if (!(largura > 0) || !(altura > 0)) throw new Error(`dimensões inválidas: ${largura}x${altura}`);
  const r = largura / altura;
  if (Math.abs(r - 1) <= 0.05) return 'quadrado';
  return r > 1 ? 'horizontal' : 'vertical';
}

/** Rótulo de proporção para o inventário: "16:9", "9:16", "1:1" ou "w:h" aproximado. */
export function proporcao(largura, altura) {
  const r = largura / altura;
  const conhecidas = [
    ['16:9', 16 / 9],
    ['9:16', 9 / 16],
    ['1:1', 1],
    ['4:3', 4 / 3],
    ['3:4', 3 / 4],
    ['3:2', 3 / 2],
    ['2:3', 2 / 3],
    ['4:5', 4 / 5],
  ];
  for (const [nome, v] of conhecidas) if (Math.abs(r - Number(v)) / Number(v) < 0.02) return String(nome);
  return r.toFixed(2);
}

/** Número de ordem com dois dígitos: 1 → "01". */
export function doisDigitos(n) {
  return String(n).padStart(2, '0');
}

/**
 * Nome de arquivo do site para uma mídia: "<nn>-<nome>". O nome é o do arquivo, sem o prefixo
 * numérico, em slug; se sobrar vazio ("1.1.1.1.mp4"), usa o tipo ("video"/"foto").
 */
export function nomeNoSite(posicao, caminho, tipo) {
  const nome = slugify(semPrefixo(nomeDoArquivo(caminho))) || tipo;
  return `${doisDigitos(posicao)}-${nome}`;
}

/** Bytes legíveis: 1536 → "1,5 KB". */
export function bytesLegiveis(bytes) {
  const u = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: i ? 1 : 0 })} ${u[i]}`;
}

/** Duração legível: 62.9 → "1:03". */
export function duracaoLegivel(segundos) {
  const s = Math.round(segundos);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Nome problemático: acento, espaço, "(1)", "copia"/"cópia"/"copy", ponto duplo. */
export function problemasDoNome(nome) {
  const p = [];
  if (/[^ -~]/.test(nome)) p.push('acento'); // fora do ASCII visível
  if (/\s/.test(nome)) p.push('espaço');
  if (/\(\d+\)/.test(nome)) p.push('"(n)"');
  if (/c[oó]pia|copy/i.test(nome)) p.push('cópia');
  if (/\.\./.test(nome)) p.push('ponto duplo');
  return p;
}
