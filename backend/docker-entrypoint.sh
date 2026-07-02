#!/bin/sh
set -e

# Schema pushes need a direct (non-pooled) connection; default to DATABASE_URL
# when no separate direct URL is configured.
export DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-$DATABASE_URL}"

echo "Syncing database schema..."
npx prisma db push --skip-generate --accept-data-loss

echo "Seeding database..."
node dist/prisma/seed.js || echo "Seeding skipped (may already be seeded)"

echo "Starting server..."
exec node dist/index.js 2>&1
