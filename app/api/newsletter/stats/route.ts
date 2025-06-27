import { NextRequest, NextResponse } from 'next/server'

interface ButtondownSubscriber {
  id: string
  email_address: string
  subscriber_type: 'regular' | 'unactivated'
  creation_date: string
  tags?: string[]
}

interface ButtondownEmail {
  id: string
  subject: string
  body: string
  creation_date: string
  status: 'sent' | 'draft' | 'scheduled'
  open_tracking_enabled?: boolean
}

interface ButtondownResponse<T> {
  count: number
  next: string | null
  results: T[]
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

    // Função para buscar todos os emails com paginação
    const fetchAllEmails = async (): Promise<ButtondownEmail[]> => {
      let allEmails: ButtondownEmail[] = []
      let nextUrl: string | null = 'https://api.buttondown.email/v1/emails'
      
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Erro ao buscar emails: ${response.status}`)
        }

        const data: ButtondownResponse<ButtondownEmail> = await response.json()
        allEmails = allEmails.concat(data.results || [])
        nextUrl = data.next
      }
      
      return allEmails
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

        const data: ButtondownResponse<ButtondownSubscriber> = await response.json()
        allSubscribers = allSubscribers.concat(data.results || [])
        nextUrl = data.next
      }
      
      return allSubscribers
    }

    // Buscar todos os dados com paginação
    const [emails, subscribers] = await Promise.all([
      fetchAllEmails(),
      fetchAllSubscribers()
    ])
    
    // Calcular estatísticas de emails em uma única iteração (otimização de performance)
    const emailStats = emails.reduce((acc, email) => {
      // Contar por status
      switch (email.status) {
        case 'sent':
          acc.sent++
          break
        case 'draft':
          acc.draft++
          break
        case 'scheduled':
          acc.scheduled++
          break
      }
      
      // Verificar se tem tracking de abertura e está enviado
      if (email.open_tracking_enabled && email.status === 'sent') {
        acc.withStats++
      }
      
      return acc
    }, {
      sent: 0,
      draft: 0,
      scheduled: 0,
      withStats: 0
    })

    // Calcular estatísticas de crescimento por mês em uma única iteração
    const monthlyGrowth: Record<string, number> = {}
    subscribers.forEach(sub => {
      const date = new Date(sub.creation_date)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      monthlyGrowth[monthKey] = (monthlyGrowth[monthKey] || 0) + 1
    })
    
    // Ordenar emails por data para pegar o mais recente
    const sortedEmails = emails.sort((a, b) => new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime())
    
    const stats = {
      emails: {
        total: emails.length,
        sent: emailStats.sent,
        draft: emailStats.draft,
        scheduled: emailStats.scheduled
      },
      subscribers: {
        total: subscribers.length,
        monthly_growth: monthlyGrowth
      },
      engagement: {
        total_emails_sent: emailStats.sent,
        avg_open_rate: emailStats.withStats > 0 ? 'Disponível no dashboard' : 'Não disponível'
      },
      performance: {
        newsletter_health: emailStats.sent > 0 ? 'Ativa' : 'Inativa',
        last_email_sent: sortedEmails.length > 0 ? sortedEmails[0].creation_date : 'Nenhum email enviado'
      },
      pagination_info: {
        total_emails_fetched: emails.length,
        total_subscribers_fetched: subscribers.length,
        note: 'Todos os dados foram coletados com paginação completa'
      },
      last_updated: new Date().toISOString()
    }

    return NextResponse.json(stats)

  } catch (error) {
    // Log seguro apenas em desenvolvimento (sem dados sensíveis)
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar estatísticas avançadas:', error instanceof Error ? error.message : 'Erro desconhecido')
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
