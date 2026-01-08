<div align="center">

<img src="docs/assets/logo.svg" alt="PulseGen" width="120" />

# PulseGen

### The Open-Source Survey Platform with AI Superpowers

Create beautiful surveys, collect responses at scale, and unlock insights with AI—all self-hosted on your infrastructure.

[![CI](https://github.com/genesis-nexus/pulsegen/actions/workflows/ci.yml/badge.svg)](https://github.com/genesis-nexus/pulsegen/actions/workflows/ci.yml)
[![CodeQL](https://github.com/genesis-nexus/pulsegen/actions/workflows/codeql.yml/badge.svg)](https://github.com/genesis-nexus/pulsegen/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/genesis-nexus/pulsegen/badge)](https://securityscorecards.dev/viewer/?uri=github.com/genesis-nexus/pulsegen)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

[Features](#features) • [Quick Start](#quick-start) • [AI Features](#-supercharge-with-ai) • [Documentation](#documentation)

<img src="docs/assets/hero-screenshot.png" alt="PulseGen - Create Survey with AI" width="800" />

</div>

---

## Why PulseGen?

| | Traditional Survey Tools | PulseGen |
|---|---|---|
| **Data Ownership** | Their servers, their rules | Your infrastructure, your data |
| **AI Analysis** | Paid add-on or unavailable | Bring your own AI keys |
| **Customization** | Limited theming | Full white-label + custom CSS |
| **Pricing** | Per response or seat | Free forever (self-hosted) |
| **Lock-in** | Proprietary formats | Export everything, run anywhere |

---

## Features

<table>
<tr>
<td width="50%" valign="top">

### Build

- **24 Question Types** — From NPS to matrix grids, signatures to geo-location
- **Drag & Drop Builder** — Visual canvas with real-time preview
- **Smart Logic** — Skip logic, branching, piping, conditional display
- **Multi-Page Surveys** — Organize with custom pagination
- **Themes & Branding** — Custom colors, logos, fonts, and CSS

</td>
<td width="50%" valign="top">

### Distribute

- **Instant Sharing** — Links, QR codes, embed widgets
- **Participant Management** — Import lists, track completions, send reminders
- **Access Control** — Public, private, password-protected, or token-based
- **Save & Continue** — Let respondents resume later
- **Quotas** — Auto-close when targets are met

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Analyze

- **Real-Time Dashboard** — Live response tracking and completion rates
- **Question Analytics** — Distributions, cross-tabs, source tracking
- **Multiple Exports** — CSV, Excel, PDF, JSON
- **Trend Analysis** — Track responses over time

</td>
<td width="50%" valign="top">

### Scale

- **Workspaces** — Organize surveys and teams
- **Role-Based Access** — Admin, Manager, Viewer permissions
- **SSO Ready** — Google, Microsoft, GitHub, SAML, OIDC
- **API First** — RESTful API with key-based auth
- **Multi-Language** — 10+ languages with RTL support

</td>
</tr>
</table>

---

## ✨ Supercharge with AI

Connect your own AI provider and unlock powerful automation. **No per-usage fees**—just your API costs.

<table>
<tr>
<td align="center" width="25%">
<br />
<strong>Generate</strong>
<br /><br />
Describe your survey in plain English. Get a complete, ready-to-publish survey in seconds.
<br /><br />
</td>
<td align="center" width="25%">
<br />
<strong>Optimize</strong>
<br /><br />
AI reviews your questions for clarity, bias, and engagement. One-click improvements.
<br /><br />
</td>
<td align="center" width="25%">
<br />
<strong>Analyze</strong>
<br /><br />
Sentiment detection, theme extraction, and smart summaries from open-ended responses.
<br /><br />
</td>
<td align="center" width="25%">
<br />
<strong>Translate</strong>
<br /><br />
Instantly translate surveys to 12+ languages with quality review.
<br /><br />
</td>
</tr>
</table>

**Works with:** OpenAI (GPT-4) • Anthropic (Claude) • Google (Gemini) • Azure OpenAI

> **Note:** AI features are optional. PulseGen works perfectly without them—add AI when you're ready.

---

## Quick Start

### One-Command Setup (Recommended)

The easiest way to get started is with our automated setup script:

**Linux/macOS:**
```bash
git clone https://github.com/genesis-nexus/pulsegen.git
cd pulsegen
./setup.sh
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/genesis-nexus/pulsegen.git
cd pulsegen
.\setup.ps1
```

The script will:
- Check prerequisites (Docker & Docker Compose)
- Generate secure secrets automatically
- Configure your environment
- Start all services
- Provide access URLs and credentials

**That's it!** Open [http://localhost:3001](http://localhost:3001)

### Manual Docker Setup

If you prefer manual configuration:

```bash
# Clone and configure
git clone https://github.com/genesis-nexus/pulsegen.git
cd pulsegen
cp .env.example .env

# Edit .env with your settings (generate secure secrets!)
nano .env

# Start all services
docker-compose --profile production up -d
```

Access the application at [http://localhost:3001](http://localhost:3001)

### Development Setup

For local development with hot-reload:

```bash
# Using Docker
docker-compose -f docker-compose.dev.yml up

# Or run locally without Docker
# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Deployment Options

### Docker Compose Profiles

Choose the setup that fits your needs:

```bash
# Basic setup (Postgres + Backend + Frontend)
docker-compose up -d

# Production with Nginx reverse proxy
docker-compose --profile production up -d

# Production with Redis caching
docker-compose --profile production --profile with-redis up -d

# Development mode (hot-reload enabled)
docker-compose -f docker-compose.dev.yml up
```

### Cloud Deployment

Deploy to your preferred cloud provider:

| Platform | Guide |
|----------|-------|
| **AWS** | [AWS Deployment Guide](docs/deployment/aws/README.md) with Terraform/CloudFormation templates |
| **Google Cloud** | [GCP Deployment Guide](docs/DEPLOYMENT.md#google-cloud-platform) |
| **Azure** | [Azure Deployment Guide](docs/DEPLOYMENT.md#azure-deployment) |
| **Digital Ocean** | [Generic VPS Guide](docs/DEPLOYMENT.md#production-deployment) |

See the complete [Deployment Documentation](docs/DEPLOYMENT.md) for detailed instructions.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, React Query |
| **Backend** | Node.js, Express, Prisma ORM |
| **Database** | PostgreSQL |
| **Cache** | Redis (optional) |
| **AI** | OpenAI, Anthropic, Google AI SDKs |

---

## Documentation

**Full documentation:** [genesis-nexus.github.io/pulsegen](https://genesis-nexus.github.io/pulsegen)

| Guide | Description |
|-------|-------------|
| [Getting Started](https://genesis-nexus.github.io/pulsegen/getting-started) | Quick setup and first survey |
| [Self-Hosting](https://genesis-nexus.github.io/pulsegen/self-hosting) | Deploy on your infrastructure |
| [Deployment Guide](https://genesis-nexus.github.io/pulsegen/DEPLOYMENT) | Cloud and production deployments |
| [API Reference](https://genesis-nexus.github.io/pulsegen/api) | REST API documentation |
| [AI Features](https://genesis-nexus.github.io/pulsegen/ai-features) | Configure AI providers |
| [Configuration](https://genesis-nexus.github.io/pulsegen/configuration) | Environment variables reference |
| [Security](https://genesis-nexus.github.io/pulsegen/security) | Security best practices |
| [FAQ](https://genesis-nexus.github.io/pulsegen/faq) | Common questions answered |

### Quick Links

- **Setup Help**: Run `./setup.sh --help` (Linux/macOS) or `Get-Help .\setup.ps1` (Windows)
- **Troubleshooting**: See [Deployment Guide](https://genesis-nexus.github.io/pulsegen/DEPLOYMENT#troubleshooting)
- **Environment Variables**: See [Configuration Guide](https://genesis-nexus.github.io/pulsegen/configuration)
- **Docker Commands**: See [Deployment Guide](https://genesis-nexus.github.io/pulsegen/DEPLOYMENT#docker-compose-profiles)

---

## Contributing

We welcome contributions! Whether it's bug fixes, new features, or documentation improvements—check out our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## License

PulseGen is open-source under the [MIT License](LICENSE). Use it freely for personal and commercial projects.

---

<div align="center">

**[Get Started](#quick-start)** • **[Report Bug](https://github.com/genesis-nexus/pulsegen/issues)** • **[Request Feature](https://github.com/genesis-nexus/pulsegen/issues)**

Built with ❤️ for the open-source community

</div>
