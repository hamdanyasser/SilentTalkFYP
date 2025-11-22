#!/bin/bash
# Quick Start Script for SilentTalk
# Usage: ./quick-start.sh

cd "$(dirname "$0")"

echo "🚀 Starting SilentTalk (Quick Mode)..."

# Start Docker services in background
cd server
docker-compose up -d > /dev/null 2>&1 &

# Start backend in background
cd src/SilentTalk.Api
dotnet run > ../../../server/backend.log 2>&1 &
echo $! > ../../../backend.pid

# Start frontend in background
cd ../../../client
npm run dev > frontend.log 2>&1 &
echo $! > frontend.pid

# Start ML service in background
cd ../ml-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload > ml-service.log 2>&1 &
echo $! > ml-service.pid

cd ..

echo "⏳ Waiting for services to start..."
sleep 8

echo ""
echo "✅ SilentTalk Started!"
echo ""
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:5000/swagger"
echo "🤖 ML Service: http://localhost:8002/docs"
echo ""
echo "💡 Check status: ./check-services.sh"
echo "🛑 Stop all: ./stop-all-services.sh"
