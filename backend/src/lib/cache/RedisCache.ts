/**
 * Redis Cache Implementation
 */

import Redis from 'ioredis';
import logger from '../../utils/logger';
import { CacheInterface } from './CacheInterface';

export class RedisCache implements CacheInterface {
  private client: Redis;
  private connected: boolean = false;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        logger.error('Redis connection error:', err);
        return true;
      },
      lazyConnect: true, // Don't connect immediately
    });

    this.client.on('connect', () => {
      this.connected = true;
      logger.info('Redis cache connected');
    });

    this.client.on('ready', () => {
      this.connected = true;
      logger.info('Redis cache ready');
    });

    this.client.on('error', (error) => {
      this.connected = false;
      logger.error('Redis cache error:', error);
    });

    this.client.on('close', () => {
      this.connected = false;
      logger.warn('Redis cache connection closed');
    });

    // Attempt to connect
    this.connect();
  }

  private async connect() {
    try {
      await this.client.connect();
      this.connected = true;
    } catch (error) {
      this.connected = false;
      logger.error('Failed to connect to Redis:', error);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.connected) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.connected) return;
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis SET error:', error);
    }
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    if (!this.connected) return;
    try {
      await this.client.setex(key, ttl, value);
    } catch (error) {
      logger.error('Redis SETEX error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.connected) return;
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', error);
    }
  }

  async delMany(keys: string[]): Promise<void> {
    if (!this.connected || keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch (error) {
      logger.error('Redis DEL (many) error:', error);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async flush(): Promise<void> {
    if (!this.connected) return;
    try {
      await this.client.flushdb();
      logger.warn('Redis cache flushed');
    } catch (error) {
      logger.error('Redis FLUSH error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.connected) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async ping(): Promise<string> {
    if (!this.connected) throw new Error('Redis not connected');
    try {
      return await this.client.ping();
    } catch (error) {
      logger.error('Redis PING error:', error);
      throw error;
    }
  }

  async quit(): Promise<void> {
    try {
      await this.client.quit();
      this.connected = false;
      logger.info('Redis cache disconnected');
    } catch (error) {
      logger.error('Error disconnecting Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.quit();
  }
}
