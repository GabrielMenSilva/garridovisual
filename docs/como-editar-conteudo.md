# Como editar o conteúdo do site

Quase tudo o que aparece no site vem de três arquivos em `src/data/`:

| Arquivo | O que tem |
|---|---|
| `src/data/projects.ts` | Os projetos (ordem, texto, funções, capa, vídeo, galeria) |
| `src/data/contact.ts` | Instagram, WhatsApp e e-mail (o e-mail está escondido) |
| `src/data/site.ts` | Nome, função, vídeo do hero |

Os dados dos projetos são conferidos com **zod** quando o site é montado. Se algo estiver errado (ID de vídeo inválido, imagem que não existe), o `pnpm build` falha e diz o motivo. Depois de editar, rode:

```bash
pnpm test
```

```bash
pnpm build
```

## Pôr o vídeo principal de um projeto

Em `src/data/projects.ts`, troque o `video: null` do projeto por uma das formas abaixo.

**YouTube** (o ID tem 11 caracteres; em `https://www.youtube.com/watch?v=dQw4w9WgXcQ` é `dQw4w9WgXcQ`):

```ts
video: { type: 'youtube', id: 'dQw4w9WgXcQ' },
```

**Vimeo** (o número da URL; em vídeo não listado, o `hash` que vem depois da barra):

```ts
video: { type: 'vimeo', id: '123456789' },
// não listado: https://vimeo.com/123456789/abcdef1234
video: { type: 'vimeo', id: '123456789', hash: 'abcdef1234' },
```

**Arquivo próprio** (`.mp4` ou `.webm` em `public/media/`):

```ts
video: { type: 'file', src: '/media/hey-maringa.mp4' },
```

O YouTube sempre carrega pelo domínio sem cookies (`youtube-nocookie.com`) e o Vimeo com `dnt=1`. Os dois só carregam **depois que a pessoa clica** no play. Sem vídeo, o slide mostra a capa com o selo "Vídeo em breve".

## Pôr fotos e vídeos na galeria de um projeto

1. Copie as fotos originais para `assets-originais/` (ex.: `ody-park-galeria-01.jpg`).
2. Acrescente o nome do arquivo na lista `USADAS` de `scripts/otimizar-imagens.mjs`.
3. Rode `pnpm assets:optimize` (gera AVIF/WebP em `public/images/` e atualiza `src/data/imagens.generated.ts`).
4. Em `src/data/projects.ts`, preencha a `gallery` do projeto:

```ts
gallery: [
  { kind: 'image', image: 'ody-park-galeria-01', alt: 'Ody Park, foto 1 de 3' },
  { kind: 'video', video: { type: 'youtube', id: 'dQw4w9WgXcQ' }, title: 'Campanha de verão' },
],
```

O `alt` descreve a imagem para quem usa leitor de tela. Sem `gallery`, o botão "Ver galeria" mostra a capa e o vídeo principal.

## Adicionar um projeto novo

Copie um bloco de projeto em `rawProjects` (em `src/data/projects.ts`) e troque os campos. A ordem do array é a ordem do slider. O teste `src/data/projects.test.ts` espera 6 projetos numa ordem fixa: ao adicionar ou reordenar, atualize a lista do teste também.

## Trocar a capa ou o ponto de foco

`cover` é o nome do arquivo sem extensão (veja `src/data/imagens.generated.ts`). Se a capa for vertical e cortar mal no 16:9, ajuste `coverFocus` (CSS `object-position`, ex.: `'50% 30%'` sobe o enquadramento).

## Trocar o vídeo do hero

Veja "Vídeo do hero" em `docs/site-garridovisual.md`.

## Mostrar o e-mail

Em `src/data/contact.ts`, troque `visible: false` por `visible: true`.
