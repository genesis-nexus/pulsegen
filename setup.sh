#!/bin/bash

# PulseGen Setup Script
# This script helps you set up PulseGen quickly with Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Generate random string
generate_secret() {
    if command_exists openssl; then
        openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
    else
        # Fallback if openssl is not available
        cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1
    fi
}

# Generate hex string
generate_hex() {
    if command_exists openssl; then
        openssl rand -hex 32
    else
        # Fallback if openssl is not available
        cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 64 | head -n 1
    fi
}

# Banner
clear
echo -e "${BLUE}"
cat << "EOF"
  ____        _           ____
 |  _ \ _   _| |___  ___ / ___| ___ _ __
 | |_) | | | | / __|/ _ \ |  _ / _ \ '_ \
 |  __/| |_| | \__ \  __/ |_| |  __/ | | |
 |_|    \__,_|_|___/\___|\____|\___|_| |_|

         Setup & Installation
EOF
echo -e "${NC}\n"

print_info "This script will help you set up PulseGen on your system."
echo ""

# Check prerequisites
print_header "Checking Prerequisites"

MISSING_DEPS=0

if command_exists docker; then
    DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
    print_success "Docker found (version $DOCKER_VERSION)"
else
    print_error "Docker is not installed"
    MISSING_DEPS=1
fi

if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    if command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d ' ' -f4 | cut -d ',' -f1)
    else
        COMPOSE_VERSION=$(docker compose version --short)
    fi
    print_success "Docker Compose found (version $COMPOSE_VERSION)"

    # Determine which command to use
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
else
    print_error "Docker Compose is not installed"
    MISSING_DEPS=1
fi

if command_exists git; then
    GIT_VERSION=$(git --version | cut -d ' ' -f3)
    print_success "Git found (version $GIT_VERSION)"
else
    print_warning "Git is not installed (optional)"
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo ""
    print_error "Missing required dependencies. Please install them first:"
    echo ""
    echo "  Docker: https://docs.docker.com/get-docker/"
    echo "  Docker Compose: https://docs.docker.com/compose/install/"
    echo ""
    exit 1
fi

# Check if .env already exists
if [ -f .env ]; then
    echo ""
    print_warning "An .env file already exists."
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Keeping existing .env file. Skipping configuration."
        SKIP_ENV_CREATION=1
    fi
fi

# Create .env file
if [ -z "$SKIP_ENV_CREATION" ]; then
    print_header "Configuring Environment"

    print_info "Generating secure random secrets..."

    POSTGRES_PASSWORD=$(generate_secret)
    JWT_SECRET=$(generate_secret)
    JWT_REFRESH_SECRET=$(generate_secret)
    ENCRYPTION_KEY=$(generate_hex)

    print_success "Secrets generated"

    # Ask for configuration
    echo ""
    print_info "Please provide the following information (or press Enter for defaults):"
    echo ""

    read -p "Domain name (e.g., surveys.example.com) [localhost]: " DOMAIN_NAME
    DOMAIN_NAME=${DOMAIN_NAME:-localhost}

    read -p "HTTP Port (for Nginx) [80]: " HTTP_PORT
    HTTP_PORT=${HTTP_PORT:-80}

    read -p "HTTPS Port (for Nginx) [443]: " HTTPS_PORT
    HTTPS_PORT=${HTTPS_PORT:-443}

    read -p "Frontend Port [3001]: " FRONTEND_PORT
    FRONTEND_PORT=${FRONTEND_PORT:-3001}

    read -p "Backend Port [5001]: " BACKEND_PORT
    BACKEND_PORT=${BACKEND_PORT:-5001}

    # Set default URLs based on domain
    if [ "$DOMAIN_NAME" != "localhost" ]; then
        if [ "$HTTP_PORT" == "80" ]; then
            DEFAULT_APP_URL="http://$DOMAIN_NAME"
        else
            DEFAULT_APP_URL="http://$DOMAIN_NAME:$HTTP_PORT"
        fi
        DEFAULT_API_URL="$DEFAULT_APP_URL/api"
    else
        DEFAULT_APP_URL="http://localhost:$FRONTEND_PORT"
        DEFAULT_API_URL="http://localhost:$BACKEND_PORT"
    fi

    read -p "Application URL [$DEFAULT_APP_URL]: " APP_URL
    APP_URL=${APP_URL:-$DEFAULT_APP_URL}

    read -p "API URL [$DEFAULT_API_URL]: " API_URL
    API_URL=${API_URL:-$DEFAULT_API_URL}

    read -p "Admin Email [admin@example.com]: " ADMIN_EMAIL
    ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}

    read -s -p "Admin Password [admin123]: " ADMIN_PASSWORD
    echo ""
    ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}

    echo ""
    read -p "Do you want to configure email settings? (y/N): " -n 1 -r CONFIGURE_EMAIL
    echo ""

    if [[ $CONFIGURE_EMAIL =~ ^[Yy]$ ]]; then
        read -p "SMTP Host: " SMTP_HOST
        read -p "SMTP Port [587]: " SMTP_PORT
        SMTP_PORT=${SMTP_PORT:-587}
        read -p "SMTP User: " SMTP_USER
        read -s -p "SMTP Password: " SMTP_PASS
        echo ""
        read -p "Email From Address: " EMAIL_FROM
    fi

    # Create .env file
    print_info "Creating .env file..."

    cat > .env << EOF
