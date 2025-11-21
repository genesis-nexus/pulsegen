/**
 * Cache Module
 * Provides caching abstraction with Redis and in-memory implementations
 */

export { CacheInterface } from './CacheInterface';
export { RedisCache } from './RedisCache';
export { MemoryCache } from './MemoryCache';
export { CacheFactory, cache } from './CacheFactory';
export { cache as default } from './CacheFactory';
