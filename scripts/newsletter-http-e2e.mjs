import { mkdtemp, rm } from 'node:fs/promises'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function startSmtp() {
  const messages = []
  const server = net.createServer((socket) => {
    socket.write('220 localhost ESMTP ready\r\n')
    let mode = 'command'
    let buffer = ''
    let data = ''
    const finishData = () => {
      const end = data.indexOf('\r\n.\r\n')
      if (end === -1) return
      messages.push(data.slice(0, end))
      buffer = data.slice(end + 5)
      data = ''
      mode = 'command'
      socket.write('250 OK\r\n')
    }
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8')
      if (mode === 'data') {
        data += buffer
        buffer = ''
        finishData()
        return
      }
      let newline = buffer.indexOf('\r\n')
      while (newline !== -1 && mode === 'command') {
        const line = buffer.slice(0, newline)
        buffer = buffer.slice(newline + 2)
        const command = line.toUpperCase()
        if (command.startsWith('EHLO') || command.startsWith('HELO')) {
          socket.write('250-localhost\r\n250-8BITMIME\r\n250 OK\r\n')
        } else if (command === 'DATA') {
          mode = 'data'
          data = buffer
          buffer = ''
          socket.write('354 Start mail input\r\n')
          finishData()
          break
        } else if (command === 'QUIT') {
          socket.write('221 Bye\r\n')
          socket.end()
        } else {
          socket.write('250 OK\r\n')
        }
        newline = buffer.indexOf('\r\n')
      }
    })
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port, messages })
    })
  })
}

function decodeMail(raw) {
  const unfolded = raw.replace(/=\r\n/g, '')
  const bytes = []
  for (let index = 0; index < unfolded.length; index += 1) {
    const hex = unfolded.slice(index + 1, index + 3)
    if (unfolded[index] === '=' && /^[0-9A-F]{2}$/i.test(hex)) {
      bytes.push(parseInt(hex, 16))
      index += 2
    } else {
      bytes.push(unfolded.charCodeAt(index) & 0xff)
    }
  }
  return Buffer.from(bytes).toString('utf8')
}

function requestWithHost(host, urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port: 3456, path: urlPath, method: 'GET', headers: { host } },
      (res) => {
        res.resume()
        resolve({ status: res.statusCode, location: res.headers.location || '' })
      }
    )
    req.on('error', reject)
    req.end()
  })
}

async function waitForServer(url) {
  const started = Date.now()
  while (Date.now() - started < 30000) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status === 308) return
    } catch {
      // servidor ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error('next start não respondeu')
}

