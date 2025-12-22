# Implement Two-Factor Authentication (2FA)

## Priority: P1 - High
## Labels: `feature`, `security`, `phase-1`, `authentication`
## Estimated Effort: Medium

---

## Summary

Implement Time-based One-Time Password (TOTP) two-factor authentication to enhance account security. This is a critical requirement for enterprise customers and security-conscious organizations.

---

## Background & Motivation

LimeSurvey offers 2FA as a standard security feature. Without 2FA:
- Enterprise customers with security requirements cannot adopt PulseGen
- Admin accounts with sensitive data are vulnerable to password compromise
- PulseGen cannot meet SOC 2, HIPAA, or other compliance requirements
- Security-conscious organizations will choose alternatives

---

## Requirements

### Functional Requirements

1. **2FA Setup**
   - Users can enable 2FA from account settings
   - Generate and display QR code for authenticator apps
   - Manual entry key for apps that don't support QR
   - Verify setup by entering initial code
   - Generate backup/recovery codes (10 single-use codes)

2. **2FA Login Flow**
   - After password verification, prompt for 2FA code
   - Accept 6-digit TOTP code from authenticator app
   - Allow use of backup code as alternative
   - Remember device option (30 days)
   - Rate limiting on code attempts

3. **2FA Management**
   - View 2FA status in settings
   - Regenerate backup codes
   - Disable 2FA (requires current code or backup code)
   - Show last used date for backup codes

4. **Admin Controls**
   - Optionally enforce 2FA for all users
   - Enforce 2FA for admin/manager roles only
   - View 2FA status for all users
   - Reset 2FA for locked-out users (admin only)

5. **Supported Authenticator Apps**
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
   - 1Password
   - Any TOTP-compatible app

---

## Technical Implementation

### 1. Install Dependencies

```bash
cd backend
npm install otplib qrcode
npm install -D @types/qrcode
```

### 2. Database Schema Changes

**Add to `backend/prisma/schema.prisma`:**

```prisma
model User {
  // ... existing fields

  // 2FA fields
  twoFactorEnabled    Boolean   @default(false)
  twoFactorSecret     String?   // Encrypted TOTP secret
  twoFactorVerifiedAt DateTime? // When 2FA was first verified
  backupCodes         BackupCode[]
  trustedDevices      TrustedDevice[]
}

model BackupCode {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  code      String   // Hashed backup code
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
}

model TrustedDevice {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  deviceHash  String   // Hash of device fingerprint
  userAgent   String
  ipAddress   String
  lastUsedAt  DateTime @default(now())
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@unique([userId, deviceHash])
  @@index([userId])
  @@index([expiresAt])
}

// Add system settings for 2FA enforcement
model SystemSettings {
  id                    String  @id @default("default")
  enforce2FA            Boolean @default(false)
  enforce2FAForAdmins   Boolean @default(false)
}
```

### 3. Two-Factor Service

**File: `backend/src/services/twoFactorService.ts`**

