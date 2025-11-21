#!/bin/bash
set -e

echo "============================================"
echo "SilentTalk - Run Database Migrations"
echo "============================================"

cd /home/user/SilentTalkFYP

# Check if server container is running
if ! docker ps | grep -q silents-talk-server; then
    echo "❌ Server container is not running!"
    echo "Start it with: docker compose -f infrastructure/docker/docker-compose.yml up -d server"
    exit 1
fi

echo ""
echo "Running Entity Framework migrations..."
echo ""

# Option 1: Run migrations inside the container
docker compose -f infrastructure/docker/docker-compose.yml exec server \
    dotnet ef database update \
    --project /app/src/SilentTalk.Infrastructure \
    --startup-project /app/src/SilentTalk.Api \
    --no-build

echo ""
echo "✅ Migrations completed successfully!"
echo ""
echo "Verify by connecting to PostgreSQL:"
echo "docker compose -f infrastructure/docker/docker-compose.yml exec postgres psql -U silentstalk -d silentstalk_db -c '\\dt'"
