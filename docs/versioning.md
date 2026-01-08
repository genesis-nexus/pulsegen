---
layout: default
title: Versioning & Releases
nav_order: 12
---

# Versioning & Releases

PulseGen follows [Semantic Versioning](https://semver.org/) (SemVer) for all releases.

## Version Format

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes that require migration
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

## Docker Images

PulseGen publishes Docker images to GitHub Container Registry (GHCR):

### Available Images

| Image | Description |
|-------|-------------|
| `ghcr.io/genesis-nexus/pulsegen-backend` | Node.js API server |
| `ghcr.io/genesis-nexus/pulsegen-frontend` | React frontend (Nginx) |

### Image Tags

| Tag | Description | Stability |
|-----|-------------|-----------|
| `latest` | Most recent stable release | Stable |
| `vX.Y.Z` | Specific version (e.g., `v2.1.0`) | Immutable |
| `vX.Y` | Latest patch in minor version | Rolling |
| `vX` | Latest in major version | Rolling |
| `sha-<hash>` | Specific commit build | Development |

### Pulling Images

```bash
# Latest stable
docker pull ghcr.io/genesis-nexus/pulsegen-backend:latest
docker pull ghcr.io/genesis-nexus/pulsegen-frontend:latest

# Specific version (recommended for production)
docker pull ghcr.io/genesis-nexus/pulsegen-backend:v2.1.0
docker pull ghcr.io/genesis-nexus/pulsegen-frontend:v2.1.0

# Latest patch within v2.1
docker pull ghcr.io/genesis-nexus/pulsegen-backend:v2.1
docker pull ghcr.io/genesis-nexus/pulsegen-frontend:v2.1
```

### Version Alignment

Always use the **same version tag** for both frontend and backend:

```yaml
# docker-compose.yml
services:
  backend:
    image: ghcr.io/genesis-nexus/pulsegen-backend:v2.1.0
  frontend:
    image: ghcr.io/genesis-nexus/pulsegen-frontend:v2.1.0
```

### Verifying Image Authenticity

All release images are signed and include provenance attestations:

```bash
# Verify signature with cosign
cosign verify ghcr.io/genesis-nexus/pulsegen-backend:v2.1.0 \
  --certificate-identity-regexp="https://github.com/genesis-nexus/pulsegen/*" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com"

# Verify provenance with GitHub CLI
gh attestation verify oci://ghcr.io/genesis-nexus/pulsegen-backend:v2.1.0 \
  -R genesis-nexus/pulsegen
```

---

## Building from Source

### Prerequisites

- Git
- Node.js 20+
- Docker & Docker Compose (for containerized builds)

### Clone and Checkout Version

```bash
# Clone the repository
git clone https://github.com/genesis-nexus/pulsegen.git
cd pulsegen

# List available versions
git tag -l "v*" --sort=-v:refname

# Checkout specific version
git checkout v2.1.0
```

### Build Options

#### Option 1: Docker Build (Recommended)

```bash
# Build images locally
docker-compose build

# Or build with specific tags
docker build -t pulsegen-backend:local ./backend
docker build -t pulsegen-frontend:local ./frontend

# Run
docker-compose up -d
```

#### Option 2: Local Development Build

```bash
# Install dependencies
cd backend && npm ci && cd ..
cd frontend && npm ci && cd ..

# Build
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

# The builds are in:
# - backend/dist/
# - frontend/dist/
```

### Building from Release Archives

If you download a source archive (ZIP/tarball) from GitHub Releases:

1. The `VERSION` file contains the release version
2. Build normally with Docker or npm

```bash
# Check version
cat VERSION

# Build
docker-compose build
```

---

## Upgrade Guide

### Docker Upgrades

```bash
# 1. Check current version
docker inspect ghcr.io/genesis-nexus/pulsegen-backend:latest | grep -i version

# 2. Pull new images
docker-compose pull

# 3. Review changelog for breaking changes
# https://github.com/genesis-nexus/pulsegen/blob/main/CHANGELOG.md

# 4. Backup database
docker-compose exec postgres pg_dump -U postgres pulsegen > backup.sql

# 5. Stop services
docker-compose down

# 6. Start with new images
docker-compose up -d

# 7. Run migrations (automatic in entrypoint, but can be manual)
docker-compose exec backend npx prisma migrate deploy
```

### Version Pinning (Production)

For production environments, always pin to specific versions:

```yaml
# docker-compose.prod.yml
services:
  backend:
    image: ghcr.io/genesis-nexus/pulsegen-backend:v2.1.0  # Pinned
    # NOT: ghcr.io/genesis-nexus/pulsegen-backend:latest
```

### Breaking Changes

Major version upgrades (e.g., v1 → v2) may include:

- Database schema changes requiring migration
- API endpoint changes
- Configuration changes
- Removed features

Always review the [CHANGELOG](https://github.com/genesis-nexus/pulsegen/blob/main/CHANGELOG.md) and [Migration Guide](./migration.md) before major upgrades.

---

## Release Channels

| Channel | Tag Pattern | Description |
|---------|-------------|-------------|
| **Stable** | `vX.Y.Z` | Production-ready releases |
| **Pre-release** | `vX.Y.Z-beta.N` | Feature-complete, testing phase |
| **Alpha** | `vX.Y.Z-alpha.N` | Early preview, may be unstable |

### Using Pre-releases

```bash
# Pull beta version
docker pull ghcr.io/genesis-nexus/pulsegen-backend:v2.2.0-beta.1
```

Pre-releases are **not recommended for production** but useful for:
- Testing new features before stable release
- Providing feedback to maintainers
- Planning upgrades

---

## Multi-Architecture Support

All images support multiple architectures:

| Architecture | Platform | Use Case |
|--------------|----------|----------|
| `linux/amd64` | x86_64 | Most cloud servers, Intel/AMD |
| `linux/arm64` | ARM64 | AWS Graviton, Apple Silicon, Raspberry Pi 4+ |

Docker automatically pulls the correct architecture for your system.

### Forcing Architecture

```bash
# Force AMD64 on ARM machine (slower, uses emulation)
docker pull --platform linux/amd64 ghcr.io/genesis-nexus/pulsegen-backend:v2.1.0
```

---

## Version Information in Running Instance

Check the version of a running PulseGen instance:

### API Endpoint

```bash
curl http://localhost:5000/api/health
# Returns: { "version": "2.1.0", "status": "healthy", ... }
```

### Environment Variable

The `PULSEGEN_VERSION` environment variable is set in containers:

```bash
docker-compose exec backend printenv PULSEGEN_VERSION
```

---

## Release Notifications

Stay updated on new releases:

1. **GitHub Watch** - Watch the repository for releases only
2. **RSS Feed** - `https://github.com/genesis-nexus/pulsegen/releases.atom`
3. **GitHub Discussions** - Announcements category

---

## Support Matrix

| Version | Status | Support Until |
|---------|--------|---------------|
| 2.x | Current | Active development |
| 1.x | Maintenance | Security fixes only |
| < 1.0 | End of Life | No support |

We recommend always running the latest stable version for security and feature updates.