```typescript
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { encrypt, decrypt } from '../lib/encryption';

const APP_NAME = 'PulseGen';
const BACKUP_CODE_COUNT = 10;
const TRUSTED_DEVICE_DAYS = 30;

export class TwoFactorService {
  /**
   * Generate a new TOTP secret for a user
   */
  async generateSecret(userId: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    manualEntryKey: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) throw new Error('User not found');

    // Generate secret
    const secret = authenticator.generateSecret();

    // Generate otpauth URL
    const otpauthUrl = authenticator.keyuri(user.email, APP_NAME, secret);

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Format secret for manual entry (add spaces every 4 chars)
    const manualEntryKey = secret.match(/.{1,4}/g)?.join(' ') || secret;

    // Store encrypted secret (but don't enable 2FA yet)
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: encrypt(secret),
        twoFactorEnabled: false, // Not enabled until verified
      },
    });

    return { secret, qrCodeUrl, manualEntryKey };
  }

  /**
   * Verify a TOTP code and enable 2FA
   */
  async verifyAndEnable(userId: string, code: string): Promise<{
    success: boolean;
    backupCodes?: string[];
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorSecret) {
      return { success: false };
    }

    const secret = decrypt(user.twoFactorSecret);
    const isValid = authenticator.verify({ token: code, secret });

    if (!isValid) {
      return { success: false };
    }

    // Generate backup codes
    const backupCodes = await this.generateBackupCodes(userId);

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorVerifiedAt: new Date(),
      },
    });

    return { success: true, backupCodes };
  }

  /**
   * Verify TOTP code during login
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    const secret = decrypt(user.twoFactorSecret);

    // Allow for time drift (1 step before and after)
    return authenticator.verify({
      token: code,
      secret,
      window: 1,
    });
  }

  /**
   * Verify backup code during login
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const normalizedCode = code.replace(/\s|-/g, '').toUpperCase();

    const backupCodes = await prisma.backupCode.findMany({
      where: { userId, usedAt: null },
    });

    for (const backupCode of backupCodes) {
      const isMatch = await bcrypt.compare(normalizedCode, backupCode.code);
      if (isMatch) {
        // Mark as used
        await prisma.backupCode.update({
          where: { id: backupCode.id },
          data: { usedAt: new Date() },
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Generate new backup codes (replaces existing ones)
   */
  async generateBackupCodes(userId: string): Promise<string[]> {
    // Delete existing unused backup codes
    await prisma.backupCode.deleteMany({
      where: { userId },
    });

    const codes: string[] = [];
    const hashedCodes: { code: string }[] = [];

    for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
      // Generate 10-character alphanumeric code
      const code = crypto.randomBytes(5).toString('hex').toUpperCase();
      const formattedCode = `${code.slice(0, 5)}-${code.slice(5)}`; // XXXXX-XXXXX
      codes.push(formattedCode);

      const hashedCode = await bcrypt.hash(code, 10);
      hashedCodes.push({ code: hashedCode });
    }

    // Store hashed codes
    await prisma.user.update({
      where: { id: userId },
      data: {
        backupCodes: {
          createMany: { data: hashedCodes.map(h => ({ ...h, userId })) },
        },
      },
    });

    return codes;
  }

  /**
   * Disable 2FA for a user
   */
  async disable(userId: string, code: string): Promise<boolean> {
    // Verify code first
    const isValidTotp = await this.verifyCode(userId, code);
    const isValidBackup = !isValidTotp && await this.verifyBackupCode(userId, code);

    if (!isValidTotp && !isValidBackup) {
      return false;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorVerifiedAt: null,
        backupCodes: { deleteMany: {} },
        trustedDevices: { deleteMany: {} },
      },
    });

    return true;
  }

  /**
   * Check if device is trusted
   */
  async isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
    const deviceHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');

    const device = await prisma.trustedDevice.findUnique({
      where: {
        userId_deviceHash: { userId, deviceHash },
      },
    });

    if (!device || device.expiresAt < new Date()) {
      return false;
    }

    // Update last used
    await prisma.trustedDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    });

    return true;
  }

  /**
   * Add trusted device
   */
  async trustDevice(
    userId: string,
    deviceFingerprint: string,
    userAgent: string,
    ipAddress: string
  ): Promise<void> {
    const deviceHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TRUSTED_DEVICE_DAYS);

    await prisma.trustedDevice.upsert({
      where: {
        userId_deviceHash: { userId, deviceHash },
      },
      create: {
        userId,
        deviceHash,
        userAgent,
        ipAddress,
        expiresAt,
      },
      update: {
        userAgent,
        ipAddress,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });
  }

  /**
   * Get remaining backup codes count
   */
  async getBackupCodesCount(userId: string): Promise<{ total: number; used: number; remaining: number }> {
    const codes = await prisma.backupCode.findMany({
      where: { userId },
      select: { usedAt: true },
    });

    const used = codes.filter(c => c.usedAt !== null).length;
    return {
      total: codes.length,
      used,
      remaining: codes.length - used,
    };
  }

  /**
   * Admin: Reset 2FA for a user
   */
  async adminReset(userId: string, adminId: string): Promise<void> {
    // Log this action
    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: '2FA_ADMIN_RESET',
        details: { targetUserId: userId },
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorVerifiedAt: null,
        backupCodes: { deleteMany: {} },
        trustedDevices: { deleteMany: {} },
      },
    });
  }
}

export const twoFactorService = new TwoFactorService();
```

### 4. API Endpoints

**File: `backend/src/routes/twoFactorRoutes.ts`**

