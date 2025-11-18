# PulseGen License System - Implementation Guide

## Overview

PulseGen uses a cryptographically secure license key system based on RSA-2048 asymmetric encryption. This document explains how the system works and how to set it up.

## Security Architecture

### How It Works

1. **Key Generation**: RSA-2048 key pair (private/public keys)
2. **License Creation**: License data signed with private key (kept secret by you)
3. **License Validation**: Signature verified with public key (embedded in app)
4. **Anti-Tampering**: Multiple validation points and integrity checks
5. **Grace Period**: 30-day offline operation for temporary network issues

### Security Features

✅ **Cryptographic Signing**: RSA-2048 ensures licenses cannot be forged
✅ **Public Key Embedding**: Validation happens locally, no server required
✅ **Integrity Checks**: Detects tampering with license validation code
✅ **Multiple Validation Points**: License checked at startup and on critical operations
✅ **Grace Period**: Prevents service interruption during temporary issues
✅ **Audit Logging**: Tracks all license verification attempts

### What It Prevents

- ❌ Using the app without a license
- ❌ Creating fake license keys
- ❌ Bypassing license checks (requires code modification)
- ❌ Using expired licenses
- ❌ Exceeding user/survey/response limits

### Important Note

**No license system is 100% uncrackable** if someone has access to the source code. However, this implementation:
- Makes it **difficult and time-consuming** to bypass
- Requires **technical expertise** to crack
- Has **multiple layers of defense**
- **Deters casual piracy** effectively
- Is **standard practice** for commercial open-source software

Companies like GitLab, Sentry, and others use similar approaches successfully.

---

## Setup Instructions

### Step 1: Generate RSA Key Pair

First, generate your RSA-2048 key pair. **This only needs to be done once.**

```bash
cd /home/user/pulsegen

# Create keys directory
mkdir -p keys

# Generate private key (KEEP THIS SECRET!)
openssl genrsa -out keys/private.pem 2048

# Generate public key from private key
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Secure the private key
chmod 600 keys/private.pem
chmod 644 keys/public.pem
```

**⚠️ CRITICAL: Keep `private.pem` secure!**
- Never commit it to git
- Store backup in secure location (password manager, encrypted drive)
- If lost, you cannot generate new licenses for existing public key

### Step 2: Update Public Key in Application

Copy the public key content and update it in the application:

```bash
# Display public key
cat keys/public.pem
```

Copy the entire output (including BEGIN/END lines) and replace the `PUBLIC_KEY` constant in:
- `backend/src/utils/license.ts` (line ~28)

```typescript
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
... paste your public key here ...
-----END PUBLIC KEY-----`;
```

### Step 3: Add Keys to .gitignore

Ensure private key is NEVER committed:

```bash
# Add to .gitignore
echo "keys/private.pem" >> .gitignore
echo "licenses/" >> .gitignore
```

### Step 4: Run Database Migration

Add license tables to database:

```bash
cd backend

# Generate Prisma client with new License model
npx prisma generate

# Create migration
npx prisma migrate dev --name add_license_system

# Or for production
npx prisma migrate deploy
```

### Step 5: Install Dependencies

```bash
cd /home/user/pulsegen

# Backend
cd backend
npm install commander  # For license generation script

# Frontend (no additional deps needed)
cd ../frontend
npm install
```

### Step 6: Update Backend Routes

Add license routes to your Express app. Edit `backend/src/index.ts` or your main server file:

```typescript
import licenseRouter from './routes/license';
import { initializeLicense, requireLicense } from './middleware/license';

// Initialize license on startup
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Validate license
  const licenseValid = await initializeLicense();
  if (!licenseValid) {
    console.error('❌ Server started but NO VALID LICENSE found!');
    console.error('   Application functionality will be limited.');
  }
});

// Add license routes (BEFORE requireLicense middleware)
app.use('/api/license', licenseRouter);

// Apply license check to all other routes
app.use('/api', requireLicense);
```

### Step 7: Update Frontend Routes

Add license settings page to your router. Edit `frontend/src/App.tsx` or router config:

```tsx
import LicenseSettings from './pages/settings/LicenseSettings';

// Add route
<Route path="/settings/license" element={<LicenseSettings />} />
```

---

## Generating License Keys

### Method 1: Using the Script (Recommended)

```bash
cd /home/user/pulsegen

# Install ts-node if not already installed
npm install -g ts-node

# Generate a license
ts-node scripts/generate-license.ts \
  --email customer@example.com \
  --company "Acme Corporation" \
  --tier professional \
  --duration 365
```

**Parameters:**
- `--email`: Customer email address
- `--company`: Company name
- `--tier`: `starter`, `professional`, or `enterprise`
- `--duration`: License duration in days (default: 365)
- `--features`: Optional custom features (overrides tier defaults)

**Example Output:**
```
================================================================================
                     PULSEGEN LICENSE KEY GENERATED
