---
layout: default
title: Security
nav_order: 6
description: "Security best practices and hardening guide for PulseGen deployments."
---

# Security
{: .no_toc }

Best practices for securing your PulseGen deployment.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Security Checklist

{: .important }
Complete this checklist before going live.

### Essential

- [ ] Change all default passwords
- [ ] Generate unique JWT secrets (32+ characters)
- [ ] Generate unique encryption key (64 hex characters)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Configure CORS to your domain only
- [ ] Review and customize rate limits

### Recommended

- [ ] Enable Redis for session management
- [ ] Configure log rotation
- [ ] Set up monitoring and alerts
- [ ] Enable two-factor authentication
- [ ] Configure CSP headers
- [ ] Set up intrusion detection
- [ ] Document incident response procedures

---

## Authentication Security

### Strong Secrets

Generate cryptographically secure secrets:

```bash
# JWT secrets (32+ characters)
openssl rand -base64 32

# Encryption key (64 hex characters)
openssl rand -hex 32

# Session secret
openssl rand -base64 48
```

{: .warning }
Never reuse secrets across environments. Each environment (dev, staging, prod) should have unique secrets.

### Password Policy

Configure password requirements in settings:

```env
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=true
PASSWORD_MAX_AGE_DAYS=90
```

### Session Management

```env
# Short-lived access tokens
JWT_ACCESS_EXPIRY=15m

# Reasonable refresh token lifetime
JWT_REFRESH_EXPIRY=7d

# Secure cookies
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
COOKIE_HTTP_ONLY=true
```

### Brute Force Protection

Rate limiting is enabled by default:

```env
# Strict limits on auth endpoints
AUTH_RATE_LIMIT_WINDOW_MS=60000
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Account lockout
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30
```

---

## Network Security

### HTTPS Configuration

{: .important }
Always use HTTPS in production.

```env
FORCE_HTTPS=true
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000
```

### Firewall Rules

Only expose necessary ports:

```bash
# UFW example
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### CORS Configuration

Restrict to your domain:

```env
# Single domain
CORS_ORIGIN=https://surveys.yourdomain.com

# Multiple domains (comma-separated)
CORS_ORIGIN=https://surveys.yourdomain.com,https://admin.yourdomain.com
```

---

## Data Protection

### Encryption at Rest

Database encryption:

```env
# PostgreSQL with encryption
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

For AWS RDS:
- Enable storage encryption
- Use AWS KMS for key management

### Encryption in Transit

All connections use TLS:

```env
# Force TLS for database
DATABASE_SSL=true

# Force TLS for Redis
REDIS_TLS=true
```

### Sensitive Data Handling

```env
# Encrypt sensitive survey data
ENCRYPT_RESPONSES=true

# Mask PII in logs
LOG_MASK_PII=true

# Anonymize before AI processing
AI_ANONYMIZE_PII=true
```

---

## Input Validation

PulseGen validates all input automatically, but review these settings:

### File Uploads

```env
# Restrict file types
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx
MAX_FILE_SIZE_MB=10

# Scan uploads for malware (if available)
VIRUS_SCAN_ENABLED=true
```

### Content Sanitization

HTML content is sanitized by default. XSS protection is enabled.

```env
# Additional XSS settings
XSS_WHITELIST_TAGS=p,br,strong,em,ul,ol,li
```

---

## API Security

### Rate Limiting

```env
# General API
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Sensitive endpoints
AUTH_RATE_LIMIT_MAX_REQUESTS=10
EXPORT_RATE_LIMIT_MAX_REQUESTS=10
AI_RATE_LIMIT_MAX_REQUESTS=30
```

### API Key Security

```env
# API key settings
API_KEY_MIN_LENGTH=32
API_KEY_HASH_ALGORITHM=sha256
API_KEY_EXPIRY_DAYS=365
```

### Webhook Security

```env
# Sign webhook payloads
WEBHOOK_SECRET=your-webhook-signing-secret
WEBHOOK_TIMEOUT_MS=10000
```

---

## Security Headers

Configure in nginx or application:

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;
```

---

## Logging & Monitoring

### Security Logging

```env
# Log security events
LOG_SECURITY_EVENTS=true
LOG_FAILED_LOGINS=true
LOG_PERMISSION_DENIED=true
LOG_RATE_LIMIT_EXCEEDED=true
```

### Audit Trail

PulseGen maintains an audit log of:
- User authentication events
- Permission changes
- Data exports
- Configuration changes
- API key usage

### Monitoring Alerts

Set up alerts for:
- Multiple failed login attempts
- Unusual API activity
- Rate limit violations
- Error rate spikes
- Database connection issues

---

## Vulnerability Management

### Keeping Updated

```bash
# Check for updates
git fetch origin
git log HEAD..origin/main --oneline

# Apply updates
git pull origin main
docker-compose up -d --build
```

### Dependency Security

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Check Docker images
docker scan pulsegen-backend
```

### Security Scanning

Recommended tools:
- **OWASP ZAP** — Web application scanner
- **Trivy** — Container vulnerability scanner
- **Snyk** — Dependency vulnerability scanner

---

## Incident Response

### Preparation

1. Document escalation procedures
2. Identify key contacts
3. Prepare communication templates
4. Set up logging and monitoring

### Detection

Monitor for:
- Unauthorized access attempts
- Data exfiltration patterns
- Unusual API usage
- Service degradation

### Response Steps

1. **Contain** — Isolate affected systems
2. **Investigate** — Review logs and identify scope
3. **Eradicate** — Remove threat and patch vulnerabilities
4. **Recover** — Restore services from clean backups
5. **Learn** — Document and improve

### Backup Recovery

```bash
# Restore database
cat backup.sql | docker exec -i pulsegen_postgres psql -U postgres -d pulsegen

# Verify integrity
npm run db:verify
```

---

## Compliance

### GDPR

- Data minimization — Only collect necessary data
- Right to erasure — Enable data deletion
- Data portability — Export in standard formats
- Privacy by design — Encryption and access controls

```env
# GDPR settings
GDPR_ENABLED=true
DATA_RETENTION_DAYS=365
ANONYMIZE_DELETED_DATA=true
```

### SOC 2

For SOC 2 compliance:
- Enable comprehensive audit logging
- Implement access controls
- Document security policies
- Regular security assessments

### HIPAA

{: .warning }
For healthcare data, additional measures are required.

- Sign BAA with cloud providers
- Enable encryption everywhere
- Implement access logging
- Regular security training

---

## Reporting Vulnerabilities

Found a security issue? Please report responsibly:

1. **Email:** security@genesis-nexus.io
2. **Do not** disclose publicly until patched
3. Provide detailed reproduction steps
4. Allow reasonable time for fixes

We appreciate security researchers and will acknowledge contributions.

---

## Next Steps

- [Deployment Guide]({% link DEPLOYMENT.md %}) — Secure deployment practices
- [Configuration]({% link configuration.md %}) — All security settings
- [API Reference]({% link api.md %}) — API authentication details
