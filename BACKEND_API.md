# SilentTalk Backend API Documentation

## Running the Project

### Start All Services
```bash
cd /home/user/SilentTalkFYP
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### Check Service Status
```bash
docker compose -f infrastructure/docker/docker-compose.yml ps
```

### View Logs
```bash
# All services
docker compose -f infrastructure/docker/docker-compose.yml logs -f

# Specific service
docker compose -f infrastructure/docker/docker-compose.yml logs -f server
docker compose -f infrastructure/docker/docker-compose.yml logs -f ml-service
docker compose -f infrastructure/docker/docker-compose.yml logs -f client
```

### Stop All Services
```bash
docker compose -f infrastructure/docker/docker-compose.yml down
```

### Stop and Remove Volumes (Clean Reset)
```bash
docker compose -f infrastructure/docker/docker-compose.yml down -v
```

---

## API Endpoints

### Base URLs
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **Swagger Docs**: http://localhost:5000/swagger
- **ML API Docs**: http://localhost:8000/docs
- **Kibana (Logs)**: http://localhost:5601
- **MinIO Console**: http://localhost:9001

---

## Authentication Endpoints

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "displayName": "Test User"
  }'
```

**Response:**
```json
{
  "userId": "guid",
  "email": "user@example.com",
  "displayName": "Test User",
  "token": "jwt-token-here",
  "refreshToken": "refresh-token-here"
}
```

---

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "refreshToken": "refresh-token-here",
  "expiresAt": "2024-11-22T12:00:00Z"
}
```

---

### Refresh Token
```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

**Response:**
```json
{
  "token": "new-jwt-token-here",
  "refreshToken": "new-refresh-token-here",
  "expiresAt": "2024-11-22T13:00:00Z"
}
```

---

### Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## User Management

### Get User Profile
```bash
curl -X GET http://localhost:5000/api/users/{userId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "id": "guid",
  "email": "user@example.com",
  "displayName": "Test User",
  "bio": "My bio",
  "profilePictureUrl": "https://...",
  "createdAt": "2024-11-21T10:00:00Z"
}
```

---

### Update Profile
```bash
curl -X PUT http://localhost:5000/api/users/{userId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Name",
    "bio": "My updated bio"
  }'
```

---

### Upload Profile Picture
```bash
curl -X POST http://localhost:5000/api/users/{userId}/profile-picture \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

---

## Real-time Communication (SignalR)

### WebSocket Connection
**Hub URL**: `ws://localhost:5000/hubs/call`

### Connect to Hub (JavaScript Example)
```javascript
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5000/hubs/call", {
    accessTokenFactory: () => "YOUR_JWT_TOKEN"
  })
  .withAutomaticReconnect()
  .build();

await connection.start();
```

### SignalR Methods

#### Join Room
```javascript
await connection.invoke("JoinRoom", "room-id-123");
```

#### Leave Room
```javascript
await connection.invoke("LeaveRoom", "room-id-123");
```

#### Send WebRTC Offer
```javascript
await connection.invoke("SendOffer", {
  sdp: "offer-sdp-here",
  type: "offer"
}, "target-user-id");
```

#### Send WebRTC Answer
```javascript
await connection.invoke("SendAnswer", {
  sdp: "answer-sdp-here",
  type: "answer"
}, "target-user-id");
```

#### Send ICE Candidate
```javascript
await connection.invoke("SendIceCandidate", {
  candidate: "ice-candidate-here",
  sdpMid: "0",
  sdpMLineIndex: 0
}, "target-user-id");
```

### SignalR Events (Receive)

```javascript
// Receive offer from another user
connection.on("ReceiveOffer", (offer, fromUserId) => {
  console.log("Received offer from:", fromUserId);
  // Handle WebRTC offer
});

// Receive answer
connection.on("ReceiveAnswer", (answer, fromUserId) => {
  console.log("Received answer from:", fromUserId);
  // Handle WebRTC answer
});

// Receive ICE candidate
connection.on("ReceiveIceCandidate", (candidate, fromUserId) => {
  console.log("Received ICE candidate from:", fromUserId);
  // Add ICE candidate to peer connection
});

// User joined room
connection.on("UserJoined", (userId) => {
  console.log("User joined:", userId);
});

// User left room
connection.on("UserLeft", (userId) => {
  console.log("User left:", userId);
});
```

