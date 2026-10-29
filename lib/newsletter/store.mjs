import { createHash } from 'node:crypto'
import { createClient } from 'redis'

/**
 * Assinantes, limite de tentativas e posts já enviados ficam no Redis
 * apontado por REDIS_URL (o Redis do Marketplace já ligado ao projeto).
 *
 * O cliente fica em globalThis e é reaproveitado entre invocações da mesma
 * instância serverless. As chaves usam o prefixo `newsletter:` para não
 * misturar com o restante dos dados desse Redis.
 *
 * createIfAbsent usa SET NX, então o baseline e o envio de cada post
 * continuam idempotentes mesmo com duas chamadas ao mesmo tempo.
 */

const PREFIX = 'newsletter:'

function assertKey(key) {
  if (!key || key.includes('..') || key.startsWith('/') || key.includes('//')) {
    throw new Error('Chave de armazenamento inválida')
  }
}

function redisKey(key) {
  assertKey(key)
  return `${PREFIX}${key}`
}

export function subscriberKey(email) {
  return `subscribers/${createHash('sha256').update(email).digest('hex')}.json`
}

export function sentKey(slug) {
  return `sent/${encodeURIComponent(slug)}.json`
}

export function rateKey(ip) {
  return `ratelimit/${createHash('sha256').update(ip).digest('hex')}.json`
}

function rememberClient(client) {
  globalThis.__newsletterRedis = client
  return client
}

export async function getRedis() {
  const url = process.env.REDIS_URL
  if (!url) {
    throw new Error(
      'REDIS_URL não está configurado. A newsletter usa o Redis já conectado ao projeto. Defina a variável em Production e em Preview.'
    )
  }

  const current = globalThis.__newsletterRedis
  if (current?.isOpen && globalThis.__newsletterRedisUrl === url) return current

  if (!globalThis.__newsletterRedisConnecting || globalThis.__newsletterRedisUrl !== url) {
    if (current) {
      current.disconnect().catch(() => {})
    }
    const client = createClient({
      url,
      socket: {
        keepAlive: true,
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries >= 3) {
            return new Error('Redis indisponível')
          }
          return Math.min((retries + 1) * 100, 300)
        },
      },
    })
    client.on('error', (error) => {
      console.error('Redis newsletter:', error?.message || error)
    })
    globalThis.__newsletterRedisUrl = url
    rememberClient(client)
    globalThis.__newsletterRedisConnecting = client.connect().catch((error) => {
      if (globalThis.__newsletterRedis === client) {
        globalThis.__newsletterRedis = null
        globalThis.__newsletterRedisConnecting = null
      }
      client.disconnect().catch(() => {})
      throw error
    })
  }

  await globalThis.__newsletterRedisConnecting
  globalThis.__newsletterRedisConnecting = null
  return globalThis.__newsletterRedis
}

function collectScanKeys(item, keys) {
  if (Array.isArray(item)) {
    for (const key of item) keys.push(key)
  } else if (item) {
    keys.push(item)
  }
}

export function createStore() {
  return redisStore
}

const redisStore = {
  async get(key) {
    const raw = await (await getRedis()).get(redisKey(key))
    if (!raw) return null
    return JSON.parse(raw)
  },

  async put(key, value) {
    await (await getRedis()).set(redisKey(key), JSON.stringify(value))
  },

  async createIfAbsent(key, value) {
    const created = await (await getRedis()).set(redisKey(key), JSON.stringify(value), { NX: true })
    return created === 'OK'
  },

  async list(prefix) {
    const client = await getRedis()
    const match = `${PREFIX}${prefix}/*`
    const keys = []
    for await (const item of client.scanIterator({ MATCH: match, COUNT: 200 })) {
      collectScanKeys(item, keys)
    }
    if (keys.length === 0) return []
    const values = await client.mGet(keys)
    return values.filter(Boolean).map((raw) => JSON.parse(raw))
  },
}

export async function closeRedis() {
  const client = globalThis.__newsletterRedis
  globalThis.__newsletterRedis = null
  globalThis.__newsletterRedisConnecting = null
  globalThis.__newsletterRedisUrl = null
  if (!client) return
  if (client.isOpen) await client.quit()
  else client.disconnect()
}

export async function clearNewsletterKeys() {
  const client = await getRedis()
  const keys = []
  for await (const item of client.scanIterator({ MATCH: `${PREFIX}*`, COUNT: 200 })) {
    collectScanKeys(item, keys)
  }
  if (keys.length > 0) await client.del(keys)
}
