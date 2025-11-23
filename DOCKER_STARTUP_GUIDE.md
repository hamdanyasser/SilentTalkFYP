# SilentTalk - Docker Startup Guide

## 🚀 Quick Start (Run Everything with Docker)

This guide will help you start the complete SilentTalk application using Docker.

### Prerequisites

- Docker and Docker Compose installed
- Ports available: 3000, 5000, 5432, 6379, 8000, 9000, 9001, 27017

---

## Step 1: Navigate to Docker Directory

```bash
cd ~/SilentTalkFYP/infrastructure/docker
```

## Step 2: Stop Any Existing Containers

```bash
docker-compose down
# or
docker compose down
```

## Step 3: Clean Up Networks (If Needed)

```bash
docker network prune -f
```

## Step 4: Rebuild Frontend (Important - npm install fix)

The frontend Dockerfile has been updated to use `npm install` instead of `npm ci`. You need to rebuild without cache:

```bash
docker-compose build --no-cache --pull client
# or
docker compose build --no-cache --pull client
```

## Step 5: Start All Services

```bash
docker-compose up -d postgres redis mongodb minio server ml-service client
# or
docker compose up -d postgres redis mongodb minio server ml-service client
```

## Step 6: Wait for Services to Initialize

Services need time to start up, especially the backend which runs database migrations:

```bash
sleep 90
```

## Step 7: Verify Services Are Running

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

You should see containers running:
- silents-talk-postgres
- silents-talk-redis
- silents-talk-mongodb
- silents-talk-minio
- silents-talk-server
- silents-talk-ml
- silents-talk-client

## Step 8: Check Service Health

### Backend API
```bash
curl http://localhost:5000/health
```
Expected: `{"status":"healthy",...}`

### ML Service
```bash
curl http://localhost:8000/status
```
Expected: JSON with model status (should show "mock" for demo mode)

### Frontend
```bash
curl -I http://localhost:3000
```
Expected: HTTP 200 OK

---

## 🌐 Access Your Application

Once all services are running:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React application |
| **Backend API** | http://localhost:5000 | REST API |
| **API Docs** | http://localhost:5000/docs | Swagger documentation |
| **ML Service** | http://localhost:8000 | ML inference API |
| **ML Docs** | http://localhost:8000/docs | FastAPI documentation |
| **MinIO Console** | http://localhost:9001 | Object storage (minioadmin/minioadmin123) |

---

## 📝 View Logs

### All Services
```bash
docker-compose logs -f
```

### Specific Service
```bash
docker-compose logs -f server       # Backend
docker-compose logs -f client       # Frontend
docker-compose logs -f ml-service   # ML Service
docker-compose logs -f postgres     # Database
```

---

## 🧪 Test the Application

### 1. Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPass123!",
    "confirmPassword":"TestPass123!",
    "displayName":"Test User"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPass123!"
  }'
```

Save the `token` from the response - you'll need it for authenticated requests.

### 3. Check ML Service Status

```bash
curl http://localhost:8000/status
```

Should show demo mode active.

---

## 🛑 Stop Services

```bash
docker-compose down
```

To also remove volumes (⚠️ deletes all data):
```bash
docker-compose down -v
```

---

## 🔧 Troubleshooting

### Frontend Build Fails with "npm ci" Error

**Problem:** Docker is using cached layers with old `npm ci` command

**Solution:**
```bash
# Force rebuild without cache
docker-compose build --no-cache --pull client
docker-compose up -d client
```

### Backend Won't Start / Migration Errors

**Problem:** Database not ready or migration issues

**Solution:**
```bash
# Check postgres is healthy
docker-compose ps postgres

# Restart server to retry migrations
docker-compose restart server

# View server logs
docker-compose logs -f server
```

### Port Already in Use

**Problem:** Port 3000, 5000, or 8000 is already occupied

**Solution:**
```bash
# Find what's using the port (Linux/Mac)
lsof -i :3000
lsof -i :5000
lsof -i :8000

# Kill the process or stop other Docker containers
docker ps
docker stop <container-name>
```

### Network Errors

**Problem:** Docker network conflicts

**Solution:**
```bash
docker-compose down
docker network prune -f
docker-compose up -d
```

### Services Show as "Unhealthy"

**Problem:** Health checks failing

**Solution:**
```bash
# Check specific service logs
docker-compose logs <service-name>

# Restart the unhealthy service
docker-compose restart <service-name>
```

---

## 🔍 Database Verification

### Check PostgreSQL Connection

```bash
docker exec -it silents-talk-postgres psql -U silentstalk -d silentstalk_db
```

Then run:
```sql
\dt                          -- List tables
SELECT * FROM "Users";       -- View users
\q                           -- Quit
```

### Check MongoDB Connection

```bash
docker exec -it silents-talk-mongodb mongosh -u admin -p admin_dev_password
```

---

## 📊 Complete Startup Command (One-Liner)

```bash
cd ~/SilentTalkFYP/infrastructure/docker && \
docker-compose down && \
docker network prune -f && \
docker-compose build --no-cache client && \
docker-compose up -d postgres redis mongodb minio server ml-service client && \
sleep 90 && \
echo "=== Service Status ===" && \
docker ps --format "table {{.Names}}\t{{.Status}}" && \
echo "" && \
echo "=== Health Checks ===" && \
curl -s http://localhost:5000/health && echo "" && \
curl -s http://localhost:8000/status && echo "" && \
echo "=== Access URLs ===" && \
echo "Frontend: http://localhost:3000" && \
echo "Backend:  http://localhost:5000/docs" && \
echo "ML API:   http://localhost:8000/docs"
```

---

## ✅ Success Indicators

Your application is ready when:

- ✅ All containers show "Up" status in `docker ps`
- ✅ Backend health check returns healthy: `curl http://localhost:5000/health`
- ✅ ML service status shows demo mode: `curl http://localhost:8000/status`
- ✅ Frontend is accessible: `curl http://localhost:3000`
- ✅ You can register and login users
- ✅ Database persists data across `docker-compose restart server`

---

**Ready to develop!** 🎉

All services are now running and ready for frontend development and testing.
