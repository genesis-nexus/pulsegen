/**
 * License Validation Middleware
 *
 * Enforces license requirements across the application
 * Multiple validation points to prevent bypass
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  validateLicense,
  getLicenseInfo,
  hasFeature,
  validateLimits,
  checkGracePeriod,
  performSecurityChecks,
  LicensePayload
} from '../utils/license';

const prisma = new PrismaClient();

// Store license in memory for performance (cached after first check)
let cachedLicense: {
  payload: LicensePayload;
  validatedAt: Date;
} | null = null;

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Initialize and validate license on app startup
 * This is the first line of defense
 */
export async function initializeLicense(): Promise<boolean> {
  try {
    // Perform security checks
    if (!performSecurityChecks()) {
      console.error('❌ SECURITY: License system integrity check failed');
      return false;
    }

    // Get license from database
    const license = await prisma.license.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { lastVerifiedAt: 'desc' }
    });

    if (!license) {
      console.error('❌ LICENSE: No active license found');
      console.error('   Please register a valid license key to use PulseGen');
      console.error('   Visit: http://localhost:3000/admin/license');
      return false;
    }

    // Validate license key
    const validation = validateLicense(license.licenseKey);

    if (!validation.valid) {
      console.error(`❌ LICENSE: ${validation.error}`);

      // Check grace period
      if (license.lastVerifiedAt) {
        const gracePeriod = checkGracePeriod(license.lastVerifiedAt);
        if (gracePeriod.valid) {
          console.warn(`⚠️  GRACE PERIOD: ${gracePeriod.daysRemaining} days remaining`);
          console.warn('   License verification failed, but grace period is active');
          return true; // Allow operation during grace period
        }
      }

      // Update license status
      await prisma.license.update({
        where: { id: license.id },
        data: {
          status: validation.isExpired ? 'EXPIRED' : 'SUSPENDED',
          offlineSince: license.lastVerifiedAt
        }
      });

      return false;
    }

    // Cache license for performance
    cachedLicense = {
      payload: validation.payload!,
      validatedAt: new Date()
    };

    // Update license verification
    await prisma.license.update({
      where: { id: license.id },
      data: {
        lastVerifiedAt: new Date(),
        offlineSince: null
      }
    });

    // Log successful verification
    await prisma.licenseVerificationLog.create({
      data: {
        licenseId: license.id,
        success: true,
        verifiedAt: new Date()
      }
    });

    // Display license info
    const info = getLicenseInfo(validation.payload!);
    console.log('✅ LICENSE: Valid');
    console.log(`   Customer: ${info.companyName} (${info.email})`);
    console.log(`   Tier: ${info.tier.toUpperCase()}`);
    console.log(`   Expires: ${info.expiresAt.toLocaleDateString()} (${info.daysUntilExpiry} days)`);

    if (info.isExpiringSoon) {
      console.warn(`⚠️  LICENSE: Expiring soon! Renew before ${info.expiresAt.toLocaleDateString()}`);
    }

    return true;
  } catch (error) {
    console.error('❌ LICENSE: Initialization error:', error);
    return false;
  }
}

/**
 * Middleware to check license on every request
 * This adds defense in depth
 */
export async function requireLicense(req: Request, res: Response, next: NextFunction) {
  try {
    // Skip license check for license registration endpoint
    if (req.path === '/api/license/activate' || req.path === '/api/license/status') {
      return next();
    }

    // Check cache first for performance
    if (cachedLicense) {
      const cacheAge = Date.now() - cachedLicense.validatedAt.getTime();
      if (cacheAge < CACHE_DURATION_MS) {
        // Cache is still valid, attach license to request
        req.license = cachedLicense.payload;
        return next();
      }
    }

    // Re-validate license
    const isValid = await initializeLicense();

    if (!isValid) {
      return res.status(403).json({
        error: 'License Required',
        message: 'No valid license found. Please register a license key to use PulseGen.',
        requiresActivation: true
      });
    }

    // Attach license to request
    if (cachedLicense) {
      req.license = cachedLicense.payload;
    }

    next();
  } catch (error) {
    console.error('License check error:', error);
    return res.status(500).json({
      error: 'License Validation Error',
      message: 'An error occurred while validating license'
    });
  }
}

