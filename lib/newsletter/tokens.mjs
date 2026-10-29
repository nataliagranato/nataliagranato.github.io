import crypto from 'node:crypto'
import { requireSecret } from './config.mjs'

const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000

function sign(payload) {
  return crypto.createHmac('sha256', requireSecret()).update(payload).digest('base64url')
}

export function createToken(email, purpose) {
  const body = {
    e: email,
    p: purpose,
  }
  if (purpose === 'confirm') {
    body.exp = Date.now() + CONFIRM_TTL_MS
  }
  const payload = Buffer.from(JSON.stringify(body)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function readToken(token, purpose) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null
  let data
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!data || data.p !== purpose || typeof data.e !== 'string') return null
  if (data.exp && Date.now() > data.exp) return { email: data.e, expired: true }
  return { email: data.e, expired: false }
}
