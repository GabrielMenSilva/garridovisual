# Site GarridoVisual: relatório

Site institucional de uma página do **GarridoVisual** (Garrido: filmmaker, fotógrafo e editor em Maringá, PR). Está pronto e testado **localmente**. Não foi publicado, e não há domínio, hospedagem nem `remote` no Git.

- Branches: `feat/site-garridovisual` (Parte 1) e `feat/midia-garridovisual` (Parte 2, mídia do Garrido). Sem PR, sem merge, sem push.
- A pasta do projeto chegou **sem `.git`**: o repositório foi reiniciado localmente com um commit de base (`chore: baseline from part 1`) na `feat/site-garridovisual`, e a Parte 2 saiu dela.
- Stack: Vite 8 + React 19 + TypeScript 6 (strict) + Tailwind CSS 4, Embla Carousel, zod, Vitest, Playwright + axe
- Build 100% estático, com o HTML **pré-renderizado** (a página inteira já vem no `index.html`)

## Parte 2: vídeos e fotos do Garrido

### O que mudou

- **`pnpm media:import`** (`scripts/importar-midia.mjs`): lê a pasta `videos e fotos` (somente leitura, fora do Git) e gera vídeos H.264/AAC com `faststart`, posters AVIF/JPG e fotos AVIF/WebP, **sem metadados** (GPS, celular, data). Usa cache por SHA-256 (`.cache/media/index.json`), `--dry-run`, `--force`, metade dos núcleos em paralelo e limpa o que ficou sem origem. Rodar de novo sem mudanças: **50 pulados, 0 convertidos**.
- **`pnpm media:inventory`** gera `docs/inventario-midia.md` (árvore, ffprobe de cada vídeo, dimensões das fotos, duplicados, problemas).
- **Modelo de dados novo** (`src/data/schema.ts`, zod): `slug, titulo, funcoes, resumo, descricao?, capa, videoPrincipal, galeria, linkExterno?`. O texto continua escrito à mão em `src/data/projects.ts`; a mídia vem de `src/data/media.generated.ts`, ligada pelo `slug` (`src/data/montarProjetos.ts`). No build, `scripts/prerender.mjs` confere com zod que **todo** vídeo, poster e foto citado existe em `dist/` e falha se faltar algum.
- **Slider com N projetos**: contador, pontos, miniaturas e `aria-label` usam `projects.length`. A tira de miniaturas rola na horizontal e leva a ativa à vista; os pontos quebram linha no celular.
- **Vídeo vertical e quadrado**: moldura na proporção do arquivo (9:16 com no máximo 70svh no desktop e largura total no celular), com o poster desfocado e escurecido ao fundo (CSS, sem segundo vídeo). A altura sai de `aspect-ratio` + `cqw`, então nada pula no play.
- **Vídeo próprio**: fachada com poster e play; o `<video controls playsinline preload="metadata">` só monta no clique e toca **com som**. Trocar de slide ou abrir a galeria pausa. **Só um vídeo toca por vez** no site inteiro (`src/lib/umVideoPorVez.ts`).
- **Galeria**: grade em colunas (alvenaria) que respeita a proporção, miniaturas de vídeo com duração e play, vídeo tocando no visor, Anterior/Próximo, contador, imagens preguiçosas. Esc no visor volta à grade (e pausa); Esc na grade fecha e devolve o foco.
- Chips de função somem quando `funcoes` está vazia. "Vídeo em breve" só aparece em projeto sem vídeo.

### Regra de organização da pasta

A pasta mistura duas organizações; o import aceita as três previstas:

- **(A/B) uma subpasta por projeto**: `casamento/`, `fora de centro/`, `MG nataçao/`. A primeira pasta do caminho é o projeto; subpastas internas (`fotos horizontal/`, `fotos vertical/`) só organizam.
- **(C) arquivo solto na raiz**: `barberaria.mp4`, `pedido de casamento.mp4`. O nome do arquivo é o projeto.

Os nomes são comparados sem acento, maiúscula, espaço ou "e/&" com os projetos do site. Nenhum casou com os 6 antigos pelo nome. Detalhes em `docs/inventario-midia.md`.

