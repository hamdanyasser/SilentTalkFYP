#!/bin/bash
# ============================================
# SilentTalk - Quick Start Script
# Run this script to start the entire application
# ============================================

set -e

echo "🚀 Starting SilentTalk Application..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Navigate to project root
cd ~/SilentTalkFYP

# Start Docker infrastructure first
echo "▶️  Starting Docker containers (PostgreSQL, MongoDB, Redis, etc.)..."
cd infrastructure/docker
docker compose up -d

echo ""
echo "⏳ Waiting 10-15 seconds for containers to initialize..."
sleep 15

# Return to project root
cd ~/SilentTalkFYP

# Start backend API
echo ""
echo "▶️  Starting Backend API..."
if [ -d "server" ]; then
    cd server
    if [ ! -d "bin" ]; then
        echo "   Building backend..."
        dotnet build > /dev/null 2>&1
    fi
    dotnet run --no-build > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   Backend started (PID: $BACKEND_PID)"
    cd ..
fi

# Start frontend
echo ""
echo "▶️  Starting Frontend..."
if [ -d "client" ]; then
    cd client
    if [ ! -d "node_modules" ]; then
        echo "   Installing dependencies..."
        npm install > /dev/null 2>&1
    fi
    PORT=3001 npm start > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "   Frontend started (PID: $FRONTEND_PID)"
    cd ..
fi

echo ""
echo "⏳ Waiting for all services to start..."
echo "   (This takes about 10-15 seconds)"
sleep 10

echo ""
echo "=========================================="
echo "✅ SilentTalk Application Started!"
echo "=========================================="
echo ""
echo "🌐 Access your application at:"
echo "   Frontend:      http://localhost:3001"
echo "   (You'll see the new teal/green color scheme)"
echo ""
echo "📊 To check that everything is running properly:"
echo "   ./check-services.sh"
echo ""
echo "🛑 To stop the application:"
echo "   ./stop.sh"
echo ""
echo "📝 Logs are available at:"
echo "   Backend:  /tmp/backend.log"
echo "   Frontend: /tmp/frontend.log"
echo ""
