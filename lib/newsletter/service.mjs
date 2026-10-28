import { timingSafeEqual } from 'node:crypto'
import { publishAllowed, siteConfig } from './config.mjs'
import { sendConfirmEmail, sendPostEmail } from './email.mjs'
import { renderPage } from './html.mjs'
import { createStore, rateKey, sentKey, subscriberKey } from './store.mjs'
import { readToken } from './tokens.mjs'

const EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 15 * 60 * 1000
const CONFIRM_COOLDOWN_MS = 10 * 60 * 1000
const BASELINE_STALE_MS = 2 * 60 * 1000
const SEND_STALE_MS = 10 * 60 * 1000

export const CONFIRM_MESSAGE =
  'Enviamos um e-mail de confirmação. Abra a caixa de entrada e clique no link para concluir a assinatura.'

export function normalizeEmail(value) {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (!email || email.length > 254 || /[\s\r\n]/.test(email)) return null
  if (!EMAIL_RE.test(email)) return null
  return email
}

export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim().slice(0, 80) || 'unknown'
  return (request.headers.get('x-real-ip') || 'unknown').slice(0, 80)
}

async function allowRequest(ip) {
  const store = createStore()
  const key = rateKey(ip || 'unknown')
  const now = Date.now()
  const current = (await store.get(key)) || { hits: [] }
  const hits = (current.hits || []).filter((hit) => now - hit < RATE_WINDOW_MS)
  if (hits.length >= RATE_LIMIT) {
    await store.put(key, { hits })
    return false
  }
  hits.push(now)
  await store.put(key, { hits })
  return true
}

function postUrl(post) {
  if (post.url) return post.url
  return `${siteConfig().siteUrl}/blog/${post.slug}`
}

function isPublished(post) {
  return Boolean(post && post.slug && post.title && post.draft !== true)
}

export async function subscribe({ email, honeypot, ip }) {
  const allowed = await allowRequest(ip)
  if (!allowed) {
    return {
      status: 429,
      body: {
        ok: false,
        message: 'Muitas tentativas. Espere alguns minutos e tente de novo.',
      },
    }
  }
  if (honeypot && String(honeypot).trim()) {
    return { status: 200, body: { ok: true, message: CONFIRM_MESSAGE } }
  }
  const normalized = normalizeEmail(email)
  if (!normalized) {
    return { status: 400, body: { ok: false, message: 'Informe um e-mail válido.' } }
  }

  const store = createStore()
  const key = subscriberKey(normalized)
  const existing = await store.get(key)
  if (existing?.status === 'confirmed') {
    return {
      status: 200,
      body: {
        ok: true,
        message: 'Este e-mail já está confirmado. Você recebe os posts novos.',
      },
    }
  }
  if (
    existing?.status === 'pending' &&
    existing.lastConfirmSentAt &&
    Date.now() - Date.parse(existing.lastConfirmSentAt) < CONFIRM_COOLDOWN_MS
  ) {
    return { status: 200, body: { ok: true, message: CONFIRM_MESSAGE } }
  }

  const record = {
    email: normalized,
    status: 'pending',
    createdAt: existing?.createdAt || new Date().toISOString(),
    confirmedAt: null,
    unsubscribedAt: existing?.unsubscribedAt || null,
    lastConfirmSentAt: null,
  }
  await store.put(key, record)
  try {
    await sendConfirmEmail(normalized)
  } catch (error) {
    console.error('Falha ao enviar confirmação da newsletter:', error?.message || error)
    return {
      status: 503,
      body: {
        ok: false,
        message: 'Não foi possível enviar o e-mail de confirmação. Tente novamente em instantes.',
      },
    }
  }
  record.lastConfirmSentAt = new Date().toISOString()
  await store.put(key, record)
  return { status: 200, body: { ok: true, message: CONFIRM_MESSAGE } }
}

export async function confirmSubscription(token) {
  const verified = readToken(token, 'confirm')
  if (!verified) {
    return renderPage({
      title: 'Link inválido',
      status: 400,
      paragraphs: ['Este link de confirmação não é válido. Peça uma nova inscrição no site.'],
    })
  }
  if (verified.expired) {
    return renderPage({
      title: 'Link expirado',
      status: 400,
      paragraphs: [
        'Este link de confirmação expirou. Volte ao site e informe seu e-mail de novo para receber outro.',
      ],
    })
  }
  const store = createStore()
  const key = subscriberKey(verified.email)
  const record = await store.get(key)
  if (!record) {
    return renderPage({
      title: 'Inscrição não encontrada',
      status: 404,
      paragraphs: ['Não achamos esta inscrição. Faça o cadastro de novo na página inicial.'],
    })
  }
  if (record.status === 'unsubscribed') {
    return renderPage({
      title: 'Inscrição cancelada',
      status: 200,
      paragraphs: [
        'Este e-mail está descadastrado. Se quiser voltar a receber os posts, assine de novo no site.',
      ],
    })
  }
  if (record.status !== 'confirmed') {
    record.status = 'confirmed'
    record.confirmedAt = new Date().toISOString()
    await store.put(key, record)
  }
  return renderPage({
    title: 'Inscrição confirmada',
    paragraphs: [
      'Pronto. Quando sair um post novo no Tech Preta, você recebe o título, o resumo e o link por e-mail.',
    ],
  })
}

