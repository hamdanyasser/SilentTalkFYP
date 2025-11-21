#!/bin/bash

echo "=================================="
echo "Checking Server Build Errors"
echo "=================================="

cd /home/user/SilentTalkFYP

# Try to build the server in the container
echo ""
echo "Attempting to start server and capture logs..."
docker compose -f infrastructure/docker/docker-compose.yml up server --build 2>&1 | tee server_build.log

echo ""
echo "Build log saved to: server_build.log"
