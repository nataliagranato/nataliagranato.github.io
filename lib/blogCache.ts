import { allBlogs, type Blog } from 'contentlayer/generated'
import { allCoreContent, sortPosts, type CoreContent } from 'pliny/utils/contentlayer'

export type PostSummary = CoreContent<Blog>
export type FullPost = Blog

// Função para obter dados do contentlayer processados como resumos
const getProcessedPosts = (): PostSummary[] => {
  try {
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

// Função para obter todos os posts (sem cache)
export async function getCachedPosts(): Promise<PostSummary[]> {
  return getProcessedPosts()
}

// Função para obter um post específico (sem cache)
export async function getCachedPost(slug: string): Promise<FullPost | null> {
  try {
    const post = allBlogs.find((p) => p.slug === slug)
    
    if (!post) {
      console.log(`Post ${slug} not found`)
      return null
    }

    return post
  } catch (error) {
    console.error(`Error loading post ${slug}:`, error)
    return null
  }
}

// Função para obter posts paginados (sem cache)
export async function getCachedPagedPosts(
  page: number,
  postsPerPage: number = 5
): Promise<{ posts: PostSummary[]; pagination: { currentPage: number; totalPages: number } }> {
  try {
    const allPosts = getProcessedPosts()
    const totalPages = Math.ceil(allPosts.length / postsPerPage)
    const startIndex = (page - 1) * postsPerPage
    const endIndex = startIndex + postsPerPage
    const posts = allPosts.slice(startIndex, endIndex)

    return {
      posts,
      pagination: {
        currentPage: page,
        totalPages,
      },
    }
  } catch (error) {
    console.error(`Error getting paged posts for page ${page}:`, error)
    return {
      posts: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
      },
    }
  }
}

// Função para obter posts por tag (sem cache)
export async function getCachedPostsByTag(tag: string): Promise<PostSummary[]> {
  try {
    const allPosts = getProcessedPosts()
    const filteredPosts = allPosts.filter((post) =>
      post.tags?.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
    )

    return filteredPosts
  } catch (error) {
    console.error(`Error getting posts by tag ${tag}:`, error)
    return []
  }
}
