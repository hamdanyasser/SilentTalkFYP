# SilentTalk Quick Start Guide

**Complete Step-by-Step Instructions to Run the Application**

---

## Table of Contents

1. [Prerequisites Installation](#prerequisites-installation)
2. [Project Setup](#project-setup)
3. [Database Configuration](#database-configuration)
4. [Starting the Application](#starting-the-application)
5. [Verification Steps](#verification-steps)
6. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
7. [Stopping the Application](#stopping-the-application)

---

## Prerequisites Installation

### 1. Install Docker & Docker Compose

**Windows:**
- Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- Docker Desktop includes Docker Compose
- Verify installation:
  ```bash
  docker --version
  docker compose version
  ```

**macOS:**
- Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
- Verify installation:
  ```bash
  docker --version
  docker compose version
  ```

**Linux (Ubuntu/Debian):**
```bash
# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 2. Install Node.js and npm

**Windows/macOS:**
- Download and install Node.js 20+ from [nodejs.org](https://nodejs.org/)
- npm is included with Node.js

**Linux:**
```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install .NET SDK 8.0

**Windows/macOS:**
- Download and install [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

**Linux:**
```bash
# Ubuntu/Debian
wget https://dot.net/v1/dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 8.0

# Add to PATH
echo 'export PATH=$PATH:$HOME/.dotnet' >> ~/.bashrc
source ~/.bashrc

# Verify installation
dotnet --version
```

### 4. Install Python 3.11+

**Windows:**
- Download and install Python 3.11+ from [python.org](https://www.python.org/downloads/)
- Make sure to check "Add Python to PATH" during installation

**macOS:**
```bash
# Using Homebrew
brew install python@3.11

# Verify installation
python3 --version
pip3 --version
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-venv python3-pip

# Verify installation
python3 --version
pip3 --version
```

### 5. Install Git (if not already installed)

**All platforms:**
- Download from [git-scm.com](https://git-scm.com/downloads)
- Verify: `git --version`

---

## Project Setup

### 1. Clone the Repository

```bash
# Clone the repository (replace with actual URL)
git clone https://github.com/yourusername/SilentTalkFYP.git
cd SilentTalkFYP
```

### 2. Install Root Dependencies

```bash
# Install Husky and lint-staged for git hooks
npm install
```

### 3. Install Service-Specific Dependencies

**Backend (ASP.NET Core):**
```bash
cd server
dotnet restore
cd ..
```

**Frontend (React):**
```bash
cd client
npm install
cd ..
```

**ML Service (FastAPI):**
```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
deactivate
cd ..
```

---

## Database Configuration

### Option 1: Using Docker Compose (Recommended)

Docker Compose will automatically set up all databases. No manual configuration needed!

### Option 2: Manual Database Setup

If you want to run databases locally without Docker:

**PostgreSQL:**
```bash
# Install PostgreSQL 16
sudo apt-get install postgresql-16

# Create database and user
sudo -u postgres psql
CREATE DATABASE silenttalk_db;
CREATE USER silentstalk WITH PASSWORD 'silentstalk_dev_password';
GRANT ALL PRIVILEGES ON DATABASE silenttalk_db TO silentstalk;
\q
```

**MongoDB:**
```bash
# Install MongoDB 7.0
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongod

# Create admin user
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "admin_dev_password",
  roles: ["root"]
})
```

**Redis:**
```bash
# Install Redis 7.2
sudo apt-get install redis-server

# Configure password in /etc/redis/redis.conf
requirepass redis_dev_password

# Restart Redis
sudo systemctl restart redis-server
```

---

## Starting the Application

### Method 1: Using Docker Compose (Easiest - Recommended)

This method starts all services (frontend, backend, ML service, databases, monitoring) with a single command:

```bash
# Start all services in detached mode
docker compose -f docker-compose.yml up -d

# View logs
docker compose logs -f

# Check running services
docker compose ps
```

**What gets started:**
- Frontend (React) → http://localhost:3000
- Backend API (.NET) → http://localhost:5000
- ML Service (FastAPI) → http://localhost:8000
- PostgreSQL → localhost:5432
- MongoDB → localhost:27017
- Redis → localhost:6379
- MinIO (Object Storage) → http://localhost:9001

### Method 2: Manual Start (For Development)

**Step 1: Start Databases (if not using Docker)**
```bash
# PostgreSQL
sudo systemctl start postgresql

# MongoDB
sudo systemctl start mongod

# Redis
sudo systemctl start redis-server
```

**Step 2: Start Backend API**
```bash
# Open a new terminal window
cd server

# Apply database migrations
dotnet ef database update --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api

# Run the API
dotnet run --project src/SilentTalk.Api

# Backend will start at: http://localhost:5000
# Swagger docs: http://localhost:5000/swagger
```

**Step 3: Start ML Service**
```bash
# Open a new terminal window
cd ml-service

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start FastAPI server
python main.py
# Or using uvicorn directly:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# ML Service will start at: http://localhost:8000
# API docs: http://localhost:8000/docs
```

**Step 4: Start Frontend**
```bash
# Open a new terminal window
cd client

# Start development server
npm run dev

# Frontend will start at: http://localhost:3000
```

### Method 3: Using Monitoring Stack

To also start the complete observability stack (Prometheus, Grafana, Loki, Jaeger):

```bash
# Start main application
docker compose -f docker-compose.yml up -d

# Start monitoring stack
docker compose -f docker-compose.monitoring.yml up -d

# Access monitoring dashboards:
# - Grafana: http://localhost:3001 (admin/admin)
# - Prometheus: http://localhost:9090
# - Jaeger: http://localhost:16686
# - AlertManager: http://localhost:9093
```

---

## Verification Steps

### 1. Check All Services Are Running

**Using Docker:**
```bash
docker compose ps

# You should see all services in "Up" state
```

**Manual verification:**
```bash
# Backend API health
curl http://localhost:5000/health

# ML Service health
curl http://localhost:8000/health

# Frontend (visit in browser)
# http://localhost:3000
```

### 2. Verify Database Connections

**PostgreSQL:**
```bash
# Connect to database
psql -h localhost -U silentstalk -d silentstalk_db

# List tables
\dt

# You should see Entity Framework migration tables and application tables
```

**MongoDB:**
```bash
# Connect to MongoDB
mongosh mongodb://admin:admin_dev_password@localhost:27017

# List databases
show dbs

# You should see 'silentstalk' database
```

**Redis:**
```bash
# Connect to Redis
redis-cli -a redis_dev_password

# Test connection
PING
# Should respond: PONG
```

### 3. Test the Application

**Step 1: Access Frontend**
- Open browser: http://localhost:3000
- You should see the SilentTalk landing page

**Step 2: Create Account**
- Click "Sign Up"
- Fill in the registration form:
  - Email: test@example.com
  - Password: Test123!
  - Display Name: Test User
  - Preferred Sign Language: ASL
- Click "Create Account"
- Verify email confirmation (check console logs in dev mode)

**Step 3: Login**
- Click "Login"
- Enter credentials
- You should be redirected to the dashboard

**Step 4: Test Video Call**
- Navigate to "Video Call" section
- Allow camera and microphone permissions
- You should see yourself in the video preview
- The ML model should start detecting hand gestures

**Step 5: Test ML Service**
- Visit http://localhost:8000/docs
- Try the `/predict` endpoint
- Upload a test image or use the webcam feed
- You should receive sign language predictions

**Step 6: Check API Documentation**
- Visit http://localhost:5000/swagger
- You should see all available API endpoints
- Try the `/api/user/profile` endpoint (requires authentication)

### 4. Check Logs

**Using Docker:**
```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend-api
docker compose logs -f ml-service
docker compose logs -f frontend
```

**Manual mode:**
- Backend logs: Check the terminal where you ran `dotnet run`
- ML Service logs: Check the terminal where you ran `uvicorn`
- Frontend logs: Check the terminal where you ran `npm run dev`

---

## Common Issues & Troubleshooting

### Issue 1: Port Already in Use

**Error:**
```
Error: bind: address already in use
```

**Solution:**
```bash
# Find process using port (example: port 5000)
# Linux/macOS:
lsof -i :5000

# Windows:
netstat -ano | findstr :5000

# Kill the process
# Linux/macOS:
kill -9 <PID>

# Windows:
taskkill /PID <PID> /F
```

### Issue 2: Docker Permission Denied

**Error:**
```
Got permission denied while trying to connect to Docker daemon
```

**Solution:**
```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Restart Docker Desktop (Windows/macOS)
```

### Issue 3: Database Connection Failed

**Error:**
```
Unable to connect to database
```

**Solutions:**
```bash
# Check if PostgreSQL is running
docker compose ps postgres
# or
sudo systemctl status postgresql

# Check connection parameters in appsettings.json
cd server/src/SilentTalk.Api
cat appsettings.Development.json

# Verify connection string matches your setup
```

### Issue 4: ML Model Not Loading

**Error:**
```
Model file not found
```

**Solution:**
```bash
cd ml-service

# Check if model files exist
ls -la models/

# If missing, download pre-trained models
# (See ML_MODEL_CARD.md for download instructions)

# Verify Python dependencies
pip list | grep mediapipe
pip list | grep tensorflow
```

### Issue 5: npm Install Fails

**Error:**
```
npm ERR! code ERESOLVE
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall with legacy peer deps
npm install --legacy-peer-deps
```

### Issue 6: Frontend Shows Blank Page

**Solutions:**
1. Check browser console for errors (F12 → Console)
2. Verify API is running and accessible
3. Check CORS configuration in backend
4. Clear browser cache (Ctrl+Shift+Delete)
5. Try incognito/private browsing mode

### Issue 7: WebRTC Video Not Working

**Solutions:**
1. Check browser permissions (camera/microphone)
2. Verify HTTPS is enabled (WebRTC requires secure context)
3. Check TURN/STUN server configuration
4. Test in Chrome first (best WebRTC support)
5. Check firewall settings

### Issue 8: Migrations Not Applied

**Error:**
```
No such table: Users
```

**Solution:**
```bash
cd server

# Apply migrations manually
dotnet ef database update --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api

# Or drop and recreate database
dotnet ef database drop --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api
dotnet ef database update --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api
```

### Issue 9: Redis Connection Error

**Solutions:**
```bash
# Check if Redis is running
docker compose ps redis
# or
sudo systemctl status redis-server

# Test connection
redis-cli -h localhost -p 6379 -a redis_dev_password ping

# Should return PONG
```

### Issue 10: MinIO Access Denied

**Solution:**
```bash
# Access MinIO console
# http://localhost:9001
# Login: minioadmin / minioadmin123

# Create bucket if it doesn't exist
# Bucket name: silenttalk-media

# Check access policy is set to 'public' or 'download'
```

---

## Stopping the Application

### Using Docker Compose:

```bash
# Stop all services (preserves data)
docker compose down

# Stop and remove volumes (clears all data)
docker compose down -v

# Stop monitoring stack
docker compose -f docker-compose.monitoring.yml down
```

### Manual Mode:

```bash
# Press Ctrl+C in each terminal window running:
# - Backend API (dotnet run)
# - ML Service (uvicorn)
# - Frontend (npm run dev)

# Stop databases
sudo systemctl stop postgresql
sudo systemctl stop mongod
sudo systemctl stop redis-server
```

---

## Running E2E Tests

After starting the application, you can run end-to-end tests:

```bash
# Install Playwright browsers (first time only)
cd e2e
npm install
npx playwright install

# Run all E2E tests
npm run test

# Run specific test suite
npm run test:auth          # Authentication tests
npm run test:video         # Video call tests
npm run test:forum         # Forum tests
npm run test:accessibility # Accessibility tests
npm run test:performance   # Performance tests

# Run tests in UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Generate HTML report
npm run test:report
```

---

## Next Steps

After successfully running the application:

1. **Explore Features** - See `COMPLETE_FEATURES_GUIDE.md` for detailed feature documentation
2. **Review Architecture** - See `docs/architecture/README.md`
3. **Read API Documentation** - Visit http://localhost:5000/swagger
4. **Check ML Model Details** - See `docs/ML_MODEL_CARD.md`
5. **Review Testing Strategy** - See `docs/testing/strategy.md`
6. **Setup Monitoring** - See `monitoring/README.md`

---

## Getting Help

If you encounter issues not covered here:

1. Check the [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for detailed technical information
2. Review logs for error messages
3. Search for similar issues in the project's issue tracker
4. Contact the development team

---

**Last Updated:** 2025-01-13
**Version:** 1.0.0
**Maintainer:** SilentTalk Development Team
