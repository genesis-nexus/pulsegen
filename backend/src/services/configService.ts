/**
 * Configuration Service
 *
 * Manages application configuration with:
 * - Initial fetch on startup
 * - Periodic refresh from Git
 * - Local caching
 * - Fallback strategies
 */

import { getRemoteConfig, RemoteConfig, clearConfigCache } from '../utils/remoteConfig';
import { updatePlatformConfig } from '../utils/platformConfig';

class ConfigService {
  private config: RemoteConfig | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private lastFetch: Date | null = null;
  private refreshIntervalMs: number;

  constructor() {
    // Default: refresh every 5 minutes
    this.refreshIntervalMs = parseInt(process.env.CONFIG_REFRESH_INTERVAL_MS || '300000');
  }

  /**
   * Initialize configuration service
   * Call this on application startup
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing configuration service...');

    try {
      // Fetch initial config
      await this.refresh();

      // Start periodic refresh
      this.startPeriodicRefresh();

      console.log('✅ Configuration service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize configuration service:', error);
      throw error;
    }
  }

  /**
   * Refresh configuration from remote source
   */
  async refresh(): Promise<void> {
    try {
      console.log('🔄 Refreshing configuration...');

      const newConfig = await getRemoteConfig();

      if (newConfig) {
        const configChanged = this.hasConfigChanged(this.config, newConfig);

        this.config = newConfig;
        this.lastFetch = new Date();

        if (configChanged) {
          console.log('📝 Configuration updated');
          await this.applyConfig(newConfig);
        } else {
          console.log('ℹ️  Configuration unchanged');
        }
      }
    } catch (error) {
      console.error('❌ Failed to refresh configuration:', error);
    }
  }

  /**
   * Start periodic configuration refresh
   */
  private startPeriodicRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    console.log(`⏰ Config refresh scheduled every ${this.refreshIntervalMs / 1000} seconds`);

    this.refreshInterval = setInterval(async () => {
      await this.refresh();
    }, this.refreshIntervalMs);
  }

  /**
   * Stop periodic refresh
   */
  stopPeriodicRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('⏸️  Config refresh stopped');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): RemoteConfig | null {
    return this.config;
  }

  /**
   * Check if license enforcement is enabled
   *
   * IMPORTANT: Always uses remote config value
   * Local .env overrides are NOT allowed for security
   */
  isLicenseEnforced(): boolean {
    // SECURITY: Never check .env variables
    // Always use remote config to prevent self-hosted bypasses
    return this.config?.licensing.enforced ?? false;
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof RemoteConfig['features']): boolean {
    return this.config?.features[feature] ?? false;
  }

  /**
   * Check if analytics is enabled
   */
  isAnalyticsEnabled(): boolean {
    return this.config?.analytics.enabled ?? false;
  }

  /**
   * Get analytics ID
   */
  getAnalyticsId(): string | null {
    return this.config?.analytics.googleAnalyticsId ?? null;
  }

  /**
   * Check if maintenance mode is enabled
   */
  isMaintenanceMode(): boolean {
    return this.config?.maintenance.enabled ?? false;
  }

  /**
   * Get maintenance message
   */
  getMaintenanceMessage(): string {
    return this.config?.maintenance.message ?? 'System is under maintenance. Please try again later.';
  }

  /**
   * Check if IP is allowed during maintenance
   */
  isIPAllowedDuringMaintenance(ip: string): boolean {
    const allowedIPs = this.config?.maintenance.allowedIPs ?? [];
    return allowedIPs.includes(ip);
  }

  /**
   * Get limit value
   */
  getLimit(limit: keyof RemoteConfig['limits']): number {
    return this.config?.limits[limit] ?? 0;
  }

  /**
   * Get config metadata
   */
  getMetadata(): {
    version: string;
    lastUpdated: string;
    lastFetch: Date | null;
    refreshInterval: number;
  } {
    return {
      version: this.config?.version ?? 'unknown',
      lastUpdated: this.config?.lastUpdated ?? 'unknown',
      lastFetch: this.lastFetch,
      refreshInterval: this.refreshIntervalMs
    };
  }

  /**
   * Force immediate refresh
   */
  async forceRefresh(): Promise<void> {
    console.log('🔄 Forcing config refresh...');
    await this.refresh();
  }

  /**
   * Clear cache and refresh
   */
  async clearCacheAndRefresh(): Promise<void> {
    console.log('🗑️  Clearing config cache and refreshing...');
    clearConfigCache();
    await this.refresh();
  }

  /**
   * Check if config has changed
   */
  private hasConfigChanged(oldConfig: RemoteConfig | null, newConfig: RemoteConfig): boolean {
    if (!oldConfig) return true;

    return (
      oldConfig.version !== newConfig.version ||
      oldConfig.lastUpdated !== newConfig.lastUpdated ||
      JSON.stringify(oldConfig.licensing) !== JSON.stringify(newConfig.licensing) ||
      JSON.stringify(oldConfig.features) !== JSON.stringify(newConfig.features) ||
      JSON.stringify(oldConfig.analytics) !== JSON.stringify(newConfig.analytics)
    );
  }

  /**
   * Apply configuration changes to platform
   */
  private async applyConfig(config: RemoteConfig): Promise<void> {
    try {
      console.log('🔧 Applying configuration changes...');

      // Update platform config in database
      await updatePlatformConfig({
        licenseEnforced: config.licensing.enforced,
        analyticsEnabled: config.analytics.enabled,
        googleAnalyticsId: config.analytics.googleAnalyticsId
      });

      // Log significant changes
      if (config.licensing.enforced) {
        console.log('🔒 License enforcement: ENABLED');
      } else {
        console.log('🔓 License enforcement: DISABLED');
      }

      if (config.analytics.enabled) {
        console.log(`📊 Analytics: ENABLED (${config.analytics.googleAnalyticsId})`);
      } else {
        console.log('📊 Analytics: DISABLED');
      }

      if (config.maintenance.enabled) {
        console.log('🚧 Maintenance mode: ENABLED');
        if (config.maintenance.message) {
          console.log(`   Message: ${config.maintenance.message}`);
        }
      }

      // Log feature flags
      const enabledFeatures = Object.entries(config.features)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature);

      console.log(`✨ Enabled features: ${enabledFeatures.join(', ')}`);

      console.log('✅ Configuration applied successfully');
    } catch (error) {
      console.error('❌ Failed to apply configuration:', error);
    }
  }

  /**
   * Shutdown service
   */
  shutdown(): void {
    this.stopPeriodicRefresh();
    console.log('👋 Configuration service shut down');
  }
}

// Export singleton instance
export const configService = new ConfigService();

// Export class for testing
export { ConfigService };