---

## ML Recognition Service

### Health Check
```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "ml-service",
  "timestamp": "2024-11-21T12:00:00.000Z"
}
```

---

### Predict Sign Language (Single Frame)
```bash
curl -X POST http://localhost:8000/recognition/predict \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_encoded_image_data"
  }'
```

**Response:**
```json
{
  "predictions": [
    {
      "class_index": 0,
      "class_name": "A",
      "confidence": 0.98
    },
    {
      "class_index": 1,
      "class_name": "B",
      "confidence": 0.01
    }
  ],
  "top_prediction": {
    "class_name": "A",
    "confidence": 0.98
  }
}
```

---

### Upload Image for Recognition
```bash
curl -X POST http://localhost:8000/recognition/upload \
  -F "file=@/path/to/hand-sign.jpg"
```

---

### Stream Recognition (WebSocket)
**WebSocket URL**: `ws://localhost:8000/recognition/stream`

Send frames as base64-encoded JSON:
```json
{
  "frame": "base64_encoded_frame",
  "timestamp": 1234567890
}
```

Receive predictions:
```json
{
  "prediction": "A",
  "confidence": 0.98,
  "landmarks": [...],
  "timestamp": 1234567890
}
```

**Note**: ONNX model must be trained and placed in `/ml-service/checkpoints/model.onnx`

---

## Database Access

### PostgreSQL
```bash
# Connect to PostgreSQL
docker compose -f infrastructure/docker/docker-compose.yml exec postgres \
  psql -U silentstalk -d silentstalk_db

# List tables
\dt

# Query users
SELECT * FROM "AspNetUsers";

# Exit
\q
```

---

### MongoDB
```bash
# Connect to MongoDB
docker compose -f infrastructure/docker/docker-compose.yml exec mongodb \
  mongosh -u admin -p admin_dev_password --authenticationDatabase admin silentstalk

# List collections
show collections

# Query messages
db.messages.find().pretty()

# Exit
exit
```

---

### Redis
```bash
# Connect to Redis
docker compose -f infrastructure/docker/docker-compose.yml exec redis \
  redis-cli -a redis_dev_password

# Check keys
KEYS *

# Get value
GET key-name

# Exit
exit
```

---

## Admin Endpoints

### Get All Users (Admin Only)
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

### Block User (Admin Only)
```bash
curl -X POST http://localhost:5000/api/admin/users/{userId}/block \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

### Get Reports (Admin Only)
```bash
curl -X GET http://localhost:5000/api/admin/reports \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

## Call Management

### Create Call
```bash
curl -X POST http://localhost:5000/api/calls \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participantIds": ["user-id-1", "user-id-2"],
    "callType": "video",
    "scheduledAt": "2024-11-22T14:00:00Z"
  }'
```

---

### Get Call History
```bash
curl -X GET http://localhost:5000/api/calls/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### End Call
```bash
curl -X POST http://localhost:5000/api/calls/{callId}/end \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Troubleshooting

### Services won't start
1. **Check port conflicts**:
   ```bash
   netstat -tulpn | grep -E ':(3000|5000|5044|8000)'
   ```

2. **Check Docker logs**:
   ```bash
   docker compose -f infrastructure/docker/docker-compose.yml logs
   ```

3. **Restart services**:
   ```bash
   docker compose -f infrastructure/docker/docker-compose.yml restart
   ```

4. **Full reset** (WARNING: Deletes all data):
   ```bash
   docker compose -f infrastructure/docker/docker-compose.yml down -v
   docker compose -f infrastructure/docker/docker-compose.yml up -d
   ```

