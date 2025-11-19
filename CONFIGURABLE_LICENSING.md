## Configurable Licensing & Analytics

PulseGen's licensing system is **completely optional and configurable**. You can:
- Start in **free mode** without any license requirements
- Enable licensing **whenever you're ready** to commercialize
- Toggle between modes **without code changes**
- Track usage with **Google Analytics**

Perfect for regions where payment processing isn't yet available (like Sri Lanka)!

---

## Quick Start: Free Mode (Default)

By default, PulseGen runs in **free mode** with no license required.

```bash
# Install and run PulseGen
docker-compose up -d

# That's it! No license needed
# Access at http://localhost:3000
```

Everyone can use all features without restrictions. Enable licensing later when ready to monetize.

---

## Configuration Methods

### Method 1: Environment Variable (Recommended)

Set in `.env` file:

```bash
# Disable license requirement (free mode)
LICENSE_ENFORCED=false

# Enable license requirement
LICENSE_ENFORCED=true
```

Restart the application for changes to take effect.

### Method 2: Platform Settings UI (Recommended for Runtime)

1. Log in as admin
2. Go to **Settings → Platform**
3. Toggle "Require License Key"
4. Click "Save Settings"

Changes take effect immediately (no restart needed for new requests).

### Method 3: Database Configuration

The system stores configuration in the `platform_config` table:

```sql
UPDATE platform_config
SET "licenseEnforced" = false  -- or true
WHERE id = (SELECT id FROM platform_config LIMIT 1);
```

---

## Licensing Modes Explained

### Free Mode (`LICENSE_ENFORCED=false`)

**What happens:**
- ✅ Anyone can use PulseGen
- ✅ All features available
- ✅ No license key required
- ✅ No usage limits
- ✅ Perfect for development, testing, or until you're ready to monetize

**Console output:**
```
ℹ️  License enforcement is DISABLED
   PulseGen is running in free mode
   Enable licensing in Platform Settings when ready
```

**Use cases:**
- Development and testing
- Until payment processing is available in your region
- Internal company use
- Education and non-profit
- Building customer base before monetizing

### Licensed Mode (`LICENSE_ENFORCED=true`)

**What happens:**
- 🔒 Users must activate a valid license key
- 🔒 License checked on startup and hourly
- 🔒 Features unlocked based on tier
- 🔒 Usage limits enforced
- 🔒 Automatic renewal reminders

**Console output:**
```
🔒 License enforcement is ENABLED
✅ LICENSE: Valid
   Customer: Acme Corp (customer@example.com)
   Tier: PROFESSIONAL
   Expires: 2026-01-15 (320 days)
```

**Use cases:**
- Commercial deployments
- When ready to monetize
- Tiered feature access
- Usage tracking and limits
- SLA guarantees

---

## Typical Workflow

### Phase 1: Launch (Free Mode)

```bash
# .env
LICENSE_ENFORCED=false
```

**Benefits:**
- No payment system needed
- Build user base
- Get feedback
- Track usage with analytics
- No barriers to entry

### Phase 2: Prepare for Monetization

1. **Set up payment processing** (Stripe, Paddle, etc.)
2. **Generate RSA keys** for license signing
3. **Test license generation** with demo customers
4. **Create pricing page** and sales materials
5. **Set up analytics** to understand usage

### Phase 3: Enable Licensing

**Option A: Soft Launch (Existing Users Grandfathered)**

```javascript
// Don't enforce globally yet
LICENSE_ENFORCED=false

// Manually activate licenses for paying customers
// They get premium features, free users stay free
```

**Option B: Hard Cutoff (All Users Need License)**

```bash
# .env
LICENSE_ENFORCED=true
```

Send announcement email 30 days before:
```
Hi PulseGen users,

Starting Feb 1, 2025, PulseGen will require a license key.

Pricing:
- Starter: $99/month
- Professional: $299/month (what you're currently using)
- Enterprise: Custom

Purchase: https://pulsegen.com/pricing

Questions? Reply to this email.

Thanks for being an early user!
```

---

## Google Analytics Integration

