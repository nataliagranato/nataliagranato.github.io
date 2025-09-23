'use server'

import { cacheService } from '@/lib/cache'

// Newsletter subscription result type
export type NewsletterResult = {
  success: boolean
  message: string
  error?: string
}

// Newsletter subscriber type
export type NewsletterSubscriber = {
  email: string
  subscribedAt: string
  confirmed: boolean
  unsubscribeToken: string
}

// Generate a random token for unsubscribe functionality
function generateUnsubscribeToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Custom newsletter subscription function (stores locally in Redis)
async function subscribeToCustomNewsletter(email: string): Promise<NewsletterResult> {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    const subscriberKey = `newsletter:subscriber:${normalizedEmail}`
    
    // Check if already subscribed
    const existingSubscriber = await cacheService.get(subscriberKey)
    if (existingSubscriber) {
      return {
        success: false,
        message: 'Este email já está inscrito na newsletter',
        error: 'Email already subscribed',
      }
    }
    
    // Create new subscriber
    const subscriber: NewsletterSubscriber = {
      email: normalizedEmail,
      subscribedAt: new Date().toISOString(),
      confirmed: true, // Auto-confirm for simplicity
      unsubscribeToken: generateUnsubscribeToken(),
    }
    
    // Store subscriber in Redis
    await cacheService.set(subscriberKey, subscriber, 60 * 60 * 24 * 365) // 1 year TTL
    
    // Add to subscribers list
    const allSubscribersKey = 'newsletter:subscribers:list'
    const subscribersList = await cacheService.get(allSubscribersKey) || []
    const updatedList = [...subscribersList, normalizedEmail]
    await cacheService.set(allSubscribersKey, updatedList, 60 * 60 * 24 * 365)
    
    // Update subscriber count
    const countKey = 'newsletter:subscribers:count'
    const currentCount = await cacheService.get(countKey) || 0
    await cacheService.set(countKey, currentCount + 1, 60 * 60 * 24 * 365)
    
    console.log(`Newsletter subscription: ${normalizedEmail} subscribed successfully`)
    
    return {
      success: true,
      message: 'Inscrição realizada com sucesso! Obrigado por se inscrever na nossa newsletter.',
    }
  } catch (error) {
    console.error('Custom newsletter subscription error:', error)
    return {
      success: false,
      message: 'Erro interno do servidor. Tente novamente mais tarde.',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Get subscriber count
export async function getSubscriberCount(): Promise<number> {
  try {
    const count = await cacheService.get('newsletter:subscribers:count')
    return count || 0
  } catch (error) {
    console.error('Error getting subscriber count:', error)
    return 0
  }
}

// Get all subscribers (admin function)
export async function getAllSubscribers(): Promise<string[]> {
  try {
    const subscribers = await cacheService.get('newsletter:subscribers:list')
    return subscribers || []
  } catch (error) {
    console.error('Error getting subscribers list:', error)
    return []
  }
}

// Unsubscribe function
export async function unsubscribeFromNewsletter(email: string, token: string): Promise<NewsletterResult> {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    const subscriberKey = `newsletter:subscriber:${normalizedEmail}`
    
    // Get subscriber data
    const subscriber = await cacheService.get(subscriberKey) as NewsletterSubscriber | null
    if (!subscriber) {
      return {
        success: false,
        message: 'Email não encontrado na lista de inscritos',
        error: 'Email not found',
      }
    }
    
    // Verify unsubscribe token
    if (subscriber.unsubscribeToken !== token) {
      return {
        success: false,
        message: 'Token inválido para cancelar inscrição',
        error: 'Invalid unsubscribe token',
      }
    }
    
    // Remove subscriber
    await cacheService.delete(subscriberKey)
    
    // Remove from subscribers list
    const allSubscribersKey = 'newsletter:subscribers:list'
    const subscribersList = await cacheService.get(allSubscribersKey) || []
    const updatedList = subscribersList.filter((sub: string) => sub !== normalizedEmail)
    await cacheService.set(allSubscribersKey, updatedList, 60 * 60 * 24 * 365)
    
    // Update subscriber count
    const countKey = 'newsletter:subscribers:count'
    const currentCount = await cacheService.get(countKey) || 0
    await cacheService.set(countKey, Math.max(0, currentCount - 1), 60 * 60 * 24 * 365)
    
    console.log(`Newsletter unsubscription: ${normalizedEmail} unsubscribed successfully`)
    
    return {
      success: true,
      message: 'Inscrição cancelada com sucesso. Sentiremos sua falta!',
    }
  } catch (error) {
    console.error('Newsletter unsubscription error:', error)
    return {
      success: false,
      message: 'Erro interno do servidor. Tente novamente mais tarde.',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Main newsletter subscription server action
export async function subscribeToNewsletter(formData: FormData): Promise<NewsletterResult> {
  const email = formData.get('email') as string
  
  // Validate email
  if (!email) {
    return {
      success: false,
      message: 'Email é obrigatório',
      error: 'Email is required',
    }
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      success: false,
      message: 'Por favor, insira um endereço de email válido',
      error: 'Invalid email format',
    }
  }
  
  // Rate limiting - prevent spam (max 5 subscriptions per minute per IP)
  const userAgent = formData.get('userAgent') as string || 'unknown'
  const rateLimitKey = `newsletter:ratelimit:${userAgent}`
  
  try {
    const currentAttempts = await cacheService.get(rateLimitKey) || 0
    if (currentAttempts >= 5) {
      return {
        success: false,
        message: 'Muitas tentativas. Tente novamente em alguns minutos.',
        error: 'Rate limit exceeded',
      }
    }
    
    // Increment rate limit counter
    await cacheService.set(rateLimitKey, currentAttempts + 1, 60) // 1 minute TTL
    
    // Use custom newsletter system
    return await subscribeToCustomNewsletter(email)
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    
    return {
      success: false,
      message: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Alternative action that accepts email directly (for programmatic usage)
export async function subscribeEmail(email: string): Promise<NewsletterResult> {
  const formData = new FormData()
  formData.set('email', email)
  return subscribeToNewsletter(formData)
}