import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Perform basic health checks
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'production',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        server: 'ok',
        memory: getMemoryUsage(),
        responseTime: `${Date.now() - startTime}ms`,
      },
    }

    const response = NextResponse.json(healthData, { status: 200 })

    // Add specific monitoring headers
    response.headers.set('X-Header-Value', 'monitoring-active')
    response.headers.set('Header-Value', 'nataliagranato-xyz-health-check')
    response.headers.set('X-Health-Status', 'healthy')
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    response.headers.set('X-Request-ID', generateRequestId())
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')

    return response
  } catch (error) {
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`,
    }

    const response = NextResponse.json(errorResponse, { status: 500 })

    // Add monitoring headers even for errors
    response.headers.set('X-Header-Value', 'monitoring-error')
    response.headers.set('Header-Value', 'nataliagranato-xyz-health-check')
    response.headers.set('X-Health-Status', 'unhealthy')
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    response.headers.set('X-Request-ID', generateRequestId())

    return response
  }
}

function getMemoryUsage() {
  const usage = process.memoryUsage()
  return {
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
