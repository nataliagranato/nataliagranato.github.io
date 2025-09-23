import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 })
    }

    // Stream text with Sentry telemetry enabled
    const result = streamText({
      model: openai('gpt-4o-mini'),
      prompt: prompt,
      // Enable telemetry for Sentry monitoring
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: true,
        recordOutputs: true,
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Error streaming text:', error)
    return new Response('Failed to stream text', { status: 500 })
  }
}