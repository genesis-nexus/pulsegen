---
layout: default
title: Troubleshooting
nav_order: 15
---

# Troubleshooting Guide

Common issues and solutions for PulseGen installation, configuration, and operation.

---

## Installation Issues

### Docker Compose Fails to Start

**Symptom:** `docker-compose up` exits with errors

**Solutions:**

1. **Check Docker is running:**
   ```bash
   docker info
   ```

2. **Verify Docker Compose version:**
   ```bash
   docker-compose --version
   # Requires v2.0+
   ```

3. **Check port availability:**
   ```bash
   # Check if ports are in use
   lsof -i :3001  # Frontend
   lsof -i :5000  # Backend
   lsof -i :5432  # PostgreSQL
   ```

4. **View detailed logs:**
   ```bash
   docker-compose logs --tail=50
   ```

### Permission Denied Errors

**Symptom:** `Permission denied` when running setup script

**Solution:**
```bash
chmod +x setup.sh
./setup.sh
```

### Out of Disk Space

**Symptom:** Build fails with "no space left on device"

**Solution:**
```bash
# Clean up Docker resources
docker system prune -a --volumes

# Check available space
df -h
```

---

## Database Issues

### Connection Refused

**Symptom:** `ECONNREFUSED` or `Connection refused` to PostgreSQL

**Solutions:**

1. **Check PostgreSQL is running:**
   ```bash
   docker-compose ps postgres
   # Should show "healthy"
   ```

2. **Verify DATABASE_URL format:**
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```

3. **Test connection:**
   ```bash
   docker-compose exec postgres pg_isready
   ```

4. **Check network connectivity:**
   ```bash
   docker-compose exec backend nc -zv postgres 5432
   ```

### Migration Failures

**Symptom:** `Prisma migrate` fails

**Solutions:**

1. **Reset database (development only):**
   ```bash
   docker-compose exec backend npx prisma migrate reset --force
   ```

2. **Run migrations manually:**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

3. **Regenerate Prisma client:**
   ```bash
   docker-compose exec backend npx prisma generate
   ```

### Database Already Exists

**Symptom:** "database already exists" error during setup

**Solution:** The setup script handles this. If persists:
```bash
# Use existing database
docker-compose exec postgres psql -U pulsegen -d pulsegen -c "SELECT 1"
```

---

## Backend Issues

### Backend Won't Start

**Symptom:** Backend container keeps restarting

**Solutions:**

1. **Check logs:**
   ```bash
   docker-compose logs backend --tail=100
   ```

2. **Verify environment variables:**
   ```bash
   docker-compose exec backend printenv | grep -E "(DATABASE|JWT|ENCRYPTION)"
   ```

3. **Common missing variables:**
   - `JWT_SECRET` - Must be at least 32 characters
   - `JWT_REFRESH_SECRET` - Must be at least 32 characters
   - `ENCRYPTION_KEY` - Must be 64 hex characters

### Invalid JWT Secret

**Symptom:** "JWT secret too short" or authentication failures

**Solution:** Generate proper secrets:
```bash
# Generate JWT secrets
openssl rand -base64 48

# Generate encryption key (64 hex chars)
openssl rand -hex 32
```

### API Returns 500 Errors

**Symptom:** Internal server errors on API calls

**Solutions:**

1. **Check backend logs:**
   ```bash
   docker-compose logs backend --tail=50
   ```

2. **Verify database connection:**
   ```bash
   docker-compose exec backend npx prisma db pull
   ```

3. **Check available memory:**
   ```bash
   docker stats pulsegen-backend
   ```

### Rate Limiting Issues

**Symptom:** "Too many requests" errors

**Solutions:**

1. **Adjust rate limits in environment:**
   ```bash
   RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
   RATE_LIMIT_MAX=1000          # Max requests per window
   ```

2. **For development, disable rate limiting:**
   ```bash
   RATE_LIMIT_ENABLED=false
   ```

---

## Frontend Issues

### Blank Page / White Screen

**Symptom:** Frontend loads but shows nothing

**Solutions:**

1. **Check browser console for errors** (F12 → Console)

2. **Verify API URL configuration:**
   ```bash
   # Check if API is reachable
   curl http://localhost:5000/api/health
   ```

3. **Clear browser cache and reload**

4. **Check frontend logs:**
   ```bash
   docker-compose logs frontend
   ```

### CORS Errors

**Symptom:** "Cross-Origin Request Blocked" in console

**Solutions:**

1. **Set CORS_ORIGIN in backend:**
   ```bash
   CORS_ORIGIN=http://localhost:3001
   ```

2. **For multiple origins:**
   ```bash
   CORS_ORIGIN=http://localhost:3001,https://yourdomain.com
   ```

3. **For development (not production):**
   ```bash
   CORS_ORIGIN=*
   ```

### Assets Not Loading

**Symptom:** Images, CSS, or JS files return 404

**Solutions:**

1. **Check nginx configuration:**
   ```bash
   docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
   ```

2. **Verify build completed:**
   ```bash
   docker-compose exec frontend ls -la /usr/share/nginx/html
   ```

---

## Authentication Issues

### Login Fails

**Symptom:** Can't log in with correct credentials

**Solutions:**

1. **Check if user exists:**
   ```bash
   docker-compose exec backend npx prisma studio
   # Opens database GUI at http://localhost:5555
   ```

2. **Reset admin password:**
   ```bash
   docker-compose exec backend npm run db:seed
   ```

3. **Verify JWT secrets match between restarts**

### Session Expires Immediately

**Symptom:** Logged out after refresh

**Solutions:**

1. **Check JWT expiration settings:**
   ```bash
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   ```

2. **Verify cookies are being set (check browser dev tools)**

3. **Ensure HTTPS in production** (secure cookies require HTTPS)

### SSO Not Working

**Symptom:** Google/Microsoft/GitHub login fails

**Solutions:**

1. **Verify OAuth credentials are set:**
   ```bash
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-secret
   ```

2. **Check redirect URIs in OAuth provider match your domain**

3. **Verify callback URL:**
   ```
   https://yourdomain.com/api/auth/google/callback
   ```

---

## AI Features Issues

### AI Generation Fails

**Symptom:** "AI service unavailable" or generation errors

**Solutions:**

1. **Verify API key is set:**
   ```bash
   docker-compose exec backend printenv | grep API_KEY
   ```

2. **Test API key directly:**
   ```bash
   # For OpenAI
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

