/**
 * Contrato + carga leve do POST /api/newsletter.
 *
 * REGRA DE OURO: este endpoint grava no Redis e envia e-mail de confirmação.
 * Por isso o script só envia payloads sem efeito colateral:
 *   - e-mail inválido  -> 400, sem criar assinante e sem enviar e-mail
 *   - honeypot         -> 200, sem criar assinante e sem enviar e-mail
 * Nunca use um endereço real aqui.
 *
 * O rate limit do app é 5 requisições / 15 min por IP, então a maior parte
 * da carga recebe 429 — que é resposta esperada e continua exercitando o
 * caminho de Redis (GET + PUT). 429 não é falha; 5xx é.
 *
 *   k6 run tests/k6/newsletter.js -e K6_BASE_URL=https://<preview>.vercel.app
 *
 * Contra produção o script se recusa a rodar (init falha antes do 1º request).
 */

import http from 'k6/http'
import { check } from 'k6'
import exec from 'k6/execution'
import { Counter, Trend } from 'k6/metrics'
import { assertTargetSafe, baseUrl, positiveInt, requestParams } from './lib/config.js'

const BASE_URL = baseUrl()
assertTargetSafe(BASE_URL, { allowProduction: __ENV.K6_ALLOW_PRODUCTION === '1' })

const RATE = positiveInt(__ENV.K6_RATE, 4) // req/s
const DURATION = __ENV.K6_DURATION || '15s'
const CONTRACT_ITERATIONS = positiveInt(__ENV.K6_CONTRACT_ITERATIONS, 4)

http.setResponseCallback(http.expectedStatuses(200, 400, 429))

const serverErrors = new Counter('newsletter_5xx')
const rateLimited = new Counter('newsletter_rate_limited')
const rateLimitLatency = new Trend('newsletter_rate_limit_duration', true)

export const options = {
  scenarios: {
    contract: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: CONTRACT_ITERATIONS,
      maxDuration: '30s',
      tags: { scenario: 'contract' },
    },
    rate_limit: {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: DURATION,
      startTime: '5s',
      preAllocatedVUs: 10,
      maxVUs: 30,
      tags: { scenario: 'rate_limit' },
    },
  },
  thresholds: {
    checks: ['rate>0.98'],
    newsletter_5xx: ['count==0'],
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1200'],
    newsletter_rate_limit_duration: ['p(95)<1200'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
}

const INVALID_MESSAGE = 'Informe um e-mail válido.'
const CONFIRM_FRAGMENT = 'e-mail de confirmação'
const RATE_MESSAGE_FRAGMENT = 'Muitas tentativas'

function post(body, name) {
  return http.post(
    `${BASE_URL}/api/newsletter`,
    JSON.stringify(body),
    requestParams({ name, headers: { 'Content-Type': 'application/json' } })
  )
}

/**
 * Payload inválido por construção: sem "@", o normalizeEmail rejeita antes
 * de qualquer escrita de assinante. O throw é uma trava de segurança contra
 * alguém "consertar" o payload e passar a enviar e-mail de verdade.
 */
function invalidEmail(seed) {
  const email = `k6-invalido-${seed}`
  if (email.includes('@')) throw new Error('payload de teste não pode ser um e-mail válido')
  return { email }
}

export default function () {
  // O cenário define o payload; __ITER reinicia por VU e não serve para isso.
  const contract = exec.scenario.name === 'contract'
  const body =
    contract && __ITER % 2 === 1
      ? { ...invalidEmail(`honeypot-${__ITER}`), company: 'k6-honeypot' }
      : invalidEmail(`${exec.scenario.name}-${__VU}-${__ITER}`)
  const res = post(body, contract ? 'newsletter-contract' : 'newsletter-load')

  if (res.status >= 500) serverErrors.add(1)
  if (res.status === 429) {
    rateLimited.add(1)
    rateLimitLatency.add(res.timings.duration)
  }

  check(res, {
    'status esperado (200, 400 ou 429)': (r) => [200, 400, 429].includes(r.status),
    'corpo é JSON com mensagem': (r) => {
      try {
        return typeof JSON.parse(r.body).message === 'string'
      } catch {
        return false
      }
    },
  })

  if (res.status === 400) {
    check(res, {
      '400: mensagem de e-mail inválido': (r) => JSON.parse(r.body).message === INVALID_MESSAGE,
    })
  }

  if (res.status === 200) {
    check(res, {
      '200: confirmação de envio': (r) => {
        const parsed = JSON.parse(r.body)
        return parsed.ok === true && String(parsed.message).includes(CONFIRM_FRAGMENT)
      },
    })
  }

  if (res.status === 429) {
    check(res, {
      '429: mensagem de limite': (r) =>
        String(JSON.parse(r.body).message).includes(RATE_MESSAGE_FRAGMENT),
    })
  }
}
