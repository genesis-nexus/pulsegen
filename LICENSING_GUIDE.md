# PulseGen Licensing Guide

## Overview

PulseGen uses a **dual-licensing model** that balances open-source principles with commercial sustainability:

1. **Community Edition** - MIT License (Free)
2. **Enterprise Edition** - Commercial License (Paid)

This document explains the licensing structure, what's included in each edition, and how to comply with license terms.

---

## License Types

### Community Edition (MIT License)

**Price**: Free forever

**What you get:**
- Full source code access
- Self-hosted deployment
- Core survey features
- Basic AI capabilities (bring your own API key)
- Community support (forums, GitHub issues)
- Regular security updates

**Limitations:**
- No official support or SLA
- No enterprise features (SSO, advanced white-labeling)
- No compliance certifications
- Self-service setup and maintenance
- Community updates (may lag behind Enterprise)

**Best for:**
- Personal projects
- Open-source projects
- Small startups
- Evaluation and testing
- Educational use

**License text**: See [LICENSE](./LICENSE)

---

### Enterprise Edition (Commercial License)

**Price**: Starting at $99/month

**What you get:**
- Everything in Community Edition
- **Professional support** with SLA guarantees
- **Enterprise features**:
  - Single Sign-On (SSO) - SAML, OAuth2, LDAP
  - Advanced white-labeling
  - Multi-tenant architecture
  - Advanced analytics and reporting
  - Custom integrations
  - Compliance tools (audit logs, data retention)
- **Priority updates** - Security patches and features first
- **Onboarding assistance** - Setup help and training
- **Dedicated customer portal** - Documentation, downloads, support tickets
- **Compliance certifications** - SOC2, HIPAA, GDPR assistance
- **Migration services** - From other platforms
- **Indemnification** - Legal protection

**Best for:**
- Commercial use
- Organizations with compliance requirements
- Teams needing support and SLA
- Companies requiring SSO integration
- Mission-critical deployments

**License agreement**: See [COMMERCIAL_LICENSE.md](./COMMERCIAL_LICENSE.md)

---

## Feature Comparison

| Feature | Community | Enterprise |
|---------|-----------|------------|
| **Core Survey Features** | ✅ All | ✅ All |
| **Question Types** | ✅ 15+ | ✅ 15+ |
| **Survey Logic** | ✅ Full | ✅ Full |
| **AI Capabilities** | ✅ Basic | ✅ Advanced |
| **Self-Hosted** | ✅ Yes | ✅ Yes |
| **Source Code Access** | ✅ Yes | ✅ Yes |
| **API Access** | ✅ Full | ✅ Full |
| **Webhooks** | ✅ Yes | ✅ Yes |
| **Response Limits** | ❌ Self-imposed | ✅ Unlimited |
| **User Accounts** | ✅ Unlimited | ✅ Unlimited |
| **White-Labeling** | ⚠️ Basic | ✅ Advanced |
| **Custom Branding** | ⚠️ Limited | ✅ Full |
| **Email Support** | ❌ No | ✅ Yes (SLA) |
| **Phone Support** | ❌ No | ✅ Enterprise tier |
| **SSO Integration** | ❌ No | ✅ Yes |
| **Advanced Analytics** | ❌ No | ✅ Yes |
| **Compliance Tools** | ❌ No | ✅ Yes |
| **Professional Services** | ❌ No | ✅ Available |
| **Training** | ❌ Self-service | ✅ Included |
| **SLA Guarantee** | ❌ No | ✅ 99.9% (Enterprise) |
| **Updates** | ✅ Community | ✅ Priority |
| **Security Patches** | ✅ Yes | ✅ Priority access |
| **Commercial Use** | ✅ Allowed* | ✅ Allowed |
| **Resale/SaaS** | ❌ Not allowed | ⚠️ Contact us |

*Community Edition can be used commercially under MIT license terms

---

## Dual-License Model Explained

### How It Works

PulseGen uses a **source-available commercial** model:

