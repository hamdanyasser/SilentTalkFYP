# SilentTalk - Quick Start Guide

## 🚀 Starting the Application

### Method 1: Simple One Command (Recommended)

```bash
cd ~/SilentTalkFYP
./start.sh
```

That's it! Wait 60 seconds and your application will be ready at http://localhost:3000

### Method 2: Manual Commands

```bash
cd ~/SilentTalkFYP/infrastructure/docker
docker-compose up -d
```

Wait about 60-90 seconds for all services to start, then access the application.

---

## 🛑 Stopping the Application

### Method 1: Simple Command

```bash
cd ~/SilentTalkFYP
./stop.sh
```

### Method 2: Manual Command

```bash
cd ~/SilentTalkFYP/infrastructure/docker
docker-compose down
```

---

## 📋 Complete Workflow

### First Time After Laptop Restart

1. **Open Terminal**

2. **Navigate to project:**
   ```bash
   cd ~/SilentTalkFYP
   ```

3. **Start everything:**
   ```bash
   ./start.sh
   ```

4. **Wait 60 seconds** - The script will show you when services are ready

5. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/docs
   - ML Service: http://localhost:8000/docs

### When You're Done Working

```bash
cd ~/SilentTalkFYP
./stop.sh
```

---

## 🌐 Access URLs

Once started, access your application at:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React application |
| **Backend API** | http://localhost:5000/docs | Swagger API docs |
| **ML Service** | http://localhost:8000/docs | ML API docs |
| **MinIO** | http://localhost:9001 | Storage console (minioadmin/minioadmin123) |
| **Kibana** | http://localhost:5601 | Log analytics |

---

## 📝 Useful Commands

### View Logs

```bash
# All services
cd ~/SilentTalkFYP/infrastructure/docker
docker-compose logs -f

# Specific service
docker-compose logs -f server      # Backend
docker-compose logs -f client      # Frontend
docker-compose logs -f ml-service  # ML Service
```

### Check Service Status

```bash
cd ~/SilentTalkFYP/infrastructure/docker
docker-compose ps
```

### Restart a Single Service

```bash
cd ~/SilentTalkFYP/infrastructure/docker
docker-compose restart server      # Restart backend
docker-compose restart client      # Restart frontend
docker-compose restart ml-service  # Restart ML service
```

### Rebuild After Code Changes

```bash
cd ~/SilentTalkFYP/infrastructure/docker

# Rebuild specific service
docker-compose up -d --build client      # Rebuild frontend
docker-compose up -d --build server      # Rebuild backend
docker-compose up -d --build ml-service  # Rebuild ML service
```

---

## 🔧 Troubleshooting

### Services Won't Start

**Check if ports are already in use:**
```bash
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :8000  # ML Service
```

**Force clean restart:**
```bash
cd ~/SilentTalkFYP/infrastructure/docker
docker-compose down -v  # ⚠️ This deletes data!
docker-compose up -d
```

### Services Are Slow to Start

Some services (especially the backend) need time to:
- Connect to databases
- Run migrations
- Initialize

**Just wait 60-90 seconds after running start.sh**

### Check Service Health

```bash
# Backend
curl http://localhost:5000/health

# ML Service
curl http://localhost:8000/status

# Frontend
curl -I http://localhost:3000
```

---

## 💾 Data Persistence

Your data is stored in Docker volumes and **persists** between restarts:

- **PostgreSQL data**: User accounts, authentication
- **MongoDB data**: Messages, chat history
- **Redis data**: Sessions, cache
- **MinIO data**: Uploaded files, videos

**Data is preserved when you:**
- Stop services with `./stop.sh` or `docker-compose down`
- Restart your laptop
- Restart Docker

**Data is DELETED when you run:**
- `docker-compose down -v` (the `-v` flag removes volumes)

---

## ⚡ Quick Reference

| Action | Command |
|--------|---------|
| **Start everything** | `cd ~/SilentTalkFYP && ./start.sh` |
| **Stop everything** | `cd ~/SilentTalkFYP && ./stop.sh` |
| **View logs** | `cd ~/SilentTalkFYP/infrastructure/docker && docker-compose logs -f` |
| **Check status** | `cd ~/SilentTalkFYP/infrastructure/docker && docker-compose ps` |
| **Restart service** | `cd ~/SilentTalkFYP/infrastructure/docker && docker-compose restart <service>` |

---

## 🎯 Daily Development Workflow

### Morning (Starting Work)

```bash
cd ~/SilentTalkFYP
./start.sh
# Wait 60 seconds
# Open http://localhost:3000 in browser
```

### During Development

- Frontend code changes: Auto-reload (Vite hot module replacement)
- Backend code changes: Auto-reload (watch mode)
- ML service changes: Auto-reload (uvicorn --reload)

### Evening (Stopping Work)

```bash
cd ~/SilentTalkFYP
./stop.sh
```

---

## 📚 More Documentation

- **Complete Setup**: See `DOCKER_STARTUP_GUIDE.md`
- **Database Details**: See `DATABASE_PERSISTENCE_FIX.md`
- **ML Service**: See `ML_SERVICE_STATUS.md`
- **Project Overview**: See `FINAL_GUIDE.md`

---

**Need help?** Check the logs: `docker-compose logs -f [service_name]`