### Projetos

| Projeto                                               | Origem                                                | Vídeo principal (escolhido)                      | Galeria                    | Texto        |
| ----------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ | -------------------------- | ------------ |
| Hey Maringá, El Piratas, Ody Park, MK5, Heitor Amatsu | —                                                     | — ("Vídeo em breve")                             | capa                       | Parte 1      |
| **Juliana & Márcio**                                  | `casamento/casamento.mp4` (ajuste manual, ver abaixo) | `01-casamento.mp4` (1280×720, 41 s)              | 1 vídeo + 8 fotos antigas  | Parte 1      |
| **Barbearia** (novo)                                  | `barberaria.mp4`                                      | `01-barberaria.mp4` (720×1280, 15 s)             | 1 vídeo                    | **rascunho** |
| **Casamento** (novo)                                  | `casamento/fotos …`                                   | — ("Vídeo em breve"; capa = 1ª foto)             | 41 fotos                   | **rascunho** |
| **Fora de Centro** (novo)                             | `fora de centro/`                                     | `01-edit-estilo.mp4` (1080×1920, 33 s)           | 2 vídeos                   | **rascunho** |
| **MG Natação** (novo)                                 | `MG nataçao/`                                         | `01-video.mp4` (= `1.1.1.1.mp4`, 1280×720, 58 s) | 4 vídeos (2 só com poster) | **rascunho** |
| **Pedido de Casamento** (novo)                        | `pedido de casamento.mp4`                             | `01-pedido-de-casamento.mp4` (1276×720, 40 s)    | 1 vídeo                    | **rascunho** |

O vídeo principal foi escolhido pela regra (nome com `principal/main/destaque/capa` → menor número → primeiro em ordem natural). O Garrido troca em `projects.ts` com `videoPrincipal: '02-video.mp4'`.

**Textos dos projetos novos**: rascunhos curtos e neutros, só com o que se vê nos arquivos, em termos genéricos ("Vídeo vertical gravado em uma barbearia.", "Vídeos de aulas de natação e de exercícios na água.", "Fotos de um casamento…", "Vídeo de um pedido de casamento ao ar livre, em um jardim.", "Vídeos verticais do projeto Fora de Centro."). `funcoes: []` em todos. Nenhum nome de cliente, ano, número ou função foi inventado. Cada um tem `TODO(garrido)`.

### Ajuste manual: o vídeo da pasta `casamento`

`casamento/casamento.mp4` **abre com o título "Juliana e Marcio"** e mostra o mesmo casal das fotos antigas do projeto Juliana & Márcio. As 41 fotos da mesma pasta são de **outro casal**. Além disso, o arquivo está **deitado do começo ao fim**: a imagem está girada 90° dentro de um quadro 720×1280.

Decisão registrada em `scripts/midia-ajustes.json`: o vídeo vai para **Juliana & Márcio**, girado 90° no sentido anti-horário (vira 1280×720 horizontal). As fotos formam o projeto novo **Casamento**. Para desfazer, basta apagar a entrada e rodar `pnpm media:import`. **O Garrido precisa confirmar.**

### Mídia: números e problemas

|                                        | Origem                         | No site                                |
| -------------------------------------- | ------------------------------ | -------------------------------------- |
| Vídeos                                 | 9 (1,3 GB; até 4K, 60 fps)     | 7 arquivos (86 MB) + 2 só com poster   |
| Fotos                                  | 41 JPG (397 MB, até 6000×4000) | 41 × 4 larguras × AVIF/WebP            |
| Total `public/media` + `public/images` |                                | **106 MB** (abaixo do aviso de 150 MB) |

