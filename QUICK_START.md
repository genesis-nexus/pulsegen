# PulseGen Quick Start Guide

Get PulseGen running in minutes!

## TL;DR - Fastest Setup

**Linux/macOS:**
```bash
git clone https://github.com/genesis-nexus/pulsegen.git
cd pulsegen
./setup.sh
```

**Windows:**
```powershell
git clone https://github.com/genesis-nexus/pulsegen.git
cd pulsegen
.\setup.ps1
```

Then open http://localhost:3001

## What You Need

- Docker Desktop installed ([Get Docker](https://docs.docker.com/get-docker/))
- 2GB+ RAM and 10GB+ disk space

## Setup Options

### 1. Automated Script (Recommended)

The setup script handles everything:
- ✓ Checks prerequisites
- ✓ Generates secure secrets
- ✓ Creates configuration
- ✓ Starts all services

### 2. Manual Docker Compose

```bash
# Clone and configure
git clone https://github.com/genesis-nexus/pulsegen.git
cd pulsegen
cp .env.example .env

# Edit .env - IMPORTANT: Change these values!
# - POSTGRES_PASSWORD
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - ENCRYPTION_KEY
# - ADMIN_PASSWORD

# Start services
docker-compose --profile production up -d
```

## Generate Secure Secrets

**Linux/macOS:**
```bash
# Database password & JWT secrets
openssl rand -base64 32

# Encryption key (64 char hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Windows (PowerShell):**
```powershell
# Random string
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Deployment Modes

| Mode | Command | Use Case |
|------|---------|----------|
| **Basic** | `docker-compose up -d` | Quick test |
| **Production** | `docker-compose --profile production up -d` | Production with Nginx |
| **With Redis** | `docker-compose --profile with-redis up -d` | Better performance |
| **Development** | `docker-compose -f docker-compose.dev.yml up` | Hot-reload |

## Access Points

After starting:
- **Application**: http://localhost:3001
- **API**: http://localhost:5001
- **Database**: localhost:5432
- **Redis**: localhost:6379 (if enabled)

Default admin credentials:
- **Email**: admin@example.com
- **Password**: admin123 (or what you set in .env)

**⚠️ Change the admin password immediately after first login!**

## Common Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart
docker-compose restart

# Check status
docker-compose ps

# Rebuild after changes
docker-compose up -d --build
```

## Troubleshooting

**Services won't start?**
```bash
# Check Docker is running
docker ps

# View error logs
docker-compose logs
```

**Port already in use?**
```bash
# Find what's using the port
lsof -i :3001  # or :5001

# Kill the process or change ports in docker-compose.yml
```

**Database connection errors?**
```bash
# Check database health
docker exec pulsegen_postgres pg_isready -U postgres
```

**Need a fresh start?**
```bash
# Remove everything and start over
docker-compose down -v
rm .env
./setup.sh
```

## Next Steps

1. ✓ Access http://localhost:3001
2. ✓ Login with admin credentials
3. ✓ **Change admin password**
4. ✓ Configure AI providers (optional)
5. ✓ Create your first survey
6. ✓ Invite team members

## Production Deployment

For production environments, see:
- [Complete Deployment Guide](docs/DEPLOYMENT.md)
- [AWS Deployment](docs/deployment/aws/README.md) (Terraform/CloudFormation)
- [Cloud Deployments](docs/DEPLOYMENT.md#cloud-deployments)

## Configuration

See [.env.example](.env.example) for all configuration options.

Essential variables:
- Database credentials
- JWT secrets
- Encryption key
- Admin credentials
- Email settings (optional)
- AI API keys (optional)

## Need Help?

- **Documentation**: [docs/](docs/)
- **Issues**: https://github.com/genesis-nexus/pulsegen/issues
- **Full Setup Guide**: [SETUP.md](SETUP.md)
