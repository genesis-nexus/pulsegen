/**
 * ML Providers Module
 *
 * This module provides an abstraction layer for ML providers,
 * allowing easy swapping between MindsDB, TensorFlow Serving, or custom implementations.
 */

// Types
export * from './types';

// Base provider
export { BaseMLProvider } from './baseProvider';

// Provider implementations
export { MindsDBProvider } from './mindsdbProvider';

// Factory and utilities
export {
  createMLProvider,
  registerCustomProvider,
  isProviderSupported,
  getSupportedProviders,
  providerCache,
  getOrCreateProvider,
} from './providerFactory';
