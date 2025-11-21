#!/bin/bash
set -e

echo "============================================"
echo "SilentTalk Server - Starting..."
echo "============================================"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until PGPASSWORD=silentstalk_dev_password psql -h postgres -U silentstalk -d silentstalk_db -c '\q' 2>/dev/null; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Navigate to the project directory
cd /app/src/SilentTalk.Api

echo "============================================"
echo "Applying database migrations..."
echo "============================================"

# Apply migrations using dotnet ef
dotnet ef database update --project ../SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj --startup-project SilentTalk.Api.csproj --verbose || {
    echo "❌ Migration failed! Checking migration status..."
    dotnet ef migrations list --project ../SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj --startup-project SilentTalk.Api.csproj
    exit 1
}

echo "✅ Migrations applied successfully!"
echo "============================================"

# Start the application with hot reload
echo "🚀 Starting application..."
exec dotnet watch run --project SilentTalk.Api.csproj --no-launch-profile
