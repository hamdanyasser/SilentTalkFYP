# Testing Strategy

## Overview

This document outlines the testing strategy for the SilentTalk platform, covering unit tests, integration tests, end-to-end tests, and performance testing.

## Testing Pyramid

```
                    ▲
                   ╱ ╲
                  ╱   ╲
                 ╱ E2E ╲          ← Few, slow, expensive
                ╱───────╲
               ╱         ╲
              ╱Integration╲       ← Some, medium speed
             ╱─────────────╲
            ╱               ╲
           ╱  Unit Tests     ╲    ← Many, fast, cheap
          ╱___________________╲
```

## Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All critical paths
- **E2E Tests**: Core user journeys
- **Performance Tests**: All APIs under load

## Unit Testing

### Server (ASP.NET Core)

**Framework**: xUnit + Moq + FluentAssertions

**Test Structure**:
```csharp
public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly UserService _userService;

    public UserServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _userService = new UserService(_userRepositoryMock.Object);
    }

    [Fact]
    public async Task CreateUser_WithValidData_ShouldReturnUser()
    {
        // Arrange
        var createDto = new CreateUserDto { /* ... */ };

        // Act
        var result = await _userService.CreateAsync(createDto);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be(createDto.Email);
    }
}
```

**What to Test**:
- Service business logic
- Validators (FluentValidation)
- Entity behavior
- Utility functions
- Extension methods

**What NOT to Test**:
- Framework code (EF Core, ASP.NET)
- Database queries (use integration tests)
- External API calls (use mocks)

**Run Tests**:
```bash
cd server
dotnet test --logger "console;verbosity=detailed"
dotnet test --collect:"XPlat Code Coverage"
```

### Client (React + TypeScript)

**Framework**: Vitest + React Testing Library

**Test Structure**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LoginPage from './LoginPage'

