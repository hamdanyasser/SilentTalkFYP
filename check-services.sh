#!/bin/bash
# ============================================
# SilentTalk - Service Health Check Script
# Run this to verify all services are running
# ============================================

echo "🔍 Checking SilentTalk Services..."
echo ""
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker containers
echo "📦 Docker Containers:"
echo "----------------------------------------"

cd ~/SilentTalkFYP/infrastructure/docker

# PostgreSQL
POSTGRES_STATUS=$(docker compose ps postgres | grep -c "Up" || echo "0")
if [ "$POSTGRES_STATUS" -gt 0 ]; then
    echo -e "✅ ${GREEN}PostgreSQL container is running${NC}"
else
    echo -e "❌ ${RED}PostgreSQL container is NOT running${NC}"
fi

# MongoDB
MONGODB_STATUS=$(docker compose ps mongodb | grep -c "Up" || echo "0")
if [ "$MONGODB_STATUS" -gt 0 ]; then
    echo -e "✅ ${GREEN}MongoDB container is running${NC}"
else
    echo -e "❌ ${RED}MongoDB container is NOT running${NC}"
fi

# Redis
REDIS_STATUS=$(docker compose ps redis | grep -c "Up" || echo "0")
if [ "$REDIS_STATUS" -gt 0 ]; then
    echo -e "✅ ${GREEN}Redis container is running${NC}"
else
    echo -e "⚠️  ${YELLOW}Redis container is NOT running (optional)${NC}"
fi

echo ""
echo "🚀 Application Services:"
echo "----------------------------------------"

# Check Backend API
echo -n "Backend API (port 5000): "
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
elif lsof -i:5000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⏳ Starting...${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi

# Check Frontend
echo -n "Frontend (port 3001): "
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
elif lsof -i:3001 > /dev/null 2>&1; then
    echo -e "${YELLOW}⏳ Starting...${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi

echo ""
echo "=========================================="
echo ""
echo "📋 Quick Commands:"
echo "  View all containers:  cd ~/SilentTalkFYP/infrastructure/docker && docker compose ps"
echo "  View container logs:  cd ~/SilentTalkFYP/infrastructure/docker && docker compose logs -f [service]"
echo "  Restart services:     ./quick-start.sh"
echo "  Stop all services:    ./stop.sh"
echo ""

# Summary
cd ~/SilentTalkFYP/infrastructure/docker
RUNNING_CONTAINERS=$(docker compose ps | grep -c "Up" || echo "0")
echo "📊 Summary: $RUNNING_CONTAINERS container(s) running"
echo ""
