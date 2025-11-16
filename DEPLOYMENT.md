# PulseGen Deployment Guide

This guide covers deploying PulseGen survey platform in various environments.

## Table of Contents

1. [Quick Start with Docker](#quick-start-with-docker)
2. [Manual Installation](#manual-installation)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Migration](#database-migration)
6. [Troubleshooting](#troubleshooting)

## Quick Start with Docker

The fastest way to get PulseGen running is with Docker Compose.

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- At least 2GB RAM
- Anthropic API key (for AI features)

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pulsegen
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

   **Required variables:**
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `JWT_SECRET`: Random string for JWT signing
   - `JWT_REFRESH_SECRET`: Random string for refresh tokens
   - `POSTGRES_PASSWORD`: Database password

   Generate secure secrets:
   ```bash
   # On Linux/Mac
   openssl rand -base64 32

   # Or use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **Start the services**
   ```bash
   docker-compose up -d
   ```

4. **Wait for services to be ready** (30-60 seconds)
   ```bash
   docker-compose logs -f backend
   # Wait for "Server is running on port 5000"
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs

6. **Create your first admin account**
   Visit http://localhost:3000/register and create an account.

### Docker Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Restart a service
docker-compose restart backend

# Access database
docker-compose exec postgres psql -U postgres -d pulsegen

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Access backend shell
docker-compose exec backend sh
```

## Manual Installation

For development or when Docker isn't available.

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 7+
- Anthropic API key

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

4. **Set up database**
   ```bash
   # Create database
   createdb pulsegen

   # Run migrations
   npx prisma migrate deploy

   # Generate Prisma client
   npx prisma generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm run build
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Or build for production:
   ```bash
   npm run build
   npm run preview
   ```

## Production Deployment

### Using Docker with SSL

1. **Set up SSL certificates**

   Using Let's Encrypt:
   ```bash
   # Install certbot
   sudo apt-get install certbot

   # Get certificate
   sudo certbot certonly --standalone -d yourdomain.com
   ```

2. **Copy certificates**
   ```bash
   mkdir -p ssl
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
   ```

3. **Update environment variables**
   ```bash
   nano .env
   ```
   ```
   APP_URL=https://yourdomain.com
   CORS_ORIGIN=https://yourdomain.com
   ```

4. **Start with production profile**
   ```bash
   docker-compose --profile production up -d
   ```

### Production Checklist

- [ ] Set strong passwords for all services
- [ ] Use secure JWT secrets (32+ characters)
- [ ] Configure SMTP for email functionality
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Enable log rotation
- [ ] Configure monitoring
- [ ] Set resource limits in docker-compose.yml
- [ ] Review and adjust rate limiting settings

### Recommended Server Specs

**Minimum:**
- 2 CPU cores
- 4GB RAM
- 20GB SSD storage
- 1Gbps network

**Recommended:**
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage
- 1Gbps network

### Performance Optimization

1. **Database Optimization**
   ```sql
   -- Add indexes for better performance
   CREATE INDEX idx_response_survey_complete ON "Response" (survey_id, is_complete);
   CREATE INDEX idx_answer_response ON "Answer" (response_id);
   ```

2. **Redis Configuration**
   ```bash
   # Edit redis.conf
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

3. **Node.js Optimization**
   ```bash
   # Set Node.js options
   NODE_OPTIONS="--max-old-space-size=2048"
   ```

## Environment Configuration

### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | Yes | - |
| `SMTP_HOST` | SMTP server host | Yes | - |
| `SMTP_PORT` | SMTP server port | Yes | - |
| `SMTP_USER` | SMTP username | Yes | - |
| `SMTP_PASS` | SMTP password | Yes | - |
| `EMAIL_FROM` | From email address | Yes | - |
| `APP_URL` | Frontend URL | Yes | - |
| `CORS_ORIGIN` | Allowed CORS origin | Yes | - |

### Frontend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | Yes | `http://localhost:5000` |

## Database Migration

### Running Migrations

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name migration_name
```

### Database Backup

```bash
# Backup
docker-compose exec postgres pg_dump -U postgres pulsegen > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres pulsegen < backup.sql
```

### Automated Backups

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/pulsegen && docker-compose exec -T postgres pg_dump -U postgres pulsegen | gzip > backups/pulsegen-$(date +\%Y\%m\%d).sql.gz
```

## Troubleshooting

### Backend won't start

1. **Check logs**
   ```bash
   docker-compose logs backend
   ```

2. **Common issues:**
   - Database not ready: Wait longer or check `docker-compose logs postgres`
   - Port already in use: Change `PORT` in `.env`
   - Missing environment variables: Check `.env` file

### Database connection errors

```bash
# Test database connection
docker-compose exec backend npx prisma db push

# Reset database (WARNING: deletes all data)
docker-compose exec backend npx prisma migrate reset
```

### Frontend can't connect to backend

1. **Check CORS settings** in backend `.env`:
   ```
   CORS_ORIGIN=http://localhost:3000
   ```

2. **Check API URL** in frontend `.env`:
   ```
   VITE_API_URL=http://localhost:5000
   ```

### AI features not working

1. **Verify API key**:
   ```bash
   docker-compose exec backend sh -c 'echo $ANTHROPIC_API_KEY'
   ```

2. **Check API quota** on Anthropic dashboard

3. **Review logs**:
   ```bash
   docker-compose logs backend | grep -i anthropic
   ```

### High memory usage

1. **Check resource usage**:
   ```bash
   docker stats
   ```

2. **Adjust memory limits** in `docker-compose.yml`:
   ```yaml
   backend:
     deploy:
       resources:
         limits:
           memory: 1G
   ```

### Slow response times

1. **Enable query logging**:
   ```env
   LOG_LEVEL=debug
   ```

2. **Check Redis connection**:
   ```bash
   docker-compose exec redis redis-cli ping
   ```

3. **Monitor database**:
   ```bash
   docker-compose exec postgres psql -U postgres -d pulsegen -c "SELECT * FROM pg_stat_activity;"
   ```

## Monitoring

### Application Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# Database health
docker-compose exec postgres pg_isready

# Redis health
docker-compose exec redis redis-cli ping
```

### Performance Monitoring

Set up monitoring tools:
- **Application**: New Relic, Datadog
- **Infrastructure**: Prometheus + Grafana
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)

## Scaling

### Horizontal Scaling

1. **Load Balancer Setup**:
   Use Nginx or HAProxy to distribute traffic across multiple backend instances.

2. **Session Storage**:
   Already using Redis for sessions, so multiple instances will share state.

3. **Database**:
   Set up read replicas for analytics queries.

### Vertical Scaling

Increase resources in `docker-compose.yml`:
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
```

## Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Documentation: See `/docs` folder
- Email: support@pulsegen.com