- **Precisa hospedar fora (YouTube não listado ou Vimeo)**: `MG nataçao/3.3.mp4` (30,4 MB) e `MG nataçao/4..mp4` (27 MB) passam de 24 MB **mesmo em 720p**. Não entram no site: o manifesto já tem `tipo: 'youtube', id: 'TODO'` e a galeria mostra o poster com "Vídeo em breve". Ao subir, troque o ID (ver `docs/como-editar-conteudo.md`).
- `MG nataçao/01-video.mp4` ficou com 23,4 MB (720p): cabe no limite de 24 MB, mas é o maior arquivo do site.
- 4 vídeos 4K do MG e o `video 1.2` (2160×3840) foram reduzidos para 720p/1080p. Vídeos acima de 30 quadros/s (`edit estilo`, 60 fps) saem com **no máximo 30 fps**, para caber no tamanho.
- `MG nataçao/4..mp4` tem **591 MB** na origem (> 500 MB).
- Duplicados: **nenhum**. Corrompidos ou vazios: **nenhum**. Formatos fora do comum: **nenhum** (só `.mp4` e `.jpg`).
- Nomes com espaço, acento e ponto duplo (`4..mp4`, `MG nataçao`): a pasta não foi tocada; os nomes no site são limpos (`01-video.mp4`).
- Metadados: conferidos com ffprobe nos 7 vídeos gerados (só tags genéricas do contêiner: marca, handler e encoder; nenhuma data, GPS ou modelo de celular); as 370 imagens geradas não têm EXIF nem XMP (sharp sem `withMetadata()`). As 41 fotos originais não tinham GPS.
- `barberaria` parece ser "barbearia" com erro de digitação: o slug ficou `barberaria` (vem do arquivo) e o título, **Barbearia** (para confirmar).

### Resultados da Parte 2

| Verificação                     | Resultado                                                                                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm type-check` / `pnpm lint` | sem erros                                                                                                                                                                                                 |
| `pnpm test` (Vitest)            | **127/127** (inclui 55 das funções do import: `slugify`, `classificarArquivo`, `ligarAoProjeto`, `ordenarMidia`, `escolherPrincipal`, `orientacao`; zod com arquivos; `montarProjetos`; um vídeo por vez) |
| `pnpm build`                    | ok; zod confere 11 projetos e todos os arquivos em `dist/`                                                                                                                                                |
| `pnpm test:e2e`                 | **188/188**: 94 Chromium + 94 WebKit, em 1440×900 e 390×844, sem `retries` e sem `skip`                                                                                                                   |
| Lighthouse móvel (mediana de 5) | **99 / 100 / 100 / 100**; LCP **2,1 s**; CLS **0**; TBT 1 ms; FCP 1,5 s; peso 833 KB                                                                                                                      |
| JS inicial                      | **120 KB gzip** (era 110 KB; o manifesto da mídia entrou no bundle)                                                                                                                                       |
| `dist/`                         | **109 MB**, 530 arquivos                                                                                                                                                                                  |

Os 10 maiores arquivos de `dist/`: `mg-natacao/01-video.mp4` 23,4 MB · `fora-de-centro/01-edit-estilo.mp4` 16,7 MB · `fora-de-centro/02-video-1-2.mp4` 15,2 MB · `pedido-de-casamento/01-pedido-de-casamento.mp4` 12,1 MB · `mg-natacao/02-video.mp4` 9,5 MB · `juliana-e-marcio/01-casamento.mp4` 5,4 MB · `barberaria/01-barberaria.mp4` 3,9 MB · `hero-placeholder.mp4` 0,6 MB · `assets/index-*.js` 0,4 MB · `images/projetos/casamento/10-foto-1600.webp` 0,3 MB. Nenhum passa de 24 MB.

Sobre os testes de vídeo:

- **Codec**: o Chromium e o WebKit do Playwright 1.64 **decodificam H.264/AAC** (conferido antes de escrever os testes). Por isso a reprodução é testada de verdade nos dois motores (`paused === false` e `currentTime > 0`), sem fixture WebM.
- O WebKit do Playwright no Windows informa em `videoWidth`/`videoHeight` o **tamanho exibido** (354×630 para um arquivo 720×1280). O teste "sem esticar" confere a **proporção** do quadro decodificado (±1%) e `object-fit: contain`. As dimensões exatas do arquivo são conferidas pelo manifesto e pelo zod. Na primeira rodada, a versão antiga desse teste (que comparava pixels) falhou só no WebKit desktop. Depois da troca, a suíte inteira passou: 188/188.
- O teste do slider lê `projects.length` do dado (`src/data/projects.ts` exporta `projetos` sem `import.meta.env`; o modo e2e com YouTube fictício ficou em `src/data/projetosDoSite.ts`).
- O axe pegou a miniatura de vídeo da galeria: a duração visível não estava no nome acessível (WCAG 2.5.3). Agora o rótulo é "Abrir vídeo: Casamento, duração 0:41".

### Hero, Sobre e logo

Não há na pasta nenhum candidato a vídeo do hero (`hero`, `home`, `showreel`, `intro`, `capa`), foto do Garrido (`garrido`, `sobre`, `retrato`, `perfil`, `eu`), logo nem texto de história. Por isso o **vídeo provisório do hero, o bloco "GV" do Sobre e a história em rascunho continuam**. A descrição do site e o JSON-LD não mudaram: nenhum fato novo foi confirmado.

## Como rodar

```bash
pnpm install
```

```bash
pnpm dev
```

Para ver o build de produção:

```bash
pnpm build
```

```bash
pnpm preview
```

Abre em `http://localhost:4173`. No PowerShell, se o `pnpm` for bloqueado, use `pnpm.cmd`.

