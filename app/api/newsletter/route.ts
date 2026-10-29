import { clientIp, subscribe } from '@/lib/newsletter/service.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let payload: { email?: string; company?: string } = {}
  const contentType = request.headers.get('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      payload = await request.json()
    } else {
      const form = await request.formData()
      payload = {
        email: String(form.get('email') || ''),
        company: String(form.get('company') || ''),
      }
    }
  } catch {
    return Response.json({ ok: false, message: 'Pedido inválido.' }, { status: 400 })
  }

  try {
    const result = await subscribe({
      email: payload.email,
      honeypot: payload.company,
      ip: clientIp(request),
    })
    return Response.json(result.body, {
      status: result.status,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { ok: false, message: 'Serviço indisponível no momento. Tente novamente em instantes.' },
      { status: 503 }
    )
  }
}
