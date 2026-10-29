# CHANGELOG

Todas as mudanças notáveis ​​neste projeto serão documentadas neste arquivo.

O formato é baseado em [Mantenha um Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e este projeto adere a [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Removed
- SDK legado de monitoramento de erros de terceiros, páginas de exemplo e de teste, instrumentação de runtime e documentação associada
- Variáveis de ambiente e o wrapper de build desse monitoramento

## [2.2.3] - 2026-03-21

### Added
- Novo post no blog: "História e Evolução da Engenharia de Plataforma" (`data/blog/historia-evolucao-engenharia-de-plataforma.mdx`)
  - Conteúdo completo sobre origem, evolução e conceitos da Engenharia de Plataforma
  - Marcos históricos, tendências de mercado e casos de sucesso
- Novo post no blog: "Modelo de Maturidade de Platform Engineering" (`data/blog/mode-maturidade-platform-eng.mdx`)
  - Detalhes sobre o modelo de maturidade da CNCF
  - Níveis de maturidade, estratégias de evolução e impacto nos negócios
- Imagens ilustrativas para os novos posts (`public/static/images/history-platform-eng.png` e diagrama no segundo post)

### Changed
- Formatação completa dos novos arquivos MDX em Markdown estruturado
  - Adicionados cabeçalhos (#, ##, ###), listas (-), negrito (**), e hierarquia adequada
  - Frontmatter adicionado: título, data, tags, resumo e caminhos de imagens
  - Imagens formatadas em Markdown (`![alt](url)`)
- Correção do caminho da imagem no frontmatter do primeiro post para incluir extensão `.png`

### Security
- Verificação de vulnerabilidades nas dependências: Identificadas 10 vulnerabilidades (1 baixa, 3 moderadas, 6 altas)
  - Principais: ReDoS em ajv, flatted; prototype pollution em js-yaml; RCE em serialize-javascript; DoS em svgo
  - Correções automáticas disponíveis via `npm audit fix` para a maioria; js-yaml sem correção automática

## [2.2.2] - 2025-12-30

### Security
- **CVE-2025-55182**: Fixed RCE vulnerability in Next.js and React flight protocol
  - Updated Next.js from 15.5.9 to 16.1.1 (major version bump: 15→16; required minimum for CVE fix: 15.5.7)
  - Updated React from 19.1.1 to 19.2.3 (required minimum: 19.1.2; ^19.2.3 ensures all security patches included)
  - Updated React DOM from 19.1.1 to 19.2.3 (required minimum: 19.1.2; ^19.2.3 ensures all security patches included)
  - This vulnerability affected React packages for versions 19.0.0, 19.1.0, 19.1.1, and 19.2.0, and frameworks using these packages
  - Immediate update recommended for all users of Next.js 15.x with App Router
  - **Note**: The major upgrade to Next.js 16.1.1 was performed to ensure extended security coverage and access to latest stable improvements; the CVE could have been addressed with 15.5.7+, but v16 provides better long-term security and performance stability

### Changed
- **Next.js Configuration**: Removed deprecated settings
  - Removed `eslint.dirs` configuration (deprecated in Next.js 16)
  - Removed obsolete OpenTelemetry resolutions to fix runtime conflicts

### Removed
- **Redis Integration**: Simplified caching system
  - Removed Redis dependency and related configuration
  - Cache now uses Contentlayer directly for better simplicity and reliability
  - Removed cache API endpoints and management scripts
  - Simplified blog data fetching without external cache layer
- **Vercel AI SDK**: Removed AI SDK integration to fix production deployment type conflicts
  - Removed `@ai-sdk/openai` and `ai` dependencies
  - Removed all AI-related API endpoints (`app/api/ai/*`)
  - Removed AI monitoring test page (`app/test-ai-monitoring`)
  - Removed AI documentation (`docs/AI_MONITORING.md`) and examples (`lib/ai-examples.ts`)
  - Removed `@ai-sdk/provider` resolution from `package.json`
  - This resolves type conflicts caused by duplicate `@ai-sdk/provider` packages in the dependency tree

### React 19.2.3+ Breaking Changes & Migration Validation
- **JSX Transform**: Verified `tsconfig.json` configured to use `"jsx": "react-jsx"` for automatic JSX runtime
- **ReactDOM Methods**: Project uses `createRoot` and `hydrateRoot` for concurrent rendering; legacy `ReactDOM.render()` and `ReactDOM.hydrate()` not used
- **Error Handling**: Window error events validated; `window.reportError` behavior confirmed for uncaught errors
- **Suspense & Fallbacks**: Fallback ordering and nested Suspense boundaries verified in critical SSR flows
- **Module Assumptions**: UMD bundle assumptions removed; only ESM imports used throughout the codebase
- **React Internals**: No reliance on internal React APIs or `Symbol.for('react.memo')` patterns detected; all custom hooks follow React 19 conventions

### Migration Notes (Next.js 15→16)
- **Breaking Changes**:
  - Minimum Node.js version requirement: 22.x (ensure your environment is updated)
  - React 19.2.3+ is now required (App Router functionality)
  - Build system improvements: updated webpack configuration in `next.config.js` to support new build optimizations
  - Edge Runtime updates aligned with Next.js 16 middleware API changes
  - Static page generation: Some routes may require re-validation; ensure `npm run build` passes locally to validate Contentlayer integration
- **Action Items**:
  - Run `npm install` to update all dependencies
  - Test locally with `npm run dev` and `npm run build` to ensure no routing or content generation issues
  - Verify Redis caching layer compatibility if enabled (via `lib/redis.ts`)

## [2.2.1] - 2025-10-25

### Added
- Novo artigo: "O que é Engenharia de Plataforma?" (`data/blog/hist-evol-platform-engineer.mdx`)
- Imagem ilustrativa para o artigo de Platform Engineering (`public/static/images/platform-engineer.jpg`)

### Changed
- Formatação das referências bibliográficas do artigo de Platform Engineering para formato markdown com links clicáveis
- Atualizações em artigos existentes: `o-que-arquitetura-cloud-native.mdx` e `o-que-e-kubernetes.mdx`
- Melhorias nos metadados do site (`data/siteMetadata.js`)
- Atualização das informações do autor (`data/authors/default.mdx`)

## [2.2.0] - 2025-09-24

### Added
- Integração de monitoramento de erros e performance (frontend, backend e edge), removida depois
- Logging de console, widget de feedback e upload de source maps, removidos depois
- Configuração multi-runtime para Next.js (Server, Client e Edge)
- Página de teste para erros e feedback, removida depois
- Documentação de variáveis de ambiente e exemplos de uso, removida depois
- Utilitários para controle de sampling, logs e debug por ambiente, removidos depois

### Changed
- Atualização do README com instruções de configuração de monitoramento, removidas depois
- Adição de headers personalizados para monitoramento externo

### Fixed
- Melhor tratamento de erros globais e integração com a página padrão do Next.js

### Notes
- A página de teste ficava protegida em produção. A integração foi removida por completo.

## v2.1.0 - 2025-09-02

### Added

- Implementação completa do sistema de cache utilizando Redis (`lib/cache.ts`, `lib/redis.ts`, `lib/blogCache.ts`)
- Novos endpoints de API para gerenciamento de cache (`app/api/cache/route.ts`)
- Documentação detalhada sobre o sistema de cache e Redis (`docs/CACHE_API.md`, `docs/REDIS_CACHE.md`)

### Changed

- Melhoria na formatação e qualidade dos artigos do blog em Markdown
- Atualizações e aprimoramentos nos arquivos de configuração de build e deploy

### Fixed

- Correção de tipagem no TypeScript para o cliente Redis (`lib/cache.ts`)
- Garantia de conformidade com ESLint em todo o projeto

---

Merge relacionado: [#52](https://github.com/nataliagranato/nataliagranato.github.io/pull/52)
## v2.0.0 - 2025-09-02

### Added

- Compatibilidade com Node.js 22.x
- Suporte ao Next.js 15.5.2
- Suporte ao React 19.1.1
- Migração para Contentlayer2 0.5.8

### Changed

- Atualização das dependências para versões mais recentes
- Migração de `contentlayer` para `contentlayer2` para compatibilidade com Next.js 15
- Atualização dos parâmetros de rota para usar `Promise<{}>` conforme requerido pelo Next.js 15
- Atualização das importações de `github-slugger` para usar função `slug` diretamente
- Correção do script RSS para remover `import assertions` deprecado

### Fixed

- Problemas de compatibilidade com Node.js 22 no deploy da Vercel
- Erros de compilação relacionados ao MDX e processamento de tabelas
- Conflitos de peer dependencies entre Next.js, React e bibliotecas relacionadas
- Problemas de TypeScript com tipos de parâmetros em rotas dinâmicas

### Breaking Changes

- Requisito mínimo do Node.js atualizado para 22.0.0
- Mudança nas importações do Contentlayer de `contentlayer/generated` para `.contentlayer/generated`
- Migração do sistema de conteúdo para Contentlayer2
- Atualização para Next.js 15.x e React 19.x

## v1.1.0 - 2025-05-04

### Added

- Versão anterior com funcionalidades básicas