export async function unsubscribe(token) {
  const verified = readToken(token, 'unsubscribe')
  if (!verified || verified.expired) {
    return renderPage({
      title: 'Link inválido',
      status: 400,
      paragraphs: ['Este link de cancelamento não é válido.'],
    })
  }
  const store = createStore()
  const key = subscriberKey(verified.email)
  const record = (await store.get(key)) || {
    email: verified.email,
    createdAt: new Date().toISOString(),
  }
  record.email = verified.email
  record.status = 'unsubscribed'
  record.unsubscribedAt = new Date().toISOString()
  await store.put(key, record)
  return renderPage({
    title: 'Inscrição cancelada',
    paragraphs: [
      'Você não vai mais receber e-mails de posts novos. Se mudar de ideia, assine outra vez no site.',
    ],
  })
}

async function ensureBaseline(store, posts) {
  const published = posts.filter(isPublished)
  let state = await store.get('state.json')
  if (state?.status === 'ready' && state.bootstrappedAt) {
    return { ready: true, justBootstrapped: false, baselineCount: state.baselineCount || 0 }
  }
  if (state?.status === 'bootstrapping') {
    const age = Date.now() - Date.parse(state.startedAt || 0)
    if (age < BASELINE_STALE_MS) return { ready: false, inProgress: true }
  } else {
    const claimed = await store.createIfAbsent('state.json', {
      status: 'bootstrapping',
      startedAt: new Date().toISOString(),
    })
    if (!claimed) {
      state = await store.get('state.json')
      if (state?.status === 'ready' && state.bootstrappedAt) {
        return { ready: true, justBootstrapped: false, baselineCount: state.baselineCount || 0 }
      }
      return { ready: false, inProgress: true }
    }
  }

  for (const post of published) {
    await store.createIfAbsent(sentKey(post.slug), {
      status: 'baseline',
      slug: post.slug,
      at: new Date().toISOString(),
    })
  }
  const ready = {
    status: 'ready',
    bootstrappedAt: new Date().toISOString(),
    baselineCount: published.length,
  }
  await store.put('state.json', ready)
  return { ready: true, justBootstrapped: true, baselineCount: published.length }
}

async function deliverPost(store, post) {
  const key = sentKey(post.slug)
  let record = await store.get(key)
  if (record?.status === 'sent' || record?.status === 'baseline') {
    return { slug: post.slug, status: 'skipped' }
  }
  if (record?.status === 'sending') {
    const age = Date.now() - Date.parse(record.startedAt || 0)
    if (age < SEND_STALE_MS) return { slug: post.slug, status: 'in-progress' }
  }
  if (!record) {
    const claimed = await store.createIfAbsent(key, {
      status: 'sending',
      slug: post.slug,
      startedAt: new Date().toISOString(),
      delivered: [],
    })
    if (!claimed) {
      record = await store.get(key)
      if (record?.status === 'sent' || record?.status === 'baseline') {
        return { slug: post.slug, status: 'skipped' }
      }
      if (record?.status === 'sending') {
        const age = Date.now() - Date.parse(record.startedAt || 0)
        if (age < SEND_STALE_MS) return { slug: post.slug, status: 'in-progress' }
      }
    }
  }

  record = (await store.get(key)) || {
    status: 'sending',
    slug: post.slug,
    startedAt: new Date().toISOString(),
    delivered: [],
  }
  const delivered = new Set(record.delivered || [])
  const subscribers = await store.list('subscribers')
  const confirmed = subscribers.filter((item) => item.status === 'confirmed' && item.email)
  const payload = {
    slug: post.slug,
    title: post.title,
    summary: post.summary || '',
    url: postUrl(post),
  }
  try {
    for (const subscriber of confirmed) {
      if (delivered.has(subscriber.email)) continue
      await sendPostEmail(subscriber.email, payload)
      delivered.add(subscriber.email)
      await store.put(key, {
        status: 'sending',
        slug: post.slug,
        startedAt: record.startedAt,
        delivered: [...delivered],
      })
    }
  } catch (error) {
    await store.put(key, {
      status: 'sending',
      slug: post.slug,
      startedAt: new Date(0).toISOString(),
      delivered: [...delivered],
    })
    throw error
  }
  await store.put(key, {
    status: 'sent',
    slug: post.slug,
    sentAt: new Date().toISOString(),
    recipientCount: delivered.size,
    delivered: [...delivered],
  })
  return { slug: post.slug, status: 'sent', recipientCount: delivered.size }
}

export async function publishNewPosts(posts) {
  if (!publishAllowed()) {
    return {
      status: 403,
      body: { ok: false, message: 'O envio só roda no deploy de produção.' },
    }
  }
  const store = createStore()
  const list = Array.isArray(posts) ? posts : []
  const baseline = await ensureBaseline(store, list)
  if (!baseline.ready) {
    return {
      status: 202,
      body: { ok: true, inProgress: true, emailed: [] },
    }
  }
  if (baseline.justBootstrapped) {
    return {
      status: 200,
      body: {
        ok: true,
        bootstrapped: true,
        baselineCount: baseline.baselineCount,
        emailed: [],
        message:
          'Primeira execução: os posts já publicados foram registrados e nenhum e-mail foi enviado.',
      },
    }
  }

  const published = list.filter(isPublished).sort((a, b) => {
    return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
  })
  const emailed = []
  const skipped = []
  for (const post of published) {
    const result = await deliverPost(store, post)
    if (result.status === 'sent') emailed.push(result)
    else skipped.push({ slug: result.slug, status: result.status })
  }
  return {
    status: 200,
    body: { ok: true, bootstrapped: false, emailed, skipped },
  }
}

export function timingSafeEqualString(left, right) {
  if (!left || !right) return false
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function authorizePublish(request) {
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
  const secrets = [process.env.NEWSLETTER_PUBLISH_SECRET, process.env.CRON_SECRET].filter(
    (value) => typeof value === 'string' && value.length > 0
  )
  if (!token || secrets.length === 0) return false
  return secrets.some((secret) => timingSafeEqualString(token, secret))
}
