#!/bin/bash
# Don't use set -e so we can continue even if migrations fail

echo "============================================"
echo "SilentTalk Server - Starting..."
echo "============================================"

# Clean up ALL stale build artifacts to prevent "Text file busy" errors
echo "🧹 Cleaning up ALL build artifacts..."
rm -rf /app/src/SilentTalk.Api/bin 2>/dev/null || true
rm -rf /app/src/SilentTalk.Api/obj 2>/dev/null || true
rm -rf /app/src/SilentTalk.Application/bin 2>/dev/null || true
rm -rf /app/src/SilentTalk.Application/obj 2>/dev/null || true
rm -rf /app/src/SilentTalk.Domain/bin 2>/dev/null || true
rm -rf /app/src/SilentTalk.Domain/obj 2>/dev/null || true
rm -rf /app/src/SilentTalk.Infrastructure/bin 2>/dev/null || true
rm -rf /app/src/SilentTalk.Infrastructure/obj 2>/dev/null || true
echo "✅ Build artifacts cleaned"

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

# Apply migrations - continue even if it fails (DB might already be set up)
dotnet ef database update --project ../SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj --startup-project SilentTalk.Api.csproj --verbose || {
    echo "⚠️ Migration command returned non-zero. Checking if we can continue..."
    echo "Attempting to start anyway (database might already be migrated)..."
}

echo "============================================"

# ============================================
# Start the Application
# ============================================
echo "🚀 Starting application..."
exec dotnet run --project SilentTalk.Api.csproj --no-launch-profile
