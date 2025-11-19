# Remote Configuration Guide

## Overview

PulseGen uses a **Git-based remote configuration system** that allows you to control all instances from a centralized private repository. No code changes or server restarts needed - just update the config file in Git!

### Benefits

✅ **Centralized Control** - Manage all instances from one place
✅ **Instant Updates** - Changes propagate automatically (within 5 minutes)
✅ **Version Control** - Full audit trail and rollback capability
✅ **Server-Side Only** - Client has no control, all decisions from your Git repo
✅ **Instance-Specific** - Different settings for production/staging/dev
✅ **Secure** - Private repo with token authentication
✅ **Fallback** - Local cache if Git unavailable

---

## Quick Setup (5 Minutes)

### Step 1: Create Private Config Repository

```bash
# On GitHub
1. Go to https://github.com/new
2. Repository name: pulsegen-config
3. Visibility: Private ⚠️ IMPORTANT
4. Initialize with README: ✅
5. Create repository
```

### Step 2: Create Configuration File

Create `config.json` in your new repo:

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
    "enabled": false
  }
}
```

Commit and push:
```bash
git add config.json
git commit -m "Initial PulseGen configuration"
git push
```

### Step 3: Generate GitHub Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: `PulseGen Config Access`
4. Expiration: No expiration (or 1 year, then regenerate)
5. Scopes: Select **only** `repo` (full control of private repositories)
6. Click "Generate token"
7. **Copy token immediately** (you won't see it again!)

Example token: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 4: Configure PulseGen

Add to your `.env` file:

```bash
# Remote Configuration
REMOTE_CONFIG_REPO=genesis-nexus/pulsegen-config
REMOTE_CONFIG_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REMOTE_CONFIG_FILE=config.json
REMOTE_CONFIG_BRANCH=main

# Optional: Change refresh interval (default: 5 minutes)
CONFIG_REFRESH_INTERVAL_MS=300000

# Optional: Instance ID for instance-specific config
INSTANCE_ID=production
```

### Step 5: Restart PulseGen

```bash
docker-compose restart backend

# Or if running manually
npm run dev
```

**Check logs:**
```
🔧 Initializing configuration service...
🔄 Fetching remote config from: genesis-nexus/pulsegen-config/config.json
✅ Remote config fetched successfully (version: 1.0.0)
💾 Config cached locally
📝 Configuration updated
🔓 License enforcement: DISABLED
📊 Analytics: DISABLED
✨ Enabled features: aiGeneration, whiteLabel, advancedAnalytics, customIntegrations, auditLogs
⏰ Config refresh scheduled every 300 seconds
✅ Configuration service initialized
```

**Done!** Your instance now pulls configuration from Git.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Your Private Git Repository                                │
│  genesis-nexus/pulsegen-config                              │
│                                                             │
│  config.json ← You edit this file                          │
│  {                                                          │
│    "licensing": { "enforced": true },                      │
│    "analytics": { "enabled": true }                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    (GitHub API)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PulseGen Instance(s)                                       │
│                                                             │
│  Startup:                                                   │
│    1. Fetch config from Git                                │
│    2. Cache locally (.config-cache.json)                   │
│    3. Apply settings                                       │
│                                                             │
│  Every 5 minutes:                                           │
│    1. Check Git for updates                                │
│    2. If changed, apply new settings                       │
│    3. Update cache                                         │
│                                                             │
│  If Git unavailable:                                        │
│    1. Use cached config                                    │
│    2. Keep running normally                                │
│    3. Retry Git on next refresh                            │
└─────────────────────────────────────────────────────────────┘
```

**Timeline:**
- **T+0s**: You commit config change to Git
- **T+0-5m**: PulseGen checks for updates (based on refresh interval)
- **T+0-5m**: New config applied automatically
- **No restart needed!**

---

## Configuration Reference

### Licensing

```json
"licensing": {
  "enforced": false,           // true = require license, false = free mode
  "gracePeriodDays": 30,       // Days to allow offline operation
  "allowOffline": true         // Allow offline grace period
}
```

**To enable licensing:**
```json
"licensing": {
  "enforced": true,
  "gracePeriodDays": 7,
  "allowOffline": true
}
```

