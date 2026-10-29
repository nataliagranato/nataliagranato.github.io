/**
 * Configuração da newsletter própria.
 * O endereço canônico do site continua em data/siteMetadata.js.
 * SITE_URL só existe para testes locais apontarem os links do e-mail para outro host.
 */

export function siteConfig() {
  const siteUrl = (process.env.SITE_URL || 'https://nataliagranato.xyz').replace(/\/$/, '')
  return {
    siteUrl,
    title: 'Tech Preta',
    author: 'Natália Granato',
    email: 'contato@nataliagranato.xyz',
  }
}

export function mailFrom() {
  return process.env.MAIL_FROM || `${siteConfig().title} <${siteConfig().email}>`
}

export function requireSecret() {
  const secret = process.env.NEWSLETTER_SECRET
  if (!secret || secret.length < 16) {
    throw new Error(
      'NEWSLETTER_SECRET ausente ou curto demais (mínimo de 16 caracteres). Gere com: openssl rand -base64 32'
    )
  }
  return secret
}

export function publishAllowed() {
  const env = process.env.VERCEL_ENV
  if (!env) return true
  if (env === 'production') return true
  return process.env.NEWSLETTER_ALLOW_NON_PRODUCTION === 'true'
}
