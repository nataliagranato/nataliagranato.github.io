import { NextRequest, NextResponse } from 'next/server'
import cacheService from '../../../lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const key = searchParams.get('key')

    switch (action) {
      case 'status': {
        return NextResponse.json({
          status: 'Redis cache is running',
          timestamp: new Date().toISOString(),
        })
      }

      case 'get': {
        if (!key) {
          return NextResponse.json({ error: 'Key parameter is required' }, { status: 400 })
        }
        const [prefix, identifier] = key.split(':')
        const data = await cacheService.get(prefix, identifier)
        return NextResponse.json({ data })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Cache API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, key, data, ttl } = body

    switch (action) {
      case 'set': {
        if (!key || !data) {
          return NextResponse.json({ error: 'Key and data are required' }, { status: 400 })
        }
        const [prefix, identifier] = key.split(':')
        await cacheService.set(prefix, identifier, data, ttl)
        return NextResponse.json({ success: true })
      }

      case 'invalidate': {
        if (key) {
          const [prefix, identifier] = key.split(':')
          await cacheService.delete(prefix, identifier)
        } else {
          await cacheService.invalidatePostCache()
        }
        return NextResponse.json({ success: true })
      }

      case 'clear': {
        if (!key) {
          return NextResponse.json({ error: 'Key (prefix) parameter is required' }, { status: 400 })
        }
        await cacheService.clear(key)
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Cache API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      const [prefix, identifier] = key.split(':')
      await cacheService.delete(prefix, identifier)
    } else {
      await cacheService.invalidatePostCache()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cache API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
