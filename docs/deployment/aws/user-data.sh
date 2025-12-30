#!/bin/bash
# User data script for EC2 instance
# This script sets up Docker and deploys PulseGen

set -e

# Update system
yum update -y

# Install Docker
yum install docker -y
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
yum install git -y

# Clone repository
cd /home/ec2-user
git clone https://github.com/genesis-nexus/pulsegen.git
cd pulsegen

# Create .env file
cat > .env <<EOF
# Database
POSTGRES_PASSWORD=${db_password}
DATABASE_URL=postgresql://postgres:${db_password}@${db_endpoint}/pulsegen

# Redis
REDIS_URL=redis://${redis_endpoint}:6379

# JWT Secrets
JWT_SECRET=${jwt_secret}
JWT_REFRESH_SECRET=${jwt_secret}_refresh
ENCRYPTION_KEY=${encryption_key}

# Application URLs
APP_URL=https://${domain_name}
CORS_ORIGIN=https://${domain_name}
VITE_API_URL=https://${domain_name}/api

# Environment
NODE_ENV=production

# Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me_immediately
EOF

# Update docker-compose.yml to use external database
# Remove postgres and redis services since we're using RDS and ElastiCache

# Start application
docker-compose --profile production up -d

# Set up log rotation
cat > /etc/logrotate.d/pulsegen <<EOF
/home/ec2-user/pulsegen/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ec2-user ec2-user
}
EOF

echo "PulseGen installation complete!"