Commit, push, wait ~5 minutes → All instances now require licenses!

### Analytics

```json
"analytics": {
  "enabled": false,              // true = enable tracking
  "googleAnalyticsId": null      // GA4 Measurement ID (G-XXXXXXXXXX)
}
```

**To enable Google Analytics:**
```json
"analytics": {
  "enabled": true,
  "googleAnalyticsId": "G-PROD123456"
}
```

### Features (Feature Flags)

```json
"features": {
  "aiGeneration": true,          // AI-powered survey generation
  "ssoEnabled": false,           // Single Sign-On
  "whiteLabel": true,            // Remove PulseGen branding
  "advancedAnalytics": true,     // Advanced reporting
  "customIntegrations": true,    // Custom webhooks/APIs
  "auditLogs": true              // Activity audit logs
}
```

**To disable a feature globally:**
```json
"features": {
  "aiGeneration": false  // Disables AI across all instances
}
```

### Limits

```json
"limits": {
  "maxSurveysPerUser": 1000,     // Max surveys per user
  "maxResponsesPerSurvey": 100000, // Max responses per survey
  "maxFileSize": 10485760        // Max upload size (10MB)
}
```

### Maintenance Mode

```json
"maintenance": {
  "enabled": false,                            // Enable maintenance mode
  "message": "System under maintenance",       // Message to display
  "allowedIPs": ["203.123.45.67"]             // IPs that can access during maintenance
}
```

**To enable maintenance:**
```json
"maintenance": {
  "enabled": true,
  "message": "We're performing scheduled maintenance. Back in 30 minutes!",
  "allowedIPs": ["your.office.ip.here"]
}
```

All users see maintenance page except your office IP!

---

## Instance-Specific Configuration

Different settings for production vs staging vs development:

```json
{
  "licensing": {
    "enforced": false  // Default for all instances
  },

  "instanceSpecific": {
    "production": {
      "licensing": {
        "enforced": true  // Production requires licenses
      },
      "analytics": {
        "enabled": true,
        "googleAnalyticsId": "G-PROD123456"
      }
    },
    "staging": {
      "licensing": {
        "enforced": false  // Staging is free
      },
      "analytics": {
        "enabled": true,
        "googleAnalyticsId": "G-STAGING123"
      }
    }
  }
}
```

**Set instance ID in .env:**
```bash
# Production server
INSTANCE_ID=production

# Staging server
INSTANCE_ID=staging
```

Each instance gets its own settings!

---

## Common Workflows

### Enable Licensing Globally

**1. Edit config.json in Git:**
```json
{
  "licensing": {
    "enforced": true,
    "gracePeriodDays": 30
  }
}
```

**2. Commit and push:**
```bash
git add config.json
git commit -m "Enable license enforcement"
git push
```

**3. Wait ~5 minutes**

**4. Check logs:**
```
🔄 Refreshing configuration...
✅ Remote config fetched successfully (version: 1.0.1)
📝 Configuration updated
🔒 License enforcement: ENABLED
```

Done! All instances now require licenses.

### Rollback Configuration

**Option 1: Git Revert**
```bash
git log  # Find commit hash
git revert abc123
git push
```

**Option 2: Edit File**
```bash
# Change settings back
git add config.json
git commit -m "Rollback licensing to free mode"
git push
```

Full audit trail in Git history!

### Emergency Maintenance Mode

**1. Quick edit on GitHub:**
- Go to your config repo
- Click `config.json` → Edit (pencil icon)
- Change: `"maintenance": { "enabled": true }`
- Commit directly to main

**2. Within 5 minutes:**
All instances show maintenance page!

**3. To disable:**
- Edit again: `"enabled": false`
- Commit

---

## Advanced Features

### Multiple Configuration Files

**Organize by environment:**

```
pulsegen-config/
├── production.json
├── staging.json
└── development.json
```

**Per-instance .env:**
```bash
# Production
REMOTE_CONFIG_FILE=production.json

# Staging
REMOTE_CONFIG_FILE=staging.json
```

### GitLab Support

