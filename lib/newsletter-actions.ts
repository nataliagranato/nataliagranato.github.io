'use server'

import siteMetadata from '@/data/siteMetadata'

// Newsletter subscription result type
export type NewsletterResult = {
  success: boolean
  message: string
  error?: string
}

// Buttondown subscription function
async function buttondownSubscribe(email: string): Promise<Response> {
  const API_KEY = process.env.BUTTONDOWN_API_KEY
  const API_URL = 'https://api.buttondown.email/v1/'
  const buttondownRoute = `${API_URL}subscribers`

  const data = { email_address: email }

  const response = await fetch(buttondownRoute, {
    body: JSON.stringify(data),
    headers: {
      Authorization: `Token ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  return response
}

// MailChimp subscription function
async function mailchimpSubscribe(email: string): Promise<Response> {
  const API_KEY = process.env.MAILCHIMP_API_KEY
  const API_SERVER = process.env.MAILCHIMP_API_SERVER
  const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID

  const url = `https://${API_SERVER}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`

  const data = {
    email_address: email,
    status: 'subscribed',
  }

  const response = await fetch(url, {
    body: JSON.stringify(data),
    headers: {
      Authorization: `apikey ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  return response
}

// ConvertKit subscription function
async function convertkitSubscribe(email: string): Promise<Response> {
  const API_KEY = process.env.CONVERTKIT_API_KEY
  const FORM_ID = process.env.CONVERTKIT_FORM_ID

  const url = `https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe`

  const data = {
    api_key: API_KEY,
    email,
  }

  const response = await fetch(url, {
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  return response
}

// Klaviyo subscription function
async function klaviyoSubscribe(email: string): Promise<Response> {
  const API_KEY = process.env.KLAVIYO_API_KEY
  const LIST_ID = process.env.KLAVIYO_LIST_ID

  const url = `https://a.klaviyo.com/api/v2/list/${LIST_ID}/subscribe`

  const data = {
    profiles: [{ email }],
  }

  const response = await fetch(url, {
    body: JSON.stringify(data),
    headers: {
      Authorization: `Klaviyo-API-Key ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  return response
}

// EmailOctopus subscription function
async function emailOctopusSubscribe(email: string): Promise<Response> {
  const API_KEY = process.env.EMAILOCTOPUS_API_KEY
  const LIST_ID = process.env.EMAILOCTOPUS_LIST_ID

  const url = `https://emailoctopus.com/api/1.6/lists/${LIST_ID}/contacts`

  const data = {
    api_key: API_KEY,
    email_address: email,
  }

  const response = await fetch(url, {
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  return response
}

// Main newsletter subscription server action
export async function subscribeToNewsletter(formData: FormData): Promise<NewsletterResult> {
  const email = formData.get('email') as string

  // Validate email
  if (!email) {
    return {
      success: false,
      message: 'Email is required',
      error: 'Email is required',
    }
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      success: false,
      message: 'Please enter a valid email address',
      error: 'Invalid email format',
    }
  }

  try {
    let response: Response
    const provider = siteMetadata.newsletter?.provider

    switch (provider) {
      case 'buttondown':
        response = await buttondownSubscribe(email)
        break
      case 'convertkit':
        response = await convertkitSubscribe(email)
        break
      case 'mailchimp':
        response = await mailchimpSubscribe(email)
        break
      case 'klaviyo':
        response = await klaviyoSubscribe(email)
        break
      case 'emailoctopus':
        response = await emailOctopusSubscribe(email)
        break
      default:
        return {
          success: false,
          message: `Newsletter provider "${provider}" is not supported`,
          error: `Unsupported provider: ${provider}`,
        }
    }

    if (response.status >= 400) {
      // Try to get error message from response
      let errorMessage = 'There was an error subscribing to the newsletter'
      try {
        const errorData = await response.json()
        if (errorData.detail || errorData.error || errorData.message) {
          errorMessage = errorData.detail || errorData.error || errorData.message
        }
      } catch {
        // Ignore JSON parsing errors, use default message
      }

      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      }
    }

    return {
      success: true,
      message: 'Successfully subscribed to the newsletter!',
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error)

    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
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