async function main() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tech-preta-http-'))
  const smtp = await startSmtp()
  const port = 3456
  const base = `http://127.0.0.1:${port}`
  const child = spawn('npx', ['next', 'start', '-p', String(port)], {
    cwd: process.cwd(),
    detached: true,
    env: {
      ...process.env,
      NEWSLETTER_STORE: 'file',
      NEWSLETTER_DATA_DIR: dir,
      NEWSLETTER_SECRET: 'teste-local-newsletter-secret',
      NEWSLETTER_PUBLISH_SECRET: 'teste-local-publish-secret',
      CRON_SECRET: 'teste-local-cron-secret',
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: String(smtp.port),
      SMTP_SECURE: 'false',
      SMTP_USER: '',
      SMTP_PASS: '',
      SMTP_REQUIRE_TLS: 'false',
      MAIL_FROM: 'Tech Preta <contato@nataliagranato.xyz>',
      SITE_URL: base,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let logs = ''
  child.stdout.on('data', (chunk) => {
    logs += chunk.toString()
  })
  child.stderr.on('data', (chunk) => {
    logs += chunk.toString()
  })

  try {
    await waitForServer(`${base}/`)

    const home = await fetch(`${base}/`)
    const homeHtml = await home.text()
    assert(homeHtml.includes('lang="pt-BR"'), 'html lang')
    assert(homeHtml.includes('Últimos posts'), 'título da home')
    assert(homeHtml.includes('Quero assinar'), 'formulário na home')
    assert(homeHtml.includes('"@type":"WebSite"'), 'JSON-LD WebSite')
    assert(homeHtml.includes('og:locale" content="pt_BR"') || homeHtml.includes('og:locale'), 'og:locale')

    const robots = await (await fetch(`${base}/robots.txt`)).text()
    assert(robots.includes('User-Agent: GPTBot'), 'robots GPTBot')
    assert(robots.includes('User-Agent: ClaudeBot'), 'robots ClaudeBot')
    assert(robots.includes('Allow: /'), 'robots allow')
    assert(robots.includes('Sitemap: https://nataliagranato.xyz/sitemap.xml'), 'sitemap no robots')

    const sitemap = await (await fetch(`${base}/sitemap.xml`)).text()
    assert(sitemap.includes('https://nataliagranato.xyz/about'), 'sitemap about')
    assert(sitemap.includes('https://nataliagranato.xyz/llms.txt'), 'sitemap llms')
    assert(sitemap.includes('/blog/'), 'sitemap posts')

    const llms = await (await fetch(`${base}/llms.txt`)).text()
    assert(llms.startsWith('# Tech Preta'), 'llms.txt')
    assert(llms.includes('/blog/'), 'llms lista posts')
    const llmsFull = await (await fetch(`${base}/llms-full.txt`)).text()
    assert(llmsFull.includes('# Tech Preta'), 'llms-full.txt')

    const about = await (await fetch(`${base}/about`)).text()
    assert(about.includes('"@type":"Person"'), 'JSON-LD Person')
    assert(about.includes('Platform Engineer'), 'typo Platform')
    assert(about.includes('responsáveis'), 'typo responsáveis')
    assert(!about.includes('responsavéis'), 'typo antigo')

    const post = await (await fetch(`${base}/blog/o-que-e-kubernetes`)).text()
    assert(post.includes('Quero assinar'), 'formulário no post')
    assert(post.includes('"@type":"BlogPosting"'), 'JSON-LD BlogPosting')
    assert(post.includes('Publicado em'), 'data em português')
    assert(post.includes('https://nataliagranato.xyz/blog/o-que-e-kubernetes'), 'canônico do post')

    const www = await requestWithHost('www.nataliagranato.xyz', '/blog')
    assert(www.status === 308 || www.status === 301, `redirect www status ${www.status}`)
    assert(www.location.startsWith('https://nataliagranato.xyz/'), 'redirect www destino')
    const apex = await requestWithHost('nataliagranato.xyz', '/blog')
    assert(apex.status === 200, 'apex não deve redirecionar')

    const honeypot = await fetch(`${base}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bot@example.com', company: 'spam' }),
    })
    assert(honeypot.status === 200, 'honeypot http')
    assert(smtp.messages.length === 0, 'honeypot enviou e-mail')

    const invalid = await fetch(`${base}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ruim' }),
    })
    assert(invalid.status === 400, 'e-mail inválido http')

    const subscribed = await fetch(`${base}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.20' },
      body: JSON.stringify({ email: 'http-test@example.com' }),
    })
    const subscribedBody = await subscribed.json()
    assert(
      subscribed.status === 200 && subscribedBody.ok,
      `inscrição http ${subscribed.status} ${JSON.stringify(subscribedBody)}`
    )
    assert(smtp.messages.length === 1, 'confirmação http')
    const confirmMail = decodeMail(smtp.messages[0])
    const confirmMatch = confirmMail.match(/\/api\/newsletter\/confirm\?token=([^\s"<>]+)/)
    assert(confirmMatch, 'link de confirmação')
    const confirm = await fetch(`${base}/api/newsletter/confirm?token=${confirmMatch[1]}`)
    const confirmHtml = await confirm.text()
    assert(confirm.status === 200 && confirmHtml.includes('Inscrição confirmada'), 'confirma http')

    const denied = await fetch(`${base}/api/newsletter/publish`, { method: 'POST' })
    assert(denied.status === 401, 'publish sem segredo')

    const publish = await fetch(`${base}/api/newsletter/publish`, {
      method: 'POST',
      headers: { authorization: 'Bearer teste-local-publish-secret' },
    })
    const publishBody = await publish.json()
    assert(publish.status === 200 && publishBody.bootstrapped === true, 'baseline http')
    assert(publishBody.emailed.length === 0, 'baseline não pode enviar posts antigos')
    assert(smtp.messages.length === 1, 'baseline disparou e-mail de post')

    const cron = await fetch(`${base}/api/newsletter/publish`, {
      headers: { authorization: 'Bearer teste-local-cron-secret' },
    })
    const cronBody = await cron.json()
    assert(cron.status === 200 && cronBody.bootstrapped === false, 'cron depois do baseline')
    assert(cronBody.emailed.length === 0, 'cron reenviou posts')

    const unsubMatch = confirmMail.match(/\/api\/newsletter\/unsubscribe\?token=([^\s"<>]+)/)
    assert(unsubMatch, 'link de cancelamento')
    const unsub = await fetch(`${base}/api/newsletter/unsubscribe?token=${unsubMatch[1]}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'List-Unsubscribe=One-Click',
    })
    const unsubHtml = await unsub.text()
    assert(unsub.status === 200 && unsubHtml.includes('Inscrição cancelada'), 'one-click http')

    console.log('Newsletter HTTP OK')
  } catch (error) {
    console.error(logs)
    throw error
  } finally {
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }
    await new Promise((resolve) => smtp.server.close(resolve))
    await rm(dir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
