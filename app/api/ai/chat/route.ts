import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

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
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Generate text with Sentry telemetry enabled
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: prompt,
      // Enable telemetry for Sentry monitoring
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: true,
        recordOutputs: true,
      },
    })

    return NextResponse.json({
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
    })
  } catch (error) {
    console.error('Error generating text:', error)
    return NextResponse.json({ error: 'Failed to generate text' }, { status: 500 })
  }
}
