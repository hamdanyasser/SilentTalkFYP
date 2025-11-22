# SilentTalk API Testing Guide

This guide provides step-by-step instructions to test all aspects of the SilentTalk API after the database reset.

## Prerequisites

Ensure the application is running:
```bash
cd server
docker compose up -d
```

## 1. Basic Health Checks

### Check API is running
```bash
curl http://localhost:5000/
```
Expected: `{"service":"SilentTalk API","version":"1.0.0","status":"running",...}`

### Check health endpoints
```bash
curl http://localhost:5000/health
curl http://localhost:5000/health/ready
curl http://localhost:5000/health/live
```
Expected: `Healthy`

### Check Swagger documentation (if in Development mode)
```bash
# Open in browser:
http://localhost:5000/swagger/index.html
```

## 2. Database Verification

### Check all tables exist
```bash
docker compose exec postgres psql -U silentstalk -d silentstalk_db -c "\dt"
```
Expected tables:
- AspNetRoles
- AspNetRoleClaims
- AspNetUsers
- AspNetUserClaims
- AspNetUserLogins
- AspNetUserRoles
- AspNetUserTokens
- Calls
- Participants
- Contacts
- AuditLogs
- UserReports
- __EFMigrationsHistory

### Check for any existing data
```bash
docker compose exec postgres psql -U silentstalk -d silentstalk_db -c "SELECT COUNT(*) FROM \"AspNetUsers\";"
docker compose exec postgres psql -U silentstalk -d silentstalk_db -c "SELECT COUNT(*) FROM \"Calls\";"
docker compose exec postgres psql -U silentstalk -d silentstalk_db -c "SELECT COUNT(*) FROM \"Contacts\";"
```

## 3. Authentication Flow Testing

### Register a new user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "displayName": "Test User",
    "preferredLanguage": "ASL"
  }'
```
Expected: `200 OK` with `accessToken`, `refreshToken`, and user info

Save the access token for subsequent requests:
```bash
export TOKEN="<your-access-token-here>"
```

### Login with existing user
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```
Expected: `200 OK` with tokens

### Get current user profile (authenticated)
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```
Expected: User profile information

### Refresh access token
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "<your-access-token>",
    "refreshToken": "<your-refresh-token>"
  }'
```
Expected: New access and refresh tokens

### Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `200 OK`

## 4. User Management Testing

### Get user profile
```bash
curl http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Update user profile
```bash
curl -X PUT http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Test User",
    "preferredLanguage": "BSL"
  }'
```

### Change password
```bash
curl -X POST http://localhost:5000/api/user/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Test123!@#",
    "newPassword": "NewTest123!@#"
  }'
```

## 5. Contact Management Testing

### Get all contacts
```bash
curl http://localhost:5000/api/user/contacts \
  -H "Authorization: Bearer $TOKEN"
```

### Search for users to add as contacts
```bash
curl "http://localhost:5000/api/user/search?query=test" \
  -H "Authorization: Bearer $TOKEN"
```

### Add a contact (you'll need another user's ID)
```bash
curl -X POST http://localhost:5000/api/user/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contactUserId": "<other-user-guid>"
  }'
```

### Get contact requests
```bash
curl http://localhost:5000/api/user/contacts/requests \
  -H "Authorization: Bearer $TOKEN"
```

### Accept/Reject contact request
```bash
curl -X PUT http://localhost:5000/api/user/contacts/<contact-id>/accept \
  -H "Authorization: Bearer $TOKEN"

curl -X PUT http://localhost:5000/api/user/contacts/<contact-id>/reject \
  -H "Authorization: Bearer $TOKEN"
```

### Remove a contact
```bash
curl -X DELETE http://localhost:5000/api/user/contacts/<contact-id> \
  -H "Authorization: Bearer $TOKEN"
```

## 6. Call Management Testing

### Create a new call
```bash
curl -X POST http://localhost:5000/api/call \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "callType": "Video",
    "isScheduled": false
  }'
```
Expected: New call object with CallId

### Get call details
```bash
curl http://localhost:5000/api/call/<call-id> \
  -H "Authorization: Bearer $TOKEN"
```

### Get user's call history
```bash
curl http://localhost:5000/api/call/history \
  -H "Authorization: Bearer $TOKEN"
```

### End a call
```bash
curl -X PUT http://localhost:5000/api/call/<call-id>/end \
  -H "Authorization: Bearer $TOKEN"
```

## 7. SignalR Hub Testing

You can test SignalR connectivity using a JavaScript client or tools like SignalR Test Server. Here's a basic Node.js test:

```javascript
// test-signalr.js
const signalR = require("@microsoft/signalr");

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5000/hubs/call", {
        accessTokenFactory: () => "YOUR_ACCESS_TOKEN_HERE"
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();

connection.on("UserJoined", (user) => {
    console.log("User joined:", user);
});

connection.start()
    .then(() => console.log("Connected to CallHub"))
    .catch(err => console.error(err));