================================================================================

📧 Customer Email:     customer@example.com
🏢 Company Name:       Acme Corporation
🎫 Tier:               PROFESSIONAL
📅 Issued:             1/15/2025
⏰ Expires:            1/15/2026
⌛ Duration:           365 days

📊 Limits:
   Users:              50
   Surveys:            100
   Responses/month:    10000

✨ Features:
   ✓ SSO
   ✓ WHITE LABEL
   ✓ ADVANCED ANALYTICS
   ✓ PRIORITY SUPPORT
   ✓ API ACCESS

================================================================================
LICENSE KEY:
================================================================================
eyJjdXN0b21lcklkIjoiY3VzdF8xMjM0NTY3ODkwIiwiZW1haWwiOiJjdXN0b21lckBleGFtcGxlLmNvbSI...
================================================================================

💾 License saved to: /home/user/pulsegen/licenses/license_customer_example.com_1234567890.txt
```

### Method 2: Programmatically

```javascript
const crypto = require('crypto');
const fs = require('fs');

function generateLicense(data) {
  const payload = {
    customerId: 'cust_' + crypto.randomBytes(8).toString('hex'),
    email: data.email,
    companyName: data.company,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + data.duration * 24 * 60 * 60 * 1000).toISOString(),
    tier: data.tier,
    maxUsers: data.maxUsers || -1,
    maxSurveys: data.maxSurveys || -1,
    maxResponses: data.maxResponses || -1,
    features: data.features
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');

  const privateKey = fs.readFileSync('keys/private.pem', 'utf-8');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(encodedPayload);
  sign.end();
  const signature = sign.sign(privateKey, 'base64');

  return `${encodedPayload}.${signature}`;
}

// Example usage
const license = generateLicense({
  email: 'customer@example.com',
  company: 'Acme Corp',
  tier: 'professional',
  duration: 365,
  maxUsers: 50,
  maxSurveys: 100,
  maxResponses: 10000,
  features: ['sso', 'white_label', 'advanced_analytics']
});

console.log(license);
```

---

## Customer Activation Process

### Step 1: Customer Receives License Key

Send license key to customer via email:

```
Subject: Your PulseGen License Key

Dear [Customer Name],

Thank you for purchasing PulseGen Professional!

Your License Key:
────────────────────────────────────────────────────────
[LICENSE_KEY_HERE]
────────────────────────────────────────────────────────

License Details:
- Tier: Professional
- Users: Up to 50
- Surveys: Up to 100
- Responses: Up to 10,000/month
- Expires: [DATE]

To activate:
1. Install PulseGen (see attached setup guide)
2. Visit http://your-server:3000/settings/license
3. Paste your license key
4. Click "Activate License"

Need help? Reply to this email or visit https://docs.pulsegen.com

Best regards,
PulseGen Team
```

### Step 2: Customer Activates License

1. Customer installs PulseGen
2. Visits `/settings/license` page
3. Pastes license key
4. Clicks "Activate"
5. System validates and activates license
6. Customer can now use PulseGen

### Step 3: Verification

License is automatically verified:
- On application startup
- Every hour during operation
- Before accessing premium features
- When checking usage limits

---

## Tier Configurations

### Starter - $99/month
```javascript
{
  maxUsers: 5,
  maxSurveys: 10,
  maxResponses: 1000,
  features: ['basic_analytics', 'email_support']
}
```

### Professional - $299/month
```javascript
{
  maxUsers: 50,
  maxSurveys: 100,
  maxResponses: 10000,
  features: [
    'sso',
    'white_label',
    'advanced_analytics',
    'priority_support',
    'api_access'
  ]
}
```

### Enterprise - Custom
```javascript
{
  maxUsers: -1,  // unlimited
  maxSurveys: -1,
  maxResponses: -1,
  features: [
    'sso',
    'white_label',
    'advanced_analytics',
    'custom_integrations',
    'dedicated_support',
    'api_access',
    'audit_logs',
    'custom_development'
  ]
}
```

---

## Feature Flags

Use feature flags in your code to enable/disable features:

### Backend Example

```typescript
import { requireFeature } from '../middleware/license';

// Protect route with feature flag
router.post('/api/sso/configure',
  requireFeature('sso'),
  async (req, res) => {
    // SSO configuration logic
  }
);
```

### Frontend Example

```tsx
import { useEffect, useState } from 'react';