```bash
# .env
REMOTE_CONFIG_GITLAB_PROJECT_ID=12345678
REMOTE_CONFIG_GITLAB_TOKEN=glpat-xxxxxxxxxxxxx
REMOTE_CONFIG_FILE=config.json
REMOTE_CONFIG_BRANCH=main
```

### Raw URL Support

For other Git hosts (Bitbucket, Gitea, etc.):

```bash
# .env
REMOTE_CONFIG_RAW_URL=https://raw.githubusercontent.com/user/repo/main/config.json
# Or with authentication
REMOTE_CONFIG_TOKEN=Bearer xxxxx
```

### Custom Refresh Interval

```bash
# .env
CONFIG_REFRESH_INTERVAL_MS=60000  # 1 minute (fast)
CONFIG_REFRESH_INTERVAL_MS=600000  # 10 minutes (slow)
CONFIG_REFRESH_INTERVAL_MS=3600000  # 1 hour (very slow)
```

---

## Monitoring & Management

### Check Configuration Status

**API endpoint:**
```bash
curl http://localhost:5000/api/config/status
```

**Response:**
```json
{
  "current": {
    "version": "1.0.0",
    "lastUpdated": "2025-01-18T10:00:00Z",
    "lastFetch": "2025-01-18T10:05:32Z",
    "refreshInterval": 300000
  },
  "remote": {
    "configured": true,
    "cacheAvailable": true,
    "cacheAgeMs": 15000
  },
  "licensing": {
    "enforced": false
  },
  "analytics": {
    "enabled": true,
    "id": "G-PROD123456"
  }
}
```

### Force Refresh

**API:**
```bash
curl -X POST http://localhost:5000/api/config/refresh
```

**Or in code:**
```typescript
import { configService } from './services/configService';
await configService.forceRefresh();
```

### Clear Cache

```bash
curl -X POST http://localhost:5000/api/config/clear-cache
```

### View Current Config

```bash
curl http://localhost:5000/api/config/current
```

---

## Security Best Practices

### 1. Private Repository

**⚠️ CRITICAL: Repository MUST be private!**

Your config may contain sensitive settings. Never use a public repo.

### 2. Token Security

```bash
# ✅ Good
REMOTE_CONFIG_TOKEN=ghp_xxxxx  # In .env (gitignored)

# ❌ Bad
REMOTE_CONFIG_TOKEN=ghp_xxxxx  # Committed to Git

# ✅ Better (Production)
# Use environment variables from hosting platform:
# - Heroku: Config Vars
# - AWS: Parameter Store
# - Docker: Secrets
```

### 3. Minimal Token Permissions

**Only grant `repo` scope** (read access to private repos)

Don't give:
- ❌ `admin:org`
- ❌ `delete_repo`
- ❌ `write:packages`

### 4. Token Rotation

**Regenerate tokens periodically:**
1. Generate new token
2. Update `.env` on all instances
3. Revoke old token

### 5. Audit Trail

**Review Git history regularly:**
```bash
git log --all --oneline config.json
```

Who changed what, when!

---

## Troubleshooting

### "Configuration not available"

**Cause:** Config not fetched yet or failed to fetch

**Solution:**
```bash
# Check logs
docker-compose logs backend | grep config

# Check environment variables
echo $REMOTE_CONFIG_REPO
echo $REMOTE_CONFIG_TOKEN

# Test Git access
curl -H "Authorization: token $REMOTE_CONFIG_TOKEN" \
  https://api.github.com/repos/$REMOTE_CONFIG_REPO/contents/config.json
```

### "Authentication failed"

**Cause:** Invalid or expired token

**Solution:**
1. Regenerate token on GitHub
2. Update `.env`
3. Restart backend

### "File not found (404)"

**Cause:** Wrong file path or repo name

**Solution:**
```bash
# Check repo exists
https://github.com/genesis-nexus/pulsegen-config

# Check file exists
https://github.com/genesis-nexus/pulsegen-config/blob/main/config.json

# Verify environment variables
REMOTE_CONFIG_REPO=genesis-nexus/pulsegen-config  # ✅
REMOTE_CONFIG_REPO=pulsegen-config  # ❌ Missing owner
```

