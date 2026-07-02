#!/usr/bin/env bash
#
# PulseGen one-command deployment
# ================================
#
# Zero-configuration quick start (bundled PostgreSQL, generated secrets):
#
#   ./deploy.sh
#
# Use an existing database (Supabase, Neon, RDS, or any PostgreSQL):
#
#   ./deploy.sh --db-url "postgresql://postgres.abc:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
#
# Common options:
#   --db-url <url>          Use an external PostgreSQL database instead of the bundled one
#   --domain <name>         Public domain name (enables the nginx reverse proxy)
#   --app-port <port>       Frontend port                       (default: 3001)
#   --api-port <port>       Backend API port                    (default: 5001)
#   --admin-email <email>   Initial admin login                 (default: admin@example.com)
#   --admin-password <pw>   Initial admin password              (default: generated)
#   --with-redis            Enable the Redis cache service
#   --with-nginx            Enable the nginx reverse proxy (implied by --domain)
#   --no-start              Write configuration only, don't start containers
#   --yes                   Never prompt (assume defaults / keep existing values)
#
# Management subcommands:
#   ./deploy.sh status      Show service status
#   ./deploy.sh logs        Tail service logs
#   ./deploy.sh update      Pull latest code changes and rebuild
#   ./deploy.sh down        Stop all services (data is kept)
#   ./deploy.sh reset       Stop services AND DELETE ALL DATA (asks for confirmation)
#
set -euo pipefail

cd "$(dirname "$0")"

# ---------------------------------------------------------------------------
# Pretty output helpers
# ---------------------------------------------------------------------------
if [ -t 1 ]; then
    RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
else
    RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; NC=''
fi
ok()    { echo -e "${GREEN}✓${NC} $1"; }
err()   { echo -e "${RED}✗${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
info()  { echo -e "${BLUE}ℹ${NC} $1"; }
step()  { echo -e "\n${BOLD}${BLUE}==>${NC}${BOLD} $1${NC}"; }
die()   { err "$1"; exit 1; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

generate_secret() {
    if command_exists openssl; then
        openssl rand -base64 48 | tr -d "=+/" | cut -c1-40
    else
        tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 40
    fi
}

generate_hex() {
    if command_exists openssl; then
        openssl rand -hex 32
    else
        tr -dc 'a-f0-9' < /dev/urandom | head -c 64
    fi
}

# Read a value from an existing .env file (returns empty when missing)
env_get() {
    [ -f .env ] || return 0
    grep -E "^$1=" .env 2>/dev/null | head -n1 | cut -d'=' -f2- || true
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
DB_URL=""
DOMAIN=""
APP_PORT=""
API_PORT=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
WITH_REDIS=0
WITH_NGINX=0
NO_START=0
ASSUME_YES=0
SUBCOMMAND=""

while [ $# -gt 0 ]; do
    case "$1" in
        status|logs|update|down|reset)
            SUBCOMMAND="$1" ;;
        --db-url|--database-url|--supabase)
            DB_URL="${2:?missing value for $1}"; shift ;;
        --domain)
            DOMAIN="${2:?missing value for $1}"; shift ;;
        --app-port)
            APP_PORT="${2:?missing value for $1}"; shift ;;
        --api-port)
            API_PORT="${2:?missing value for $1}"; shift ;;
        --admin-email)
            ADMIN_EMAIL="${2:?missing value for $1}"; shift ;;
        --admin-password)
            ADMIN_PASSWORD="${2:?missing value for $1}"; shift ;;
        --with-redis)
            WITH_REDIS=1 ;;
        --with-nginx)
            WITH_NGINX=1 ;;
        --no-start)
            NO_START=1 ;;
        --yes|-y)
            ASSUME_YES=1 ;;
        --help|-h)
            sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'
            exit 0 ;;
        *)
            die "Unknown option: $1 (run ./deploy.sh --help)" ;;
    esac
    shift
done

# ---------------------------------------------------------------------------
# Docker detection (needed by every code path)
# ---------------------------------------------------------------------------
command_exists docker || die "Docker is required. Install it from https://docs.docker.com/get-docker/"
docker info >/dev/null 2>&1 || die "Docker is installed but not running (or you lack permission). Start Docker and retry."

if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
elif command_exists docker-compose; then
    COMPOSE="docker-compose"
else
    die "Docker Compose is required. Install it from https://docs.docker.com/compose/install/"
fi

# Figure out which compose files the current deployment uses.
# External-DB mode is recorded in .env as PULSEGEN_DB_MODE=external.
compose_files() {
    if [ "$(env_get PULSEGEN_DB_MODE)" = "external" ]; then
        # Standalone file without the bundled postgres service
        echo "-f docker-compose.external-db.yml"
    else
        echo "-f docker-compose.yml"
    fi
}

