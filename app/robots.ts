import { MetadataRoute } from 'next'
import siteMetadata from '@/data/siteMetadata'

const privatePaths = ['/api/']

const agents = [
  '*',
  'Googlebot',
  'Bingbot',
  'DuckDuckBot',
  'Applebot',
  'Applebot-Extended',
  'Slurp',
  'YandexBot',
  'Baiduspider',
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Amazonbot',
  'Bytespider',
  'CCBot',
  'cohere-ai',
  'Meta-ExternalAgent',
  'FacebookBot',
  'DuckAssistBot',
  'YouBot',
  'Diffbot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: agents.map((userAgent) => ({
      userAgent,
      allow: '/',
      disallow: privatePaths,
    })),
    sitemap: `${siteMetadata.siteUrl}/sitemap.xml`,
    host: siteMetadata.siteUrl,
  }
}
