---
layout: default
title: FAQ
nav_order: 9
description: "Frequently asked questions about PulseGen installation, features, and usage."
---

# Frequently Asked Questions
{: .no_toc }

Common questions and answers about PulseGen.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## General

### What is PulseGen?

PulseGen is an open-source survey platform that lets you create beautiful surveys, collect responses, and analyze data with AI assistance. It's designed for self-hosting, giving you complete control over your data.

### Is PulseGen free?

Yes! PulseGen is free and open-source under the MIT license. You can use it for personal and commercial projects without any licensing fees.

### What makes PulseGen different from SurveyMonkey or Typeform?

| Feature | PulseGen | Others |
|:--------|:---------|:-------|
| **Data ownership** | Your servers, your data | Their cloud |
| **Pricing** | Free forever | Per response/seat |
| **AI features** | Bring your own keys | Paid add-ons |
| **Customization** | Full source access | Limited |
| **Lock-in** | Export everything | Proprietary |

### Do I need technical skills to use PulseGen?

Basic Docker knowledge helps for installation, but our setup scripts make it easy. Once running, the interface is user-friendly and requires no coding.

---

## Installation

### What are the minimum requirements?

- **CPU:** 2+ cores
- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 20GB SSD
- **OS:** Any system that runs Docker

### Can I run PulseGen without Docker?

Yes, but it's not recommended. You'd need to:
1. Set up PostgreSQL manually
2. Install Node.js 20+
3. Configure and run the backend
4. Build and serve the frontend

Docker Compose handles all this automatically.

### How do I update PulseGen?

```bash
git pull origin main
docker-compose down
docker-compose up -d --build
docker-compose exec backend npx prisma migrate deploy
```

### Can I run PulseGen on shared hosting?

No, PulseGen requires a VPS or dedicated server with Docker support. Shared hosting typically doesn't support Docker containers.

---

## Features

### How many question types are supported?

PulseGen supports 24 question types:

- **Choice:** Multiple choice, checkboxes, dropdown, yes/no
- **Scale:** Rating, NPS, Likert, slider
- **Text:** Short text, long text, email, number
- **Advanced:** Matrix, ranking, file upload, signature
- **Date/Time:** Date picker, time picker, date-time

### Is there a limit on responses?

No! Unlike SaaS survey tools, there are no response limits. Collect as many responses as your server can handle.

### Can I use custom domains?

Yes. Configure your domain in the `.env` file and set up DNS to point to your server. See the [Deployment Guide]({% link DEPLOYMENT.md %}).

### Does PulseGen support multiple languages?

Yes, PulseGen supports:
- **Interface:** 10+ languages
- **Survey content:** Unlimited languages per survey
- **AI translation:** Instant translation to 12+ languages
- **RTL support:** Arabic, Hebrew, etc.

---

## AI Features

### Which AI providers are supported?

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3.5, Claude 3)
- Google AI (Gemini Pro, Gemini Ultra)
- Azure OpenAI (for enterprise)

### Do I need an AI provider to use PulseGen?

No! AI features are completely optional. PulseGen works perfectly as a standalone survey tool.

### How much do AI features cost?

PulseGen itself is free. You pay only for API usage to your chosen provider:

| Task | Approx. Cost |
|:-----|:-------------|
| Generate 10-question survey | $0.02-0.05 |
| Analyze 100 responses | $0.05-0.10 |
| Translate survey | $0.01-0.03 |

*Costs vary by provider and model.*

### Is my survey data sent to AI providers?

Only when you explicitly use AI features. Data is sent for processing and not stored by providers (check their policies). You can enable PII anonymization before sending.

---

## Security

### Is PulseGen secure?

Yes. Security features include:
- AES-256 encryption for sensitive data
- JWT authentication with refresh tokens
- Rate limiting and brute force protection
- HTTPS enforcement
- CSRF protection
- Input sanitization

### Where is my data stored?

On YOUR server. Unlike SaaS tools, your data never leaves your infrastructure (unless you use AI features, which process data externally).

### Is PulseGen GDPR compliant?

PulseGen provides tools for GDPR compliance:
- Data export for respondents
- Data deletion (right to erasure)
- Consent management
- Data minimization options
- Audit logging

You're responsible for implementing appropriate policies.

### Can I use PulseGen for healthcare surveys (HIPAA)?

With additional configuration, yes. Required steps:
1. Enable encryption everywhere
2. Sign BAA with cloud providers
3. Implement access controls
4. Enable audit logging
5. Conduct security assessment

Consult your compliance team.

---

## Integration

### Does PulseGen have an API?

Yes! A comprehensive REST API supports:
- Survey management
- Response collection
- Analytics retrieval
- User management
- Webhook configuration

See the [API Reference]({% link api.md %}).

### Can I embed surveys on my website?

Yes, multiple options:
- **iFrame embed:** Simple HTML snippet
- **JavaScript SDK:** Custom styling
- **API integration:** Full control

### Does PulseGen integrate with other tools?

Built-in integrations:
- **Webhooks:** Real-time notifications
- **API:** Custom integrations
- **Export:** CSV, Excel, JSON, PDF

Community integrations:
- Zapier (via webhooks)
- n8n
- Custom connectors

---

## Performance

### How many concurrent users can PulseGen handle?

Depends on your infrastructure:

| Setup | Concurrent Users |
|:------|:-----------------|
| 2 CPU, 4GB RAM | ~100 |
| 4 CPU, 8GB RAM | ~500 |
| Clustered setup | 1000+ |

### How do I improve performance?

1. Enable Redis caching
2. Use a CDN for static assets
3. Scale horizontally with load balancer
4. Use managed database (RDS, Cloud SQL)
5. Enable response caching

### Is there a response time SLA?

For self-hosted, you control the SLA. Typical response times:
- API endpoints: <100ms
- Survey submission: <200ms
- AI generation: 2-10s (depends on provider)

---

## Troubleshooting

### The application won't start

1. Check Docker is running: `docker info`
2. Verify `.env` file exists and is configured
3. Check logs: `docker-compose logs`
4. Ensure ports aren't in use: `lsof -i :3001`

### Database connection failed

1. Check PostgreSQL is running: `docker-compose ps`
2. Verify `DATABASE_URL` in `.env`
3. Test connection: `docker-compose exec postgres pg_isready`

### AI features aren't working

1. Verify API key is correct
2. Check provider status page
3. Review rate limits
4. Test with: `curl -H "Authorization: Bearer $API_KEY" https://api.openai.com/v1/models`

### Surveys aren't loading

1. Clear browser cache
2. Check backend logs: `docker-compose logs backend`
3. Verify CORS settings match your domain
4. Check browser console for errors

---

## Getting Help

### Where can I get support?

- **Documentation:** You're reading it!
- **GitHub Issues:** [Report bugs](https://github.com/genesis-nexus/pulsegen/issues)
- **Discussions:** [Ask questions](https://github.com/genesis-nexus/pulsegen/discussions)

### How can I contribute?

We welcome contributions!
- Read [CONTRIBUTING.md](https://github.com/genesis-nexus/pulsegen/blob/main/CONTRIBUTING.md)
- Check [open issues](https://github.com/genesis-nexus/pulsegen/issues)
- Submit pull requests
- Improve documentation
- Share your feedback

### Is commercial support available?

Contact us for enterprise support options, custom development, or consulting services.
