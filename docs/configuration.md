---
layout: default
title: Configuration
nav_order: 5
description: "Complete reference for all PulseGen environment variables and configuration options."
---

# Configuration
{: .no_toc }

Complete reference for all environment variables and settings.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Environment Variables

All configuration is done through environment variables in the `.env` file.

### Required Variables

{: .important }
These variables must be set before running PulseGen.

| Variable | Description | Example |
|:---------|:------------|:--------|
| `POSTGRES_PASSWORD` | PostgreSQL database password | `secure_random_password` |
| `JWT_SECRET` | Secret for signing JWT tokens (32+ chars) | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (32+ chars) | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | AES encryption key (64 hex chars) | `openssl rand -hex 32` |

### Database Configuration

| Variable | Description | Default |
|:---------|:------------|:--------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/pulsegen` |
| `POSTGRES_HOST` | Database host | `localhost` |
| `POSTGRES_PORT` | Database port | `5432` |
| `POSTGRES_DB` | Database name | `pulsegen` |
| `POSTGRES_USER` | Database user | `postgres` |
| `DB_POOL_SIZE` | Connection pool size | `10` |

### Server Configuration

| Variable | Description | Default |
|:---------|:------------|:--------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend API port | `5001` |
| `APP_URL` | Full application URL | `http://localhost:3001` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3001` |

### Redis Configuration

| Variable | Description | Default |
|:---------|:------------|:--------|
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password (if required) | - |
| `CACHE_TTL_SECONDS` | Default cache TTL | `3600` |

---

## Authentication Settings

### JWT Configuration

| Variable | Description | Default |
|:---------|:------------|:--------|
| `JWT_SECRET` | Access token signing secret | *required* |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | *required* |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |

### OAuth Providers

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

### SAML/SSO (Enterprise)

```env
SAML_ENABLED=true
SAML_ENTRYPOINT=https://idp.example.com/sso
SAML_ISSUER=pulsegen
SAML_CERT_PATH=/path/to/idp-cert.pem
```

---

## AI Provider Configuration

### OpenAI

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4096
```

### Anthropic

```env
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=4096
```

### Google AI

```env
GOOGLE_AI_API_KEY=AIza...
GOOGLE_AI_MODEL=gemini-pro
```

### Azure OpenAI

```env
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### AI Settings

```env
# Default AI provider
AI_DEFAULT_PROVIDER=anthropic

# Rate limiting
AI_RATE_LIMIT_PER_MINUTE=60

# Caching
AI_CACHE_ENABLED=true
AI_CACHE_TTL_SECONDS=3600

# Privacy
AI_ANONYMIZE_PII=false
```

---

## Email Configuration

### SMTP Settings

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SMTP_FROM_NAME=PulseGen
SMTP_FROM_EMAIL=noreply@example.com
```

### Email Providers

**SendGrid:**
```env
SENDGRID_API_KEY=SG.xxxxx
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

**Amazon SES:**
```env
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

---

## File Storage

### Local Storage

```env
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

### Amazon S3

```env
STORAGE_TYPE=s3
AWS_S3_BUCKET=pulsegen-uploads
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Google Cloud Storage

```env
STORAGE_TYPE=gcs
GCS_BUCKET=pulsegen-uploads
GCS_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

---

## Security Settings

### Rate Limiting

```env
# General API rate limit
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Auth endpoints (stricter)
AUTH_RATE_LIMIT_WINDOW_MS=60000
AUTH_RATE_LIMIT_MAX_REQUESTS=10

# Response submission
RESPONSE_RATE_LIMIT_WINDOW_MS=60000
RESPONSE_RATE_LIMIT_MAX_REQUESTS=60
```

### Security Headers

```env
# HTTPS enforcement
FORCE_HTTPS=true

# Cookie settings
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict

# Session settings
SESSION_SECRET=your-session-secret
SESSION_MAX_AGE_MS=86400000
```

### Content Security Policy

```env
CSP_ENABLED=true
CSP_REPORT_URI=/api/csp-report
```

---

## Logging Configuration

```env
# Log level: error, warn, info, debug
LOG_LEVEL=info

# Log format: json, pretty
LOG_FORMAT=json

# Log output
LOG_FILE_PATH=/var/log/pulsegen/app.log
LOG_MAX_SIZE_MB=100
LOG_MAX_FILES=10

# Request logging
LOG_REQUESTS=true
LOG_REQUEST_BODY=false
```

---

## Performance Tuning

### Backend

```env
# Node.js settings
NODE_OPTIONS="--max-old-space-size=4096"

# Cluster mode
CLUSTER_WORKERS=auto

# Request timeout
REQUEST_TIMEOUT_MS=30000
```

### Database

```env
# Connection pool
DB_POOL_SIZE=20
DB_POOL_MIN=5
DB_CONNECTION_TIMEOUT_MS=10000

# Query logging
DB_LOG_QUERIES=false
DB_SLOW_QUERY_THRESHOLD_MS=1000
```

### Caching

```env
# Response caching
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300

# Query result caching
QUERY_CACHE_ENABLED=true
QUERY_CACHE_TTL=60
```

---

## Feature Flags

Enable or disable specific features:

```env
# AI Features
FEATURE_AI_GENERATION=true
FEATURE_AI_ANALYSIS=true
FEATURE_AI_TRANSLATION=true

# Survey Features
FEATURE_SURVEY_TEMPLATES=true
FEATURE_SURVEY_LOGIC=true
FEATURE_FILE_UPLOADS=true

# Analytics
FEATURE_ADVANCED_ANALYTICS=true
FEATURE_EXPORT_PDF=true

# Integrations
FEATURE_WEBHOOKS=true
FEATURE_API_ACCESS=true
```

---

## Complete Example

Here's a complete production `.env` file:

```env
# ===================
# Required Settings
# ===================
NODE_ENV=production
PORT=5001
APP_URL=https://surveys.yourdomain.com
CORS_ORIGIN=https://surveys.yourdomain.com

# Database
DATABASE_URL=postgresql://pulsegen:secure_password@postgres:5432/pulsegen
POSTGRES_PASSWORD=secure_password

# Security
JWT_SECRET=your-32-character-jwt-secret-here
JWT_REFRESH_SECRET=your-32-character-refresh-secret
ENCRYPTION_KEY=your-64-character-hex-encryption-key

# ===================
# Optional Settings
# ===================

# Redis (recommended for production)
REDIS_URL=redis://redis:6379

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
AI_DEFAULT_PROVIDER=anthropic

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Security
FORCE_HTTPS=true
COOKIE_SECURE=true
```

---

## Validating Configuration

Check your configuration:

```bash
# Validate environment variables
npm run config:validate

# Test database connection
npm run db:check

# Test Redis connection
npm run cache:check

# Test email configuration
npm run email:test
```

---

## Next Steps

- [Deployment Guide]({% link DEPLOYMENT.md %}) — Deploy to production
- [Security Best Practices]({% link security.md %}) — Harden your installation
- [API Reference]({% link api.md %}) — Integrate with your systems
