import ListLayout from '@/layouts/ListLayoutWithTags'
import { getCachedPagedPosts, getCachedPosts } from '@/lib/blogCache'

const POSTS_PER_PAGE = 5

export const generateStaticParams = async () => {
  const posts = await getCachedPosts()
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const paths = Array.from({ length: totalPages }, (_, i) => ({ page: (i + 1).toString() }))

  return paths
}

export default async function Page({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const pageNumber = parseInt(page)
  const { posts, pagination } = await getCachedPagedPosts(pageNumber, POSTS_PER_PAGE)
  const allPosts = await getCachedPosts()

  const initialDisplayPosts = posts

  return (
    <ListLayout
      posts={allPosts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title="All Posts"
    />
  )
}
