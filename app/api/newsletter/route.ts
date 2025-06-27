import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    const API_KEY = process.env.BUTTONDOWN_API_KEY

    if (!API_KEY) {
      console.error('BUTTONDOWN_API_KEY não configurada')
      return NextResponse.json(
        { error: 'Configuração do servidor incorreta' },
        { status: 500 }
      )
    }

    // Fazer requisição para a API do Buttondown
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        tags: ['website-signup']
      }),
    })

    const responseText = await response.text()
    console.log('Buttondown response:', response.status, responseText)

    if (response.status === 201) {
      return NextResponse.json({ message: 'Inscrito com sucesso!' })
    } else if (response.status === 400 || response.status === 422) {
      // Verifica se o email já está cadastrado
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { detail: 'Erro desconhecido' }
      }

      console.log('Error data:', errorData)

      // Verifica se é erro de email já existente
      if (errorData.code === 'email_already_exists') {
        return NextResponse.json(
          { error: 'Este email já está inscrito na newsletter!' },
          { status: 400 }
        )
      }
      
      // Para outros erros de validação
      const errorMessage = errorData.detail || errorData.detail?.[0]?.msg || 'Erro na validação do email'
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    } else {
      console.error('Erro na API do Buttondown:', response.status, responseText)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro no processamento da newsletter:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const API_KEY = process.env.BUTTONDOWN_API_KEY

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API Key não configurada' },
        { status: 500 }
      )
    }

    // Buscar estatísticas dos assinantes
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Erro ao buscar métricas:', response.status, await response.text())
      return NextResponse.json(
        { error: 'Erro ao buscar métricas' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Calcular métricas
    const totalSubscribers = data.count || 0
    const subscribers = data.results || []
    
    // Contar assinantes ativos vs pendentes
    const activeSubscribers = subscribers.filter(sub => sub.subscriber_type === 'regular').length
    const pendingSubscribers = subscribers.filter(sub => sub.subscriber_type === 'unactivated').length
    
    // Estatísticas por tags
    const tagStats = {}
    subscribers.forEach(sub => {
      if (sub.tags && Array.isArray(sub.tags)) {
        sub.tags.forEach(tag => {
          tagStats[tag] = (tagStats[tag] || 0) + 1
        })
      }
    })

    // Métricas de crescimento (últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentSubscribers = subscribers.filter(sub => {
      const createdDate = new Date(sub.creation_date)
      return createdDate >= thirtyDaysAgo
    }).length

    const metrics = {
      newsletter: {
        status: 'funcionando',
        provider: 'buttondown'
      },
      subscribers: {
        total: totalSubscribers,
        active: activeSubscribers,
        pending: pendingSubscribers,
        recent_30_days: recentSubscribers
      },
      growth: {
        last_30_days: recentSubscribers,
        growth_rate: totalSubscribers > 0 ? ((recentSubscribers / totalSubscribers) * 100).toFixed(2) + '%' : '0%'
      },
      tags: tagStats,
      last_updated: new Date().toISOString()
    }

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Erro ao buscar métricas da newsletter:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
