import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Only add monitoring headers, don't process every request
  const response = NextResponse.next()

  // Add minimal monitoring headers only for health checks and monitoring
  if (request.nextUrl.pathname.includes('/api/health') || 
      request.nextUrl.pathname.includes('/api/monitoring')) {
    response.headers.set('X-Header-Value', 'monitoring-active')
    response.headers.set('Header-Value', 'nataliagranato-xyz-health-check')
    response.headers.set('X-Request-ID', generateRequestId())
    response.headers.set('X-Server-Health', 'healthy')
  }

  return response
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const config = {
  matcher: [
    // Only match API routes for monitoring
    '/api/health/:path*',
    '/api/monitoring/:path*',
  ],
}