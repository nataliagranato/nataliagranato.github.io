import { NextResponse } from 'next/server'

export async function GET() {
  // Verificar se a página de teste está habilitada
  const isEnabled = process.env.ENABLE_AI_MONITORING_PAGE === 'true'

  return NextResponse.json({
    enabled: isEnabled,
    message: isEnabled
      ? 'AI Monitoring page is enabled'
      : 'AI Monitoring page is disabled. Set ENABLE_AI_MONITORING_PAGE=true to enable.',
  })
}
