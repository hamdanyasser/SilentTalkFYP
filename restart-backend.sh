#!/bin/bash

# SilentTalk - Restart Backend API Script
# Use this to restart the backend after databases are ready

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

echo "========================================="
echo "Restarting Backend API"
echo "========================================="

cd $PROJECT_ROOT/server

# Stop existing backend if running
if [ -f backend.pid ]; then
    PID=$(cat backend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        print_info "Stopping existing backend (PID: $PID)..."
        kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
        rm backend.pid
        sleep 2
    fi
fi

# Kill any process on port 5000
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti:5000 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        print_info "Killing process on port 5000 (PID: $PID)"
        kill -9 $PID 2>/dev/null || true
        sleep 1
    fi
fi

# Wait for PostgreSQL to be ready
print_info "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec silents-talk-postgres psql -U silentstalk -d silentstalk_db -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "PostgreSQL is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        print_error "PostgreSQL did not become ready in time"
        exit 1
    fi
done

# Start backend
print_info "Starting Backend API..."
export ASPNETCORE_ENVIRONMENT=Development
nohup dotnet run --project src/SilentTalk.Api/SilentTalk.Api.csproj > backend.log 2>&1 &
echo $! > backend.pid

# Wait for backend to be ready
print_info "Waiting for backend to start..."
for i in {1..30}; do
    sleep 1
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        print_success "Backend API started successfully!"
        print_info "Logs: $PROJECT_ROOT/server/backend.log"
        print_info "PID: $(cat backend.pid)"
        echo ""
        print_success "Backend is running at http://localhost:5000"
        print_success "API Docs: http://localhost:5000/swagger"
        exit 0
    fi
done

print_error "Backend failed to start. Check backend.log for errors:"
echo ""
tail -30 backend.log
exit 1
