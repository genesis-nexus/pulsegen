/**
 * Cache Factory
 * Creates appropriate cache implementation based on configuration
 */

import logger from '../../utils/logger';
import { CacheInterface } from './CacheInterface';
import { RedisCache } from './RedisCache';
import { MemoryCache } from './MemoryCache';

export class CacheFactory {
  private static instance: CacheInterface | null = null;

  /**
   * Get or create cache instance
   */
  static getCache(): CacheInterface {
    if (this.instance) {
      return this.instance;
    }

    this.instance = this.createCache();
    return this.instance;
  }

  /**
   * Create cache instance based on environment configuration
   */
  private static createCache(): CacheInterface {
    const redisUrl = process.env.REDIS_URL;
    const useCache = process.env.USE_CACHE !== 'false'; // Default to true

    if (!useCache) {
      logger.info('Caching is disabled by configuration');
      return new MemoryCache(); // Use in-memory as no-op alternative
    }

    if (redisUrl) {
      logger.info('Initializing Redis cache...');
      try {
        const redisCache = new RedisCache(redisUrl);

        // Check connection after a short delay
        setTimeout(() => {
          if (!redisCache.isConnected()) {
            logger.warn('Redis connection failed, features requiring cache may be limited');
          }
        }, 2000);

        return redisCache;
      } catch (error) {
        logger.error('Failed to initialize Redis cache:', error);
        logger.warn('Falling back to in-memory cache');
        return new MemoryCache();
      }
    } else {
      logger.warn('REDIS_URL not configured, using in-memory cache');
      logger.warn('For production use, configure Redis for better performance');
      return new MemoryCache();
    }
  }

  /**
   * Reset cache instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }

  /**
   * Check if cache is enabled and connected
   */
  static isCacheAvailable(): boolean {
    const cache = this.getCache();
    return cache.isConnected();
  }

  /**
   * Get cache type
   */
  static getCacheType(): 'redis' | 'memory' | 'none' {
    const cache = this.getCache();

    if (cache instanceof RedisCache) {
      return cache.isConnected() ? 'redis' : 'none';
    }

    if (cache instanceof MemoryCache) {
      return 'memory';
    }

    return 'none';
  }
}

// Export singleton instance
export const cache = CacheFactory.getCache();
export default cache;
