import { unsubscribe } from '@/lib/newsletter/service.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function respond(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || ''
  const result = await unsubscribe(token)
  return new Response(result.html, {
    status: result.status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export function GET(request: Request) {
  return respond(request)
}

export function POST(request: Request) {
  return respond(request)
}
