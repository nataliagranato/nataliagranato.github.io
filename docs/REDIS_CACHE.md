# Sistema de Cache com Redis

Este documento explica a implementação do sistema de cache com Redis no blog.

## Arquivos Implementados

### 1. `/lib/redis.ts`

Cliente Redis configurado com:

- Conexão lazy (conecta apenas quando necessário)
- Tratamento de erros
- Logs de conexão
- Timeout configurado

### 2. `/lib/cache.ts`

Serviço de cache genérico com:

- TTL (Time To Live) configurável
- Métodos CRUD para cache
- Verificação de expiração
- Métodos específicos para posts do blog

### 3. `/lib/blogCache.ts`

Funções específicas para cache do blog:

- `getCachedPosts()` - Todos os posts com cache
- `getCachedPost(slug)` - Post específico com cache
- `getCachedPostsByTag(tag)` - Posts por tag com cache
- `getCachedPagedPosts(page, size)` - Posts paginados com cache
- `invalidateBlogCache(slug?)` - Invalidar cache

### 4. `/app/api/cache/route.ts`

API endpoints para gerenciar cache:

- `GET /api/cache?action=status` - Status do Redis
- `GET /api/cache?action=get&key=prefix:identifier` - Obter item do cache
- `POST /api/cache` - Adicionar/Invalidar cache
- `DELETE /api/cache?key=prefix:identifier` - Deletar item do cache

## Configuração

### Variáveis de Ambiente

```bash
# .env.local
REDIS_URL=redis://localhost:6379
```

### Para produção com Redis na nuvem:

```bash
REDIS_URL=redis://username:password@hostname:port
# ou para SSL:
REDIS_URL=rediss://username:password@hostname:port
```

## Como o Cache Funciona

### 1. TTL (Time To Live)

- Posts individuais: 1 hora (3600s)
- Lista de todos os posts: 1 hora (3600s)
- Posts por tag: 30 minutos (1800s)
- Posts paginados: 30 minutos (1800s)

### 2. Chaves do Cache

```
blog:posts:all                    - Todos os posts
blog:post:slug-do-post            - Post específico
blog:tag:nome-da-tag              - Posts por tag
blog:page:numero:posts-per-page   - Posts paginados (página:itens-por-página)
blog:full-post:slug-do-post       - Post completo com conteúdo MDX
```

### 3. Fallback

Se o Redis não estiver disponível ou houver erro, o sistema automaticamente:

- Faz fallback para o contentlayer original
- Registra o erro no console
- Continua funcionando normalmente

## Páginas Modificadas

### 1. `/app/blog/page.tsx`

- Usa `getCachedPagedPosts()` em vez de buscar diretamente do contentlayer
- Cache de 30 minutos para a primeira página

### 2. `/app/blog/[...slug]/page.tsx`

- Usa `getCachedPost()` para posts individuais
- Usa `getCachedPosts()` para navegação (próximo/anterior)
- Cache de 1 hora para posts

### 3. `/app/blog/page/[page]/page.tsx`

- Usa `getCachedPagedPosts()` para paginação
- Cache de 30 minutos por página

### 4. `/app/tags/[tag]/page.tsx`

- Usa `getCachedPostsByTag()` para filtrar por tag
- Cache de 30 minutos por tag

## Comandos Úteis

### Verificar status do cache:

```bash
curl http://localhost:3000/api/cache?action=status
```

### Invalidar todo o cache:

```bash
curl -X POST http://localhost:3000/api/cache \
  -H "Content-Type: application/json" \
  -d '{"action": "invalidate"}'
```

### Invalidar cache de um post específico:

```bash
curl -X POST http://localhost:3000/api/cache \
  -H "Content-Type: application/json" \
  -d '{"action": "invalidate", "key": "blog:post:meu-post-slug"}'
```

### Ver um item do cache:

```bash
curl "http://localhost:3000/api/cache?action=get&key=blog:posts:all"
```

## Instalação do Redis (Desenvolvimento Local)

### macOS (usando Homebrew):

```bash
brew install redis
brew services start redis
```

### Docker:

```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

### Linux (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

## Monitoramento

### Logs do Redis

Os logs aparecem no console da aplicação:

- "Redis Client Connected"
- "Redis Client Ready"
- "Posts loaded from cache" / "Loading posts from contentlayer and caching..."

### Verificar conexão Redis

```bash
redis-cli ping
# Deve retornar: PONG
```

## Benefícios da Implementação

1. **Performance**: Reduz o tempo de carregamento das páginas
2. **Escalabilidade**: Diminui a carga de processamento do contentlayer
3. **Flexibilidade**: TTL configurável por tipo de conteúdo
4. **Robustez**: Fallback automático se o Redis não estiver disponível
5. **Debugging**: Logs claros para identificar se o cache está sendo usado

## Próximos Passos (Opcional)

1. **Cache de busca**: Implementar cache para resultados de busca
2. **Cache warming**: Pre-carregar cache no build
3. **Estatísticas**: Adicionar métricas de hit/miss do cache
4. **Compressão**: Comprimir dados antes de armazenar no Redis
5. **Cluster Redis**: Configurar Redis Cluster para alta disponibilidade
