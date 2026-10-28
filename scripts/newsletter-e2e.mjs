import { mkdtemp, rm } from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
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
      if (end === -1) return false
      messages.push(data.slice(0, end))
      buffer = data.slice(end + 5)
      data = ''
      mode = 'command'
      socket.write('250 OK\r\n')
      return true
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
      const address = server.address()
      resolve({ server, port: address.port, messages })
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

function tokenFrom(raw, kind) {
  const decoded = decodeMail(raw)
  const match = decoded.match(new RegExp(`/api/newsletter/${kind}\\?token=([^\\s"<>]+)`))
  assert(match, `e-mail sem link de ${kind}`)
  return decodeURIComponent(match[1].replace(/&amp;/g, '&'))
}

async function main() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tech-preta-newsletter-'))
  const smtp = await startSmtp()
  process.env.NEWSLETTER_STORE = 'file'
  process.env.NEWSLETTER_DATA_DIR = dir
  process.env.NEWSLETTER_SECRET = 'teste-local-newsletter-secret'
  process.env.NEWSLETTER_PUBLISH_SECRET = 'teste-local-publish-secret'
  process.env.SMTP_HOST = '127.0.0.1'
  process.env.SMTP_PORT = String(smtp.port)
  process.env.SMTP_SECURE = 'false'
  process.env.SMTP_USER = ''
  process.env.SMTP_PASS = ''
  process.env.MAIL_FROM = 'Tech Preta <contato@nataliagranato.xyz>'
  process.env.SITE_URL = 'https://nataliagranato.xyz'
  delete process.env.VERCEL
  delete process.env.VERCEL_ENV

  const { subscribe, confirmSubscription, unsubscribe, publishNewPosts, authorizePublish } =
    await import('../lib/newsletter/service.mjs')

  try {
    const honeypot = await subscribe({
      email: 'bot@example.com',
      honeypot: 'http://spam.example',
      ip: '203.0.113.10',
    })
    assert(honeypot.status === 200 && honeypot.body.ok, 'honeypot deveria responder sucesso')
    assert(smtp.messages.length === 0, 'honeypot não pode enviar e-mail')

    const invalid = await subscribe({ email: 'nao-e-email', ip: '203.0.113.11' })
    assert(invalid.status === 400, 'e-mail inválido deveria ser rejeitado')
    assert(smtp.messages.length === 0, 'e-mail inválido não pode disparar SMTP')

    const tampered = await confirmSubscription('aaaa.bbbb')
    assert(tampered.status === 400 && tampered.html.includes('Link inválido'), 'token adulterado')

    const joined = await subscribe({ email: 'Leitora@Example.com', ip: '203.0.113.12' })
    assert(joined.status === 200, 'inscrição válida falhou')
    assert(smtp.messages.length === 1, 'confirmação não foi enviada')
    const confirmRaw = smtp.messages[0]
    assert(confirmRaw.includes('List-Unsubscribe:'), 'confirmação sem List-Unsubscribe')
    assert(
      confirmRaw.includes('List-Unsubscribe-Post: List-Unsubscribe=One-Click'),
      'confirmação sem List-Unsubscribe-Post'
    )
    const confirmText = decodeMail(confirmRaw)
    assert(confirmText.includes('Confirme sua inscrição'), 'texto de confirmação')
    const confirmToken = tokenFrom(confirmRaw, 'confirm')

    const confirmed = await confirmSubscription(confirmToken)
    assert(
      confirmed.status === 200 && confirmed.html.includes('Inscrição confirmada'),
      'confirmação'
    )

    const again = await subscribe({ email: 'leitora@example.com', ip: '203.0.113.13' })
    assert(again.body.message.includes('já está confirmado'), 'assinante confirmado')
    assert(smtp.messages.length === 1, 'não deve reenviar confirmação')

    const oldPosts = [
      {
        slug: 'post-antigo',
        title: 'Post antigo',
        summary: 'Não pode ser enviado na primeira execução.',
        date: '2020-01-01',
        draft: false,
      },
      {
        slug: 'rascunho',
        title: 'Ainda rascunho',
        summary: 'Rascunho',
        date: '2024-01-01',
        draft: true,
      },
    ]
    const baseline = await publishNewPosts(oldPosts)
    assert(baseline.body.bootstrapped === true, 'primeira execução deveria só registrar o baseline')
    assert(baseline.body.baselineCount === 1, 'rascunho entrou no baseline')
    assert(baseline.body.emailed.length === 0, 'baseline enviou e-mail')
    assert(smtp.messages.length === 1, 'baseline disparou SMTP')

    const repeat = await publishNewPosts(oldPosts)
    assert(repeat.body.emailed.length === 0, 'segunda execução reenviou post antigo')

    const fresh = {
      slug: 'post-novo',
      title: 'Kubernetes sem drama',
      summary: 'Um resumo curto do post novo.',
      date: '2026-10-28',
      draft: false,
    }
    const sent = await publishNewPosts([...oldPosts, fresh])
    assert(sent.body.emailed.length === 1, 'post novo não foi enviado')
    assert(sent.body.emailed[0].slug === 'post-novo', 'slug enviado errado')
    assert(sent.body.emailed[0].recipientCount === 1, 'quantidade de destinatários')
    assert(smtp.messages.length === 2, 'e-mail do post não chegou')
    const postRaw = smtp.messages[1]
    const postText = decodeMail(postRaw)
    assert(postText.includes('Kubernetes sem drama'), 'título ausente')
    assert(postText.includes('Um resumo curto do post novo.'), 'resumo ausente')
    assert(postText.includes('https://nataliagranato.xyz/blog/post-novo'), 'link ausente')
    assert(postRaw.includes('List-Unsubscribe:'), 'post sem List-Unsubscribe')
    assert(
      postRaw.includes('List-Unsubscribe-Post: List-Unsubscribe=One-Click'),
      'post sem List-Unsubscribe-Post'
    )

    const duplicate = await publishNewPosts([...oldPosts, fresh])
    assert(duplicate.body.emailed.length === 0, 'o mesmo post foi enviado de novo')
    assert(smtp.messages.length === 2, 'reenvio gerou SMTP')

    const unsubscribeToken = tokenFrom(postRaw, 'unsubscribe')
    const removed = await unsubscribe(unsubscribeToken)
    assert(removed.html.includes('Inscrição cancelada'), 'cancelamento')
    const removedAgain = await unsubscribe(unsubscribeToken)
    assert(removedAgain.status === 200, 'cancelamento deveria ser idempotente')

    const afterOptOut = await publishNewPosts([
      ...oldPosts,
      fresh,
      {
        slug: 'so-para-quem-assinou',
        title: 'Não enviar',
        summary: 'Pessoa descadastrada.',
        date: '2026-10-29',
        draft: false,
      },
    ])
    assert(
      afterOptOut.body.emailed.length === 1,
      'post novo para lista vazia deveria registrar envio'
    )
    assert(afterOptOut.body.emailed[0].recipientCount === 0, 'descadastrada ainda recebeu')
    assert(smtp.messages.length === 2, 'descadastro não impediu o SMTP')

    const rejoined = await subscribe({ email: 'leitora@example.com', ip: '203.0.113.14' })
    assert(rejoined.status === 200, 'reinscrição')
    assert(smtp.messages.length === 3, 'reinscrição sem confirmação')
    const reconfirm = await confirmSubscription(tokenFrom(smtp.messages[2], 'confirm'))
    assert(reconfirm.html.includes('Inscrição confirmada'), 'reconfirmação')

    const publishedDraft = {
      slug: 'rascunho',
      title: 'Ainda rascunho',
      summary: 'Agora publicado.',
      date: '2024-01-01',
      draft: false,
    }
    const draftNowLive = await publishNewPosts([
      ...oldPosts.filter((post) => post.slug !== 'rascunho'),
      fresh,
      publishedDraft,
    ])
    assert(
      draftNowLive.body.emailed.some(
        (item) => item.slug === 'rascunho' && item.recipientCount === 1
      ),
      'rascunho publicado não foi enviado'
    )
    const draftMail = decodeMail(smtp.messages.at(-1))
    assert(draftMail.includes('Agora publicado.'), 'resumo do ex-rascunho')

    let limited = null
    for (let index = 0; index < 6; index += 1) {
      limited = await subscribe({
        email: `pessoa${index}@example.com`,
        ip: '203.0.113.50',
      })
    }
    assert(limited.status === 429, 'rate limit não bloqueou a sexta tentativa')

    const unauthorized = authorizePublish(
      new Request('https://nataliagranato.xyz/api/newsletter/publish', {
        headers: { authorization: 'Bearer errado' },
      })
    )
    const authorized = authorizePublish(
      new Request('https://nataliagranato.xyz/api/newsletter/publish', {
        headers: { authorization: 'Bearer teste-local-publish-secret' },
      })
    )
    assert(unauthorized === false && authorized === true, 'autorização do publish')

    console.log('Newsletter local OK')
  } finally {
    await new Promise((resolve) => smtp.server.close(resolve))
    await rm(dir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
