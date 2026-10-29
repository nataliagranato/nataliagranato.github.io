import { allBlogs } from 'contentlayer/generated'
import { authorizePublish, publishNewPosts } from '@/lib/newsletter/service.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function postsFromContent() {
  return allBlogs.map((post) => ({
    slug: post.slug,
    title: post.title,
    summary: post.summary || '',
    date: post.date,
    draft: post.draft === true,
  }))
}

async function run(request: Request) {
  if (!authorizePublish(request)) {
    return Response.json({ ok: false, message: 'Não autorizado.' }, { status: 401 })
  }
  const result = await publishNewPosts(postsFromContent())
  return Response.json(result.body, {
    status: result.status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export function GET(request: Request) {
  return run(request)
}

export function POST(request: Request) {
  return run(request)
}
