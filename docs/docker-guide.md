---
layout: default
title: Docker Guide
nav_order: 6
---

# Docker Guide

This guide covers all Docker deployment options for PulseGen, from quick start to advanced configurations.

## Quick Start with Docker Compose

The easiest way to run PulseGen:

```bash
git clone https://github.com/genesis-nexus/pulsegen.git
cd pulsegen
./setup.sh
```

This starts all services with sensible defaults.

---

## Running Individual Containers

For more control, you can run each container separately.

### Prerequisites

Create a Docker network for inter-container communication:

```bash
docker network create pulsegen-network
```

### 1. PostgreSQL Database

```bash
docker run -d \
  --name pulsegen-postgres \
  --network pulsegen-network \
  -e POSTGRES_USER=pulsegen \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=pulsegen \
  -v pulsegen_postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  --health-cmd="pg_isready -U pulsegen" \
  --health-interval=10s \
  --health-timeout=5s \
  --health-retries=5 \
  postgres:16-alpine
```

**Environment Variables:**

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_USER` | Yes | Database username |
| `POSTGRES_PASSWORD` | Yes | Database password |
| `POSTGRES_DB` | Yes | Database name |

### 2. Redis (Optional - for caching/queues)

```bash
docker run -d \
  --name pulsegen-redis \
  --network pulsegen-network \
  -v pulsegen_redis_data:/data \
  -p 6379:6379 \
  --health-cmd="redis-cli ping" \
  --health-interval=10s \
  redis:7-alpine \
  redis-server --appendonly yes
```

### 3. Backend API

```bash
docker run -d \
  --name pulsegen-backend \
  --network pulsegen-network \
  -e DATABASE_URL="postgresql://pulsegen:your_secure_password@pulsegen-postgres:5432/pulsegen" \
  -e JWT_SECRET="your-jwt-secret-min-32-chars-long" \
  -e JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars" \
  -e ENCRYPTION_KEY="64-character-hex-string-for-encryption" \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -v pulsegen_uploads:/app/uploads \
  -v pulsegen_logs:/app/logs \
  -p 5000:5000 \
  --health-cmd="curl -f http://localhost:5000/api/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  ghcr.io/genesis-nexus/pulsegen-backend:latest
```

**Required Environment Variables:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (min 32 chars) |
| `ENCRYPTION_KEY` | 64-char hex string for data encryption |

**Optional Environment Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `5000` | API server port |
| `REDIS_URL` | - | Redis connection URL |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `LOG_LEVEL` | `info` | Logging level |

**AI Provider Variables (Optional):**

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `GOOGLE_AI_API_KEY` | Google Gemini API key |

**SSO Variables (Optional):**

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `MICROSOFT_CLIENT_ID` | Microsoft OAuth client ID |
| `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret |

### 4. Frontend

```bash
docker run -d \
  --name pulsegen-frontend \
  --network pulsegen-network \
  -p 3001:80 \
  --health-cmd="curl -f http://localhost:80 || exit 1" \
  --health-interval=30s \
  ghcr.io/genesis-nexus/pulsegen-frontend:latest
```

The frontend is pre-built and served by Nginx. To configure the API URL at build time:

```bash
# Build with custom API URL
docker build \
  --build-arg VITE_API_URL=https://api.yourdomain.com \
  -t pulsegen-frontend:custom \
  ./frontend
```

---

## Environment File Approach

Create a `.env` file for easier management:

```bash
# .env.backend
DATABASE_URL=postgresql://pulsegen:your_password@pulsegen-postgres:5432/pulsegen
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key-at-least-32-characters
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
NODE_ENV=production
PORT=5000
CORS_ORIGIN=http://localhost:3001

# Optional: Redis
REDIS_URL=redis://pulsegen-redis:6379

# Optional: AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

Run with env file:

```bash
docker run -d \
  --name pulsegen-backend \
  --network pulsegen-network \
  --env-file .env.backend \
  -v pulsegen_uploads:/app/uploads \
  -p 5000:5000 \
  ghcr.io/genesis-nexus/pulsegen-backend:latest
```

---

## Docker Compose Profiles

### Basic Setup (PostgreSQL + Backend + Frontend)

```bash
docker-compose up -d
```

### With Redis Caching

```bash
docker-compose --profile with-redis up -d
```

### Production with Nginx Reverse Proxy

```bash
docker-compose --profile production up -d
```

### Full Production Stack

```bash
docker-compose --profile production --profile with-redis up -d
```

---

## Building Images Locally

### Build Both Images

```bash
docker-compose build
```

### Build Individual Images

```bash
# Backend
docker build -t pulsegen-backend:local ./backend

# Frontend with custom API URL
docker build \
  --build-arg VITE_API_URL=http://localhost:5000 \
  -t pulsegen-frontend:local \
  ./frontend
```

### Build with Version Info

```bash
# Backend with version metadata
docker build \
  --build-arg VERSION=2.1.0 \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg VCS_REF=$(git rev-parse HEAD) \
  -t pulsegen-backend:2.1.0 \
  ./backend

# Frontend with version metadata
docker build \
  --build-arg VERSION=2.1.0 \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg VCS_REF=$(git rev-parse HEAD) \
  --build-arg VITE_API_URL=https://api.example.com \
  -t pulsegen-frontend:2.1.0 \
  ./frontend
