import { createClient, RedisClientType } from 'redis'

class RedisClient {
  private client: RedisClientType | null = null
  private connectionPromise: Promise<RedisClientType> | null = null

  async getClient(): Promise<RedisClientType> {
    // Se já temos um cliente conectado, retornar imediatamente
    if (this.client && this.client.isReady) {
      return this.client
    }

    // Se já há uma tentativa de conexão em andamento, aguardar
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    // Criar nova Promise de conexão
    this.connectionPromise = this.createConnection()

    try {
      const client = await this.connectionPromise
      return client
    } catch (error) {
      // Limpar a Promise em caso de erro para permitir nova tentativa
      this.connectionPromise = null
      throw error
    }
  }

  private async createConnection(): Promise<RedisClientType> {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.error('Redis: Max reconnection attempts reached')
              return false // Stop reconnecting
            }
            console.log(`Redis: Reconnection attempt ${retries}`)
            return Math.min(retries * 100, 3000) // Exponential backoff, max 3s
          },
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
        // Limpar referências quando a conexão é perdida
        this.client = null
        this.connectionPromise = null
      })

      this.client.on('reconnecting', () => {
        console.log('Redis Client Reconnecting...')
      })

      await this.client.connect()

      // Limpar a Promise de conexão após sucesso
      this.connectionPromise = null

      return this.client
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      this.client = null
      this.connectionPromise = null
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit()
      }
    } catch (error) {
      console.error('Error disconnecting Redis client:', error)
    } finally {
      // Sempre limpar as referências
      this.client = null
      this.connectionPromise = null
    }
  }

  async scanKeys(pattern: string): Promise<string[]> {
    const client = await this.getClient()
    const keys: string[] = []
    let cursor = '0'

    do {
      const result = await client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      })
      cursor = result.cursor
      keys.push(...result.keys)
    } while (cursor !== '0')

    return keys
  }
}

const redisClient = new RedisClient()

export default redisClient
