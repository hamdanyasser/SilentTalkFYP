#!/bin/bash
# ============================================
# SilentTalk - Stop Script
# Run this script to stop all services
# ============================================

echo "🛑 Stopping SilentTalk Application..."
echo ""

cd ~/SilentTalkFYP/infrastructure/docker

# Stop all services
docker-compose down

echo ""
echo "✅ All services stopped!"
echo ""
echo "💾 Your data is preserved in Docker volumes"
echo "🚀 Run ./start.sh to start again"
