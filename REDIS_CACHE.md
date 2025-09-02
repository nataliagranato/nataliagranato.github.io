# Sistema de Cache Redis para Blog

Este projeto implementa um sistema de cache com Redis para melhorar a performance do blog Next.js.

## 📋 Funcionalidades

- ✅ Cache de posts do blog
- ✅ Cache por tags
- ✅ Cache de paginação
- ✅ Invalidação automática de cache
- ✅ Fallback para dados originais em caso de erro

## 🚀 Configuração

### 1. Instalação do Redis

#### Redis local (desenvolvimento)
```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis-server

# Docker
docker run -d -p 6379:6379 redis:latest
```

#### Redis na nuvem (produção)
Configure a variável `REDIS_URL` no seu arquivo `.env`:

```env
# Desenvolvimento (Redis local)
REDIS_URL=redis://localhost:6379

# Produção (Redis Cloud/AWS ElastiCache/etc)
REDIS_URL=redis://username:password@hostname:port
REDIS_URL=rediss://username:password@hostname:port  # Para SSL
```

### 2. Configuração das Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

E configure as variáveis necessárias.

## 🏗️ Arquitetura

### Estrutura dos Arquivos

```
lib/
├── redis.ts          # Cliente Redis
├── cache.ts          # Serviço de cache genérico
└── blogCache.ts      # Funções específicas para cache do blog

app/
└── api/
    └── cache/
        └── route.ts  # API para gerenciar cache
```

### Como Funciona

1. **Primeira requisição**: Dados são buscados do contentlayer e armazenados no Redis
2. **Requisições subsequentes**: Dados são servidos diretamente do Redis (muito mais rápido)
3. **Expiração**: Cache expira automaticamente após o TTL definido
4. **Fallback**: Se o Redis falhar, o sistema usa os dados originais

## 🔧 Uso

### Funções Disponíveis

```typescript
import {
  getCachedPosts,
  getCachedPost,
  getCachedPostsByTag,
  getCachedPagedPosts,
  invalidateBlogCache
} from '@/lib/blogCache'

// Obter todos os posts
const posts = await getCachedPosts()

// Obter um post específico
const post = await getCachedPost('slug-do-post')

// Obter posts por tag
const tagPosts = await getCachedPostsByTag('kubernetes')

// Obter posts paginados
const { posts, pagination } = await getCachedPagedPosts(1, 5)

// Invalidar cache
await invalidateBlogCache() // Todo o cache
await invalidateBlogCache('slug-do-post') // Post específico
```

### API de Gerenciamento

```bash
# Verificar status do cache
GET /api/cache?action=status

# Obter dados do cache
GET /api/cache?action=get&key=posts:all

# Invalidar cache específico
POST /api/cache
{
  "action": "invalidate",
  "key": "posts:all"
}

# Limpar cache por prefixo
POST /api/cache
{
  "action": "clear",
  "key": "posts"
}

# Definir dados no cache
POST /api/cache
{
  "action": "set",
  "key": "posts:all",
  "data": [...],
  "ttl": 3600
}
```

## ⚡ Performance

### TTL (Time To Live) Configurado

- **Posts gerais**: 1 hora (3600s)
- **Posts por tag**: 30 minutos (1800s)
- **Paginação**: 30 minutos (1800s)
- **Posts individuais**: 1 hora (3600s)

### Benefícios

- **Redução de latência**: ~90% mais rápido para dados em cache
- **Menor uso de CPU**: Evita reprocessamento desnecessário
- **Melhor experiência do usuário**: Carregamento mais rápido das páginas
- **Escalabilidade**: Suporta mais usuários simultâneos

## 🛠️ Desenvolvimento

### Testando o Cache

```bash
# Testar conexão com Redis
node scripts/test-redis.js

# Verificar status via API
curl http://localhost:3000/api/cache?action=status

# Invalidar cache durante desenvolvimento
curl -X POST http://localhost:3000/api/cache \
  -H "Content-Type: application/json" \
  -d '{"action": "invalidate"}'
```

### Monitoramento

Para verificar se o cache está funcionando, observe os logs:

```
Posts loaded from cache          # ✅ Cache hit
Loading posts from contentlayer  # ❌ Cache miss
```

## 🔍 Troubleshooting

### Cache não está funcionando

1. Verifique se o Redis está rodando:
```bash
redis-cli ping
# Deve retornar: PONG
```

2. Verifique a variável REDIS_URL no `.env.local`

3. Verifique os logs para erros de conexão

### Performance não melhorou

1. Verifique se o cache está sendo usado (logs)
2. Considere ajustar os valores de TTL
3. Monitore o uso de memória do Redis

### Dados desatualizados

1. Invalide o cache manualmente:
```bash
curl -X POST http://localhost:3000/api/cache \
  -H "Content-Type: application/json" \
  -d '{"action": "invalidate"}'
```

2. Ajuste os valores de TTL se necessário

## 📊 Monitoramento

### Métricas Importantes

- **Hit Rate**: % de requisições servidas pelo cache
- **Latência**: Tempo de resposta com/sem cache
- **Uso de Memória**: Consumo do Redis
- **Conexões**: Número de conexões ativas

### Ferramentas

- Redis CLI: `redis-cli info stats`
- Redis Insight: Interface gráfica para monitoramento
- Logs da aplicação: Para debug e análise

## 🚨 Produção

### Considerações

1. **Redis Cluster**: Para alta disponibilidade
2. **Backup**: Configure backup automático dos dados
3. **Monitoramento**: Use ferramentas como DataDog, New Relic
4. **Segurança**: Configure autenticação e SSL
5. **Limits**: Defina limites de memória apropriados

### Deploy

```bash
# Build da aplicação
npm run build

# Variáveis de ambiente obrigatórias
REDIS_URL=your-production-redis-url
NODE_ENV=production
```

---

## 🤝 Contribuição

Para contribuir com melhorias no sistema de cache:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste thoroughly
5. Submeta um Pull Request

---

**Nota**: Este sistema de cache foi projetado para ser resiliente e ter fallbacks, garantindo que o blog funcione mesmo se o Redis estiver indisponível.