| Script                                          | O que faz                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| `pnpm dev`                                      | Servidor de desenvolvimento                                      |
| `pnpm build`                                    | Type-check, build, pré-renderização (`dist/`)                    |
| `pnpm preview`                                  | Serve o `dist/` na porta 4173                                    |
| `pnpm type-check` / `pnpm lint` / `pnpm format` | TypeScript, ESLint, Prettier                                     |
| `pnpm test`                                     | Testes unitários (Vitest)                                        |
| `pnpm test:e2e`                                 | Builds + Playwright (Chromium e depois WebKit)                   |
| `pnpm lighthouse`                               | Lighthouse móvel no que está servido (rode `pnpm preview` antes) |
| `pnpm assets:download` / `pnpm assets:optimize` | Baixa as imagens do site antigo / gera AVIF e WebP               |

## O que foi construído

1. **Barra de navegação** fixa: marca + "GarridoVisual", links Home/Projetos/Sobre/Contato com seção ativa (`aria-current`), botão "Fale comigo" (WhatsApp). Fica transparente sobre o hero e ganha fundo escuro com desfoque depois de 40 px de rolagem. No celular há um menu em tela cheia (`<dialog>`) com foco preso, que fecha com Esc e devolve o foco ao botão. Link "Pular para o conteúdo".
2. **Home**: seção de 280svh com palco _sticky_; o **scroll controla o tempo do vídeo** (`useScrollVideo`). Marca grande, título, função e "Ver projetos", com parallax leve e indicador "role para explorar".
3. **Projetos**: slider com os projetos (11 desde a Parte 2; botões, pontos, miniaturas, arrastar, setas do teclado, contador "2 de 11" anunciado). Cada slide tem player com fachada e "Ver galeria" (`<dialog>` com grade e imagem ampliada).
4. **Sobre**: bloco "GV" no lugar da foto, rascunho da história e lista de serviços.
5. **Contato**: cartões de Instagram e WhatsApp (mensagem pré-preenchida). Sem formulário.
6. **Footer**: "© {ano} GarridoVisual. Todos os direitos reservados." (ano do relógio de quem visita).

## Resultados

### Testes

| Suíte                        | Resultado                                                   |
| ---------------------------- | ----------------------------------------------------------- |
| `pnpm type-check`            | sem erros                                                   |
| `pnpm lint`                  | sem erros                                                   |
| `pnpm test` (Vitest)         | **49/49**                                                   |
| `pnpm test:e2e` (Playwright) | **144/144**: 72 Chromium + 72 WebKit, em 1440×900 e 390×844 |

A suíte e2e rodou completa várias vezes seguidas com 144/144. Ela cobre:

- navegação, hash, `#contato` na URL e menu mobile;
- vídeo do hero andando com o scroll (0 → 50% → 100%), modo de movimento reduzido e página sem JavaScript;
- slider, galeria (8 fotos do casamento) e player;
- links de contato (só o `href`; os testes bloqueiam qualquer requisição externa);
- **axe** sem violações, inclusive com menu e galeria abertos;
- console sem erros, sem rolagem horizontal em 360 px e nenhuma requisição para domínio externo.

