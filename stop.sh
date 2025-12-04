#!/bin/bash
# ============================================
# SilentTalk - Stop Script
# Run this script to stop all services
# ============================================

echo "🛑 Stopping SilentTalk Application..."
echo ""

# Stop Docker containers
echo "▶️  Stopping Docker containers..."
cd ~/SilentTalkFYP/infrastructure/docker
docker compose down

# Stop backend (if running)
echo ""
echo "▶️  Stopping Backend API..."
pkill -f "dotnet.*server" || echo "   Backend was not running"

# Stop frontend (if running)
echo ""
echo "▶️  Stopping Frontend..."
pkill -f "node.*react-scripts" || pkill -f "node.*start" || echo "   Frontend was not running"

echo ""
echo "=========================================="
echo "✅ All services stopped!"
echo "=========================================="
echo ""
echo "💾 Your data is preserved in Docker volumes"
echo "🚀 Run ./quick-start.sh to start again"
echo ""
