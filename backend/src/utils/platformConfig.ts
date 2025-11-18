/**
 * Platform Configuration Utilities
 *
 * Manages platform-wide settings like license enforcement and analytics
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PlatformConfigData {
  licenseEnforced: boolean;
  licenseGracePeriod: boolean;
  analyticsEnabled: boolean;
  googleAnalyticsId?: string;
  telemetryEnabled: boolean;
  instanceName?: string;
  instanceDescription?: string;
  adminEmail?: string;
}

/**
 * Get platform configuration
 * Creates default config if none exists
 */
export async function getPlatformConfig(): Promise<PlatformConfigData> {
  try {
    let config = await prisma.platformConfig.findFirst();

    // Create default config if doesn't exist
    if (!config) {
      config = await prisma.platformConfig.create({
        data: {
          licenseEnforced: process.env.LICENSE_ENFORCED === 'true' || false,
          licenseGracePeriod: true,
          analyticsEnabled: false,
          telemetryEnabled: false
        }
      });
    }

    return {
      licenseEnforced: config.licenseEnforced,
      licenseGracePeriod: config.licenseGracePeriod,
      analyticsEnabled: config.analyticsEnabled,
      googleAnalyticsId: config.googleAnalyticsId || undefined,
      telemetryEnabled: config.telemetryEnabled,
      instanceName: config.instanceName || undefined,
      instanceDescription: config.instanceDescription || undefined,
      adminEmail: config.adminEmail || undefined
    };
  } catch (error) {
    console.error('Error getting platform config:', error);
    // Return safe defaults
    return {
      licenseEnforced: false,
      licenseGracePeriod: true,
      analyticsEnabled: false,
      telemetryEnabled: false
    };
  }
}

/**
 * Update platform configuration
 */
export async function updatePlatformConfig(
  updates: Partial<PlatformConfigData>
): Promise<PlatformConfigData> {
  try {
    let config = await prisma.platformConfig.findFirst();

    if (!config) {
      config = await prisma.platformConfig.create({
        data: {
          ...updates
        } as any
      });
    } else {
      config = await prisma.platformConfig.update({
        where: { id: config.id },
        data: updates as any
      });
    }

    return {
      licenseEnforced: config.licenseEnforced,
      licenseGracePeriod: config.licenseGracePeriod,
      analyticsEnabled: config.analyticsEnabled,
      googleAnalyticsId: config.googleAnalyticsId || undefined,
      telemetryEnabled: config.telemetryEnabled,
      instanceName: config.instanceName || undefined,
      instanceDescription: config.instanceDescription || undefined,
      adminEmail: config.adminEmail || undefined
    };
  } catch (error) {
    console.error('Error updating platform config:', error);
    throw error;
  }
}

/**
 * Check if license enforcement is enabled
 */
export async function isLicenseEnforcementEnabled(): Promise<boolean> {
  // Check environment variable first (takes precedence)
  if (process.env.LICENSE_ENFORCED !== undefined) {
    return process.env.LICENSE_ENFORCED === 'true';
  }

  // Check database config
  const config = await getPlatformConfig();
  return config.licenseEnforced;
}

/**
 * Check if analytics is enabled
 */
export async function isAnalyticsEnabled(): Promise<boolean> {
  const config = await getPlatformConfig();
  return config.analyticsEnabled && !!config.googleAnalyticsId;
}

/**
 * Get Google Analytics ID
 */
export async function getGoogleAnalyticsId(): Promise<string | null> {
  const config = await getPlatformConfig();
  return config.googleAnalyticsId || null;
}

/**
 * Enable license enforcement
 */
export async function enableLicenseEnforcement(): Promise<void> {
  await updatePlatformConfig({ licenseEnforced: true });
  console.log('✅ License enforcement ENABLED');
}

/**
 * Disable license enforcement
 */
export async function disableLicenseEnforcement(): Promise<void> {
  await updatePlatformConfig({ licenseEnforced: false });
  console.log('⚠️  License enforcement DISABLED - App is free to use');
}

/**
 * Enable analytics
 */
export async function enableAnalytics(googleAnalyticsId: string): Promise<void> {
  await updatePlatformConfig({
    analyticsEnabled: true,
    googleAnalyticsId
  });
  console.log(`✅ Google Analytics enabled: ${googleAnalyticsId}`);
}

/**
 * Disable analytics
 */
export async function disableAnalytics(): Promise<void> {
  await updatePlatformConfig({ analyticsEnabled: false });
  console.log('⚠️  Analytics DISABLED');
}