```typescript
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { twoFactorService } from '../services/twoFactorService';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit for 2FA verification (prevent brute force)
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: 'Too many attempts. Please try again later.' },
});

// Get 2FA status
router.get('/status', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      twoFactorEnabled: true,
      twoFactorVerifiedAt: true,
    },
  });

  const backupCodesInfo = user?.twoFactorEnabled
    ? await twoFactorService.getBackupCodesCount(req.user.id)
    : null;

  res.json({
    enabled: user?.twoFactorEnabled || false,
    enabledAt: user?.twoFactorVerifiedAt,
    backupCodes: backupCodesInfo,
  });
});

// Begin 2FA setup - generate secret and QR code
router.post('/setup', authenticate, async (req, res) => {
  try {
    const result = await twoFactorService.generateSecret(req.user.id);
    res.json({
      qrCodeUrl: result.qrCodeUrl,
      manualEntryKey: result.manualEntryKey,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// Verify setup and enable 2FA
router.post('/verify-setup', authenticate, verifyLimiter, async (req, res) => {
  const schema = z.object({ code: z.string().length(6) });

  try {
    const { code } = schema.parse(req.body);
    const result = await twoFactorService.verifyAndEnable(req.user.id, code);

    if (!result.success) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    res.json({
      success: true,
      backupCodes: result.backupCodes,
      message: 'Two-factor authentication enabled successfully',
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request' });
  }
});

// Verify code during login (called after password verification)
router.post('/verify', verifyLimiter, async (req, res) => {
  const schema = z.object({
    userId: z.string(),
    code: z.string().min(6).max(12),
    trustDevice: z.boolean().optional(),
    deviceFingerprint: z.string().optional(),
  });

  try {
    const { userId, code, trustDevice, deviceFingerprint } = schema.parse(req.body);

    // Try TOTP first, then backup code
    let isValid = await twoFactorService.verifyCode(userId, code);
    let usedBackupCode = false;

    if (!isValid && code.length > 6) {
      isValid = await twoFactorService.verifyBackupCode(userId, code);
      usedBackupCode = isValid;
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // Trust device if requested
    if (trustDevice && deviceFingerprint) {
      await twoFactorService.trustDevice(
        userId,
        deviceFingerprint,
        req.headers['user-agent'] || '',
        req.ip || ''
      );
    }

    // Generate session token (your existing auth logic)
    const token = await generateAuthToken(userId);

    res.json({
      success: true,
      token,
      usedBackupCode,
      backupCodesRemaining: usedBackupCode
        ? (await twoFactorService.getBackupCodesCount(userId)).remaining
        : undefined,
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request' });
  }
});

// Check if device is trusted
router.post('/check-device', async (req, res) => {
  const { userId, deviceFingerprint } = req.body;

  if (!userId || !deviceFingerprint) {
    return res.json({ trusted: false });
  }

  const trusted = await twoFactorService.isDeviceTrusted(userId, deviceFingerprint);
  res.json({ trusted });
});

// Regenerate backup codes
router.post('/regenerate-backup-codes', authenticate, verifyLimiter, async (req, res) => {
  const { code } = req.body;

  // Require current code to regenerate
  const isValid = await twoFactorService.verifyCode(req.user.id, code);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid verification code' });
  }

  const backupCodes = await twoFactorService.generateBackupCodes(req.user.id);
  res.json({ backupCodes });
});

// Disable 2FA
router.post('/disable', authenticate, verifyLimiter, async (req, res) => {
  const { code } = req.body;

  const success = await twoFactorService.disable(req.user.id, code);
  if (!success) {
    return res.status(401).json({ error: 'Invalid verification code' });
  }

  res.json({ success: true, message: 'Two-factor authentication disabled' });
});

// Admin: Reset 2FA for a user
router.post('/admin/reset/:userId', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { userId } = req.params;

  try {
    await twoFactorService.adminReset(userId, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset 2FA' });
  }
});

export default router;
```

### 5. Frontend Components

**File: `frontend/src/components/settings/TwoFactorSetup.tsx`**

