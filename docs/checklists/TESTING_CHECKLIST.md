# Comprehensive Testing Checklist

> Complete testing checklist for SilentTalk covering all testing levels

**Version:** 1.0
**Last Updated:** 2025-11-13

---

## Unit Testing

### Backend (.NET)

**Coverage Target:** ≥80%

- [ ] **Domain Layer Tests**
  - [ ] Entity validation tests
  - [ ] Value object tests
  - [ ] Domain logic tests
  - [ ] Business rule validation

- [ ] **Application Layer Tests**
  - [ ] Service method tests
  - [ ] DTO mapping tests
  - [ ] Validation tests
  - [ ] Authorization logic tests

- [ ] **Infrastructure Layer Tests**
  - [ ] Repository tests (with test database)
  - [ ] External service client tests (mocked)
  - [ ] File storage tests
  - [ ] Cache tests

- [ ] **API Layer Tests**
  - [ ] Controller action tests
  - [ ] Middleware tests
  - [ ] Filter tests
  - [ ] Error handling tests

**Testing Frameworks:**
- xUnit for test framework
- Moq for mocking
- FluentAssertions for assertions
- AutoFixture for test data generation

**Run Tests:**
```bash
cd server
dotnet test
dotnet test /p:CollectCoverage=true /p:CoverageReportsFormat=opencover
```

### Frontend (React + TypeScript)

**Coverage Target:** ≥75%

- [ ] **Component Tests**
  - [ ] Rendering tests
  - [ ] Props validation tests
  - [ ] Event handler tests
  - [ ] Conditional rendering tests
  - [ ] Error boundary tests

- [ ] **Hook Tests**
  - [ ] Custom hook behavior
  - [ ] State management
  - [ ] Side effects
  - [ ] Cleanup functions

- [ ] **Service Tests**
  - [ ] API service tests (mocked)
  - [ ] WebRTC service tests
  - [ ] SignalR client tests
  - [ ] ML service client tests

- [ ] **Utility Tests**
  - [ ] Helper function tests
  - [ ] Formatter tests
  - [ ] Validator tests
  - [ ] Content filter tests

**Testing Frameworks:**
- Vitest for test runner
- React Testing Library for component tests
- MSW (Mock Service Worker) for API mocking

**Run Tests:**
```bash
cd client
npm test
npm run test:coverage
```

### ML Service (Python)

**Coverage Target:** ≥80%

- [ ] **Service Tests**
  - [ ] Recognition service tests
  - [ ] MediaPipe extraction tests
  - [ ] ONNX inference tests
  - [ ] Streaming service tests

- [ ] **Model Tests**
  - [ ] Input validation tests
  - [ ] Output format tests
  - [ ] Error handling tests

- [ ] **Utility Tests**
  - [ ] Preprocessing tests
  - [ ] Landmark normalization tests
  - [ ] Confidence calculation tests

**Testing Frameworks:**
- pytest for test framework
- pytest-mock for mocking
- pytest-cov for coverage

**Run Tests:**
```bash
cd ml-service
pytest
pytest --cov=app --cov-report=html
```

---

## Integration Testing

### API Integration Tests

- [ ] **Authentication Flow**
  - [ ] Register → Verify Email → Login
  - [ ] Login → Refresh Token → Logout
  - [ ] 2FA Setup → 2FA Verify
  - [ ] Password Reset → Set New Password

- [ ] **Video Call Flow**
  - [ ] Create Call → Join Call → Leave Call
  - [ ] Invite Participants → Accept Invitation
  - [ ] Start Recording → Stop Recording
  - [ ] Schedule Call → Join Scheduled Call

- [ ] **Forum Flow**
  - [ ] Create Thread → Reply → Edit → Delete
  - [ ] Search Threads → Filter by Category
  - [ ] Vote → Report → Moderate

- [ ] **Privacy Flow**
  - [ ] Update Privacy Settings
  - [ ] Request Data Export → Download Export
  - [ ] Request Account Deletion → Cancel Deletion

- [ ] **Error Scenarios**
  - [ ] Invalid authentication
  - [ ] Missing required fields
  - [ ] Unauthorized access
  - [ ] Resource not found
  - [ ] Rate limiting

