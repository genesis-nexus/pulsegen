#!/bin/sh
set -e

echo "Syncing database schema..."
npx prisma db push --skip-generate --accept-data-loss

echo "Starting server..."
exec node dist/index.js 2>&1
