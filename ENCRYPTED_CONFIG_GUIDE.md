# Encrypted Configuration System

**VENDOR-SIDE DOCUMENTATION**

This guide explains how to use the encrypted configuration system to securely manage PulseGen settings across all customer instances.

## Table of Contents

- [Overview](#overview)
- [Security Model](#security-model)
- [Quick Start](#quick-start)
- [Detailed Workflow](#detailed-workflow)
- [Key Management](#key-management)
- [Configuration Format](#configuration-format)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

### The Problem

With self-hosted deployments, customers have access to:
- Backend server and file system
- `.env` configuration files
- Database access
- Source code

This means they can potentially:
- Modify `LICENSE_ENFORCED=false` in `.env`
- Remove GitHub API tokens
- Bypass remote configuration entirely
- Override licensing settings

### The Solution

**Encrypted Configuration System:**

1. **All critical configuration stored encrypted in Git**
   - GitHub repository contains `config.encrypted.json`
   - Encrypted with AES-256-GCM
   - Signed to prevent tampering

2. **Decryption keys embedded in application**
   - Keys split and obfuscated in source code
   - Not in `.env` files
   - Cannot be easily extracted

3. **No local overrides allowed**
   - Application ignores `.env` for critical settings
   - Only remote encrypted config is trusted
   - Database updated from remote config

4. **Vendor controls everything from Git**
   - Commit changes to config repo
   - All instances fetch and decrypt
   - Changes applied automatically (5 min refresh)

---

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                      VENDOR SIDE                             │
├─────────────────────────────────────────────────────────────┤
│  1. Edit config.json (plaintext)                            │
│  2. Run: encrypt-config.ts                                   │
│  3. Commit config.encrypted.json to private Git repo        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ GitHub API (HTTPS)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   CUSTOMER INSTANCE                          │
├─────────────────────────────────────────────────────────────┤
│  1. Fetch config.encrypted.json from Git                    │
│  2. Verify signature (prevent tampering)                    │
│  3. Decrypt with embedded key                               │
│  4. Apply configuration                                      │
│  5. Update database (overrides any local changes)           │
└─────────────────────────────────────────────────────────────┘
```

### Security Features

- **AES-256-GCM Encryption**: Military-grade encryption
- **Authentication Tag**: Prevents tampering during transit
- **Signature Verification**: Detects any modifications
- **Embedded Keys**: Keys in compiled code, not `.env`
- **Key Obfuscation**: Keys split into fragments
- **No Local Overrides**: `.env` variables ignored for security
- **Periodic Refresh**: Config updated every 5 minutes

---

## Quick Start

### 1. Generate Encryption Key

```bash
cd /path/to/pulsegen
ts-node scripts/encrypt-config.ts generate-key --output .encryption-key
```

**Output:**
```
🔑 Generating AES-256 encryption key...

Generated Key (Hex):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3f7a8b2c9d4e5f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT: Store this key securely!
✅ Key saved to: .encryption-key
```

### 2. Embed Key in Application

Edit `backend/src/utils/embeddedKeys.ts`:

```typescript
const KEY_FRAGMENTS = {
  database_salt: 'M2Y3YThiMmM5ZDRl',      // First part of key
  api_version: 'NWY2YTFiMmMzZDRl',        // Second part
  session_token: 'NWY2YTdiOGM5ZDA=',     // Third part
  jwt_secret: 'ZTFmMmEzYjRjNWQ2',        // Fourth part
  cache_key: 'ZTdmOGE5YjBjMWQy'          // Fifth part
};
```

**How to split the key:**
1. Take your 64-character hex key
2. Split into 5 parts (roughly 12-13 chars each)
3. Base64 encode each part
4. Update KEY_FRAGMENTS with encoded parts

### 3. Update Git Repository Configuration

Edit `backend/src/utils/remoteConfig.ts`:

```typescript
const EMBEDDED_GIT_CONFIG = {
  github: {
    repo: 'your-org/pulsegen-config',           // Your private repo
    token: 'Z2hwX3lvdXJfZ2l0aHViX3Rva2VuX2hlcmU=', // Base64 encoded GitHub PAT
    branch: 'main',
    file: 'config.encrypted.json'
  }
};
```

**To encode GitHub token:**
```bash
echo -n "ghp_your_actual_github_token" | base64
```

### 4. Create Configuration

Edit `config.json`:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-18T00:00:00Z",
  "licensing": {
    "enforced": true,
    "gracePeriodDays": 7,
    "allowOffline": true
  },
  "analytics": {
    "enabled": true,
    "googleAnalyticsId": "G-XXXXXXXXXX"
  },
  "features": {
    "aiGeneration": true,
    "ssoEnabled": true,
    "whiteLabel": true,
    "advancedAnalytics": true,
    "customIntegrations": true,
    "auditLogs": true
  },
  "limits": {
    "maxSurveysPerUser": 1000,
    "maxResponsesPerSurvey": 100000,
    "maxFileSize": 10485760
  },
  "maintenance": {
    "enabled": false,
    "message": "System maintenance in progress",
    "allowedIPs": []
  }
}
```

### 5. Encrypt Configuration

```bash
ts-node scripts/encrypt-config.ts encrypt \
  --input config.json \
  --output config.encrypted.json \
  --key-file .encryption-key
```

**Output:**
```
🔒 Encrypting configuration...

📄 Input file: config.json
📊 Config version: 1.0.0
🔑 Encryption key loaded (32 bytes)

✅ Configuration encrypted successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Output file: config.encrypted.json
🔐 Algorithm: aes-256-gcm
📅 Timestamp: 2025-01-18T12:00:00.000Z
✍️  Signature: a7b8c9d0e1f2...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6. Deploy to Git Repository

```bash
# Create private Git repository
gh repo create your-org/pulsegen-config --private

# Initialize and push
cd /path/to/config-repo
git init
git add config.encrypted.json
git commit -m "feat: Add encrypted configuration"
git remote add origin git@github.com:your-org/pulsegen-config.git
git push -u origin main
```

### 7. Build and Deploy Application

```bash
# Build application with embedded keys
cd /path/to/pulsegen/backend
npm run build

# Deploy built application to customers
# Keys and credentials are now embedded in compiled code
```

---

## Detailed Workflow

### Initial Setup (One-Time)

1. **Generate Master Encryption Key**
   ```bash
   ts-node scripts/encrypt-config.ts generate-key --output ~/.pulsegen-master-key
   chmod 600 ~/.pulsegen-master-key
   ```

2. **Create Private Git Repository**
   ```bash
   gh repo create your-org/pulsegen-config --private --description "PulseGen Configuration Repository"
   ```

3. **Generate GitHub Personal Access Token**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Scopes: `repo` (Full control of private repositories)
   - Copy token: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. **Embed Credentials in Application**

   **A. Split and encode encryption key:**
   ```bash
   # Your key: 3f7a8b2c9d4e5f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e

   # Split into 5 parts:
   # Part 1: 3f7a8b2c9d4e
   # Part 2: 5f6a1b2c3d4e
   # Part 3: 5f6a7b8c9d0e
   # Part 4: 1f2a3b4c5d6e
   # Part 5: 7f8a9b0c1d2e

   # Base64 encode each part:
   echo -n "3f7a8b2c9d4e" | base64  # M2Y3YThiMmM5ZDRl
   echo -n "5f6a1b2c3d4e" | base64  # NWY2YTFiMmMzZDRl
   # ... etc
   ```

   Update `backend/src/utils/embeddedKeys.ts`:
   ```typescript
   const KEY_FRAGMENTS = {
     database_salt: 'M2Y3YThiMmM5ZDRl',
     api_version: 'NWY2YTFiMmMzZDRl',
     session_token: 'NWY2YTdiOGM5ZDA=',
     jwt_secret: 'ZTFmMmEzYjRjNWQ2',
     cache_key: 'ZTdmOGE5YjBjMWQy'
   };
   ```

   **B. Encode GitHub token:**
   ```bash
   echo -n "ghp_your_actual_token" | base64
   ```

   Update `backend/src/utils/remoteConfig.ts`:
   ```typescript
   const EMBEDDED_GIT_CONFIG = {
     github: {
       repo: 'your-org/pulsegen-config',
       token: 'Z2hwX3lvdXJfYWN0dWFsX3Rva2Vu',  // Base64 encoded token
       branch: 'main',
       file: 'config.encrypted.json'
     }
   };
   ```

5. **Build Application with Embedded Keys**
   ```bash
   cd backend
   npm run build
   # Compiled code now contains embedded credentials
   ```

### Regular Configuration Updates

When you need to change settings (enable licensing, update analytics ID, etc.):

1. **Edit Configuration**
   ```bash
   vim config.json  # Edit as needed
   ```

2. **Encrypt Configuration**
   ```bash
   ts-node scripts/encrypt-config.ts encrypt \
     --input config.json \
     --output config.encrypted.json \
     --key-file ~/.pulsegen-master-key
   ```

3. **Commit to Git**
   ```bash
   cd /path/to/pulsegen-config
   cp /path/to/pulsegen/config.encrypted.json .
   git add config.encrypted.json
   git commit -m "feat: Enable license enforcement for all instances"
   git push origin main
   ```

4. **Changes Propagate Automatically**
   - All customer instances fetch config every 5 minutes
   - Config is decrypted and applied automatically
   - No customer action required
   - No way for customers to bypass changes

---

## Key Management

### Key Storage Best Practices

1. **Master Key File**
   ```bash
   # Store in secure location
   ~/.pulsegen-master-key

   # Set strict permissions
   chmod 600 ~/.pulsegen-master-key

   # Backup to encrypted storage
   # (1Password, AWS Secrets Manager, etc.)
   ```

2. **Key Rotation**
   ```bash
   # Generate new key
   ts-node scripts/encrypt-config.ts generate-key --output .new-encryption-key

   # Re-encrypt all configs with new key
   ts-node scripts/encrypt-config.ts encrypt \
     --input config.json \
     --output config.encrypted.json \
     --key-file .new-encryption-key

   # Update embedded keys in code
   # Build and deploy new version
   ```

3. **Key Recovery**
   - Store backup in password manager
   - Keep offline copy in secure location
   - Document key location in team wiki
   - **Never commit key to Git**

### GitHub Token Management

1. **Token Permissions**
   - Scope: `repo` (full control of private repositories)
   - Never use tokens with admin or org access
   - Create separate token per application

2. **Token Rotation**
   ```bash
   # Generate new token in GitHub
   # Base64 encode new token
   echo -n "ghp_new_token" | base64

   # Update EMBEDDED_GIT_CONFIG in remoteConfig.ts
   # Build and deploy new version

   # Revoke old token in GitHub
   ```

---

## Configuration Format

### Full Configuration Schema

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-18T00:00:00Z",
  "description": "Production configuration for all PulseGen instances",

  "licensing": {
    "enforced": true,
    "gracePeriodDays": 7,
    "allowOffline": true,
    "comment": "Set enforced=true to require license keys"
  },

  "analytics": {
    "enabled": true,
    "googleAnalyticsId": "G-PROD123456",
    "comment": "Google Analytics 4 Measurement ID"
  },

  "features": {
    "aiGeneration": true,
    "ssoEnabled": true,
    "whiteLabel": true,
    "advancedAnalytics": true,
    "customIntegrations": true,
    "auditLogs": true,
    "comment": "Feature flags - toggle features on/off globally"
  },

  "limits": {
    "maxSurveysPerUser": 1000,
    "maxResponsesPerSurvey": 100000,
    "maxFileSize": 10485760,
    "comment": "Global limits applied to all instances"
  },

  "maintenance": {
    "enabled": false,
    "message": "System is under maintenance. Please try again later.",
    "allowedIPs": ["203.0.113.1", "203.0.113.2"],
    "comment": "Enable maintenance mode to show maintenance page"
  },

  "instanceSpecific": {
    "production": {
      "licensing": {
        "enforced": true,
        "gracePeriodDays": 7
      },
      "analytics": {
        "enabled": true,
        "googleAnalyticsId": "G-PROD123456"
      }
    },
    "staging": {
      "licensing": {
        "enforced": false
      },
      "analytics": {
        "enabled": true,
        "googleAnalyticsId": "G-STAGING123"
      }
    }
  },

  "_meta": {
    "comment": "This configuration is encrypted before being committed to Git",
    "repository": "your-org/pulsegen-config",
    "documentation": "See ENCRYPTED_CONFIG_GUIDE.md"
  }
}
```

### Instance-Specific Configuration

Use `INSTANCE_ID` environment variable to apply specific configs:

```bash
# In customer .env file (this is ALLOWED)
INSTANCE_ID=production
```

This allows different settings per environment while keeping core settings secure.

---

## Deployment

### Building Application with Embedded Keys

```bash
# 1. Ensure keys are embedded in source code
# 2. Build TypeScript to JavaScript
cd backend
npm run build

# 3. Compiled code in dist/ contains embedded keys
# 4. Deploy dist/ to customers
```

### What Gets Deployed to Customers

**Included:**
- Compiled JavaScript with embedded keys
- Dependencies (node_modules)
- Database migrations
- Public assets

**NOT Included:**
- Source `.ts` files (optional)
- `.encryption-key` file
- `config.json` (plaintext)
- Git history of config repo

**Customer Cannot Access:**
- Private Git repository
- Encryption key (embedded, obfuscated)
- GitHub API token (embedded, encoded)

---

## Troubleshooting

### Config Not Loading

**Symptom:** App logs show config fetch failures

**Check:**
```bash
# 1. Verify embedded GitHub token is correct
# In remoteConfig.ts, decode token:
echo "Z2hwX3lvdXJfYWN0dWFsX3Rva2Vu" | base64 -d

# 2. Test token with curl
curl -H "Authorization: token ghp_your_token" \
  https://api.github.com/repos/your-org/pulsegen-config/contents/config.encrypted.json

# 3. Check token permissions in GitHub
# Must have 'repo' scope
```

### Decryption Fails

**Symptom:** "Configuration decryption failed" error

**Check:**
```bash
# 1. Test decryption manually
ts-node scripts/encrypt-config.ts decrypt \
  --input config.encrypted.json \
  --output test-decrypted.json \
  --key-file ~/.pulsegen-master-key

# 2. If manual decryption works, check embedded key fragments
# Compare embedded key reconstruction with actual key

# 3. Verify key hasn't been modified
```

### Signature Verification Fails

**Symptom:** "Configuration signature verification failed"

**Fix:**
```bash
# Re-encrypt config with correct signature
ts-node scripts/encrypt-config.ts encrypt \
  --input config.json \
  --output config.encrypted.json \
  --key-file ~/.pulsegen-master-key

# Commit to Git
git add config.encrypted.json
git commit -m "fix: Re-encrypt config with valid signature"
git push
```

### Customers Bypassing Settings

**Symptom:** Customer reports they can modify `.env` to disable licensing

**Verify:**
1. Check if code checks `process.env.LICENSE_ENFORCED`
   ```bash
   grep -r "process.env.LICENSE_ENFORCED" backend/src/
   # Should return NO results (except in comments)
   ```

2. Ensure config service uses only remote config
   ```typescript
   // ✅ CORRECT
   isLicenseEnforced(): boolean {
     return this.config?.licensing.enforced ?? false;
   }

   // ❌ INCORRECT (allows bypass)
   isLicenseEnforced(): boolean {
     if (process.env.LICENSE_ENFORCED) {
       return process.env.LICENSE_ENFORCED === 'true';
     }
     return this.config?.licensing.enforced ?? false;
   }
   ```

---

## Common Use Cases

### Enable Licensing for All Instances

```json
{
  "licensing": {
    "enforced": true,
    "gracePeriodDays": 7
  }
}
```

### Disable Licensing (Free Mode)

```json
{
  "licensing": {
    "enforced": false
  }
}
```

### Enable Analytics

```json
{
  "analytics": {
    "enabled": true,
    "googleAnalyticsId": "G-XXXXXXXXXX"
  }
}
```

### Enable Maintenance Mode

```json
{
  "maintenance": {
    "enabled": true,
    "message": "Scheduled maintenance - back in 2 hours",
    "allowedIPs": ["your.office.ip"]
  }
}
```

### Disable Feature Globally

```json
{
  "features": {
    "ssoEnabled": false
  }
}
```

---

## Security Checklist

Before deploying to customers:

- [ ] Encryption key generated and backed up securely
- [ ] Key fragments embedded in `embeddedKeys.ts`
- [ ] GitHub token embedded in `remoteConfig.ts`
- [ ] Private Git repo created with encrypted config
- [ ] Code built with `npm run build`
- [ ] No `.env` checks for `LICENSE_ENFORCED` in code
- [ ] No plaintext keys in source code
- [ ] `.encryption-key` file in `.gitignore`
- [ ] GitHub token has minimal permissions (`repo` scope only)
- [ ] Test decryption works with embedded keys
- [ ] Config refresh works (check logs)

---

## Conclusion

This encrypted configuration system provides:

✅ **Centralized Control** - Update all instances from Git
✅ **Tamper-Proof** - Customers cannot bypass settings
✅ **Secure** - AES-256 encryption with embedded keys
✅ **Flexible** - Instance-specific overrides
✅ **Automatic** - Changes propagate without customer action

**Next Steps:**
1. Generate your encryption key
2. Create private Git repository
3. Embed credentials in code
4. Encrypt and commit configuration
5. Build and deploy to customers

For questions or issues, refer to the troubleshooting section or contact support.
