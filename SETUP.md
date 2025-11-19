## PulseGen Local Setup Guide

This guide provides comprehensive instructions for setting up PulseGen for local development.

## Table of Contents

- [Quick Setup (Recommended)](#quick-setup-recommended)
- [Manual Setup](#manual-setup)
- [Docker Setup](#docker-setup)
- [Configuration Options](#configuration-options)
- [Optional Features](#optional-features)
- [Troubleshooting](#troubleshooting)

---

## Quick Setup (Recommended)

The fastest way to get started with PulseGen.

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **Git**

### Option 1: Bash Script (Fastest)

```bash
# Run the quick setup script
./scripts/quick-setup.sh

# Follow the post-setup instructions to create database and run migrations
```

### Option 2: Interactive CLI (More Control)

```bash
# Install tsx globally (if not already installed)
npm install -g tsx

# Run the interactive setup
tsx scripts/setup.ts
```

The interactive setup will guide you through:
- Choosing Docker or local development
- Enabling/disabling Redis caching
- Configuring database credentials
- Setting up admin user
- SMTP configuration (optional)

---

## Manual Setup

For developers who prefer manual configuration.

### Step 1: Prerequisites

Install required software:

**macOS:**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install PostgreSQL
brew install postgresql@16
brew services start postgresql@16

# Optional: Install Redis for caching
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Optional: Install Redis
sudo apt-get install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### Step 2: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd pulsegen

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install automation tool dependencies
cd ../automation-tool
npm install

cd ..
```

### Step 3: Create Database

```bash
# Create PostgreSQL database
createdb pulsegen

# Or using psql
psql -U postgres -c "CREATE DATABASE pulsegen;"
```

### Step 4: Configure Environment Variables

Create `backend/.env`:

```bash
# Copy example file
cp backend/.env.example backend/.env

# Edit with your preferred editor
nano backend/.env  # or vim, code, etc.
```

**Required Configuration:**

```env
# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/pulsegen

# JWT Secrets (generate with: openssl rand -hex 32)
JWT_SECRET=your_generated_secret_here
JWT_REFRESH_SECRET=your_generated_secret_here

# Encryption Key (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your_generated_encryption_key_here

# Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

**Optional Configuration:**

```env
# Redis (optional - improves performance)
REDIS_URL=redis://localhost:6379
USE_CACHE=true  # Set to false to disable caching

# SMTP (optional - for email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@pulsegen.com

# AI Providers (optional - users can add their own keys in UI)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Create `automation-tool/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### Step 5: Initialize Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database with initial data
npm run prisma:seed
```

### Step 6: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Automation Tool (Optional):**
```bash
cd automation-tool
npm run dev
```

### Step 7: Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Automation Tool**: http://localhost:3001

**Default Login:**
- Email: `admin@example.com`
- Password: `admin123`

---

## Docker Setup

Use Docker for a containerized development environment.

### Prerequisites

- **Docker** 20+
- **Docker Compose** 2+

### Quick Start

```bash
# Copy environment file
cp .env.example .env

# Edit .env if needed
nano .env

# Start all services (without Redis)
docker-compose up -d

# Or start with Redis for better performance
docker-compose --profile with-redis up -d
```

### Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432
- **Redis** (if enabled): localhost:6379

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild containers
docker-compose up -d --build

# Access backend shell
docker exec -it pulsegen_backend sh

# Access database
docker exec -it pulsegen_postgres psql -U postgres -d pulsegen

# Run migrations in container
docker exec -it pulsegen_backend npx prisma migrate dev

# Seed database in container
docker exec -it pulsegen_backend npm run prisma:seed
```

---

## Configuration Options

### Caching Layer

PulseGen supports **optional** caching with Redis:

**Option 1: Use Redis (Recommended for Production)**
```env
REDIS_URL=redis://localhost:6379
USE_CACHE=true
```

**Option 2: Use In-Memory Cache (Development)**
```env
# Comment out or remove REDIS_URL
USE_CACHE=true
```

**Option 3: Disable Caching**
```env
USE_CACHE=false
```

### Database Options

**PostgreSQL (Default):**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/pulsegen
```

**Docker PostgreSQL:**
```env
DATABASE_URL=postgresql://postgres:password@postgres:5432/pulsegen
```

### Environment Modes

**Development:**
```env
NODE_ENV=development
```

**Production:**
```env
NODE_ENV=production
```

---

## Optional Features

### Email (SMTP)

Configure SMTP to enable email features:

**Gmail Example:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password  # Generate at: myaccount.google.com/apppasswords
EMAIL_FROM=noreply@yourdomain.com
```

### Single Sign-On (SSO)

Configure SSO providers in the UI after setup:
1. Navigate to Settings → SSO
2. Add provider configuration
3. Test and enable

### AI Features

Users can configure their own AI provider API keys in:
- Settings → AI Providers

Or set system-wide defaults:
```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
```

### MindsDB Integration

For ML features:
1. Install MindsDB
2. Configure in Settings → AI Tools
3. Connect to your MindsDB instance

---

## Troubleshooting

### Database Connection Errors

**Error:** `ECONNREFUSED` or `Connection refused`

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
# macOS
brew services start postgresql@16

# Linux
sudo systemctl start postgresql
```

### Port Already in Use

**Error:** `Port 5000 is already in use`

**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

### Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
cd backend
npx prisma generate
```

### Redis Connection Fails

**This is OK!** The application will automatically fall back to in-memory caching.

To use Redis:
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker-compose --profile with-redis up -d
```

### Migration Errors

**Error:** `Migration failed` or `Database schema is not in sync`

**Solution:**
```bash
cd backend

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or create a new migration
npx prisma migrate dev --name fix_schema
```

### Frontend Not Loading

**Check:**
1. Is the backend running? (http://localhost:5000/api/health)
2. Is `VITE_API_URL` correct in `frontend/.env`?
3. Are there CORS errors in browser console?

**Solution:**
```bash
# Check backend health
curl http://localhost:5000/api/health

# Restart frontend
cd frontend
npm run dev
```

### npm Install Failures

**Error:** `EACCES` or permission errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Use node version manager (recommended)
nvm use 18

# Or fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
```

---

## Advanced Configuration

### Custom Domain

```env
APP_URL=https://surveys.yourdomain.com
CORS_ORIGIN=https://surveys.yourdomain.com
```

### SSL in Development

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configure backend (optional)
SSL_KEY_PATH=./key.pem
SSL_CERT_PATH=./cert.pem
```

### Multiple Environments

Create environment-specific files:
- `.env.development`
- `.env.staging`
- `.env.production`

```bash
# Load specific environment
NODE_ENV=staging npm run dev
```

---

## Next Steps

After setup:

1. **Change Admin Password** in Settings → Account
2. **Configure AI Providers** in Settings → AI (optional)
3. **Set Up SMTP** for email features (optional)
4. **Configure Branding** in Settings → Branding
5. **Explore Automation Tool** at http://localhost:3001
6. **Read Documentation**:
   - Main: [README.md](README.md)
   - Automation: [AUTOMATION_TOOL.md](AUTOMATION_TOOL.md)

---

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section above
- Review logs: `backend/logs/` or `docker-compose logs`
- Check GitHub Issues
- Review environment configuration

## Security Notes

**Before deploying to production:**

1. Change all default passwords
2. Use strong, randomly generated secrets
3. Enable HTTPS/SSL
4. Configure proper CORS origins
5. Set up firewalls and security groups
6. Enable rate limiting
7. Regular backups of PostgreSQL database
8. Keep dependencies updated

---

Happy coding! 🚀