**Run Tests:**
```bash
cd server/tests/Integration
dotnet test
```

### Database Integration Tests

- [ ] **Migrations**
  - [ ] All migrations apply successfully
  - [ ] Migrations are reversible
  - [ ] No data loss during migration
  - [ ] Indexes created correctly

- [ ] **Queries**
  - [ ] Complex joins perform well
  - [ ] N+1 queries avoided
  - [ ] Proper use of indexes
  - [ ] Transactions rollback correctly

- [ ] **Constraints**
  - [ ] Foreign key constraints enforced
  - [ ] Unique constraints enforced
  - [ ] Check constraints working
  - [ ] Default values applied

**Run Tests:**
```bash
cd server
dotnet ef database update --project src/SilentTalk.Infrastructure
./scripts/test-migrations.sh
```

### External Service Integration

- [ ] **SignalR Integration**
  - [ ] Connection established
  - [ ] Messages sent/received
  - [ ] Reconnection works
  - [ ] Group management

- [ ] **WebRTC Integration**
  - [ ] ICE candidates exchanged
  - [ ] Offer/Answer negotiation
  - [ ] Media streams established
  - [ ] TURN server fallback

- [ ] **ML Service Integration**
  - [ ] WebSocket connection
  - [ ] Frame processing
  - [ ] Recognition results
  - [ ] Error handling

- [ ] **Storage Integration (MinIO)**
  - [ ] File upload
  - [ ] File download
  - [ ] File deletion
  - [ ] Signed URLs

---

## End-to-End (E2E) Testing

### Critical User Flows

- [ ] **User Registration & Onboarding**
  - [ ] Navigate to registration page
  - [ ] Fill registration form
  - [ ] Verify email link click
  - [ ] Complete profile setup
  - [ ] Upload profile picture
  - [ ] Set accessibility preferences

- [ ] **Authentication**
  - [ ] Login with valid credentials
  - [ ] Login with invalid credentials (error shown)
  - [ ] Enable 2FA
  - [ ] Login with 2FA code
  - [ ] Logout
  - [ ] Session timeout handling

- [ ] **Video Call (Core Feature)**
  - [ ] Start new video call
  - [ ] Grant camera/microphone permissions
  - [ ] Wait for second user to join
  - [ ] Verify video streams visible
  - [ ] Toggle audio (mute/unmute)
  - [ ] Toggle video (camera on/off)
  - [ ] Enable live captions
  - [ ] Verify captions appear
  - [ ] Use TTS functionality
  - [ ] Share screen
  - [ ] End call
  - [ ] Call history updated

- [ ] **Sign Language Recognition**
  - [ ] Enable sign recognition in call
  - [ ] Perform known sign
  - [ ] Verify caption appears with correct text
  - [ ] Verify confidence score displayed
  - [ ] Test multiple signs in sequence
  - [ ] Test accuracy >85%

- [ ] **Community Forum**
  - [ ] Browse forum categories
  - [ ] Click on thread
  - [ ] Read thread and replies
  - [ ] Create new thread with text and image
  - [ ] Reply to existing thread
  - [ ] Edit own post
  - [ ] Delete own post
  - [ ] Search for threads
  - [ ] Filter by category
  - [ ] Upvote/downvote posts

- [ ] **Learning Resources**
  - [ ] Browse tutorials
  - [ ] Watch tutorial video
  - [ ] Complete interactive lesson
  - [ ] Search glossary
  - [ ] View sign demonstration
  - [ ] Practice with feedback
  - [ ] Track progress

- [ ] **Privacy & Settings**
  - [ ] Update profile information
  - [ ] Change password
  - [ ] Update privacy settings
  - [ ] Manage cookie preferences
  - [ ] Request data export
  - [ ] Download export file
  - [ ] Verify export contains correct data

### Cross-Browser Testing

- [ ] **Chrome** (latest)
  - [ ] All critical flows
  - [ ] WebRTC functionality
  - [ ] Sign recognition

- [ ] **Firefox** (latest)
  - [ ] All critical flows
  - [ ] WebRTC functionality
  - [ ] Sign recognition

