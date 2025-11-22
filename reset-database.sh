#!/bin/bash

# SilentTalk - Reset Database Script
# This script cleans up duplicate migrations and resets the database

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
echo "SilentTalk - Database Reset"
echo "========================================="
echo ""

cd $PROJECT_ROOT/server

# Step 1: Drop the database
print_info "Dropping existing database..."
if docker exec silents-talk-postgres psql -U silentstalk -d postgres -c "DROP DATABASE IF EXISTS silentstalk_db;" 2>/dev/null; then
    print_success "Database dropped"
else
    print_error "Failed to drop database (may not exist yet)"
fi

# Step 2: Recreate the database
print_info "Creating fresh database..."
if docker exec silents-talk-postgres psql -U silentstalk -d postgres -c "CREATE DATABASE silentstalk_db OWNER silentstalk;" 2>/dev/null; then
    print_success "Database created"
else
    print_error "Failed to create database"
    exit 1
fi

# Step 3: Remove all migrations
print_info "Removing old migration files..."
rm -rf src/SilentTalk.Infrastructure/Migrations/*.cs
rm -rf src/SilentTalk.Infrastructure/Migrations/*.Designer.cs
print_success "Old migrations removed"

# Step 4: Create fresh migration
print_info "Creating fresh migration..."
if dotnet ef migrations add InitialCreate \
    --project src/SilentTalk.Infrastructure \
    --startup-project src/SilentTalk.Api \
    --output-dir Migrations 2>&1; then
    print_success "Fresh migration created"
else
    print_info "EF Core tools not installed. Migrations will be created on first run."
fi

# Step 5: Build the project to verify everything compiles
print_info "Building project..."
if dotnet build src/SilentTalk.Api/SilentTalk.Api.csproj > /dev/null 2>&1; then
    print_success "Project builds successfully"
else
    print_error "Build failed. Check for compilation errors."
    dotnet build src/SilentTalk.Api/SilentTalk.Api.csproj
    exit 1
fi

echo ""
echo "========================================="
print_success "Database reset complete!"
echo "========================================="
echo ""
print_info "Next steps:"
echo "  1. Run: cd $PROJECT_ROOT"
echo "  2. Run: ./restart-backend.sh"
echo ""
print_info "The backend will apply migrations automatically on startup."
echo ""
