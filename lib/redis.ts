import { createClient, RedisClientType } from 'redis'

class RedisClient {
  private client: RedisClientType | null = null
  private isConnecting = false

  async getClient(): Promise<RedisClientType> {
    if (this.client && this.client.isReady) {
      return this.client
    }

    if (this.isConnecting) {
      // Wait for the connection to complete
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      if (this.client && this.client.isReady) {
        return this.client
      }
    }

    this.isConnecting = true

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
        },
      })

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err)
      })

      this.client.on('connect', () => {
        console.log('Redis Client Connected')
      })

      this.client.on('ready', () => {
        console.log('Redis Client Ready')
      })

      this.client.on('end', () => {
        console.log('Redis Client Disconnected')
      })

      await this.client.connect()
      this.isConnecting = false
      return this.client
    } catch (error) {
      this.isConnecting = false
      console.error('Failed to connect to Redis:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect()
      this.client = null
    }
  }
}

const redisClient = new RedisClient()

export default redisClient
