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

Certifique-se de ter as seguintes variáveis de ambiente configuradas:

```env
OPENAI_API_KEY=sua_chave_openai
SENTRY_DSN=https://4e3932a0fff725102d6bcbaac821fb62@o4508636574842880.ingest.us.sentry.io/4510063897870336
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