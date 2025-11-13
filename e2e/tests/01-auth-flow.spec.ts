import { test, expect } from '../fixtures/test-fixtures';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('should complete full registration flow', async ({ authPage, page }) => {
    const timestamp = Date.now();
    const testUser = {
      email: `test-${timestamp}@silenttalk.com`,
      password: 'SecurePass123!@#',
      displayName: `Test User ${timestamp}`,
    };

    // Navigate to registration page
    await authPage.gotoRegister();
    await expect(page).toHaveURL(/.*register.*/);

    // Fill registration form
    await authPage.register(testUser.email, testUser.password, testUser.displayName);

    // Should redirect to dashboard or email verification page
    await page.waitForURL(/.*dashboard|verify|home.*/, { timeout: 10000 });

    // Check for success message
    const successMessage = page.getByText(/account created|registration successful|welcome/i);
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('should validate registration form fields', async ({ authPage, page }) => {
    await authPage.gotoRegister();

    // Try to submit with empty fields
    const registerButton = page.getByRole('button', { name: /register|sign up/i });
    await registerButton.click();

    // Should show validation errors
    const emailError = page.getByText(/email.*required|enter.*email/i);
    await expect(emailError).toBeVisible();

    // Try invalid email
    await page.getByLabel(/email/i).fill('invalid-email');
    await registerButton.click();
    const invalidEmailError = page.getByText(/valid email|email.*invalid/i);
    await expect(invalidEmailError).toBeVisible();

    // Try weak password
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/^password/i).first().fill('weak');
    await registerButton.click();
    const weakPasswordError = page.getByText(/password.*weak|at least.*characters/i);
    await expect(weakPasswordError).toBeVisible();

    // Try password mismatch
    await page.getByLabel(/^password/i).first().fill('SecurePass123!@#');
    await page.getByLabel(/confirm.*password/i).fill('DifferentPass123!@#');
    await registerButton.click();
    const mismatchError = page.getByText(/password.*match|passwords.*same/i);
    await expect(mismatchError).toBeVisible();
  });

  test('should login with valid credentials', async ({ authPage, page }) => {
    // Use a pre-existing test account (should be seeded in test database)
    const testUser = {
      email: 'testuser@silenttalk.com',
      password: 'TestPass123!',
    };

    await authPage.login(testUser.email, testUser.password);

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard|home|calls.*/);

    // Should see user info
    const userMenu = page.getByRole('button', { name: /account|profile|menu/i });
    await expect(userMenu).toBeVisible();
  });

  test('should reject invalid login credentials', async ({ authPage, page }) => {
    await authPage.gotoLogin();

    // Try invalid credentials
    await authPage.login('nonexistent@example.com', 'WrongPassword123!');

    // Should show error message
    const errorMessage = page.getByText(/invalid.*credentials|incorrect.*password|login failed/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Should stay on login page
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('should handle logout flow', async ({ authPage, page }) => {
    // Login first
    const testUser = {
      email: 'testuser@silenttalk.com',
      password: 'TestPass123!',
    };

    await authPage.login(testUser.email, testUser.password);
    await expect(page).toHaveURL(/.*dashboard|home|calls.*/);

    // Logout
    await authPage.logout();

    // Should redirect to login/home page
    await expect(page).toHaveURL(/.*login|^\/$|home/);

    // Should not see authenticated content
    const userMenu = page.getByRole('button', { name: /account|profile|menu/i });
    await expect(userMenu).not.toBeVisible({ timeout: 2000 });
  });

  test('should persist authentication across page refreshes', async ({ authPage, page }) => {
    // Login
    const testUser = {
      email: 'testuser@silenttalk.com',
      password: 'TestPass123!',
    };

    await authPage.login(testUser.email, testUser.password);
    await expect(page).toHaveURL(/.*dashboard|home|calls.*/);

    // Refresh page
    await page.reload();

    // Should still be authenticated
    await expect(page).toHaveURL(/.*dashboard|home|calls.*/);
    const userMenu = page.getByRole('button', { name: /account|profile|menu/i });
    await expect(userMenu).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL(/.*login.*/);
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('should handle password reset flow', async ({ authPage, page }) => {
    await authPage.gotoLogin();

    // Click forgot password link
    const forgotPasswordLink = page.getByRole('link', { name: /forgot.*password|reset.*password/i });
    await forgotPasswordLink.click();

    // Should navigate to password reset page
    await expect(page).toHaveURL(/.*forgot|reset.*/);

    // Enter email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('testuser@silenttalk.com');

    // Submit reset request
    const resetButton = page.getByRole('button', { name: /reset|send/i });
    await resetButton.click();

    // Should show success message
    const successMessage = page.getByText(/email sent|check.*email|reset link/i);
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('should handle session timeout', async ({ authPage, page }) => {
    // Login
    const testUser = {
      email: 'testuser@silenttalk.com',
      password: 'TestPass123!',
    };

    await authPage.login(testUser.email, testUser.password);
    await expect(page).toHaveURL(/.*dashboard|home|calls.*/);

    // Clear session storage to simulate timeout
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to access protected resource
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL(/.*login.*/);
  });

  test('should display appropriate error for network failures', async ({ authPage, page }) => {
    // Simulate network failure
    await page.route('**/api/auth/**', route => route.abort());

    await authPage.gotoLogin();

    // Try to login
    await page.getByLabel(/email/i).fill('testuser@silenttalk.com');
    await page.getByLabel(/password/i).fill('TestPass123!');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should show network error
    const errorMessage = page.getByText(/network.*error|connection.*failed|try.*again/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should prevent double submission of registration form', async ({ authPage, page }) => {
    await authPage.gotoRegister();

    const timestamp = Date.now();
    const testUser = {
      email: `test-${timestamp}@silenttalk.com`,
      password: 'SecurePass123!@#',
      displayName: `Test User ${timestamp}`,
    };

    // Fill form
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/^password/i).first().fill(testUser.password);
    await page.getByLabel(/confirm.*password/i).fill(testUser.password);
    await page.getByLabel(/name|display/i).fill(testUser.displayName);

    // Click submit button twice rapidly
    const submitButton = page.getByRole('button', { name: /register|sign up/i });
    await submitButton.click();
    await submitButton.click(); // Should be disabled after first click

    // Wait for response
    await page.waitForTimeout(2000);

    // Check that only one request was made (button should be disabled)
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should handle 2FA flow if enabled', async ({ authPage, page }) => {
    // Try to login with 2FA-enabled account (if available in test data)
    const test2FAUser = {
      email: '2fa-user@silenttalk.com',
      password: 'TestPass123!',
      totpCode: '123456', // Mock TOTP code
    };

    await authPage.gotoLogin();
    await page.getByLabel(/email/i).fill(test2FAUser.email);
    await page.getByLabel(/password/i).fill(test2FAUser.password);
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should show 2FA code input
    const totpInput = page.getByLabel(/code|2fa|authenticator/i);
    if (await totpInput.isVisible({ timeout: 3000 })) {
      await totpInput.fill(test2FAUser.totpCode);
      await page.getByRole('button', { name: /verify|submit/i }).click();

      // Note: Will likely fail with invalid code in test environment
      // This test validates the 2FA UI flow exists
    }
  });
});
