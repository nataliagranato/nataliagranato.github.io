import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { BlobNotFoundError, get, head, list, put } from '@vercel/blob'

/**
 * Armazenamento dos assinantes.
 *
 * Produção usa Vercel Blob privado: é o store nativo da Vercel, com uma única
 * dependência (@vercel/blob), sem banco Marketplace. Cada assinante e cada
 * envio ficam em um objeto JSON separado, então duas inscrições ao mesmo tempo
 * não se sobrescrevem.
 *
 * Sem token de Blob (desenvolvimento e o teste local), os mesmos objetos vão
 * para o disco em NEWSLETTER_DATA_DIR. No Vercel, a ausência do Blob é erro:
 * disco de função serverless não persiste assinantes.
 */

const PREFIX = 'newsletter'

function assertKey(key) {
  if (!key || key.includes('..') || key.startsWith('/') || key.includes('//')) {
    throw new Error('Chave de armazenamento inválida')
  }
}

function pathnameFor(key) {
  assertKey(key)
  return `${PREFIX}/${key}`
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

function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)
}

export function createStore() {
  const mode = (process.env.NEWSLETTER_STORE || '').toLowerCase()
  if (mode === 'file' || mode === 'fs') {
    return new FileStore(process.env.NEWSLETTER_DATA_DIR)
  }
  if (blobConfigured()) return new BlobStore()
  if (process.env.VERCEL) {
    throw new Error(
      'Vercel Blob não está configurado. Crie um store privado e conecte ao projeto (BLOB_READ_WRITE_TOKEN ou BLOB_STORE_ID).'
    )
  }
  return new FileStore(process.env.NEWSLETTER_DATA_DIR)
}

function alreadyExistsMessage(error) {
  const message = String(error?.message || error).toLowerCase()
  return message.includes('already exist') || message.includes('already_exists')
}

class FileStore {
  constructor(dir) {
    this.root = dir || path.join(process.cwd(), '.data', 'newsletter')
  }

  file(key) {
    assertKey(key)
    return path.join(this.root, key)
  }

  async get(key) {
    try {
      const raw = await readFile(this.file(key), 'utf8')
      return JSON.parse(raw)
    } catch (error) {
      if (error && error.code === 'ENOENT') return null
      throw error
    }
  }

  async put(key, value) {
    const file = this.file(key)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(value), 'utf8')
  }

  async createIfAbsent(key, value) {
    const file = this.file(key)
    await mkdir(path.dirname(file), { recursive: true })
    try {
      await writeFile(file, JSON.stringify(value), { encoding: 'utf8', flag: 'wx' })
      return true
    } catch (error) {
      if (error && error.code === 'EEXIST') return false
      throw error
    }
  }

  async list(prefix) {
    const dir = path.join(this.root, prefix)
    let entries
    try {
      entries = await readdir(dir)
    } catch (error) {
      if (error && error.code === 'ENOENT') return []
      throw error
    }
    const records = []
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue
      const value = await this.get(`${prefix}/${entry}`)
      if (value) records.push(value)
    }
    return records
  }
}

class BlobStore {
  async get(key) {
    const result = await get(pathnameFor(key), { access: 'private', useCache: false })
    if (!result || result.statusCode !== 200 || !result.stream) return null
    const raw = await new Response(result.stream).text()
    return JSON.parse(raw)
  }

  async put(key, value) {
    await put(pathnameFor(key), JSON.stringify(value), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
    })
  }

  async createIfAbsent(key, value) {
    const pathname = pathnameFor(key)
    try {
      await head(pathname)
      return false
    } catch (error) {
      if (!(error instanceof BlobNotFoundError)) throw error
    }
    try {
      await put(pathname, JSON.stringify(value), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: 'application/json',
        cacheControlMaxAge: 60,
      })
      return true
    } catch (error) {
      try {
        await head(pathname)
        return false
      } catch (headError) {
        if (headError instanceof BlobNotFoundError || alreadyExistsMessage(error)) throw error
        throw error
      }
    }
  }

  async list(prefix) {
    const records = []
    let cursor
    do {
      const page = await list({ prefix: `${PREFIX}/${prefix}/`, cursor, limit: 1000 })
      for (const blob of page.blobs) {
        const key = blob.pathname.startsWith(`${PREFIX}/`)
          ? blob.pathname.slice(PREFIX.length + 1)
          : blob.pathname
        const value = await this.get(key)
        if (value) records.push(value)
      }
      cursor = page.hasMore ? page.cursor : undefined
    } while (cursor)
    return records
  }
}
