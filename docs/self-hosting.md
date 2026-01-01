---
layout: default
title: Self-Hosting
nav_order: 3
description: "Deploy PulseGen on your own infrastructure for complete data ownership and control."
---

# Self-Hosting Guide
{: .no_toc }

Deploy PulseGen on your own infrastructure.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Deploy PulseGen on your own infrastructure for complete data ownership and control.

## Deployment Options

| Method | Best For | Complexity |
|--------|----------|------------|
| Docker Compose | Small teams, single server | Low |
| Docker Swarm | Medium scale, HA required | Medium |
| Kubernetes | Large scale, enterprise | High |

---

## Docker Compose (Recommended)

### 1. Server Requirements

- **CPU:** 2+ cores
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 20GB+ SSD
- **OS:** Ubuntu 22.04 LTS, Debian 12, or similar

### 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install docker-compose-plugin
```

### 3. Clone and Configure

```bash
git clone https://github.com/your-org/pulsegen.git
cd pulsegen

# Create production environment file
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
# Production settings
NODE_ENV=production
PORT=5001

# Database (use Docker service name)
DATABASE_URL=postgresql://pulsegen:secure_password@postgres:5432/pulsegen

# Security (generate unique values!)
JWT_SECRET=<generate-with-openssl-rand-hex-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-hex-32>
ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>

# Your domain
APP_URL=https://surveys.yourdomain.com
CORS_ORIGIN=https://surveys.yourdomain.com

# Redis (optional but recommended)
REDIS_URL=redis://redis:6379
```

### 4. Configure Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: pulsegen
      POSTGRES_USER: pulsegen
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pulsegen"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    expose:
      - "5001"

  frontend:
    build: ./frontend
    restart: always
    depends_on:
      - backend
    expose:
      - "80"

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

### 5. Configure Nginx

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:80;
    }

    upstream backend {
        server backend:5001;
    }

    server {
        listen 80;
        server_name surveys.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name surveys.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # API routes
        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### 6. SSL Certificate

**Using Let's Encrypt (recommended):**

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d surveys.yourdomain.com

# Copy certificates
mkdir -p ssl
sudo cp /etc/letsencrypt/live/surveys.yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/surveys.yourdomain.com/privkey.pem ssl/
sudo chown -R $USER:$USER ssl/
```

### 7. Deploy

```bash
# Build and start
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## Security Checklist

### Before Going Live

- [ ] Change all default passwords
- [ ] Generate unique JWT secrets (32+ chars)
- [ ] Generate unique encryption key (64 hex chars)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (allow only 80, 443, SSH)
- [ ] Set up automated backups
- [ ] Configure CORS to your domain only
- [ ] Review rate limiting settings

### Database Security

```bash
# Create backup
docker compose exec postgres pg_dump -U pulsegen pulsegen > backup.sql

# Schedule daily backups (add to crontab)
0 2 * * * cd /path/to/pulsegen && docker compose exec -T postgres pg_dump -U pulsegen pulsegen > /backups/pulsegen-$(date +\%Y\%m\%d).sql
```

### Firewall Configuration

```bash
# UFW example
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

---

## Updating

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker compose exec backend npx prisma migrate deploy
```

---

## Monitoring

### Health Checks

```bash
# Check all services
docker compose -f docker-compose.prod.yml ps

# Check backend health
curl https://surveys.yourdomain.com/api/health

# Check database connection
docker compose exec postgres pg_isready
```

### Log Management

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs

# Follow specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

---

## Scaling

### Horizontal Scaling with Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy as stack
docker stack deploy -c docker-compose.prod.yml pulsegen

# Scale backend
docker service scale pulsegen_backend=3
```

### Performance Tuning

**PostgreSQL (`postgresql.conf`):**
```
shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 128MB
```

**Redis:**
```bash
# Enable persistence
docker compose exec redis redis-cli CONFIG SET appendonly yes
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Rebuild from scratch
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Database Connection Issues

```bash
# Check database is running
docker compose exec postgres pg_isready -U pulsegen

# Check connection from backend
docker compose exec backend npm run db:check
```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Reload nginx
docker compose exec nginx nginx -s reload
```

---

## Support

- **Documentation:** [docs/](.)
- **Issues:** [GitHub Issues](https://github.com/your-org/pulsegen/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/pulsegen/discussions)