# ==============================================
# PulseGen Environment Configuration
# ==============================================
# Generated by setup script on $(date)

# ----------------------------------------------
# Database Configuration
# ----------------------------------------------
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# ----------------------------------------------
# Backend Configuration
# ----------------------------------------------
# JWT Secrets
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Encryption Key
ENCRYPTION_KEY=$ENCRYPTION_KEY

# ----------------------------------------------
# Domain & Port Configuration
# ----------------------------------------------
DOMAIN_NAME=$DOMAIN_NAME
HTTP_PORT=$HTTP_PORT
HTTPS_PORT=$HTTPS_PORT
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT

# ----------------------------------------------
# Application URLs
# ----------------------------------------------
APP_URL=$APP_URL
CORS_ORIGIN=$APP_URL
VITE_API_URL=$API_URL

# ----------------------------------------------
# Admin User
# ----------------------------------------------
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

EOF

    if [[ $CONFIGURE_EMAIL =~ ^[Yy]$ ]]; then
        cat >> .env << EOF
# ----------------------------------------------
# Email Configuration
# ----------------------------------------------
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
EMAIL_FROM=$EMAIL_FROM

EOF
    else
        cat >> .env << EOF
# ----------------------------------------------
# Email Configuration (Optional - Not Configured)
# ----------------------------------------------
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# EMAIL_FROM=noreply@pulsegen.com

EOF
    fi

    cat >> .env << EOF
# ----------------------------------------------
# AI Provider API Keys (Optional)
# ----------------------------------------------
# These can also be configured per-user in the UI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=
EOF

    print_success ".env file created"

    # Generate nginx.conf with the domain name
    print_info "Generating nginx.conf..."

    cat > nginx.conf << 'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

    # Upstream servers
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:80;
    }

NGINX_EOF

    # Add server block with configured domain
    cat >> nginx.conf << NGINX_SERVER
    server {
        listen 80;
        server_name $DOMAIN_NAME;

        # Increase client body size for file uploads
        client_max_body_size 10M;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # API requests
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;

            # Timeouts for long-running requests
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # File uploads
        location /uploads/ {
            proxy_pass http://backend/uploads/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Frontend application
        location / {
            limit_req zone=general_limit burst=50 nodelay;

            proxy_pass http://frontend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
NGINX_SERVER

    print_success "nginx.conf generated for domain: $DOMAIN_NAME"
fi

# Choose deployment mode
print_header "Deployment Mode"

echo "Choose your deployment mode:"
echo "  1) Production (recommended for production use)"
echo "  2) Development (for local development with hot-reload)"
echo "  3) Production with Redis (improved performance)"
echo ""
read -p "Enter your choice [1]: " DEPLOY_MODE
DEPLOY_MODE=${DEPLOY_MODE:-1}

case $DEPLOY_MODE in
    1)
        COMPOSE_PROFILE="--profile production"
        MODE_NAME="Production"
        ;;
    2)
        COMPOSE_FILE="-f docker-compose.dev.yml"
        COMPOSE_PROFILE=""
        MODE_NAME="Development"
        ;;
    3)
        COMPOSE_PROFILE="--profile production --profile with-redis"
        MODE_NAME="Production with Redis"
        ;;
    *)
        print_error "Invalid choice. Defaulting to Production mode."
        COMPOSE_PROFILE="--profile production"
        MODE_NAME="Production"
        ;;
esac

# Start services
print_header "Starting PulseGen ($MODE_NAME)"

print_info "This may take a few minutes on first run..."
echo ""

# Pull images first
print_info "Pulling Docker images..."
if ! $DOCKER_COMPOSE_CMD $COMPOSE_FILE pull 2>/dev/null; then
    print_warning "Pull failed or not needed, continuing with build..."
fi

# Build and start
print_info "Building and starting services..."
if $DOCKER_COMPOSE_CMD $COMPOSE_FILE $COMPOSE_PROFILE up -d --build; then
    print_success "Services started successfully!"
else
    print_error "Failed to start services. Check the logs above for errors."
    exit 1
