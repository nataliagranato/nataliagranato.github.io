// Exemplo de como usar a integração Sentry + Vercel AI SDK

import { generateText, generateObject, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

// Configuração de telemetria padrão para todas as chamadas
const defaultTelemetry = {
  isEnabled: true,
  recordInputs: true,
  recordOutputs: true,
}

// 1. Exemplo de Chat Simples
export async function generateChat(prompt: string) {
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: prompt,
    experimental_telemetry: defaultTelemetry,
  })

  return {
    text: result.text,
    usage: result.usage,
    finishReason: result.finishReason,
  }
}

// 2. Exemplo de Streaming
export async function streamChat(prompt: string) {
  const result = streamText({
    model: openai('gpt-4o-mini'),
    prompt: prompt,
    experimental_telemetry: defaultTelemetry,
  })

  return result.toTextStreamResponse()
}

// 3. Exemplo de Objeto Estruturado
const analysisSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  summary: z.string().describe('Brief summary of the content'),
  keywords: z.array(z.string()).describe('Key topics and keywords'),
  confidence: z.number().min(0).max(1).describe('Confidence score'),
})

export async function analyzeContent(content: string) {
  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    prompt: `Analyze the following content: ${content}`,
    schema: analysisSchema,
    experimental_telemetry: defaultTelemetry,
  })

  return {
    analysis: result.object,
    usage: result.usage,
    finishReason: result.finishReason,
  }
}

// 4. Exemplo com Conversação
export async function generateConversation(messages: Array<{ role: string; content: string }>) {
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    messages: messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    })),
    experimental_telemetry: defaultTelemetry,
  })

  return {
    response: result.text,
    usage: result.usage,
    finishReason: result.finishReason,
  }
}

// 5. Exemplo com Configurações Avançadas
export async function generateWithAdvancedConfig(prompt: string) {
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: prompt,
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
    experimental_telemetry: {
      isEnabled: true,
      recordInputs: true,
      recordOutputs: true,
      functionId: 'advanced-generation', // ID personalizado para tracking
      metadata: {
        feature: 'advanced-chat',
        version: 'v1.0',
      },
    },
  })

  return result
}

// 6. Exemplo de Error Handling
export async function safeGenerate(prompt: string) {
  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: prompt,
      experimental_telemetry: defaultTelemetry,
    })

    return { success: true, data: result }
  } catch (error) {
    // O Sentry automaticamente captura este erro com contexto de AI
    console.error('AI Generation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
