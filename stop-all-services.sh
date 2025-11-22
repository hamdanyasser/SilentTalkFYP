#!/bin/bash

# SilentTalk FYP - Stop All Services Script

set -e

echo "========================================="
echo "SilentTalk FYP - Stopping All Services"
echo "========================================="

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Stop Frontend
if [ -f /home/user/SilentTalkFYP/client/frontend.pid ]; then
    PID=$(cat /home/user/SilentTalkFYP/client/frontend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        print_info "Stopping Frontend (PID: $PID)..."
        kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
        rm /home/user/SilentTalkFYP/client/frontend.pid
        print_success "Frontend stopped"
    else
        print_info "Frontend process not running"
        rm /home/user/SilentTalkFYP/client/frontend.pid
    fi
else
    print_info "No Frontend PID file found"
fi

# Stop Backend API
if [ -f /home/user/SilentTalkFYP/server/backend.pid ]; then
    PID=$(cat /home/user/SilentTalkFYP/server/backend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        print_info "Stopping Backend API (PID: $PID)..."
        kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
        rm /home/user/SilentTalkFYP/server/backend.pid
        print_success "Backend API stopped"
    else
        print_info "Backend API process not running"
        rm /home/user/SilentTalkFYP/server/backend.pid
    fi
else
    print_info "No Backend API PID file found"
fi

# Stop ML Service
if [ -f /home/user/SilentTalkFYP/ml-service/ml-service.pid ]; then
    PID=$(cat /home/user/SilentTalkFYP/ml-service/ml-service.pid)
    if ps -p $PID > /dev/null 2>&1; then
        print_info "Stopping ML Service (PID: $PID)..."
        kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
        rm /home/user/SilentTalkFYP/ml-service/ml-service.pid
        print_success "ML Service stopped"
    else
        print_info "ML Service process not running"
        rm /home/user/SilentTalkFYP/ml-service/ml-service.pid
    fi
else
    print_info "No ML Service PID file found"
fi

# Kill any remaining processes on the ports
print_info "Checking for any remaining processes on service ports..."
for port in 5000 8002 3001; do
    if command -v lsof &> /dev/null; then
        PID=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$PID" ]; then
            print_info "Killing process on port $port (PID: $PID)"
            kill -9 $PID 2>/dev/null || true
        fi
    fi
done

# Stop Docker containers
print_info "Stopping Docker containers..."
cd /home/user/SilentTalkFYP/infrastructure/docker
if command -v docker &> /dev/null; then
    docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
    print_success "Docker containers stopped"
else
    print_info "Docker not available, skipping container shutdown"
fi

echo ""
echo "========================================="
print_success "All services stopped"
echo "========================================="
