#!/bin/bash
set -e

echo "============================================"
echo "SilentTalk Server - Starting..."
echo "============================================"

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
else
    echo "✅ Migrations directory exists"
fi

# ============================================
# Apply Database Migrations
# ============================================
echo "============================================"
echo "Applying database migrations..."
echo "============================================"

cd /app
dotnet ef database update \
    --project src/SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj \
    --startup-project src/SilentTalk.Api/SilentTalk.Api.csproj \
    --verbose

if [ $? -eq 0 ]; then
    echo "✅ Migrations applied successfully"
else
    echo "❌ Migration failed! Checking migration status..."
    dotnet ef migrations list \
        --project src/SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj \
        --startup-project src/SilentTalk.Api/SilentTalk.Api.csproj
fi

# ============================================
# Start the Application
# ============================================
echo "============================================"
echo "Starting ASP.NET Core application..."
echo "============================================"

exec dotnet watch run --project src/SilentTalk.Api/SilentTalk.Api.csproj --no-launch-profile
