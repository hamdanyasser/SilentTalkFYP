# End-to-End Testing with Playwright

Comprehensive E2E test suite for SilentTalk FYP, validating all functional requirements and acceptance criteria.

## Overview

This E2E test suite covers:
- ✅ Authentication flows (registration, login, logout, password reset)
- ✅ Video call functionality (start, controls, multi-party, WebRTC)
- ✅ Sign language recognition (ML integration, captions, TTS)
- ✅ Community forum (threads, replies, search, moderation)
- ✅ Learning library (tutorials, videos, glossary, progress tracking)
- ✅ **Acceptance criteria validation** (performance, accessibility, security)

## Prerequisites

### Services Must Be Running

Before running E2E tests, ensure all services are started:

```bash
# Terminal 1: Backend API
cd server
dotnet run

# Terminal 2: ML Service
cd ml-service
python main.py

# Terminal 3: Frontend
cd client
npm run dev
```

**Expected Service URLs:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- ML Service: `http://localhost:8000`

### Install Dependencies

```bash
cd e2e
npm install
npx playwright install --with-deps
```

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Specific Test Suite

```bash
# Authentication tests
npx playwright test 01-auth-flow

# Video call tests
npx playwright test 02-video-call-flow

# Sign recognition tests
npx playwright test 03-sign-recognition

# Forum tests
npx playwright test 04-forum-flow

# Library tests
npx playwright test 05-library-flow

# Acceptance criteria validation
npx playwright test 06-acceptance-criteria
```

### Run in UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

This opens Playwright's UI mode where you can:
- Run tests interactively
- Debug step-by-step
- View traces and screenshots
- Watch tests in real-time

### Run in Debug Mode

```bash
npm run test:e2e:debug
```

### Run Tests in Specific Browser

```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit (Safari) only
npx playwright test --project=webkit

# Mobile Chrome
npx playwright test --project="Mobile Chrome"

# Mobile Safari
npx playwright test --project="Mobile Safari"
```

### Run Tests in Headed Mode

```bash
npx playwright test --headed
```

## Test Reports

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

This will open an interactive HTML report showing:
- Test results (pass/fail)
- Screenshots on failure
- Video recordings
- Traces for debugging
- Performance metrics

## Test Structure

```
e2e/
├── fixtures/
│   └── test-fixtures.ts         # Custom Playwright fixtures
├── helpers/
│   ├── PerformanceMonitor.ts    # Performance measurement utilities
│   └── AccessibilityChecker.ts  # WCAG AA validation utilities
├── pages/
│   ├── AuthPage.ts              # Authentication page object
│   ├── VideoCallPage.ts         # Video call page object
│   ├── ForumPage.ts             # Forum page object
│   └── LibraryPage.ts           # Library page object
├── tests/
│   ├── 01-auth-flow.spec.ts              # Authentication tests
│   ├── 02-video-call-flow.spec.ts        # Video call tests
│   ├── 03-sign-recognition.spec.ts       # Sign recognition tests
│   ├── 04-forum-flow.spec.ts             # Forum tests
│   ├── 05-library-flow.spec.ts           # Library tests
│   └── 06-acceptance-criteria.spec.ts    # Acceptance criteria validation
├── global-setup.ts              # Pre-test service health checks
├── global-teardown.ts           # Post-test cleanup
├── playwright.config.ts         # Playwright configuration
└── package.json                 # Dependencies and scripts
```

## Page Object Model (POM)

Tests use the Page Object Model pattern for maintainability:

```typescript
// Example: Using AuthPage
test('should login', async ({ authPage }) => {
  await authPage.login('user@example.com', 'password');
  // Assertions...
});

// Example: Using VideoCallPage
test('should start video call', async ({ videoCallPage }) => {
  await videoCallPage.goto();
  await videoCallPage.startCall();
  await videoCallPage.toggleMute();
  await videoCallPage.endCall();
});
```

## Custom Fixtures

### PerformanceMonitor

Measures performance metrics to validate NFR-001:

```typescript
test('performance test', async ({ performanceMonitor }) => {
  // Measure API latency
  const apiValid = await performanceMonitor.validateApiSLO('/api/health', 200);
  expect(apiValid).toBe(true);

  // Measure video latency
  const videoValid = await performanceMonitor.validateVideoLatency(150);
  expect(videoValid).toBe(true);

  // Measure page load
  const metrics = await performanceMonitor.measurePageLoad();
  expect(metrics.totalLoadTime).toBeLessThan(2000);
});
```

### AccessibilityChecker

Validates WCAG 2.1 AA compliance (NFR-006):

```typescript
test('accessibility test', async ({ page, accessibilityChecker }) => {
  await page.goto('/dashboard');

  // Full WCAG AA validation
  const compliant = await accessibilityChecker.validateWCAG_AA();
  expect(compliant).toBe(true);

  // Specific checks
  const keyboardWorks = await accessibilityChecker.testKeyboardNavigation();
  const contrastValid = await accessibilityChecker.testColorContrast();
  const screenReaderOK = await accessibilityChecker.testScreenReaderCompatibility();
});
```

### AuthenticatedPage

Automatically logs in before tests:

```typescript
test('authenticated test', async ({ authenticatedPage }) => {
  // User is already logged in
  await authenticatedPage.goto('/dashboard');
  // Test authenticated features...
});
```

