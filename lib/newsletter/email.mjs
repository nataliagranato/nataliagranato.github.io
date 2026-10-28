import nodemailer from 'nodemailer'
import { mailFrom, siteConfig } from './config.mjs'
import { createToken } from './tokens.mjs'
import { escapeHtml } from './html.mjs'

function transport() {
  const host = process.env.SMTP_HOST
  if (!host) {
    throw new Error('SMTP_HOST não está configurado')
  }
  const port = Number(process.env.SMTP_PORT || 587)
  const secure =
    process.env.SMTP_SECURE != null && process.env.SMTP_SECURE !== ''
      ? process.env.SMTP_SECURE === 'true'
      : port === 465
  const options = {
    host,
    port,
    secure,
  }
  if (process.env.SMTP_USER) {
    options.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || '',
    }
  }
  if (process.env.SMTP_REQUIRE_TLS === 'true') {
    options.requireTLS = true
  }
  return nodemailer.createTransport(options)
}

function unsubscribeUrl(email) {
  const token = createToken(email, 'unsubscribe')
  return `${siteConfig().siteUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`
}

function listHeaders(email) {
  const url = unsubscribeUrl(email)
  return {
    'List-Unsubscribe': `<${url}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

async function send(message) {
  const info = await transport().sendMail(message)
  return info
}

export async function sendConfirmEmail(email) {
  const site = siteConfig()
  const confirm = `${site.siteUrl}/api/newsletter/confirm?token=${encodeURIComponent(createToken(email, 'confirm'))}`
  const unsubscribe = unsubscribeUrl(email)
  const text = [
    `Confirme sua inscrição na newsletter do ${site.title}.`,
    '',
    'Só enviamos um e-mail quando sair um post novo. Para concluir, abra este link:',
    confirm,
    '',
    'O link vale por 48 horas. Se você não pediu esta inscrição, ignore este e-mail.',
    '',
    `Cancelar: ${unsubscribe}`,
  ].join('\n')
  const html = `
    <p>Confirme sua inscrição na newsletter do <strong>${escapeHtml(site.title)}</strong>.</p>
    <p>Só enviamos um e-mail quando sair um post novo.</p>
    <p><a href="${escapeHtml(confirm)}">Confirmar inscrição</a></p>
    <p style="color:#666;font-size:14px;">O link vale por 48 horas. Se você não pediu esta inscrição, ignore este e-mail.</p>
    <p style="color:#666;font-size:14px;"><a href="${escapeHtml(unsubscribe)}">Cancelar inscrição</a></p>
  `
  await send({
    from: mailFrom(),
    to: email,
    subject: `Confirme sua inscrição no ${site.title}`,
    text,
    html,
    headers: listHeaders(email),
  })
}

export async function sendPostEmail(subscriberEmail, post) {
  const site = siteConfig()
  const unsubscribe = unsubscribeUrl(subscriberEmail)
  const summary = post.summary || ''
  const text = [
    post.title,
    '',
    summary,
    '',
    post.url,
    '',
    `Você recebe este e-mail porque assinou a newsletter do ${site.title}.`,
    `Cancelar inscrição: ${unsubscribe}`,
  ].join('\n')
  const html = `
    <p style="letter-spacing:.08em;text-transform:uppercase;font-size:12px;color:#6d28d9;">Novo post no ${escapeHtml(site.title)}</p>
    <h1 style="font-size:22px;">${escapeHtml(post.title)}</h1>
    ${summary ? `<p>${escapeHtml(summary)}</p>` : ''}
    <p><a href="${escapeHtml(post.url)}">Ler no site</a></p>
    <p style="color:#666;font-size:14px;">Você recebe este e-mail porque assinou a newsletter do ${escapeHtml(site.title)}.</p>
    <p style="color:#666;font-size:14px;"><a href="${escapeHtml(unsubscribe)}">Cancelar inscrição</a></p>
  `
  await send({
    from: mailFrom(),
    to: subscriberEmail,
    subject: post.title.replace(/[\r\n]+/g, ' ').slice(0, 180),
    text,
    html,
    headers: listHeaders(subscriberEmail),
  })
}
