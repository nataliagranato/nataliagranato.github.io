# Blog com Tailwind e Next.js

[![Estrelas do repositório no GitHub](https://img.shields.io/github/stars/timlrx/tailwind-nextjs-starter-blog?style=social)](https://GitHub.com/timlrx/tailwind-nextjs-starter-blog/stargazers/)
[![Forks no GitHub](https://img.shields.io/github/forks/timlrx/tailwind-nextjs-starter-blog?style=social)](https://GitHub.com/timlrx/tailwind-nextjs-starter-blog/network/)
[![Twitter URL](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Ftwitter.com%2Ftimlrxx)](https://twitter.com/timlrxx)
[![Patrocinar](https://img.shields.io/static/v1?label=Patrocinar&message=%E2%9D%A4&logo=GitHub&link=https://github.com/sponsors/timlrx)](https://github.com/sponsors/timlrx)

[![Implantar com Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/timlrx/tailwind-nextjs-starter-blog)

Este é um template inicial de blog usando [Next.js](https://nextjs.org/) e [Tailwind CSS](https://tailwindcss.com/). A versão 2 é baseada no diretório App do Next.js com [Componentes de Servidor do React](https://nextjs.org/docs/getting-started/react-essentials#server-components) e utiliza o [Contentlayer](https://www.contentlayer.dev/) para gerenciar conteúdo em markdown.

## Guia Rápido de Início

1. Clone o repositório:

```bash
npx degit 'timlrx/tailwind-nextjs-starter-blog'
```

2. Personalize o arquivo `siteMetadata.js` (informações relacionadas ao site).
3. Modifique a política de segurança de conteúdo em `next.config.js` se quiser usar outro provedor de análise ou uma solução de comentários diferente do giscus.
4. Personalize `authors/default.md` (autor principal).
5. Modifique `projectsData.ts`.
6. Modifique `headerNavLinks.ts` para personalizar os links de navegação.
7. Adicione posts ao blog.
8. Implemente no Vercel.

## Instalação

```bash
yarn
```

Se você estiver usando Windows, pode ser necessário executar:

```bash
set PWD="$(pwd)"
```

## Desenvolvimento

Primeiro, inicie o servidor de desenvolvimento:

```bash
yarn dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador para ver o resultado.

Edite o layout em `app` ou o conteúdo em `data`. Com o live reloading, as páginas são atualizadas automaticamente conforme você as edita.

## Estender / Personalizar

- `data/siteMetadata.js`: contém a maioria das informações relacionadas ao site que devem ser modificadas conforme a necessidade do usuário.
- `data/authors/default.md`: informações do autor padrão (obrigatório). Autores adicionais podem ser adicionados como arquivos em `data/authors`.
- `data/projectsData.js`: dados usados para gerar cartões estilizados na página de projetos.
- `data/headerNavLinks.js`: links de navegação.
- `data/logo.svg`: substitua pelo seu próprio logotipo.
- `data/blog`: substitua pelos seus próprios posts de blog.
- `public/static`: armazene ativos como imagens e favicons.
- `tailwind.config.js` e `css/tailwind.css`: configuração e folha de estilo do Tailwind, que podem ser modificadas para alterar a aparência geral do site.
- `css/prism.css`: controla os estilos associados aos blocos de código. Personalize e use seu tema preferido do prismjs, como [temas do prism](https://github.com/PrismJS/prism-themes).
- `contentlayer.config.ts`: configuração para o Contentlayer, incluindo definição de fontes de conteúdo e plugins MDX usados. Consulte a [documentação do Contentlayer](https://www.contentlayer.dev/docs/getting-started) para mais informações.
- `components/MDXComponents.js`: passe seu próprio código JSX ou componente React especificando-o aqui. Você pode usá-los diretamente nos arquivos `.mdx` ou `.md`. Por padrão, um link personalizado, o componente `next/image`, o componente de índice e o formulário de Newsletter são passados. Observe que os componentes devem ser exportados como padrão para evitar [problemas existentes com o Next.js](https://github.com/vercel/next.js/issues/51593).
- `layouts`: principais templates usados nas páginas:
  - Atualmente, há 3 layouts de post disponíveis: `PostLayout`, `PostSimple` e `PostBanner`. `PostLayout` é o layout padrão de 2 colunas com informações de meta e autor. `PostSimple` é uma versão simplificada de `PostLayout`, enquanto `PostBanner` apresenta uma imagem de banner.
  - Há 2 layouts de listagem de blog: `ListLayout`, o layout usado na versão 1 do template com uma barra de pesquisa, e `ListLayoutWithTags`, atualmente usado na versão 2, que omite a barra de pesquisa, mas inclui uma barra lateral com informações sobre as tags.
- `app`: páginas para roteamento. Leia a [documentação do Next.js](https://nextjs.org/docs/app) para mais informações.
- `next.config.js`: configuração relacionada ao Next.js. Você precisará adaptar a Política de Segurança de Conteúdo se quiser carregar scripts, imagens, etc., de outros domínios.

## Post

O conteúdo é modelado usando o [Contentlayer](https://www.contentlayer.dev/), que permite definir seu próprio esquema de conteúdo e usá-lo para gerar objetos de conteúdo tipados. Consulte a [documentação do Contentlayer](https://www.contentlayer.dev/docs/getting-started) para mais informações.

### Frontmatter

O Frontmatter segue os [padrões do Hugo](https://gohugo.io/content-management/front-matter/).

Consulte `contentlayer.config.ts` para uma lista atualizada de campos suportados. Os seguintes campos são suportados:

```
title (obrigatório)
date (obrigatório)
tags (opcional)
lastmod (opcional)
draft (opcional)
summary (opcional)
images (opcional)
authors (lista opcional que deve corresponder aos nomes dos arquivos em `data/authors`. Usa `default` se nenhum for especificado)
layout (lista opcional que deve corresponder aos nomes dos arquivos em `data/layouts`)
canonicalUrl (opcional, URL canônica para o post para SEO)
```

Exemplo de frontmatter de um post:

```
---
title: 'Apresentando o Blog Inicial com Tailwind e Next.js'
date: '2021-01-12'
lastmod: '2021-01-18'
tags: ['next-js', 'tailwind', 'guia']
draft: false
summary: 'Procurando por um template performático, pronto para uso, com o melhor da tecnologia web para atender às suas necessidades de blog? Confira o template Blog Inicial com Tailwind e Next.js.'
images: ['/static/images/canada/mountains.jpg', '/static/images/canada/toronto.jpg']
authors: ['default', 'sparrowhawk']
layout: PostLayout
canonicalUrl: https://tailwind-nextjs-starter-blog.vercel.app/blog/introducing-tailwind-nextjs-starter-blog
---
```

## Implantação

**Vercel**  
A maneira mais fácil de implantar o template é no [Vercel](https://vercel.com). Confira a [documentação de implantação do Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para mais detalhes.

**Netlify**  
O [Netlify](https://www.netlify.com/) configura o runtime do Next.js para habilitar funcionalidades-chave do Next.js no seu site sem necessidade de configurações adicionais. O Netlify gera funções serverless que lidam com funcionalidades como páginas renderizadas no servidor (SSR), regeneração estática incremental (ISR), `next/images`, etc.

Consulte [Next.js no Netlify](https://docs.netlify.com/integrations/frameworks/next-js/overview/#next-js-runtime) para valores de configuração sugeridos e mais detalhes.

**Serviços de hospedagem estática / GitHub Pages / S3 / Firebase etc.**

1. Adicione `output: 'export'` em `next.config.js`. Consulte a [documentação de exportação estática](https://nextjs.org/docs/app/building-your-application/deploying/static-exports#configuration) para mais informações.
2. Comente `headers()` em `next.config.js`.
3. Adicione `unoptimized: true` à chave `images` em `next.config.js`:

   Alternativamente, para continuar usando `next/image`, você pode usar um provedor de otimização de imagens alternativo, como Imgix, Cloudinary ou Akamai. Consulte a [documentação de otimização de imagens](https://nextjs.org/docs/app/building-your-application/deploying/static-exports#image-optimization) para mais detalhes.

4. Remova a pasta `api` e os componentes que chamam a função do lado do servidor, como o componente de Newsletter. Não é tecnicamente necessário, e o site será construído com sucesso, mas as APIs não poderão ser usadas, pois são funções do lado do servidor.
5. Execute `yarn build`. O conteúdo estático gerado estará na pasta `out`.
6. Implemente a pasta `out` no serviço de hospedagem de sua escolha ou execute `npx serve out` para visualizar o site localmente.

**Nota**: Implantar no GitHub Pages requer modificações adicionais no caminho base. Consulte o FAQ para mais informações.
