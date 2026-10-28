import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'

interface PageSEOProps {
  title: string
  description?: string
  image?: string
  path?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

function absoluteUrl(path = '/') {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return new URL(path, siteMetadata.siteUrl).toString()
}

export function genPageMetadata({
  title,
  description,
  image,
  path = '/',
  ...rest
}: PageSEOProps): Metadata {
  const { alternates, openGraph, twitter, ...other } = rest
  const canonical = absoluteUrl(path)
  const desc = description || siteMetadata.description
  const images = image ? [image] : [siteMetadata.socialBanner]
  return {
    title,
    description: desc,
    ...other,
    alternates: {
      canonical,
      ...alternates,
    },
    openGraph: {
      title: `${title} | ${siteMetadata.title}`,
      description: desc,
      url: canonical,
      siteName: siteMetadata.title,
      images,
      locale: 'pt_BR',
      type: 'website',
      ...openGraph,
    },
    twitter: {
      title: `${title} | ${siteMetadata.title}`,
      description: desc,
      card: 'summary_large_image',
      images,
      creator: '@granatowp',
      site: '@granatowp',
      ...twitter,
    },
  }
}
