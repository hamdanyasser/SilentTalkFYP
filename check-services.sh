#!/bin/bash

# SilentTalk - Service Status Checker
# Quick check to see if all services are running

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

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

echo "========================================="
echo "SilentTalk - Service Status Check"
echo "========================================="
echo ""

# Check Docker containers
print_info "Checking Docker containers..."

if docker ps | grep -q silents-talk-postgres; then
    print_success "PostgreSQL container is running"
else
    print_error "PostgreSQL container is NOT running"
fi

if docker ps | grep -q silents-talk-mongo; then
    print_success "MongoDB container is running"
else
    print_error "MongoDB container is NOT running"
fi

echo ""

# Check PostgreSQL connectivity
print_info "Checking PostgreSQL database connectivity..."
if docker exec silents-talk-postgres psql -U silentstalk -d silentstalk_db -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "PostgreSQL database is accessible"
else
    print_error "PostgreSQL database is NOT accessible"
fi

# Check MongoDB connectivity
print_info "Checking MongoDB database connectivity..."
if docker exec silents-talk-mongo mongosh -u silentstalk -p silentstalk123 --authenticationDatabase admin --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_success "MongoDB database is accessible"
else
    print_error "MongoDB database is NOT accessible"
fi

echo ""

# Check Backend API
print_info "Checking Backend API (port 5000)..."
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    print_success "Backend API is responding"
    HEALTH_STATUS=$(curl -s http://localhost:5000/health)
    echo "   Status: $HEALTH_STATUS"
else
    print_error "Backend API is NOT responding"
fi

# Check if backend process is running
if [ -f "$PROJECT_ROOT/server/backend.pid" ]; then
    PID=$(cat "$PROJECT_ROOT/server/backend.pid")
    if ps -p $PID > /dev/null 2>&1; then
        print_success "Backend process is running (PID: $PID)"
    else
        print_error "Backend PID file exists but process is NOT running"
    fi
else
    print_error "Backend PID file not found"
fi

echo ""

# Check Frontend
print_info "Checking Frontend (port 3001)..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_success "Frontend is responding"
else
    print_error "Frontend is NOT responding"
fi

# Check if frontend process is running
if [ -f "$PROJECT_ROOT/client/frontend.pid" ]; then
    PID=$(cat "$PROJECT_ROOT/client/frontend.pid")
    if ps -p $PID > /dev/null 2>&1; then
        print_success "Frontend process is running (PID: $PID)"
    else
        print_error "Frontend PID file exists but process is NOT running"
    fi
else
    print_error "Frontend PID file not found"
fi

echo ""

# Check ML Service
print_info "Checking ML Service (port 8002)..."
if curl -s http://localhost:8002/health > /dev/null 2>&1; then
    print_success "ML Service is responding"
    HEALTH_STATUS=$(curl -s http://localhost:8002/health)
    echo "   Status: $HEALTH_STATUS"
else
    print_error "ML Service is NOT responding"
fi

# Check if ML service process is running
if [ -f "$PROJECT_ROOT/ml-service/ml-service.pid" ]; then
    PID=$(cat "$PROJECT_ROOT/ml-service/ml-service.pid")
    if ps -p $PID > /dev/null 2>&1; then
        print_success "ML Service process is running (PID: $PID)"
    else
        print_error "ML Service PID file exists but process is NOT running"
    fi
else
    print_error "ML Service PID file not found"
fi

echo ""
echo "========================================="
echo "Service URLs"
echo "========================================="
echo "Frontend:    http://localhost:3001"
echo "Backend API: http://localhost:5000/swagger"
echo "ML Service:  http://localhost:8002/docs"
echo ""
echo "========================================="
echo "Quick Commands"
echo "========================================="
echo "View Backend Logs:  tail -f $PROJECT_ROOT/server/backend.log"
echo "View Frontend Logs: tail -f $PROJECT_ROOT/client/frontend.log"
echo "View ML Logs:       tail -f $PROJECT_ROOT/ml-service/ml-service.log"
echo ""
echo "Start All Services: $PROJECT_ROOT/start-all-services.sh"
echo "Stop All Services:  $PROJECT_ROOT/stop-all-services.sh"
echo "Restart Backend:    $PROJECT_ROOT/restart-backend.sh"
echo "Reset Database:     $PROJECT_ROOT/reset-database.sh"
echo ""
