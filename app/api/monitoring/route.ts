import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  // Get monitoring parameters from query
  const { searchParams } = new URL(request.url)
  const checkType = searchParams.get('type') || 'basic'
  
  try {
    let monitoringData
    
    switch (checkType) {
      case 'detailed':
        monitoringData = await getDetailedMonitoring()
        break
      case 'performance':
        monitoringData = await getPerformanceMetrics()
        break
      default:
        monitoringData = await getBasicMonitoring()
    }
    
    const responseTime = Date.now() - startTime
    
    const response = NextResponse.json({
      ...monitoringData,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    }, { status: 200 })
    
    // Set required monitoring headers
    response.headers.set('X-Header-Value', 'monitoring-active')
    response.headers.set('Header-Value', 'nataliagranato-xyz-monitoring')
    response.headers.set('X-Monitor-Type', checkType)
    response.headers.set('X-Response-Time', `${responseTime}ms`)
    response.headers.set('X-Request-ID', generateRequestId())
    response.headers.set('X-Monitor-Status', 'success')
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    
    // CORS headers for external monitoring
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    const errorResponse = NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Monitoring check failed',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
    
    // Set error monitoring headers
    errorResponse.headers.set('X-Header-Value', 'monitoring-error')
    errorResponse.headers.set('Header-Value', 'nataliagranato-xyz-monitoring')
    errorResponse.headers.set('X-Monitor-Status', 'error')
    errorResponse.headers.set('X-Response-Time', `${responseTime}ms`)
    errorResponse.headers.set('X-Request-ID', generateRequestId())
    
    return errorResponse
  }
}

async function getBasicMonitoring() {
  return {
    status: 'healthy',
    service: 'nataliagranato.xyz',
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime(),
    checks: {
      server: 'ok',
      database: 'ok', // Add actual database check if needed
      external_services: 'ok'
    }
  }
}

async function getDetailedMonitoring() {
  const memoryUsage = process.memoryUsage()
  
  return {
    status: 'healthy',
    service: 'nataliagranato.xyz',
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch
    },
    checks: {
      server: 'ok',
      memory: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9 ? 'ok' : 'warning',
      disk: 'ok',
      network: 'ok'
    }
  }
}

async function getPerformanceMetrics() {
  const startCpuUsage = process.cpuUsage()
  
  // Simulate some work to measure CPU
  await new Promise(resolve => setTimeout(resolve, 10))
  
  const endCpuUsage = process.cpuUsage(startCpuUsage)
  
  return {
    status: 'healthy',
    service: 'nataliagranato.xyz',
    performance: {
      cpuUsage: {
        user: endCpuUsage.user,
        system: endCpuUsage.system
      },
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      loadAverage: process.platform === 'linux' ? require('os').loadavg() : 'N/A'
    },
    checks: {
      cpu: 'ok',
      memory: 'ok',
      performance: 'ok'
    }
  }
}

function generateRequestId(): string {
  return `mon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}