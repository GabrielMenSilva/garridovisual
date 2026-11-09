# Como editar o conteúdo do site

O conteúdo vem de dois lugares:

| Onde                                                         | O que tem                                                                       | Quem mexe                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Pasta **`videos e fotos`** (na raiz do projeto, fora do Git) | Os vídeos e fotos originais do Garrido                                          | O Garrido solta os arquivos; **nada é apagado ou renomeado lá** |
| `src/data/projects.ts`                                       | O **texto** dos projetos: título, funções, resumo, ordem, vídeo principal, link | À mão                                                           |
| `src/data/media.generated.ts`                                | A **mídia** já convertida, ligada a cada projeto pelo `slug`                    | Gerado por `pnpm media:import` (não edite)                      |
| `scripts/midia-ajustes.json`                                 | Ajustes por arquivo: mudar de projeto, girar vídeo deitado                      | À mão, raramente                                                |
| `src/data/contact.ts`                                        | Instagram, WhatsApp e e-mail (o e-mail está escondido)                          | À mão                                                           |
| `src/data/site.ts`                                           | Nome, função, vídeo do hero                                                     | À mão                                                           |

Tudo é conferido com **zod** no build: se faltar um vídeo, um poster ou uma foto em `public/`, ou se um ID de YouTube estiver errado, o `pnpm build` falha e diz o motivo. Depois de editar, rode:

```bash
pnpm test
```

```bash
pnpm build
```

No PowerShell, se o `pnpm` for bloqueado, use `pnpm.cmd`.

## Adicionar fotos e vídeos (o jeito normal)

1. Na pasta `videos e fotos`, crie **uma pasta por projeto** (ex.: `Clínica X/`) e solte os vídeos e fotos dentro. Pode ter subpastas (`fotos/`, `videos/`, `fotos vertical/`…). Um arquivo solto na raiz também vira projeto, com o nome do arquivo.
2. Rode:

```bash
pnpm media:import
```

O script converte só o que é novo ou mudou (vídeo em H.264 com som, até 1080p; fotos em AVIF/WebP; tudo **sem GPS nem dados do celular**), gera os posters e atualiza `src/data/media.generated.ts`. No fim ele mostra quanto ocupou e avisa se algo passou do limite. Opções:

```bash
pnpm media:import --dry-run
```

```bash
pnpm media:import --force
```

(`--dry-run` só mostra o que faria; `--force` reconverte tudo.)

3. Rode `pnpm build` e confira em `pnpm preview`.

Nomes que o script entende:

- **Pasta de projeto que já existe no site**: `Hey Maringá`, `hey_maringa`, `HEYMARINGA` → projeto `hey-maringa` (sem acento, sem maiúscula, sem espaço).
- **Ordem dos arquivos**: pelo número no começo do nome (`1.mp4`, `2.mp4`, `10.mp4`), depois o resto em ordem alfabética.
- **Vídeo principal**: o que tiver `principal`, `main`, `destaque` ou `capa` no nome; senão o de menor número; senão o primeiro.
- **Ordem dos projetos**: os do `projects.ts` primeiro; os novos no fim. Pasta com número na frente (`03-Clínica X`) vai para essa posição.
- **Texto do projeto novo**: um `.txt` dentro da pasta é lido assim: 1ª linha = título, resto = descrição; linhas `funcoes: Filmmaker, Editor` e `youtube: <ID>` também valem.

## Projeto novo: escrever o texto

Um projeto novo aparece no site com um **rascunho neutro** ("Vídeos e imagens do projeto X.") até ganhar texto. Para escrever, copie um bloco no fim de `textos` em `src/data/projects.ts`:

```ts
{
  slug: 'clinica-x',            // o mesmo que o import mostrou (nome da pasta em slug)
  titulo: 'Clínica X',
  funcoes: ['Filmmaker', 'Editor'], // [] esconde os chips
  resumo: 'Uma a três frases sobre o trabalho.',
},
```

A posição no array é a posição no slider.

## Trocar o vídeo principal

Em `src/data/projects.ts`, no projeto, use o nome do arquivo **no site** (aparece no fim do `pnpm media:import` e em `src/data/media.generated.ts`, campo `arquivo`):

```ts
videoPrincipal: '02-video.mp4',
```

`videoPrincipal: null` tira o vídeo (mostra "Vídeo em breve").

## Usar YouTube ou Vimeo no lugar do arquivo

Vídeos que passam de **24 MB** mesmo em 720p não entram no site (o limite comum de hospedagem estática é 25 MB por arquivo). O import avisa "PRECISA HOSPEDAR FORA" e o site mostra só o poster com "Vídeo em breve". Para ligar:

1. Suba o vídeo no YouTube (não listado) ou no Vimeo.
2. Em `src/data/projects.ts`, no projeto:

```ts
videoPrincipal: { tipo: 'youtube', id: 'dQw4w9WgXcQ' },
```

```ts
videoPrincipal: { tipo: 'vimeo', id: '123456789', hash: 'abcdef1234' },
```

(o ID do YouTube tem 11 caracteres: em `youtube.com/watch?v=dQw4w9WgXcQ` é `dQw4w9WgXcQ`; no Vimeo é o número da URL, e o `hash` vem depois da barra nos não listados.)

O YouTube carrega pelo domínio sem cookies (`youtube-nocookie.com`) e o Vimeo com `dnt=1`, e os dois só depois do clique no play.

## Vídeo no projeto errado ou deitado

Em `scripts/midia-ajustes.json`, pelo caminho do arquivo dentro de `videos e fotos`:

```json
"casamento/casamento.mp4": { "projeto": "juliana-e-marcio", "girar": 270 }
```

`girar` é em graus no sentido horário (90, 180 ou 270). Depois, `pnpm media:import`.

## Capa e ponto de foco

Sem `capa`, a capa é o poster do vídeo principal (ou a 1ª foto). As capas antigas usam `capa: 'hey-maringa-capa'` (veja `src/data/imagens.generated.ts`). Se a capa cortar mal no 16:9, ajuste `capaFoco` (CSS `object-position`, ex.: `'50% 30%'`).

## Texto alternativo das fotos

Por padrão as fotos novas ficam com "{Título} — foto {n}". Para descrever melhor, no projeto em `projects.ts` (a chave é o `arquivo` da foto em `media.generated.ts`):

```ts
altDasFotos: { '01-foto': 'Noivos no altar, de costas, diante do padre' },
```

## Trocar o vídeo do hero

Veja "Vídeo do hero" em `docs/site-garridovisual.md`.

## Mostrar o e-mail

Em `src/data/contact.ts`, troque `visible: false` por `visible: true`.