### Lighthouse (móvel, `pnpm preview`, mediana de 5 rodadas)

| Performance | Acessibilidade | Boas práticas | SEO     |
| ----------- | -------------- | ------------- | ------- |
| **99**      | **100**        | **100**       | **100** |

| LCP       | CLS   | TBT      | FCP   | JS inicial (gzip) | Peso total |
| --------- | ----- | -------- | ----- | ----------------- | ---------- |
| **2,1 s** | **0** | **0 ms** | 1,5 s | **110 KB**        | ~821 KB*   |

\* O peso inclui o vídeo de teste do hero (633 KB). Em algumas rodadas o Lighthouse encerra antes de o vídeo terminar de baixar e mostra 192–256 KB; o número real é ~821 KB. Com o vídeo de verdade (meta ≤ 8 MB), o peso total vai subir.

Todas as metas foram atingidas (≥ 90 / 100 / ≥ 95 / 100; LCP < 2,5 s; CLS < 0,05; JS ≤ 150 KB).

### Contraste das cores (WCAG; mínimo 4,5:1 para texto)

| Texto                      | Fundo     | Contraste                        |
| -------------------------- | --------- | -------------------------------- |
| texto `#F5F0E6`            | `#0E0E0E` | 17,0:1                           |
| texto                      | `#171717` | 15,8:1                           |
| texto secundário `#B5AFA3` | `#171717` | 8,2:1                            |
| dourado `#D5A75A`          | `#171717` | 8,1:1                            |
| dourado claro `#E6C27F`    | `#171717` | 10,6:1                           |
| `--on-gold` `#171717`      | dourado   | 8,1:1                            |
| dourado escuro `#A8803A`   | `#171717` | 5,0:1 (só texto grande e ícones) |

O teste `src/lib/theme.test.ts` recalcula esses valores e falha se algum cair abaixo do mínimo.

## Decisões e motivos

- **Logo.** Na Parte 1 a logo não tinha chegado e o site usou uma marca provisória. Depois da Parte 2 o Gabriel enviou a logo (losango com o "G" em espiral e o "V"), guardada em `assets-originais/logo-garridovisual-enviada.jpg` (fora do Git). Ela foi **redesenhada em vetor com as medidas exatas** (faixas de 77 e vãos de 40 num quadrado de 545 girado 45°, 95,6% de sobreposição com a imagem) em `scripts/gerar-marca.mjs`, que gera `src/assets/logo-mark.svg` (`fill="currentColor"`), favicons, ícones e `og-image.jpg`. As cores são as do site: dourado `#D5A75A` (na imagem enviada, `#D1A65D`, diferença do JPEG) sobre grafite `#171717`.
- **HTML pré-renderizado** (`src/entry-server.tsx` + `scripts/prerender.mjs`). Sem isso, o título só aparecia depois de o JavaScript rodar (LCP de 2,7 s). Com isso, a página inteira funciona sem JavaScript e o `<noscript>` deixou de ser necessário.
- **`content-visibility: auto`** em Projetos, Sobre e Contato. O navegador não renderiza essas seções até chegarem perto da tela. Na emulação móvel do Chrome, a capa do slide 1 (2,8 telas abaixo) entrava como LCP; isso derrubava o LCP para 3,3 s, e o ajuste resolveu.
- **Correção da posição ao rolar por âncora** (`settleOnSection`). Com alturas estimadas e sem "scroll anchoring" no Safari, o destino podia se deslocar. O site confere a posição ao fim da rolagem e corrige.
- **Capa do slide 1 com `loading="lazy"`**, diferente do pedido ("lazy exceto o slide inicial"). Aqui o slide inicial fica bem abaixo da dobra por causa do hero de 280svh; carregá-lo cedo só disputava banda com o poster do hero.
- **Vídeo de teste no hero** (`public/media/hero-placeholder.mp4`, 10 s, gradiente escuro/dourado, todos os quadros-chave), gerado com `ffmpeg-static` (devDependency), porque o `ffmpeg` não estava instalado. Ele **continua no site** porque o hero e os testes dependem de um vídeo; troque pelo real.
- **TypeScript 6 em vez de 7**: o `typescript-eslint` ainda não suporta o TS 7.
- **Build de testes com vídeos fictícios** (`pnpm build:e2e`, `--mode e2e`): liga IDs falsos do YouTube nos dois primeiros projetos para testar o player. Em produção esse trecho é removido do bundle.
- **e2e: Chromium e WebKit em sequência**, com 3 e 2 workers e limites de 10 s por asserção e 60 s por teste. Rodando os dois motores juntos, o WebKit para Windows atrasava animações e o IntersectionObserver por falta de CPU. Os mesmos testes passavam 100% isolados.
- **Nome acessível dos cartões de contato**: o nome começa pelo texto visível (WCAG 2.5.3, "label in name"), por exemplo "Instagram @garridovisual (Abrir Instagram do GarridoVisual, abre em nova aba)". Rótulos que só diziam "Chamar no WhatsApp" eram reprovados pelo axe.
- **Títulos com Syne 800 menores no celular** (`clamp(1.75rem, 8vw, 7rem)`): a fonte é muito larga e o "GarridoVisual" passava da tela em 360 px.
- **Sem formulário, cookies, analytics nem fontes externas.** YouTube só via `youtube-nocookie.com` e Vimeo com `dnt=1`, e os dois só carregam depois do clique.

