import { NextRequest, NextResponse } from 'next/server'
import cacheService from '../../../lib/cache'

// Configuração de segurança
const CACHE_API_KEY = process.env.CACHE_API_KEY || 'dev-only-key'
const ALLOWED_IPS = process.env.CACHE_ALLOWED_IPS?.split(',') || []

// Rate limiting simples (em produção, usar uma solução mais robusta)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 10 // Máximo 10 requests por minuto

function getRealIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  record.count++
  return true
}

function validateRequest(request: NextRequest): NextResponse | null {
  // Verificar se está em desenvolvimento (permite acesso total)
  if (process.env.NODE_ENV === 'development') {
    return null // Permitir acesso
  }

  // Em produção, verificar API key
  const apiKey =
    request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')

  if (!apiKey || apiKey !== CACHE_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing API key' }, { status: 401 })
  }

  // Verificar IP se configurado
  if (ALLOWED_IPS.length > 0) {
    const clientIP = getRealIP(request)
    if (!ALLOWED_IPS.includes(clientIP)) {
      return NextResponse.json({ error: 'Forbidden: IP not allowed' }, { status: 403 })
    }
  }

  // Rate limiting
  const clientIP = getRealIP(request)
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json({ error: 'Too Many Requests: Rate limit exceeded' }, { status: 429 })
  }

  return null // Request válido
}

// Função adicional para validar operações de mutação (POST/DELETE)
function validateMutationRequest(request: NextRequest): NextResponse | null {
  // Verificar autenticação básica primeiro
  const basicValidation = validateRequest(request)
  if (basicValidation) {
    return basicValidation
  }

  // Em desenvolvimento, não exigir token de admin
  if (process.env.NODE_ENV === 'development') {
    return null
  }

  // Em produção, exigir token de admin para mutações
  const adminToken = request.headers.get('x-cache-admin')
  if (!adminToken || adminToken !== process.env.CACHE_ADMIN_TOKEN) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin token required for cache mutations' },
      { status: 401 }
    )
  }

  return null
}

// Função helper para validar e parsear chaves do cache
function parseKeyParameter(key: string | null): {
  prefix: string
  identifier: string
  error?: NextResponse
} {
  if (!key) {
    return {
      prefix: '',
      identifier: '',
      error: NextResponse.json({ error: 'Key parameter is required' }, { status: 400 }),
    }
  }

  const idx = key.indexOf(':')
  if (idx === -1 || idx === 0 || idx === key.length - 1) {
    return {
      prefix: '',
      identifier: '',
      error: NextResponse.json(
        { error: 'Key parameter must be in "prefix:identifier" format (e.g., "posts:all")' },
        { status: 400 }
      ),
    }
  }

  const prefix = key.slice(0, idx)
  const identifier = key.slice(idx + 1)

  return {
    prefix,
    identifier,
  }
}

export async function GET(request: NextRequest) {
  // Validar segurança
  const securityError = validateRequest(request)
  if (securityError) return securityError
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const key = searchParams.get('key')

    switch (action) {
      case 'status': {
        return NextResponse.json({
          status: 'Redis cache is running',
          timestamp: new Date().toISOString(),
        })
      }

      case 'get': {
        const keyResult = parseKeyParameter(key)
        if (keyResult.error) return keyResult.error

        const data = await cacheService.get(keyResult.prefix, keyResult.identifier)
        return NextResponse.json({ data })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Cache API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Validar segurança com token de admin para mutações
  const securityError = validateMutationRequest(request)
  if (securityError) return securityError

  try {
    const body = await request.json()
    const { action, key, data, ttl } = body

    switch (action) {
      case 'set': {
        // Validação mais robusta: aceitar valores falsy válidos como 0, false, ''
        if (data === undefined || data === null) {
          return NextResponse.json({ error: 'Data parameter is required' }, { status: 400 })
        }

        const keyResult = parseKeyParameter(key)
        if (keyResult.error) return keyResult.error

        // Normalizar e validar TTL
        let safeTtl: number | undefined = undefined
        if (ttl !== undefined && ttl !== null) {
          const ttlNum = typeof ttl === 'string' ? Number(ttl) : ttl
          if (!Number.isFinite(ttlNum) || ttlNum <= 0) {
            return NextResponse.json(
              { error: 'TTL must be a positive number (seconds)' },
              { status: 400 }
            )
          }
          safeTtl = Math.floor(ttlNum)
        }

        await cacheService.set(keyResult.prefix, keyResult.identifier, data, safeTtl)
        return NextResponse.json({ success: true })
      }

      case 'clear': {
        if (!key) {
          return NextResponse.json({ error: 'Key (prefix) parameter is required' }, { status: 400 })
        }
        await cacheService.clear(key)
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Cache API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  // Validar segurança com token de admin para mutações
  const securityError = validateMutationRequest(request)
  if (securityError) return securityError

  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const action = searchParams.get('action') // 'delete' (default), 'invalidate-all'

    if (key) {
      // Deletar uma chave específica
      const keyResult = parseKeyParameter(key)
      if (keyResult.error) return keyResult.error

      await cacheService.delete(keyResult.prefix, keyResult.identifier)
      return NextResponse.json({
        success: true,
        message: `Cache entry ${key} deleted`,
      })
    } else if (action === 'invalidate-all') {
      // Clear all blog cache entries
      // Note: invalidatePostCache() clears aggregated caches (posts, page, tag)
      // and also removes ALL individual post entries (post:*, full-post:*)
      await cacheService.invalidatePostCache()
      return NextResponse.json({
        success: true,
        message: 'All blog cache invalidated',
      })
    } else {
      return NextResponse.json(
        {
          error: 'Key parameter required or use action=invalidate-all for complete invalidation',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Cache API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
