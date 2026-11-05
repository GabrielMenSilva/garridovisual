# Cabeçalhos de segurança (para quando o site for hospedado)

O site é 100% estático e não usa cookies, analytics nem fontes externas. Quando ele for publicado, configure estes cabeçalhos na hospedagem. O formato muda de um serviço para outro: arquivo `_headers` em Cloudflare Pages e Netlify, `vercel.json` na Vercel.

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Por que cada exceção existe

- `style-src 'unsafe-inline'`: o React escreve estilos inline (blur placeholder das imagens, parallax do hero com `--hero-progress`, `object-position` das capas). Não há CSS vindo de fora.
- `img-src data:`: os *blur placeholders* são imagens minúsculas em base64.
- `frame-src`: só os players de YouTube (sem cookies) e Vimeo, e eles só carregam depois do clique.
- `script-src 'self'`: o JSON-LD no `<head>` é `application/ld+json`, que a CSP não trata como script executável.
- `form-action 'none'`: o site não tem formulário.

## Cache sugerido

- `/assets/*` (arquivos com hash no nome): `Cache-Control: public, max-age=31536000, immutable`
- `/images/*`, `/media/*`: `Cache-Control: public, max-age=2592000`
- `/index.html`: `Cache-Control: no-cache`

Antes de publicar, teste a CSP no navegador (Console sem erros de "Refused to…") com um vídeo do YouTube real ligado.
