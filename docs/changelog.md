---
layout: default
title: Changelog
nav_order: 10
description: "Release notes and version history for PulseGen."
---

# Changelog
{: .no_toc }

All notable changes to PulseGen.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Versioning

PulseGen follows [Semantic Versioning](https://semver.org/):
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (backward compatible)

---

## [Unreleased]

### Added
- Comprehensive documentation site with GitHub Pages
- New "Create Survey with AI" page with Quick Generate and Guided Wizard options
- Enhanced dark theme throughout the application

### Changed
- Updated hero image in README to reflect actual application UI

### Fixed
- Various UI improvements and bug fixes

---

## [1.0.0] - 2024-12-31

### Added
- **Survey Builder**
  - Drag-and-drop question builder
  - 24 question types
  - Smart logic (skip logic, branching, piping)
  - Multi-page surveys
  - Custom themes and branding

- **Response Collection**
  - Public, private, and password-protected surveys
  - Save and continue functionality
  - QR code generation
  - Embed options (iframe, JavaScript)
  - Response quotas

- **Analytics Dashboard**
  - Real-time response tracking
  - Completion rate monitoring
  - Question-level analytics
  - Cross-tabulation
  - Trend analysis

- **AI Features**
  - Survey generation from natural language
  - Question optimization suggestions
  - Sentiment analysis
  - Theme extraction
  - Multi-language translation (12+ languages)

- **Export Options**
  - CSV export
  - Excel export
  - PDF reports
  - JSON export

- **User Management**
  - Role-based access control (Admin, Manager, Viewer)
  - Workspace organization
  - API key management
  - OAuth support (Google, GitHub, Microsoft)

- **Developer Features**
  - REST API with comprehensive endpoints
  - Webhook notifications
  - API documentation
  - Rate limiting

### Security
- JWT authentication with refresh tokens
- AES-256 encryption for sensitive data
- Rate limiting and brute force protection
- CORS configuration
- Input sanitization and XSS protection

### Infrastructure
- Docker and Docker Compose support
- Automated setup scripts (Linux, macOS, Windows)
- PostgreSQL database
- Optional Redis caching
- Nginx reverse proxy configuration
- SSL/TLS support

---

## Migration Guides

### Upgrading to 1.0.0

If you're upgrading from a pre-release version:

1. **Backup your database**
   ```bash
   docker-compose exec postgres pg_dump -U postgres pulsegen > backup.sql
   ```

2. **Pull latest changes**
   ```bash
   git pull origin main
   ```

3. **Update environment variables**
   ```bash
   cp .env.example .env.new
   # Merge your existing settings into .env.new
   mv .env.new .env
   ```

4. **Rebuild and restart**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

5. **Run migrations**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

---

## Roadmap

Planned features for future releases:

### v1.1.0
- Survey templates library
- Advanced skip logic visual builder
- Response notifications
- Bulk response import

### v1.2.0
- Multi-tenant workspaces
- Custom CSS themes
- Advanced analytics charts
- Scheduled survey publishing

### v2.0.0
- Plugin system
- Custom question types
- Mobile app (React Native)
- Advanced AI analysis

---

## Contributing

Found a bug or want to request a feature?

- [Report an issue](https://github.com/genesis-nexus/pulsegen/issues/new)
- [View open issues](https://github.com/genesis-nexus/pulsegen/issues)
- [Contribute code](https://github.com/genesis-nexus/pulsegen/blob/main/CONTRIBUTING.md)

---

[Unreleased]: https://github.com/genesis-nexus/pulsegen/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/genesis-nexus/pulsegen/releases/tag/v1.0.0
