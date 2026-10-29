import { confirmSubscription } from '@/lib/newsletter/service.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || ''
  const result = await confirmSubscription(token)
  return new Response(result.html, {
    status: result.status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
