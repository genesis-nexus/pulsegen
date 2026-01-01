---
layout: default
title: Getting Started
nav_order: 2
description: "Get PulseGen up and running in minutes with our quick start guide."
---

# Getting Started
{: .no_toc }

Get PulseGen up and running in minutes.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Prerequisites

Before you begin, ensure you have:

- **Docker** (20.10+) and **Docker Compose** (2.0+)
- At least **2GB RAM** available
- **10GB disk space**

{: .tip }
Don't have Docker? [Install Docker Desktop](https://docs.docker.com/get-docker/) for the easiest setup.

---

## One-Command Setup

The fastest way to get started is with our automated setup script.

### Linux / macOS

```bash
git clone https://github.com/genesis-nexus/pulsegen.git
cd pulsegen
./setup.sh
```

### Windows (PowerShell)

```powershell
git clone https://github.com/genesis-nexus/pulsegen.git
cd pulsegen
.\setup.ps1
```

The script will:
1. Check prerequisites (Docker & Docker Compose)
2. Generate secure secrets automatically
3. Configure your environment
4. Start all services
5. Provide access URLs and credentials

{: .note }
**That's it!** Open [http://localhost:3001](http://localhost:3001) to access PulseGen.

---

## Manual Setup

If you prefer manual configuration:

### 1. Clone the Repository

```bash
git clone https://github.com/genesis-nexus/pulsegen.git
cd pulsegen
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
nano .env  # or use your preferred editor
```

At minimum, change these values:

```env
POSTGRES_PASSWORD=your_secure_password_here
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
ENCRYPTION_KEY=your_64_char_hex_encryption_key_here
```

{: .warning }
Never use default secrets in production. Generate secure values using the commands below.

### 3. Generate Secure Secrets

```bash
# Generate JWT secrets (32 characters)
openssl rand -base64 32

# Generate encryption key (64 hex characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start Services

```bash
docker-compose up -d
```

### 5. Access the Application

- **Frontend:** [http://localhost:3001](http://localhost:3001)
- **API:** [http://localhost:5001](http://localhost:5001)

---

## Default Credentials

{: .important }
Change these immediately after first login!

| Field | Value |
|:------|:------|
| Email | `admin@example.com` |
| Password | `admin123` |

---

## Docker Compose Profiles

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

---

## Verify Installation

Check that all services are running:

```bash
docker-compose ps
```

Expected output:
```
NAME                STATUS
pulsegen_postgres   running (healthy)
pulsegen_backend    running
pulsegen_frontend   running
```

Check logs for any issues:

```bash
docker-compose logs -f
```

---

## Creating Your First Survey

1. **Log in** at [http://localhost:3001](http://localhost:3001)
2. Click **"Surveys"** in the navigation
3. Click **"Create Survey with AI"** or **"New Survey"**
4. Add questions using the drag-and-drop builder
5. Click **"Publish"** to make it live
6. Share the survey link with respondents

---

## Next Steps

- [Self-Hosting Guide]({% link self-hosting.md %}) — Deploy on your infrastructure
- [AI Features]({% link ai-features.md %}) — Configure AI providers
- [API Reference]({% link api.md %}) — Integrate with your systems
- [Configuration]({% link configuration.md %}) — All environment variables

---

## Troubleshooting

### Docker Compose fails to start

```bash
# Check docker-compose.yml syntax
docker-compose config

# Verify .env file exists
ls -la .env

# Ensure ports are not in use
lsof -i :3001
lsof -i :5001
```

### Database connection errors

```bash
# Check postgres container
docker-compose logs postgres

# Verify database is ready
docker-compose exec postgres pg_isready
```

### Frontend shows "API Error"

1. Check `VITE_API_URL` matches backend URL
2. Verify `CORS_ORIGIN` in backend `.env`
3. Ensure backend is running: `docker-compose logs backend`

---

## Getting Help

- **Documentation:** Browse these docs
- **Issues:** [GitHub Issues](https://github.com/genesis-nexus/pulsegen/issues)
- **Setup Help:** Run `./setup.sh --help`