3. **Check API quota/billing** on provider dashboard

### Slow AI Responses

**Symptom:** AI features take very long

**Solutions:**

1. **Use faster models:**
   - OpenAI: `gpt-3.5-turbo` instead of `gpt-4`
   - Anthropic: `claude-instant` instead of `claude-2`

2. **Check network latency to AI provider**

3. **Implement request timeouts:**
   ```bash
   AI_REQUEST_TIMEOUT=30000  # 30 seconds
   ```

---

## Performance Issues

### Slow Page Loads

**Symptom:** Application feels sluggish

**Solutions:**

1. **Enable Redis caching:**
   ```bash
   docker-compose --profile with-redis up -d
   ```

2. **Check database performance:**
   ```bash
   docker-compose exec postgres pg_stat_activity
   ```

3. **Add database indexes** (check Prisma schema)

4. **Increase container resources:**
   ```yaml
   # docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 1G
             cpus: '2'
   ```

### High Memory Usage

**Symptom:** Containers using excessive memory

**Solutions:**

1. **Check memory usage:**
   ```bash
   docker stats
   ```

2. **Set memory limits:**
   ```bash
   docker-compose up -d --scale backend=1 --memory=512m
   ```

3. **Optimize Node.js memory:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=512"
   ```

---

## Network Issues

### Container Can't Reach Internet

**Symptom:** External API calls fail

**Solutions:**

1. **Check DNS resolution:**
   ```bash
   docker-compose exec backend nslookup google.com
   ```

2. **Test connectivity:**
   ```bash
   docker-compose exec backend curl -I https://google.com
   ```

3. **Check Docker network:**
   ```bash
   docker network inspect pulsegen_default
   ```

### Reverse Proxy Issues

**Symptom:** 502 Bad Gateway or connection refused behind proxy

**Solutions:**

1. **Enable trust proxy:**
   ```bash
   TRUST_PROXY=true
   ```

2. **Set correct headers in proxy:**
   ```nginx
   proxy_set_header Host $host;
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   ```

3. **Increase proxy timeouts:**
   ```nginx
   proxy_read_timeout 300;
   proxy_connect_timeout 300;
   ```

---

## Upgrade Issues

### Migration Fails After Upgrade

**Symptom:** Database migration errors after version update

**Solutions:**

1. **Backup first:**
   ```bash
   docker-compose exec postgres pg_dump -U pulsegen pulsegen > backup.sql
   ```

2. **Run migrations:**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

3. **If stuck, check migration status:**
   ```bash
   docker-compose exec backend npx prisma migrate status
   ```

### Breaking Changes

**Symptom:** Features stop working after upgrade

**Solutions:**

1. **Check changelog:** [CHANGELOG.md](https://github.com/genesis-nexus/pulsegen/blob/main/CHANGELOG.md)

2. **Review migration guide** for major versions

3. **Rollback if needed:**
   ```bash
   docker-compose down
   docker-compose pull ghcr.io/genesis-nexus/pulsegen-backend:v1.x.x
   docker-compose up -d
   ```

---

## Getting More Help

### Collect Debug Information

Before asking for help, gather:

```bash
# System info
uname -a
docker --version
docker-compose --version

# Container status
docker-compose ps

# Recent logs
docker-compose logs --tail=200 > pulsegen-logs.txt

# Environment (redact secrets!)
docker-compose exec backend printenv | grep -v SECRET | grep -v KEY | grep -v PASSWORD
```

### Where to Get Help

1. **Documentation:** [genesis-nexus.github.io/pulsegen](https://genesis-nexus.github.io/pulsegen)
2. **GitHub Discussions:** [Ask questions](https://github.com/genesis-nexus/pulsegen/discussions)
3. **GitHub Issues:** [Report bugs](https://github.com/genesis-nexus/pulsegen/issues)
4. **Security Issues:** Use [private vulnerability reporting](https://github.com/genesis-nexus/pulsegen/security)

### Common Log Patterns

| Log Message | Meaning | Solution |
|-------------|---------|----------|
| `ECONNREFUSED` | Can't connect to service | Check if target service is running |
| `ENOTFOUND` | DNS resolution failed | Check network/hostname |
| `ETIMEDOUT` | Connection timed out | Check firewall/network |
| `ENOMEM` | Out of memory | Increase container memory |
| `ENOSPC` | Out of disk space | Clean up disk space |
