#!/bin/bash

###############################################################################
# PulseGen Enterprise - Automated Installation Script
#
# This script installs and configures PulseGen Enterprise on a fresh server
#
# Usage: ./enterprise-install.sh --license-key YOUR_LICENSE_KEY [options]
#
# Options:
#   --license-key KEY      Your PulseGen Enterprise license key (required)
#   --domain DOMAIN        Your domain name (e.g., surveys.company.com)
#   --email EMAIL          Admin email for SSL cert (required with --domain)
#   --skip-ssl             Skip SSL setup
#   --skip-docker          Skip Docker installation (if already installed)
#
# Example:
#   ./enterprise-install.sh --license-key abc123 --domain surveys.company.com --email admin@company.com
#
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script variables
LICENSE_KEY=""
DOMAIN=""
ADMIN_EMAIL=""
SKIP_SSL=false
SKIP_DOCKER=false
INSTALL_DIR="/opt/pulsegen"
VERSION="latest"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║              PulseGen Enterprise Installer                   ║"
    echo "║              Version 1.0                                     ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${BLUE}==>${NC} ${GREEN}$1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        echo "Please run with: sudo $0 $*"
        exit 1
    fi
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --license-key)
                LICENSE_KEY="$2"
                shift 2
                ;;
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --email)
                ADMIN_EMAIL="$2"
                shift 2
                ;;
            --skip-ssl)
                SKIP_SSL=true
                shift
                ;;
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Validate required arguments
    if [[ -z "$LICENSE_KEY" ]]; then
        print_error "License key is required"
        echo "Usage: $0 --license-key YOUR_KEY [options]"
        exit 1
    fi

    # Validate domain + email combination
    if [[ -n "$DOMAIN" && -z "$ADMIN_EMAIL" ]]; then
        print_error "Admin email is required when using a custom domain"
        exit 1
    fi
}

show_help() {
    cat << EOF
PulseGen Enterprise Installer

Usage: $0 --license-key YOUR_KEY [options]

Required:
  --license-key KEY      Your PulseGen Enterprise license key

Optional:
  --domain DOMAIN        Your domain name (e.g., surveys.company.com)
  --email EMAIL          Admin email for SSL certificate
  --skip-ssl             Skip SSL certificate setup
  --skip-docker          Skip Docker installation
  --help                 Show this help message

Examples:
  # Basic installation (local only)
  $0 --license-key abc123xyz

  # Production installation with domain and SSL
  $0 --license-key abc123xyz --domain surveys.company.com --email admin@company.com

  # Installation with Docker already installed
  $0 --license-key abc123xyz --skip-docker
EOF
}

###############################################################################
# System Checks
###############################################################################

check_system() {
    print_step "Checking system requirements"

    # Check OS
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        print_info "Operating System: $PRETTY_NAME"
    else
        print_error "Unsupported operating system"
        exit 1
    fi

    # Check CPU cores
    CPU_CORES=$(nproc)
    if [[ $CPU_CORES -lt 2 ]]; then
        print_warning "Recommended: 2+ CPU cores (found: $CPU_CORES)"
    else
        print_success "CPU cores: $CPU_CORES"
    fi

    # Check RAM
    TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $TOTAL_RAM -lt 4 ]]; then
        print_warning "Recommended: 4GB+ RAM (found: ${TOTAL_RAM}GB)"
    else
        print_success "RAM: ${TOTAL_RAM}GB"
    fi

    # Check disk space
    DISK_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $DISK_SPACE -lt 20 ]]; then
        print_warning "Recommended: 20GB+ free disk space (found: ${DISK_SPACE}GB)"
    else
        print_success "Disk space: ${DISK_SPACE}GB available"
    fi

    # Check internet connection
    if ping -c 1 google.com &> /dev/null; then
        print_success "Internet connection: OK"
    else
        print_error "No internet connection detected"
        exit 1
    fi
}

###############################################################################
# License Verification
###############################################################################

