/**
 * ML Provider Factory
 *
 * Factory for creating ML provider instances based on configuration.
 * Enables easy swapping of providers and supports multiple provider types.
 */

import { BaseMLProvider } from './baseProvider';
import { MindsDBProvider } from './mindsdbProvider';
import { MLProviderConfig, MLProviderType } from './types';

// Provider registry for custom providers
const customProviderRegistry: Map<string, new (config: MLProviderConfig) => BaseMLProvider> = new Map();

/**
 * Create an ML provider instance based on configuration
 */
export function createMLProvider(config: MLProviderConfig): BaseMLProvider {
  switch (config.type) {
    case MLProviderType.MINDSDB:
      return new MindsDBProvider(config);

    case MLProviderType.TENSORFLOW_SERVING:
      // Future implementation
      throw new Error('TensorFlow Serving provider not yet implemented');

    case MLProviderType.CUSTOM_REST:
      // Future implementation
      throw new Error('Custom REST provider not yet implemented');

    case MLProviderType.LOCAL:
      // Future implementation
      throw new Error('Local provider not yet implemented');

    default:
      // Check custom registry
      const CustomProvider = customProviderRegistry.get(config.type);
      if (CustomProvider) {
        return new CustomProvider(config);
      }
      throw new Error(`Unknown ML provider type: ${config.type}`);
  }
}

/**
 * Register a custom ML provider
 *
 * @example
 * registerCustomProvider('MY_CUSTOM', MyCustomProvider);
 */
export function registerCustomProvider(
  type: string,
  providerClass: new (config: MLProviderConfig) => BaseMLProvider
): void {
  customProviderRegistry.set(type, providerClass);
}

/**
 * Check if a provider type is supported
 */
export function isProviderSupported(type: MLProviderType | string): boolean {
  const builtInTypes = [
    MLProviderType.MINDSDB,
    // Add more as implemented
  ];

  return builtInTypes.includes(type as MLProviderType) || customProviderRegistry.has(type);
}

/**
 * Get list of all supported provider types
 */
export function getSupportedProviders(): string[] {
  const builtIn = [MLProviderType.MINDSDB];
  const custom = Array.from(customProviderRegistry.keys());
  return [...builtIn, ...custom];
}

/**
 * Provider instance cache for reusing connections
 */
class ProviderCache {
  private cache: Map<string, BaseMLProvider> = new Map();
  private maxCacheSize: number = 10;

  get(configId: string): BaseMLProvider | undefined {
    return this.cache.get(configId);
  }

  set(configId: string, provider: BaseMLProvider): void {
    // Implement LRU-like eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(configId, provider);
  }

  delete(configId: string): boolean {
    return this.cache.delete(configId);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const providerCache = new ProviderCache();

/**
 * Get or create a provider instance with caching
 */
export async function getOrCreateProvider(config: MLProviderConfig): Promise<BaseMLProvider> {
  // Check cache first
  let provider = providerCache.get(config.id);

  if (!provider) {
    provider = createMLProvider(config);
    await provider.initialize();
    providerCache.set(config.id, provider);
  }

  return provider;
}