- [ ] **Safari** (latest)
  - [ ] All critical flows
  - [ ] WebRTC functionality
  - [ ] Sign recognition

- [ ] **Edge** (latest)
  - [ ] All critical flows
  - [ ] WebRTC functionality
  - [ ] Sign recognition

### Mobile Testing

- [ ] **iOS Safari**
  - [ ] Responsive layout
  - [ ] Touch interactions
  - [ ] Camera access
  - [ ] Video playback

- [ ] **Android Chrome**
  - [ ] Responsive layout
  - [ ] Touch interactions
  - [ ] Camera access
  - [ ] Video playback

**E2E Testing Tool:** Playwright

**Run Tests:**
```bash
npx playwright test
npx playwright test --headed
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

---

## Performance Testing

### API Performance (k6)

**Targets:**
- API p95 response time: <200ms
- Error rate: <1%
- Throughput: >1000 req/s

- [ ] **Smoke Test**
  - [ ] Single user, single request
  - [ ] All endpoints respond
  - [ ] No errors

- [ ] **Load Test**
  - [ ] Ramp up to 100 VUs over 5 minutes
  - [ ] Maintain for 10 minutes
  - [ ] Ramp down over 2 minutes
  - [ ] Verify p95 <200ms

- [ ] **Stress Test**
  - [ ] Ramp up to 500 VUs
  - [ ] Find breaking point
  - [ ] Verify graceful degradation

- [ ] **Spike Test**
  - [ ] Sudden traffic spike
  - [ ] Verify system recovery
  - [ ] No data corruption

- [ ] **Endurance Test**
  - [ ] Constant load for 1 hour
  - [ ] Monitor for memory leaks
  - [ ] Monitor for performance degradation

**Run Tests:**
```bash
cd performance-tests
k6 run api-performance.test.js
```

### WebRTC Performance

**Targets:**
- Connection establishment: <1 second
- Video latency: <150ms
- Packet loss: <1%

- [ ] **Connection Test**
  - [ ] Measure ICE gathering time
  - [ ] Measure connection establishment time
  - [ ] Verify <1 second total

- [ ] **Video Quality Test**
  - [ ] Measure frame rate
  - [ ] Measure resolution
  - [ ] Measure packet loss
  - [ ] Measure jitter

- [ ] **Network Conditions**
  - [ ] Test with good network (>10 Mbps)
  - [ ] Test with moderate network (2-5 Mbps)
  - [ ] Test with poor network (<1 Mbps)
  - [ ] Test with packet loss simulation

**Run Tests:**
```bash
cd performance-tests
k6 run webrtc-load.test.js
```

### ML Inference Performance

**Targets:**
- Inference time p95: <100ms
- ML model accuracy: ≥85%

- [ ] **Single Frame Inference**
  - [ ] Measure inference time
  - [ ] Verify <100ms p95

- [ ] **Batch Inference**
  - [ ] Test batch sizes (1, 4, 8, 16, 32)
  - [ ] Measure throughput
  - [ ] Identify optimal batch size

- [ ] **Concurrent Requests**
  - [ ] 10 concurrent users
  - [ ] 50 concurrent users
  - [ ] 100 concurrent users
  - [ ] Measure degradation

**Run Tests:**
```bash
cd performance-tests
k6 run ml-inference.test.js
```

### Frontend Performance

**Targets:**
- Page load time: <3 seconds
- Time to Interactive: <5 seconds
- Lighthouse Performance Score: >90

- [ ] **Page Load Metrics**
  - [ ] First Contentful Paint (FCP) <1.8s
  - [ ] Largest Contentful Paint (LCP) <2.5s
  - [ ] Time to Interactive (TTI) <5s
  - [ ] Total Blocking Time (TBT) <300ms
  - [ ] Cumulative Layout Shift (CLS) <0.1

- [ ] **Bundle Size**
  - [ ] Main bundle <200 KB (gzipped)
  - [ ] Vendor bundle <300 KB (gzipped)
  - [ ] Total initial load <500 KB

- [ ] **Lighthouse Audits**
  - [ ] Performance score >90
  - [ ] Accessibility score >95
  - [ ] Best Practices score >90
  - [ ] SEO score >90

**Run Tests:**
```bash
cd performance-tests
k6 run page-load-budget.test.js
npm run lighthouse
```

---

## Security Testing

### Authentication & Authorization

- [ ] **Brute Force Protection**
  - [ ] Account locked after 5 failed attempts
  - [ ] CAPTCHA presented after 3 failed attempts
  - [ ] Rate limiting enforced

- [ ] **Session Management**
  - [ ] Session expires after 30 minutes inactivity
  - [ ] Refresh token rotation
  - [ ] Logout invalidates session
  - [ ] Concurrent session limits

- [ ] **Password Security**
  - [ ] Minimum 8 characters enforced
  - [ ] Complexity requirements enforced
  - [ ] Password history checked (last 5)
  - [ ] Secure password reset flow

- [ ] **2FA Security**
  - [ ] TOTP codes expire after 30 seconds
  - [ ] Backup codes invalidated after use
  - [ ] 2FA required for sensitive operations

**Run Tests:**
```bash
cd security-tests
node authorization.test.js
```

### Injection Attacks

- [ ] **SQL Injection**
  - [ ] Test with malicious SQL in inputs
  - [ ] Verify parameterized queries used
  - [ ] No raw SQL construction

- [ ] **XSS (Cross-Site Scripting)**
  - [ ] Test with `<script>` tags in inputs
  - [ ] Verify output encoding
  - [ ] CSP headers present

- [ ] **Command Injection**
  - [ ] Test with shell commands in inputs
  - [ ] Verify input sanitization
  - [ ] No eval() usage

- [ ] **LDAP Injection**
  - [ ] Test with LDAP syntax in inputs
  - [ ] Verify LDAP escaping

**Run Tests:**
```bash
cd security-tests
node injection.test.js
```

### Security Headers

- [ ] **Required Headers Present**
  - [ ] Strict-Transport-Security (HSTS)
  - [ ] X-Frame-Options: SAMEORIGIN
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Content-Security-Policy
  - [ ] Referrer-Policy

- [ ] **Secure Cookie Attributes**
  - [ ] HttpOnly flag set
  - [ ] Secure flag set (HTTPS)
  - [ ] SameSite=Strict or Lax

**Run Tests:**
```bash
cd security-tests
node security-headers.test.js
```

### Dependency Vulnerabilities

- [ ] **Backend Dependencies**
  - [ ] No critical vulnerabilities
  - [ ] No high vulnerabilities
  - [ ] Dependencies up-to-date

- [ ] **Frontend Dependencies**
  - [ ] No critical vulnerabilities
  - [ ] No high vulnerabilities
  - [ ] Dependencies up-to-date

- [ ] **ML Service Dependencies**
  - [ ] No critical vulnerabilities
  - [ ] No high vulnerabilities
  - [ ] Dependencies up-to-date

**Run Tests:**
```bash
# Backend
cd server
dotnet list package --vulnerable

