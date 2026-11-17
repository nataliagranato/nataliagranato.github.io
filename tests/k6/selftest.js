/**
 * Autoteste dos guardas do k6. Roda sem rede, em milissegundos.
 *
 *   k6 run tests/k6/selftest.js
 *
 * Existe porque um guarda que falha "aberto" (deixa passar produção) é pior
 * que guarda nenhum: a primeira versão usava `new URL()`, que não existe no
 * runtime do k6, e o erro engolido desligou a proteção sem avisar.
 */

import { assertTargetSafe, hostOf, isProduction, requestParams } from './lib/config.js'

function assert(condition, message) {
  if (!condition) throw new Error(`selftest: ${message}`)
}

function throws(fn, fragment) {
  try {
    fn()
  } catch (error) {
    assert(
      String(error.message).includes(fragment),
      `mensagem deveria conter "${fragment}", veio "${error.message}"`
    )
    return true
  }
  return false
}

// --- hostOf ---
assert(hostOf('https://nataliagranato.xyz') === 'nataliagranato.xyz', 'host simples')
assert(hostOf('https://nataliagranato.xyz/blog?x=1') === 'nataliagranato.xyz', 'host com caminho')
assert(hostOf('https://www.nataliagranato.xyz/') === 'www.nataliagranato.xyz', 'host com www')
assert(hostOf('http://127.0.0.1:3100') === '127.0.0.1', 'host local com porta')
assert(hostOf('https://user:pass@preview.vercel.app') === 'preview.vercel.app', 'remove userinfo')
assert(hostOf('HTTPS://NATALIAGRANATO.XYZ') === 'nataliagranato.xyz', 'case-insensitive')
assert(hostOf('https://nataliagranato.xyz.') === 'nataliagranato.xyz', 'ponto final')
assert(hostOf('sem-esquema') === '', 'url sem esquema')

// --- isProduction ---
assert(isProduction('https://nataliagranato.xyz') === true, 'produção detectada')
assert(isProduction('https://www.nataliagranato.xyz/blog') === true, 'produção com www')
assert(isProduction('https://preview-abc.vercel.app') === false, 'preview liberado')
assert(isProduction('http://127.0.0.1:3000') === false, 'local liberado')
assert(isProduction('https://nataliagranato.xyz.evil.test') === false, 'sufixo não é produção')

// --- assertTargetSafe ---
assert(
  throws(() => assertTargetSafe('https://nataliagranato.xyz'), 'Alvo bloqueado'),
  'guarda bloqueia produção'
)
assert(
  throws(() => assertTargetSafe('https://www.nataliagranato.xyz/blog'), 'Alvo bloqueado'),
  'guarda bloqueia produção com caminho'
)
assertTargetSafe('https://preview-abc.vercel.app')
assertTargetSafe('http://127.0.0.1:3000')
assertTargetSafe('https://nataliagranato.xyz', { allowProduction: true })

// --- requestParams ---
const tagged = requestParams({ name: 'home' })
assert(tagged.tags.name === 'home', 'tag de nome')
assert(!('x-vercel-protection-bypass' in tagged.headers), 'sem bypass por padrão')

if (__ENV.K6_BYPASS_SECRET) {
  const bypass = requestParams({ name: 'home' })
  assert(
    bypass.headers['x-vercel-protection-bypass'] === __ENV.K6_BYPASS_SECRET,
    'header de bypass'
  )
}

export default function () {}
