# Sentry AI Agent Monitoring

Este projeto está configurado para monitorar AI Agents usando Sentry com o Vercel AI SDK.

## ✅ Configuração Implementada

O Sentry está configurado com o `vercelAIIntegration` nos seguintes arquivos:
- `sentry.server.config.ts` - Para monitoramento no servidor
- `sentry.edge.config.ts` - Para monitoramento no edge runtime

### Configuração do Servidor:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://4e3932a0fff725102d6bcbaac821fb62@o4508636574842880.ingest.us.sentry.io/4510063897870336',
  integrations: [
    // Integração do Vercel AI SDK para monitoramento automático
    Sentry.vercelAIIntegration({
      recordInputs: true,  // Registra entradas dos prompts
      recordOutputs: true, // Registra saídas geradas
    }),
  ],
  tracesSampleRate: 1.0,  // 100% das traces são capturadas
  sendDefaultPii: true,   // Necessário para dados de AI
  enableLogs: true,
})
```

## 🔧 Como Usar a Telemetria

Para garantir que o Sentry capture as operações de AI, sempre inclua o objeto `experimental_telemetry`:

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const result = await generateText({
  model: openai("gpt-4o-mini"),
  prompt: "Seu prompt aqui",
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: true,
    recordOutputs: true,
  },
})
```

### Configuração Padrão Recomendada:

```typescript
const defaultTelemetry = {
  isEnabled: true,
  recordInputs: true,
  recordOutputs: true,
}
```

## Métricas monitoradas

O Sentry captura automaticamente:

- **Token usage**: Quantidade de tokens de entrada e saída
- **Costs**: Custos estimados das chamadas da API
- **Latency**: Tempo de resposta das operações
- **Agent conversations**: Conversas completas dos agentes
- **Tool usage**: Uso de ferramentas pelos agentes
- **Decision-making processes**: Processos de tomada de decisão
- **Failed requests**: Requisições que falharam
- **Prompt performance**: Performance dos prompts

## Variáveis de ambiente necessárias

### Para desenvolvimento:

Crie um arquivo `.env.local` com as seguintes variáveis:

```env
# Habilitar página de teste (apenas desenvolvimento)
ENABLE_AI_MONITORING_PAGE=true

# OpenAI API key para as operações de AI
OPENAI_API_KEY=sua_chave_openai

# Outras variáveis conforme necessário...
REDIS_URL=redis://localhost:6379
```

### Para produção:

**⚠️ IMPORTANTE**: Nunca deixe `ENABLE_AI_MONITORING_PAGE=true` em produção!

```env
# Página de teste desabilitada em produção
ENABLE_AI_MONITORING_PAGE=false

# OpenAI API key (configurar no painel da Vercel)
OPENAI_API_KEY=sua_chave_openai

# Sentry DSN (já configurado)
SENTRY_DSN=https://4e3932a0fff725102d6bcbaac821fb62@o4508636574842880.ingest.us.sentry.io/4510063897870336
```

## 🔒 Segurança

### Controle de Acesso

A página de teste (`/test-ai-monitoring`) e suas APIs são protegidas por:

1. **Variável de ambiente**: `ENABLE_AI_MONITORING_PAGE`
   - `true`: Habilita a página e APIs (desenvolvimento)
   - `false` ou undefined: Desabilita completamente (produção)

2. **Verificação de API Key**: 
   - Todas as APIs verificam se `OPENAI_API_KEY` está configurada
   - Retorna erro 500 se não estiver disponível

3. **Proteção em runtime**:
   - APIs retornam 403 (Forbidden) se não habilitadas
   - Página mostra mensagem de "não disponível"

### Como habilitar para desenvolvimento:

1. **Copie o arquivo de exemplo**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Configure suas chaves**:
   ```env
   ENABLE_AI_MONITORING_PAGE=true
   OPENAI_API_KEY=sk-your-actual-openai-key
   ```

3. **Reinicie o servidor**:
   ```bash
   npm run dev
   ```

## Visualização no Sentry

No dashboard do Sentry, você poderá ver:

1. **AI Operations**: Todas as operações de AI com detalhes
2. **Performance Metrics**: Métricas de performance em tempo real
3. **Error Tracking**: Rastreamento de erros específicos de AI
4. **Usage Analytics**: Análise de uso e custos
5. **Trace Timeline**: Timeline completo das operações

## Boas práticas

1. **Sempre habilite telemetria** em produção para monitoramento completo
2. **Configure sample rates** apropriadas para controlar volume de dados
3. **Use `recordInputs` e `recordOutputs`** para debugging detalhado
4. **Monitor custos** regularmente através das métricas do Sentry
5. **Configure alertas** para latência alta ou erros frequentes