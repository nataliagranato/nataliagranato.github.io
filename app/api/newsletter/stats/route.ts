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

    // Buscar emails enviados
    const emailsResponse = await fetch('https://api.buttondown.email/v1/emails', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    // Buscar assinantes
    const subscribersResponse = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!emailsResponse.ok || !subscribersResponse.ok) {
      console.error('Erro ao buscar estatísticas avançadas')
      return NextResponse.json(
        { error: 'Erro ao buscar estatísticas' },
        { status: 500 }
      )
    }

    const emailsData = await emailsResponse.json()
    const subscribersData = await subscribersResponse.json()
    
    const emails = emailsData.results || []
    const subscribers = subscribersData.results || []
    
    // Estatísticas de emails
    const totalEmails = emails.length
    const sentEmails = emails.filter(email => email.status === 'sent').length
    const draftEmails = emails.filter(email => email.status === 'draft').length
    const scheduledEmails = emails.filter(email => email.status === 'scheduled').length

    // Estatísticas de crescimento por mês
    const monthlyGrowth: Record<string, number> = {}
    subscribers.forEach(sub => {
      const date = new Date(sub.creation_date)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      monthlyGrowth[monthKey] = (monthlyGrowth[monthKey] || 0) + 1
    })

    // Taxa de abertura média (se disponível)
    const emailsWithStats = emails.filter(email => email.open_tracking_enabled && email.status === 'sent')
    
    const stats = {
      emails: {
        total: totalEmails,
        sent: sentEmails,
        draft: draftEmails,
        scheduled: scheduledEmails
      },
      subscribers: {
        total: subscribersData.count || 0,
        monthly_growth: monthlyGrowth
      },
      engagement: {
        total_emails_sent: sentEmails,
        avg_open_rate: emailsWithStats.length > 0 ? 'Disponível no dashboard' : 'Não disponível'
      },
      performance: {
        newsletter_health: sentEmails > 0 ? 'Ativa' : 'Inativa',
        last_email_sent: emails.length > 0 ? emails[0].creation_date : 'Nenhum email enviado'
      },
      last_updated: new Date().toISOString()
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Erro ao buscar estatísticas avançadas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
