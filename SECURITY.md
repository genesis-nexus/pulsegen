# Security Policy

## Supported Versions

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Use GitHub's Private Vulnerability Reporting:**

1. Go to the [Security tab](https://github.com/genesis-nexus/pulsegen/security) of our repository
2. Click "Report a vulnerability"
3. Fill out the vulnerability report form

This ensures your report is kept confidential until a fix is available.

### What to Include

Please provide as much information as possible:

- **Description**: Clear explanation of the vulnerability
- **Impact**: What an attacker could achieve
- **Steps to Reproduce**: Detailed steps to demonstrate the issue
- **Affected Versions**: Which versions are impacted
- **Suggested Fix**: If you have recommendations

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Initial acknowledgment | Within 24 hours |
| Assessment and triage | Within 5 business days |
| Target patch development | Within 30 days |
| Maximum disclosure timeline | 90 days |

We will keep you informed throughout the process.

### What NOT to Do

- **DO NOT** create public GitHub issues for security vulnerabilities
- **DO NOT** disclose the vulnerability publicly before a fix is available
- **DO NOT** exploit the vulnerability beyond what is necessary to demonstrate it
- **DO NOT** access or modify data belonging to other users

## Safe Harbor

We support safe harbor for security researchers who:

- Act in good faith to avoid privacy violations, destruction of data, and disruption of services
- Only interact with accounts you own or with explicit permission of the account holder
- Report any vulnerability you discover promptly
- Do not exploit the vulnerability beyond demonstrating the security issue

We will not pursue legal action against researchers who follow these guidelines.

## Security Best Practices for Deployment

When deploying PulseGen, we recommend:

### Environment Configuration

- Use strong, unique values for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `ENCRYPTION_KEY`
- Never commit `.env` files to version control
- Rotate secrets periodically

### Network Security

- Deploy behind a reverse proxy (nginx, Traefik) with TLS
- Use HTTPS for all connections
- Configure appropriate CORS settings
- Enable rate limiting

### Database Security

- Use strong database passwords
- Restrict database access to application servers only
- Enable SSL for database connections in production
- Regular backups with encryption

### Container Security

- Run containers as non-root users
- Use read-only file systems where possible
- Keep base images updated
- Scan images for vulnerabilities

### Access Control

- Use SSO/SAML for enterprise deployments
- Implement least-privilege access principles
- Audit user access regularly
- Enable MFA where available

## Security Features

PulseGen includes built-in security measures:

- **Rate Limiting**: Protects against brute force attacks
- **Helmet.js**: Sets security-related HTTP headers
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Zod-based request validation
- **SQL Injection Prevention**: Parameterized queries via Prisma
- **XSS Protection**: Content Security Policy headers
- **Password Hashing**: bcrypt with configurable rounds
- **JWT Tokens**: Short-lived access tokens with refresh rotation

## Acknowledgments

We appreciate the security community's efforts in helping keep PulseGen secure. Responsible disclosure helps protect our users.

---

Thank you for helping keep PulseGen and its users safe!