fi

# Wait for services to be healthy
print_header "Waiting for Services"

print_info "Waiting for database to be ready..."
sleep 5

# Check if services are running
BACKEND_RUNNING=$($DOCKER_COMPOSE_CMD $COMPOSE_FILE ps -q backend 2>/dev/null)
FRONTEND_RUNNING=$($DOCKER_COMPOSE_CMD $COMPOSE_FILE ps -q frontend 2>/dev/null)

if [ -n "$BACKEND_RUNNING" ]; then
    print_success "Backend is running"
else
    print_error "Backend failed to start"
fi

if [ -n "$FRONTEND_RUNNING" ]; then
    print_success "Frontend is running"
else
    print_error "Frontend failed to start"
fi

# SSL Setup with Let's Encrypt
if [ -z "$DOMAIN_NAME" ]; then
    DOMAIN_NAME=$(grep "^DOMAIN_NAME=" .env 2>/dev/null | cut -d'=' -f2)
    DOMAIN_NAME=${DOMAIN_NAME:-localhost}
fi

if [ "$DOMAIN_NAME" != "localhost" ] && [ "$DEPLOY_MODE" != "2" ]; then
    echo ""
    read -p "Do you want to set up SSL with Let's Encrypt for $DOMAIN_NAME? (y/N): " -n 1 -r SETUP_SSL
    echo ""

    if [[ $SETUP_SSL =~ ^[Yy]$ ]]; then
        print_header "Setting up SSL Certificate"

        # Check if certbot is installed
        if ! command_exists certbot; then
            print_info "Installing Certbot..."
            if command_exists apt-get; then
                sudo apt-get update && sudo apt-get install -y certbot
            elif command_exists yum; then
                sudo yum install -y certbot
            elif command_exists dnf; then
                sudo dnf install -y certbot
            elif command_exists snap; then
                sudo snap install --classic certbot
                sudo ln -sf /snap/bin/certbot /usr/bin/certbot
            else
                print_error "Could not install Certbot. Please install it manually."
                SETUP_SSL="n"
            fi
        fi

        if [[ $SETUP_SSL =~ ^[Yy]$ ]] && command_exists certbot; then
            print_info "Stopping Nginx temporarily for certificate generation..."
            $DOCKER_COMPOSE_CMD $COMPOSE_FILE stop nginx 2>/dev/null || true

            print_info "Requesting SSL certificate for $DOMAIN_NAME..."
            read -p "Enter email for Let's Encrypt notifications: " SSL_EMAIL

            if sudo certbot certonly --standalone -d "$DOMAIN_NAME" --non-interactive --agree-tos --email "$SSL_EMAIL"; then
                print_success "SSL certificate obtained!"

                # Create ssl directory and copy certificates
                mkdir -p ssl
                sudo cp "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" ssl/
                sudo cp "/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem" ssl/
                sudo chown -R $USER:$USER ssl/
                chmod 600 ssl/*.pem

                print_info "Updating nginx.conf for HTTPS..."

                # Generate new nginx.conf with SSL
                cat > nginx.conf << 'NGINX_SSL_EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

    # Upstream servers
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:80;
    }

NGINX_SSL_EOF

                # Add HTTP to HTTPS redirect
                cat >> nginx.conf << NGINX_REDIRECT
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name $DOMAIN_NAME;
        return 301 https://\$server_name\$request_uri;
    }

NGINX_REDIRECT

                # Add HTTPS server block
                cat >> nginx.conf << NGINX_HTTPS
    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name $DOMAIN_NAME;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # HSTS
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Increase client body size for file uploads
        client_max_body_size 10M;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # API requests
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;

            # Timeouts for long-running requests
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # File uploads
        location /uploads/ {
            proxy_pass http://backend/uploads/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Frontend application
        location / {
            limit_req zone=general_limit burst=50 nodelay;

            proxy_pass http://frontend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
NGINX_HTTPS

                print_success "nginx.conf updated with SSL configuration"

                # Update .env with HTTPS URLs
                sed -i.bak "s|APP_URL=http://$DOMAIN_NAME|APP_URL=https://$DOMAIN_NAME|g" .env
                sed -i.bak "s|CORS_ORIGIN=http://$DOMAIN_NAME|CORS_ORIGIN=https://$DOMAIN_NAME|g" .env
                sed -i.bak "s|VITE_API_URL=http://$DOMAIN_NAME|VITE_API_URL=https://$DOMAIN_NAME|g" .env
                rm -f .env.bak

                # Restart nginx with new config
                print_info "Restarting Nginx with SSL..."
                $DOCKER_COMPOSE_CMD $COMPOSE_FILE up -d nginx

                print_success "SSL setup complete!"
                SSL_ENABLED=true

                # Setup auto-renewal cron job
                print_info "Setting up automatic certificate renewal..."
                CRON_CMD="0 3 * * * certbot renew --quiet --post-hook 'docker restart pulsegen_nginx'"
                (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_CMD") | crontab -
                print_success "Auto-renewal configured (runs daily at 3 AM)"

            else
                print_error "Failed to obtain SSL certificate. Check that:"
                echo "  1. DNS is correctly pointing $DOMAIN_NAME to this server"
                echo "  2. Ports 80 and 443 are open in your firewall"
                echo "  3. No other service is using port 80"

                # Restart nginx without SSL
                $DOCKER_COMPOSE_CMD $COMPOSE_FILE up -d nginx
            fi
        fi
    fi
fi

# Success message
print_header "Setup Complete!"

echo -e "${GREEN}PulseGen is now running!${NC}\n"

# Load config from .env if not set
if [ -z "$DOMAIN_NAME" ]; then
    DOMAIN_NAME=$(grep "^DOMAIN_NAME=" .env 2>/dev/null | cut -d'=' -f2)
    DOMAIN_NAME=${DOMAIN_NAME:-localhost}
fi
if [ -z "$FRONTEND_PORT" ]; then
    FRONTEND_PORT=$(grep "^FRONTEND_PORT=" .env 2>/dev/null | cut -d'=' -f2)
    FRONTEND_PORT=${FRONTEND_PORT:-3001}
fi
if [ -z "$BACKEND_PORT" ]; then
    BACKEND_PORT=$(grep "^BACKEND_PORT=" .env 2>/dev/null | cut -d'=' -f2)
    BACKEND_PORT=${BACKEND_PORT:-5001}
fi
if [ -z "$HTTP_PORT" ]; then
    HTTP_PORT=$(grep "^HTTP_PORT=" .env 2>/dev/null | cut -d'=' -f2)
    HTTP_PORT=${HTTP_PORT:-80}
fi
if [ -z "$APP_URL" ]; then
    APP_URL=$(grep "^APP_URL=" .env 2>/dev/null | cut -d'=' -f2)
fi

if [ "$DEPLOY_MODE" == "2" ]; then
    echo "Access your application at:"
    echo -e "  ${BLUE}Frontend:${NC} http://localhost:3000"
    echo -e "  ${BLUE}Backend API:${NC} http://localhost:5000"
else
    echo "Access your application at:"
    if [ "$DOMAIN_NAME" != "localhost" ]; then
        if [ "$SSL_ENABLED" == "true" ]; then
            echo -e "  ${BLUE}Via Domain:${NC} ${GREEN}https://$DOMAIN_NAME${NC} (SSL enabled)"
        elif [ "$HTTP_PORT" == "80" ]; then
            echo -e "  ${BLUE}Via Domain:${NC} http://$DOMAIN_NAME"
        else
            echo -e "  ${BLUE}Via Domain:${NC} http://$DOMAIN_NAME:$HTTP_PORT"
        fi
        echo ""
        if [ "$SSL_ENABLED" != "true" ]; then
            print_info "Make sure your DNS is configured to point $DOMAIN_NAME to this server's IP"
            print_info "Run this script again to set up SSL after DNS is configured"
        fi
    else
        echo -e "  ${BLUE}Application:${NC} $APP_URL"
    fi
    echo -e "  ${BLUE}Direct Frontend:${NC} http://localhost:$FRONTEND_PORT"
    echo -e "  ${BLUE}Direct Backend:${NC} http://localhost:$BACKEND_PORT"
    if [ "$HTTP_PORT" != "80" ]; then
        echo -e "  ${BLUE}Via Nginx:${NC} http://localhost:$HTTP_PORT"
    fi
fi

echo ""
echo "Default admin credentials:"
echo -e "  ${BLUE}Email:${NC} $ADMIN_EMAIL"
echo -e "  ${BLUE}Password:${NC} $ADMIN_PASSWORD"
echo ""
print_warning "Please change the admin password after first login!"

echo ""
echo "Useful commands:"
echo -e "  ${BLUE}View logs:${NC} $DOCKER_COMPOSE_CMD $COMPOSE_FILE logs -f"
echo -e "  ${BLUE}Stop services:${NC} $DOCKER_COMPOSE_CMD $COMPOSE_FILE down"
echo -e "  ${BLUE}Restart services:${NC} $DOCKER_COMPOSE_CMD $COMPOSE_FILE restart"
echo -e "  ${BLUE}View status:${NC} $DOCKER_COMPOSE_CMD $COMPOSE_FILE ps"

echo ""
print_info "For more information, see the documentation:"
echo "  https://github.com/genesis-nexus/pulsegen/docs"

echo ""
