# Simple GitHub Configuration Guide

**Vendor-Side Documentation**

Control all PulseGen instances from a single GitHub repository configuration file.

## Quick Overview

This system lets you:
- ✅ Edit a simple `config.json` file in GitHub
- ✅ All customer instances automatically fetch and apply changes
- ✅ Control licensing, analytics, features globally
- ✅ No customer intervention required
- ✅ Changes propagate within 5 minutes

## How It Works

```
┌─────────────────────────────────┐
│    Your Private GitHub Repo     │
│    genesis-nexus/pulsegen-config│
│                                 │
│    📄 config.json               │
│    {                            │
│      "licensing": {             │
│        "enforced": true         │
│      },                         │
│      "analytics": { ... }       │
│    }                            │
└─────────────────────────────────┘
              │
              │ Fetch every 5 min
              ↓
┌─────────────────────────────────┐
│    Customer Instances           │
│    (Self-Hosted PulseGen)       │
│                                 │
│    1. Fetch config from Git     │
│    2. Apply to database         │
│    3. Override local changes    │
└─────────────────────────────────┘
```

## Setup (One-Time)

### 1. Create Private GitHub Repository

```bash
# Create private repository for configs
gh repo create genesis-nexus/pulsegen-config --private

# Or create via GitHub web interface
# https://github.com/new
# Name: pulsegen-config
# Visibility: Private
```

### 2. Generate GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: "PulseGen Config Access"
4. Select scopes: **`repo`** (Full control of private repositories)
5. Generate and copy the token: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3. Embed Token in Application

**Encode the token:**
```bash
echo -n "ghp_your_actual_token_here" | base64
# Output: Z2hwX3lvdXJfYWN0dWFsX3Rva2VuX2hlcmU=
```

**Update `backend/src/utils/remoteConfig.ts`:**
```typescript
const EMBEDDED_GIT_CONFIG = {
  github: {
    repo: 'genesis-nexus/pulsegen-config',
    token: 'Z2hwX3lvdXJfYWN0dWFsX3Rva2VuX2hlcmU=',  // Your base64 encoded token
    branch: 'main',
    file: 'config.json'
  }
};
```

### 4. Create Initial Configuration

**Create `config.json` in your repo:**

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-18T00:00:00Z",

  "licensing": {
    "enforced": false,
    "gracePeriodDays": 30,
    "allowOffline": true
  },

  "analytics": {
    "enabled": false,
    "googleAnalyticsId": null
  },

  "features": {
    "aiGeneration": true,
    "ssoEnabled": false,
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
    "message": null,
    "allowedIPs": []
  }
}
```

**Commit and push:**
```bash
cd /path/to/pulsegen-config
git add config.json
git commit -m "Initial configuration"
git push origin main
```

### 5. Build and Deploy

```bash
cd /path/to/pulsegen/backend
npm run build

