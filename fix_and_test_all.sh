#!/bin/bash
set -e

echo "============================================"
echo "SilentTalk - Fix and Test All Services"
echo "============================================"

cd /home/user/SilentTalkFYP

# Create logs directory if it doesn't exist
mkdir -p logs

echo ""
echo "[1/6] Stopping all services..."
docker compose -f infrastructure/docker/docker-compose.yml down

echo ""
echo "[2/6] Rebuilding ML service with import fixes..."
docker compose -f infrastructure/docker/docker-compose.yml build ml-service

echo ""
echo "[3/6] Rebuilding backend server..."
docker compose -f infrastructure/docker/docker-compose.yml build server

echo ""
echo "[4/6] Starting all services..."
docker compose -f infrastructure/docker/docker-compose.yml up -d

echo ""
echo "[5/6] Waiting for services to start (30 seconds)..."
sleep 30

echo ""
echo "[6/6] Checking service status..."
docker compose -f infrastructure/docker/docker-compose.yml ps

echo ""
echo "============================================"
echo "Service Health Checks"
echo "============================================"

echo ""
echo "PostgreSQL:"
docker compose -f infrastructure/docker/docker-compose.yml exec -T postgres pg_isready -U silentstalk || echo "❌ PostgreSQL not ready"

echo ""
echo "MongoDB:"
docker compose -f infrastructure/docker/docker-compose.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" --quiet || echo "❌ MongoDB not ready"

echo ""
echo "Redis:"
docker compose -f infrastructure/docker/docker-compose.yml exec -T redis redis-cli -a redis_dev_password ping || echo "❌ Redis not ready"

echo ""
echo "Backend Server:"
curl -f http://localhost:5000/health 2>/dev/null && echo "✅ Backend healthy" || echo "❌ Backend not responding"

echo ""
echo "ML Service:"
curl -f http://localhost:8000/health 2>/dev/null && echo "✅ ML Service healthy" || echo "❌ ML Service not responding"

echo ""
echo "Frontend:"
curl -f http://localhost:3000 2>/dev/null && echo "✅ Frontend healthy" || echo "❌ Frontend not responding"

echo ""
echo "============================================"
echo "Service Logs"
echo "============================================"

echo ""
echo "Server logs (last 50 lines):"
docker compose -f infrastructure/docker/docker-compose.yml logs server --tail=50

echo ""
echo "ML Service logs (last 50 lines):"
docker compose -f infrastructure/docker/docker-compose.yml logs ml-service --tail=50

echo ""
echo "============================================"
echo "Complete!"
echo "============================================"
echo ""
echo "Services:"
echo "  - Backend API: http://localhost:5000"
echo "  - Swagger Docs: http://localhost:5000/swagger"
echo "  - ML Service: http://localhost:8000"
echo "  - ML API Docs: http://localhost:8000/docs"
echo "  - Frontend: http://localhost:3000"
echo "  - Kibana: http://localhost:5601"
echo "  - MinIO Console: http://localhost:9001"
echo ""