# Frontend
cd client
npm audit

# ML Service
cd ml-service
pip-audit
```

### Container Security

- [ ] **Image Scanning**
  - [ ] No critical vulnerabilities in base images
  - [ ] No high vulnerabilities in dependencies
  - [ ] Images signed and verified

- [ ] **Runtime Security**
  - [ ] Containers run as non-root
  - [ ] Read-only file systems where possible
  - [ ] Resource limits enforced
  - [ ] Network policies applied

**Run Tests:**
```bash
trivy image silenttalk/backend:latest
trivy image silenttalk/frontend:latest
trivy image silenttalk/ml-service:latest
```

---

## Accessibility Testing

### WCAG 2.1 AA Compliance

**Reference:** See `docs/accessibility/checklist.md` for complete checklist

**Critical Tests:**

- [ ] **Keyboard Navigation**
  - [ ] All interactive elements accessible via Tab
  - [ ] Focus indicators visible
  - [ ] No keyboard traps
  - [ ] Logical tab order

- [ ] **Screen Reader**
  - [ ] All images have alt text
  - [ ] Form labels properly associated
  - [ ] ARIA labels present where needed
  - [ ] Semantic HTML used

- [ ] **Color Contrast**
  - [ ] Text contrast ≥4.5:1
  - [ ] Large text contrast ≥3:1
  - [ ] UI component contrast ≥3:1

- [ ] **Responsive Design**
  - [ ] Content reflows at 320px width
  - [ ] Text resizes to 200% without loss
  - [ ] Touch targets ≥44×44px

**Automated Testing:**
```bash
# axe-core
npm run test:a11y

