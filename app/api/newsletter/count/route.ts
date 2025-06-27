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
      console.error(`Buttondown API error: ${response.status} ${await response.text()}`)
      return NextResponse.json(
        { error: 'Error fetching data from Buttondown' },
        { status: 502 } // Bad Gateway
      )
    }
    }

    const data = await response.json()
    
    return NextResponse.json({
      total: data.count || 0,
      status: 'ok',
      last_updated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar contador de inscritos:', error)
    return NextResponse.json(
      { total: 0, status: 'error' },
      { status: 200 }
    )
  }
}
