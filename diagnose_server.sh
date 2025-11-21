#!/bin/bash
set -e

echo "========================================"
echo "SilentTalk Server Diagnostic Tool"
echo "========================================"

cd /home/user/SilentTalkFYP

# Step 1: Rebuild the server image
echo ""
echo "[1/3] Rebuilding server image..."
docker compose -f infrastructure/docker/docker-compose.yml build server 2>&1 | tee logs/server_build.log

# Step 2: Start the server
echo ""
echo "[2/3] Starting server..."
docker compose -f infrastructure/docker/docker-compose.yml up -d server

# Step 3: Wait and capture logs
echo ""
echo "[3/3] Capturing logs (waiting 10 seconds)..."
sleep 10
docker compose -f infrastructure/docker/docker-compose.yml logs server --tail=200 2>&1 | tee logs/server_runtime.log

echo ""
echo "========================================"
echo "Diagnostic Complete!"
echo "========================================"
echo "Build log: logs/server_build.log"
echo "Runtime log: logs/server_runtime.log"
echo ""
echo "Check the logs above for any errors."
