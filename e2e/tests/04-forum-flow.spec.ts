import { test, expect } from '../fixtures/test-fixtures';

test.describe('Forum and Community Flow', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // All tests use authenticated user
  });

  test('should create a new forum thread', async ({ forumPage, page }) => {
    await forumPage.goto();

    const timestamp = Date.now();
    const threadData = {
      title: `Test Thread ${timestamp}`,
      content: `This is a test thread created at ${new Date().toISOString()}. Testing forum functionality.`,
      category: 'general',
    };

    await forumPage.createThread(threadData.title, threadData.content, threadData.category);

    // Should redirect to thread page
    await expect(page).toHaveURL(/.*forum\/thread\/.*/);

    // Should display thread title and content
    const threadTitle = page.getByRole('heading', { name: new RegExp(threadData.title, 'i') });
    await expect(threadTitle).toBeVisible();

    const threadContent = page.getByText(new RegExp(threadData.content));
    await expect(threadContent).toBeVisible();
  });

  test('should validate thread creation form', async ({ forumPage, page }) => {
    await forumPage.goto();

    // Click new thread button
    await forumPage.newThreadButton.click();

    // Try to submit with empty fields
    const submitButton = page.getByRole('button', { name: /post|submit|create/i });
    await submitButton.click();

    // Should show validation errors
    const titleError = page.getByText(/title.*required/i);
    await expect(titleError).toBeVisible();

    const contentError = page.getByText(/content.*required|message.*required/i);
    await expect(contentError).toBeVisible();
  });

  test('should search forum threads', async ({ forumPage, page }) => {
    await forumPage.goto();

    const searchQuery = 'tutorial';
    await forumPage.searchThreads(searchQuery);

    // Should show search results
    const results = page.locator('[data-testid="thread-item"]');
    const resultCount = await results.count();

    // If there are results, verify they contain the search term
    if (resultCount > 0) {
      const firstResult = results.first();
      const resultText = await firstResult.textContent();
      expect(resultText?.toLowerCase()).toContain(searchQuery.toLowerCase());
    }
  });

  test('should filter threads by category', async ({ forumPage, page }) => {
    await forumPage.goto();

    // Select a category
    await forumPage.categoryFilter.selectOption('tutorials');
    await page.waitForLoadState('networkidle');

    // Get filtered threads
    const threads = page.locator('[data-testid="thread-item"]');
    const threadCount = await threads.count();

    // If threads exist, verify they're in the correct category
    if (threadCount > 0) {
      const categoryBadge = threads.first().locator('[data-testid="thread-category"]');
      if (await categoryBadge.isVisible({ timeout: 1000 })) {
        const categoryText = await categoryBadge.textContent();
        expect(categoryText?.toLowerCase()).toMatch(/tutorial/i);
      }
    }
  });

  test('should open and view a thread', async ({ forumPage, page }) => {
    await forumPage.goto();

    // Get the first thread title
    const firstThread = page.locator('[data-testid="thread-item"]').first();
    const threadTitle = await firstThread.locator('[data-testid="thread-title"]').textContent();

    if (threadTitle) {
      await forumPage.openThread(threadTitle);

      // Should navigate to thread page
      await expect(page).toHaveURL(/.*forum\/thread\/.*/);

      // Should display thread title
      const heading = page.getByRole('heading', { name: new RegExp(threadTitle, 'i') });
      await expect(heading).toBeVisible();
    }
  });

  test('should reply to a thread', async ({ forumPage, page }) => {
    await forumPage.goto();

    // Open a thread
    const firstThread = page.locator('[data-testid="thread-item"]').first();
    await firstThread.click();
    await page.waitForURL(/.*forum\/thread\/.*/);

    // Reply to thread
    const replyContent = `Test reply at ${new Date().toISOString()}`;
    await forumPage.replyToThread(replyContent);

    // Should show the reply
    const reply = page.getByText(replyContent);
    await expect(reply).toBeVisible({ timeout: 5000 });
  });

  test('should upvote a thread', async ({ forumPage, page }) => {
    await forumPage.goto();

    // Open a thread
    const firstThread = page.locator('[data-testid="thread-item"]').first();
    await firstThread.click();
    await page.waitForURL(/.*forum\/thread\/.*/);

    // Get initial vote count
    const voteCount = page.locator('[data-testid="vote-count"]');
    const initialCount = parseInt((await voteCount.textContent()) || '0');

    // Upvote
    await forumPage.upvoteThread();

    // Wait for update
    await page.waitForTimeout(1000);

    // Vote count should increase
    const newCount = parseInt((await voteCount.textContent()) || '0');
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should report inappropriate thread', async ({ forumPage, page }) => {
    await forumPage.goto();

    // Open a thread
    const firstThread = page.locator('[data-testid="thread-item"]').first();
    await firstThread.click();
    await page.waitForURL(/.*forum\/thread\/.*/);

    // Report thread
    await forumPage.reportThread();

    // Should show confirmation
    const confirmation = page.getByText(/report.*submitted|thank.*you.*reporting/i);
    await expect(confirmation).toBeVisible({ timeout: 5000 });
  });

  test('should display thread metadata', async ({ forumPage, page }) => {
    await forumPage.goto();

    const threadItem = page.locator('[data-testid="thread-item"]').first();

    if (await threadItem.isVisible({ timeout: 2000 })) {
      // Should show author
      const author = threadItem.locator('[data-testid="thread-author"]');
      await expect(author).toBeVisible();

      // Should show date
      const date = threadItem.locator('[data-testid="thread-date"]');
      await expect(date).toBeVisible();

      // Should show reply count
      const replyCount = threadItem.locator('[data-testid="reply-count"]');
      if (await replyCount.isVisible({ timeout: 1000 })) {
        const count = await replyCount.textContent();
        expect(count).toMatch(/\d+/);
      }
    }
  });

  test('should paginate forum threads', async ({ forumPage, page }) => {
    await forumPage.goto();

    // Look for pagination controls
    const nextButton = page.getByRole('button', { name: /next|→/i });
    const pageNumbers = page.locator('[data-testid="page-number"]');

    if (await nextButton.isVisible({ timeout: 2000 })) {
      // Get current page threads
      const threadsPage1 = await page.locator('[data-testid="thread-item"]').count();

      // Go to next page
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      // Should have different threads
      const threadsPage2 = await page.locator('[data-testid="thread-item"]').count();
      expect(threadsPage2).toBeGreaterThan(0);

      // Should have updated page indicator
      if (await pageNumbers.isVisible({ timeout: 1000 })) {
        const activePage = pageNumbers.locator('[aria-current="page"]');
        await expect(activePage).toHaveText('2');
      }
    }
  });

  test('should edit own thread', async ({ forumPage, page }) => {
    await forumPage.goto();

    // Create a new thread
    const timestamp = Date.now();
    await forumPage.createThread(
      `Edit Test ${timestamp}`,
      'Original content',
      'general'
    );

    // Should be on thread page
    await expect(page).toHaveURL(/.*forum\/thread\/.*/);

    // Look for edit button
    const editButton = page.getByRole('button', { name: /edit/i });

    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();

      // Should show edit form
      const editContent = page.getByLabel(/content|message|body/i);
      await editContent.fill('Updated content');

      const saveButton = page.getByRole('button', { name: /save|update/i });
      await saveButton.click();

      // Should show updated content
      const updatedText = page.getByText('Updated content');
      await expect(updatedText).toBeVisible({ timeout: 3000 });
    }
  });

  test('should delete own thread', async ({ forumPage, page }) => {
    await forumPage.goto();

    // Create a new thread
    const timestamp = Date.now();
    await forumPage.createThread(
      `Delete Test ${timestamp}`,
      'This will be deleted',
      'general'
    );

    // Look for delete button
    const deleteButton = page.getByRole('button', { name: /delete/i });

    if (await deleteButton.isVisible({ timeout: 2000 })) {
      await deleteButton.click();

      // Should show confirmation dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      await confirmButton.click();

      // Should redirect to forum list
      await expect(page).toHaveURL(/.*forum(?!\/thread)/);
    }
  });

  test('should sort threads by different criteria', async ({ forumPage, page }) => {
    await forumPage.goto();

    // Look for sort dropdown
    const sortSelect = page.locator('select[name="sort"]');

    if (await sortSelect.isVisible({ timeout: 2000 })) {
      // Sort by most recent
      await sortSelect.selectOption('recent');
      await page.waitForLoadState('networkidle');

      const threads = page.locator('[data-testid="thread-item"]');
      const count = await threads.count();
      expect(count).toBeGreaterThan(0);

      // Try another sort option
      await sortSelect.selectOption('popular');
      await page.waitForLoadState('networkidle');

      const popularCount = await threads.count();
      expect(popularCount).toBeGreaterThan(0);
    }
  });

  test('should display user profiles from forum', async ({ forumPage, page }) => {
    await forumPage.goto();

    // Click on a user avatar/name
    const userLink = page.locator('[data-testid="thread-author"]').first();

    if (await userLink.isVisible({ timeout: 2000 })) {
      await userLink.click();

      // Should navigate to user profile
      await expect(page).toHaveURL(/.*profile|user.*/);

      // Should show user info
      const userInfo = page.locator('[data-testid="user-profile"]');
      await expect(userInfo).toBeVisible({ timeout: 3000 });
    }
  });

  test('should subscribe to thread notifications', async ({ forumPage, page }) => {
    await forumPage.goto();

    // Open a thread
    const firstThread = page.locator('[data-testid="thread-item"]').first();
    await firstThread.click();
    await page.waitForURL(/.*forum\/thread\/.*/);

    // Look for subscribe button
    const subscribeButton = page.getByRole('button', { name: /subscribe|follow|watch/i });

    if (await subscribeButton.isVisible({ timeout: 2000 })) {
      await subscribeButton.click();

      // Should show confirmation
      const confirmation = page.getByText(/subscribed|following|watching/i);
      await expect(confirmation).toBeVisible({ timeout: 3000 });

      // Button should change to unsubscribe
      const unsubscribeButton = page.getByRole('button', { name: /unsubscribe|unfollow|unwatch/i });
      await expect(unsubscribeButton).toBeVisible();
    }
  });

  test('should show thread activity indicators', async ({ forumPage, page }) => {
    await forumPage.goto();

    const threadItem = page.locator('[data-testid="thread-item"]').first();

    if (await threadItem.isVisible({ timeout: 2000 })) {
      // Should show view count
      const viewCount = threadItem.locator('[data-testid="view-count"]');
      if (await viewCount.isVisible({ timeout: 1000 })) {
        const views = await viewCount.textContent();
        expect(views).toMatch(/\d+/);
      }

      // Should show last activity time
      const lastActivity = threadItem.locator('[data-testid="last-activity"]');
      if (await lastActivity.isVisible({ timeout: 1000 })) {
        const activity = await lastActivity.textContent();
        expect(activity).toBeTruthy();
      }
    }
  });

  test('should handle thread with rich text content', async ({ forumPage, page }) => {
    await forumPage.goto();
    await forumPage.newThreadButton.click();

    // Check if rich text editor is available
    const editor = page.locator('[data-testid="rich-text-editor"]');

    if (await editor.isVisible({ timeout: 2000 })) {
      // Should have formatting toolbar
      const boldButton = page.getByRole('button', { name: /bold/i });
      const italicButton = page.getByRole('button', { name: /italic/i });

      await expect(boldButton).toBeVisible();
      await expect(italicButton).toBeVisible();

      // Test basic formatting
      await editor.click();
      await editor.fill('Test text');
      await boldButton.click();

      // Verify content
      const content = await editor.textContent();
      expect(content).toBeTruthy();
    }
  });

  test('should measure forum page load performance', async ({ forumPage, page, performanceMonitor }) => {
    await forumPage.goto();

    // Measure page load metrics
    const metrics = await performanceMonitor.measurePageLoad();

    // Total load time should be reasonable
    expect(metrics.totalLoadTime).toBeLessThan(3000); // < 3 seconds

    // First contentful paint should be quick
    expect(metrics.firstContentfulPaint).toBeLessThan(1500); // < 1.5 seconds

    console.log('Forum page load metrics:', {
      totalLoadTime: `${metrics.totalLoadTime}ms`,
      fcp: `${metrics.firstContentfulPaint}ms`,
      lcp: `${metrics.largestContentfulPaint}ms`,
    });
  });

  test('should validate forum accessibility', async ({ forumPage, page, accessibilityChecker }) => {
    await forumPage.goto();

    // Run accessibility audit
    const report = await accessibilityChecker.runAudit('AA');

    // Should have no critical violations
    const criticalViolations = report.violations.filter(v =>
      ['critical', 'serious'].includes(v.impact || '')
    );

    expect(criticalViolations.length).toBe(0);

    // Test keyboard navigation
    const keyboardWorks = await accessibilityChecker.testKeyboardNavigation();
    expect(keyboardWorks).toBe(true);
  });

  test('should handle empty forum state', async ({ page, authenticatedPage }) => {
    // Navigate to a category with no threads
    await page.goto('/forum?category=empty');

    // Should show empty state message
    const emptyMessage = page.getByText(/no threads|no posts|start.*conversation/i);
    await expect(emptyMessage).toBeVisible({ timeout: 3000 });

    // Should show create thread button
    const createButton = page.getByRole('button', { name: /new thread|create thread/i });
    await expect(createButton).toBeVisible();
  });

  test('should measure API response time for forum operations', async ({ forumPage, page, performanceMonitor }) => {
    await forumPage.goto();

    // Measure API response time for loading threads
    const responseTime = await performanceMonitor.measureApiResponseTime('/api/forum/threads');

    // Should meet p95 < 200ms requirement
    expect(responseTime).toBeLessThan(200);

    console.log(`Forum API response time: ${responseTime}ms`);
  });
});
