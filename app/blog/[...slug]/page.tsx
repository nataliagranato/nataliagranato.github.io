import 'css/prism.css'
import 'katex/dist/katex.css'

import { components } from '@/components/MDXComponents'
import { MDXLayoutRenderer } from 'pliny/mdx-components.js'
import { coreContent } from 'pliny/utils/contentlayer.js'
import { allAuthors } from '.contentlayer/generated'
import type { Authors, Blog } from '.contentlayer/generated'
import PostSimple from '@/layouts/PostSimple'
import PostLayout from '@/layouts/PostLayout'
import PostBanner from '@/layouts/PostBanner'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { notFound } from 'next/navigation'
import { getCachedPost, getCachedPosts } from '@/lib/blogCache'

// Interface para estrutura de dados JSON-LD
interface JsonLdStructuredData {
  author?: unknown
  image?: unknown
  [key: string]: unknown
}

// Tipo para o post com propriedades necessárias do blog
type BlogPost = Blog & {
  structuredData?: JsonLdStructuredData
}

const defaultLayout = 'PostLayout'
const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  const { slug: slugArray } = await params
  const slug = decodeURI(slugArray.join('/'))
  const post = await getCachedPost(slug)
  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })
  if (!post) {
    return
  }

  const publishedAt = new Date(post.date).toISOString()
  const modifiedAt = new Date(post.lastmod || post.date).toISOString()
  const authors = authorDetails.map((author) => author.name)
  let imageList = [siteMetadata.socialBanner]
  if (post.images) {
    imageList = typeof post.images === 'string' ? [post.images] : post.images
  }
  const ogImages = imageList.map((img) => {
    return {
      url: img.includes('http') ? img : siteMetadata.siteUrl + img,
    }
  })
  const canonical = post.canonicalUrl || `${siteMetadata.siteUrl}/blog/${post.slug}`

  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical,
    },
    openGraph: {
      title: post.title,
      description: post.summary,
      siteName: siteMetadata.title,
      locale: 'pt_BR',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: canonical,
      images: ogImages,
      authors: authors.length > 0 ? authors : [siteMetadata.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: ogImages.map((img) => img.url),
      creator: '@granatowp',
      site: '@granatowp',
    },
  }
}

export const generateStaticParams = async () => {
  const posts = await getCachedPosts()

  // Garantir que posts seja sempre um array
  if (!Array.isArray(posts)) {
    console.error('getCachedPosts returned non-array:', typeof posts, posts)
    return []
  }

  const paths = posts.map((p) => ({ slug: p.slug.split('/') }))

  return paths
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: slugArray } = await params
  const slug = decodeURI(slugArray.join('/'))

  // Get cached posts for navigation
  const sortedCoreContents = await getCachedPosts()
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slug)
  if (postIndex === -1) {
    return notFound()
  }

  const prev = sortedCoreContents[postIndex + 1]
  const next = sortedCoreContents[postIndex - 1]
  const post = await getCachedPost(slug)

  if (!post) {
    return notFound()
  }

  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })

  const blogPost = post as BlogPost
  const mainContent = coreContent(blogPost)
  const jsonLd: JsonLdStructuredData = blogPost.structuredData || {}

  const canonical = `${siteMetadata.siteUrl}/blog/${slug}`
  if (typeof jsonLd === 'object' && jsonLd !== null) {
    jsonLd['@context'] = 'https://schema.org'
    jsonLd['@type'] = 'BlogPosting'
    jsonLd.headline = blogPost.title
    jsonLd.description = blogPost.summary
    jsonLd.datePublished = blogPost.date
    jsonLd.dateModified = blogPost.lastmod || blogPost.date
    jsonLd.inLanguage = 'pt-BR'
    jsonLd.url = canonical
    jsonLd.mainEntityOfPage = {
      '@type': 'WebPage',
      '@id': canonical,
    }
    jsonLd.author = authorDetails.map((author) => ({
      '@type': 'Person',
      name: author.name,
      url: `${siteMetadata.siteUrl}/about`,
    }))
    jsonLd.publisher = {
      '@type': 'Person',
      name: siteMetadata.author,
      url: `${siteMetadata.siteUrl}/about`,
    }
    if (typeof jsonLd.image === 'string' && !jsonLd.image.startsWith('http')) {
      jsonLd.image = `${siteMetadata.siteUrl}${jsonLd.image}`
    }
  }

  const Layout = layouts[blogPost.layout || defaultLayout]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Layout content={mainContent} authorDetails={authorDetails} next={next} prev={prev}>
        {blogPost.body?.code ? (
          <MDXLayoutRenderer code={blogPost.body.code} components={components} toc={blogPost.toc} />
        ) : (
          <div>Conteúdo indisponível</div>
        )}
      </Layout>
    </>
  )
}
