#!/bin/bash
set -e

echo "🔥 Forcing complete rebuild of client container..."

cd ~/SilentTalkFYP/infrastructure/docker

# Remove any existing client containers and images
echo "Removing old client container..."
docker-compose rm -f -s client 2>/dev/null || true
docker rm -f silents-talk-client 2>/dev/null || true

# Remove the client image
echo "Removing old client image..."
docker rmi docker_client 2>/dev/null || true
docker rmi $(docker images -q docker_client) 2>/dev/null || true

# Prune build cache
echo "Pruning build cache..."
docker builder prune -f

# Rebuild with no cache and no build context cache
echo "Building client (this will take a few minutes)..."
docker-compose build --no-cache --pull --progress=plain client 2>&1 | tee /tmp/client-build.log

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "Starting client..."
    docker-compose up -d client
    sleep 5
    docker-compose ps client
else
    echo "❌ Build failed! Check /tmp/client-build.log for details"
    echo ""
    echo "Last 20 lines of build log:"
    tail -20 /tmp/client-build.log
    exit 1
fi
