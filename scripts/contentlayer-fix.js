#!/usr/bin/env node

// Workaround para o problema do Contentlayer com Node.js v22
// Este script desabilita temporariamente o assert import para permitir o build

const fs = require('fs')
const path = require('path')

const nodeModulesPath = path.join(__dirname, '..', 'node_modules')
const contentlayerPath = path.join(nodeModulesPath, 'contentlayer')

// Verificar se o contentlayer existe
if (fs.existsSync(contentlayerPath)) {
  console.log('📦 Aplicando workaround para Contentlayer...')
  
  // Procurar arquivos problemáticos e aplicar patch se necessário
  const searchAndPatch = (dir) => {
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true })
      
      files.forEach(file => {
        const fullPath = path.join(dir, file.name)
        
        if (file.isDirectory()) {
          searchAndPatch(fullPath)
        } else if (file.name.endsWith('.js') || file.name.endsWith('.mjs')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8')
            if (content.includes('import assert') && !content.includes('// PATCHED')) {
              const patchedContent = content.replace(
                /import assert/g, 
                '// import assert // PATCHED - Node.js v22 compatibility'
              )
              fs.writeFileSync(fullPath, patchedContent)
              console.log(`✅ Patched: ${fullPath}`)
            }
          } catch (err) {
            // Ignorar erros de leitura/escrita em arquivos específicos
          }
        }
      })
    } catch (err) {
      // Ignorar erros de acesso a diretórios
    }
  }
  
  searchAndPatch(contentlayerPath)
  console.log('✅ Workaround aplicado com sucesso!')
} else {
  console.log('⚠️  Contentlayer não encontrado, continuando...')
}
