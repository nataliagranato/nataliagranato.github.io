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
