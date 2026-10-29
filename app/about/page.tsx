import { Authors, allAuthors } from '.contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components.js'
import AuthorLayout from '@/layouts/AuthorLayout'
import { coreContent } from 'pliny/utils/contentlayer.js'
import { genPageMetadata } from 'app/seo'
import siteMetadata from '@/data/siteMetadata'

export const metadata = genPageMetadata({
  title: 'Sobre',
  description: `Sobre ${siteMetadata.author}, Cloud Platform Engineer e autora do ${siteMetadata.title}.`,
  path: '/about',
})

export default function Page() {
  const author = allAuthors.find((p) => p.slug === 'default') as Authors
  const mainContent = coreContent(author)
  const sameAs = [
    siteMetadata.github,
    siteMetadata.twitter,
    siteMetadata.linkedin,
    siteMetadata.mastodon,
    siteMetadata.instagram,
    siteMetadata.threads,
    siteMetadata.facebook,
    author.github,
    author.linkedin,
    author.twitter,
  ].filter((value, index, list) => value && list.indexOf(value) === index)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: `${siteMetadata.siteUrl}/about`,
    image: author.avatar ? `${siteMetadata.siteUrl}${author.avatar}` : undefined,
    jobTitle: author.occupation,
    worksFor: author.company ? { '@type': 'Organization', name: author.company } : undefined,
    email: author.email || siteMetadata.email,
    description: siteMetadata.description,
    sameAs,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AuthorLayout content={mainContent}>
        <MDXLayoutRenderer code={author.body.code} />
      </AuthorLayout>
    </>
  )
}
