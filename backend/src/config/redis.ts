/**
 * Redis/Cache Configuration
 * NOTE: This file now uses the cache abstraction layer
 * Redis is optional - falls back to in-memory cache if unavailable
 */

import { cache } from '../lib/cache';

// Export cache instance for backward compatibility
// Services using 'redis.get/set' will now use the cache abstraction
export const redis = cache;
export default cache;
