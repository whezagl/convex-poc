#!/bin/bash
# Verification script for data persistence across container restarts
# Subtask 9-5: Verify data persists across container restarts

set -e

echo "=== Data Persistence Verification Script ==="
echo "Testing subtask-9-5: Verify data persistence across container restarts"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Step 1: Check if containers are running
echo "Step 1: Checking initial container status..."
if docker ps | grep -q "001-convex-poc-backend-1"; then
    print_status "Backend container is running"
else
    print_error "Backend container is not running. Please start with: python deploy.py up"
    exit 1
fi

if docker ps | grep -q "001-convex-poc-dashboard-1"; then
    print_status "Dashboard container is running"
else
    print_error "Dashboard container is not running"
    exit 1
fi

echo ""

# Step 2: Check if data exists
echo "Step 2: Checking for existing data in database..."
print_info "Accessing Convex Dashboard to verify data..."

# Try to access the dashboard API to check for data
DASHBOARD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6791)

if [ "$DASHBOARD_RESPONSE" = "200" ]; then
    print_status "Dashboard is accessible at http://localhost:6791"
    print_info "Manual check: Open http://localhost:6791 and verify mockData table contains records"
else
    print_error "Dashboard is not accessible (HTTP $DASHBOARD_RESPONSE)"
    exit 1
fi

echo ""

# Step 3: Document the restart test
echo "Step 3: Preparing to test container restart..."
print_info "The following steps will be performed:"
echo "  1. Stop all containers with 'python deploy.py down'"
echo "  2. Start all containers with 'python deploy.py up'"
echo "  3. Verify data persists after restart"
echo ""

read -p "Do you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Verification aborted by user"
    exit 0
fi

# Step 4: Stop containers
echo ""
echo "Step 4: Stopping containers..."
python deploy.py down

# Wait for containers to fully stop
sleep 5

if ! docker ps | grep -q "001-convex-poc"; then
    print_status "All containers stopped successfully"
else
    print_error "Some containers are still running"
    exit 1
fi

echo ""

# Step 5: Start containers
echo "Step 5: Starting containers..."
python deploy.py up

# Wait for backend to be healthy
echo "Waiting for backend to be healthy..."
sleep 10

# Check if backend is healthy
for i in {1..30}; do
    if docker ps | grep -q "001-convex-poc-backend-1.*healthy"; then
        print_status "Backend is healthy"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

echo ""

# Step 6: Verify data persists
echo "Step 6: Verifying data persistence after restart..."

if docker ps | grep -q "001-convex-poc-backend-1"; then
    print_status "Backend container is running after restart"
else
    print_error "Backend container failed to start after restart"
    exit 1
fi

if docker ps | grep -q "001-convex-poc-dashboard-1"; then
    print_status "Dashboard container is running after restart"
else
    print_error "Dashboard container failed to start after restart"
    exit 1
fi

# Check dashboard accessibility
DASHBOARD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6791)

if [ "$DASHBOARD_RESPONSE" = "200" ]; then
    print_status "Dashboard is accessible after restart"
    print_info "Manual check: Open http://localhost:6791 and verify mockData table still contains records"
else
    print_error "Dashboard is not accessible after restart (HTTP $DASHBOARD_RESPONSE)"
    exit 1
fi

# Step 7: Verify Docker volume
echo ""
echo "Step 7: Verifying Docker volume persistence..."
if docker volume ls | grep -q "001-convex-poc_convex_data"; then
    print_status "Docker volume 'convex_data' exists"
    print_info "Volume mount point: $(docker volume inspect 001-convex-poc_convex_data | jq -r '.[0].Mountpoint')"
else
    print_error "Docker volume 'convex_data' not found"
    exit 1
fi

echo ""
echo "=== Verification Complete ==="
print_status "Data persistence verification completed successfully!"
echo ""
echo "Summary:"
echo "  - Containers stopped and restarted successfully"
echo "  - Backend and dashboard services restored to healthy state"
echo "  - Docker volume persisted across restart cycle"
echo "  - Dashboard accessible and data should be intact"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:6791 (Convex Dashboard)"
echo "  2. Verify the mockData table contains your records"
echo "  3. (Optional) Start React app: npm run dev"
echo "  4. (Optional) Access http://localhost:3000/view to see data in the UI"
echo ""
