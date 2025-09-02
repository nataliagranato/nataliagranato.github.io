import redisClient from './redis'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'

export interface CacheEntry<T> {
    data: T
    timestamp: number
    ttl: number
}

interface PaginationData {
    currentPage: number
    totalPages: number
    totalPosts: number
    postsPerPage: number
}

// Usar o tipo correto do contentlayer
export type Post = CoreContent<Blog>

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

            const parsed: CacheEntry<T> = JSON.parse(cached)

            // Verificar se o cache expirou
            const now = Date.now()
            if (now > parsed.timestamp + parsed.ttl * 1000) {
                await this.delete(prefix, identifier)
                return null
            }

            return parsed.data
        } catch (error) {
            console.error('Cache get error:', error)
            return null
        }
    }

    async set<T>(prefix: string, identifier: string, data: T, ttl?: number): Promise<void> {
        try {
            const client = await redisClient.getClient()
            const key = this.generateKey(prefix, identifier)
            const cacheEntry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                ttl: ttl || this.defaultTTL,
            }

            await client.setEx(key, cacheEntry.ttl, JSON.stringify(cacheEntry))
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
    private async scanKeys(client: any, pattern: string): Promise<string[]> {
        let cursor = '0';
        let keys: string[] = [];
        do {
            const [nextCursor, foundKeys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            keys.push(...foundKeys);
        } while (cursor !== '0');
        return keys;
    }

    async clear(prefix: string): Promise<void> {
        try {
            const client = await redisClient.getClient()
            const pattern = this.generateKey(prefix, '*')
            const keys = await this.scanKeys(client, pattern)

            if (keys.length > 0) {
                await client.del(keys)
            }
        } catch (error) {
            console.error('Cache clear error:', error)
        }
    }

    // Métodos específicos para o blog
    async getCachedPosts(): Promise<Post[] | null> {
        return this.get<Post[]>('posts', 'all')
    }

    async setCachedPosts(posts: Post[], ttl?: number): Promise<void> {
        return this.set('posts', 'all', posts, ttl)
    }

    async getCachedPost(slug: string): Promise<Post | null> {
        return this.get<Post>('post', slug)
    }

    async setCachedPost(slug: string, post: Post, ttl?: number): Promise<void> {
        return this.set('post', slug, post, ttl)
    }

    async getCachedPostsByTag(tag: string): Promise<Post[] | null> {
        return this.get<Post[]>('tag', tag)
    }

    async setCachedPostsByTag(tag: string, posts: Post[], ttl?: number): Promise<void> {
        return this.set('tag', tag, posts, ttl)
    }

    async getCachedPagedPosts(
        page: number
    ): Promise<{ posts: Post[]; pagination: PaginationData } | null> {
        return this.get<{ posts: Post[]; pagination: PaginationData }>('page', page.toString())
    }

    async setCachedPagedPosts(
        page: number,
        data: { posts: Post[]; pagination: PaginationData },
        ttl?: number
    ): Promise<void> {
        return this.set('page', page.toString(), data, ttl)
    }

    // Invalidar cache quando houver mudanças
    async invalidatePostCache(slug?: string): Promise<void> {
        await this.clear('posts')
        await this.clear('page')
        await this.clear('tag')

        if (slug) {
            await this.delete('post', slug)
        }
    }
}

const cacheService = new CacheService()
export default cacheService