# Deploy to customers with embedded token in compiled code
```

## Usage

### Enable Licensing for All Instances

**Edit `config.json`:**
```json
{
  "licensing": {
    "enforced": true,
    "gracePeriodDays": 7,
    "allowOffline": true
  }
}
```

**Commit and push:**
```bash
git add config.json
git commit -m "Enable license enforcement globally"
git push
```

**Result:** All instances will enable licensing within 5 minutes automatically.

### Enable Google Analytics

**Edit `config.json`:**
```json
{
  "analytics": {
    "enabled": true,
    "googleAnalyticsId": "G-XXXXXXXXXX"
  }
}
```

**Commit and push:**
```bash
git add config.json
git commit -m "Enable Google Analytics"
git push
```

### Enable Maintenance Mode

**Edit `config.json`:**
```json
{
  "maintenance": {
    "enabled": true,
    "message": "Scheduled maintenance - back online at 3pm UTC",
    "allowedIPs": ["203.0.113.1"]
  }
}
```

**Commit and push:**
```bash
git add config.json
git commit -m "Enable maintenance mode"
git push
```

### Disable a Feature Globally

**Edit `config.json`:**
```json
{
  "features": {
    "ssoEnabled": false
  }
}
```

**Commit and push:**
```bash
git add config.json
git commit -m "Disable SSO feature"
git push
```

## Instance-Specific Configuration

Different settings for production/staging/development:

**Edit `config.json`:**
```json
{
  "licensing": {
    "enforced": false
  },

  "instanceSpecific": {
    "production": {
      "licensing": {
        "enforced": true
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
  }
}
```

**In customer `.env`:**
```bash
INSTANCE_ID=production
```

This applies production-specific overrides automatically.

## Configuration Reference

### Licensing Settings

```json
{
  "licensing": {
    "enforced": true,           // Require license keys
    "gracePeriodDays": 30,      // Offline grace period
    "allowOffline": true        // Allow offline operation
  }
}
```

### Analytics Settings

```json
{
  "analytics": {
    "enabled": true,
    "googleAnalyticsId": "G-XXXXXXXXXX"
  }
}
```

### Feature Flags

```json
{
  "features": {
    "aiGeneration": true,       // AI-powered question generation
    "ssoEnabled": true,         // Single Sign-On
    "whiteLabel": true,         // White labeling
    "advancedAnalytics": true,  // Advanced analytics
    "customIntegrations": true, // Custom integrations
    "auditLogs": true          // Audit logging
  }
}
```

### Limits

```json
{
  "limits": {
    "maxSurveysPerUser": 1000,
    "maxResponsesPerSurvey": 100000,
    "maxFileSize": 10485760      // Bytes (10MB)
  }
}
```

### Maintenance Mode

```json
{
  "maintenance": {
    "enabled": true,
    "message": "System maintenance in progress",
    "allowedIPs": ["203.0.113.1", "203.0.113.2"]
  }
}
```

## Security

### Why This Is Secure

1. **Private Repository:** Only you can modify the config
2. **Read-Only Token:** Even if customers find the token, they can only READ (not write) the config
3. **Embedded Token:** Not in `.env` files, embedded in compiled code
4. **Database Override:** Remote config overwrites any local database changes
5. **No .env Bypass:** Application ignores `LICENSE_ENFORCED` in `.env`

### What Customers Cannot Do

❌ Modify the config in GitHub (private repo, read-only token)
❌ Bypass licensing via `.env` variables (ignored by app)
❌ Prevent config fetching (token embedded in code)
❌ Modify database settings (overwritten every 5 minutes)

### Token Rotation

If you need to rotate the GitHub token:

1. **Generate new token** in GitHub
2. **Base64 encode** the new token
3. **Update** `EMBEDDED_GIT_CONFIG.github.token` in remoteConfig.ts
4. **Build and deploy** new version to customers
5. **Revoke old token** in GitHub

## Troubleshooting

### Config Not Loading

**Check logs:**
```bash
# Look for config fetch messages
tail -f backend/logs/app.log | grep config
```

**Test token manually:**
```bash
# Decode token
echo "Z2hwX3lvdXJfYWN0dWFsX3Rva2VuX2hlcmU=" | base64 -d

# Test API access
curl -H "Authorization: token ghp_your_token" \
  https://api.github.com/repos/genesis-nexus/pulsegen-config/contents/config.json
```

### Changes Not Applying

Config refreshes every 5 minutes. Wait up to 5 minutes after pushing changes.

**Force immediate refresh:**
```bash
# Restart the application
pm2 restart pulsegen

# Or trigger manual refresh via API
curl -X POST http://localhost:3001/api/config/refresh
```

### Invalid Configuration

**Validate JSON syntax:**
```bash
cat config.json | jq .
# Should display formatted JSON
# If error, fix syntax issues
```

**Check required fields:**
- `version` (string)
- `licensing` (object)
- `features` (object)
- `licensing.enforced` (boolean)

## Common Workflows

### Transition from Free to Paid

**Week 1:** Free mode (collect data)
```json
{
  "licensing": { "enforced": false },
  "analytics": { "enabled": true, "googleAnalyticsId": "G-XXX" }
}
```

**Week 4:** Enable licensing
```json
{
  "licensing": { "enforced": true }
}
```

### Gradual Feature Rollout

**Phase 1:** Enable for staging only
```json
{
  "features": { "ssoEnabled": false },
  "instanceSpecific": {
    "staging": {
      "features": { "ssoEnabled": true }
    }
  }
}
```

**Phase 2:** Enable for all
```json
{
  "features": { "ssoEnabled": true }
}
```

### Emergency Maintenance

```json
{
  "maintenance": {
    "enabled": true,
    "message": "Emergency maintenance - investigating database issue",
    "allowedIPs": ["your.office.ip"]
  }
}
```

Commit and push - all instances show maintenance page within 5 minutes.

## Best Practices

### 1. Version Your Changes

```bash
git commit -m "v1.1.0: Enable licensing for production instances"
git tag v1.1.0
git push --tags
```

### 2. Test Changes in Staging First

Use `instanceSpecific` to test on staging before rolling out to production.

### 3. Document Changes

Keep a `CHANGELOG.md` in your config repo:

```markdown
# Configuration Changelog

## 2025-01-18 - Enable Licensing
- Set `licensing.enforced: true` for production
- Analytics tracking enabled

## 2025-01-15 - Initial Setup
- Created baseline configuration
- Licensing disabled during beta
```

### 4. Backup Configuration

```bash
# Backup before major changes
cp config.json config.backup.$(date +%Y%m%d).json
git add config.backup.*.json
git commit -m "Backup before licensing change"
```

### 5. Monitor Config Fetches

Check application logs to ensure instances are fetching config successfully:

```bash
grep "Remote config fetched" backend/logs/app.log
```

## Summary

**Setup:**
1. Create private GitHub repo
2. Generate GitHub token (read-only)
3. Embed token in application code
4. Build and deploy

**Daily Use:**
1. Edit `config.json` in GitHub
2. Commit and push
3. Changes apply automatically within 5 minutes

**Simple, centralized, secure control of all PulseGen instances.**

---

For questions or issues, check the troubleshooting section above.
