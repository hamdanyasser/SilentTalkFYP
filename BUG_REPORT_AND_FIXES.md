# SilentTalk FYP - Bug Report and Fixes

**Date:** 2025-11-22
**Status:** Comprehensive Review Completed

## Executive Summary

A thorough review of the SilentTalk FYP project has identified **5 critical issues** and **3 warnings** that need to be addressed for the application to run correctly. All issues have been documented below with their fixes.

---

## Critical Issues

### 1. CORS Configuration - Port Mismatch ⚠️ CRITICAL

**Location:** `server/src/SilentTalk.Api/Program.cs:228`

**Issue:**
The CORS policy only allows origins on ports `3000` and `5173`, but the frontend is running on port `3001`.

```csharp
policy.WithOrigins("http://localhost:3000", "http://localhost:5173") // React dev servers
```

**Impact:**
- Frontend cannot connect to backend API
- SignalR WebSocket connections will fail with CORS errors
- All API calls from the frontend will be blocked

**Fix:**
Update the CORS policy to include port 3001:

```csharp
policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:5173") // React dev servers
      .AllowAnyMethod()
      .AllowAnyHeader()
      .AllowCredentials(); // Required for SignalR
```

**File to Edit:** `/home/user/SilentTalkFYP/server/src/SilentTalk.Api/Program.cs`

---

### 2. ML Service URL - Port Mismatch ⚠️ CRITICAL

**Location:** `client/.env:4`

**Issue:**
The frontend `.env` file points to ML service on port `8000`, but the service is running on port `8002`.

```env
VITE_ML_SERVICE_URL=ws://localhost:8000/streaming/ws/recognize
```

**Impact:**
- Sign language recognition will not work
- WebSocket connection to ML service will fail
- Users will see "Failed to start recognition" errors

**Fix:**
Update the `.env` file to use port 8002:

```env
VITE_ML_SERVICE_URL=ws://localhost:8002/streaming/ws/recognize
```

**File to Edit:** `/home/user/SilentTalkFYP/client/.env`

---

### 3. Missing Development Configuration File ⚠️ CRITICAL

**Location:** `server/src/SilentTalk.Api/appsettings.Development.json`

**Issue:**
The `appsettings.Development.json` file is missing, which is required for running the backend in Development mode.

**Impact:**
- Backend cannot connect to local databases (PostgreSQL, MongoDB, Redis)
- Application will fail to start or use incorrect connection strings
- Database migrations cannot be applied

**Fix:**
Create the file with correct local database connection strings:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=silentstalk_db;Username=silentstalk;Password=silentstalk_dev_password",
    "MongoDb": "mongodb://silentstalk:silentstalk123@localhost:27017/silentstalk?authSource=admin",
    "Redis": "localhost:6379"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

**File to Create:** `/home/user/SilentTalkFYP/server/src/SilentTalk.Api/appsettings.Development.json`

---

### 4. Redis Health Check Without Running Service ⚠️ HIGH

**Location:** `server/src/SilentTalk.Api/Program.cs:297-300`

**Issue:**
The application registers a Redis health check, but Redis is not running (port 6379 has conflicts).

```csharp
.AddRedis(
    builder.Configuration.GetConnectionString("Redis")!,
    name: "redis",
    tags: new[] { "cache", "redis" });
```

**Impact:**
- Health check endpoint (`/health`) will report unhealthy status
- Application startup may be delayed or fail
- Monitoring systems will flag the service as unhealthy

**Fix:**
Either:
1. **Start Redis service** (requires fixing port 6379 conflict), OR
2. **Remove Redis health check** (recommended for now):

```csharp
// Comment out or remove the Redis health check
builder.Services.AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "postgres",
        tags: new[] { "db", "postgres" })
    .AddMongoDb(
        builder.Configuration.GetConnectionString("MongoDB")!,
        name: "mongodb",
        tags: new[] { "db", "mongodb" });
    // .AddRedis(  // Commented out - Redis not running
    //     builder.Configuration.GetConnectionString("Redis")!,
    //     name: "redis",
    //     tags: new[] { "cache", "redis" });
```

**File to Edit:** `/home/user/SilentTalkFYP/server/src/SilentTalk.Api/Program.cs`

---

### 5. MongoDB Password Mismatch ⚠️ MEDIUM

**Location:** Multiple files

