# Site GarridoVisual: relatório

Site institucional de uma página do **GarridoVisual** (Garrido: filmmaker, fotógrafo e editor em Maringá, PR). Está pronto e testado **localmente**. Não foi publicado, e não há domínio, hospedagem nem `remote` no Git.

- Branch: `feat/site-garridovisual` (sem PR, sem merge, sem push)
- Stack: Vite 8 + React 19 + TypeScript 6 (strict) + Tailwind CSS 4, Embla Carousel, zod, Vitest, Playwright + axe
- Build 100% estático, com o HTML **pré-renderizado** (a página inteira já vem no `index.html`)

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

| Script | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Type-check, build, pré-renderização (`dist/`) |
| `pnpm preview` | Serve o `dist/` na porta 4173 |
| `pnpm type-check` / `pnpm lint` / `pnpm format` | TypeScript, ESLint, Prettier |
| `pnpm test` | Testes unitários (Vitest) |
| `pnpm test:e2e` | Builds + Playwright (Chromium e depois WebKit) |
| `pnpm lighthouse` | Lighthouse móvel no que está servido (rode `pnpm preview` antes) |
| `pnpm assets:download` / `pnpm assets:optimize` | Baixa as imagens do site antigo / gera AVIF e WebP |

## O que foi construído

1. **Barra de navegação** fixa: marca + "GarridoVisual", links Home/Projetos/Sobre/Contato com seção ativa (`aria-current`), botão "Fale comigo" (WhatsApp). Fica transparente sobre o hero e ganha fundo escuro com desfoque depois de 40 px de rolagem. No celular há um menu em tela cheia (`<dialog>`) com foco preso, que fecha com Esc e devolve o foco ao botão. Link "Pular para o conteúdo".
2. **Home**: seção de 280svh com palco *sticky*; o **scroll controla o tempo do vídeo** (`useScrollVideo`). Marca grande, título, função e "Ver projetos", com parallax leve e indicador "role para explorar".
3. **Projetos**: slider com os 6 projetos (botões, pontos, miniaturas, arrastar, setas do teclado, contador "2 de 6" anunciado). Cada slide tem player com fachada e "Ver galeria" (`<dialog>` com grade e imagem ampliada).
4. **Sobre**: bloco "GV" no lugar da foto, rascunho da história e lista de serviços.
5. **Contato**: cartões de Instagram e WhatsApp (mensagem pré-preenchida). Sem formulário.
6. **Footer**: "© {ano} GarridoVisual. Todos os direitos reservados." (ano do relógio de quem visita).

## Resultados

### Testes

| Suíte | Resultado |
|---|---|
| `pnpm type-check` | sem erros |
| `pnpm lint` | sem erros |
| `pnpm test` (Vitest) | **49/49** |
| `pnpm test:e2e` (Playwright) | **144/144**: 72 Chromium + 72 WebKit, em 1440×900 e 390×844 |

A suíte e2e rodou completa várias vezes seguidas com 144/144. Ela cobre:
- navegação, hash, `#contato` na URL e menu mobile;
- vídeo do hero andando com o scroll (0 → 50% → 100%), modo de movimento reduzido e página sem JavaScript;
- slider, galeria (8 fotos do casamento) e player;
- links de contato (só o `href`; os testes bloqueiam qualquer requisição externa);
- **axe** sem violações, inclusive com menu e galeria abertos;
- console sem erros, sem rolagem horizontal em 360 px e nenhuma requisição para domínio externo.

### Lighthouse (móvel, `pnpm preview`, mediana de 5 rodadas)

| Performance | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|
| **99** | **100** | **100** | **100** |

| LCP | CLS | TBT | FCP | JS inicial (gzip) | Peso total |
|---|---|---|---|---|---|
| **2,1 s** | **0** | **0 ms** | 1,5 s | **110 KB** | ~821 KB* |

\* O peso inclui o vídeo de teste do hero (633 KB). Em algumas rodadas o Lighthouse encerra antes de o vídeo terminar de baixar e mostra 192–256 KB; o número real é ~821 KB. Com o vídeo de verdade (meta ≤ 8 MB), o peso total vai subir.

Todas as metas foram atingidas (≥ 90 / 100 / ≥ 95 / 100; LCP < 2,5 s; CLS < 0,05; JS ≤ 150 KB).

### Contraste das cores (WCAG; mínimo 4,5:1 para texto)

| Texto | Fundo | Contraste |
|---|---|---|
| texto `#F5F0E6` | `#0E0E0E` | 17,0:1 |
| texto | `#171717` | 15,8:1 |
| texto secundário `#B5AFA3` | `#171717` | 8,2:1 |
| dourado `#D5A75A` | `#171717` | 8,1:1 |
| dourado claro `#E6C27F` | `#171717` | 10,6:1 |
| `--on-gold` `#171717` | dourado | 8,1:1 |
| dourado escuro `#A8803A` | `#171717` | 5,0:1 (só texto grande e ícones) |

O teste `src/lib/theme.test.ts` recalcula esses valores e falha se algum cair abaixo do mínimo.

## Decisões e motivos

- **Logo provisória.** O arquivo `logo-garridovisual-recorte.png` não veio junto e não estava em Desktop nem Downloads. Desenhei um **losango em espiral provisório**, no dourado `#D5A75A`, em `src/assets/logo-mark.svg` (`fill`/`stroke` = `currentColor`), e gerei dele favicons, ícones e `og-image.jpg`. Para trocar, veja "Pendências".
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

1. **Logo original** (SVG ou PNG grande). Quando chegar, vetorize em `src/assets/logo-mark.svg` com `fill="currentColor"` e rode `node scripts/gerar-marca.mjs --sem-marca` para regerar favicons, ícones e a og-image. Hoje a marca é **provisória**.
2. **Vídeo do hero** (o atual é de teste).
3. **Vídeo principal dos 6 projetos** (YouTube, Vimeo ou arquivo). Hoje todos mostram "Vídeo em breve".
4. **Foto do Garrido** (retrato, de preferência vertical). Hoje aparece o bloco "GV".
5. **História do Garrido**: o texto do "Sobre" é um rascunho só com fatos conhecidos (`// TODO(garrido)` em `src/components/About.tsx`).
6. **Fotos e vídeos extras** para as galerias (hoje só o casamento tem galeria própria).
7. **E-mail**: `garridovisual@hotmail.com` está em `src/data/contact.ts` com `visible: false`. Basta ligar, se ele quiser.
8. **Domínio e hospedagem**: a URL canônica é provisória (`https://garridovisual.invalid`). Defina `VITE_SITE_URL` no build quando houver domínio. Os cabeçalhos recomendados estão em `docs/cabecalhos-seguranca.md`.

Os `TODO(garrido)` no código marcam cada um desses pontos.

## Observações do ambiente

- A pasta está no **OneDrive**: vale excluir `node_modules/` da sincronização (é pesada e muda muito).
- `.claude/` (skills do Claude Code, ~50 MB) está no `.gitignore`.
- Ferramentas instaladas nesta sessão: Node.js 26 LTS (winget), pnpm 12, navegadores do Playwright (Chromium e WebKit) e o binário do `ffmpeg-static`.
