/**
 * Configuration Management API
 */

import express, { Request, Response } from 'express';
import { configService } from '../services/configService';
import { getConfigMetadata } from '../utils/remoteConfig';

const router = express.Router();

/**
 * GET /api/config/current
 * Get current active configuration
 */
router.get('/current', async (req: Request, res: Response) => {
  try {
    const config = configService.getConfig();

    if (!config) {
      return res.status(503).json({
        error: 'Configuration not available',
        message: 'System is initializing. Please try again in a moment.'
      });
    }

    res.json({
      version: config.version,
      lastUpdated: config.lastUpdated,
      licensing: config.licensing,
      analytics: config.analytics,
      features: config.features,
      limits: config.limits,
      maintenance: config.maintenance
    });
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({
      error: 'Failed to retrieve configuration'
    });
  }
});

/**
 * GET /api/config/status
 * Get configuration system status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const metadata = configService.getMetadata();
    const remoteMetadata = getConfigMetadata();

    res.json({
      current: {
        version: metadata.version,
        lastUpdated: metadata.lastUpdated,
        lastFetch: metadata.lastFetch,
        refreshInterval: metadata.refreshInterval
      },
      remote: {
        configured: remoteMetadata.hasRemoteConfig,
        cacheAvailable: remoteMetadata.hasCachedConfig,
        cacheAgeMs: remoteMetadata.cacheAge
      },
      licensing: {
        enforced: configService.isLicenseEnforced()
      },
      analytics: {
        enabled: configService.isAnalyticsEnabled(),
        id: configService.getAnalyticsId()
      },
      maintenance: {
        enabled: configService.isMaintenanceMode(),
        message: configService.getMaintenanceMessage()
      }
    });
  } catch (error) {
    console.error('Error getting config status:', error);
    res.status(500).json({
      error: 'Failed to retrieve configuration status'
    });
  }
});

/**
 * POST /api/config/refresh
 * Force configuration refresh
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication check
    // if (req.user?.role !== 'ADMIN') {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    await configService.forceRefresh();

    res.json({
      success: true,
      message: 'Configuration refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing config:', error);
    res.status(500).json({
      error: 'Failed to refresh configuration'
    });
  }
});

/**
 * POST /api/config/clear-cache
 * Clear cached configuration and refresh
 */
router.post('/clear-cache', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication check

    await configService.clearCacheAndRefresh();

    res.json({
      success: true,
      message: 'Cache cleared and configuration refreshed'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache'
    });
  }
});

/**
 * GET /api/config/features
 * Get enabled features
 */
router.get('/features', async (req: Request, res: Response) => {
  try {
    const config = configService.getConfig();

    if (!config) {
      return res.status(503).json({
        error: 'Configuration not available'
      });
    }

    res.json({
      features: config.features
    });
  } catch (error) {
    console.error('Error getting features:', error);
    res.status(500).json({
      error: 'Failed to retrieve features'
    });
  }
});

/**
 * GET /api/config/limits
 * Get configured limits
 */
router.get('/limits', async (req: Request, res: Response) => {
  try {
    const config = configService.getConfig();

    if (!config) {
      return res.status(503).json({
        error: 'Configuration not available'
      });
    }

    res.json({
      limits: config.limits
    });
  } catch (error) {
    console.error('Error getting limits:', error);
    res.status(500).json({
      error: 'Failed to retrieve limits'
    });
  }
});

export default router;
