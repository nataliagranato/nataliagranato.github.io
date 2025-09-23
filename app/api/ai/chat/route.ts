import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
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
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 }
    )
  }
}