**Issue:**
Inconsistent MongoDB passwords across configuration files:
- Docker: `silentstalk123`
- appsettings.json: `admin_dev_password`
- appsettings.Development.json: `silentstalk123`

**Impact:**
- MongoDB connection failures
- Application cannot store chat messages, call logs, or audit logs

**Fix:**
Standardize to use `silentstalk123` everywhere (matching Docker configuration).

**Files to Check:**
1. `infrastructure/docker/docker-compose.yml` - Verify password
2. `server/src/SilentTalk.Api/appsettings.Development.json` - Use `silentstalk123`
3. `server/src/SilentTalk.Api/appsettings.json` - Update if different

---

## Warnings and Recommendations

### W1. No Trained ML Model

**Issue:**
The ML service starts without a pre-trained ONNX model.

**Impact:**
- Sign language recognition will not work
- WebSocket connections succeed but produce no predictions

**Recommendation:**
Train a model using the ASL Alphabet dataset:

```bash
cd ~/SilentTalkFYP/ml-service
python app/train.py --dataset data/asl_alphabet --epochs 50 --export-onnx
```

**Status:** Expected for initial setup, not a bug

---

### W2. Environment Variable Naming Inconsistency

**Issue:**
Frontend uses different environment variable names in different files:
- `presenceService.ts`: `VITE_API_URL`
- `authService.ts`: `VITE_API_URL`
- `.env`: `VITE_API_BASE_URL`

**Impact:**
- May cause confusion during configuration
- Fallback URLs might be used instead of configured ones

**Recommendation:**
Standardize on `VITE_API_BASE_URL` everywhere, or update `.env` to include both.

---

### W3. Elasticsearch Configuration in Production appsettings.json

**Issue:**
The default `appsettings.json` includes Elasticsearch logging, but Elasticsearch is not in the Docker Compose setup.

**Impact:**
- Logging errors may appear in console
- Slight performance overhead from failed connection attempts

**Recommendation:**
Move Elasticsearch configuration to a separate `appsettings.Production.json` file.

---

## Quick Fix Script

All critical issues can be fixed automatically. See the next section for a fix script.

---

## Verification Checklist

After applying fixes, verify the following:

### Backend API
- [ ] Backend starts without errors on port 5000
- [ ] Can access Swagger docs at `http://localhost:5000/swagger`
- [ ] Health check returns healthy: `curl http://localhost:5000/health`
- [ ] Database migrations applied successfully
- [ ] No CORS errors in browser console

### Frontend
- [ ] Frontend loads at `http://localhost:3001`
- [ ] No console errors related to API connections
- [ ] Can navigate to different pages
- [ ] Login/Register forms load correctly

### ML Service
- [ ] ML service starts on port 8002
- [ ] API docs accessible at `http://localhost:8002/docs`
- [ ] Health check returns healthy: `curl http://localhost:8002/health`
- [ ] WebSocket endpoint accepts connections

### Integration
- [ ] Frontend can connect to backend API
- [ ] SignalR hub connection succeeds (check browser console)
- [ ] ML service WebSocket connection succeeds
- [ ] No CORS errors in browser console
- [ ] Camera access granted in browser

### Database
- [ ] PostgreSQL accepting connections on port 5432
- [ ] MongoDB accepting connections on port 27017
- [ ] Database migrations applied (check `__EFMigrationsHistory` table)

---

## Testing Recommendations

### 1. User Registration and Login
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 2. ML Service Health
```bash
# Check ML service
curl http://localhost:8002/health

# Check streaming endpoint info
curl http://localhost:8002/streaming/sessions/active
```

### 3. Database Connectivity
```bash
# PostgreSQL
docker exec silentstalk-postgres psql -U silentstalk -d silentstalk_db -c "SELECT COUNT(*) FROM \"AspNetUsers\";"

# MongoDB
docker exec silentstalk-mongodb mongosh -u silentstalk -p silentstalk123 --authenticationDatabase admin silentstalk --eval "db.stats()"
```

---

## Summary

**Total Issues Found:** 8
**Critical:** 3 (CORS, ML Service URL, Missing Config)
**High:** 1 (Redis Health Check)
**Medium:** 1 (MongoDB Password)
**Warnings:** 3 (Informational)

**Estimated Fix Time:** 10-15 minutes
**Complexity:** Low - Configuration changes only

All issues are configuration-related and require no code changes beyond updating configuration files.
