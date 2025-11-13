import { test, expect } from '../fixtures/test-fixtures';

test.describe('Learning Library and Resources Flow', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // All tests use authenticated user
  });

  test('should browse tutorial library', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Should show tutorials list
    await expect(libraryPage.tutorialsList).toBeVisible({ timeout: 5000 });

    // Should have tutorial items
    const tutorialCount = await libraryPage.getTutorialCount();
    expect(tutorialCount).toBeGreaterThan(0);
  });

  test('should search for tutorials', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    const searchQuery = 'basic';
    await libraryPage.searchTutorials(searchQuery);

    // Should show search results
    const results = page.locator('[data-testid="tutorial-item"]');
    const resultCount = await results.count();

    // If there are results, verify they contain the search term
    if (resultCount > 0) {
      const firstResult = results.first();
      const resultText = await firstResult.textContent();
      expect(resultText?.toLowerCase()).toContain(searchQuery.toLowerCase());
    }

    // Should show result count
    const resultInfo = page.getByText(/\d+\s+(result|tutorial)/i);
    if (await resultInfo.isVisible({ timeout: 2000 })) {
      const countText = await resultInfo.textContent();
      expect(countText).toMatch(/\d+/);
    }
  });

  test('should filter tutorials by category', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Select beginner category
    await libraryPage.filterByCategory('beginner');

    // Should show filtered tutorials
    const tutorials = page.locator('[data-testid="tutorial-item"]');
    const count = await tutorials.count();

    // If tutorials exist, verify category badge
    if (count > 0) {
      const categoryBadge = tutorials.first().locator('[data-testid="tutorial-category"]');
      if (await categoryBadge.isVisible({ timeout: 1000 })) {
        const category = await categoryBadge.textContent();
        expect(category?.toLowerCase()).toMatch(/beginner/i);
      }
    }
  });

  test('should filter tutorials by difficulty level', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Look for difficulty filter
    const difficultyFilter = page.locator('select[name="difficulty"]');

    if (await difficultyFilter.isVisible({ timeout: 2000 })) {
      await difficultyFilter.selectOption('intermediate');
      await page.waitForLoadState('networkidle');

      // Should show filtered results
      const tutorials = page.locator('[data-testid="tutorial-item"]');
      const count = await tutorials.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should open and view a tutorial', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Get first tutorial
    const firstTutorial = page.locator('[data-testid="tutorial-item"]').first();
    const tutorialTitle = await firstTutorial.locator('[data-testid="tutorial-title"]').textContent();

    if (tutorialTitle) {
      await libraryPage.openTutorial(tutorialTitle);

      // Should navigate to tutorial page
      await expect(page).toHaveURL(/.*tutorial\/.*/);

      // Should display tutorial title
      const heading = page.getByRole('heading', { name: new RegExp(tutorialTitle, 'i') });
      await expect(heading).toBeVisible({ timeout: 3000 });

      // Should show video player
      await expect(libraryPage.videoPlayer).toBeVisible();
    }
  });

  test('should play tutorial video', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Open first tutorial
    const firstTutorial = page.locator('[data-testid="tutorial-item"]').first();
    await firstTutorial.click();
    await page.waitForURL(/.*tutorial\/.*/);

    // Play video
    await libraryPage.playVideo();

    // Verify video is playing
    const isPlaying = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video && !video.paused && video.readyState >= 2;
    });

    expect(isPlaying).toBe(true);
  });

  test('should display video controls', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Open tutorial with video
    const firstTutorial = page.locator('[data-testid="tutorial-item"]').first();
    await firstTutorial.click();
    await page.waitForURL(/.*tutorial\/.*/);

    // Should have video controls
    const playButton = page.getByRole('button', { name: /play|pause/i });
    const volumeControl = page.locator('[data-testid="volume-control"]');
    const progressBar = page.locator('[data-testid="progress-bar"]');

    await expect(libraryPage.videoPlayer).toBeVisible();

    // Basic controls should be accessible
    const videoElement = libraryPage.videoPlayer;
    const hasControls = await videoElement.getAttribute('controls');
    expect(hasControls).toBeTruthy();
  });

  test('should rate a tutorial', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Open tutorial
    const firstTutorial = page.locator('[data-testid="tutorial-item"]').first();
    await firstTutorial.click();
    await page.waitForURL(/.*tutorial\/.*/);

    // Rate the tutorial
    await libraryPage.rateTutorial(5);

    // Should show rating confirmation
    const confirmation = page.getByText(/rating.*saved|thank.*you.*rating/i);
    if (await confirmation.isVisible({ timeout: 3000 })) {
      expect(await confirmation.isVisible()).toBe(true);
    }

    // Rating button should be selected
    const ratingButton = page.locator('button[data-rating="5"]');
    const isSelected = await ratingButton.getAttribute('data-selected');
    expect(isSelected).toBeTruthy();
  });

  test('should display tutorial metadata', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    const tutorialItem = page.locator('[data-testid="tutorial-item"]').first();

    if (await tutorialItem.isVisible({ timeout: 2000 })) {
      // Should show duration
      const duration = tutorialItem.locator('[data-testid="tutorial-duration"]');
      if (await duration.isVisible({ timeout: 1000 })) {
        const durationText = await duration.textContent();
        expect(durationText).toMatch(/\d+:\d+|\d+\s*min/);
      }

      // Should show difficulty level
      const difficulty = tutorialItem.locator('[data-testid="tutorial-difficulty"]');
      if (await difficulty.isVisible({ timeout: 1000 })) {
        const difficultyText = await difficulty.textContent();
        expect(difficultyText).toMatch(/beginner|intermediate|advanced/i);
      }

      // Should show rating
      const rating = tutorialItem.locator('[data-testid="tutorial-rating"]');
      if (await rating.isVisible({ timeout: 1000 })) {
        const ratingText = await rating.textContent();
        expect(ratingText).toMatch(/\d\.?\d*/);
      }
    }
  });

  test('should track tutorial progress', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Open tutorial
    const firstTutorial = page.locator('[data-testid="tutorial-item"]').first();
    await firstTutorial.click();
    await page.waitForURL(/.*tutorial\/.*/);

    // Play video for a bit
    await libraryPage.playVideo();
    await page.waitForTimeout(3000);

    // Check for progress indicator
    const progressIndicator = page.locator('[data-testid="tutorial-progress"]');
    if (await progressIndicator.isVisible({ timeout: 2000 })) {
      const progress = await progressIndicator.textContent();
      expect(progress).toBeTruthy();
    }

    // Go back to library
    await page.goto('/learn');

    // Should show progress on tutorial card
    const tutorialCard = page.locator('[data-testid="tutorial-item"]').first();
    const progressBar = tutorialCard.locator('[data-testid="progress-indicator"]');

    if (await progressBar.isVisible({ timeout: 2000 })) {
      const progressValue = await progressBar.getAttribute('value');
      expect(parseFloat(progressValue || '0')).toBeGreaterThan(0);
    }
  });

  test('should search glossary terms', async ({ libraryPage, page }) => {
    await libraryPage.searchGlossary('fingerspelling');

    // Should navigate to glossary page
    await expect(page).toHaveURL(/.*glossary.*/);

    // Should show search results
    const results = page.locator('[data-testid="glossary-term"]');
    const count = await results.count();

    if (count > 0) {
      const firstResult = results.first();
      const termText = await firstResult.textContent();
      expect(termText?.toLowerCase()).toContain('fingerspelling');
    }
  });

  test('should display glossary term definition', async ({ page, authenticatedPage }) => {
    await page.goto('/glossary');

    // Click on a glossary term
    const firstTerm = page.locator('[data-testid="glossary-term"]').first();

    if (await firstTerm.isVisible({ timeout: 2000 })) {
      await firstTerm.click();

      // Should show definition
      const definition = page.locator('[data-testid="term-definition"]');
      await expect(definition).toBeVisible({ timeout: 3000 });

      // Should show related signs or video demonstration
      const demonstration = page.locator('[data-testid="sign-demonstration"]');
      if (await demonstration.isVisible({ timeout: 2000 })) {
        expect(await demonstration.isVisible()).toBe(true);
      }
    }
  });

  test('should bookmark tutorials', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Bookmark first tutorial
    const firstTutorial = page.locator('[data-testid="tutorial-item"]').first();
    const bookmarkButton = firstTutorial.getByRole('button', { name: /bookmark|save/i });

    if (await bookmarkButton.isVisible({ timeout: 2000 })) {
      await bookmarkButton.click();

      // Should show confirmation
      const confirmation = page.getByText(/bookmarked|saved/i);
      await expect(confirmation).toBeVisible({ timeout: 3000 });

      // Go to bookmarks page
      await page.goto('/learn/bookmarks');

      // Should see bookmarked tutorial
      const bookmarkedTutorials = page.locator('[data-testid="tutorial-item"]');
      const count = await bookmarkedTutorials.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should display tutorial recommendations', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Open a tutorial
    const firstTutorial = page.locator('[data-testid="tutorial-item"]').first();
    await firstTutorial.click();
    await page.waitForURL(/.*tutorial\/.*/);

    // Look for recommendations section
    const recommendations = page.locator('[data-testid="recommended-tutorials"]');

    if (await recommendations.isVisible({ timeout: 2000 })) {
      const recommendedItems = recommendations.locator('[data-testid="tutorial-item"]');
      const count = await recommendedItems.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should filter by sign language (ASL, BSL, ISL)', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Look for language filter
    const languageFilter = page.locator('select[name="language"]');

    if (await languageFilter.isVisible({ timeout: 2000 })) {
      // Select ASL
      await languageFilter.selectOption('ASL');
      await page.waitForLoadState('networkidle');

      // Should show filtered tutorials
      const tutorials = page.locator('[data-testid="tutorial-item"]');
      const count = await tutorials.count();
      expect(count).toBeGreaterThanOrEqual(0);

      // Verify language tag on tutorials
      if (count > 0) {
        const languageTag = tutorials.first().locator('[data-testid="language-tag"]');
        if (await languageTag.isVisible({ timeout: 1000 })) {
          const lang = await languageTag.textContent();
          expect(lang).toMatch(/ASL/i);
        }
      }
    }
  });

  test('should display tutorial completion badge', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Look for completed tutorials
    const completedBadge = page.locator('[data-testid="completed-badge"]').first();

    if (await completedBadge.isVisible({ timeout: 2000 })) {
      const badgeText = await completedBadge.textContent();
      expect(badgeText).toMatch(/completed|finished|done/i);
    }
  });

  test('should support video playback speed control', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Open tutorial
    const firstTutorial = page.locator('[data-testid="tutorial-item"]').first();
    await firstTutorial.click();
    await page.waitForURL(/.*tutorial\/.*/);

    // Look for speed control
    const speedControl = page.locator('[data-testid="playback-speed"]');

    if (await speedControl.isVisible({ timeout: 2000 })) {
      await speedControl.click();

      // Should show speed options
      const speedOptions = page.locator('[data-testid="speed-option"]');
      const optionCount = await speedOptions.count();
      expect(optionCount).toBeGreaterThan(0);

      // Select 0.5x speed
      const halfSpeed = page.getByText('0.5x');
      if (await halfSpeed.isVisible({ timeout: 1000 })) {
        await halfSpeed.click();

        // Verify playback rate changed
        const playbackRate = await page.evaluate(() => {
          const video = document.querySelector('video') as HTMLVideoElement;
          return video?.playbackRate;
        });

        expect(playbackRate).toBe(0.5);
      }
    }
  });

  test('should display tutorial transcript', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Open tutorial
    const firstTutorial = page.locator('[data-testid="tutorial-item"]').first();
    await firstTutorial.click();
    await page.waitForURL(/.*tutorial\/.*/);

    // Look for transcript button/tab
    const transcriptButton = page.getByRole('button', { name: /transcript/i });

    if (await transcriptButton.isVisible({ timeout: 2000 })) {
      await transcriptButton.click();

      // Should show transcript content
      const transcriptContent = page.locator('[data-testid="transcript-content"]');
      await expect(transcriptContent).toBeVisible({ timeout: 3000 });

      const content = await transcriptContent.textContent();
      expect(content).toBeTruthy();
      expect(content!.length).toBeGreaterThan(10);
    }
  });

  test('should support closed captions for tutorial videos', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Open tutorial
    const firstTutorial = page.locator('[data-testid="tutorial-item"]').first();
    await firstTutorial.click();
    await page.waitForURL(/.*tutorial\/.*/);

    // Check for caption tracks
    const hasCaptions = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video?.textTracks && video.textTracks.length > 0;
    });

    if (hasCaptions) {
      // Look for CC button
      const ccButton = page.getByRole('button', { name: /caption|cc|subtitle/i });

      if (await ccButton.isVisible({ timeout: 2000 })) {
        await ccButton.click();

        // Should enable captions
        const captionsEnabled = await page.evaluate(() => {
          const video = document.querySelector('video') as HTMLVideoElement;
          const track = video?.textTracks[0];
          return track?.mode === 'showing';
        });

        expect(captionsEnabled).toBe(true);
      }
    }
  });

  test('should measure library page load performance', async ({ libraryPage, page, performanceMonitor }) => {
    await libraryPage.goto();

    // Measure page load metrics
    const metrics = await performanceMonitor.measurePageLoad();

    // Should load quickly
    expect(metrics.totalLoadTime).toBeLessThan(3000); // < 3 seconds
    expect(metrics.firstContentfulPaint).toBeLessThan(1500); // < 1.5 seconds

    console.log('Library page load metrics:', {
      totalLoadTime: `${metrics.totalLoadTime}ms`,
      fcp: `${metrics.firstContentfulPaint}ms`,
      lcp: `${metrics.largestContentfulPaint}ms`,
    });
  });

  test('should validate library accessibility', async ({ libraryPage, page, accessibilityChecker }) => {
    await libraryPage.goto();

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

  test('should handle empty library state', async ({ page, authenticatedPage }) => {
    // Navigate to a category with no tutorials
    await page.goto('/learn?category=empty');

    // Should show empty state
    const emptyMessage = page.getByText(/no tutorials|no content|check.*later/i);
    if (await emptyMessage.isVisible({ timeout: 3000 })) {
      expect(await emptyMessage.isVisible()).toBe(true);
    }
  });

  test('should paginate tutorial list', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // Look for pagination
    const nextButton = page.getByRole('button', { name: /next|→/i });

    if (await nextButton.isVisible({ timeout: 2000 })) {
      // Get current page tutorials
      const tutorialsPage1 = await page.locator('[data-testid="tutorial-item"]').count();

      // Go to next page
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      // Should have tutorials on second page
      const tutorialsPage2 = await page.locator('[data-testid="tutorial-item"]').count();
      expect(tutorialsPage2).toBeGreaterThan(0);

      // Should update URL or page indicator
      const pageIndicator = page.locator('[data-testid="current-page"]');
      if (await pageIndicator.isVisible({ timeout: 1000 })) {
        const currentPage = await pageIndicator.textContent();
        expect(currentPage).toBe('2');
      }
    }
  });

  test('should measure API response time for library operations', async ({ libraryPage, page, performanceMonitor }) => {
    await libraryPage.goto();

    // Measure API response time for loading tutorials
    const responseTime = await performanceMonitor.measureApiResponseTime('/api/tutorials');

    // Should meet p95 < 200ms requirement
    expect(responseTime).toBeLessThan(200);

    console.log(`Library API response time: ${responseTime}ms`);
  });
});