1. **Same codebase**: Both editions use the same source code
2. **Feature flags**: Enterprise features enabled via license key
3. **Open development**: All code is visible for security audit
4. **Support tiers**: Payment determines support level, not access to code

### Why This Model?

**Benefits for users:**
- Transparency: Review code for security
- No vendor lock-in: Can always use Community Edition
- Flexibility: Pay only when you need support/enterprise features
- Trust: Open source means auditable security

**Benefits for us:**
- Sustainable: Revenue supports development
- Quality: Can hire full-time developers
- Support: Can provide professional service
- Innovation: Funds new features and improvements

### Similar Companies Using This Model

- **GitLab**: Open core with paid enterprise features
- **Sentry**: Open source with hosted/enterprise options
- **Mattermost**: Open source Slack alternative
- **Supabase**: Open source Firebase alternative
- **PostHog**: Open source product analytics

---

## License Compliance

### Community Edition (MIT)

**You are free to:**
- ✅ Use commercially
- ✅ Modify the code
- ✅ Distribute
- ✅ Sublicense
- ✅ Use privately

**You must:**
- Include copyright notice
- Include MIT license text

**You cannot:**
- Hold us liable
- Use our trademarks without permission

**Example attribution:**
```
This software includes PulseGen, licensed under the MIT License.
Copyright (c) 2025 PulseGen
Full license: https://github.com/yourorg/pulsegen/blob/main/LICENSE
```

---

### Enterprise Edition

**You are licensed to:**
- ✅ Use on your infrastructure
- ✅ Modify for internal use
- ✅ Use commercially
- ✅ Access source code for security audit
- ✅ Create backups
- ✅ Deploy multiple instances (based on tier)

**You may NOT:**
- ❌ Resell as a product
- ❌ Offer as SaaS to third parties (without separate agreement)
- ❌ Remove license checks
- ❌ Share license keys
- ❌ Reverse engineer license system

**Requirements:**
- Active subscription required
- License verification (phone-home once/day)
- Comply with data collection terms
- Attribute PulseGen in footer (can be removed in Enterprise+)

**Exceptions:**
- SaaS/Resale: Contact sales@pulsegen.com for OEM/reseller license
- Embedding: Contact for embedded license terms
- High-volume: Custom agreements available for 1M+ responses/month

---

## Pricing Tiers

### Starter - $99/month

**Includes:**
- Up to 5 users
- 10 active surveys
- 1,000 responses/month
- Email support (48h response)
- Monthly updates
- Basic white-labeling
- Community Slack access

**License terms:**
- Single production instance
- Development/staging instances allowed
- 1-year minimum commitment
- Annual billing (save 15%)

---

### Professional - $299/month

**Includes:**
- Up to 50 users
- 100 active surveys
- 10,000 responses/month
- Priority email support (24h response)
- Video call support (2 hours/month)
- Weekly updates
- Advanced white-labeling
- SSO integration
- Quarterly business reviews

**License terms:**
- Up to 3 production instances
- Unlimited dev/staging instances
- 1-year minimum commitment
- Annual billing (save 20%)

---

### Enterprise - Custom ($999+/month)

**Includes:**
- Unlimited users
- Unlimited surveys
- Unlimited responses
- 24/7 phone support (4h response)
- Dedicated success manager
- Daily updates + hotfixes
- Full white-labeling
- Custom development (limited hours)
- SLA with penalties (99.9% uptime)
- On-site training available
- Compliance certifications

**License terms:**
- Unlimited instances
- Custom contract terms
- Multi-year agreements available
- Volume discounts

---

## How License Verification Works

### Technical Implementation

Enterprise Edition includes lightweight license verification:

**What it sends (once per day):**
```json
{
  "license_key": "your_license_key",
  "version": "1.2.3",
  "instance_id": "random_uuid",
  "feature_usage": {
    "sso_enabled": true,
    "white_label_enabled": true
  }
}
```

**What it does NOT send:**
- Survey content or questions
- Response data or answers
- User information or emails
- Any customer data
- IP addresses or location data

