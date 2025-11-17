# PulseGen Enterprise - Customer Setup Guide

Welcome to PulseGen Enterprise! This guide will help you install and configure your self-hosted survey platform in under 30 minutes.

## What's Included

As a PulseGen Enterprise customer, you get:
- ✅ Full access to PulseGen source code
- ✅ Production-ready Docker configuration
- ✅ Automated installation script
- ✅ Priority support & updates
- ✅ Enterprise features (SSO, white-label, advanced analytics)
- ✅ Security patches & compliance assistance

---

## Prerequisites

Before you begin, ensure you have:

### Server Requirements

**Minimum Specifications:**
- 2 CPU cores
- 4GB RAM
- 20GB SSD storage
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+ (or any Docker-compatible OS)
- Public IP address (for web access)
- Domain name pointed to your server (recommended for SSL)

**Recommended Specifications:**
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage

**Supported Platforms:**
- DigitalOcean Droplet ($24/month for recommended specs)
- AWS EC2 (t3.medium or better)
- Google Cloud Compute Engine (e2-medium)
- Azure Virtual Machine (B2s)
- Any VPS provider
- On-premises server

### What You Need

1. **Your License Key** (provided in welcome email)
2. **Server Access** (SSH root or sudo access)
3. **Domain Name** (optional but recommended)
   - Example: `surveys.yourcompany.com`
   - Point A record to your server IP
4. **SMTP Credentials** (for sending survey emails)
   - Gmail, SendGrid, Mailgun, AWS SES, or any SMTP service

### Optional (for AI Features)
- OpenAI API key (for GPT-4 powered features)
- Anthropic API key (for Claude powered features)
- Google AI API key (for Gemini powered features)

---

## Installation Methods

Choose the method that works best for you:

### Method 1: One-Command Installation (Recommended)

**Fastest and easiest - takes 10-15 minutes**

```bash
# Download and run the automated installer
curl -fsSL https://install.pulsegen.com/enterprise.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --license-key YOUR_LICENSE_KEY
```

The script will:
1. Check system requirements
2. Install Docker & Docker Compose
3. Download PulseGen Enterprise
4. Configure environment variables
5. Set up SSL certificate (if domain provided)
6. Start all services
7. Create admin account
8. Run health checks

**After installation:**
- Access PulseGen at `https://yourdomain.com` (or `http://your-server-ip:3000`)
- Check your email for admin credentials
- Complete the setup wizard