## Estrutura

```
src/
  main.tsx, App.tsx, entry-server.tsx
  data/        projects.ts (zod), contact.ts, site.ts, imagens.generated.ts
  lib/         scroll.ts, media.ts, whatsapp.ts, nav.ts, theme.ts
  hooks/       useScrollVideo, useActiveSection, usePrefersReducedMotion, useReveal,
               useScrollLock, useScrolled, useFocusTrap, useCurrentYear
  components/  Header, MobileMenu, SkipLink, Logo, Hero, Projects, ProjectSlide,
               VideoPlayer, GalleryDialog, Picture, About, Contact, Footer, …
  styles/      tokens.css, global.css
public/        images/ (AVIF/WebP), media/, favicons, og-image.jpg, manifest
scripts/       baixar-imagens, varrer-site, otimizar-imagens, gerar-marca,
               preparar-video-hero, prerender, lighthouse
e2e/           specs do Playwright
docs/          este relatório, como-editar-conteudo, cabecalhos-seguranca, assets, videos-site-antigo
assets-originais/  imagens originais (fora do Git; só manifest.json e varredura.json versionados)
```

## Vídeo do hero

O vídeo precisa ser "scrubável": **todos os quadros como quadro-chave**, sem áudio, com `faststart`. Sem isso, o scroll trava. Para converter o vídeo do Garrido:

```bash
node scripts/preparar-video-hero.mjs "C:\caminho\do\video.mp4" --webm
```

Isso gera `public/media/hero.mp4` (H.264, até 1920 px, `-g 1`, sem áudio, `+faststart`) e `hero.webm` (VP9, opcional). Usa o `ffmpeg` do sistema ou o `ffmpeg-static` do projeto. A meta é ≤ 8 MB para ~10 s; o script avisa se passar. Depois, em `src/data/site.ts`, troque `mp4: '/media/hero-placeholder.mp4'` por `'/media/hero.mp4'` e `isPlaceholder` para `false`, e apague o `hero-placeholder.mp4`.

Para editar projetos, vídeos e fotos, veja `docs/como-editar-conteudo.md`.

## Imagens

- **15 de 15** imagens previstas baixadas em resolução original, sem falhas.
- A varredura com Playwright (`scripts/varrer-site.mjs`) achou mais **18 quadros de capa de vídeo** (4 por projeto, 1 no casamento, 1 no Heitor), baixados em `assets-originais/*-poster.jpg`. Eles ainda não aparecem no site e servem de poster quando os vídeos forem ligados. Um ícone 30×30 em branco do Wix foi descartado.
- Lista completa com origem e uso: `docs/assets.md`.
- Atenção: algumas capas do Wix são pequenas (Hey Maringá 722 px, Ody Park 728 px, El Piratas 939 px) e podem ficar um pouco moles em telas grandes. A capa do Hey Maringá é **vertical**, então usei `coverFocus` para o enquadramento 16:9.

