#!/bin/bash

echo "========================================"
echo "FORCING COMPLETE CLIENT REBUILD"
echo "========================================"
echo ""

cd ~/SilentTalkFYP/infrastructure/docker

# Step 1: Stop and remove everything
echo "1. Stopping all containers..."
docker-compose down -v 2>/dev/null || true

# Step 2: Remove client images forcefully
echo "2. Removing old client images..."
docker rmi -f $(docker images -q docker_client) 2>/dev/null || true
docker rmi -f $(docker images -q docker-client) 2>/dev/null || true
docker rmi -f silents-talk-client 2>/dev/null || true

# Step 3: Clear build cache completely
echo "3. Clearing ALL Docker build cache..."
docker builder prune -a -f

# Step 4: Rebuild without any caching (disable BuildKit cache)
echo "4. Rebuilding client with fresh Dockerfile..."
cd ~/SilentTalkFYP/client
export DOCKER_BUILDKIT=0
docker build --no-cache --pull -t manual-client-build:latest -f Dockerfile --target development .

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ BUILD FAILED!"
    echo ""
    echo "Checking Dockerfile content:"
    grep -n "npm" Dockerfile
    exit 1
fi

echo ""
echo "✅ Client built successfully!"
echo ""
echo "5. Starting all services..."
cd ~/SilentTalkFYP/infrastructure/docker

# Start infrastructure first
docker-compose up -d postgres redis mongodb minio

echo "Waiting for databases to be ready (30s)..."
sleep 30

# Start backend
docker-compose up -d server

echo "Waiting for server to start (30s)..."
sleep 30

# Start ML service
docker-compose up -d ml-service

echo "Waiting for ML service (10s)..."
sleep 10

# Tag our manually built image
docker tag manual-client-build:latest docker_client:latest

# Start client
docker-compose up -d client

echo ""
echo "Waiting for client to start (20s)..."
sleep 20

echo ""
echo "========================================"
echo "SERVICE STATUS"
echo "========================================"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAME|silents-talk"

echo ""
echo "========================================"
echo "HEALTH CHECKS"
echo "========================================"
echo -n "Backend: "
curl -s http://localhost:5000/health | grep -q "healthy" && echo "✅ HEALTHY" || echo "❌ DOWN"

echo -n "ML Service: "
curl -s http://localhost:8000/status | grep -q "status" && echo "✅ HEALTHY" || echo "❌ DOWN"

echo -n "Frontend: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200" && echo "✅ ACCESSIBLE" || echo "❌ DOWN"

echo ""
echo "========================================"
echo "ACCESS URLS"
echo "========================================"
echo "Frontend:  http://localhost:3000"
echo "Backend:   http://localhost:5000/docs"
echo "ML API:    http://localhost:8000/docs"
echo ""
echo "View logs: docker-compose logs -f client"
echo "========================================"
