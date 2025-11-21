/**
 * License Management API Routes
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateLicense, getLicenseInfo, formatLicenseKey } from '../utils/license';
import { getLicenseStatus } from '../middleware/license';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/license/activate
 * Activate a new license key
 */
router.post('/activate', async (req: Request, res: Response) => {
  try {
    const { licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(400).json({
        error: 'License key is required'
      });
    }

    // Validate license key
    const validation = validateLicense(licenseKey);

    if (!validation.valid) {
      // Log failed activation attempt
      await prisma.licenseVerificationLog.create({
        data: {
          licenseId: 'unknown',
          success: false,
          errorMessage: validation.error,
          verifiedAt: new Date(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      }).catch(() => {}); // Ignore errors in logging

      return res.status(400).json({
        error: 'Invalid License Key',
        message: validation.error
      });
    }

    const payload = validation.payload!;

    // Check if license already exists
    const existingLicense = await prisma.license.findUnique({
      where: { licenseKey }
    });

    if (existingLicense) {
      // Update existing license
      const updated = await prisma.license.update({
        where: { licenseKey },
        data: {
          status: 'ACTIVE',
          activatedAt: existingLicense.activatedAt || new Date(),
          lastVerifiedAt: new Date()
        }
      });

      // Log successful activation
      await prisma.licenseVerificationLog.create({
        data: {
          licenseId: updated.id,
          success: true,
          verifiedAt: new Date(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      const info = getLicenseInfo(payload);

      return res.json({
        success: true,
        message: 'License reactivated successfully',
        license: {
          tier: info.tier,
          expiresAt: info.expiresAt,
          features: info.features,
          limits: info.limits
        }
      });
    }

    // Deactivate any existing active licenses (only one active at a time)
    await prisma.license.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'SUSPENDED' }
    });

    // Create new license record
    const license = await prisma.license.create({
      data: {
        licenseKey,
        customerId: payload.customerId,
        email: payload.email,
        companyName: payload.companyName,
        tier: payload.tier.toUpperCase() as any,
        status: 'ACTIVE',
        issuedAt: new Date(payload.issuedAt),
        expiresAt: new Date(payload.expiresAt),
        activatedAt: new Date(),
        lastVerifiedAt: new Date(),
        maxUsers: payload.maxUsers || -1,
        maxSurveys: payload.maxSurveys || -1,
        maxResponses: payload.maxResponses || -1,
        features: payload.features
      }
    });

    // Log successful activation
    await prisma.licenseVerificationLog.create({
      data: {
        licenseId: license.id,
        success: true,
        verifiedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    const info = getLicenseInfo(payload);

    res.json({
      success: true,
      message: 'License activated successfully',
      license: {
        tier: info.tier,
        companyName: info.companyName,
        expiresAt: info.expiresAt,
        daysUntilExpiry: info.daysUntilExpiry,
        features: info.features,
        limits: info.limits
      }
    });
  } catch (error) {
    console.error('License activation error:', error);
    res.status(500).json({
      error: 'Failed to activate license',
      message: 'An error occurred while activating the license'
    });
  }
});

/**
 * GET /api/license/status
 * Get current license status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await getLicenseStatus();
    res.json(status);
  } catch (error) {
    console.error('License status error:', error);
    res.status(500).json({
      error: 'Failed to retrieve license status'
    });
  }
});

/**
 * GET /api/license/info
 * Get detailed license information (admin only)
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication check
    // if (req.user?.role !== 'ADMIN') {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const license = await prisma.license.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        verificationLogs: {
          orderBy: { verifiedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!license) {
      return res.json({
        active: false,
        message: 'No active license found'
      });
    }

    const validation = validateLicense(license.licenseKey);

    if (!validation.valid) {
      return res.json({
        active: false,
        error: validation.error,
        license: {
          email: license.email,
          companyName: license.companyName,
          tier: license.tier,
          status: license.status,
          expiresAt: license.expiresAt
        }
      });
    }

    const info = getLicenseInfo(validation.payload!);

    res.json({
      active: true,
      license: {
        customerId: info.customerId,
        email: info.email,
        companyName: info.companyName,
        tier: info.tier,
        status: license.status,
        issuedAt: info.issuedAt,
        expiresAt: info.expiresAt,
        activatedAt: license.activatedAt,
        daysUntilExpiry: info.daysUntilExpiry,
        isExpired: info.isExpired,
        isExpiringSoon: info.isExpiringSoon,
        features: info.features,
        limits: info.limits,
        licenseKey: formatLicenseKey(license.licenseKey)
      },
      usage: {
        users: license.currentUsers,
        surveys: license.currentSurveys,
        responses: license.currentResponses,
        lastUpdate: license.lastUsageUpdate
      },
      recentVerifications: license.verificationLogs.map(log => ({
        success: log.success,
        verifiedAt: log.verifiedAt,
        error: log.errorMessage
      }))
    });
  } catch (error) {
    console.error('License info error:', error);
    res.status(500).json({
      error: 'Failed to retrieve license information'
    });
  }
});

/**
 * POST /api/license/deactivate
 * Deactivate current license (admin only)
 */
router.post('/deactivate', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication check

    await prisma.license.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'SUSPENDED' }
    });

    res.json({
      success: true,
      message: 'License deactivated successfully'
    });
  } catch (error) {
    console.error('License deactivation error:', error);
    res.status(500).json({
      error: 'Failed to deactivate license'
    });
  }
});

/**
 * POST /api/license/verify
 * Manually trigger license verification
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const license = await prisma.license.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!license) {
      return res.status(404).json({
        error: 'No active license found'
      });
    }

    const validation = validateLicense(license.licenseKey);

    // Update verification time
    await prisma.license.update({
      where: { id: license.id },
      data: {
        lastVerifiedAt: new Date(),
        status: validation.valid ? 'ACTIVE' : (validation.isExpired ? 'EXPIRED' : 'SUSPENDED')
      }
    });

    // Log verification
    await prisma.licenseVerificationLog.create({
      data: {
        licenseId: license.id,
        success: validation.valid,
        errorMessage: validation.error,
        verifiedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        isExpired: validation.isExpired
      });
    }

    const info = getLicenseInfo(validation.payload!);

    res.json({
      success: true,
      message: 'License verified successfully',
      license: {
        tier: info.tier,
        expiresAt: info.expiresAt,
        daysUntilExpiry: info.daysUntilExpiry,
        isExpiringSoon: info.isExpiringSoon
      }
    });
  } catch (error) {
    console.error('License verification error:', error);
    res.status(500).json({
      error: 'Failed to verify license'
    });
  }
});

export default router;
