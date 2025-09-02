import cacheService, { PostSummary, FullPost } from './cache'
import { allBlogs } from 'contentlayer/generated'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'

// Função para obter dados do contentlayer processados como resumos
const getProcessedPosts = (): PostSummary[] => {
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
export async function getCachedPosts(): Promise<PostSummary[]> {
    try {
        // Tentar obter do cache primeiro
        const cachedPosts = await cacheService.getCachedPosts()

        if (cachedPosts) {
            console.log('Posts loaded from cache')
            // Verificar se é um array válido
            if (Array.isArray(cachedPosts)) {
                return cachedPosts
            } else {
                console.error('Cached posts is not an array:', typeof cachedPosts, cachedPosts)
                // Cache corrompido, invalidar e refazer
                await cacheService.invalidatePostCache()
            }
        }

        // Se não estiver no cache ou cache corrompido, buscar do contentlayer
        console.log('Loading posts from contentlayer and caching...')
        const posts = getProcessedPosts()

        // Verificar se getProcessedPosts retorna um array válido
        if (!Array.isArray(posts)) {
            console.error('getProcessedPosts returned non-array:', typeof posts, posts)
            return []
        }

        try {
            // Tentar cachear os posts (operação separada que pode falhar)
            await cacheService.setCachedPosts(posts, 3600)
        } catch (cacheError) {
            // Log do erro de cache, mas não interrompe o fluxo
            console.error('Error caching posts:', cacheError)
        }

        return posts
    } catch (error) {
        console.error('Error in getCachedPosts:', error)
        // Fallback direto para contentlayer em caso de erro crítico
        try {
            const fallbackPosts = getProcessedPosts()
            return Array.isArray(fallbackPosts) ? fallbackPosts : []
        } catch (fallbackError) {
            console.error('Fallback error:', fallbackError)
            return []
        }
    }
}

// Função para obter posts completos (com body) do contentlayer
const getFullPosts = (): FullPost[] => {
    try {
        // Retornar posts completos sem processar com allCoreContent
        const filteredPosts = allBlogs.filter((post) => {
            return process.env.NODE_ENV === 'development' || !post.draft
        })
        return sortPosts(filteredPosts)
    } catch (error) {
        console.error('Error processing full posts:', error)
        return []
    }
}

// Função para obter um post específico com cache (versão completa para páginas individuais)
export async function getCachedPost(slug: string): Promise<FullPost | undefined> {
    try {
        // Tentar obter do cache primeiro (cache específico para posts completos)
        const cachedPost = await cacheService.getCachedFullPost(slug)

        if (cachedPost) {
            console.log(`Full post ${slug} loaded from cache`)
            return cachedPost
        }

        // Se não estiver no cache, buscar do contentlayer (posts completos)
        console.log(`Loading full post ${slug} from contentlayer and caching...`)
        const allFullPosts = getFullPosts()
        const post = allFullPosts.find((p) => p.slug === slug)

        if (post) {
            try {
                // Cachear o post completo por 1 hora (3600 segundos)
                await cacheService.setCachedFullPost(slug, post, 3600)
            } catch (cacheError) {
                // Log do erro de cache, mas não interrompe o fluxo
                console.error(`Error caching full post ${slug}:`, cacheError)
            }
        }

        return post
    } catch (error) {
        console.error(`Error in getCachedPost for ${slug}:`, error)
        // Fallback direto para contentlayer em caso de erro crítico
        try {
            const allFullPosts = getFullPosts()
            return allFullPosts.find((p) => p.slug === slug)
        } catch (fallbackError) {
            console.error(`Fallback error for ${slug}:`, fallbackError)
            return undefined
        }
    }
}

// Função para normalizar tags (handle accents, spaces, etc.)
function normalizeTag(tag: string): string {
    return tag
        .toLowerCase()
        .normalize('NFD') // Decompose characters with accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .trim()
}

// Função para obter posts por tag com cache
export async function getCachedPostsByTag(tag: string): Promise<PostSummary[]> {
    try {
        // Tentar obter do cache primeiro
        const cachedPosts = await cacheService.getCachedPostsByTag(tag)

        if (cachedPosts) {
            console.log(`Posts for tag ${tag} loaded from cache`)
            return cachedPosts
        }

        // Se não estiver no cache, buscar do contentlayer
        console.log(`Loading posts for tag ${tag} from contentlayer and caching...`)
        const allPosts = getProcessedPosts()
        const normalizedTag = normalizeTag(tag)
        const filteredPosts = allPosts.filter((post) =>
            post.tags?.some((t) => normalizeTag(t) === normalizedTag)
        )

        try {
            // Tentar cachear os posts (operação separada que pode falhar)
            await cacheService.setCachedPostsByTag(tag, filteredPosts, 1800)
        } catch (cacheError) {
            // Log do erro de cache, mas não interrompe o fluxo
            console.error(`Error caching posts for tag ${tag}:`, cacheError)
        }

        return filteredPosts
    } catch (error) {
        console.error(`Error in getCachedPostsByTag for ${tag}:`, error)
        // Fallback direto para contentlayer em caso de erro crítico
        try {
            const allPosts = getProcessedPosts()
            const normalizedTag = normalizeTag(tag)
            return allPosts.filter((post) => post.tags?.some((t) => normalizeTag(t) === normalizedTag))
        } catch (fallbackError) {
            console.error(`Fallback error for tag ${tag}:`, fallbackError)
            return []
        }
    }
}

// Função para obter posts paginados com cache
export async function getCachedPagedPosts(
    page: number,
    postsPerPage: number = 5
): Promise<{
    posts: PostSummary[]
    pagination: {
        currentPage: number
        totalPages: number
        totalPosts: number
        postsPerPage: number
    }
}> {
    try {
        // Tentar obter do cache primeiro
        const cachedData = await cacheService.getCachedPagedPosts(page, postsPerPage)

        if (cachedData) {
            console.log(`Paged posts for page ${page} (${postsPerPage} per page) loaded from cache`)
            return cachedData
        }

        // Se não estiver no cache, buscar do contentlayer
        console.log(`Loading paged posts for page ${page} (${postsPerPage} per page) from contentlayer and caching...`)
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

        try {
            // Tentar cachear os dados (operação separada que pode falhar)
            await cacheService.setCachedPagedPosts(page, postsPerPage, data, 1800)
        } catch (cacheError) {
            // Log do erro de cache, mas não interrompe o fluxo
            console.error(`Error caching paged posts for page ${page} (${postsPerPage} per page):`, cacheError)
        }

        return data
    } catch (error) {
        console.error(`Error in getCachedPagedPosts for page ${page}:`, error)
        // Fallback direto para contentlayer em caso de erro crítico
        try {
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
        } catch (fallbackError) {
            console.error(`Fallback error for page ${page}:`, fallbackError)
            // Retornar dados vazios em caso de erro crítico
            return {
                posts: [],
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalPosts: 0,
                    postsPerPage,
                },
            }
        }
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
