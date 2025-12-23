# Setup Guide

This guide covers all installation methods for PulseGen.

## Prerequisites

- **Node.js** 20 or higher
- **PostgreSQL** 14 or higher
- **Redis** (optional, for caching)
- **Git**

## Quick Start (Docker)

The fastest way to get started:

```bash
# Clone the repository
git clone https://github.com/your-org/pulsegen.git
cd pulsegen

# Copy environment files
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d
```

Access the app at [http://localhost:3001](http://localhost:3001)

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/pulsegen.git
cd pulsegen
```

### 2. Set Up the Database

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb pulsegen
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb pulsegen
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 3. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Required
DATABASE_URL=postgresql://postgres:password@localhost:5432/pulsegen
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=another-secret-key-min-32-chars
ENCRYPTION_KEY=64-character-hex-string

# Optional
REDIS_URL=redis://localhost:6379
PORT=5001
```

**Generate secure keys:**
```bash
# Generate JWT secrets
openssl rand -hex 32

# Generate encryption key
openssl rand -hex 32
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Initialize Database

```bash
cd backend
npx prisma migrate dev
npx prisma db seed  # Optional: seed sample data
```

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5001](http://localhost:5001)

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/pulsegen` |
| `JWT_SECRET` | Secret for access tokens (32+ chars) | Use `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (32+ chars) | Use `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | Key for encrypting API keys (64 hex chars) | Use `openssl rand -hex 32` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5001` |
| `NODE_ENV` | Environment mode | `development` |
| `REDIS_URL` | Redis connection URL | None (uses in-memory) |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |

### AI Provider Keys (Optional)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `GOOGLE_API_KEY` | Google AI API key |

> **Note:** Users can also add their own AI keys through the Settings UI.

---

## Redis Setup (Optional)

Redis improves performance through caching. The app works without it using in-memory fallback.

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:alpine
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :5001

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux
```

### Prisma Client Issues

```bash
cd backend
npx prisma generate
```

### Migration Errors

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Apply migrations
npx prisma migrate dev
```

### Redis Connection Failed

This is OK! The app falls back to in-memory caching. To use Redis, ensure it's running:

```bash
redis-cli ping  # Should return PONG
```

---

## Next Steps

- [Self-Hosting Guide](self-hosting.md) - Production deployment
- [API Reference](api.md) - REST API documentation
- [Contributing](../CONTRIBUTING.md) - How to contribute
