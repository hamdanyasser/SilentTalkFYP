# SilentTalk FYP - Quick Start Guide

**Last Updated:** 2025-11-22

This guide provides step-by-step instructions to get the entire SilentTalk FYP project running on your local machine.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Automated)](#quick-start-automated)
3. [Manual Setup](#manual-setup)
4. [Verification](#verification)
5. [Common Issues](#common-issues)
6. [Project Structure](#project-structure)

---

## Prerequisites

Ensure the following are installed and running:

- ✅ **Docker Desktop** (with WSL2 integration enabled)
- ✅ **.NET SDK 8.0**
- ✅ **Node.js 20.x**
- ✅ **Python 3.12** (with venv support)

### Verify Prerequisites

```bash
# Check Docker
docker --version
docker compose version

# Check .NET
dotnet --version

# Check Node.js
node --version
npm --version

# Check Python
python3 --version
```

---

## Quick Start (Automated)

### Step 1: Apply Bug Fixes (First Time Only)

```bash
cd /home/user/SilentTalkFYP
./apply-fixes.sh
```

This script automatically fixes:
- ✅ Creates `appsettings.Development.json` with correct database credentials
- ✅ Updates frontend `.env` to use ML service on port 8002
- ✅ Fixes CORS configuration to allow port 3001
- ✅ Comments out Redis health check (not running)
- ✅ Creates backups of modified files

### Step 2: Start All Services

```bash
./start-all-services.sh
```

This script will:
1. Start PostgreSQL and MongoDB (Docker containers)
2. Start ML Service on port 8002 (background)
3. Start Backend API on port 5000 (background)
4. Start Frontend on port 3001 (background)
5. Verify all services are running

### Step 3: Access the Application

Open your browser and navigate to:

- **Frontend Application:** http://localhost:3001
- **Backend API (Swagger):** http://localhost:5000/swagger
- **ML Service (Docs):** http://localhost:8002/docs

### Step 4: Stop All Services

When you're done:

```bash
./stop-all-services.sh
```

---

## Manual Setup

If you prefer manual control or need to debug:

### 1. Start Databases

```bash
cd /home/user/SilentTalkFYP/infrastructure/docker
docker compose up -d postgres mongodb
```

Verify:
```bash
docker compose ps
docker exec silentstalk-postgres psql -U silentstalk -d silentstalk_db -c "SELECT 1;"
```

### 2. Start ML Service

```bash
cd /home/user/SilentTalkFYP/ml-service

# Create virtual environment (first time only)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start service
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

**Expected Output:**
```
INFO:     Will watch for changes in these directories: ['/home/user/SilentTalkFYP/ml-service']
INFO:     Uvicorn running on http://0.0.0.0:8002 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using StatReload
```

**Note:** You'll see warnings about missing ONNX model - this is expected.

### 3. Start Backend API

Open a new terminal:

```bash
cd /home/user/SilentTalkFYP/server

# Set environment to Development
export ASPNETCORE_ENVIRONMENT=Development

# Start backend
dotnet run --project src/SilentTalk.Api/SilentTalk.Api.csproj
```

**Expected Output:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://0.0.0.0:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

### 4. Start Frontend

Open a new terminal:

```bash
cd /home/user/SilentTalkFYP/client

# Install dependencies (first time only)
npm install --legacy-peer-deps --ignore-scripts

# Start frontend
npm run dev -- --port 3001
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3001/
  ➜  Network: use --host to expose
```

---

## Verification

### Check Service Health

Run these commands to verify all services are running:

```bash
# Backend API
curl http://localhost:5000/health | jq .

# ML Service
curl http://localhost:8002/health | jq .

# Frontend (returns HTML)
curl -s http://localhost:3001 | head -20
```

### Check Database Connectivity

```bash
# PostgreSQL
docker exec silentstalk-postgres psql -U silentstalk -d silentstalk_db -c "SELECT COUNT(*) FROM \"__EFMigrationsHistory\";"

# MongoDB
docker exec silentstalk-mongodb mongosh -u silentstalk -p silentstalk123 --authenticationDatabase admin silentstalk --eval "db.stats()"
```

### Check Logs

If services are running in background, check logs:

```bash
# ML Service
tail -f /home/user/SilentTalkFYP/ml-service/ml-service.log

# Backend API
tail -f /home/user/SilentTalkFYP/server/backend.log

# Frontend
tail -f /home/user/SilentTalkFYP/client/frontend.log
```

---

## Common Issues

### Issue 1: Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Find and kill process using the port
lsof -ti:5000 | xargs kill -9   # Backend
lsof -ti:8002 | xargs kill -9   # ML Service
lsof -ti:3001 | xargs kill -9   # Frontend
```

### Issue 2: Docker Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
1. Open Docker Desktop
2. Ensure WSL2 integration is enabled
3. Wait for Docker to fully start
4. Run: `docker ps` to verify

### Issue 3: Database Connection Failed

**Error:** `Cannot connect to database`

**Solution:**
1. Verify Docker containers are running:
   ```bash
   docker compose ps
   ```
2. Check password in `appsettings.Development.json` matches Docker Compose
3. Restart database containers:
   ```bash
   docker compose restart postgres mongodb
   ```

### Issue 4: CORS Errors in Browser

**Error:** `Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3001' has been blocked by CORS policy`

**Solution:**
Run the fix script again:
```bash
./apply-fixes.sh
```

Then restart the backend.

### Issue 5: ML Service WebSocket Connection Failed

**Error:** `Failed to start recognition. Check ML service connection.`

**Solution:**
1. Verify ML service is running on port 8002:
   ```bash
   curl http://localhost:8002/health
   ```
2. Check frontend `.env` file has correct URL:
   ```bash
   cat client/.env | grep VITE_ML_SERVICE_URL
   ```
   Should be: `ws://localhost:8002/streaming/ws/recognize`

### Issue 6: Frontend npm Install Fails

**Error:** `Cannot read property 'x' of undefined` during `npm install`

**Solution:**
```bash
cd client
npm install --legacy-peer-deps --ignore-scripts
```

---

## Project Structure

```
SilentTalkFYP/
├── server/                    # ASP.NET Core Backend
│   ├── src/
│   │   ├── SilentTalk.Api/           # API Controllers, Program.cs
│   │   ├── SilentTalk.Application/   # Services, Validators
│   │   ├── SilentTalk.Domain/        # Entities, Interfaces
│   │   └── SilentTalk.Infrastructure/ # Repositories, DbContext
│   └── backend.log            # Backend logs (if running in background)
│
├── client/                    # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   └── types/            # TypeScript types
│   ├── .env                  # Environment variables
│   └── frontend.log          # Frontend logs (if running in background)
│
├── ml-service/               # Python FastAPI ML Service
│   ├── app/
│   │   ├── api/             # FastAPI routers
│   │   ├── services/        # ML services (MediaPipe, ONNX)
│   │   └── main.py          # FastAPI application
│   ├── venv/                # Python virtual environment
│   └── ml-service.log       # ML service logs (if running in background)
│
├── infrastructure/
│   └── docker/
│       └── docker-compose.yml  # Database services (PostgreSQL, MongoDB)
│
├── start-all-services.sh     # Automated startup script
├── stop-all-services.sh      # Automated shutdown script
├── apply-fixes.sh            # Bug fix script
├── BUG_REPORT_AND_FIXES.md   # Detailed bug report
└── QUICK_START_GUIDE.md      # This file
```

---

## Service Ports

| Service        | Port | URL                                    |
|----------------|------|----------------------------------------|
| Frontend       | 3001 | http://localhost:3001                  |
| Backend API    | 5000 | http://localhost:5000                  |
| Swagger Docs   | 5000 | http://localhost:5000/swagger          |
| ML Service     | 8002 | http://localhost:8002                  |
| ML Docs        | 8002 | http://localhost:8002/docs             |
| PostgreSQL     | 5432 | Host: localhost, DB: silentstalk_db    |
| MongoDB        | 27017| Host: localhost, DB: silentstalk       |

---

## Next Steps

After getting everything running:

1. **Test User Registration:**
   - Navigate to http://localhost:3001
   - Click "Sign Up" and create a test account
   - Verify email confirmation (if enabled)

2. **Test Sign Language Recognition:**
   - Grant camera permissions in browser
   - Navigate to Video Call page
   - Start recognition
   - Perform ASL signs (if model is trained)

3. **Train ML Model (Optional):**
   ```bash
   cd ml-service
   python app/train.py --dataset data/asl_alphabet --epochs 50 --export-onnx
   ```

4. **Run Tests:**
   ```bash
   # Backend tests
   cd server
   dotnet test

   # Frontend tests
   cd client
   npm test
   ```

5. **Review Documentation:**
   - Read `BUG_REPORT_AND_FIXES.md` for detailed issue information
   - Check `PROJECT_STATUS_REPORT.md` for FYP requirements

---

## Support

For issues or questions:

1. Check `BUG_REPORT_AND_FIXES.md` for known issues
2. Review logs in service directories
3. Ensure all prerequisites are installed
4. Verify Docker Desktop is running (for WSL2)

---

**Happy Coding! 🚀**
