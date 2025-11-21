# PulseGen Setup Scripts

This directory contains automated setup scripts to make local development configuration easier.

## Available Scripts

### 1. Interactive Setup CLI (`setup.ts`)

**Recommended for:** First-time setup with full control over all options

```bash
# From project root
npm run setup

# Or directly
tsx scripts/setup.ts
```

**Features:**
- ✅ Interactive prompts for all configuration
- ✅ Supports both Docker and local development
- ✅ Optional Redis configuration
- ✅ Auto-generates secure secrets
- ✅ SMTP configuration wizard
- ✅ Validates prerequisites
- ✅ Provides detailed next steps

**What it does:**
1. Checks for required software (Docker/Node/PostgreSQL)
2. Prompts for configuration options
3. Generates `.env` files with secure secrets
4. Sets up database and services
5. Shows clear next steps

---

### 2. Quick Setup Script (`quick-setup.sh`)

**Recommended for:** Developers who want the fastest setup

```bash
# From project root
npm run quick-setup

# Or directly
./scripts/quick-setup.sh
```

**Features:**
- ✅ Fastest setup (no prompts)
- ✅ Auto-generates all secrets
- ✅ Creates all environment files
- ✅ Installs all dependencies
- ✅ Generates Prisma client
- ✅ Provides clear next steps

**What it does:**
1. Generates secure random secrets
2. Creates `.env` files for all components
3. Installs npm dependencies
4. Generates Prisma client
5. Shows manual steps for database setup

**Note:** This script creates environment files but does NOT:
- Create the database (you do this manually)
- Run migrations (you do this manually)
- Seed data (you do this manually)

This gives you more control over the database initialization.

---

## Comparison

| Feature | Interactive CLI | Quick Setup |
|---------|----------------|-------------|
| **Speed** | Slower (prompts) | Fastest |
| **Customization** | Full control | Sensible defaults |
| **Docker Setup** | ✅ Yes | ❌ No (local only) |
| **Redis Setup** | ✅ Optional | ❌ Disabled by default |
| **SMTP Config** | ✅ Interactive | ❌ Manual edit needed |
| **Database Init** | ✅ Automatic (Docker) | ❌ Manual |
| **Best For** | First-time users | Experienced devs |

---

## Usage Examples

### Example 1: Complete Automated Setup (Docker)

```bash
# Run interactive setup
npm run setup

# Choose:
# - Use Docker: Yes
# - Use Redis: Yes
# - Enter admin credentials
# - Configure SMTP (optional)

# Everything is set up automatically!
# Just access http://localhost:3000
```

### Example 2: Quick Local Setup

```bash
# 1. Run quick setup
npm run quick-setup

# 2. Create database
createdb pulsegen

# 3. Run migrations
cd backend
npx prisma migrate dev --name init

# 4. Seed database
npm run prisma:seed

# 5. Start services
npm run dev  # In one terminal
cd ../frontend && npm run dev  # In another terminal
```

### Example 3: Manual Setup

See [SETUP.md](../SETUP.md) for complete manual setup instructions.

---

## What Gets Created

Both scripts create the following files:

```
pulsegen/
├── .env                      # Root env (for Docker)
├── backend/.env              # Backend configuration
├── frontend/.env             # Frontend configuration
└── automation-tool/.env      # Automation tool configuration
```

### Environment Files Content

**`.env` / `backend/.env`:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection (optional)
- `JWT_SECRET` - JWT signing key (auto-generated)
- `JWT_REFRESH_SECRET` - Refresh token key (auto-generated)
- `ENCRYPTION_KEY` - API key encryption (auto-generated)
- `ADMIN_EMAIL` - Initial admin user email
- `ADMIN_PASSWORD` - Initial admin password
- SMTP configuration (optional)
- Application URLs

**`frontend/.env`:**
- `VITE_API_URL` - Backend API URL

**`automation-tool/.env`:**
- `VITE_API_URL` - Backend API URL

---

## Security

Both scripts generate cryptographically secure random secrets using:
- OpenSSL (`openssl rand -hex 32`)
- Node.js crypto module (`crypto.randomBytes(32).toString('hex')`)

**Generated secrets:**
- JWT Secret: 64 characters (hex)
- JWT Refresh Secret: 64 characters (hex)
- Encryption Key: 64 characters (hex)
- PostgreSQL Password: 32 characters (hex)

---

## Troubleshooting

### "Command not found: tsx"

Install tsx globally:
```bash
npm install -g tsx
```

Or run from project root using npm:
```bash
npm run setup
```

### "Permission denied" on bash script

Make it executable:
```bash
chmod +x scripts/quick-setup.sh
```

### Docker commands fail

Ensure Docker is running:
```bash
docker ps
```

### Database connection fails

Check PostgreSQL is running:
```bash
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Check if database exists
psql -U postgres -l
```

---

## Advanced Usage

### Custom Configuration

You can edit the generated `.env` files to customize:
- Database connection details
- Port numbers
- Redis settings
- SMTP configuration
- AI provider API keys

### Regenerate Secrets

To generate new secrets without running the full setup:

```bash
# Generate a new secret
openssl rand -hex 32
```

Then manually update your `.env` file.

### Multiple Environments

Create environment-specific files:
```bash
cp backend/.env backend/.env.development
cp backend/.env backend/.env.production
```

Load specific environment:
```bash
NODE_ENV=production npm start
```

---

## What to Do After Setup

After running either setup script:

1. **Verify Environment Files**
   ```bash
   cat backend/.env
   ```

2. **Start PostgreSQL** (if not using Docker)
   ```bash
   brew services start postgresql@16  # macOS
   sudo systemctl start postgresql    # Linux
   ```

3. **Create Database** (if not using Docker)
   ```bash
   createdb pulsegen
   ```

4. **Run Migrations**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

5. **Seed Database**
   ```bash
   npm run prisma:seed
   ```

6. **Start Development Servers**
   ```bash
   # Terminal 1
   cd backend && npm run dev

   # Terminal 2
   cd frontend && npm run dev

   # Terminal 3 (optional)
   cd automation-tool && npm run dev
   ```

7. **Access Applications**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Automation: http://localhost:3001

8. **Login**
   - Email: `admin@example.com`
   - Password: `admin123`

9. **Change Password!**
   - Navigate to Settings → Account
   - Update admin password

---

## Contributing

When adding new setup scripts:
1. Add documentation here
2. Make scripts executable (`chmod +x`)
3. Add error handling
4. Provide clear output messages
5. Test on multiple platforms

---

## See Also

- [SETUP.md](../SETUP.md) - Complete setup guide
- [README.md](../README.md) - Project documentation
- [AUTOMATION_TOOL.md](../AUTOMATION_TOOL.md) - Automation tool guide
