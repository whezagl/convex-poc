#!/bin/bash
#
# Seed Data Script
#
# This script imports mock data into the Convex database by executing
# the convex import command inside the convex-backend Docker container.
#
# Usage: ./seed-data.sh
#
# Requirements:
#   - Docker Compose must be running
#   - Backend container must be healthy
#   - CONVEX_SELF_HOSTED_ADMIN_KEY must be set in .env file
#   - seed-data.json file must exist
#   - Schema must be defined in src/convex/schema.ts

set -euo pipefail

# Container name from docker-compose.yml
CONTAINER_NAME="backend"
SCHEMA_FILE="./convex/schema.ts"
DATA_FILE="./seed-data.json"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Check if admin key is set
if [ -z "${CONVEX_SELF_HOSTED_ADMIN_KEY:-}" ]; then
    echo "❌ Error: CONVEX_SELF_HOSTED_ADMIN_KEY is not set."
    echo ""
    echo "Please generate an admin key first by running:"
    echo "  ./generate-admin-key.sh"
    echo ""
    echo "Then add the generated key to your .env file:"
    echo "  CONVEX_SELF_HOSTED_ADMIN_KEY=<your-generated-key>"
    exit 1
fi

echo "🌱 Seeding Convex database with mock data..."
echo ""

# Check if docker compose is running
if ! docker compose ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Error: Docker Compose is not running or backend container not found."
    echo "Please run 'docker compose up -d' first."
    exit 1
fi

# Check if backend container is healthy
CONTAINER_STATUS=$(docker compose ps -q "$CONTAINER_NAME" | xargs docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")

if [ "$CONTAINER_STATUS" != "healthy" ]; then
    echo "❌ Error: Backend container is not healthy (status: $CONTAINER_STATUS)."
    echo "Please wait for the backend to become healthy before seeding data."
    exit 1
fi

# Execute convex import inside the container
echo "✅ Backend is healthy. Importing data..."
echo ""

docker compose exec -T "$CONTAINER_NAME" npx convex import \
    --schema "$SCHEMA_FILE" \
    --data "$DATA_FILE" \
    --admin-key "${CONVEX_SELF_HOSTED_ADMIN_KEY}"

echo ""
echo "✅ Data imported successfully!"
echo ""
echo "💡 View your data in the Convex Dashboard at:"
echo "   http://localhost:6791"