**Jump to**: [Post-Installation Setup](#post-installation-setup)

---

### Method 2: Docker Compose (Manual)

**More control over configuration - takes 20-30 minutes**

#### Step 1: Install Docker

```bash
# Update package index
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

#### Step 2: Clone Repository

```bash
# Authenticate with your license key
export LICENSE_KEY="your_license_key_here"

# Clone the enterprise repository
git clone https://customer:${LICENSE_KEY}@git.pulsegen.com/pulsegen/enterprise.git pulsegen
cd pulsegen
```

#### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your settings
nano .env
```

**Required environment variables:**

```bash
# Database
POSTGRES_PASSWORD=create_a_strong_password_here

# Security (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Application URLs
APP_URL=https://surveys.yourcompany.com
CORS_ORIGIN=https://surveys.yourcompany.com
VITE_API_URL=https://surveys.yourcompany.com/api

# Email Configuration (example with Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@yourcompany.com

# License
LICENSE_KEY=your_license_key_here

# AI Configuration (Optional)
ANTHROPIC_API_KEY=your_anthropic_key  # or
OPENAI_API_KEY=your_openai_key        # or
GOOGLE_AI_KEY=your_google_key         # Users can also add their own keys via UI
```

**Generate secure secrets:**
```bash
# Generate JWT secrets
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Step 4: Start Services

```bash
# Start all services
docker compose up -d

# Check logs to ensure everything started
docker compose logs -f

# Wait for "Server is running on port 5000" message
```

#### Step 5: Verify Installation

```bash
# Check service status
docker compose ps

# All services should show "Up" status
# NAME                      STATUS
# pulsegen_postgres         Up (healthy)
# pulsegen_redis            Up (healthy)
# pulsegen_backend          Up
# pulsegen_frontend         Up
```

**Access your instance:**
- Frontend: `http://your-server-ip:3000`
- Backend API: `http://your-server-ip:5000`
- API Docs: `http://your-server-ip:5000/api-docs`

---

### Method 3: Kubernetes (Enterprise)

**For large-scale deployments - contact support for Helm charts**

```bash
# Add PulseGen Helm repository
helm repo add pulsegen https://charts.pulsegen.com/enterprise
helm repo update

# Install with your license key
helm install pulsegen pulsegen/pulsegen \
  --set license.key=YOUR_LICENSE_KEY \
  --set ingress.host=surveys.yourcompany.com \
  --set postgresql.auth.password=secure_password

# Monitor deployment
kubectl get pods -n pulsegen
```

Contact support@pulsegen.com for Kubernetes deployment assistance.

---

## Post-Installation Setup

### 1. SSL Certificate Setup (Recommended)

**Option A: Automatic with Let's Encrypt**

```bash
# If you used the automated installer with a domain, SSL is already configured!
# Otherwise, run:

cd pulsegen
sudo ./scripts/setup-ssl.sh yourdomain.com your-email@company.com
```

**Option B: Manual Let's Encrypt**

```bash
# Install Certbot
sudo apt install certbot -y

# Get certificate
sudo certbot certonly --standalone -d surveys.yourcompany.com

# Certificates will be in:
# /etc/letsencrypt/live/surveys.yourcompany.com/

# Copy to PulseGen
sudo cp /etc/letsencrypt/live/surveys.yourcompany.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/surveys.yourcompany.com/privkey.pem ./ssl/

# Restart services
docker compose restart
```

**Option C: Use Your Own Certificate**

```bash
# Copy your certificates
cp your-certificate.crt ./ssl/fullchain.pem
cp your-private-key.key ./ssl/privkey.pem

# Update nginx configuration (if using)
# Then restart
docker compose restart
```

---

### 2. Create Admin Account

**Via Web Interface:**
1. Visit `https://yourdomain.com/register`
2. Create your admin account
3. Check email for verification link
4. Log in at `https://yourdomain.com/login`

**Via Command Line:**

```bash
docker compose exec backend npm run create-admin

# Follow the prompts to create admin user
# Email: admin@yourcompany.com
# Password: (enter secure password)
```

---

### 3. Configure Email (SMTP)

Email is required for:
- User invitations
- Password resets
- Survey distribution
- Response notifications

**Popular SMTP providers:**

**Gmail:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Generate at https://myaccount.google.com/apppasswords
EMAIL_FROM=noreply@yourcompany.com
```

**SendGrid:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
EMAIL_FROM=noreply@yourcompany.com
```

**AWS SES:**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@yourcompany.com
```

**Test email configuration:**
```bash
# Send test email
docker compose exec backend npm run test-email your-email@company.com
```

---

### 4. Configure AI Features (Optional)

PulseGen supports multiple AI providers. Users can add their own API keys, or you can set a default.

**Option 1: Set Default Provider (Backend)**

Edit `.env`:
```bash
# Choose one or multiple providers
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
GOOGLE_AI_KEY=xxx
AZURE_OPENAI_KEY=xxx
```

Restart backend:
```bash
docker compose restart backend
```

**Option 2: Let Users Add Their Own Keys**

1. Log in as admin
2. Go to Settings → AI Configuration
3. Users can add their own API keys
4. Each user can choose their preferred provider

**Test AI features:**
1. Create a new survey
2. Click "Generate with AI"
3. Enter a prompt like "Create a customer satisfaction survey"
4. PulseGen will generate questions automatically

---

### 5. Enable Enterprise Features

#### SSO (Single Sign-On)

```bash
# Edit .env
SSO_ENABLED=true
SAML_ENTRY_POINT=https://your-idp.com/sso
SAML_ISSUER=pulsegen
SAML_CERT=your_certificate_here

# Or use OAuth2
OAUTH_ENABLED=true
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_CALLBACK_URL=https://surveys.yourcompany.com/auth/callback
```

Restart services:
```bash
docker compose restart
```

#### White-Label Branding

1. Log in as admin
2. Go to Settings → Branding
3. Upload your logo
4. Customize colors, fonts, and styles
5. Add custom domain
6. Remove "Powered by PulseGen" footer (Enterprise only)

#### Custom Domain

1. Point your domain to server IP
2. Update `.env`:
   ```bash
   APP_URL=https://surveys.yourcompany.com
   CORS_ORIGIN=https://surveys.yourcompany.com
   ```
3. Set up SSL for your domain
4. Restart: `docker compose restart`

---

## Configuration Checklist

After installation, complete these steps:

- [ ] SSL certificate configured
- [ ] Admin account created
- [ ] Email (SMTP) configured and tested
- [ ] AI provider API key added (optional)
- [ ] Firewall configured (ports 80, 443 open)
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Custom branding applied
- [ ] SSO configured (if needed)
- [ ] User accounts created
- [ ] First survey created and tested

---

## Firewall Configuration

### UFW (Ubuntu/Debian)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Firewalld (CentOS/RHEL)

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Cloud Provider Firewall

If using AWS, GCP, or Azure, configure security groups:
- **Inbound**: Allow ports 80, 443 from 0.0.0.0/0
- **Outbound**: Allow all

---

## Backup & Disaster Recovery

### Automated Daily Backups

```bash
# Create backup directory
mkdir -p /var/backups/pulsegen

# Add to crontab (daily at 2 AM)
sudo crontab -e
```

Add this line:
```bash
0 2 * * * cd /path/to/pulsegen && docker compose exec -T postgres pg_dump -U postgres pulsegen | gzip > /var/backups/pulsegen/backup-$(date +\%Y\%m\%d).sql.gz
```

### Manual Backup

```bash
# Backup database
docker compose exec postgres pg_dump -U postgres pulsegen > backup.sql

# Backup uploaded files
tar -czf uploads-backup.tar.gz backend/uploads/

# Backup configuration
cp .env .env.backup
```

### Restore from Backup

```bash
# Stop services
docker compose down

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U postgres pulsegen

# Restore uploads
tar -xzf uploads-backup.tar.gz

# Start services
docker compose up -d
```

### Cloud Backup (Recommended)

**AWS S3:**
```bash
# Install AWS CLI
sudo apt install awscli -y

# Configure credentials
aws configure

# Daily backup to S3
0 2 * * * cd /path/to/pulsegen && docker compose exec -T postgres pg_dump -U postgres pulsegen | gzip | aws s3 cp - s3://your-bucket/pulsegen/backup-$(date +\%Y\%m\%d).sql.gz
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check all services
docker compose ps

# View logs
docker compose logs -f

# Check backend health
curl http://localhost:5000/health

# Check database
docker compose exec postgres pg_isready
```

### Update PulseGen

As an Enterprise customer, you receive automatic updates:

```bash
# Pull latest version
cd pulsegen
git pull origin main

# Update containers
docker compose pull
docker compose up -d

# Run database migrations
docker compose exec backend npx prisma migrate deploy

# Verify update
curl http://localhost:5000/version
```

### Performance Monitoring

Monitor these metrics:
- CPU usage: `top` or `htop`
- Memory: `free -h`
- Disk: `df -h`
- Docker stats: `docker stats`

**Set up alerts** (optional):
```bash
# Install monitoring stack
docker run -d --name=prometheus prom/prometheus
docker run -d --name=grafana grafana/grafana
```

Contact support for Prometheus/Grafana configuration assistance.

---

## Scaling & Performance

### Vertical Scaling (Single Server)

**Increase resources:**
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
        reservations:
          cpus: '2'
          memory: 2G
```

### Horizontal Scaling (Multiple Servers)

For high traffic (10,000+ responses/day):

1. **Load Balancer**: Nginx or AWS ALB
2. **Multiple Backend Instances**: Scale backend service
3. **Shared Database**: PostgreSQL with read replicas
4. **Shared Redis**: Redis Cluster or managed service
5. **Shared Storage**: S3 or network filesystem

Contact support@pulsegen.com for scaling assistance.

---

## Troubleshooting

### Services won't start

```bash
# Check logs
docker compose logs backend
docker compose logs postgres

# Common issues:
# 1. Port already in use
sudo lsof -i :5000  # Find what's using port
sudo kill -9 PID    # Kill process

# 2. Database not ready
docker compose restart postgres
sleep 10
docker compose restart backend
```

### Can't connect to application

```bash
# Check if services are running
docker compose ps

# Check firewall
sudo ufw status

# Check nginx (if using)
sudo nginx -t
sudo systemctl restart nginx

# Check logs
docker compose logs frontend
docker compose logs backend
```

### Email not sending

```bash
# Test SMTP connection
docker compose exec backend npm run test-email your-email@example.com

# Check SMTP settings in .env
cat .env | grep SMTP

# Common issues:
# - Gmail: Need app-specific password
# - Firewall: Port 587 must be open
# - Authentication: Check username/password
```

### AI features not working

```bash
# Check API key
docker compose exec backend sh -c 'echo $ANTHROPIC_API_KEY'

# Check logs for API errors
docker compose logs backend | grep -i "anthropic\|openai"

# Test API key manually
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

### Database issues

```bash
# Access database
docker compose exec postgres psql -U postgres pulsegen

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Reset database (WARNING: deletes all data)
docker compose down
docker volume rm pulsegen_postgres_data
docker compose up -d
docker compose exec backend npx prisma migrate deploy
```

### High CPU/Memory usage

```bash
# Check resource usage
docker stats

# Limit container resources
# Edit docker-compose.yml and add:
deploy:
  resources:
    limits:
      memory: 1G

# Restart with limits
docker compose up -d
```

---

## Getting Help

### Support Channels

**Email Support** (All customers)
- Email: support@pulsegen.com
- Response time: 24-48 hours (Starter), 12-24 hours (Professional), 4 hours (Enterprise)

**Priority Support** (Professional+)
- Schedule call: https://calendly.com/pulsegen-support
- Slack channel: Join your private customer channel
- Phone: Available for Enterprise customers

**Knowledge Base**
- Documentation: https://docs.pulsegen.com
- Video tutorials: https://learn.pulsegen.com
- Community forum: https://community.pulsegen.com

### What to Include in Support Requests

1. **License key** (first 8 characters only)
2. **Server specs** (CPU, RAM, OS)
3. **Installation method** (automated script, manual, etc.)
4. **Error messages** (exact text or screenshot)
5. **Logs** (relevant portions only)
   ```bash
   docker compose logs backend --tail=100
   docker compose logs frontend --tail=100
   ```
6. **Steps to reproduce** the issue

### Emergency Support (Enterprise Only)

24/7 phone support for critical issues:
- Phone: +1-XXX-XXX-XXXX
- Severity 1: System down (4-hour response)
- Severity 2: Major feature broken (8-hour response)

---

## Next Steps

### 1. Complete Setup Wizard

1. Log in to your PulseGen instance
2. Complete the first-time setup wizard
3. Configure organization settings
4. Add team members
5. Set up integrations

### 2. Create Your First Survey

1. Click "New Survey"
2. Choose a template or start from scratch
3. Add questions using drag-and-drop
4. Configure survey logic
5. Preview and test
6. Publish and share

### 3. Explore Features

- **AI Survey Generation**: Let AI create surveys from prompts
- **Advanced Analytics**: Real-time dashboards and insights
- **Integrations**: Connect to Slack, Zapier, webhooks
- **White-label**: Customize branding
- **API**: Build custom integrations

### 4. Schedule Training (Optional)

Book a free 60-minute onboarding call:
- https://calendly.com/pulsegen-onboarding
- We'll walk through features and best practices

### 5. Join the Community

- **Slack**: Join customer Slack workspace (invitation in welcome email)
- **Newsletter**: Get tips, updates, and case studies
- **Feedback**: Share feature requests and feedback

---

## License Verification

Your PulseGen instance will verify your license once per day. This:
- Ensures you receive security updates
- Enables premium features
- Does NOT send any customer data
- Only transmits: license key, version, instance ID

**Privacy:** We never access your survey data or responses. Your data stays on your servers.

**Offline mode:** Grace period of 30 days if your server can't reach our license server.

**Questions?** Email licensing@pulsegen.com

---

## Updates & Changelog

Subscribe to updates:
- Email: updates@pulsegen.com
- RSS: https://pulsegen.com/changelog.xml
- Slack: #updates channel

**Update frequency:**
- Security patches: Immediate
- Bug fixes: Weekly
- New features: Monthly
- Major versions: Quarterly

**Automatic updates:** Available for Enterprise customers (contact support)

---

## Resource Links

- **Documentation**: https://docs.pulsegen.com
- **API Reference**: https://api-docs.pulsegen.com
- **Video Tutorials**: https://learn.pulsegen.com
- **Community Forum**: https://community.pulsegen.com
- **Status Page**: https://status.pulsegen.com
- **Feature Requests**: https://feedback.pulsegen.com

---

## Thank You!

Thank you for choosing PulseGen Enterprise. We're here to ensure your success!

**Have questions?** Don't hesitate to reach out:
- Email: support@pulsegen.com
- Schedule call: https://calendly.com/pulsegen-support
- Live chat: https://pulsegen.com/chat (Professional+ customers)

**Share feedback:** We love hearing from customers! Email feedback@pulsegen.com

Welcome to the PulseGen family!

---

**Document version**: 1.0
**Last updated**: January 2025
**License required**: Enterprise or Professional
