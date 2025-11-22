#!/bin/bash

# SilentTalk FYP - Comprehensive Startup Script
# This script starts all services and verifies they are running correctly

set -e

echo "========================================="
echo "SilentTalk FYP - Starting All Services"
echo "========================================="

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check prerequisites
echo ""
echo "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    print_info "Please ensure Docker Desktop is running (for WSL2)"
    exit 1
fi
print_success "Docker is available"

# Check .NET
if ! command -v dotnet &> /dev/null; then
    print_error ".NET SDK is not installed"
    exit 1
fi
print_success ".NET SDK is available"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_success "Node.js is available"

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed"
    exit 1
fi
print_success "Python 3 is available"

echo ""
echo "========================================="
echo "Step 1: Starting Database Services"
echo "========================================="

cd /home/user/SilentTalkFYP/infrastructure/docker

# Check if containers are already running
if docker compose ps | grep -q "postgres.*running"; then
    print_warning "PostgreSQL is already running"
else
    print_info "Starting PostgreSQL..."
    docker compose up -d postgres
    sleep 3
    print_success "PostgreSQL started"
fi

if docker compose ps | grep -q "mongodb.*running"; then
    print_warning "MongoDB is already running"
else
    print_info "Starting MongoDB..."
    docker compose up -d mongodb
    sleep 3
    print_success "MongoDB started"
fi

# Verify database connectivity
echo ""
echo "Verifying database connectivity..."
sleep 2

if docker exec silentstalk-postgres psql -U silentstalk -d silentstalk_db -c "SELECT 1;" &> /dev/null; then
    print_success "PostgreSQL is accepting connections"
else
    print_error "PostgreSQL is not accepting connections"
fi

if docker exec silentstalk-mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    print_success "MongoDB is accepting connections"
else
    print_warning "MongoDB connectivity check failed (may still be starting)"
fi

echo ""
echo "========================================="
echo "Step 2: Starting ML Service (Port 8002)"
echo "========================================="

cd /home/user/SilentTalkFYP/ml-service

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_warning "Virtual environment not found. Creating..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    print_success "Virtual environment created and dependencies installed"
else
    print_success "Virtual environment found"
fi

# Check if already running
if lsof -i :8002 &> /dev/null || netstat -tuln 2>/dev/null | grep -q ":8002" || ss -tuln 2>/dev/null | grep -q ":8002"; then
    print_warning "Port 8002 is already in use. Skipping ML service startup."
    print_info "If you need to restart it, kill the existing process first"
else
    print_info "Starting ML Service in background..."
    source venv/bin/activate
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload > ml-service.log 2>&1 &
    echo $! > ml-service.pid
    sleep 3

    if lsof -i :8002 &> /dev/null || netstat -tuln 2>/dev/null | grep -q ":8002" || ss -tuln 2>/dev/null | grep -q ":8002"; then
        print_success "ML Service started on port 8002"
        print_info "Logs: /home/user/SilentTalkFYP/ml-service/ml-service.log"
        print_info "PID saved to: /home/user/SilentTalkFYP/ml-service/ml-service.pid"
    else
        print_error "ML Service failed to start. Check ml-service.log"
    fi
fi

echo ""
echo "========================================="
echo "Step 3: Starting Backend API (Port 5000)"
echo "========================================="

cd /home/user/SilentTalkFYP/server

# Check if already running
if lsof -i :5000 &> /dev/null || netstat -tuln 2>/dev/null | grep -q ":5000" || ss -tuln 2>/dev/null | grep -q ":5000"; then
    print_warning "Port 5000 is already in use. Skipping Backend API startup."
    print_info "If you need to restart it, kill the existing process first"
else
    print_info "Starting Backend API in background..."
    export ASPNETCORE_ENVIRONMENT=Development
    nohup dotnet run --project src/SilentTalk.Api/SilentTalk.Api.csproj > backend.log 2>&1 &
    echo $! > backend.pid

    # Wait for startup (ASP.NET can take a while)
    print_info "Waiting for backend to start (this may take 10-15 seconds)..."
    for i in {1..30}; do
        sleep 1
        if curl -s http://localhost:5000/health > /dev/null 2>&1; then
            print_success "Backend API started on port 5000"
            print_info "Logs: /home/user/SilentTalkFYP/server/backend.log"
            print_info "PID saved to: /home/user/SilentTalkFYP/server/backend.pid"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Backend API failed to start within 30 seconds. Check backend.log"
        fi
    done
fi

echo ""
echo "========================================="
echo "Step 4: Starting Frontend (Port 3001)"
echo "========================================="

cd /home/user/SilentTalkFYP/client

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install --legacy-peer-deps --ignore-scripts
    print_success "Dependencies installed"
fi

# Check if already running
if lsof -i :3001 &> /dev/null || netstat -tuln 2>/dev/null | grep -q ":3001" || ss -tuln 2>/dev/null | grep -q ":3001"; then
    print_warning "Port 3001 is already in use. Skipping Frontend startup."
    print_info "If you need to restart it, kill the existing process first"
else
    print_info "Starting Frontend in background..."
    nohup npm run dev -- --port 3001 > frontend.log 2>&1 &
    echo $! > frontend.pid
    sleep 5

    if lsof -i :3001 &> /dev/null || netstat -tuln 2>/dev/null | grep -q ":3001" || ss -tuln 2>/dev/null | grep -q ":3001"; then
        print_success "Frontend started on port 3001"
        print_info "Logs: /home/user/SilentTalkFYP/client/frontend.log"
        print_info "PID saved to: /home/user/SilentTalkFYP/client/frontend.pid"
    else
        print_error "Frontend failed to start. Check frontend.log"
    fi
fi

echo ""
echo "========================================="
echo "Verification"
echo "========================================="

sleep 2

echo ""
echo "Checking service endpoints..."

# Check Backend API
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    print_success "Backend API: http://localhost:5000 - HEALTHY"
else
    print_error "Backend API: http://localhost:5000 - NOT RESPONDING"
fi

# Check ML Service
if curl -s http://localhost:8002/health > /dev/null 2>&1; then
    print_success "ML Service: http://localhost:8002 - HEALTHY"
else
    print_error "ML Service: http://localhost:8002 - NOT RESPONDING"
fi

# Check Frontend
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_success "Frontend: http://localhost:3001 - ACCESSIBLE"
else
    print_error "Frontend: http://localhost:3001 - NOT RESPONDING"
fi

echo ""
echo "========================================="
echo "Summary"
echo "========================================="
echo ""
echo "Services should now be running:"
echo "  • Frontend:    http://localhost:3001"
echo "  • Backend API: http://localhost:5000"
echo "  • ML Service:  http://localhost:8002"
echo "  • API Docs:    http://localhost:5000/swagger"
echo "  • ML Docs:     http://localhost:8002/docs"
echo ""
echo "Database Services (Docker):"
echo "  • PostgreSQL:  localhost:5432"
echo "  • MongoDB:     localhost:27017"
echo ""
echo "Log files:"
echo "  • ML Service:  /home/user/SilentTalkFYP/ml-service/ml-service.log"
echo "  • Backend API: /home/user/SilentTalkFYP/server/backend.log"
echo "  • Frontend:    /home/user/SilentTalkFYP/client/frontend.log"
echo ""
echo "To stop all services, run: ./stop-all-services.sh"
echo ""
echo "========================================="
