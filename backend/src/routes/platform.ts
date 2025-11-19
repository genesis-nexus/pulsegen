/**
 * Platform Configuration API Routes
 */

import express, { Request, Response } from 'express';
import {
  getPlatformConfig,
  updatePlatformConfig,
  enableLicenseEnforcement,
  disableLicenseEnforcement,
  enableAnalytics,
  disableAnalytics
} from '../utils/platformConfig';

const router = express.Router();

/**
 * GET /api/platform/config
 * Get platform configuration
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = await getPlatformConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting platform config:', error);
    res.status(500).json({
      error: 'Failed to retrieve platform configuration'
    });
  }
});

/**
 * PUT /api/platform/config
 * Update platform configuration
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication check
    // if (req.user?.role !== 'ADMIN') {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const updates = req.body;
    const config = await updatePlatformConfig(updates);

    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error updating platform config:', error);
    res.status(500).json({
      error: 'Failed to update platform configuration'
    });
  }
});

/**
 * POST /api/platform/license/enable
 * Enable license enforcement
 */
router.post('/license/enable', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication check

    await enableLicenseEnforcement();

    res.json({
      success: true,
      message: 'License enforcement enabled. Restart required for full effect.'
    });
  } catch (error) {
    console.error('Error enabling license enforcement:', error);
    res.status(500).json({
      error: 'Failed to enable license enforcement'
    });
  }
});

/**
 * POST /api/platform/license/disable
 * Disable license enforcement
 */
router.post('/license/disable', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication check

    await disableLicenseEnforcement();

    res.json({
      success: true,
      message: 'License enforcement disabled. App is now free to use.'
    });
  } catch (error) {
    console.error('Error disabling license enforcement:', error);
    res.status(500).json({
      error: 'Failed to disable license enforcement'
    });
  }
});

/**
 * POST /api/platform/analytics/enable
 * Enable Google Analytics
 */
router.post('/analytics/enable', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication check

    const { googleAnalyticsId } = req.body;

    if (!googleAnalyticsId) {
      return res.status(400).json({
        error: 'Google Analytics ID is required'
      });
    }

    // Validate GA4 ID format (G-XXXXXXXXXX)
    if (!googleAnalyticsId.match(/^G-[A-Z0-9]+$/)) {
      return res.status(400).json({
        error: 'Invalid Google Analytics ID format. Should be G-XXXXXXXXXX'
      });
    }

    await enableAnalytics(googleAnalyticsId);

    res.json({
      success: true,
      message: 'Google Analytics enabled'
    });
  } catch (error) {
    console.error('Error enabling analytics:', error);
    res.status(500).json({
      error: 'Failed to enable analytics'
    });
  }
});

/**
 * POST /api/platform/analytics/disable
 * Disable Google Analytics
 */
router.post('/analytics/disable', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication check

    await disableAnalytics();

    res.json({
      success: true,
      message: 'Google Analytics disabled'
    });
  } catch (error) {
    console.error('Error disabling analytics:', error);
    res.status(500).json({
      error: 'Failed to disable analytics'
    });
  }
});

export default router;