compose_profiles() {
    local profiles=""
    [ "$(env_get PULSEGEN_NGINX)" = "1" ] && profiles="$profiles --profile production"
    [ "$(env_get PULSEGEN_REDIS)" = "1" ] && profiles="$profiles --profile with-redis"
    echo "$profiles"
}

# ---------------------------------------------------------------------------
# Management subcommands operate on the existing deployment and exit
# ---------------------------------------------------------------------------
if [ -n "$SUBCOMMAND" ]; then
    FILES=$(compose_files)
    PROFILES=$(compose_profiles)
    case "$SUBCOMMAND" in
        status)
            $COMPOSE $FILES $PROFILES ps ;;
        logs)
            $COMPOSE $FILES $PROFILES logs -f --tail=100 ;;
        down)
            $COMPOSE $FILES $PROFILES down
            ok "Services stopped. Data volumes were kept. Run ./deploy.sh to start again." ;;
        update)
            step "Updating PulseGen"
            if command_exists git && [ -d .git ]; then
                info "Pulling latest code..."
                git pull --ff-only || warn "git pull failed — rebuilding current checkout instead"
            fi
            $COMPOSE $FILES $PROFILES up -d --build
            ok "Update complete." ;;
        reset)
            warn "This will stop PulseGen and DELETE ALL LOCAL DATA (database volume included)."
            if [ "$ASSUME_YES" -ne 1 ]; then
                read -r -p "Type 'delete' to confirm: " CONFIRM
                [ "$CONFIRM" = "delete" ] || die "Aborted."
            fi
            $COMPOSE $FILES $PROFILES down -v
            ok "All services stopped and volumes deleted." ;;
    esac
    exit 0
fi

# ---------------------------------------------------------------------------
# Banner
# ---------------------------------------------------------------------------
echo -e "${BLUE}${BOLD}"
cat << "EOF"
  ____        _           ____
 |  _ \ _   _| |___  ___ / ___| ___ _ __
 | |_) | | | | / __|/ _ \ |  _ / _ \ '_ \
 |  __/| |_| | \__ \  __/ |_| |  __/ | | |
 |_|    \__,_|_|___/\___|\____|\___|_| |_|

        One-command deployment
EOF
echo -e "${NC}"

# ---------------------------------------------------------------------------
# External database handling (Supabase, Neon, RDS, any PostgreSQL)
# ---------------------------------------------------------------------------
DIRECT_DB_URL=""
DB_MODE="bundled"

if [ -z "$DB_URL" ] && [ "$(env_get PULSEGEN_DB_MODE)" = "external" ]; then
    # Re-deploying an existing external-DB setup: reuse the stored URL
    DB_URL=$(env_get DATABASE_URL)
    DIRECT_DB_URL=$(env_get DIRECT_DATABASE_URL)
fi

if [ -n "$DB_URL" ]; then
    DB_MODE="external"

    case "$DB_URL" in
        postgres://*|postgresql://*) : ;;
        *) die "--db-url must be a postgresql:// connection string" ;;
    esac

    # Supabase transaction pooler (port 6543) can't run DDL/prepared statements.
    # Prisma needs pgbouncer=true at runtime plus a session-mode (port 5432)
    # connection for schema pushes — derive both automatically.
    if [ -z "$DIRECT_DB_URL" ]; then
        if echo "$DB_URL" | grep -q "pooler.supabase.com:6543"; then
            info "Supabase transaction pooler detected — configuring Prisma accordingly"
            case "$DB_URL" in
                *pgbouncer=true*) : ;;
                *\?*) DB_URL="${DB_URL}&pgbouncer=true" ;;
                *)    DB_URL="${DB_URL}?pgbouncer=true" ;;
            esac
            # Schema changes go through the session-mode pooler on port 5432
            DIRECT_DB_URL=$(echo "$DB_URL" | sed -e 's/:6543\//:5432\//' -e 's/[?&]pgbouncer=true//')
        else
            DIRECT_DB_URL="$DB_URL"
        fi
    fi

    step "Checking database connectivity"
    info "Connecting to your database (this pulls a small postgres image on first run)..."
    if docker run --rm postgres:16-alpine psql "$DIRECT_DB_URL" -tAc "SELECT 1" >/dev/null 2>&1; then
        ok "Database connection verified"
    else
        err "Could not connect to the database with the URL provided."
        echo "    Check that:"
        echo "      • The connection string is correct (username, password, host, port, database)"
        echo "      • The database allows connections from this machine (IP allowlist / SSL settings)"
        echo "      • For Supabase: use the 'Connection string' from Project Settings → Database"
        exit 1
    fi
fi

# ---------------------------------------------------------------------------
# Configuration (reuse existing .env values, generate the rest)
# ---------------------------------------------------------------------------
step "Configuring environment"

