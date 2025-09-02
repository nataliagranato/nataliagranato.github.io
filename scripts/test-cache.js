/**
 * Script para testar as funções de cache do blog
 * Execute com: node scripts/test-cache.js
 */

async function testCache() {
  console.log('🧪 Testando sistema de cache...\n')

  try {
    // Testar importação das funções
    const { getCachedPosts } = await import('../lib/blogCache.js')
    console.log('✅ Funções de cache importadas com sucesso')

    // Testar obtenção de posts
    console.log('\n📖 Testando getCachedPosts...')
    const posts = await getCachedPosts()
    console.log(`✅ ${posts.length} posts carregados`)

    if (posts.length > 0) {
      console.log(`📝 Primeiro post: "${posts[0].title}"`)
    }

    console.log('\n🎉 Todos os testes passaram!')
  } catch (error) {
    console.error('❌ Erro durante os testes:', error)
    process.exit(1)
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testCache()
}

export { testCache }
