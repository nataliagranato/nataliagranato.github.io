import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next()

  // Add monitoring headers for external alerts and monitoring systems
  response.headers.set('X-Header-Value', 'monitoring-active')
  response.headers.set('Header-Value', 'nataliagranato-xyz-health-check')
  
  // Additional monitoring headers
  response.headers.set('X-Request-ID', generateRequestId())
  response.headers.set('X-Response-Time', Date.now().toString())
  response.headers.set('X-Server-Health', 'healthy')
  response.headers.set('X-Environment', process.env.NODE_ENV || 'production')
  response.headers.set('X-Version', process.env.npm_package_version || '1.0.0')
  
  // CORS headers for monitoring endpoints
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

  return response
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}