/**
 * Configuração compartilhada dos testes de carga (Grafana k6).
 *
 * Alvo sempre por variável de ambiente, nunca fixo no código:
 *   K6_BASE_URL=https://<preview>.vercel.app
 *
 * Opcionais:
 *   K6_BYPASS_SECRET   valor de x-vercel-protection-bypass para previews com SSO
 *   K6_TIMEOUT         timeout por requisição (padrão 20s)
 */

const PRODUCTION_HOSTS = ['nataliagranato.xyz', 'www.nataliagranato.xyz']

/**
 * k6 não expõe o global `URL` (só o módulo k6/browser), então o host é lido
 * por regex. Não envolva isto em try/catch: um erro engolido aqui desligaria
 * o guarda de produção em silêncio.
 */
export function hostOf(url) {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(url)
  if (!match) return ''
  return match[1]
    .replace(/^[^@]*@/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
    .toLowerCase()
}

export function baseUrl() {
  const raw = (__ENV.K6_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!raw) {
    throw new Error('Defina K6_BASE_URL, por exemplo: K6_BASE_URL=http://127.0.0.1:3000')
  }
  if (!/^https?:\/\/[^/]+/i.test(raw)) {
    throw new Error(`K6_BASE_URL inválida: ${raw}. Use http(s)://host[:porta].`)
  }
  return raw
}

export function isProduction(url) {
  return PRODUCTION_HOSTS.includes(hostOf(url))
}

/**
 * O endpoint da Newsletter grava no Redis e envia e-mail de confirmação.
 * Por isso a carga só roda fora de produção; o guarda falha no init,
 * antes de qualquer requisição sair.
 */
export function assertTargetSafe(url, { allowProduction = false } = {}) {
  if (!isProduction(url)) return
  if (allowProduction) return
  throw new Error(
    `Alvo bloqueado: ${url} é produção. ` +
      'A Newsletter grava no Redis e envia e-mail. ' +
      'Use a URL de um preview (K6_BASE_URL=...) ou, se souber o que está fazendo, K6_ALLOW_PRODUCTION=1.'
  )
}

export function requestParams({ name, headers = {}, tags = {} } = {}) {
  const merged = { ...headers }
  const bypass = __ENV.K6_BYPASS_SECRET
  if (bypass) merged['x-vercel-protection-bypass'] = bypass
  return {
    headers: merged,
    tags: { ...(name ? { name } : {}), ...tags },
    timeout: __ENV.K6_TIMEOUT || '20s',
    redirects: 5,
  }
}

export function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
