#!/usr/bin/env node

/**
 * Script para limpar o cache Redis
 * Execute com: node scripts/clear-cache.js
 */

import { createClient } from 'redis'

async function clearCache() {
  console.log('🗑️ Limpando cache Redis...\n')

  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    })

    await client.connect()
    console.log('✅ Conectado ao Redis')

    // Buscar todas as chaves relacionadas ao blog
    const keys = await client.keys('blog:*')
    console.log(`🔍 Encontradas ${keys.length} chaves do blog`)

    if (keys.length > 0) {
      await client.del(keys)
      console.log(`🗑️ Removidas ${keys.length} chaves`)
    }

    await client.quit()
    console.log('✅ Cache limpo com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error)
    process.exit(1)
  }
}

clearCache()
