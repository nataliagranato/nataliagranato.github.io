'use server'

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

// Simple in-memory storage for demonstration
// In production, you'd use a proper database or Redis with custom keys
const subscribers = new Map<string, NewsletterSubscriber>()
let subscriberCount = 0

// Generate a random token for unsubscribe functionality
function generateUnsubscribeToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Custom newsletter subscription function (stores locally in memory)
async function subscribeToCustomNewsletter(email: string): Promise<NewsletterResult> {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    
    // Check if already subscribed
    if (subscribers.has(normalizedEmail)) {
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
    
    // Store subscriber
    subscribers.set(normalizedEmail, subscriber)
    subscriberCount++
    
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
  return subscriberCount
}

// Get all subscribers (admin function)
export async function getAllSubscribers(): Promise<string[]> {
  return Array.from(subscribers.keys())
}

// Unsubscribe function
export async function unsubscribeFromNewsletter(email: string, token: string): Promise<NewsletterResult> {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    
    // Get subscriber data
    const subscriber = subscribers.get(normalizedEmail)
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
    subscribers.delete(normalizedEmail)
    subscriberCount = Math.max(0, subscriberCount - 1)
    
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

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Simple rate limiting
function checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 60000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)
  
  if (!record || now > record.resetTime) {
    // First attempt or window expired
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxAttempts) {
    return false // Rate limit exceeded
  }
  
  record.count++
  return true
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
  
  // Rate limiting - prevent spam (max 5 subscriptions per minute)
  const userAgent = formData.get('userAgent') as string || 'unknown'
  const rateLimitKey = `newsletter:ratelimit:${userAgent}`
  
  if (!checkRateLimit(rateLimitKey)) {
    return {
      success: false,
      message: 'Muitas tentativas. Tente novamente em alguns minutos.',
      error: 'Rate limit exceeded',
    }
  }
  
  try {
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