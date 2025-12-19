# Natália Granato's Blog - GitHub Copilot Instructions

This is a Next.js 15.5.2 TypeScript blog application focused on Cloud Native, DevOps, and CNCF technologies. The codebase uses Contentlayer for MDX content management, Redis for caching, Sentry for monitoring, and is optimized for Vercel deployment.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

Instruções para agentes (GitHub Copilot / AI)

Resumo rápido: este repositório é um site/blog Next.js (App Router) em TypeScript que usa Contentlayer para MDX, Tailwind para estilos, Redis opcional para cache e Sentry para monitoramento. Antes de editar, leia este arquivo e execute `npm run lint` e `npm run build` localmente.

- Start rápido:
   - `npm install` (Node.js 22.x)
   - `cp .env.example .env.local` e ajustar variáveis (ex.: `REDIS_URL`, `OPENAI_API_KEY`)
   - `npm run dev` para desenvolvimento (http://localhost:3000)
   - `npm run build` para validar alterações (gera `.contentlayer/`)

- Arquivos/chaves para revisar primeiro:
   - Layout/global: `app/layout.tsx` (fonts/providers)
   - Pages/rotas: `app/*` (App Router), em especial `app/blog`, `app/tags`
   - Conteúdo do blog: `data/blog/*.mdx` e autores em `data/authors/default.mdx`
   - Configuração Contentlayer: `contentlayer.config.js`
   - Cache/Redis: `lib/blogCache.ts`, `lib/redis.ts`, testes em `scripts/test-cache.ts`
   - Sentry: `sentry.edge.config.ts`, `sentry.server.config.ts`

- Convenções do projeto (observáveis no código):
   - Posts são MDX com frontmatter; Contentlayer gera tipos estáticos usados em `app` e `layouts`.
   - Não dependa de Redis em build; sistema cai para Contentlayer se Redis não responder.
   - Fontes externas: `Space Grotesk` via Google Fonts pode quebrar em redes restritas — se necessário, ajuste `app/layout.tsx`.

- Integrações e pontos de atenção:
   - Vercel é alvo de deploy (`vercel.json`); mantenha rotas estáticas e geração de página durante `npm run build`.
   - Testes de cache usam `docker run -p 6379:6379 redis` localmente.
   - Scripts úteis: `scripts/postbuild.mjs`, `scripts/rss.mjs`, `scripts/test-cache.ts`.

- Regras práticas para um agente:
   - Sempre rodar `npm run lint` antes de criar PRs.
   - Execute `npm run build` para validar mudanças que tocam roteamento, geração de páginas ou Contentlayer.
   - Para mudanças em posts MDX, atualize frontmatter e rode build para validar paths/metadata.
   - Evite mudanças massivas de layout sem checar homepage (`app/page.tsx`) e listagens (`layouts/*`).

   - Prefira alterações pequenas e testáveis; abra PRs com `npm run lint` e `npm run build` passando localmente.
   - Documente em `docs/` se alterar comportamento de cache ou monitoramento.
 Quando for editar/implementar código:
    - Prefira alterações pequenas e testáveis; abra PRs com `npm run lint` e `npm run build` passando localmente.
    - Documente em `docs/` se alterar comportamento de cache ou monitoramento.

 Se algo deste resumo estiver incompleto ou você quiser que eu inclu a checklist de validação detalhada (build/dev/test), diga e eu atualizo.

 Checklist de validação (detalhada)

 - Passo 1 — Preparar ambiente
    - Verifique Node.js: `node --version` (recomenda-se 22.x).
    - Instale dependências: `npm install`.
    - Copie variáveis de ambiente: `cp .env.example .env.local` e ajuste `REDIS_URL`, `OPENAI_API_KEY`, `NEXT_PUBLIC_ENABLE_SENTRY_TEST_PAGE` se necessário.

 - Passo 2 — Lint e checagens estáticas
    - Rode `npm run lint` e corrija avisos/erros antes de abrir PR.

 - Passo 3 — Build completo (obrigatório para mudanças em rotas/MDX/layouts)
    - Comando: `npm run build`
    - O build executa Contentlayer e gera `.contentlayer/`. Se falhar por fontes, verifique `app/layout.tsx` (Space Grotesk).
    - Mensagens esperadas: "Collecting page data" e "Generating static pages".

 - Passo 4 — Testar servidor de desenvolvimento
    - Inicie: `npm run dev` e abra http://localhost:3000
    - Verificações rápidas:
       - Homepage: cabeçalho "Latest" e listagem de posts
       - Navegação: Blog, Tags, Projects, About
       - Página de tag: abra uma tag e confirme filtro (ex.: `kubernetes`)
       - Post: abra um `data/blog/*.mdx` e confirme renderização (imagens, código, frontmatter)

 - Passo 5 — Testar cache opcional (Redis)
    - Iniciar Redis local: `docker run -d -p 6379:6379 --name redis redis`
    - Teste de cache (após build): `npx tsx scripts/test-cache.ts` ou `node scripts/test-redis.js`.
    - Se Redis não estiver disponível, comportamento esperado: fallback para Contentlayer via `lib/blogCache.ts`.

 - Passo 6 — Verificações finais antes do PR
    - Execute `npm run lint` novamente.
    - Valide rotas e listagens: `app/blog`, `app/tags`, `app/projects`, `app/about`.
    - Evite commits grandes de layout sem screenshots ou descrição clara do impacto.

 - Ficheiros para inspeção rápida ao revisar PRs:
    - `app/layout.tsx`, `app/page.tsx`, `layouts/PostLayout.tsx`, `contentlayer.config.js`, `lib/blogCache.ts`, `lib/redis.ts`.

 ```

