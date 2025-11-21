# 🚀 Quick Start - Fix and Test All Services

## Run This Command:

Since there's a path issue between your WSL terminal and the actual project location, run this:

```bash
bash /home/user/SilentTalkFYP/fix_and_test_all.sh
```

Or navigate to the correct path:

```bash
cd /home/user/SilentTalkFYP
./fix_and_test_all.sh
```

## All Available Scripts:

1. **Fix and test everything** (recommended):
   ```bash
   bash /home/user/SilentTalkFYP/fix_and_test_all.sh
   ```

2. **Run database migrations** (after server is running):
   ```bash
   bash /home/user/SilentTalkFYP/run_migrations.sh
   ```

3. **Diagnose server issues**:
   ```bash
   bash /home/user/SilentTalkFYP/diagnose_server.sh
   ```

## Quick Manual Test:

If you want to test manually:

```bash
cd /home/user/SilentTalkFYP

# Stop everything
docker compose -f infrastructure/docker/docker-compose.yml down

# Rebuild and start
docker compose -f infrastructure/docker/docker-compose.yml up --build -d

# Wait 30 seconds for services to start
sleep 30

# Check health
curl http://localhost:5000/health    # Backend
curl http://localhost:8000/health    # ML Service
curl http://localhost:3000           # Frontend

# View logs
docker compose -f infrastructure/docker/docker-compose.yml logs server --tail=50
docker compose -f infrastructure/docker/docker-compose.yml logs ml-service --tail=50
```

## See Service Status:

```bash
docker compose -f infrastructure/docker/docker-compose.yml ps
```
