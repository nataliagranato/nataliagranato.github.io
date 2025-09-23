import { NextRequest, NextResponse } from 'next/server'
import { unsubscribeFromNewsletter, getSubscriberCount, getAllSubscribers } from '@/lib/newsletter-actions'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'unsubscribe': {
        const email = searchParams.get('email')
        const token = searchParams.get('token')
        
        if (!email || !token) {
          return NextResponse.json({ error: 'Email and token are required' }, { status: 400 })
        }
        
        const result = await unsubscribeFromNewsletter(email, token)
        
        // Return HTML page for unsubscribe
        const html = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cancelar Newsletter - Tech Preta</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; margin: 0; padding: 2rem; background: #f9fafb; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              .success { color: #059669; background: #d1fae5; padding: 1rem; border-radius: 4px; border-left: 4px solid #059669; }
              .error { color: #dc2626; background: #fee2e2; padding: 1rem; border-radius: 4px; border-left: 4px solid #dc2626; }
              .btn { display: inline-block; background: #3b82f6; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; margin-top: 1rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Newsletter - Tech Preta</h1>
              <div class="${result.success ? 'success' : 'error'}">
                <p><strong>${result.success ? 'Sucesso!' : 'Erro!'}</strong></p>
                <p>${result.message}</p>
              </div>
              <a href="/" class="btn">Voltar ao blog</a>
            </div>
          </body>
          </html>
        `
        
        return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html' },
        })
      }
      
      case 'count': {
        const count = await getSubscriberCount()
        return NextResponse.json({ count })
      }
      
      case 'subscribers': {
        // Admin only - in production you'd add authentication
        const subscribers = await getAllSubscribers()
        return NextResponse.json({ subscribers, count: subscribers.length })
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Newsletter API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Handle newsletter subscription via API (alternative to server actions)
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    
    // Create FormData to reuse existing server action
    const formData = new FormData()
    formData.set('email', email)
    
    const { subscribeToNewsletter } = await import('@/lib/newsletter-actions')
    const result = await subscribeToNewsletter(formData)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Newsletter subscription API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}