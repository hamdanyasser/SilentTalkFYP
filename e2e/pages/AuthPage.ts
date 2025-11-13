import { Page, Locator } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly registerLink: Locator;
  readonly loginLink: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly displayNameInput: Locator;
  readonly registerButton: Locator;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.registerLink = page.getByRole('link', { name: /sign up|register/i });
    this.loginLink = page.getByRole('link', { name: /sign in|login/i });
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/^password$/i);
    this.confirmPasswordInput = page.getByLabel(/confirm password/i);
    this.displayNameInput = page.getByLabel(/display name|name/i);
    this.registerButton = page.getByRole('button', { name: /sign up|register/i });
    this.loginButton = page.getByRole('button', { name: /sign in|login/i });
    this.logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    this.errorMessage = page.locator('[role="alert"], .error-message');
    this.successMessage = page.locator('.success-message, [role="status"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async gotoRegister() {
    await this.goto();
    await this.registerLink.click();
    await this.page.waitForURL(/.*register.*/);
  }

  async gotoLogin() {
    await this.goto();
    await this.loginLink.click();
    await this.page.waitForURL(/.*login.*/);
  }

  async register(email: string, password: string, displayName: string) {
    await this.gotoRegister();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.displayNameInput.fill(displayName);
    await this.registerButton.click();

    // Wait for either success or error
    await Promise.race([
      this.successMessage.waitFor({ timeout: 10000 }),
      this.errorMessage.waitFor({ timeout: 10000 }),
      this.page.waitForURL(/.*verify|dashboard|home.*/),
    ]);
  }

  async login(email: string, password: string) {
    await this.gotoLogin();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();

    // Wait for navigation to dashboard/home
    await this.page.waitForURL(/.*dashboard|home|calls.*/, { timeout: 15000 });
  }

  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL(/.*login|^\/$/, { timeout: 5000 });
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.logoutButton.waitFor({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}
