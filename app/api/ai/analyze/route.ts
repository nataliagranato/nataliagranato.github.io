import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Define schema for structured output
const responseSchema = z.object({
  title: z.string().describe('A catchy title for the content'),
  summary: z.string().describe('A brief summary of the content'),
  tags: z.array(z.string()).describe('Relevant tags for the content'),
  category: z.enum(['tech', 'science', 'business', 'lifestyle', 'other']),
})

export async function POST(request: NextRequest) {
  // Verificar se o AI monitoring está habilitado
  if (process.env.ENABLE_AI_MONITORING_PAGE !== 'true') {
    return NextResponse.json({ error: 'AI Monitoring is disabled' }, { status: 403 })
  }

  // Verificar se a API key do OpenAI está configurada
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
  }

  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Generate structured object with Sentry telemetry enabled
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      prompt: `Analyze the following content and extract structured information: ${content}`,
      schema: responseSchema,
      // Enable telemetry for Sentry monitoring
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: true,
        recordOutputs: true,
      },
    })

    return NextResponse.json({
      object: result.object,
      usage: result.usage,
      finishReason: result.finishReason,
    })
  } catch (error) {
    console.error('Error generating object:', error)
    return NextResponse.json({ error: 'Failed to generate structured object' }, { status: 500 })
  }
}
