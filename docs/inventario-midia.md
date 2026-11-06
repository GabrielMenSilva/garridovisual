# Inventário da mídia (`videos e fotos`)

Gerado por `pnpm media:inventory` (`scripts/inventariar-midia.mjs`). A pasta é **somente leitura**: nada nela é renomeado, movido ou apagado, e ela não vai para o Git.

## Resumo

| | Arquivos | Tamanho |
|---|---:|---:|
| Vídeos | 9 | 1,3 GB |
| Fotos | 41 | 396,6 MB |
| Textos | 0 | 0 B |
| Ignorados | 0 | 0 B |
| **Total** | **50** | **1,7 GB** (1842961424 bytes) |

## Árvore

```
videos e fotos/
│  barberaria.mp4, pedido de casamento.mp4
├─ casamento/
  │  casamento.mp4
  ├─ fotos horizontal/
    │  18 arquivos: 1.jpg, 2.jpg, 3.jpg, 14.jpg, 16.jpg, 17.jpg, 19.jpg, 23.jpg, 24.jpg, 27.jpg, 29.jpg, 30.jpg, 31.jpg, 32.jpg, 33.jpg, 37.jpg, 39.jpg, 40.jpg
  ├─ fotos vertical/
    │  23 arquivos: 2.jpg, 4.jpg, 5.jpg, 6.jpg, 7.jpg, 8.jpg, 10.jpg, 11.jpg, 12.jpg, 15.jpg, 18.jpg, 19.jpg, 21.jpg, 22.jpg, 25.jpg, 30.jpg, 31.jpg, 33.jpg, 34.jpg, 35.jpg, 36.jpg, 38.jpg, 40.jpg
├─ fora de centro/
  │  edit estilo.mp4, video 1.2.mp4
├─ MG nataçao/
  │  1.1.1.1.mp4, 2.mp4, 3.3.mp4, 4..mp4
```

## Como cada arquivo foi ligado a um projeto

A pasta mistura dois jeitos de organizar, e o script aceita os três previstos:

- **(A) uma subpasta por projeto** (`casamento/`, `fora de centro/`, `MG nataçao/`): a **primeira pasta** do caminho é o projeto; subpastas internas (`fotos horizontal/`, `fotos vertical/`, ou `videos/` e `fotos/` no caso B) só organizam.
- **(B) subpasta por projeto com `videos/` e `fotos/` dentro**: mesma regra do A.
- **(C) arquivo solto na raiz** (`barberaria.mp4`, `pedido de casamento.mp4`): o **nome do arquivo** (sem extensão e sem número final, ex.: `hey maringa 2.mp4` → `hey maringa`) é o projeto.

O nome é comparado **sem acento, sem maiúsculas, sem espaços/hífens e sem o "e"/"&"** com o slug e o título dos projetos que o site já tem (`Hey Maringá`, `hey_maringa`, `HEYMARINGA` → `hey-maringa`). O que não casa vira **projeto novo**. Prefixo numérico na pasta (`01-`) define a ordem do projeto no site. Arquivos soltos com `hero`, `home`, `showreel`, `intro`, `capa`, `garrido`, `sobre`, `retrato`, `perfil`, `eu`, `logo` (ou `.svg`) no nome são tratados como candidatos especiais, não como projeto.

### Projetos existentes com mídia nova

_Nenhum._ Nenhuma pasta ou arquivo casou com os 6 projetos do site (`hey-maringa`, `el-piratas`, `ody-park`, `juliana-e-marcio`, `mk5`, `heitor-amatsu`). Eles continuam como estão.

### Projetos novos

| Slug | Título sugerido | Origem | Regra | Vídeos | Fotos | Textos | Vídeo principal (sugestão) |
|---|---|---|---|---:|---:|---:|---|
| `barberaria` | Barberaria | `barberaria` | C (arquivo solto) | 1 | 0 | 0 | `barberaria.mp4` |
| `casamento` | Casamento | `casamento` | A (pasta) | 1 | 41 | 0 | `casamento.mp4` |
| `fora-de-centro` | Fora de Centro | `fora de centro` | A (pasta) | 2 | 0 | 0 | `edit estilo.mp4` |
| `mg-natacao` | MG Natação | `MG nataçao` | A (pasta) | 4 | 0 | 0 | `1.1.1.1.mp4` |
| `pedido-de-casamento` | Pedido de Casamento | `pedido de casamento` | C (arquivo solto) | 1 | 0 | 0 | `pedido de casamento.mp4` |

## Candidatos especiais

- **Hero** (`hero`, `home`, `showreel`, `intro`, `capa`): nenhum
- **Foto do Garrido** (`garrido`, `sobre`, `retrato`, `perfil`, `eu`): nenhum
- **Logo** (`logo`, `.svg`): nenhum
- **Textos** (`.txt`, `.md`, `.docx`): nenhum

## Problemas encontrados

