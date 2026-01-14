#!/bin/bash
#
# Admin Key Generation Script
#
# This script generates a Convex admin key by executing the built-in
# generate_admin_key.sh script inside the convex-backend Docker container.
#
# Usage: ./generate-admin-key.sh
#
# The generated admin key will be output to stdout and should be added
# to the .env file as CONVEX_SELF_HOSTED_ADMIN_KEY.
#
# Requirements:
#   - Docker Compose must be running
#   - Backend container must be healthy

set -euo pipefail

# Container name from docker-compose.yml
CONTAINER_NAME="backend"
INNER_SCRIPT="./generate_admin_key.sh"

echo "🔑 Generating Convex admin key..."
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
    echo "Please wait for the backend to become healthy before generating an admin key."
    exit 1
fi

# Execute the admin key generation script inside the container
echo "✅ Backend is healthy. Generating admin key..."
echo ""

docker compose exec -T "$CONTAINER_NAME" "$INNER_SCRIPT"

echo ""
echo "✅ Admin key generated successfully!"
echo ""
echo "💡 Add this key to your .env file:"
echo "   CONVEX_SELF_HOSTED_ADMIN_KEY=<your-generated-key>"
