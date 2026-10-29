import ListLayout from '@/layouts/ListLayoutWithTags'
import { getCachedPagedPosts } from '@/lib/blogCache'
import { genPageMetadata } from 'app/seo'

const POSTS_PER_PAGE = 5

export const metadata = genPageMetadata({
  title: 'Blog',
  description: 'Posts sobre Cloud Native, Kubernetes, observabilidade e engenharia de plataforma.',
  path: '/blog',
})

export default async function BlogPage() {
  const { posts, pagination } = await getCachedPagedPosts(1, POSTS_PER_PAGE)

  const initialDisplayPosts = posts

  return (
    <ListLayout
      posts={posts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title="Todos os posts"
    />
  )
}
