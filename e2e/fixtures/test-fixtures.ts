import { test as base, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { VideoCallPage } from '../pages/VideoCallPage';
import { ForumPage } from '../pages/ForumPage';
import { LibraryPage } from '../pages/LibraryPage';
import { PerformanceMonitor } from '../helpers/PerformanceMonitor';
import { AccessibilityChecker } from '../helpers/AccessibilityChecker';

type TestFixtures = {
  authPage: AuthPage;
  videoCallPage: VideoCallPage;
  forumPage: ForumPage;
  libraryPage: LibraryPage;
  performanceMonitor: PerformanceMonitor;
  accessibilityChecker: AccessibilityChecker;
  authenticatedPage: any;
};

export const test = base.extend<TestFixtures>({
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },

  videoCallPage: async ({ page }, use) => {
    const videoCallPage = new VideoCallPage(page);
    await use(videoCallPage);
  },

  forumPage: async ({ page }, use) => {
    const forumPage = new ForumPage(page);
    await use(forumPage);
  },

  libraryPage: async ({ page }, use) => {
    const libraryPage = new LibraryPage(page);
    await use(libraryPage);
  },

  performanceMonitor: async ({ page }, use) => {
    const monitor = new PerformanceMonitor(page);
    await use(monitor);
  },

  accessibilityChecker: async ({ page }, use) => {
    const checker = new AccessibilityChecker(page);
    await use(checker);
  },

  authenticatedPage: async ({ page, authPage }, use) => {
    // Automatically authenticate before each test that uses this fixture
    await authPage.goto();
    await authPage.login(
      process.env.TEST_USER_EMAIL || 'test@example.com',
      process.env.TEST_USER_PASSWORD || 'Test123!@#'
    );
    await use(page);
    // Cleanup: logout
    await authPage.logout();
  },
});

export { expect };