```

---

## Complete Single-Host Example

Full setup script for running all containers individually:

```bash
#!/bin/bash
set -e

# Configuration
POSTGRES_PASSWORD="$(openssl rand -base64 32)"
JWT_SECRET="$(openssl rand -base64 48)"
JWT_REFRESH_SECRET="$(openssl rand -base64 48)"
ENCRYPTION_KEY="$(openssl rand -hex 32)"
VERSION="latest"

# Create network
docker network create pulsegen-network 2>/dev/null || true

# Start PostgreSQL
docker run -d \
  --name pulsegen-postgres \
  --network pulsegen-network \
  --restart unless-stopped \
  -e POSTGRES_USER=pulsegen \
  -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  -e POSTGRES_DB=pulsegen \
  -v pulsegen_postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine

# Wait for PostgreSQL
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Start Redis (optional)
docker run -d \
  --name pulsegen-redis \
  --network pulsegen-network \
  --restart unless-stopped \
  -v pulsegen_redis_data:/data \
  redis:7-alpine redis-server --appendonly yes

# Start Backend
docker run -d \
  --name pulsegen-backend \
  --network pulsegen-network \
  --restart unless-stopped \
  -e DATABASE_URL="postgresql://pulsegen:${POSTGRES_PASSWORD}@pulsegen-postgres:5432/pulsegen" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  -e ENCRYPTION_KEY="$ENCRYPTION_KEY" \
  -e NODE_ENV=production \
  -e REDIS_URL="redis://pulsegen-redis:6379" \
  -v pulsegen_uploads:/app/uploads \
  -v pulsegen_logs:/app/logs \
  -p 5000:5000 \
  ghcr.io/genesis-nexus/pulsegen-backend:$VERSION

# Start Frontend
docker run -d \
  --name pulsegen-frontend \
  --network pulsegen-network \
  --restart unless-stopped \
  -p 3001:80 \
  ghcr.io/genesis-nexus/pulsegen-frontend:$VERSION

echo ""
echo "PulseGen is starting..."
echo "Frontend: http://localhost:3001"
echo "API: http://localhost:5000"
echo ""
echo "Credentials saved - keep these secure:"
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
```

---

## Container Management

### View Running Containers

```bash
docker ps --filter "name=pulsegen"
```

### View Logs

```bash
# All logs
docker logs pulsegen-backend

# Follow logs
docker logs -f pulsegen-backend

# Last 100 lines
docker logs --tail 100 pulsegen-backend
```

### Execute Commands

```bash
# Run database migrations manually
docker exec pulsegen-backend npx prisma migrate deploy

# Open shell in container
docker exec -it pulsegen-backend sh

# Check version
docker exec pulsegen-backend printenv PULSEGEN_VERSION
```

### Stop and Remove

```bash
# Stop all PulseGen containers
docker stop pulsegen-frontend pulsegen-backend pulsegen-redis pulsegen-postgres

# Remove containers
docker rm pulsegen-frontend pulsegen-backend pulsegen-redis pulsegen-postgres

# Remove volumes (WARNING: deletes data)
docker volume rm pulsegen_postgres_data pulsegen_redis_data pulsegen_uploads pulsegen_logs

# Remove network
docker network rm pulsegen-network
```

---

## Health Checks

All containers include health checks. View health status:

```bash
docker inspect --format='{{.State.Health.Status}}' pulsegen-backend
```

Or use Docker Compose:

```bash
docker-compose ps
```

---

## Resource Limits

For production, set resource limits:

```bash
docker run -d \
  --name pulsegen-backend \
  --network pulsegen-network \
  --memory=512m \
  --cpus=1 \
  --restart unless-stopped \
  # ... other options ...
  ghcr.io/genesis-nexus/pulsegen-backend:latest
```

Recommended minimums:

| Service | Memory | CPUs |
|---------|--------|------|
| PostgreSQL | 256MB | 0.5 |
| Redis | 128MB | 0.25 |
| Backend | 512MB | 1.0 |
| Frontend | 128MB | 0.25 |

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs pulsegen-backend

# Check if port is in use
lsof -i :5000
```

### Database Connection Failed

```bash
# Verify PostgreSQL is running
docker exec pulsegen-postgres pg_isready

# Test connection from backend
docker exec pulsegen-backend nc -zv pulsegen-postgres 5432
```

### Frontend Can't Reach Backend

```bash
# Check network connectivity
docker exec pulsegen-frontend ping pulsegen-backend

# Verify backend is responding
docker exec pulsegen-frontend curl http://pulsegen-backend:5000/api/health
```

### Reset Everything

```bash
# Stop and remove all
docker-compose down -v

# Or for individual containers
docker stop $(docker ps -q --filter "name=pulsegen")
docker rm $(docker ps -aq --filter "name=pulsegen")
docker volume rm $(docker volume ls -q --filter "name=pulsegen")
docker network rm pulsegen-network
```

---

## Next Steps

- [Configuration Reference](./configuration.md) - All environment variables
- [Security Guide](./security.md) - Production security hardening
- [Versioning Guide](./versioning.md) - Version management and upgrades
- [Self-Hosting Guide](./self-hosting.md) - Complete deployment guide
