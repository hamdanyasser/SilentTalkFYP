# SilentTalk FYP - Complete Testing Guide

This guide provides step-by-step testing procedures for all components of the SilentTalk application. Follow each step in order and note any bugs or issues you encounter.

---

## Prerequisites Checklist

Before starting, ensure:
- [ ] All Docker containers are running
- [ ] Backend API is running (port 5000)
- [ ] Frontend is running (port 3001)
- [ ] ML Service is running (port 8002)

Run this command to check:
```bash
cd /home/user/SilentTalkFYP
./check-services.sh
```

---

## Phase 1: Service Health Checks (5 steps)

### Step 1.1: Check PostgreSQL Database
```bash
docker exec silents-talk-postgres psql -U silentstalk -d silentstalk_db -c "\dt"
```
**Expected Result:** Should list all database tables (AspNetUsers, AspNetRoles, Calls, Contacts, Messages, Participants)

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________

---

### Step 1.2: Check MongoDB Database
```bash
docker exec silents-talk-mongo mongosh -u silentstalk -p silentstalk123 --authenticationDatabase admin silentstalk --eval "db.getCollectionNames()"
```
**Expected Result:** Should list collections: Messages, RecognitionResults

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________

---

### Step 1.3: Verify Backend API Health
Open browser and navigate to:
```
http://localhost:5000/health
```
**Expected Result:** Should return "Healthy" status

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________

---

### Step 1.4: Verify Backend Swagger UI
Open browser and navigate to:
```
http://localhost:5000/swagger
```
**Expected Result:** Should see Swagger UI with all API endpoints listed

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________

---

### Step 1.5: Verify ML Service Docs
Open browser and navigate to:
```
http://localhost:8002/docs
```
**Expected Result:** Should see FastAPI documentation with ML endpoints

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________

---

## Phase 2: Backend API Testing (15 steps)