# Lighthouse
npm run lighthouse -- --only-categories=accessibility
```

**Manual Testing:**
- [ ] NVDA (Windows)
- [ ] JAWS (Windows)
- [ ] VoiceOver (macOS)
- [ ] TalkBack (Android)

---

## Acceptance Criteria Tests

### Performance Metrics (NFR-001)

- [ ] **API Response Time**
  - Target: p95 <200ms
  - Measured: ___ms
  - Status: ☐ Pass ☐ Fail

- [ ] **ML Inference Time**
  - Target: p95 <100ms
  - Measured: ___ms
  - Status: ☐ Pass ☐ Fail

- [ ] **Video Latency**
  - Target: <150ms
  - Measured: ___ms
  - Status: ☐ Pass ☐ Fail

- [ ] **Page Load Time**
  - Target: <3 seconds
  - Measured: ___s
  - Status: ☐ Pass ☐ Fail

### ML Accuracy (NFR-001)

- [ ] **Sign Recognition Accuracy**
  - Target: ≥85%
  - Measured: ___%
  - Status: ☐ Pass ☐ Fail

- [ ] **False Positive Rate**
  - Target: <5%
  - Measured: ___%
  - Status: ☐ Pass ☐ Fail

### Accessibility (NFR-005)

- [ ] **WCAG 2.1 AA Compliance**
  - Target: 100% compliance
  - Issues Found: ___
  - Status: ☐ Pass ☐ Fail

- [ ] **Keyboard Navigation**
  - All features accessible: ☐ Yes ☐ No

- [ ] **Screen Reader Compatibility**
  - NVDA: ☐ Pass ☐ Fail
  - JAWS: ☐ Pass ☐ Fail
  - VoiceOver: ☐ Pass ☐ Fail

### Security (NFR-004)

- [ ] **Critical Vulnerabilities**
  - Target: 0
  - Found: ___
  - Status: ☐ Pass ☐ Fail

- [ ] **High Vulnerabilities**
  - Target: 0
  - Found: ___
  - Status: ☐ Pass ☐ Fail

- [ ] **Security Headers**
  - All required headers: ☐ Yes ☐ No

### Uptime SLO (NFR-003)

- [ ] **Service Availability**
  - Target: 99.9% uptime
  - Measured: ___%
  - Status: ☐ Pass ☐ Fail

- [ ] **Error Rate**
  - Target: <1%
  - Measured: ___%
  - Status: ☐ Pass ☐ Fail

---

## Regression Testing

### Smoke Tests (After Each Deploy)

- [ ] Homepage loads
- [ ] Login works
- [ ] Start video call
- [ ] Sign recognition active
- [ ] Forum accessible
- [ ] No console errors

### Full Regression Suite (Weekly)

- [ ] All unit tests
- [ ] All integration tests
- [ ] Critical E2E flows
- [ ] Performance benchmarks
- [ ] Security scans
- [ ] Accessibility checks

---

## Test Environments

### Local Development

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Linting passes
- [ ] Type checking passes

### Staging

- [ ] All automated tests pass
- [ ] E2E tests pass
- [ ] Performance tests meet targets
- [ ] Security scans clean
- [ ] Accessibility tests pass

### Production

- [ ] Smoke tests pass post-deployment
- [ ] Monitoring shows healthy metrics
- [ ] No critical errors in logs
- [ ] User acceptance testing

---

## Test Reporting

### Metrics to Track

- [ ] Test coverage (unit, integration)
- [ ] Pass/fail rate
- [ ] Test execution time
- [ ] Flaky test rate
- [ ] Bug escape rate

### Reports Generated

- [ ] Unit test coverage report
- [ ] Integration test results
- [ ] E2E test results
- [ ] Performance test results
- [ ] Security scan results
- [ ] Accessibility audit results

---

**Checklist Version:** 1.0
**Last Updated:** 2025-11-13
**Maintained By:** QA Team