**Response:**
```json
{
  "valid": true,
  "tier": "professional",
  "expires_at": "2025-12-31",
  "features": ["sso", "white_label", "analytics"],
  "support_level": "priority"
}
```

**Privacy guarantees:**
- No customer data transmitted
- GDPR compliant
- Can review source code
- Can operate offline (30-day grace period)
- Can run behind firewall (with allowlist)

**Firewall configuration:**
If running behind firewall, whitelist:
- Domain: `license.pulsegen.com`
- IP: `xxx.xxx.xxx.xxx`
- Port: 443 (HTTPS only)

**Offline mode:**
- Grace period: 30 days
- After 30 days: Enterprise features disabled
- Core features continue working
- Warning displayed to admins

---

## Migration Between Editions

### From Community to Enterprise

**Super easy:**
1. Purchase Enterprise license
2. Add license key to `.env` file:
   ```bash
   LICENSE_KEY=your_enterprise_key
   ```
3. Restart services:
   ```bash
   docker compose restart
   ```
4. Enterprise features automatically unlock
5. No data migration needed

**Data remains intact:**
- All surveys preserved
- All responses retained
- Users and teams unchanged
- Settings carried over

---

### From Enterprise to Community

**If subscription ends:**
1. Enterprise features disabled automatically
2. Core features continue working
3. Data remains accessible
4. Export data anytime (CSV, JSON)
5. Can self-host indefinitely on Community Edition

**What happens:**
- SSO login disabled (users revert to password auth)
- Advanced analytics hidden (data not deleted)
- White-label branding reverted to default
- Support access removed
- Updates switch to community release cycle

**No data loss:**
- All surveys remain
- All responses retained
- Exports still available
- Can upgrade again anytime

---

## Open Source Commitment

### Our Promises

1. **Core stays open**: Base platform will always be MIT licensed
2. **No bait-and-switch**: Won't move core features to enterprise-only
3. **Transparent development**: All code visible on GitHub
4. **Community first**: Community feedback shapes roadmap
5. **Security**: Disclose vulnerabilities responsibly
6. **No CLA**: Contributors retain copyright
7. **Long-term**: If we shut down, remove license checks

### Contributing

**Community contributors:**
- All contributions remain MIT licensed
- No copyright assignment required
- Contributors listed in CONTRIBUTORS.md
- Recognition in release notes

**Enterprise features:**
- Developed as optional add-ons
- Don't break community functionality
- Can be disabled via environment variables

### Roadmap Transparency

**Public roadmap**: https://roadmap.pulsegen.com

**Feature classification:**
- 🟢 **Community**: Free forever
- 🟡 **Enterprise**: Paid features
- 🔵 **Experimental**: Testing phase

**Decision framework:**
Enterprise features are those that:
- Require significant support overhead
- Target large organizations
- Need compliance/security expertise
- Integrate with enterprise systems

Community features are:
- Core survey functionality
- Basic analytics
- Standard integrations
- Developer APIs

---

## Frequently Asked Questions

### General

**Q: Can I use Community Edition for commercial projects?**
A: Yes! MIT license allows commercial use.

**Q: What happens if I stop paying for Enterprise?**
A: Enterprise features disable, but core functionality and your data remain.

**Q: Can I switch between self-hosted and your managed hosting?**
A: Yes, we can help migrate. Contact support@pulsegen.com.

**Q: Do you offer non-profit discounts?**
A: Yes, 50% off for registered 501(c)(3) organizations.

**Q: Can I get a refund?**
A: 30-day money-back guarantee, no questions asked.

---

### Technical

**Q: Does license verification phone home?**
A: Yes, once per day to verify subscription status. No customer data sent.

**Q: Can I use PulseGen offline?**
A: Yes, with 30-day grace period for license verification.

**Q: Can I modify the source code?**
A: Yes, both editions allow modifications. Enterprise gets support for custom changes.

**Q: Can I audit the source code for security?**
A: Absolutely! That's a key benefit of our open model.

