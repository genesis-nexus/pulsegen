#!/bin/bash

###############################################################################
# PulseGen License System Setup Script
#
# This script sets up the license system for PulseGen
# Run this once during initial setup
#
# Usage: ./setup-license-system.sh
###############################################################################

set -e  # Exit on error

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║          PulseGen License System Setup                      ║"
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

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

print_header

print_step "Checking prerequisites"

# Check if openssl is installed
if ! command -v openssl &> /dev/null; then
    print_error "OpenSSL is not installed"
    echo "Please install OpenSSL:"
    echo "  Ubuntu/Debian: sudo apt-get install openssl"
    echo "  macOS: brew install openssl"
    exit 1
fi
print_success "OpenSSL found"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
print_success "Node.js found: $(node --version)"

print_step "Setting up directories"

# Create keys directory
KEYS_DIR="$ROOT_DIR/keys"
mkdir -p "$KEYS_DIR"
print_success "Created keys directory: $KEYS_DIR"

# Create licenses directory
LICENSES_DIR="$ROOT_DIR/licenses"
mkdir -p "$LICENSES_DIR"
print_success "Created licenses directory: $LICENSES_DIR"

# Check if keys already exist
if [ -f "$KEYS_DIR/private.pem" ] && [ -f "$KEYS_DIR/public.pem" ]; then
    print_warning "RSA keys already exist"
    read -p "Do you want to regenerate them? This will invalidate all existing licenses! (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Using existing keys"
        SKIP_KEY_GEN=true
    else
        SKIP_KEY_GEN=false
    fi
else
    SKIP_KEY_GEN=false
fi

if [ "$SKIP_KEY_GEN" = false ]; then
    print_step "Generating RSA-2048 key pair"

    # Generate private key
    print_info "Generating private key..."
    openssl genrsa -out "$KEYS_DIR/private.pem" 2048 2>/dev/null
    print_success "Private key generated: $KEYS_DIR/private.pem"

    # Generate public key
    print_info "Generating public key..."
    openssl rsa -in "$KEYS_DIR/private.pem" -pubout -out "$KEYS_DIR/public.pem" 2>/dev/null
    print_success "Public key generated: $KEYS_DIR/public.pem"

    # Set permissions
    chmod 600 "$KEYS_DIR/private.pem"
    chmod 644 "$KEYS_DIR/public.pem"
    print_success "File permissions set"
fi

print_step "Updating .gitignore"

# Add to .gitignore
GITIGNORE="$ROOT_DIR/.gitignore"
if ! grep -q "keys/private.pem" "$GITIGNORE" 2>/dev/null; then
    echo -e "\n# License system - DO NOT COMMIT" >> "$GITIGNORE"
    echo "keys/private.pem" >> "$GITIGNORE"
    echo "licenses/" >> "$GITIGNORE"
    print_success "Added keys to .gitignore"
else
    print_info ".gitignore already configured"
fi

print_step "Displaying public key"

echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}IMPORTANT: Copy this public key to your application${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
echo ""
cat "$KEYS_DIR/public.pem"
echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
echo ""

print_warning "You must update the PUBLIC_KEY in:"
echo "   backend/src/utils/license.ts (line ~28)"
echo ""
echo "Replace the PUBLIC_KEY constant with the above key"
echo ""

read -p "Press Enter when you have updated the public key in the code..."

print_step "Installing dependencies"

# Install ts-node globally if not present
if ! command -v ts-node &> /dev/null; then
    print_info "Installing ts-node..."
    cd "$ROOT_DIR"
    npm install -g ts-node typescript
    print_success "ts-node installed"
else
    print_success "ts-node already installed"
fi

# Install commander in backend (for license generation script)
print_info "Installing backend dependencies..."
cd "$ROOT_DIR/backend"
npm install commander
print_success "Backend dependencies installed"

print_step "Testing license generation"

# Test generating a license
print_info "Generating test license..."
cd "$ROOT_DIR"

TEST_LICENSE=$(ts-node scripts/generate-license.ts \
    --email test@example.com \
    --company "Test Company" \
    --tier professional \
    --duration 365 2>&1)

if [ $? -eq 0 ]; then
    print_success "License generation test successful"
else
    print_error "License generation test failed"
    echo "$TEST_LICENSE"
    exit 1
fi

print_step "Setup complete!"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║              License System Setup Complete!                  ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

print_success "RSA keys generated and stored securely"
print_success "Directories created and configured"
print_success "Dependencies installed"
print_success "License generation tested"

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. ✅ Update public key in backend/src/utils/license.ts (if not done)"
echo "  2. Run database migration: cd backend && npx prisma migrate dev --name add_license_system"
echo "  3. Generate license for customer: ts-node scripts/generate-license.ts --email customer@example.com --company \"Company\" --tier professional --duration 365"
echo "  4. Send license key to customer"
echo "  5. Customer activates at /settings/license"
echo ""

print_warning "IMPORTANT: Keep keys/private.pem SECURE! Back it up safely."
print_info "See LICENSE_IMPLEMENTATION.md for complete documentation"

echo ""