describe('LoginPage', () => {
  it('should render login form', () => {
    render(<LoginPage />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('should call onSubmit when form is submitted', async () => {
    const mockSubmit = vi.fn()
    render(<LoginPage onSubmit={mockSubmit} />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })
})
```

**What to Test**:
- Component rendering
- User interactions
- State management (Redux slices)
- Utility functions
- Custom hooks

**What NOT to Test**:
- Implementation details
- Third-party libraries
- Styles (visual regression testing)

**Run Tests**:
```bash
cd client
npm test
npm run test:coverage
npm run test:ui  # Interactive UI
```

### ML Service (FastAPI + Python)

**Framework**: pytest + pytest-asyncio

**Test Structure**:
```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_recognize_sign_with_valid_image():
    async with AsyncClient(app=app, base_url="http://test") as client:
        with open("test_image.jpg", "rb") as f:
            response = await client.post(
                "/api/recognition/recognize",
                files={"image": f}
            )

    assert response.status_code == 200
    assert "prediction" in response.json()
```

**What to Test**:
- API endpoints
- Service logic
- MediaPipe integration
- Model inference
- Utility functions

**What NOT to Test**:
- FastAPI framework
- MediaPipe library
- External dependencies

**Run Tests**:
```bash
cd ml-service
pytest
pytest --cov=app --cov-report=html
pytest -v -s  # Verbose with stdout
```

## Integration Testing

### Server Integration Tests

**Purpose**: Test interaction between layers (API → Service → Repository → Database)

**Setup**:
- Use in-memory database (SQLite) or test database
- Seed test data
- Use WebApplicationFactory for testing

**Example**:
```csharp
public class AuthenticationIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AuthenticationIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Register_WithValidData_ShouldReturn201()
    {
        // Arrange
        var client = _factory.CreateClient();
        var registerDto = new RegisterDto { /* ... */ };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", registerDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}
```

### End-to-End (E2E) Testing

**Framework**: Playwright (recommended) or Cypress

**Test Structure**:
```typescript
import { test, expect } from '@playwright/test'

test('user can login and start video call', async ({ page }) => {
  // Navigate to login page
  await page.goto('http://localhost:3000/login')

  // Fill in credentials
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  // Should redirect to dashboard
  await expect(page).toHaveURL('http://localhost:3000/dashboard')

  // Start video call
  await page.click('button:has-text("Start Call")')

  // Should see video interface
  await expect(page.locator('video')).toBeVisible()
})
```

**Critical Paths to Test**:
1. User Registration → Email Verification → Login
2. Login → Dashboard → Profile Update
3. Login → Contacts → Start Video Call
4. Login → Forum → Create Post → Comment
5. Login → Resources → View → Download

**Run E2E Tests**:
```bash
npx playwright test
npx playwright test --headed  # With browser UI
npx playwright test --debug   # Debug mode
```

## Performance Testing

### Load Testing

**Framework**: k6

**Test Structure**:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% of requests < 200ms
    http_req_failed: ['rate<0.01'],    // < 1% errors
  },
};

export default function () {
  const res = http.get('http://localhost:5000/api/users');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
```

**Run Load Tests**:
```bash
k6 run performance-test.js
```

### ML Service Performance

**Test**: Measure inference time for sign recognition

```python
import time
import statistics

def test_inference_performance():
    times = []
    for _ in range(100):
        start = time.time()
        # Perform inference
        result = model.predict(image)
        end = time.time()
        times.append((end - start) * 1000)  # Convert to ms

    avg_time = statistics.mean(times)
    p95_time = statistics.quantiles(times, n=20)[18]  # 95th percentile

    assert avg_time < 100, f"Average inference time {avg_time}ms exceeds 100ms"
    assert p95_time < 150, f"P95 inference time {p95_time}ms exceeds 150ms"
```

## Test Data Management

### Fixtures

**Server (C#)**:
```csharp
public static class TestDataFixtures
{
    public static User CreateTestUser()
    {
        return new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            CreatedAt = DateTime.UtcNow
        };
    }
}
```

**Client (TypeScript)**:
```typescript
export const mockUser = {
  id: '123',
  email: 'test@example.com',
  username: 'testuser',
}

export const mockStore = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: {
    auth: {
      user: mockUser,
      isAuthenticated: true,
    },
  },
})
```

**ML Service (Python)**:
```python
@pytest.fixture
def sample_image():
    return cv2.imread("tests/fixtures/test_image.jpg")

@pytest.fixture
def mediapipe_service():
    return MediaPipeService()
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test-server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      - name: Run tests
        run: |
          cd server
          dotnet test --logger trx --collect:"XPlat Code Coverage"

  test-client:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Run tests
        run: |
          cd client
          npm ci
          npm test

  test-ml-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Run tests
        run: |
          cd ml-service
          pip install -r requirements.txt
          pytest --cov
```

## Test Naming Conventions

### Server (C#)
```
[MethodName]_[Scenario]_[ExpectedResult]

Examples:
- CreateUser_WithValidData_ShouldReturnUser
- UpdateUser_WithInvalidId_ShouldThrowNotFoundException
- DeleteUser_WhenUserExists_ShouldReturnTrue
```

### Client (TypeScript)
```
should [expected behavior] when [scenario]

Examples:
- should render error message when login fails
- should disable submit button when form is invalid
- should navigate to dashboard after successful login
```

### ML Service (Python)
```
test_[function]_[scenario]

Examples:
- test_recognize_sign_with_valid_image
- test_recognize_sign_with_invalid_format
- test_mediapipe_initialization_success
```

## Code Coverage

### Coverage Reports

```bash
# Server
cd server
dotnet test --collect:"XPlat Code Coverage"
reportgenerator -reports:**/coverage.cobertura.xml -targetdir:coverage-report

# Client
cd client
npm run test:coverage
open coverage/index.html

# ML Service
cd ml-service
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

### Coverage Goals

- **Critical Code**: 90%+
- **Business Logic**: 80%+
- **UI Components**: 70%+
- **Infrastructure**: 60%+

## Best Practices

### General
1. **Arrange-Act-Assert**: Structure all tests consistently
2. **One Assertion Per Test**: Focus on single behavior
3. **Descriptive Names**: Test names should explain what they test
4. **Fast Tests**: Keep unit tests under 100ms
5. **Deterministic**: No flaky tests, no randomness
6. **Isolated**: Tests should not depend on each other
7. **Maintainable**: Keep tests simple and readable

### Server (C#)
- Use `FluentAssertions` for readable assertions
- Mock external dependencies with `Moq`
- Use `AutoFixture` for test data generation
- Prefer `async` tests for database operations

### Client (TypeScript)
- Use `data-testid` for reliable element selection
- Mock API calls with `msw` (Mock Service Worker)
- Test user behavior, not implementation
- Use `userEvent` over `fireEvent` for realistic interactions

### ML Service (Python)
- Use `pytest` fixtures for setup/teardown
- Mock expensive operations (model loading, inference)
- Test with representative data samples
- Use `pytest-asyncio` for async tests

## References

- [xUnit Documentation](https://xunit.net/)
- [React Testing Library](https://testing-library.com/react)
- [Vitest Documentation](https://vitest.dev/)
- [pytest Documentation](https://docs.pytest.org/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
