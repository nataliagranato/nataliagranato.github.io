# Testes de carga com Grafana k6

Dois scripts, sem dependência de npm: o `k6` é um binário único.

| Script          | O que cobre                                                                                                     | Pode rodar em produção?     |
| --------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `smoke.js`      | GET em `/`, `/blog`, `/tags`, `/about`, `/projects`, `/feed.xml`, `/sitemap.xml`, `/robots.txt` e `/api/health` | Sim — só leitura            |
| `newsletter.js` | Contrato e carga leve de `POST /api/newsletter`                                                                 | **Não** — o guarda bloqueia |

## Rodar local

```bash
# build + servidor local (o k6 bate no servidor real, não em mock)
npm run build && npm run serve -- -p 3000

K6_BASE_URL=http://127.0.0.1:3000 k6 run tests/k6/smoke.js
K6_BASE_URL=http://127.0.0.1:3000 k6 run tests/k6/newsletter.js
```

## Rodar no preview da Vercel

```bash
K6_BASE_URL=https://<deployment>.vercel.app \
K6_BYPASS_SECRET=<VERCEL_AUTOMATION_BYPASS_SECRET> \
k6 run tests/k6/smoke.js
```

Previews com Deployment Protection respondem 401 sem o header
`x-vercel-protection-bypass`; o script adiciona o header quando
`K6_BYPASS_SECRET` existe.

## Por que a Newsletter não roda em produção

`POST /api/newsletter` chama `allowRequest()` (GET + PUT no Redis) **antes** de
validar qualquer coisa e, no caminho de sucesso, envia e-mail real. Por isso:

- o script só envia e-mail inválido (400) e honeypot (200) — nenhum cria
  assinante ou dispara e-mail;
- o rate limit de 5 req / 15 min por IP faz a maior parte da carga receber
  `429`, que é resposta esperada e ainda exercita o Redis;
- `assertTargetSafe` falha no init se `K6_BASE_URL` for `nataliagranato.xyz`.
  Só um `K6_ALLOW_PRODUCTION=1` explícito passa por cima — e não deve ser usado.

## Thresholds

| Métrica                          | Limite                                        |
| -------------------------------- | --------------------------------------------- |
| `http_req_failed`                | < 1%                                          |
| `http_req_duration`              | p95 < 800 ms (smoke) / < 1200 ms (newsletter) |
| `http_req_duration{name:health}` | p95 < 500 ms                                  |
| `newsletter_5xx`                 | 0                                             |
| `checks`                         | > 98%                                         |

Variáveis úteis: `K6_VUS`, `K6_DURATION`, `K6_RATE`, `K6_TIMEOUT`.

## O que o k6 **não** cobre

DOM, componente React, acessibilidade e regressão visual. Para isso a
ferramenta certa é Playwright (E2E no preview + `@axe-core/playwright`) e
Vitest para unidade — inclusive o bug do `event.currentTarget` da Newsletter,
que um teste de componente pega em segundos.
