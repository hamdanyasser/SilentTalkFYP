#!/bin/bash
set -e

echo "============================================"
echo "SilentTalk Server - Starting..."
echo "============================================"

# Navigate to the project directory
cd /app/src/SilentTalk.Api

# ============================================
# Check and Create Migrations if Needed
# ============================================
MIGRATIONS_DIR="/app/src/SilentTalk.Infrastructure/Migrations"

if [ ! -d "$MIGRATIONS_DIR" ] || [ -z "$(ls -A $MIGRATIONS_DIR 2>/dev/null)" ]; then
    echo "============================================"
    echo "No migrations found. Creating initial migration..."
    echo "============================================"

    cd /app
    dotnet ef migrations add InitialCreate \
        --project src/SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj \
        --startup-project src/SilentTalk.Api/SilentTalk.Api.csproj \
        --output-dir Migrations \
        --verbose

    if [ $? -eq 0 ]; then
        echo "✅ Migration created successfully"
    else
        echo "❌ Migration creation failed!"
        exit 1
    fi

    cd /app/src/SilentTalk.Api
else
    echo "✅ Migrations directory exists"
fi

# ============================================
# Apply Database Migrations
# ============================================
echo "============================================"
echo "Applying database migrations..."
echo "============================================"

# Apply migrations using dotnet ef
# Docker Compose healthchecks ensure PostgreSQL is ready
dotnet ef database update --project ../SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj --startup-project SilentTalk.Api.csproj --verbose || {
    echo "❌ Migration failed! Checking migration status..."
    dotnet ef migrations list --project ../SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj --startup-project SilentTalk.Api.csproj
    exit 1
}

echo "✅ Migrations applied successfully!"
echo "============================================"

# ============================================
# Start the Application
# ============================================
echo "🚀 Starting application..."
exec dotnet watch run --project SilentTalk.Api.csproj --no-launch-profile