### Step 2.1: Test User Registration - Valid Data
In Swagger UI (http://localhost:5000/swagger):

1. Expand `POST /api/Auth/register`
2. Click "Try it out"
3. Enter the following JSON:
```json
{
  "email": "test.user1@example.com",
  "password": "Test@123456",
  "displayName": "Test User 1",
  "preferredLanguage": "ASL"
}
```
4. Click "Execute"

**Expected Result:** 200 OK with user details and JWT token

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Response code: ________
- Error message (if any): _________________________________

---

### Step 2.2: Test User Registration - Duplicate Email
Repeat Step 2.1 with the same email.

**Expected Result:** 400 Bad Request with error "User with this email already exists"

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Response code: ________
- Error message: _________________________________

---

### Step 2.3: Test User Registration - Invalid Email Format
Try registering with:
```json
{
  "email": "invalid-email",
  "password": "Test@123456",
  "displayName": "Test User",
  "preferredLanguage": "ASL"
}
```

**Expected Result:** 400 Bad Request with validation error

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Error message: _________________________________

---

### Step 2.4: Test User Registration - Weak Password
Try registering with:
```json
{
  "email": "weakpass@example.com",
  "password": "123",
  "displayName": "Test User",
  "preferredLanguage": "ASL"
}
```

**Expected Result:** 400 Bad Request with password requirements error

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Error message: _________________________________

---

### Step 2.5: Test User Login - Valid Credentials
In Swagger UI:

1. Expand `POST /api/Auth/login`
2. Click "Try it out"
3. Enter:
```json
{
  "email": "test.user1@example.com",
  "password": "Test@123456"
}
```
4. Click "Execute"

**Expected Result:** 200 OK with accessToken, refreshToken, and user profile

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Copy the accessToken here for next steps: _________________________________

---

### Step 2.6: Test User Login - Invalid Credentials
Try logging in with:
```json
{
  "email": "test.user1@example.com",
  "password": "WrongPassword"
}
```

**Expected Result:** 401 Unauthorized with error message

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Error message: _________________________________

---

### Step 2.7: Authorize Swagger with JWT Token
1. Click the "Authorize" button (🔓) at the top of Swagger UI
2. In the "Value" field, enter: `Bearer YOUR_ACCESS_TOKEN` (replace with token from Step 2.5)
3. Click "Authorize"
4. Click "Close"

**Expected Result:** Lock icon should change to locked (🔒)

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________

---

### Step 2.8: Test Get Current User Profile
In Swagger UI:

1. Expand `GET /api/User/me`
2. Click "Try it out"
3. Click "Execute"

**Expected Result:** 200 OK with your user profile details

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- User ID returned: _________________________________
- Display name: _________________________________

---

### Step 2.9: Test Update User Profile
In Swagger UI:

1. Expand `PUT /api/User/me`
2. Click "Try it out"
3. Enter:
```json
{
  "displayName": "Updated Test User",
  "preferredLanguage": "BSL"
}
```
4. Click "Execute"

**Expected Result:** 200 OK with updated profile

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Updated display name shown: _________________________________

---

### Step 2.10: Test Get All Users (Admin Feature)
In Swagger UI:

1. Expand `GET /api/User`
2. Click "Try it out"
3. Click "Execute"

**Expected Result:** 200 OK with list of users (including seed data users)

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Number of users returned: ________

---

### Step 2.11: Create Second Test User
Register another user using Step 2.1 with:
```json
{
  "email": "test.user2@example.com",
  "password": "Test@123456",
  "displayName": "Test User 2",
  "preferredLanguage": "ASL"
}
```

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- User 2 ID: _________________________________

---

### Step 2.12: Test Add Contact
In Swagger UI:

1. Expand `POST /api/Contact`
2. Click "Try it out"
3. Enter the User 2 ID from Step 2.11:
```json
{
  "contactUserId": "PASTE_USER_2_ID_HERE"
}
```
4. Click "Execute"

**Expected Result:** 200 OK with contact created (status: Pending)

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Contact ID: _________________________________
- Contact status: _________________________________

---

### Step 2.13: Test Get User Contacts
In Swagger UI:

1. Expand `GET /api/Contact`
2. Click "Try it out"
3. Click "Execute"

**Expected Result:** 200 OK with list of contacts (including newly added one)

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Number of contacts: ________

---

### Step 2.14: Test Token Refresh
In Swagger UI:

1. Expand `POST /api/Auth/refresh`
2. Click "Try it out"
3. Enter the refreshToken from Step 2.5:
```json
{
  "refreshToken": "PASTE_REFRESH_TOKEN_HERE"
}
```
4. Click "Execute"

**Expected Result:** 200 OK with new access and refresh tokens

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- New token received: _________________________________

---

### Step 2.15: Test Logout
In Swagger UI:

1. Expand `POST /api/Auth/logout`
2. Click "Try it out"
3. Click "Execute"

**Expected Result:** 200 OK, user logged out

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________

---

## Phase 3: Frontend Testing (12 steps)

### Step 3.1: Access Frontend Homepage
Open browser and navigate to:
```
http://localhost:3001
```

**Expected Result:** Should see the SilentTalk landing page or login page

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Screenshot filename: _________________________________

---

### Step 3.2: Test Frontend Login - Valid Credentials
1. Locate the login form
2. Enter email: `test.user1@example.com`
3. Enter password: `Test@123456`
4. Click "Login" or "Sign In"

**Expected Result:** Successfully logged in, redirected to dashboard/home

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Redirected to: _________________________________
- Any console errors (F12 Developer Tools): _________________________________

---

### Step 3.3: Check Browser Console for Errors
1. Press F12 to open Developer Tools
2. Go to "Console" tab
3. Check for any red error messages

**Expected Result:** No critical errors (warnings are okay)

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Console errors: _________________________________

---

### Step 3.4: Check Network Tab
1. In Developer Tools, go to "Network" tab
2. Refresh the page
3. Check if all resources load successfully

**Expected Result:** All API calls return 200/304 status codes

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Failed requests: _________________________________

---

### Step 3.5: Test User Profile Display
1. Look for user profile section (usually top-right corner)
2. Verify your display name is shown

**Expected Result:** Should show "Updated Test User" (from Step 2.9)

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Display name shown: _________________________________

---

### Step 3.6: Test Contacts List
1. Navigate to Contacts page/section
2. Verify contacts list loads

**Expected Result:** Should see Test User 2 and any seed data contacts

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Number of contacts shown: ________

---

### Step 3.7: Test Video Call Page Access
Navigate to:
```
http://localhost:3001/call
```
or click on "Start Call" / "Video Call" button

**Expected Result:** Video call page loads, camera preview shows

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Camera permission granted: [ ] Yes / [ ] No
- Video preview visible: [ ] Yes / [ ] No

---

### Step 3.8: Test Camera Permissions
When prompted for camera/microphone access:
1. Click "Allow"

**Expected Result:** Camera feed should appear in video preview

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Camera working: [ ] Yes / [ ] No
- Error message (if any): _________________________________

---

### Step 3.9: Test Caption Toggle Button
1. Look for "Start with Caption" or similar button
2. Click it

**Expected Result:** Button state changes, captions should be enabled

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Button state changed: [ ] Yes / [ ] No

---

### Step 3.10: Test ML Service Connection
1. Open browser console (F12)
2. Look for WebSocket connection messages
3. Check for connection to ML service (ws://localhost:8002)

**Expected Result:** WebSocket connection established successfully

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- WebSocket status: _________________________________
- Console messages: _________________________________

---

### Step 3.11: Test Sign Language Recognition (if camera working)
1. With camera on and captions enabled
2. Make a sign language gesture in front of camera
3. Check if any text appears (recognition results)

**Expected Result:** Should see recognition attempts (even if inaccurate due to untrained model)

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Recognition text appeared: [ ] Yes / [ ] No
- Sample recognized text: _________________________________

---

### Step 3.12: Test Frontend Logout
1. Click on user profile menu
2. Click "Logout" or "Sign Out"

**Expected Result:** Logged out, redirected to login page

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Redirected correctly: [ ] Yes / [ ] No

---

## Phase 4: ML Service Testing (8 steps)

### Step 4.1: Test ML Service Health Endpoint
Open browser to:
```
http://localhost:8002/health
```

**Expected Result:** JSON response with status "healthy"

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________

---

### Step 4.2: Test Model Info Endpoint
Open browser to:
```
http://localhost:8002/model/info
```

**Expected Result:** JSON with model information (version, status, etc.)

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Model loaded: [ ] Yes / [ ] No
- Model path shown: _________________________________

---

### Step 4.3: Check ML Service Logs
```bash
cd /home/user/SilentTalkFYP
tail -50 ml-service/ml-service.log
```

**Expected Result:** Logs show service started, model loaded, no errors

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Any errors in logs: _________________________________

---

### Step 4.4: Test Hand Detection Endpoint (via Swagger/FastAPI)
1. Go to http://localhost:8002/docs
2. Expand `POST /recognize/hands`
3. Click "Try it out"
4. Upload a test image (you can take a screenshot of your hand)

**Expected Result:** JSON response with hand landmarks detected

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Landmarks detected: [ ] Yes / [ ] No

---

### Step 4.5: Test WebSocket Connection (Manual Test)
You can use a WebSocket testing tool, or we'll test this through the frontend in Phase 3.

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________

---

### Step 4.6: Check MediaPipe Installation
```bash
cd /home/user/SilentTalkFYP/ml-service
source venv/bin/activate
python -c "import mediapipe; print(mediapipe.__version__)"
```

**Expected Result:** Should print MediaPipe version (e.g., 0.10.x)

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Version: _________________________________

---

### Step 4.7: Check TensorFlow Installation
```bash
python -c "import tensorflow; print(tensorflow.__version__)"
```

**Expected Result:** Should print TensorFlow version

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Version: _________________________________

---

### Step 4.8: Test Model Training Endpoint (if available)
1. Go to http://localhost:8002/docs
2. Look for training-related endpoints
3. Document what you find

**Expected Result:** May or may not exist depending on implementation

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Training endpoint exists: [ ] Yes / [ ] No

---

## Phase 5: Real-Time Communication Testing (6 steps)

### Step 5.1: Check SignalR Hub Connection
1. Open frontend (logged in as test.user1@example.com)
2. Open browser console (F12)
3. Look for SignalR connection messages

**Expected Result:** SignalR connected to http://localhost:5000/hubs/call

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Connection status: _________________________________

---

### Step 5.2: Test Call Initiation (Single Browser)
1. From frontend, try to start a call
2. Check console for call events

**Expected Result:** Call created, events logged in console

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Call ID generated: _________________________________

---

### Step 5.3: Test Call with Two Users (Two Browser Windows)
1. Open Chrome in normal window, login as test.user1@example.com
2. Open Chrome in incognito window, login as test.user2@example.com
3. Start call from User 1
4. Check if User 2 receives call notification

**Expected Result:** User 2 should see incoming call

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Call notification received: [ ] Yes / [ ] No

---

### Step 5.4: Test Video/Audio Stream
1. Accept call from User 2
2. Check if video streams appear in both windows

**Expected Result:** Both users see each other's video

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- User 1 sees User 2 video: [ ] Yes / [ ] No
- User 2 sees User 1 video: [ ] Yes / [ ] No

---

### Step 5.5: Test Call End
1. Click "End Call" from either user
2. Verify call ends for both users

**Expected Result:** Call ends, both redirected or shown end screen

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________

---

### Step 5.6: Verify Call History in Database
```bash
docker exec silents-talk-postgres psql -U silentstalk -d silentstalk_db -c "SELECT * FROM \"Calls\" ORDER BY \"CreatedAt\" DESC LIMIT 5;"
```

**Expected Result:** Should see the call you just made

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Call recorded in database: [ ] Yes / [ ] No

---

## Phase 6: Database Verification (5 steps)

### Step 6.1: Verify Users Table
```bash
docker exec silents-talk-postgres psql -U silentstalk -d silentstalk_db -c "SELECT \"Id\", \"Email\", \"DisplayName\" FROM \"AspNetUsers\";"
```

**Expected Result:** Should see all registered users

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Number of users: ________

---

### Step 6.2: Verify Roles Table
```bash
docker exec silents-talk-postgres psql -U silentstalk -d silentstalk_db -c "SELECT * FROM \"AspNetRoles\";"
```

**Expected Result:** Should see USER, ADMIN, INTERPRETER roles

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Roles present: _________________________________

---

### Step 6.3: Verify Contacts Table
```bash
docker exec silents-talk-postgres psql -U silentstalk -d silentstalk_db -c "SELECT * FROM \"Contacts\";"
```

**Expected Result:** Should see contact relationships

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Number of contacts: ________

---

### Step 6.4: Verify MongoDB Messages
```bash
docker exec silents-talk-mongo mongosh -u silentstalk -p silentstalk123 --authenticationDatabase admin silentstalk --eval "db.Messages.find().pretty()"
```

**Expected Result:** Should see seed messages or any sent messages

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Number of messages: ________

---

### Step 6.5: Check Database Indexes
```bash
docker exec silents-talk-postgres psql -U silentstalk -d silentstalk_db -c "\di"
```

**Expected Result:** Should list all indexes on tables

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________

---

## Phase 7: Performance & Error Handling (5 steps)

### Step 7.1: Test API Rate Limiting (if implemented)
Make multiple rapid requests to login endpoint

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Rate limiting active: [ ] Yes / [ ] No

---

### Step 7.2: Test Invalid API Endpoints
Try accessing:
```
http://localhost:5000/api/NonExistentEndpoint
```

**Expected Result:** 404 Not Found

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Error message: _________________________________

---

### Step 7.3: Test CORS Configuration
From browser console on a different origin, try to fetch:
```javascript
fetch('http://localhost:5000/api/User')
```

**Expected Result:** Should work if CORS properly configured for localhost:3001

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- CORS error: [ ] Yes / [ ] No

---

### Step 7.4: Check Backend Logs for Errors
```bash
cd /home/user/SilentTalkFYP/server
tail -100 backend.log | grep -i error
```

**Expected Result:** No critical errors

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Errors found: _________________________________

---

### Step 7.5: Check Frontend Logs for Errors
```bash
cd /home/user/SilentTalkFYP/client
tail -100 frontend.log | grep -i error
```

**Expected Result:** No critical errors

**Document any issues:**
- [ ] ✅ Pass / ❌ Fail: _________________________________
- Errors found: _________________________________

---

## Summary Report Template

After completing all tests, fill out this summary:

### Overall Results
- Total Steps: 61
- Passed: ________
- Failed: ________
- Pass Rate: _______%

### Critical Issues Found
1. _________________________________
2. _________________________________
3. _________________________________

### Minor Issues Found
1. _________________________________
2. _________________________________
3. _________________________________

### Components Working Perfectly
- [ ] PostgreSQL Database
- [ ] MongoDB Database
- [ ] Backend API Authentication
- [ ] Backend API User Management
- [ ] Backend API Contacts
- [ ] Frontend Login/Logout
- [ ] Frontend UI Rendering
- [ ] ML Service Health
- [ ] SignalR Real-time Communication
- [ ] Video/Audio Calling

### Next Steps
1. _________________________________
2. _________________________________
3. _________________________________

---

## Notes Section

Use this space for additional observations, screenshots, or detailed error logs:

_________________________________
_________________________________
_________________________________
_________________________________
_________________________________
