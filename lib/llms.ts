import { allBlogs } from 'contentlayer/generated'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer.js'
import siteMetadata from '@/data/siteMetadata'

function publishedPosts() {
  return allCoreContent(sortPosts(allBlogs.filter((post) => post.draft !== true)))
}

function summaryOf(summary?: string) {
  return (summary || '').replace(/\s+/g, ' ').trim()
}

export function llmsText() {
  const posts = publishedPosts()
  const lines = [
    `# ${siteMetadata.title}`,
    '',
    `> Blog pessoal de ${siteMetadata.author} sobre Cloud Native, Kubernetes, observabilidade e engenharia de plataforma. Conteúdo em português brasileiro.`,
    '',
    `- Site: ${siteMetadata.siteUrl}`,
    `- Sobre: ${siteMetadata.siteUrl}/about`,
    `- Blog: ${siteMetadata.siteUrl}/blog`,
    `- RSS: ${siteMetadata.siteUrl}/feed.xml`,
    `- Idioma: pt-BR`,
    `- Autora: ${siteMetadata.author}`,
    '',
    '## Posts',
    '',
    ...posts.map((post) => {
      const summary = summaryOf(post.summary)
      const suffix = summary ? `: ${summary}` : ''
      return `- [${post.title}](${siteMetadata.siteUrl}/blog/${post.slug})${suffix}`
    }),
    '',
  ]
  return lines.join('\n')
}

export function llmsFullText() {
  const posts = allBlogs
    .filter((post) => post.draft !== true)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const sections = posts.map((post) => {
    const url = `${siteMetadata.siteUrl}/blog/${post.slug}`
    return [
      `## ${post.title}`,
      '',
      `- URL: ${url}`,
      `- Data: ${post.date}`,
      post.summary ? `- Resumo: ${summaryOf(post.summary)}` : '',
      post.tags?.length ? `- Tags: ${post.tags.join(', ')}` : '',
      '',
      post.body?.raw || '',
    ]
      .filter((line) => line !== '')
      .join('\n')
  })
  return [
    `# ${siteMetadata.title}`,
    '',
    `Texto integral dos posts publicados de ${siteMetadata.author} (${siteMetadata.siteUrl}). Idioma: pt-BR.`,
    '',
    ...sections,
    '',
  ].join('\n')
}