function SSOSettings() {
  const [licenseFeatures, setLicenseFeatures] = useState([]);

  useEffect(() => {
    fetch('/api/license/status')
      .then(res => res.json())
      .then(data => {
        if (data.license?.features) {
          setLicenseFeatures(data.license.features);
        }
      });
  }, []);

  const hasSSO = licenseFeatures.includes('sso');

  if (!hasSSO) {
    return (
      <div className="upgrade-prompt">
        <h3>SSO requires Professional or Enterprise license</h3>
        <button>Upgrade Now</button>
      </div>
    );
  }

  return (
    <div>
      {/* SSO configuration UI */}
    </div>
  );
}
```

---

## Monitoring & Administration

### Check License Status

**Via API:**
```bash
curl http://localhost:5000/api/license/status
```

**Via Admin Panel:**
Visit `/settings/license` in the web UI

### View Usage Statistics

```typescript
// Get current usage
const status = await getLicenseStatus();
console.log(status.usage);
// {
//   users: 12,
//   surveys: 45,
//   responses: 3456,
//   lastUpdate: "2025-01-15T10:30:00Z"
// }
```

### Verification Logs

```sql
-- View recent verifications
SELECT * FROM "LicenseVerificationLog"
ORDER BY "verifiedAt" DESC
LIMIT 10;

-- Count failed verifications
SELECT COUNT(*) FROM "LicenseVerificationLog"
WHERE success = false
AND "verifiedAt" > NOW() - INTERVAL '7 days';
```

---

## Troubleshooting

### "No valid license found"

**Cause**: License not activated or expired
**Solution**:
1. Visit `/settings/license`
2. Enter valid license key
3. Check expiration date

### "License signature invalid"

**Cause**: Public key mismatch or tampered license
**Solution**:
1. Verify public key in `backend/src/utils/license.ts` matches your `keys/public.pem`
2. Request new license key from vendor
3. Check for application tampering

### "License expired"

**Cause**: License expiration date passed
**Solution**:
1. Generate new license with extended duration
2. Send to customer for activation
3. Customer activates new license

### "License limit exceeded"

**Cause**: Usage exceeds tier limits
**Solution**:
1. Reduce usage (remove users/surveys)
2. Upgrade to higher tier
3. Contact sales for custom limits

### Grace period activated

**Cause**: License verification failed (network issue)
**Solution**:
- Check network connectivity
- Verify license server accessible
- System will work for 30 days without connection
- Fix network issue before grace period expires

---

## Security Best Practices

### Protecting Your Private Key

1. **Never commit to Git**
   ```bash
   echo "keys/private.pem" >> .gitignore
   ```

2. **Backup securely**
   - Store in password manager
   - Keep encrypted backup
   - Use hardware security module (HSM) for enterprise

3. **Limit access**
   - Only license administrators need access
   - Use file permissions (`chmod 600`)
   - Audit access logs

4. **Rotate if compromised**
   - Generate new key pair
   - Update public key in app
   - Regenerate all licenses
   - Invalidate old licenses

### Monitoring for Abuse

```sql
-- Find licenses activated on multiple instances
SELECT email, "instanceId", COUNT(*) as count
FROM "License"
WHERE status = 'ACTIVE'
GROUP BY email, "instanceId"
HAVING COUNT(*) > 1;

-- Track verification failures
SELECT "licenseId", COUNT(*) as failures
FROM "LicenseVerificationLog"
WHERE success = false
AND "verifiedAt" > NOW() - INTERVAL '24 hours'
GROUP BY "licenseId"
HAVING COUNT(*) > 10;
```

---

## FAQ

### Can customers share license keys?

Technically yes, but:
- You can track via `instanceId` (server fingerprint)
- Terms of service should prohibit sharing
- You can revoke licenses if abused
- Enterprise customers may have multi-instance licenses

### What if private key is lost?

- Cannot generate new licenses for existing public key
- Must generate new key pair
- Update public key in app (requires app update)
- Re-issue licenses to all customers
- **Prevention**: Keep secure backups!

### Can this be cracked?

Yes, with enough effort:
- Someone with source access can remove checks
- However, it's time-consuming and annoying
- Each update may re-add checks
- Standard practice for open-core model
- Focus is on honest customers, not determined crackers

### How to handle license renewals?

Option 1: Generate new license
- Customer activates new key
- Seamless transition

Option 2: Extend existing license
- Update expiration in license payload
- Generate new key with same customerId
- Customer activates updated key

### Can I offer trial licenses?

Yes! Generate licenses with short duration:
```bash
ts-node scripts/generate-license.ts \
  --email trial@customer.com \
  --company "Trial User" \
  --tier professional \
  --duration 14  # 14-day trial
```

---

## Next Steps

1. ✅ Generate RSA key pair
2. ✅ Update public key in app
3. ✅ Run database migrations
4. ✅ Test license generation
5. ✅ Test license activation
6. ✅ Integrate with payment system (Stripe, etc.)
7. ✅ Automate license generation on purchase
8. ✅ Set up customer onboarding emails

For questions or support:
- Technical: See source code comments
- Business: Review COMMERCIALIZATION_STRATEGY.md
- Customer-facing: See CUSTOMER_SETUP_GUIDE.md
