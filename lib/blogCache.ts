import cacheService, { Post } from './cache'
import { allBlogs } from '../.contentlayer/generated'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'

// Função para obter dados do contentlayer processados
const getProcessedPosts = (): Post[] => {
    try {
        // Usar as funções utilitárias do pliny para processar os posts
        const filteredPosts = allBlogs.filter((post) => {
            return process.env.NODE_ENV === 'development' || !post.draft
        })

        const sortedPosts = sortPosts(filteredPosts)
        const coreContentPosts = allCoreContent(sortedPosts)

        return coreContentPosts
    } catch (error) {
        console.error('Error processing posts:', error)
        return []
    }
}

// Função para obter todos os posts com cache
export async function getCachedPosts(): Promise<Post[]> {
    try {
        // Tentar obter do cache primeiro
        const cachedPosts = await cacheService.getCachedPosts()

        if (cachedPosts) {
            console.log('Posts loaded from cache')
            return cachedPosts
        }

        // Se não estiver no cache, buscar do contentlayer e cachear
        console.log('Loading posts from contentlayer and caching...')
        const posts = getProcessedPosts()

        // Cachear por 1 hora (3600 segundos)
        await cacheService.setCachedPosts(posts, 3600)

        return posts
    } catch (error) {
        console.error('Error in getCachedPosts:', error)
        // Fallback para contentlayer em caso de erro com o cache
        return getProcessedPosts()
    }
}

// Função para obter um post específico com cache
export async function getCachedPost(slug: string): Promise<Post | undefined> {
    try {
        // Tentar obter do cache primeiro
        const cachedPost = await cacheService.getCachedPost(slug)

        if (cachedPost) {
            console.log(`Post ${slug} loaded from cache`)
            return cachedPost
        }

        // Se não estiver no cache, buscar do contentlayer e cachear
        console.log(`Loading post ${slug} from contentlayer and caching...`)
        const allPosts = getProcessedPosts()
        const post = allPosts.find((p) => p.slug === slug)

        if (post) {
            // Cachear por 1 hora (3600 segundos)
            await cacheService.setCachedPost(slug, post, 3600)
        }

        return post
    } catch (error) {
        console.error(`Error in getCachedPost for ${slug}:`, error)
        // Fallback para contentlayer em caso de erro com o cache
        const allPosts = getProcessedPosts()
        return allPosts.find((p) => p.slug === slug)
    }
}

// Função para obter posts por tag com cache
export async function getCachedPostsByTag(tag: string): Promise<Post[]> {
    try {
        // Tentar obter do cache primeiro
        const cachedPosts = await cacheService.getCachedPostsByTag(tag)

        if (cachedPosts) {
            console.log(`Posts for tag ${tag} loaded from cache`)
            return cachedPosts as Post[]
        }

        // Se não estiver no cache, buscar do contentlayer e cachear
        console.log(`Loading posts for tag ${tag} from contentlayer and caching...`)
        const allPosts = getProcessedPosts()
        const filteredPosts = allPosts.filter((post) =>
            post.tags?.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
        )

        // Cachear por 30 minutos (1800 segundos)
        await cacheService.setCachedPostsByTag(tag, filteredPosts, 1800)

        return filteredPosts
    } catch (error) {
        console.error(`Error in getCachedPostsByTag for ${tag}:`, error)
        // Fallback para contentlayer em caso de erro com o cache
        const allPosts = getProcessedPosts()
        return allPosts.filter((post) =>
            post.tags?.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
        )
    }
}

// Função para obter posts paginados com cache
export async function getCachedPagedPosts(
    page: number,
    postsPerPage: number = 5
): Promise<{
    posts: Post[]
    pagination: {
        currentPage: number
        totalPages: number
        totalPosts: number
        postsPerPage: number
    }
}> {
    try {
        // Tentar obter do cache primeiro
        const cachedData = await cacheService.getCachedPagedPosts(page)

        if (cachedData) {
            console.log(`Paged posts for page ${page} loaded from cache`)
            return cachedData as {
                posts: Post[]
                pagination: {
                    currentPage: number
                    totalPages: number
                    totalPosts: number
                    postsPerPage: number
                }
            }
        }

        // Se não estiver no cache, buscar do contentlayer e cachear
        console.log(`Loading paged posts for page ${page} from contentlayer and caching...`)
        const allPosts = getProcessedPosts()
        const startIndex = postsPerPage * (page - 1)
        const endIndex = postsPerPage * page

        const posts = allPosts.slice(startIndex, endIndex)
        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(allPosts.length / postsPerPage),
            totalPosts: allPosts.length,
            postsPerPage,
        }

        const data = { posts, pagination }

        // Cachear por 30 minutos (1800 segundos)
        await cacheService.setCachedPagedPosts(page, data, 1800)

        return data
    } catch (error) {
        console.error(`Error in getCachedPagedPosts for page ${page}:`, error)
        // Fallback para contentlayer em caso de erro com o cache
        const allPosts = getProcessedPosts()
        const startIndex = postsPerPage * (page - 1)
        const endIndex = postsPerPage * page

        const posts = allPosts.slice(startIndex, endIndex)
        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(allPosts.length / postsPerPage),
            totalPosts: allPosts.length,
            postsPerPage,
        }

        return { posts, pagination }
    }
}

// Função para invalidar cache (útil para desenvolvimento ou atualizações de conteúdo)
export async function invalidateBlogCache(slug?: string): Promise<void> {
    try {
        await cacheService.invalidatePostCache(slug)
        console.log(slug ? `Cache invalidated for post: ${slug}` : 'All cache invalidated')
    } catch (error) {
        console.error('Error invalidating cache:', error)
    }
}
