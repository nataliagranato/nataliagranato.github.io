import { MetadataRoute } from 'next'
import { allBlogs } from 'contentlayer/generated'
import siteMetadata from '@/data/siteMetadata'
import tagData from 'app/tag-data.json'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteMetadata.siteUrl
  const posts = allBlogs.filter((post) => !post.draft)
  const newest = posts.reduce((latest, post) => {
    const value = post.lastmod || post.date
    return !latest || new Date(value) > new Date(latest) ? value : latest
  }, '')

  const blogRoutes = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.lastmod || post.date,
  }))

  const staticRoutes = ['', 'blog', 'projects', 'tags', 'about', 'llms.txt', 'llms-full.txt'].map(
    (route) => ({
      url: route ? `${siteUrl}/${route}` : siteUrl,
      lastModified: newest || new Date().toISOString(),
    })
  )

  const tagRoutes = Object.keys(tagData).map((tag) => ({
    url: `${siteUrl}/tags/${tag}`,
    lastModified: newest || new Date().toISOString(),
  }))

  return [...staticRoutes, ...tagRoutes, ...blogRoutes]
}
