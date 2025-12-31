# CHANGELOG

Todas as mudanças notáveis ​​neste projeto serão documentadas neste arquivo.

O formato é baseado em [Mantenha um Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e este projeto adere a [Versionamento Semântico](https://semver.org/lang/pt-BR/).

<!--
## [Unreleased] - yyyy-mm-dd

Here we write upgrading notes for brands. It's a team effort to make them as
straightforward as possible.

### Added

### Changed

### Fixed

### Breaking Changes
-->
## [2.2.2] - 2025-12-30

### Security
- **CVE-2025-5518**: Fixed RCE vulnerability in Next.js and React flight protocol
  - Updated Next.js from 15.5.2 to 15.5.9 (required minimum: 15.5.7)
  - Updated React from 19.1.1 to 19.2.3 (required minimum: 19.1.2)
  - Updated React DOM from 19.1.1 to 19.2.3 (required minimum: 19.1.2)
  - This vulnerability affected React packages for versions 19.0.0, 19.1.0, 19.1.1, and 19.2.0, and frameworks using these packages
  - Immediate update recommended for all users of Next.js 15.x with App Router

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
- Integração completa com Sentry para monitoramento de erros e performance (frontend, backend e edge)
- Logging avançado via Sentry, incluindo captura automática de logs do console
- Widget de feedback do usuário integrado
- Upload automático de source maps para debugging em produção
- Configuração multi-runtime para Next.js (Server, Client e Edge)
- Página de teste para erros e feedback (`/test-sentry`)
- Documentação detalhada sobre variáveis de ambiente, recomendações de produção e exemplos de uso ([docs/SENTRY_CONFIG.md](docs/SENTRY_CONFIG.md))
- Utilitários para controle de sampling, logs e debug por ambiente

### Changed
- Atualização do README com instruções de configuração do Sentry
- Adição de headers personalizados para monitoramento externo

### Fixed
- Melhor tratamento de erros globais e integração com a página padrão do Next.js

### Notes
- Para produção, recomenda-se configurar sampling rate em 0.05, desabilitar logs e debug via variáveis de ambiente.
- Página de teste do Sentry protegida para ambientes de produção.

Para detalhes completos dos commits e arquivos alterados, acesse:
[Busca por Sentry no código](https://github.com/nataliagranato/nataliagranato.github.io/search?q=Sentry)

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