## Vídeos encontrados no site antigo

O site antigo tem **18 vídeos** hospedados no Wix (4 por projeto em Hey Maringá, El Piratas, Ody Park e MK5; 1 no casamento; 1 no Heitor Amatsu). Eles **não foram baixados**; as URLs estão em `docs/videos-site-antigo.md`. O Gabriel decide onde hospedar (YouTube/Vimeo ou arquivo próprio).

## Diferenças entre o site antigo e o texto combinado

Usei os fatos da seção 2 do pedido e conferi com o texto do Wix:

- "Héy Maringá" e "Heitro Amatsu" no Wix são erros de digitação; usei **Hey Maringá** e **Heitor Amatsu**.
- A MK5 aparece como "MK5." com a função "Edição de Vídeo"; usei **MK5 Arquitetos** com **Editor, Motion design**, como pedido.
- O casamento aparece como "Fotografo" (sem acento); usei **Fotógrafo**.
- O texto do Hey Maringá no Wix diz "uma das maiores páginas"; mantive o fato verificável ("mais de 200 mil seguidores") e tirei o "uma das maiores".

## Pendências do Garrido / Gabriel

1. **Logo**: ✅ entregue e aplicada (veja "Decisões"). Se houver o arquivo original em vetor (SVG/AI/PDF), vale conferir as proporções com ele; para regerar tudo: `node scripts/gerar-marca.mjs`.
2. **Vídeo do hero** (o atual é de teste; a pasta `videos e fotos` não tem candidato). Pode ser um arquivo com `hero` ou `showreel` no nome, horizontal.
3. **Vídeo principal de Hey Maringá, El Piratas, Ody Park, MK5, Heitor Amatsu e do projeto Casamento** (pasta com o nome do projeto em `videos e fotos`, YouTube ou Vimeo). Hoje mostram "Vídeo em breve".
4. **Foto do Garrido** (retrato, de preferência vertical). Hoje aparece o bloco "GV".
5. **História do Garrido**: o texto do "Sobre" é um rascunho só com fatos conhecidos (`// TODO(garrido)` em `src/components/About.tsx`).
6. **Fotos e vídeos extras** para as galerias dos projetos antigos.
7. **E-mail**: `garridovisual@hotmail.com` está em `src/data/contact.ts` com `visible: false`. Basta ligar, se ele quiser.
8. **Domínio e hospedagem**: a URL canônica é provisória (`https://garridovisual.invalid`). Defina `VITE_SITE_URL` no build quando houver domínio. Os cabeçalhos recomendados estão em `docs/cabecalhos-seguranca.md`.

9. **Parte 2: confirmar o vídeo `casamento.mp4`** como sendo da Juliana & Márcio e o giro aplicado (`scripts/midia-ajustes.json`).
10. **Parte 2: textos dos 5 projetos novos** (Barbearia, Casamento, Fora de Centro, MG Natação, Pedido de Casamento): título certo, 1 a 3 frases e as **funções** do Garrido em cada um. Hoje são rascunhos neutros sem funções.
11. **Parte 2: subir no YouTube (não listado) ou Vimeo** os vídeos `MG nataçao/3.3.mp4` e `MG nataçao/4..mp4` e pôr os IDs em `projects.ts`.
12. **Parte 2: textos alternativos melhores** para as 41 fotos do Casamento (hoje "Casamento — foto n"), com `altDasFotos`.
13. **Parte 2: nome do casal** do projeto Casamento, se ele quiser mostrar.

Os `TODO(garrido)` no código marcam cada um desses pontos.

## Observações do ambiente

- A pasta está no **OneDrive**: vale excluir `node_modules/` da sincronização (é pesada e muda muito).
- `.claude/` (skills do Claude Code, ~50 MB) está no `.gitignore`.
- Ferramentas instaladas nesta sessão: Node.js 26 LTS (winget), pnpm 12, navegadores do Playwright (Chromium e WebKit) e o binário do `ffmpeg-static`.