```typescript
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Copy, Check, AlertTriangle, Download } from 'lucide-react';
import { api } from '@/lib/api';

export function TwoFactorSetup() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'backup' | 'disable'>('status');
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      const res = await api.get('/2fa/status');
      return res.data;
    },
  });

  const setupMutation = useMutation({
    mutationFn: () => api.post('/2fa/setup'),
    onSuccess: () => setStep('setup'),
  });

  const verifyMutation = useMutation({
    mutationFn: (code: string) => api.post('/2fa/verify-setup', { code }),
    onSuccess: (res) => {
      setBackupCodes(res.data.backupCodes);
      setStep('backup');
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
    },
  });

  const disableMutation = useMutation({
    mutationFn: (code: string) => api.post('/2fa/disable', { code }),
    onSuccess: () => {
      setStep('status');
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
    },
  });

  const downloadBackupCodes = () => {
    const content = `PulseGen Backup Codes\n${'='.repeat(30)}\n\nKeep these codes safe. Each code can only be used once.\n\n${backupCodes.join('\n')}\n\nGenerated: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pulsegen-backup-codes.txt';
    a.click();
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div>Loading...</div>;

  // Status view
  if (step === 'status') {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className={`w-6 h-6 ${status?.enabled ? 'text-green-500' : 'text-gray-400'}`} />
          <div>
            <h3 className="font-semibold">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600">
              {status?.enabled ? 'Enabled' : 'Not enabled'}
            </p>
          </div>
        </div>

        {status?.enabled ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-green-800 text-sm">
                Your account is protected with two-factor authentication.
              </p>
            </div>

            {status.backupCodes && (
              <p className="text-sm text-gray-600">
                Backup codes remaining: {status.backupCodes.remaining} of {status.backupCodes.total}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('disable')}
                className="px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50"
              >
                Disable 2FA
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Add an extra layer of security to your account by requiring a verification code in addition to your password.
            </p>
            <button
              onClick={() => setupMutation.mutate()}
              disabled={setupMutation.isPending}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              {setupMutation.isPending ? 'Setting up...' : 'Enable 2FA'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Setup view - show QR code
  if (step === 'setup' && setupMutation.data) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Setup Two-Factor Authentication</h3>

        <div className="space-y-6">
          <div>
            <p className="text-gray-600 mb-4">
              Scan this QR code with your authenticator app:
            </p>
            <div className="flex justify-center">
              <img
                src={setupMutation.data.data.qrCodeUrl}
                alt="2FA QR Code"
                className="w-48 h-48 border rounded-lg"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-sm text-gray-600 mb-2">Or enter this key manually:</p>
            <code className="text-lg font-mono">
              {setupMutation.data.data.manualEntryKey}
            </code>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Enter the 6-digit code from your app:
            </label>
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-2 border rounded-md font-mono text-lg text-center tracking-widest"
              maxLength={6}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('status')}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => verifyMutation.mutate(verifyCode)}
              disabled={verifyCode.length !== 6 || verifyMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {verifyMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>

          {verifyMutation.isError && (
            <p className="text-red-500 text-sm">Invalid code. Please try again.</p>
          )}
        </div>
      </div>
    );
  }

  // Backup codes view
  if (step === 'backup') {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <h3 className="font-semibold">Save Your Backup Codes</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <p className="text-amber-800 text-sm">
              <strong>Important:</strong> Save these codes in a secure place. Each code can only be used once.
              If you lose access to your authenticator app, you'll need these codes to sign in.
            </p>
          </div>

          <div className="bg-gray-50 rounded-md p-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, i) => (
                <div key={i} className="p-2 bg-white rounded border">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={copyBackupCodes}
              className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={downloadBackupCodes}
              className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          <button
            onClick={() => setStep('status')}
            className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            I've Saved My Codes
          </button>
        </div>
      </div>
    );
  }

  // Disable view
  if (step === 'disable') {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Disable Two-Factor Authentication</h3>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">
              <strong>Warning:</strong> Disabling 2FA will make your account less secure.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Enter your verification code to confirm:
            </label>
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="6-digit code or backup code"
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('status'); setVerifyCode(''); }}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => disableMutation.mutate(verifyCode)}
              disabled={!verifyCode || disableMutation.isPending}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {disableMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>

          {disableMutation.isError && (
            <p className="text-red-500 text-sm">Invalid code. Please try again.</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
```

---

## Acceptance Criteria

- [ ] Users can enable 2FA from account settings
- [ ] QR code displays correctly for authenticator apps
- [ ] Manual entry key is provided as alternative
- [ ] Setup requires verification with initial code
- [ ] 10 backup codes are generated on setup
- [ ] Backup codes can be downloaded/copied
- [ ] Login flow prompts for 2FA code after password
- [ ] TOTP codes from authenticator apps work
- [ ] Backup codes work (single use)
- [ ] "Remember this device" option works (30 days)
- [ ] Rate limiting prevents brute force attacks
- [ ] Users can regenerate backup codes
- [ ] Users can disable 2FA (with code verification)
- [ ] Admins can enforce 2FA for all users
- [ ] Admins can reset 2FA for locked-out users
- [ ] All 2FA-related actions are logged
- [ ] Works with Google Authenticator, Microsoft Authenticator, Authy
- [ ] Unit tests for TwoFactorService
- [ ] Integration tests for API endpoints

---

## Files to Create/Modify

### New Files
- `backend/src/services/twoFactorService.ts`
- `backend/src/routes/twoFactorRoutes.ts`
- `frontend/src/components/settings/TwoFactorSetup.tsx`
- `frontend/src/components/auth/TwoFactorVerify.tsx`

### Modified Files
- `backend/prisma/schema.prisma`
- `backend/src/routes/index.ts`
- `backend/src/routes/authRoutes.ts` (integrate 2FA check)
- `frontend/src/pages/Login.tsx` (add 2FA step)
- `frontend/src/pages/Settings.tsx` (add 2FA section)

---

## Security Considerations

- Store TOTP secrets encrypted at rest
- Hash backup codes with bcrypt
- Implement rate limiting on verification endpoints
- Log all 2FA-related actions for audit
- Use secure random generation for backup codes
- Clear session data on 2FA disable

---

## Dependencies

- `otplib` - TOTP implementation
- `qrcode` - QR code generation
- Encryption utilities (existing or new)
