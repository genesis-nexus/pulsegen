/**
 * Cache Interface
 * Abstraction layer for caching implementations
 */

export interface CacheInterface {
  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   */
  set(key: string, value: string, ttl?: number): Promise<void>;

  /**
   * Set a value with expiration
   * @param key Cache key
   * @param ttl Time to live in seconds
   * @param value Value to cache
   */
  setex(key: string, ttl: number, value: string): Promise<void>;

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  del(key: string): Promise<void>;

  /**
   * Delete multiple keys from cache
   * @param keys Array of cache keys
   */
  delMany(keys: string[]): Promise<void>;

  /**
   * Check if cache is available and connected
   */
  isConnected(): boolean;

  /**
   * Clear all cache (use with caution)
   */
  flush(): Promise<void>;

  /**
   * Check if a key exists
   * @param key Cache key
   */
  exists(key: string): Promise<boolean>;

  /**
   * Ping the cache to check connectivity
   */
  ping(): Promise<string>;

  /**
   * Quit/close the cache connection
   */
  quit(): Promise<void>;
}
