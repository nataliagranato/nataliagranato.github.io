/**
 * Script para testar as funções de cache do blog
 * Execute com: npm run build && npx tsx scripts/test-cache.ts
 *
 * Nota: Este script requer que o contentlayer tenha gerado os arquivos primeiro.
 * Execute `npm run build` ou `npm run dev` antes de executar este script.
 */

async function testCache(): Promise<void> {
  console.log('🧪 Testando sistema de cache...\n')

  try {
    // Verificar se o contentlayer foi gerado
    const fs = await import('fs')
    const path = await import('path')

    const contentlayerPath = path.resolve(process.cwd(), '.contentlayer')
    if (!fs.existsSync(contentlayerPath)) {
      console.error('❌ .contentlayer não encontrado. Execute `npm run build` primeiro.')
      process.exit(1)
    }

    // Importar dinamicamente para evitar erro se o contentlayer não estiver gerado
    const { getCachedPosts, getCachedPost, getCachedPostsByTag, getCachedPagedPosts } =
      await import('../lib/blogCache')

    console.log('✅ Funções de cache importadas com sucesso')

    // Testar obtenção de posts
    console.log('\n📖 Testando getCachedPosts...')
    const posts = await getCachedPosts()
    console.log(`✅ ${posts.length} posts carregados`)

    if (posts.length > 0) {
      console.log(`📝 Primeiro post: "${posts[0].title}"`)

      // Testar obtenção de post específico
      console.log('\n📄 Testando getCachedPost...')
      const firstPost = await getCachedPost(posts[0].slug)
      if (firstPost) {
        console.log(`✅ Post específico carregado: "${firstPost.title}"`)
        console.log(`📊 Conteúdo MDX disponível: ${!!firstPost.body?.code}`)
      }

      // Testar posts por tag (se houver tags)
      if (posts[0].tags && posts[0].tags.length > 0) {
        console.log('\n🏷️ Testando getCachedPostsByTag...')
        const tagPosts = await getCachedPostsByTag(posts[0].tags[0])
        console.log(`✅ ${tagPosts.length} posts encontrados para a tag "${posts[0].tags[0]}"`)
      }

      // Testar paginação
      console.log('\n📄 Testando getCachedPagedPosts...')
      const pagedResult = await getCachedPagedPosts(1, 5)
      console.log(`✅ Página 1 carregada com ${pagedResult.posts.length} posts`)
      console.log(
        `📊 Total de ${pagedResult.pagination.totalPosts} posts, ${pagedResult.pagination.totalPages} páginas`
      )
    }

    console.log('\n🎉 Todos os testes passaram!')
  } catch (error) {
    console.error('❌ Erro durante os testes:', error)
    if (error instanceof Error) {
      console.error('📋 Stack trace:', error.stack)
    }
    process.exit(1)
  }
} // Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testCache()
}

export { testCache }