Track usage statistics without requiring payment.

### Setup

**Method 1: Environment Variable**

```bash
# .env
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

**Method 2: Platform Settings UI** (Recommended)

1. Log in as admin
2. Go to **Settings → Platform**
3. Enable "Google Analytics"
4. Enter your GA4 Measurement ID
5. Click "Save Settings"

### Get Google Analytics ID

1. Go to [Google Analytics](https://analytics.google.com)
2. Create account (if needed)
3. Create property for PulseGen
4. Create Data Stream → Web
5. Copy Measurement ID (format: `G-XXXXXXXXXX`)

### What Gets Tracked

**Automatically tracked:**
- Page views
- User sessions
- Navigation paths

**Custom events tracked:**
```javascript
// Survey events
- survey_created
- survey_published
- survey_completed
- survey_shared
- survey_exported

// AI events
- ai_survey_generated
- ai_insight_generated
- ai_analysis_performed

// User events
- sign_up
- login
- license_activated

// Errors
- exception (for debugging)
```

### Analytics Dashboard

View in Google Analytics:
- **Real-time**: Current users and activity
- **Engagement**: Session duration, page views
- **Events**: Custom event tracking
- **Demographics**: User locations and devices
- **Acquisition**: How users find you

### Using Analytics Data

**Pre-monetization insights:**
```
Questions to answer:
- How many active users?
- Which features are most used?
- Where do users drop off?
- What survey types are popular?
- Geographic distribution?
```

**Pricing insights:**
```
- Average surveys per user → Determine tier limits
- Average responses → Set response limits
- Power users → Target for Enterprise tier
- Feature usage → Bundle features per tier
```

---

## Migration Paths

### From Free to Paid (Grandfathering)

```javascript
// Give existing users free lifetime license
ts-node scripts/generate-license.ts \
  --email existing-user@example.com \
  --company "Early Adopter" \
  --tier professional \
  --duration 36500  # 100 years = lifetime

// New users pay
LICENSE_ENFORCED=true  # For new signups
```

### From Free to Paid (Everyone Pays)

```javascript
// Email all users with offer
const users = await db.users.findAll();

users.forEach(user => {
  sendEmail({
    to: user.email,
    subject: 'PulseGen is Going Commercial',
    body: `
      Special early adopter discount: 50% off first year

      Use code: EARLYUSER

      Purchase before Feb 1: https://pulsegen.com/pricing
    `
  });
});

// Enable enforcement after grace period
setTimeout(() => {
  LICENSE_ENFORCED = true;
}, 30 * 24 * 60 * 60 * 1000); // 30 days
```

### From Paid to Free (Open Source)

```bash
# Disable licensing
LICENSE_ENFORCED=false

# Announce on GitHub
# Issue all customers refunds/credits
# Remove payment infrastructure
```

---

## Best Practices

### For Development

```bash
# Always use free mode in development
LICENSE_ENFORCED=false

# Test licensing in staging environment
STAGING_LICENSE_ENFORCED=true
```

### For Production

```bash
# Start free, enable when ready
LICENSE_ENFORCED=false  # Launch
LICENSE_ENFORCED=true   # When monetizing

# Or use gradual rollout
# Free for first 1000 users, then paid
```

### For Analytics

```bash
# Enable from day 1 to gather data
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Use insights to inform pricing
# - Popular features → Higher tiers
# - Power users → Enterprise targets
# - Usage patterns → Limit setting
```

---

## Environment Variables Reference

```bash
#==============================================================================
# LICENSE CONFIGURATION
#==============================================================================

# Enable/disable license enforcement
# Options: true | false
# Default: false (free mode)
LICENSE_ENFORCED=false

# When set to 'true':
# - Users must activate license key
# - Features locked by tier
# - Usage limits enforced
# - 30-day grace period for offline

# When set to 'false':
# - No license required
# - All features available
# - No usage limits
# - Perfect for pre-commercial launch

#==============================================================================
# ANALYTICS CONFIGURATION
#==============================================================================

