import redisClient from './redis'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import { RedisClientType } from 'redis'

interface PaginationData {
  currentPage: number
  totalPages: number
  totalPosts: number
  postsPerPage: number
}

// Tipos para diferentes tipos de cache
export type PostSummary = CoreContent<Blog> // Para listagens (sem body)
export type FullPost = Blog // Para posts individuais (com body)

class CacheService {
  private readonly defaultTTL = 3600 // 1 hora em segundos

  private generateKey(prefix: string, identifier: string): string {
    return `blog:${prefix}:${identifier}`
  }

  async get<T>(prefix: string, identifier: string): Promise<T | null> {
    try {
      const client = await redisClient.getClient()
      const key = this.generateKey(prefix, identifier)
      const cached = await client.get(key)

      if (!cached) {
        return null
      }

      // Redis já cuida da expiração automática, então se o valor existe, é válido
      try {
        return JSON.parse(cached) as T
      } catch (parseError) {
        console.error('Cache parse error for key %s:', key, parseError)
        // Cache corrompido, remover
        await client.del(key)
        return null
      }
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set<T>(prefix: string, identifier: string, data: T, ttl?: number): Promise<void> {
    try {
      const client = await redisClient.getClient()
      const key = this.generateKey(prefix, identifier)
      const cacheTTL = ttl || this.defaultTTL

      // Redis cuida da expiração automaticamente com setEx
      await client.setEx(key, cacheTTL, JSON.stringify(data))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async delete(prefix: string, identifier: string): Promise<void> {
    try {
      const client = await redisClient.getClient()
      const key = this.generateKey(prefix, identifier)
      await client.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  // Helper to scan for keys matching a pattern
  private async scanKeys(client: RedisClientType, pattern: string): Promise<string[]> {
    let cursor = '0'
    const keys: string[] = []
    do {
      const result = await client.scan(cursor, { MATCH: pattern, COUNT: 100 })
      cursor = result.cursor
      keys.push(...result.keys)
    } while (cursor !== '0')
    return keys
  }

  async clear(prefix: string): Promise<void> {
    try {
      const client = await redisClient.getClient()
      const pattern = this.generateKey(prefix, '*')
      const keys = await this.scanKeys(client, pattern)

      if (keys.length > 0) {
        await client.del(keys)
        console.log(`Cache clear: Deleted ${keys.length} keys matching pattern ${pattern}`)
      } else {
        console.log(`Cache clear: No keys found matching pattern ${pattern}`)
      }
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  // Métodos específicos para posts resumidos (para listagens)
  async getCachedPosts(): Promise<PostSummary[] | null> {
    return this.get<PostSummary[]>('posts', 'all')
  }

  async setCachedPosts(posts: PostSummary[], ttl?: number): Promise<void> {
    return this.set('posts', 'all', posts, ttl)
  }

  async getCachedPost(slug: string): Promise<PostSummary | null> {
    return this.get<PostSummary>('post', slug)
  }

  async setCachedPost(slug: string, post: PostSummary, ttl?: number): Promise<void> {
    return this.set('post', slug, post, ttl)
  }

  async getCachedPostsByTag(tag: string): Promise<PostSummary[] | null> {
    return this.get<PostSummary[]>('tag', tag)
  }

  async setCachedPostsByTag(tag: string, posts: PostSummary[], ttl?: number): Promise<void> {
    return this.set('tag', tag, posts, ttl)
  }

  async getCachedPagedPosts(
    page: number,
    postsPerPage: number
  ): Promise<{ posts: PostSummary[]; pagination: PaginationData } | null> {
    return this.get<{ posts: PostSummary[]; pagination: PaginationData }>(
      'page',
      `${page}:${postsPerPage}`
    )
  }

  async setCachedPagedPosts(
    page: number,
    postsPerPage: number,
    data: { posts: PostSummary[]; pagination: PaginationData },
    ttl?: number
  ): Promise<void> {
    return this.set('page', `${page}:${postsPerPage}`, data, ttl)
  }

  // Métodos específicos para posts completos (para páginas individuais)
  async getCachedFullPost(slug: string): Promise<FullPost | null> {
    return this.get<FullPost>('full-post', slug)
  }

  async setCachedFullPost(slug: string, post: FullPost, ttl?: number): Promise<void> {
    return this.set('full-post', slug, post, ttl)
  }

  // Invalidar cache quando houver mudanças
  async invalidatePostCache(slug?: string): Promise<void> {
    // Agrupar operações para execução paralela
    const ops: Promise<void>[] = [this.clear('posts'), this.clear('page'), this.clear('tag')]

    if (slug) {
      // Se slug específico, remover apenas esse post
      ops.push(this.delete('post', slug))
      ops.push(this.delete('full-post', slug))
    } else {
      // Se não há slug, limpar todas as chaves post:* e full-post:*
      ops.push(this.clear('post'))
      ops.push(this.clear('full-post'))
    }

    // Executar todas as operações em paralelo
    await Promise.all(ops)
  }
}

const cacheService = new CacheService()
export default cacheService
