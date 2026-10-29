import { siteConfig } from './config.mjs'

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderPage({ title, paragraphs, status = 200 }) {
  const site = siteConfig()
  const body = paragraphs
    .map((paragraph) => `<p style="line-height:1.6;color:#d4d4d4;">${paragraph}</p>`)
    .join('')
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;background:#0b0b0b;color:#f5f5f5;font-family:Georgia,serif;">
<main style="max-width:36rem;margin:4rem auto;padding:0 1.25rem;">
<p style="letter-spacing:.08em;text-transform:uppercase;font-size:.75rem;color:#a78bfa;">${escapeHtml(site.title)}</p>
<h1 style="font-size:1.8rem;line-height:1.2;">${escapeHtml(title)}</h1>
${body}
<p><a href="${escapeHtml(site.siteUrl)}" style="color:#c4b5fd;">Voltar para o site</a></p>
</main>
</body>
</html>`
  return { status, html }
}