### Using Cached Config

**This is normal!** Means:
- Remote Git unavailable temporarily
- Using last known good config
- Will retry on next refresh

**To force refresh:**
```bash
curl -X POST http://localhost:5000/api/config/refresh
```

### Config Not Updating

**Causes:**
1. **Git not pushed**: Check `git push` worked
2. **Cache**: Clear cache with API
3. **JSON syntax error**: Validate JSON
4. **Version unchanged**: Update `version` and `lastUpdated`

**Debug:**
```bash
# Check file on GitHub
curl https://raw.githubusercontent.com/genesis-nexus/pulsegen-config/main/config.json

# Validate JSON
cat config.json | jq .

# Force refresh
curl -X POST http://localhost:5000/api/config/refresh
```

---

## Best Practices

### 1. Version Every Change

```json
{
  "version": "1.0.0",  // → "1.0.1", "1.1.0", etc.
  "lastUpdated": "2025-01-18T10:00:00Z"
}
```

### 2. Test in Staging First

```bash
# 1. Update config with staging-specific settings
{
  "instanceSpecific": {
    "staging": {
      "licensing": { "enforced": true }  // Test here first
    }
  }
}

# 2. Verify in staging
# 3. Roll out to production
{
  "licensing": { "enforced": true }  // Now apply globally
}
```

### 3. Use Branches for Testing

```bash
# Create test branch
git checkout -b test-licensing

# Edit config
# Push to test branch
git push origin test-licensing

# Point staging to test branch
REMOTE_CONFIG_BRANCH=test-licensing  # Staging .env

# Test

# Merge to main when ready
git checkout main
git merge test-licensing
git push
```

### 4. Document Changes

```bash
git commit -m "Enable license enforcement

- Changed licensing.enforced to true
- Set grace period to 7 days
- Affects all production instances
- Tested in staging successfully"
```

### 5. Monitor After Changes

```bash
# Watch logs during rollout
docker-compose logs -f backend | grep config

# Check status API
watch -n 5 'curl -s http://localhost:5000/api/config/status | jq'
```

---

## FAQ

### Can instances run if Git is down?

Yes! They use cached config. Will retry Git on next refresh.

### How fast do changes propagate?

Default: Within 5 minutes (refresh interval)
Minimum: Can force refresh immediately via API

### Can users see the config?

No! Server-side only. Client gets results of config (e.g., "license required") but not the config itself.

### Can I use private GitLab/Bitbucket?

Yes! See "GitLab Support" and "Raw URL Support" sections.

### What if I commit invalid JSON?

PulseGen continues using last valid cached config. Fix JSON and push again.

### Can I have different configs per customer?

Yes! Use instance-specific config with unique `INSTANCE_ID` per customer.

---

## Example Repository Structure

```
genesis-nexus/pulsegen-config/
├── README.md
├── config.json                    # Default/shared config
├── instances/
│   ├── production.json           # Production-specific
│   ├── staging.json              # Staging-specific
│   ├── customer-acme.json        # Customer-specific
│   └── customer-techcorp.json
└── schemas/
    └── config.schema.json        # JSON schema for validation
```

**Per-customer instances:**
```bash
# Acme Corp's instance
INSTANCE_ID=customer-acme
REMOTE_CONFIG_FILE=instances/customer-acme.json

# TechCorp's instance
INSTANCE_ID=customer-techcorp
REMOTE_CONFIG_FILE=instances/customer-techcorp.json
```

---

## Summary

✅ **Created private Git repo** with `config.json`
✅ **Generated GitHub token** with `repo` scope
✅ **Configured `.env`** with repo and token
✅ **Restarted PulseGen** to fetch initial config
✅ **Verified logs** show successful fetch

**Now you can:**
- Toggle licensing on/off by editing Git
- Enable/disable features globally
- Enable analytics with one commit
- Put instances in maintenance mode
- Different settings per environment
- Full audit trail and rollback

**All from your private Git repo - no server access needed!** 🚀

For support: See LICENSE_IMPLEMENTATION.md and CONFIGURABLE_LICENSING.md
