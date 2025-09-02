import { createClient, RedisClientType } from 'redis'

class RedisClient {
  private client: RedisClientType | null = null
  private connectingPromise: Promise<RedisClientType> | null = null

  async getClient(): Promise<RedisClientType> {
    if (this.client && this.client.isReady) {
      return this.client
    }

    if (this.connectingPromise) {
      // Wait for the ongoing connection attempt to complete
      await this.connectingPromise;
      if (this.client && this.client.isReady) {
        return this.client;
      }
      // If connection failed, fall through to retry
    }

    // Start a new connection attempt and store the promise
    this.connectingPromise = (async () => {
      try {
        this.client = createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
          socket: {
            connectTimeout: 5000,
          },
        });

        this.client.on('error', (err) => {
          console.error('Redis Client Error:', err);
        });

        this.client.on('connect', () => {
          console.log('Redis Client Connected');
        });

        this.client.on('ready', () => {
          console.log('Redis Client Ready');
        });

        this.client.on('end', () => {
          console.log('Redis Client Disconnected');
        });

        await this.client.connect();
        return this.client;
      } catch (error) {
        this.client = null;
        console.error('Failed to connect to Redis:', error);
        throw error;
      } finally {
        // Clear the promise so future calls can retry if needed
        this.connectingPromise = null;
      }
    })();

    return this.connectingPromise;
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
