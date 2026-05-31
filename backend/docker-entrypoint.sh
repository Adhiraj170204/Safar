#!/bin/sh
set -e

# Seed test data (dev only; skipped in production unless SEED_DATA=true)
if [ "$NODE_ENV" != "production" ] || [ "$SEED_DATA" = "true" ]; then
  echo "🌱 Running seed data..."
  node src/seeds/seedData.js
fi

# Create/update admin if ADMIN_EMAIL env var is provided
if [ -n "$ADMIN_EMAIL" ]; then
  echo "👤 Setting up admin user..."
  node src/seeds/createAdmin.js
fi

echo "🚀 Starting server..."
exec "$@"
