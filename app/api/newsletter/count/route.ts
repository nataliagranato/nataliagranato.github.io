import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const API_KEY = process.env.BUTTONDOWN_API_KEY

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API Key não configurada' },
        { status: 500 }
      )
    }

    // Buscar apenas o número total de assinantes (mais rápido)
    const response = await fetch('https://api.buttondown.email/v1/subscribers?page_size=1', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // Log seguro apenas em desenvolvimento (sem dados sensíveis)
      if (process.env.NODE_ENV === 'development') {
        console.error(`Buttondown API error status: ${response.status}`)
      }
      return NextResponse.json(
        { error: 'Erro ao buscar dados do provedor' },
        { status: 502 } // Bad Gateway - erro do serviço externo
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      total: data.count || 0,
      status: 'ok',
      last_updated: new Date().toISOString()
    })

  } catch (error) {
    // Log seguro apenas em desenvolvimento (sem dados sensíveis)
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar contador de inscritos:', error instanceof Error ? error.message : 'Erro desconhecido')
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
