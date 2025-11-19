#!/bin/bash

# PulseGen Quick Setup Script
# Simple bash script for quick local development setup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════╗"
echo "║                                       ║"
echo "║     PulseGen Quick Setup Script       ║"
echo "║                                       ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo -e "${RED}✗ Error: Please run this script from the PulseGen root directory${NC}"
    exit 1
fi

# Generate random secrets
generate_secret() {
    openssl rand -hex 32
}

echo -e "${BLUE}→ Generating security secrets...${NC}"
POSTGRES_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(generate_secret)
JWT_REFRESH_SECRET=$(generate_secret)
ENCRYPTION_KEY=$(generate_secret)

# Create backend .env
echo -e "${BLUE}→ Creating backend/.env file...${NC}"
cat > backend/.env << EOF
# Database
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/pulsegen
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Redis (Optional - comment out if not using Redis)
# REDIS_URL=redis://localhost:6379
USE_CACHE=false

# JWT Secrets
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# Encryption Key
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Optional: Default System AI Keys
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@pulsegen.com

# Application URLs
APP_URL=http://localhost:3000
VITE_API_URL=http://localhost:5000
CORS_ORIGIN=http://localhost:3000

# Admin User (Created on first run)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# Node Environment
NODE_ENV=development
PORT=5000
EOF

echo -e "${GREEN}✓ Created backend/.env${NC}"

# Create frontend .env
echo -e "${BLUE}→ Creating frontend/.env file...${NC}"
cat > frontend/.env << EOF
VITE_API_URL=http://localhost:5000
EOF

echo -e "${GREEN}✓ Created frontend/.env${NC}"

# Create automation-tool .env
if [ -d "automation-tool" ]; then
    echo -e "${BLUE}→ Creating automation-tool/.env file...${NC}"
    cat > automation-tool/.env << EOF
VITE_API_URL=http://localhost:5000
EOF
    echo -e "${GREEN}✓ Created automation-tool/.env${NC}"
fi

# Copy to root for docker-compose
cp backend/.env .env
echo -e "${GREEN}✓ Created .env${NC}"

# Install dependencies
echo -e "${BLUE}→ Installing backend dependencies...${NC}"
cd backend && npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Generate Prisma client
echo -e "${BLUE}→ Generating Prisma client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"

cd ..

# Install frontend dependencies
echo -e "${BLUE}→ Installing frontend dependencies...${NC}"
cd frontend && npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

cd ..

# Install automation tool dependencies
if [ -d "automation-tool" ]; then
    echo -e "${BLUE}→ Installing automation tool dependencies...${NC}"
    cd automation-tool && npm install
    echo -e "${GREEN}✓ Automation tool dependencies installed${NC}"
    cd ..
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗"
echo "║                                       ║"
echo "║    Setup Completed Successfully! 🎉   ║"
echo "║                                       ║"
echo "╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo ""
echo "1. Start PostgreSQL (if not running):"
echo -e "   ${YELLOW}brew services start postgresql${NC}  (macOS)"
echo -e "   ${YELLOW}sudo systemctl start postgresql${NC}  (Linux)"
echo ""
echo "2. Create the database:"
echo -e "   ${YELLOW}createdb pulsegen${NC}"
echo ""
echo "3. Run database migrations:"
echo -e "   ${YELLOW}cd backend && npx prisma migrate dev --name init${NC}"
echo ""
echo "4. Seed the database:"
echo -e "   ${YELLOW}cd backend && npm run prisma:seed${NC}"
echo ""
echo "5. Start the backend (in one terminal):"
echo -e "   ${YELLOW}cd backend && npm run dev${NC}"
echo ""
echo "6. Start the frontend (in another terminal):"
echo -e "   ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo "7. (Optional) Start the automation tool (in another terminal):"
echo -e "   ${YELLOW}cd automation-tool && npm run dev${NC}"
echo ""
echo -e "${CYAN}Access Points:${NC}"
echo -e "   Frontend:        ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend API:     ${GREEN}http://localhost:5000${NC}"
echo -e "   Automation Tool: ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${CYAN}Admin Credentials:${NC}"
echo -e "   Email:    ${GREEN}admin@example.com${NC}"
echo -e "   Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${YELLOW}⚠️  Remember to change the admin password after first login!${NC}"
echo ""
echo -e "${CYAN}Optional - Enable Redis for caching:${NC}"
echo "   1. Install Redis: brew install redis (macOS) or apt install redis (Ubuntu)"
echo "   2. Start Redis: redis-server"
echo "   3. Uncomment REDIS_URL in backend/.env"
echo "   4. Set USE_CACHE=true in backend/.env"
echo ""