---

### Database connection errors
1. **Ensure databases are healthy**:
   ```bash
   docker compose -f infrastructure/docker/docker-compose.yml ps
   ```

2. **Check connection strings** in `appsettings.json`

3. **Run EF Core migrations**:
   ```bash
   cd server
   dotnet ef database update --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api
   ```

---

### Can't access Swagger
1. **Ensure server is running**:
   ```bash
   curl http://localhost:5000/health
   ```

2. **Open in browser**: http://localhost:5000/swagger

3. **Check logs**:
   ```bash
   docker compose -f infrastructure/docker/docker-compose.yml logs -f server
   ```

---

### CORS Errors
The API allows requests from:
- `http://localhost:3000` (Vite dev server)
- `http://localhost:5173` (Alternative Vite port)

If you need to add more origins, update `Program.cs`:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://your-origin-here")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

---

## Environment Variables

All environment variables are defined in `infrastructure/docker/docker-compose.yml`.

### Key Variables:

#### Server (ASP.NET Core)
- `ASPNETCORE_ENVIRONMENT` - Development/Production
- `ASPNETCORE_URLS` - http://+:5000
- `ConnectionStrings__DefaultConnection` - PostgreSQL connection
- `ConnectionStrings__MongoDB` - MongoDB connection
- `ConnectionStrings__Redis` - Redis connection
- `JwtSettings__SecretKey` - JWT signing key
- `Storage__MinIO__Endpoint` - MinIO endpoint
- `Storage__MinIO__AccessKey` - MinIO access key
- `Storage__MinIO__SecretKey` - MinIO secret key

#### ML Service (FastAPI)
- `PYTHONUNBUFFERED` - 1
- `ENVIRONMENT` - development/production
- `LOG_LEVEL` - INFO/DEBUG/ERROR
- `REDIS_URL` - Redis connection
- `MODEL_PATH` - /app/models
- `ALLOWED_ORIGINS` - CORS origins

#### Client (React/Vite)
- `NODE_ENV` - development/production
- `VITE_API_URL` - http://localhost:5000
- `VITE_WS_URL` - ws://localhost:5000
- `VITE_ML_SERVICE_URL` - http://localhost:8000

---

## Performance & Monitoring

### View Logs in Kibana
1. Open http://localhost:5601
2. Go to "Discover"
3. Create index pattern: `silentstalk-logs-*`
4. Filter by service, level, timestamp

### Check Service Health
```bash
# Backend
curl http://localhost:5000/health

# Backend detailed
curl http://localhost:5000/health/ready

# ML Service
curl http://localhost:8000/health

# Elasticsearch
curl http://localhost:9200/_cluster/health

# Redis
docker compose -f infrastructure/docker/docker-compose.yml exec redis redis-cli -a redis_dev_password ping
```

---

## Next Steps

### 1. Train ML Model
```bash
cd ml-service
python app/train.py --export-onnx
```

### 2. Seed Database (Optional)
```bash
cd server
dotnet run --project src/SilentTalk.Api -- seed
```

### 3. Run Tests
```bash
# Server tests
cd server
dotnet test

# Client tests
cd client
npm test

# ML tests
cd ml-service
pytest
```

### 4. Deploy to Production
- Use `docker-compose.prod.yml`
- Update all secrets and passwords
- Enable HTTPS with valid certificates
- Configure proper CORS origins
- Set up monitoring and alerting

---

## Security Notes

⚠️ **WARNING**: The credentials in this setup are for **DEVELOPMENT ONLY**. Never use these in production.

### Production Checklist:
- [ ] Change all default passwords
- [ ] Use strong, randomly generated secrets
- [ ] Store credentials in environment variables or secrets management
- [ ] Enable HTTPS/TLS for all services
- [ ] Configure proper CORS (whitelist specific origins)
- [ ] Enable authentication and authorization
- [ ] Review and harden all security settings
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Configure firewall rules

---

**Backend infrastructure is ready for development!** 🚀
