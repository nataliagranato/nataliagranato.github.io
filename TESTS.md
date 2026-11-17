# Testes do Projeto

Este repositório reúne dois grupos de testes: os **testes funcionais/E2E da Newsletter** (em Node.js) e os **testes de smoke e carga leve com Grafana k6**.

---

## Visão geral

| Tipo | Arquivo / Script | O que valida | Pode rodar em produção? |
| --- | --- | --- | --- |
| Autoteste dos guardas (k6) | `tests/k6/selftest.js` | Parsing de URL/host e bloqueio de alvos de produção (sem rede) | Não usa rede |
| Smoke de leitura (k6) | `tests/k6/smoke.js` | `GET` em `/`, `/blog`, `/tags`, `/about`, `/projects`, `/feed.xml`, `/sitemap.xml`, `/robots.txt` e `/api/health` | **Sim** (somente leitura) |
| Contrato e carga da Newsletter (k6) | `tests/k6/newsletter.js` | `POST /api/newsletter` com e-mail inválido (`400`), honeypot (`200`) e rate limit (`429`), sem `5xx` | **Não** (bloqueado por guarda) |
| E2E da Newsletter (Node) | `scripts/newsletter-e2e.mjs` | Fluxo completo de inscrição, honeypot, e-mail inválido, confirmação, cancelamento e envio de post | **Não** (usa Redis local/teste) |
| HTTP E2E da Newsletter (Node) | `scripts/newsletter-http-e2e.mjs` | Site compilado + rota `/api/newsletter` via HTTP | **Não** (local) |

---

## Pré-requisitos

- **Node.js `22.x`** e dependências instaladas (`npm ci`).
- **Grafana k6** instalado localmente para rodar os scripts em `tests/k6/` (binário único, sem dependência npm).
- **Redis** acessível localmente para os scripts `scripts/newsletter-e2e.mjs` e `scripts/newsletter-http-e2e.mjs` (ou para testar `POST /api/newsletter` no servidor local).

---

## Como executar localmente

### 1. Autoteste dos guardas do k6 (sem servidor)

```bash
k6 run tests/k6/selftest.js
```

### 2. Smoke e Newsletter com k6 (contra servidor local)

Primeiro suba o build local:

```bash
npm run build && npm run serve -- -p 3000
```

Em outro terminal, execute os scripts apontando `K6_BASE_URL` para o servidor local:

```bash
K6_BASE_URL=http://127.0.0.1:3000 npm run k6:smoke
K6_BASE_URL=http://127.0.0.1:3000 npm run k6:newsletter
```

*(Ou diretamente com `k6 run tests/k6/smoke.js` / `k6 run tests/k6/newsletter.js`.)*

Variáveis opcionais suportadas pelos scripts k6:
- `K6_VUS`: número de usuários virtuais simultâneos.
- `K6_DURATION`: duração do teste (ex.: `15s`).
- `K6_RATE`: taxa de requisições (usada em `newsletter.js`).
- `K6_TIMEOUT`: timeout por requisição (padrão `20s`).
- `K6_BYPASS_SECRET`: envia o header `x-vercel-protection-bypass` quando preenchida.

### 3. Testes E2E da Newsletter em Node

```bash
npm run newsletter:test
```

E para o teste HTTP sobre o build:

```bash
npm run build
node scripts/newsletter-http-e2e.mjs
```

---

## Como executar contra Preview ou Produção

### Preview da Vercel

Se o preview estiver público:

```bash
K6_BASE_URL=https://<deployment>.vercel.app k6 run tests/k6/smoke.js
K6_BASE_URL=https://<deployment>.vercel.app k6 run tests/k6/newsletter.js
```

Se o preview estiver protegido por **Vercel Authentication**, passe também o segredo de bypass:

```bash
K6_BASE_URL=https://<deployment>.vercel.app \
K6_BYPASS_SECRET=<VERCEL_AUTOMATION_BYPASS_SECRET> \
k6 run tests/k6/smoke.js
```

### Produção (`nataliagranato.xyz`)

Apenas o **smoke de leitura** pode rodar contra produção:

```bash
K6_BASE_URL=https://nataliagranato.xyz k6 run tests/k6/smoke.js
```

> **Importante:** `tests/k6/newsletter.js` bloqueia `nataliagranato.xyz` e `www.nataliagranato.xyz` na inicialização antes de enviar qualquer requisição, pois `POST /api/newsletter` grava chaves de rate limit no Redis de produção.

---

## Pipeline no GitHub Actions

O workflow [`.github/workflows/k6.yml`](.github/workflows/k6.yml) executa automaticamente após um deploy bem-sucedido da Vercel (`deployment_status`) ou manualmente via **Actions → k6 → Run workflow** (`workflow_dispatch`):

1. **`guards`**: roda `k6 run tests/k6/selftest.js` (sem rede).
2. **`smoke`**: roda `tests/k6/smoke.js` (`2` VUs por `15s`) em preview e produção.
3. **`newsletter`**: roda `tests/k6/newsletter.js` (`K6_RATE=4` por `15s`) **apenas** em deploys de `preview` (ou no disparo manual com a opção `newsletter` marcada).

Se a **Vercel Authentication** estiver ativada para previews no futuro, cadastre o secret `VERCEL_AUTOMATION_BYPASS_SECRET` nas configurações do repositório no GitHub (*Settings → Secrets and variables → Actions*).

---

## Thresholds (critérios de aprovação do k6)

| Métrica | Limite |
| --- | --- |
| `http_req_failed` | `< 1%` |
| `http_req_duration` | `p(95) < 800 ms` (`smoke`) / `p(95) < 1200 ms` (`newsletter`) |
| `http_req_duration{name:health}` | `p(95) < 500 ms` |
| `newsletter_5xx` | `0` |
| `checks` | `> 99%` (`smoke`) / `> 98%` (`newsletter`) |

---

## O que esta suíte não cobre

Os scripts atuais não testam DOM, componentes React, acessibilidade nem regressão visual — para isso, a recomendação é complementar com **Vitest** (unidade/componente) e **Playwright** (E2E de interface e acessibilidade).