## Acceptance Criteria Validation

The `06-acceptance-criteria.spec.ts` test suite validates all FYP requirements:

### NFR-001: Performance Requirements
- ✅ ML model accuracy ≥85%
- ✅ ML inference time <100ms
- ✅ API p95 latency <200ms
- ✅ Video call latency <150ms
- ✅ Page load time <2s

### NFR-006: Accessibility Requirements
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ Color contrast ratios (4.5:1 for text, 3:1 for UI components)

### NFR-004: Security Requirements
- ✅ Authentication & authorization
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ Rate limiting

### NFR-003: Reliability Requirements
- ✅ Service health monitoring
- ✅ Graceful degradation
- ✅ Database connectivity

### NFR-007: Functionality Requirements
- ✅ Multiple sign language support (ASL, BSL, ISL)
- ✅ Real-time video communication
- ✅ Community features
- ✅ Learning resources

Run acceptance criteria tests:

```bash
npx playwright test 06-acceptance-criteria
```

## Continuous Integration

### GitHub Actions

Tests run automatically on:
- Every push to feature branches
- Pull requests to main/master
- Scheduled nightly builds

See `.github/workflows/e2e-tests.yml` for configuration.

### Test Data

The test suite uses:
- **Test user account**: `testuser@silenttalk.com` / `TestPass123!`
- **Database**: Separate test database (seeded in CI)
- **ML models**: Pre-loaded test models

### Environment Variables

Configure tests with environment variables:

```bash
# Base URL for frontend
export BASE_URL=http://localhost:3000

# API URL
export API_URL=http://localhost:5000

# ML Service URL
export ML_SERVICE_URL=http://localhost:8000

# Test user credentials
export TEST_USER_EMAIL=testuser@silenttalk.com
export TEST_USER_PASSWORD=TestPass123!
```

Or create `.env` file in `e2e/`:

```env
BASE_URL=http://localhost:3000
API_URL=http://localhost:5000
ML_SERVICE_URL=http://localhost:8000
TEST_USER_EMAIL=testuser@silenttalk.com
TEST_USER_PASSWORD=TestPass123!
```

## Debugging Failed Tests

### View Trace

When a test fails, Playwright captures a trace:

```bash
npx playwright show-trace test-results/trace.zip
```

### View Screenshot

Screenshots are saved in `test-results/`:

```bash
ls test-results/
```

### Run Single Test in Debug Mode

```bash
npx playwright test --debug 01-auth-flow -g "should login"
```

### Common Issues

#### Services Not Running

**Error**: `connect ECONNREFUSED ::1:3000`

**Solution**: Ensure all services are running (frontend, backend, ML service)

#### Permission Denied

**Error**: Camera/microphone permission errors

**Solution**: Tests automatically grant permissions via `page.context().grantPermissions(['camera', 'microphone'])`

#### Timeout Errors

**Error**: `Timeout 30000ms exceeded`

**Solution**: Increase timeout in test or check if service is slow to respond

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

#### Flaky Tests

If tests fail intermittently:

```bash
# Run test multiple times
npx playwright test --repeat-each=5 flaky-test
```

## Best Practices

### Writing New Tests

1. **Use Page Objects**: Create page objects for new pages in `pages/`
2. **Use Fixtures**: Leverage custom fixtures for common functionality
3. **Descriptive Names**: Use clear test names describing what is being tested
4. **Arrange-Act-Assert**: Structure tests clearly
5. **Avoid Hard-coded Waits**: Use `waitForLoadState`, `waitForURL`, `waitForSelector` instead of `waitForTimeout`

Example:

```typescript
test('should create forum thread', async ({ forumPage, page }) => {
  // Arrange
  await forumPage.goto();
  const threadData = {
    title: 'Test Thread',
    content: 'Test content',
  };

  // Act
  await forumPage.createThread(threadData.title, threadData.content);

  // Assert
  await expect(page).toHaveURL(/forum\/thread\/.*/);
  const title = page.getByRole('heading', { name: threadData.title });
  await expect(title).toBeVisible();
});
```

### Parallel Execution

Playwright runs tests in parallel by default. Configure in `playwright.config.ts`:

```typescript
export default defineConfig({
  workers: process.env.CI ? 2 : 4, // 2 workers in CI, 4 locally
  fullyParallel: true,
});
```

### Test Isolation

Each test runs in isolated browser context:
- Separate cookies
- Separate localStorage
- Separate permissions

This ensures tests don't interfere with each other.

## Performance Monitoring

### Enable Performance Logging

```bash
DEBUG=pw:api npx playwright test
```

### Measure Test Duration

```bash
npx playwright test --reporter=list
```

Shows duration of each test.

## Maintenance

### Update Playwright

```bash
npm install -D @playwright/test@latest
npx playwright install
```

### Update Browsers

```bash
npx playwright install --with-deps
```

### Clean Test Results

```bash
rm -rf test-results/
rm -rf playwright-report/
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)

## Support

For issues or questions:
- Check test logs in `test-results/`
- Review Playwright trace at `playwright show-trace`
- Consult [Developer Guide](../docs/DEVELOPER_GUIDE.md)
- Open issue on GitHub

---

**Last Updated**: 2025-01-13
**Playwright Version**: 1.40+
**Node Version**: 18+