EXISTING_ENV=0
[ -f .env ] && EXISTING_ENV=1 && info "Found existing .env — reusing its secrets and any values you don't override"

POSTGRES_PASSWORD=$(env_get POSTGRES_PASSWORD)
JWT_SECRET=$(env_get JWT_SECRET)
JWT_REFRESH_SECRET=$(env_get JWT_REFRESH_SECRET)
ENCRYPTION_KEY=$(env_get ENCRYPTION_KEY)

[ -n "$POSTGRES_PASSWORD" ] || POSTGRES_PASSWORD=$(generate_secret)
[ -n "$JWT_SECRET" ] || JWT_SECRET=$(generate_secret)
[ -n "$JWT_REFRESH_SECRET" ] || JWT_REFRESH_SECRET=$(generate_secret)
[ -n "$ENCRYPTION_KEY" ] || ENCRYPTION_KEY=$(generate_hex)

APP_PORT=${APP_PORT:-$(env_get FRONTEND_PORT)}
APP_PORT=${APP_PORT:-3001}
API_PORT=${API_PORT:-$(env_get BACKEND_PORT)}
API_PORT=${API_PORT:-5001}
DOMAIN=${DOMAIN:-$(env_get DOMAIN_NAME)}
DOMAIN=${DOMAIN:-localhost}
ADMIN_EMAIL=${ADMIN_EMAIL:-$(env_get ADMIN_EMAIL)}
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}

GENERATED_ADMIN_PW=0
if [ -z "$ADMIN_PASSWORD" ]; then
    ADMIN_PASSWORD=$(env_get ADMIN_PASSWORD)
    if [ -z "$ADMIN_PASSWORD" ]; then
        ADMIN_PASSWORD=$(generate_secret | cut -c1-16)
        GENERATED_ADMIN_PW=1
    fi
fi

# Domain implies the nginx reverse proxy
[ "$DOMAIN" != "localhost" ] && WITH_NGINX=1
[ "$(env_get PULSEGEN_NGINX)" = "1" ] && WITH_NGINX=1
[ "$(env_get PULSEGEN_REDIS)" = "1" ] && WITH_REDIS=1

if [ "$DOMAIN" != "localhost" ]; then
    APP_URL="https://$DOMAIN"
    API_URL="https://$DOMAIN/api"
    TRUST_PROXY="true"
else
    APP_URL="http://localhost:$APP_PORT"
    API_URL="http://localhost:$API_PORT"
    TRUST_PROXY=$([ "$WITH_NGINX" -eq 1 ] && echo "true" || echo "false")
fi

# Preserve any custom URLs from an existing .env
[ -n "$(env_get APP_URL)" ] && APP_URL=$(env_get APP_URL)
[ -n "$(env_get VITE_API_URL)" ] && API_URL=$(env_get VITE_API_URL)

# Warn before overwriting an .env that we didn't create
if [ "$EXISTING_ENV" -eq 1 ] && [ "$ASSUME_YES" -ne 1 ] && ! grep -q "Generated by deploy.sh\|Generated by setup script" .env 2>/dev/null; then
    warn "An .env file exists that wasn't generated by this script."
    read -r -p "Merge and overwrite it? (y/N): " REPLY
    case "$REPLY" in [Yy]*) : ;; *) die "Aborted. Move your .env aside or run with --yes." ;; esac
fi

# Capture carry-over values BEFORE truncating .env below
KEEP_SMTP_HOST=$(env_get SMTP_HOST)
KEEP_SMTP_PORT=$(env_get SMTP_PORT)
KEEP_SMTP_USER=$(env_get SMTP_USER)
KEEP_SMTP_PASS=$(env_get SMTP_PASS)
KEEP_EMAIL_FROM=$(env_get EMAIL_FROM)
KEEP_ANTHROPIC=$(env_get ANTHROPIC_API_KEY)
KEEP_OPENAI=$(env_get OPENAI_API_KEY)
KEEP_GOOGLE=$(env_get GOOGLE_API_KEY)

cat > .env << ENVEOF
# ==============================================
# PulseGen Environment Configuration
# Generated by deploy.sh on $(date)
# Re-running ./deploy.sh keeps these secrets.
# ==============================================

# Deployment shape (used by deploy.sh)
PULSEGEN_DB_MODE=$DB_MODE
PULSEGEN_NGINX=$WITH_NGINX
PULSEGEN_REDIS=$WITH_REDIS

# --- Database ---
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
ENVEOF

if [ "$DB_MODE" = "external" ]; then
    cat >> .env << ENVEOF
DATABASE_URL=$DB_URL
DIRECT_DATABASE_URL=$DIRECT_DB_URL
ENVEOF
fi

cat >> .env << ENVEOF

