import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer.js'
import { allBlogs } from '.contentlayer/generated'
import siteMetadata from '@/data/siteMetadata'
import Main from './Main'

export default async function Page() {
  const sortedPosts = sortPosts(allBlogs)
  const posts = allCoreContent(sortedPosts)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteMetadata.title,
    url: siteMetadata.siteUrl,
    description: siteMetadata.description,
    inLanguage: 'pt-BR',
    author: {
      '@type': 'Person',
      name: siteMetadata.author,
      url: `${siteMetadata.siteUrl}/about`,
    },
  }
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Main posts={posts} />
    </>
  )
}
