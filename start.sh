#!/bin/bash
# ============================================
# SilentTalk - Quick Start Script
# Run this script to start the entire application
# ============================================

set -e

echo "🚀 Starting SilentTalk Application..."
echo ""

# Navigate to docker directory
cd ~/SilentTalkFYP/infrastructure/docker

# Start all services
echo "▶️  Starting all services..."
docker-compose up -d

# Wait for services to initialize
echo ""
echo "⏳ Waiting for services to start (60 seconds)..."
sleep 60

# Check status
echo ""
echo "📊 Service Status:"
echo "===================="
docker-compose ps

echo ""
echo "✅ Checking service health..."
echo ""

# Check backend
echo -n "Backend API: "
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ HEALTHY"
else
    echo "⏳ Starting... (may need a few more seconds)"
fi

# Check ML service
echo -n "ML Service: "
if curl -s http://localhost:8000/status > /dev/null 2>&1; then
    echo "✅ HEALTHY"
else
    echo "⏳ Starting... (may need a few more seconds)"
fi

# Check frontend
echo -n "Frontend: "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ ACCESSIBLE"
else
    echo "⏳ Starting... (may need a few more seconds)"
fi

echo ""
echo "🎯 Access Your Application:"
echo "=============================="
echo "Frontend:      http://localhost:3000"
echo "Backend API:   http://localhost:5000/docs"
echo "ML Service:    http://localhost:8000/docs"
echo "MinIO Console: http://localhost:9001"
echo ""
echo "📝 View logs: docker-compose logs -f [service_name]"
echo "🛑 Stop all:  docker-compose down"
echo ""
echo "✨ Application is ready!"