**Q: How do updates work?**
A: Community: Monthly via GitHub. Enterprise: Priority access + hotfixes.

---

### Licensing

**Q: Can I resell PulseGen?**
A: Not without a separate OEM/reseller agreement. Contact sales@pulsegen.com.

**Q: Can I offer PulseGen as SaaS to my customers?**
A: Requires special SaaS provider license. Contact us.

**Q: What if my company has a "no phone-home" policy?**
A: We can provide an on-premise license server for Enterprise customers.

**Q: Can I share my license key with contractors?**
A: No, license keys are per organization. Contractors should use your instance.

**Q: What happens if you go out of business?**
A: Code remains open source. We'll release license bypass for paid customers.

---

## Compliance & Legal

### Data Processing

**Location**: Your data stays on your servers
**Access**: We never access your survey data or responses
**Backups**: Your responsibility (we provide tools)
**Deletion**: You control all data deletion
**Portability**: Export anytime in standard formats

### GDPR Compliance

**Community Edition**: You're the data controller
**Enterprise Edition**: You're the data controller, we're your data processor
**DPA**: Available for Enterprise customers
**Subprocessors**: None (you control the infrastructure)

### Security

**Vulnerability disclosure**: security@pulsegen.com
**Bug bounty**: Available for verified security issues
**Penetration testing**: Allowed and encouraged (on your instance)
**Security updates**: Priority for Enterprise, public after 30 days

### Terms of Service

- **Community**: MIT license terms apply
- **Enterprise**: Custom commercial agreement
- **SLA**: Enterprise tier only
- **Liability**: Limited per contract terms
- **Indemnification**: Enterprise+ only

---

## Getting Started

### Try Community Edition

```bash
# Clone repository
git clone https://github.com/yourorg/pulsegen.git
cd pulsegen

# Start with Docker
docker compose up -d

# Access at http://localhost:3000
```

### Upgrade to Enterprise

1. **Contact sales**: sales@pulsegen.com or https://pulsegen.com/enterprise
2. **Choose tier**: Starter, Professional, or Enterprise
3. **Receive license key**: Via email within 24 hours
4. **Add key to .env**: `LICENSE_KEY=your_key`
5. **Restart**: `docker compose restart`
6. **Enjoy**: Enterprise features unlocked!

### Custom Licensing

For special requirements:
- **OEM/Reseller**: Embed PulseGen in your product
- **SaaS Provider**: Offer PulseGen to your customers
- **High-volume**: 1M+ responses/month
- **Air-gapped**: No internet connection
- **Government**: Compliance with specific regulations

Contact: enterprise@pulsegen.com

---

## Support & Resources

### Community Support (Free)

- **GitHub Issues**: https://github.com/yourorg/pulsegen/issues
- **Community Forum**: https://community.pulsegen.com
- **Documentation**: https://docs.pulsegen.com
- **Discord**: https://discord.gg/pulsegen
- **Stack Overflow**: Tag `pulsegen`

### Enterprise Support (Paid)

- **Email**: support@pulsegen.com (SLA response times)
- **Customer Portal**: https://portal.pulsegen.com
- **Private Slack**: Dedicated channel for your team
- **Video Calls**: Scheduled support sessions
- **Phone**: 24/7 for Enterprise tier

### Sales & Licensing

- **Sales**: sales@pulsegen.com
- **Licensing**: licensing@pulsegen.com
- **Partnerships**: partners@pulsegen.com
- **Security**: security@pulsegen.com

---

## License Texts

### Community Edition (MIT)

See [LICENSE](./LICENSE) for full MIT license text.

### Enterprise Edition

Commercial license provided upon purchase. Key terms:
- Subscription-based
- Per-organization licensing
- Support and updates included
- Enterprise features enabled
- Compliance assistance
- SLA available

Full commercial license: [COMMERCIAL_LICENSE.md](./COMMERCIAL_LICENSE.md)

---

**Last Updated**: January 2025
**Version**: 1.0

For questions about licensing, contact: licensing@pulsegen.com
