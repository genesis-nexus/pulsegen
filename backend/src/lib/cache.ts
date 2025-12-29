/**
 * Cache Abstraction Layer
 * Provides a unified caching interface that falls back to in-memory cache
 * when Redis is unavailable
 */

import Redis from 'ioredis';

interface CacheInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<'OK' | null>;
  setex(key: string, seconds: number, value: string): Promise<'OK' | null>;
  del(key: string): Promise<number>;
  flushall(): Promise<'OK'>;
  ping(): Promise<'PONG'>;
  quit(): Promise<'OK'>;
}

class InMemoryCache implements CacheInterface {
  public store: Map<string, { value: string; expiresAt?: number }> = new Map();
  public cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  public cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, { value });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    const expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async flushall(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  async ping(): Promise<'PONG'> {
    return 'PONG';
  }

  async quit(): Promise<'OK'> {
    this.destroy();
    return 'OK';
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

class CacheService implements CacheInterface {
  public client: Redis | InMemoryCache;
  public isRedis: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      try {
        const redisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          enableOfflineQueue: false,
          retryStrategy: (times: number) => {
            if (times > 3) {
              console.warn('Redis connection failed, falling back to in-memory cache');
              // Switch to in-memory cache
              setTimeout(() => {
                if (!this.isRedis) {
                  this.client = new InMemoryCache();
                  console.log('✅ Switched to in-memory cache');
                }
              }, 100);
              return null; // Stop retrying
            }
            return Math.min(times * 100, 3000);
          },
          reconnectOnError: () => false,
        });

        let connectionAttempted = false;

        redisClient.on('error', (err) => {
          if (!connectionAttempted) {
            console.warn('Redis connection error, using in-memory cache');
            this.client = new InMemoryCache();
            this.isRedis = false;
            connectionAttempted = true;
            redisClient.disconnect();
          }
        });

        redisClient.on('connect', () => {
          console.log('✅ Redis connected successfully');
          this.isRedis = true;
          this.client = redisClient;
        });

        redisClient.on('close', () => {
          if (this.isRedis) {
            console.warn('⚠️  Redis connection closed, switching to in-memory cache');
            this.client = new InMemoryCache();
            this.isRedis = false;
          }
        });

        // Start with Redis client, but will switch to in-memory on error
        this.client = redisClient;
        this.isRedis = true;
      } catch (error) {
        console.warn('Failed to initialize Redis, using in-memory cache:', error);
        this.client = new InMemoryCache();
        this.isRedis = false;
      }
    } else {
      console.log('ℹ️  No REDIS_URL configured, using in-memory cache');
      this.client = new InMemoryCache();
      this.isRedis = false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<'OK' | null> {
    try {
      return await this.client.set(key, value);
    } catch (error) {
      console.error('Cache set error:', error);
      return null;
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK' | null> {
    try {
      return await this.client.setex(key, seconds, value);
    } catch (error) {
      console.error('Cache setex error:', error);
      return null;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
      return 0;
    }
  }

  async flushall(): Promise<'OK'> {
    try {
      return await this.client.flushall();
    } catch (error) {
      console.error('Cache flushall error:', error);
      return 'OK';
    }
  }

  async ping(): Promise<'PONG'> {
    try {
      return await this.client.ping();
    } catch (error) {
      console.error('Cache ping error:', error);
      return 'PONG';
    }
  }

  async quit(): Promise<'OK'> {
    try {
      return await this.client.quit();
    } catch (error) {
      console.error('Cache quit error:', error);
      return 'OK';
    }
  }

  getType(): string {
    return this.isRedis ? 'Redis' : 'In-Memory';
  }
}

// Export singleton instance
export const cache = new CacheService();
export default cache;