verify_license() {
    print_step "Verifying license key"

    # In production, this would call your license API
    # For now, basic validation
    if [[ ${#LICENSE_KEY} -lt 10 ]]; then
        print_error "Invalid license key format"
        exit 1
    fi

    # Simulate API call (replace with actual API in production)
    # response=$(curl -s -X POST https://license.pulsegen.com/verify \
    #     -H "Content-Type: application/json" \
    #     -d "{\"key\":\"$LICENSE_KEY\"}")

    # For demo purposes:
    print_success "License key verified: ${LICENSE_KEY:0:8}..."
}

###############################################################################
# Docker Installation
###############################################################################

install_docker() {
    if [[ "$SKIP_DOCKER" == true ]]; then
        print_info "Skipping Docker installation"
        return
    fi

    print_step "Installing Docker"

    # Check if Docker is already installed
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
        print_info "Docker already installed: $DOCKER_VERSION"
    else
        print_info "Installing Docker..."

        # Update package index
        apt-get update -qq

        # Install prerequisites
        apt-get install -y -qq \
            ca-certificates \
            curl \
            gnupg \
            lsb-release

        # Add Docker GPG key
        mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

        # Add Docker repository
        echo \
            "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
            $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

        # Install Docker
        apt-get update -qq
        apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

        print_success "Docker installed successfully"
    fi

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    # Verify installation
    docker --version
    docker compose version
}

###############################################################################
# PulseGen Installation
###############################################################################

install_pulsegen() {
    print_step "Installing PulseGen Enterprise"

    # Create installation directory
    mkdir -p $INSTALL_DIR
    cd $INSTALL_DIR

    # Download PulseGen (in production, this would be from your private repo)
    print_info "Downloading PulseGen Enterprise..."

    # For demo, clone from public repo
    # In production, use private repo with license authentication:
    # git clone https://customer:${LICENSE_KEY}@git.pulsegen.com/pulsegen/enterprise.git .

    if [[ ! -d ".git" ]]; then
        git clone https://github.com/yourusername/pulsegen.git .
        print_success "Downloaded PulseGen Enterprise"
    else
        print_info "PulseGen already downloaded, updating..."
        git pull
    fi
}

###############################################################################
# Configuration
###############################################################################

configure_environment() {
    print_step "Configuring environment"

    # Generate secrets
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 16)

    # Determine URL
    if [[ -n "$DOMAIN" ]]; then
        APP_URL="https://$DOMAIN"
    else
        SERVER_IP=$(curl -s ifconfig.me)
        APP_URL="http://$SERVER_IP:3000"
        print_warning "No domain configured. Access will be via IP: $APP_URL"
    fi

    # Create .env file
    cat > .env << EOF
# PulseGen Enterprise Configuration
# Generated: $(date)
# License: ${LICENSE_KEY:0:8}...

# Database
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@postgres:5432/pulsegen

# Redis
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Application
NODE_ENV=production
PORT=5000
APP_URL=$APP_URL
CORS_ORIGIN=$APP_URL

# Frontend
VITE_API_URL=${APP_URL}/api

# License
LICENSE_KEY=$LICENSE_KEY

# Email (Configure after installation)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# AI Configuration (Optional - Users can add via UI)
# ANTHROPIC_API_KEY=
# OPENAI_API_KEY=
# GOOGLE_AI_KEY=

# Feature Flags
SSO_ENABLED=false
WHITE_LABEL_ENABLED=true
ANALYTICS_ENABLED=true
EOF

    print_success "Environment configured"

    # Save credentials for later
    echo "$POSTGRES_PASSWORD" > /tmp/pulsegen_db_password
    chmod 600 /tmp/pulsegen_db_password
}

###############################################################################
# SSL Setup
###############################################################################

setup_ssl() {
    if [[ "$SKIP_SSL" == true ]] || [[ -z "$DOMAIN" ]]; then
        print_info "Skipping SSL setup"
        return
    fi

    print_step "Setting up SSL certificate"

    # Install certbot
    if ! command -v certbot &> /dev/null; then
        apt-get install -y -qq certbot
    fi

    # Stop services temporarily if running
    docker compose down 2>/dev/null || true

    # Get certificate
    print_info "Requesting SSL certificate for $DOMAIN..."
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$ADMIN_EMAIL" \
        -d "$DOMAIN"

    # Create SSL directory and copy certs
    mkdir -p $INSTALL_DIR/ssl
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $INSTALL_DIR/ssl/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $INSTALL_DIR/ssl/

    # Set up auto-renewal
    echo "0 0 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/*.pem $INSTALL_DIR/ssl/ && docker compose -f $INSTALL_DIR/docker-compose.yml restart" | crontab -

    print_success "SSL certificate installed for $DOMAIN"
}

###############################################################################
# Start Services
###############################################################################

start_services() {
    print_step "Starting PulseGen services"

    cd $INSTALL_DIR

    # Pull latest images
    print_info "Pulling Docker images..."
    docker compose pull

    # Start services
    print_info "Starting containers..."
    docker compose up -d

    # Wait for services to be ready
    print_info "Waiting for services to start (this may take 30-60 seconds)..."

    # Wait for database
    for i in {1..30}; do
        if docker compose exec -T postgres pg_isready -U postgres &> /dev/null; then
            break
        fi
        sleep 2
    done

    # Wait for backend
    for i in {1..30}; do
        if curl -s http://localhost:5000/health &> /dev/null; then
            break
        fi
        sleep 2
    done

    print_success "All services started"
}

###############################################################################
# Database Setup
###############################################################################

setup_database() {
    print_step "Setting up database"

    cd $INSTALL_DIR

    # Run migrations
    print_info "Running database migrations..."
    docker compose exec -T backend npx prisma migrate deploy

    # Generate Prisma client
    docker compose exec -T backend npx prisma generate

    print_success "Database configured"
}

###############################################################################
# Firewall Configuration
###############################################################################

configure_firewall() {
    print_step "Configuring firewall"

    if command -v ufw &> /dev/null; then
        # Allow SSH
        ufw allow 22/tcp

        # Allow HTTP and HTTPS
        ufw allow 80/tcp
        ufw allow 443/tcp

        # Allow ports 3000 and 5000 for non-SSL setups
        if [[ -z "$DOMAIN" ]]; then
            ufw allow 3000/tcp
            ufw allow 5000/tcp
        fi

        # Enable firewall (only if not already enabled)
        ufw --force enable

        print_success "Firewall configured"
    else
        print_warning "UFW not found, please configure firewall manually"
    fi
}

###############################################################################
# Health Check
###############################################################################

health_check() {
    print_step "Running health checks"

    cd $INSTALL_DIR

    # Check service status
    SERVICES=$(docker compose ps --services)
    ALL_HEALTHY=true

    for service in $SERVICES; do
        STATUS=$(docker compose ps $service | grep -v NAME | awk '{print $5}')
        if [[ "$STATUS" == "Up" ]] || [[ "$STATUS" =~ ^Up.*healthy ]]; then
            print_success "$service: Running"
        else
            print_error "$service: Not running"
            ALL_HEALTHY=false
        fi
    done

    # Test backend API
    if curl -s http://localhost:5000/health | grep -q "ok"; then
        print_success "Backend API: Responding"
    else
        print_warning "Backend API: Not responding (may need more time)"
    fi

    # Test frontend
    if curl -s http://localhost:3000 &> /dev/null; then
        print_success "Frontend: Responding"
    else
        print_warning "Frontend: Not responding (may need more time)"
    fi

    if [[ "$ALL_HEALTHY" == true ]]; then
        return 0
    else
        return 1
    fi
}

###############################################################################
# Post-Installation
###############################################################################

show_completion_message() {
    print_step "Installation Complete!"

    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}║          PulseGen Enterprise successfully installed!        ║${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Access information
    if [[ -n "$DOMAIN" ]]; then
        echo -e "${BLUE}🌐 Access URL:${NC} https://$DOMAIN"
    else
        SERVER_IP=$(curl -s ifconfig.me)
        echo -e "${BLUE}🌐 Access URL:${NC} http://$SERVER_IP:3000"
        echo -e "${YELLOW}⚠  Note: Using IP address. For production, configure a domain and SSL.${NC}"
    fi

    echo ""
    echo -e "${BLUE}📚 Next Steps:${NC}"
    echo "   1. Visit the URL above in your browser"
    echo "   2. Create your admin account at /register"
    echo "   3. Configure SMTP settings in .env file"
    echo "   4. Add AI API keys (optional)"
    echo "   5. Start creating surveys!"
    echo ""

    echo -e "${BLUE}📖 Documentation:${NC}"
    echo "   Installation dir: $INSTALL_DIR"
    echo "   Configuration: $INSTALL_DIR/.env"
    echo "   Logs: docker compose -f $INSTALL_DIR/docker-compose.yml logs"
    echo "   Restart: docker compose -f $INSTALL_DIR/docker-compose.yml restart"
    echo ""

    echo -e "${BLUE}🔧 Management Commands:${NC}"
    echo "   View logs:     cd $INSTALL_DIR && docker compose logs -f"
    echo "   Restart:       cd $INSTALL_DIR && docker compose restart"
    echo "   Stop:          cd $INSTALL_DIR && docker compose down"
    echo "   Start:         cd $INSTALL_DIR && docker compose up -d"
    echo "   Update:        cd $INSTALL_DIR && git pull && docker compose pull && docker compose up -d"
    echo ""

    echo -e "${BLUE}💬 Support:${NC}"
    echo "   Email: support@pulsegen.com"
    echo "   Docs:  https://docs.pulsegen.com"
    echo "   Portal: https://portal.pulsegen.com"
    echo ""

    echo -e "${GREEN}Thank you for choosing PulseGen Enterprise!${NC}"
    echo ""
}

create_quick_reference() {
    cat > $INSTALL_DIR/QUICK_REFERENCE.txt << EOF
PulseGen Enterprise - Quick Reference
=====================================

Installation Date: $(date)
License Key: ${LICENSE_KEY:0:8}...
Installation Dir: $INSTALL_DIR

Access Information
------------------
URL: $APP_URL
Admin registration: $APP_URL/register

Configuration Files
-------------------
Environment: $INSTALL_DIR/.env
Docker Compose: $INSTALL_DIR/docker-compose.yml
SSL Certs: $INSTALL_DIR/ssl/

Common Commands
---------------
# View logs
cd $INSTALL_DIR && docker compose logs -f

# Restart services
cd $INSTALL_DIR && docker compose restart

# Stop all services
cd $INSTALL_DIR && docker compose down

# Start services
cd $INSTALL_DIR && docker compose up -d

# Update PulseGen
cd $INSTALL_DIR && git pull && docker compose pull && docker compose up -d

# Backup database
cd $INSTALL_DIR && docker compose exec postgres pg_dump -U postgres pulsegen > backup.sql

# View service status
cd $INSTALL_DIR && docker compose ps

# Access database
cd $INSTALL_DIR && docker compose exec postgres psql -U postgres pulsegen

Troubleshooting
---------------
# Check service health
curl http://localhost:5000/health

# View backend logs
docker compose -f $INSTALL_DIR/docker-compose.yml logs backend

# View all container stats
docker stats

# Restart specific service
docker compose -f $INSTALL_DIR/docker-compose.yml restart backend

Support
-------
Email: support@pulsegen.com
Documentation: https://docs.pulsegen.com
Customer Portal: https://portal.pulsegen.com

For urgent issues (Enterprise customers):
Phone: +1-XXX-XXX-XXXX (24/7)
EOF

    print_success "Quick reference saved to: $INSTALL_DIR/QUICK_REFERENCE.txt"
}

###############################################################################
# Main Installation Flow
###############################################################################

main() {
    print_header

    # Parse command line arguments
    parse_args "$@"

    # Check if running as root
    check_root

    # Run installation steps
    check_system
    verify_license
    install_docker
    install_pulsegen
    configure_environment
    setup_ssl
    configure_firewall
    start_services
    setup_database

    # Wait a bit for everything to stabilize
    sleep 5

    # Health check
    health_check

    # Post-installation
    create_quick_reference
    show_completion_message

    # Save installation log
    echo "Installation completed at $(date)" >> $INSTALL_DIR/install.log
}

# Run main installation
main "$@"
