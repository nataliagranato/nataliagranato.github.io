import { NextRequest, NextResponse } from 'next/server'

interface ButtondownSubscriber {
  id: string
  email_address: string
  subscriber_type: 'regular' | 'unactivated'
  creation_date: string
  tags?: string[]
}

interface ButtondownResponse {
  count: number
  next: string | null
  results: ButtondownSubscriber[]
}

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
    
    // Log seguro apenas com status (sem dados sensíveis)
    if (process.env.NODE_ENV === 'development') {
      console.log('Buttondown API response status:', response.status)
    }

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

      // Log seguro apenas com tipos de erro (sem dados sensíveis)
      if (process.env.NODE_ENV === 'development') {
        console.log('Error type:', errorData.code || 'unknown')
      }

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
      // Log seguro apenas com status (sem dados sensíveis)
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro na API do Buttondown - Status:', response.status)
      }
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

  } catch (error) {
    // Log seguro apenas em desenvolvimento (sem dados sensíveis)
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro no processamento da newsletter:', error instanceof Error ? error.message : 'Erro desconhecido')
    }
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

    // Função para buscar todos os assinantes com paginação
    const fetchAllSubscribers = async (): Promise<ButtondownSubscriber[]> => {
      let allSubscribers: ButtondownSubscriber[] = []
      let nextUrl: string | null = 'https://api.buttondown.email/v1/subscribers'
      
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Erro ao buscar assinantes: ${response.status}`)
        }

        const data: ButtondownResponse = await response.json()
        allSubscribers = allSubscribers.concat(data.results || [])
        nextUrl = data.next // URL da próxima página, null se não houver mais páginas
      }
      
      return allSubscribers
    }

    const subscribers = await fetchAllSubscribers()
    const totalSubscribers = subscribers.length
    
    // Calcular todas as métricas em uma única iteração (otimização de performance)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const metrics = subscribers.reduce((acc, sub) => {
      // Contar por tipo de assinante
      if (sub.subscriber_type === 'regular') {
        acc.activeSubscribers++
      } else if (sub.subscriber_type === 'unactivated') {
        acc.pendingSubscribers++
      }
      
      // Contar assinantes recentes (últimos 30 dias)
      const createdDate = new Date(sub.creation_date)
      if (createdDate >= thirtyDaysAgo) {
        acc.recentSubscribers++
      }
      
      // Contar tags
      if (sub.tags && Array.isArray(sub.tags)) {
        sub.tags.forEach(tag => {
          acc.tagStats[tag] = (acc.tagStats[tag] || 0) + 1
        })
      }
      
      return acc
    }, {
      activeSubscribers: 0,
      pendingSubscribers: 0,
      recentSubscribers: 0,
      tagStats: {} as Record<string, number>
    })

    const newsletterMetrics = {
      newsletter: {
        status: 'funcionando',
        provider: 'buttondown'
      },
      subscribers: {
        total: totalSubscribers,
        active: metrics.activeSubscribers,
        pending: metrics.pendingSubscribers,
        recent_30_days: metrics.recentSubscribers
      },
      growth: {
        last_30_days: metrics.recentSubscribers,
        growth_rate: totalSubscribers > 0 ? ((metrics.recentSubscribers / totalSubscribers) * 100).toFixed(2) + '%' : '0%'
      },
      tags: metrics.tagStats,
      last_updated: new Date().toISOString()
    }

    return NextResponse.json(newsletterMetrics)

  } catch (error) {
    // Log seguro apenas em desenvolvimento (sem dados sensíveis)
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar métricas da newsletter:', error instanceof Error ? error.message : 'Erro desconhecido')
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
