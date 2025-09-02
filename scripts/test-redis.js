#!/usr/bin/env node

/**
 * Script para testar a conexão com Redis
 * Execute: node scripts/test-redis.js
 */

import { createClient } from 'redis'

async function testRedisConnection() {
  console.log('🔄 Testando conexão com Redis...')

  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      connectTimeout: 5000,
      lazyConnect: true,
    },
  })

  client.on('error', (err) => {
    console.error('❌ Erro no cliente Redis:', err.message)
  })

  client.on('connect', () => {
    console.log('✅ Cliente Redis conectado')
  })

  client.on('ready', () => {
    console.log('✅ Cliente Redis pronto')
  })

  try {
    await client.connect()

    // Teste básico de set/get
    await client.set('test:connection', 'success', { EX: 60 })
    const result = await client.get('test:connection')

    if (result === 'success') {
      console.log('✅ Teste de cache funcionando')
      console.log('🎉 Redis está funcionando perfeitamente!')
    } else {
      console.log('❌ Teste de cache falhou')
    }

    // Limpar teste
    await client.del('test:connection')
  } catch (error) {
    console.error('❌ Erro ao conectar com Redis:', error.message)
    console.log('')
    console.log('💡 Certifique-se de que o Redis está rodando:')
    console.log('   - macOS: brew services start redis')
    console.log('   - Docker: docker run -d -p 6379:6379 redis')
    console.log('   - Linux: sudo systemctl start redis-server')
  } finally {
    await client.quit()
  }
}

testRedisConnection()