# Google Analytics 4 Measurement ID
# Format: G-XXXXXXXXXX
# Get from: https://analytics.google.com → Admin → Data Streams
GOOGLE_ANALYTICS_ID=

# When set:
# - Tracks page views and events
# - Anonymous usage statistics
# - Helps understand user behavior
# - Informs pricing decisions
```

---

## Platform Settings UI

### Access

1. Log in as admin
2. Navigate to **Settings → Platform**

### Features

**License Enforcement:**
- Toggle license requirement on/off
- See current status
- Instant effect (no restart needed)

**Google Analytics:**
- Enable/disable tracking
- Enter Measurement ID
- Validates ID format
- Live updates

**Instance Information:**
- Set instance name
- Add description
- Admin contact email

### Toggle License Enforcement

```
┌────────────────────────────────────────────┐
│ License Enforcement                        │
├────────────────────────────────────────────┤
│                                            │
│ Require License Key              [ON/OFF] │
│                                            │
│ ⓘ Users must activate a valid license     │
│   key to use PulseGen                      │
│                                            │
│ ⚠️  License Required                       │
│ Users will need a valid license key to    │
│ access the application. Make sure to      │
│ generate and distribute licenses.          │
│                                            │
└────────────────────────────────────────────┘
```

---

## FAQ

### Can I change licensing mode without downtime?

Yes! Toggle in Platform Settings UI. New requests use new mode immediately. Existing sessions continue until cache expires (1 hour max).

### What happens to existing users when I enable licensing?

They'll be prompted to activate a license key on next visit. You can:
- Generate free lifetime licenses for early users
- Offer discounted licenses
- Grandfather existing users

### Can I use both analytics AND free mode?

Yes! Perfect combination:
```bash
LICENSE_ENFORCED=false      # Free to use
GOOGLE_ANALYTICS_ID=G-XXX   # Track usage
```

Use analytics to understand users before charging.

### How do I know when to enable licensing?

Good indicators:
- Payment processing available in your region
- 100+ active users (proven demand)
- Users asking for support/SLA
- Feature requests for enterprise needs
- Analytics show power users willing to pay

### Can I have free tier + paid tiers?

Yes! Two approaches:

**Option 1: Manual (Free Mode + Manual Licenses for Paid)**
```bash
LICENSE_ENFORCED=false  # Free for all

# Manually give premium features to paying customers
# via database flags or separate license check
```

**Option 2: Tiered Licensing**
```bash
LICENSE_ENFORCED=true

# Generate free tier licenses (unlimited duration)
ts-node scripts/generate-license.ts \
  --tier starter \
  --duration 36500  # 100 years

# Paid customers get higher tiers
```

### Is license enforcement secure?

**For honest users**: Yes
**Against determined hackers**: No (they have source code)

But:
- Deters casual piracy (95%+ effective)
- Professional customers won't crack it
- Standard for commercial open source
- Each update can re-add checks
- Focus on value, not just licensing

### Can I customize license tiers?

Yes! Edit `backend/src/utils/license.ts`:

```typescript
export function getTierLimits(tier: string) {
  const limits = {
    free: {  // Add free tier
      maxUsers: 3,
      maxSurveys: 5,
      maxResponses: 100,
      features: ['basic_analytics']
    },
    starter: {
      // ...existing...
    }
  };
}
```

---

## Support

**Questions about licensing?**
- Email: support@pulsegen.com
- Docs: LICENSE_IMPLEMENTATION.md

**Questions about analytics?**
- Google Analytics Help: https://support.google.com/analytics
- Implementation: frontend/src/utils/analytics.ts

**Feature requests?**
- GitHub Issues: [repository]/issues
- Email: feedback@pulsegen.com

---

**TL;DR:**
- 🆓 Start free: `LICENSE_ENFORCED=false`
- 📊 Add analytics: Set `GOOGLE_ANALYTICS_ID`
- 💰 Enable licensing when ready: `LICENSE_ENFORCED=true`
- ⚙️ Toggle anytime in Platform Settings UI
- 🌍 Perfect for Sri Lanka (or anywhere) until payment processing is available!
