/**
 * In-Memory Cache Implementation
 * Fallback when Redis is not available
 */

import logger from '../../utils/logger';
import { CacheInterface } from './CacheInterface';

interface CacheEntry {
  value: string;
  expiresAt?: number;
}

export class MemoryCache implements CacheInterface {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    logger.warn('Using in-memory cache (not recommended for production)');

    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const entry: CacheEntry = {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
    };
    this.cache.set(key, entry);
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    await this.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async delMany(keys: string[]): Promise<void> {
    keys.forEach(key => this.cache.delete(key));
  }

  isConnected(): boolean {
    return true; // In-memory cache is always "connected"
  }

  async flush(): Promise<void> {
    this.cache.clear();
    logger.warn('In-memory cache flushed');
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug(`Cleaned up ${expiredCount} expired cache entries`);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    let expired = 0;
    let active = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
    };
  }
}
