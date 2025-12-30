# PulseGen Deployment Guide

This guide covers different deployment options for PulseGen, from simple Docker Compose setups to cloud deployments.

## Table of Contents

- [Quick Start with Docker Compose](#quick-start-with-docker-compose)
- [Individual Container Setup](#individual-container-setup)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Cloud Deployments](#cloud-deployments)
  - [AWS Deployment](#aws-deployment)
  - [Google Cloud Platform](#google-cloud-platform)
  - [Azure Deployment](#azure-deployment)
- [Environment Variables](#environment-variables)
- [SSL/HTTPS Configuration](#sslhttps-configuration)
- [Backup and Recovery](#backup-and-recovery)
- [Monitoring and Logging](#monitoring-and-logging)

---

## Quick Start with Docker Compose

The fastest way to get PulseGen running is with Docker Compose.

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- 10GB disk space

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/genesis-nexus/pulsegen.git
   cd pulsegen
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file** with your settings:
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

   Generate secure secrets:
   ```bash
   # Generate JWT secrets
   openssl rand -base64 32

   # Generate encryption key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Start all services**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - Frontend: http://localhost:3001
   - API: http://localhost:5001
   - Default admin credentials: admin@example.com / admin123 (change immediately!)

6. **Check logs**
   ```bash
   docker-compose logs -f
   ```

### With Redis (Optional, for improved performance)

To start with Redis cache:
```bash
docker-compose --profile with-redis up -d
```

### With Nginx Reverse Proxy (Production)

To start with Nginx reverse proxy:
```bash
docker-compose --profile production up -d
```

Access via: http://localhost

---

## Individual Container Setup

Run each component as a separate container for more control.

### 1. Network Setup

Create a shared network:
```bash
docker network create pulsegen_network
```

### 2. PostgreSQL Database

```bash
docker run -d \
  --name pulsegen_postgres \
  --network pulsegen_network \
  -e POSTGRES_DB=pulsegen \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_secure_password \
  -v pulsegen_postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Redis Cache (Optional)

```bash
docker run -d \
  --name pulsegen_redis \
  --network pulsegen_network \
  -v pulsegen_redis_data:/data \
  -p 6379:6379 \
  redis:7-alpine
```

### 4. Backend API

Build the backend image:
```bash
cd backend
docker build -t pulsegen-backend .
```

Run the backend:
```bash
docker run -d \
  --name pulsegen_backend \
  --network pulsegen_network \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DATABASE_URL=postgresql://postgres:your_secure_password@pulsegen_postgres:5432/pulsegen \
  -e REDIS_URL=redis://pulsegen_redis:6379 \
  -e JWT_SECRET=your_jwt_secret \
  -e JWT_REFRESH_SECRET=your_refresh_secret \
  -e ENCRYPTION_KEY=your_encryption_key \
  -p 5001:5000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/logs:/app/logs \
  pulsegen-backend
```

### 5. Frontend

Build the frontend image:
```bash
cd frontend
docker build -t pulsegen-frontend \
  --build-arg VITE_API_URL=http://localhost:5001 \
  .
```

Run the frontend:
```bash
docker run -d \
  --name pulsegen_frontend \
  --network pulsegen_network \
  -p 3001:80 \
  pulsegen-frontend
```

---

## Development Setup

For local development with hot-reloading:

### Using Docker Compose

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Start with Redis
docker-compose -f docker-compose.dev.yml --profile with-redis up
```

This provides:
- Hot-reload for backend (tsx watch)
- Hot-reload for frontend (Vite HMR)
- Source code mounted as volumes
- Development tools and debugging enabled

### Without Docker

See [Local Development Setup](../README.md#local-development) in the main README.

---

## Production Deployment

### Pre-deployment Checklist

- [ ] Change all default passwords and secrets
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Configure monitoring and alerting
- [ ] Review security headers in nginx.conf
- [ ] Set appropriate resource limits
- [ ] Configure log rotation
- [ ] Test disaster recovery procedures

### Production Docker Compose

1. **Update docker-compose.yml** for production:
   - Set production environment variables
   - Configure SSL in nginx
   - Set up volume backups
   - Configure restart policies

2. **Deploy with Nginx reverse proxy**:
   ```bash
   docker-compose --profile production up -d
   ```

3. **Set up SSL certificates** (Let's Encrypt):
   ```bash
   # Install certbot
   sudo apt-get install certbot

   # Get certificates
   sudo certbot certonly --standalone -d yourdomain.com

   # Copy certificates
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
   ```

4. **Update nginx.conf** to enable HTTPS (uncomment SSL section)

5. **Restart services**:
   ```bash
   docker-compose restart nginx
   ```

### Resource Recommendations

**Minimum Requirements:**
- 2 CPU cores
- 4GB RAM
- 20GB storage
- Handles ~100 concurrent users

**Recommended for Production:**
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ SSD storage
- Handles 500+ concurrent users

---

## Cloud Deployments

### AWS Deployment

#### Option 1: EC2 with Docker Compose

1. **Launch EC2 instance**
   - Instance type: t3.medium or larger
   - AMI: Amazon Linux 2 or Ubuntu 22.04
   - Storage: 30GB+ EBS volume
   - Security group: Allow ports 80, 443, 22

2. **Install Docker**
   ```bash
   # Amazon Linux 2
   sudo yum update -y
   sudo yum install docker -y
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -a -G docker ec2-user

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Deploy application**
   ```bash
   git clone https://github.com/genesis-nexus/pulsegen.git
   cd pulsegen
   cp .env.example .env
   nano .env  # Configure environment
   docker-compose --profile production up -d
   ```

4. **Configure Route 53** for DNS
   - Create A record pointing to EC2 public IP

5. **Set up Application Load Balancer** (optional but recommended)
   - Create target group pointing to EC2 instance
   - Configure health checks
   - Add SSL certificate from ACM

#### Option 2: ECS with Fargate

See [AWS ECS Deployment Guide](./deployment/aws-ecs.md) for detailed instructions.

#### Option 3: EKS with Kubernetes

See [AWS EKS Deployment Guide](./deployment/aws-eks.md) for detailed instructions.

#### Using RDS for Database

Instead of running PostgreSQL in a container:

1. **Create RDS PostgreSQL instance**
   - Engine: PostgreSQL 16
   - Instance class: db.t3.micro (for testing) or db.t3.medium (production)
   - Storage: 20GB+ with autoscaling
   - Enable automatic backups

2. **Update DATABASE_URL** in .env:
   ```env
   DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/pulsegen
   ```

3. **Remove postgres service** from docker-compose.yml

#### Using ElastiCache for Redis

1. **Create ElastiCache Redis cluster**
   - Engine: Redis 7.x
   - Node type: cache.t3.micro or larger

2. **Update REDIS_URL** in .env:
   ```env
   REDIS_URL=redis://your-elasticache-endpoint:6379
   ```

---

### Google Cloud Platform

#### Option 1: Compute Engine with Docker

1. **Create VM instance**
   ```bash
   gcloud compute instances create pulsegen-vm \
     --machine-type=e2-medium \
     --image-family=ubuntu-2204-lts \
     --image-project=ubuntu-os-cloud \
     --boot-disk-size=30GB \
     --tags=http-server,https-server
   ```

2. **SSH into instance**
   ```bash
   gcloud compute ssh pulsegen-vm
   ```

3. **Install Docker and deploy** (same as AWS EC2 steps)

#### Option 2: Cloud Run

See [GCP Cloud Run Deployment Guide](./deployment/gcp-cloudrun.md)

#### Using Cloud SQL

1. **Create Cloud SQL PostgreSQL instance**
   ```bash
   gcloud sql instances create pulsegen-db \
     --database-version=POSTGRES_16 \
     --tier=db-f1-micro \
     --region=us-central1
   ```

2. **Configure connection** using Cloud SQL Proxy

---

### Azure Deployment

#### Option 1: Virtual Machine with Docker

1. **Create VM**
   ```bash
   az vm create \
     --resource-group pulsegen-rg \
     --name pulsegen-vm \
     --image UbuntuLTS \
     --size Standard_B2s \
     --admin-username azureuser \
     --generate-ssh-keys
   ```

2. **Install Docker and deploy** (same as AWS EC2 steps)

#### Option 2: Container Instances

See [Azure Container Instances Guide](./deployment/azure-aci.md)

#### Using Azure Database for PostgreSQL

1. **Create PostgreSQL server**
   ```bash
   az postgres flexible-server create \
     --resource-group pulsegen-rg \
     --name pulsegen-db \
     --location eastus \
     --admin-user pgadmin \
     --admin-password <password> \
     --sku-name Standard_B1ms
   ```

---

## Environment Variables

See [.env.example](../.env.example) for complete list of environment variables.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | `secure_password_123` |
| `JWT_SECRET` | JWT signing secret | `random_32_char_string` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `another_random_string` |
| `ENCRYPTION_KEY` | Encryption key (64 char hex) | `0123456789abcdef...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | In-memory cache |
| `SMTP_HOST` | Email server host | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `OPENAI_API_KEY` | OpenAI API key | - |

---

## SSL/HTTPS Configuration

### Using Let's Encrypt (Recommended)

1. **Install Certbot**
   ```bash
   sudo snap install --classic certbot
   ```

2. **Get certificates**
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```

3. **Copy to project directory**
   ```bash
   mkdir -p ssl
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
   sudo chown $USER:$USER ssl/*
   ```

4. **Update nginx.conf** to enable HTTPS

5. **Set up auto-renewal**
   ```bash
   sudo certbot renew --dry-run
   ```

### Using Cloud Provider SSL

- **AWS**: Use ACM certificates with ALB
- **GCP**: Use Google-managed certificates with Load Balancer
- **Azure**: Use App Service certificates or Key Vault

---

## Backup and Recovery

### Database Backups

#### Automated Backups

Create a backup script:
```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER="pulsegen_postgres"

mkdir -p $BACKUP_DIR

docker exec $CONTAINER pg_dump -U postgres pulsegen | gzip > $BACKUP_DIR/pulsegen_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

Add to crontab:
```bash
# Backup daily at 2 AM
0 2 * * * /path/to/backup-db.sh
```

#### Manual Backup

```bash
# Backup
docker exec pulsegen_postgres pg_dump -U postgres pulsegen > backup.sql

# Restore
cat backup.sql | docker exec -i pulsegen_postgres psql -U postgres -d pulsegen
```

### File Uploads Backup

```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/

# Restore
tar -xzf uploads_backup_20240101.tar.gz
```

---

## Monitoring and Logging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Log Rotation

Configure in docker-compose.yml:
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Health Checks

Check service health:
```bash
# Backend health
curl http://localhost:5001/api/health

# Database connection
docker exec pulsegen_postgres pg_isready -U postgres

# Redis connection
docker exec pulsegen_redis redis-cli ping
```

### Monitoring Tools

- **Prometheus + Grafana**: Metrics and dashboards
- **CloudWatch**: AWS monitoring
- **Cloud Monitoring**: GCP monitoring
- **Azure Monitor**: Azure monitoring

---

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check DATABASE_URL is correct
   - Ensure postgres container is healthy
   - Verify network connectivity

2. **Frontend shows "API Error"**
   - Check VITE_API_URL matches backend URL
   - Verify CORS_ORIGIN in backend .env
   - Check backend is running

3. **Docker Compose fails to start**
   - Check docker-compose.yml syntax
   - Verify .env file exists
   - Ensure ports are not in use

### Getting Help

- GitHub Issues: https://github.com/genesis-nexus/pulsegen/issues
- Documentation: https://github.com/genesis-nexus/pulsegen/docs

---

## Next Steps

- [API Documentation](./api.md)
- [Configuration Guide](./CONFIGURATION.md)
- [Security Best Practices](./SECURITY.md)
- [Performance Tuning](./PERFORMANCE.md)