/**
 * Middleware to check if a specific feature is available
 */
export function requireFeature(feature: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const license = req.license;

    if (!license || !hasFeature(license, feature)) {
      return res.status(403).json({
        error: 'Feature Not Available',
        message: `This feature requires ${feature} capability. Please upgrade your license.`,
        requiredFeature: feature,
        currentTier: license?.tier || 'unknown'
      });
    }

    next();
  };
}

/**
 * Middleware to check usage limits
 */
export async function checkLimits(req: Request, res: Response, next: NextFunction) {
  try {
    const license = req.license;
    if (!license) {
      return next(); // License middleware will catch this
    }

    // Get current usage from database
    const activeLicense = await prisma.license.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!activeLicense) {
      return next();
    }

    // Count current usage
    const userCount = await prisma.user.count({ where: { isActive: true } });
    const surveyCount = await prisma.survey.count({ where: { status: 'ACTIVE' } });

    // For monthly responses, check responses in current month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const responseCount = await prisma.response.count({
      where: {
        completedAt: {
          gte: monthStart
        }
      }
    });

    // Update usage in license
    await prisma.license.update({
      where: { id: activeLicense.id },
      data: {
        currentUsers: userCount,
        currentSurveys: surveyCount,
        currentResponses: responseCount,
        lastUsageUpdate: new Date()
      }
    });

    // Validate limits
    const limitsCheck = validateLimits(license, {
      users: userCount,
      surveys: surveyCount,
      responses: responseCount
    });

    if (!limitsCheck.valid) {
      return res.status(403).json({
        error: 'License Limit Exceeded',
        message: 'You have exceeded your license limits',
        errors: limitsCheck.errors,
        currentUsage: {
          users: userCount,
          surveys: surveyCount,
          responses: responseCount
        },
        limits: {
          users: license.maxUsers,
          surveys: license.maxSurveys,
          responses: license.maxResponses
        }
      });
    }

    next();
  } catch (error) {
    console.error('Limit check error:', error);
    next(); // Don't block on error, just log
  }
}

/**
 * Get current license status (for admin dashboard)
 */
export async function getLicenseStatus() {
  try {
    const license = await prisma.license.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { lastVerifiedAt: 'desc' }
    });

    if (!license) {
      return {
        active: false,
        message: 'No active license found'
      };
    }

    const validation = validateLicense(license.licenseKey);

    if (!validation.valid) {
      // Check grace period
      const gracePeriod = checkGracePeriod(license.lastVerifiedAt);

      return {
        active: gracePeriod.valid,
        inGracePeriod: gracePeriod.valid,
        graceDaysRemaining: gracePeriod.daysRemaining,
        error: validation.error,
        license: {
          email: license.email,
          companyName: license.companyName,
          tier: license.tier,
          expiresAt: license.expiresAt,
          status: license.status
        }
      };
    }

    const info = getLicenseInfo(validation.payload!);

    return {
      active: true,
      license: {
        customerId: info.customerId,
        email: info.email,
        companyName: info.companyName,
        tier: info.tier,
        issuedAt: info.issuedAt,
        expiresAt: info.expiresAt,
        daysUntilExpiry: info.daysUntilExpiry,
        isExpired: info.isExpired,
        isExpiringSoon: info.isExpiringSoon,
        features: info.features,
        limits: info.limits
      },
      usage: {
        users: license.currentUsers,
        surveys: license.currentSurveys,
        responses: license.currentResponses,
        lastUpdate: license.lastUsageUpdate
      }
    };
  } catch (error) {
    console.error('Error getting license status:', error);
    return {
      active: false,
      error: 'Failed to retrieve license status'
    };
  }
}

// Extend Express Request type to include license
declare global {
  namespace Express {
    interface Request {
      license?: LicensePayload;
    }
  }
}
