import ListLayout from '@/layouts/ListLayoutWithTags'
import { getCachedPagedPosts, getCachedPosts } from '@/lib/blogCache'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'

const POSTS_PER_PAGE = 5

export const generateStaticParams = async () => {
  const posts = await getCachedPosts()
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const paths = Array.from({ length: totalPages }, (_, i) => ({ page: (i + 1).toString() }))

  return paths
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>
}): Promise<Metadata> {
  const { page } = await params
  return genPageMetadata({
    title: `Blog — página ${page}`,
    description:
      'Posts sobre Cloud Native, Kubernetes, observabilidade e engenharia de plataforma.',
    path: `/blog/page/${page}`,
  })
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
      title="Todos os posts"
    />
  )
}