# --- Secrets ---
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# --- Domain & ports ---
DOMAIN_NAME=$DOMAIN
HTTP_PORT=${HTTP_PORT:-80}
HTTPS_PORT=${HTTPS_PORT:-443}
FRONTEND_PORT=$APP_PORT
BACKEND_PORT=$API_PORT
TRUST_PROXY=$TRUST_PROXY

# --- URLs ---
APP_URL=$APP_URL
CORS_ORIGIN=$APP_URL
VITE_API_URL=$API_URL

# --- Initial admin user (created on first run) ---
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

# --- Email (optional) ---
SMTP_HOST=$KEEP_SMTP_HOST
SMTP_PORT=$KEEP_SMTP_PORT
SMTP_USER=$KEEP_SMTP_USER
SMTP_PASS=$KEEP_SMTP_PASS
EMAIL_FROM=$KEEP_EMAIL_FROM

# --- AI provider keys (optional — can also be set per-user in the UI) ---
ANTHROPIC_API_KEY=$KEEP_ANTHROPIC
OPENAI_API_KEY=$KEEP_OPENAI
GOOGLE_API_KEY=$KEEP_GOOGLE
ENVEOF

chmod 600 .env
ok "Configuration written to .env"

# Point nginx at the configured domain
if [ "$WITH_NGINX" -eq 1 ] && [ -f nginx.conf ] && [ "$DOMAIN" != "localhost" ]; then
    sed -i.bak "s/server_name .*/server_name $DOMAIN;/" nginx.conf && rm -f nginx.conf.bak
    ok "nginx configured for $DOMAIN"
fi

if [ "$DB_MODE" = "external" ]; then
    ok "Using external database ($(echo "$DB_URL" | sed -E 's#//([^:]+):[^@]+@#//\1:****@#'))"
else
    ok "Using bundled PostgreSQL (data stored in the pulsegen postgres_data volume)"
fi

# ---------------------------------------------------------------------------
# Launch
# ---------------------------------------------------------------------------
if [ "$NO_START" -eq 1 ]; then
    info "--no-start given: configuration is ready. Start later with ./deploy.sh"
    exit 0
fi

FILES=$(compose_files)
PROFILES=$(compose_profiles)

step "Building and starting services (first run takes a few minutes)"
$COMPOSE $FILES $PROFILES up -d --build

# ---------------------------------------------------------------------------
# Wait for the app to become healthy
# ---------------------------------------------------------------------------
step "Waiting for PulseGen to become healthy"

HEALTH_URL="http://localhost:$API_PORT/health"
DEADLINE=$((SECONDS + 180))
HEALTHY=0
while [ $SECONDS -lt $DEADLINE ]; do
    if command_exists curl; then
        if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
            HEALTHY=1
            break
        fi
    else
        # curl missing on the host — probe from inside the container instead
        if docker exec pulsegen_backend wget -qO- http://localhost:5000/health >/dev/null 2>&1; then
            HEALTHY=1
            break
        fi
    fi
    printf "."
    sleep 3
done
echo ""

if [ "$HEALTHY" -ne 1 ]; then
    err "Backend did not become healthy within 3 minutes."
    echo ""
    info "Recent backend logs:"
    $COMPOSE $FILES logs --tail=40 backend || true
    echo ""
    echo "  Diagnose further with: ./deploy.sh logs"
    exit 1
fi
ok "Backend is healthy"

# ---------------------------------------------------------------------------
# Success summary
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}${BOLD}PulseGen is up and running!${NC}"
echo ""
if [ "$DOMAIN" != "localhost" ]; then
    echo -e "  ${BOLD}Application:${NC}  https://$DOMAIN  (once DNS + TLS point here)"
    echo -e "  ${BOLD}Local check:${NC}  http://localhost:${HTTP_PORT:-80}"
else
    echo -e "  ${BOLD}Application:${NC}  $APP_URL"
    echo -e "  ${BOLD}API:${NC}          $API_URL"
fi
echo ""
echo -e "  ${BOLD}Admin login:${NC}  $ADMIN_EMAIL"
if [ "$GENERATED_ADMIN_PW" -eq 1 ]; then
    echo -e "  ${BOLD}Password:${NC}     $ADMIN_PASSWORD   ${YELLOW}(generated — saved in .env)${NC}"
else
    echo -e "  ${BOLD}Password:${NC}     (as configured)"
fi
echo ""
warn "Change the admin password after your first login."
echo ""
echo "Manage your deployment:"
echo "  ./deploy.sh status    # service status"
echo "  ./deploy.sh logs      # follow logs"
echo "  ./deploy.sh update    # pull latest code and rebuild"
echo "  ./deploy.sh down      # stop (keeps data)"
echo ""
if [ "$DOMAIN" != "localhost" ]; then
    info "TLS: put this behind Cloudflare/Caddy/Traefik, or run ./setup.sh for guided Let's Encrypt setup."
fi