```

Run with:
```bash
npm install @microsoft/signalr
node test-signalr.js
```

## 8. Database Integrity Checks

### Verify foreign key relationships
```bash
docker compose exec postgres psql -U silentstalk -d silentstalk_db -c "
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
"
```

### Check Contact relationships
```bash
docker compose exec postgres psql -U silentstalk -d silentstalk_db -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Contacts'
ORDER BY ordinal_position;
"
```

### Verify indexes
```bash
docker compose exec postgres psql -U silentstalk -d silentstalk_db -c "
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
"
```

## 9. Admin Endpoints (if you have admin role)

First, create an admin user or promote existing user to admin:
```bash
docker compose exec postgres psql -U silentstalk -d silentstalk_db -c "
INSERT INTO \"AspNetRoles\" (\"Id\", \"Name\", \"NormalizedName\", \"Description\")
VALUES (gen_random_uuid(), 'Admin', 'ADMIN', 'Administrator role')
ON CONFLICT DO NOTHING;
"
```

Then test admin endpoints with admin token.

## 10. MongoDB Testing (for chat messages)

### Check MongoDB connection
```bash
docker compose exec mongodb mongosh -u silentstalk -p silentstalk123 --authenticationDatabase admin
```

### List databases and collections
```javascript
show dbs
use silentstalk
show collections
```

### Check chat messages
```javascript
db.ChatMessages.find().pretty()
db.ChatMessages.countDocuments()
```

## 11. Redis Testing (for caching)

### Check Redis connection
```bash
docker compose exec redis redis-cli
```

### Test basic operations
```bash
PING              # Should return PONG
KEYS *            # List all keys
INFO              # Redis server info
```

## 12. Rate Limiting Testing

### Test rate limiting by making multiple rapid requests
```bash
for i in {1..10}; do
  curl -w "\nStatus: %{http_code}\n" http://localhost:5000/api/auth/me \
    -H "Authorization: Bearer $TOKEN"
  sleep 0.5
done
```
Expected: After hitting the limit, you should see `429 Too Many Requests`

## 13. Error Handling Testing

### Test invalid authentication
```bash
curl http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer invalid_token"
```
Expected: `401 Unauthorized`

### Test invalid data
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "weak"
  }'
```
Expected: `400 Bad Request` with validation errors

### Test missing required fields
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{}'
```
Expected: `400 Bad Request`

## 14. Logs and Monitoring

### Check application logs
```bash
docker compose logs server --tail 100 -f
```

### Check for errors
```bash
docker compose logs server | grep -i error
docker compose logs server | grep -i exception
```

### Check database logs
```bash
docker compose logs postgres --tail 50
```

## Complete Test Workflow

Here's a complete end-to-end test workflow:

```bash
# 1. Ensure everything is running
docker compose ps

# 2. Health check
curl http://localhost:5000/health

# 3. Register two users
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"Test123!@#","displayName":"Alice"}'

curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@test.com","password":"Test123!@#","displayName":"Bob"}'

# 4. Login as Alice (save token)
TOKEN_ALICE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"Test123!@#"}' | jq -r '.accessToken')

# 5. Get Alice's profile
curl http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer $TOKEN_ALICE"

# 6. Search for Bob
curl "http://localhost:5000/api/user/search?query=Bob" \
  -H "Authorization: Bearer $TOKEN_ALICE"

# 7. Add Bob as contact (you'll need Bob's ID from search)
BOB_ID="<bob-user-id-from-search>"
curl -X POST http://localhost:5000/api/user/contacts \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -H "Content-Type: application/json" \
  -d "{\"contactUserId\":\"$BOB_ID\"}"

# 8. Login as Bob and accept contact request
TOKEN_BOB=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@test.com","password":"Test123!@#"}' | jq -r '.accessToken')

curl http://localhost:5000/api/user/contacts/requests \
  -H "Authorization: Bearer $TOKEN_BOB"

# 9. Create a call as Alice
curl -X POST http://localhost:5000/api/call \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -H "Content-Type: application/json" \
  -d '{"callType":"Video","isScheduled":false}'

# 10. Check Alice's call history
curl http://localhost:5000/api/call/history \
  -H "Authorization: Bearer $TOKEN_ALICE"

# 11. Verify database state
docker compose exec postgres psql -U silentstalk -d silentstalk_db -c "SELECT COUNT(*) FROM \"AspNetUsers\";"
docker compose exec postgres psql -U silentstalk -d silentstalk_db -c "SELECT COUNT(*) FROM \"Contacts\";"
docker compose exec postgres psql -U silentstalk -d silentstalk_db -c "SELECT COUNT(*) FROM \"Calls\";"
```

## Troubleshooting

### If API is not responding:
```bash
docker compose logs server --tail 100
docker compose ps
```

### If database connection fails:
```bash
docker compose logs postgres --tail 50
docker compose exec postgres psql -U silentstalk -d silentstalk_db -c "SELECT version();"
```

### To reset database completely:
```bash
docker compose down -v
docker compose up -d
# Wait for migrations to run
docker compose logs server -f
```

### To check entity configurations:
```bash
docker compose logs server | grep -i "relationship"
docker compose logs server | grep -i "shadow"
```

## Success Criteria

Your system is fully operational if:
- ✅ All health checks return `Healthy`
- ✅ User registration and login work
- ✅ Profile updates save correctly
- ✅ Contact relationships can be created
- ✅ Calls can be created and retrieved
- ✅ Database has all expected tables
- ✅ Foreign key relationships are correct
- ✅ No errors or warnings in server logs
- ✅ MongoDB and Redis connections work
- ✅ SignalR hub accepts connections