- **Duplicados (mesmo SHA-256):** nenhum
- **Vazios ou corrompidos:** nenhum
- **Formatos fora do comum:** nenhum (só `.mp4` e `.jpg`)
- **Maiores que 500 MB:** `MG nataçao/4..mp4` (590,6 MB)
- **Nomes de arquivo problemáticos:** `fora de centro/edit estilo.mp4` (espaço); `fora de centro/video 1.2.mp4` (espaço); `MG nataçao/4..mp4` (ponto duplo); `pedido de casamento.mp4` (espaço)
- **Nomes de pasta problemáticos:** `fotos horizontal` (espaço); `fotos vertical` (espaço); `fora de centro` (espaço); `MG nataçao` (acento, espaço)
- **Fotos com dados de GPS no EXIF:** 0 de 41 (as cópias do site saem **sem** metadados).

Os nomes problemáticos **não** são renomeados (a pasta é só leitura); o import gera nomes limpos para o site.

## Vídeos

| Arquivo | Tamanho | Duração | Resolução | Orientação | Proporção | Codec | Quadros/s | Áudio |
|---|---:|---:|---|---|---|---|---:|---|
| `barberaria.mp4` | 3,6 MB | 0:15 | 720×1280 | vertical | 9:16 | h264 High yuvj420p | 29.97 | sim |
| `casamento/casamento.mp4` | 4,4 MB | 0:41 | 720×1280 | vertical | 9:16 | h264 High yuvj420p | 30.00 | sim |
| `fora de centro/edit estilo.mp4` | 155,1 MB | 0:33 | 1080×1920 | vertical | 9:16 | h264 Main yuv420p | 59.94 | sim |
| `fora de centro/video 1.2.mp4` | 286,8 MB | 0:31 | 2160×3840 | vertical | 9:16 | h264 Main yuv420p | 29.97 | sim |
| `MG nataçao/1.1.1.1.mp4` | 108 MB | 0:58 | 3840×2160 | horizontal | 16:9 | h264 Main yuv420p | 25.00 | sim |
| `MG nataçao/2.mp4` | 98,5 MB | 1:00 | 3840×2160 | horizontal | 16:9 | h264 Main yuv420p | 29.97 | sim |
| `MG nataçao/3.3.mp4` | 104,1 MB | 0:55 | 3840×2160 | horizontal | 16:9 | h264 Main yuv420p | 29.97 | sim |
| `MG nataçao/4..mp4` | 590,6 MB | 1:03 | 3840×2160 | horizontal | 16:9 | h264 Main yuv420p | 29.97 | sim |
| `pedido de casamento.mp4` | 9,8 MB | 0:40 | 1276×720 | horizontal | 16:9 | h264 High yuv420p | 30.00 | sim |

## Fotos

| Arquivo | Tamanho | Dimensões (já giradas) | Orientação | EXIF orientation |
|---|---:|---|---|---:|
| `casamento/fotos horizontal/1.jpg` | 9,7 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos horizontal/2.jpg` | 11,2 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos vertical/2.jpg` | 14,1 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos horizontal/3.jpg` | 11,7 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos vertical/4.jpg` | 11,4 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos vertical/5.jpg` | 12,8 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos vertical/6.jpg` | 11,8 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos vertical/7.jpg` | 9,6 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos vertical/8.jpg` | 6,1 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos vertical/10.jpg` | 11,4 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos vertical/11.jpg` | 9,3 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos vertical/12.jpg` | 11,8 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos horizontal/14.jpg` | 8,9 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos vertical/15.jpg` | 13,4 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos horizontal/16.jpg` | 5,9 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos horizontal/17.jpg` | 7,2 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos vertical/18.jpg` | 12 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos horizontal/19.jpg` | 10,5 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos vertical/19.jpg` | 12,1 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos vertical/21.jpg` | 11,3 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos vertical/22.jpg` | 13,6 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos horizontal/23.jpg` | 8,3 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos horizontal/24.jpg` | 11,3 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos vertical/25.jpg` | 11,1 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos horizontal/27.jpg` | 7,8 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos horizontal/29.jpg` | 9,1 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos horizontal/30.jpg` | 13,8 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos vertical/30.jpg` | 8 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos horizontal/31.jpg` | 6,7 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos vertical/31.jpg` | 11,7 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos horizontal/32.jpg` | 4,6 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos horizontal/33.jpg` | 6,2 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos vertical/33.jpg` | 13,1 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos vertical/34.jpg` | 8,3 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos vertical/35.jpg` | 9,9 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos vertical/36.jpg` | 7,1 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos horizontal/37.jpg` | 7,3 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos vertical/38.jpg` | 7,8 MB | 4000×6000 | vertical | 1 |
| `casamento/fotos horizontal/39.jpg` | 12,3 MB | 6000×4000 | horizontal | 1 |
| `casamento/fotos horizontal/40.jpg` | 645 KB | 1080×1080 | quadrado | 1 |
| `casamento/fotos vertical/40.jpg` | 5,7 MB | 4000×6000 | vertical | 1 |

## Conferência de integridade

Contagem e tamanho total no momento do inventário: **50 arquivos, 1842961424 bytes**. O fechamento confere que a pasta continua idêntica.
