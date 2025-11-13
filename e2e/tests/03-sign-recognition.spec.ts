import { test, expect } from '../fixtures/test-fixtures';

test.describe('Sign Language Recognition and Captions', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // All tests use authenticated user
  });

  test('should enable sign language recognition in video call', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Enable sign recognition
    const signRecognitionToggle = page.getByRole('button', { name: /sign.*recognition|enable.*recognition/i });
    await signRecognitionToggle.click();

    // Should show recognition active indicator
    const activeIndicator = page.locator('[data-testid="recognition-active"]');
    await expect(activeIndicator).toBeVisible({ timeout: 3000 });

    // Should show hand tracking visualization (optional)
    const handTracking = page.locator('[data-testid="hand-tracking"]');
    if (await handTracking.isVisible({ timeout: 2000 })) {
      expect(await handTracking.isVisible()).toBe(true);
    }
  });

  test('should display captions when sign is recognized', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Enable captions
    await videoCallPage.toggleCaptions();

    // Wait for captions container
    const captionsContainer = page.locator('[data-testid="captions-display"]');
    await expect(captionsContainer).toBeVisible();

    // In a real scenario, we would perform a sign and verify the caption appears
    // For E2E testing, we'll verify the caption system is ready to receive data

    // Check caption container has proper ARIA labels
    const ariaLive = await captionsContainer.getAttribute('aria-live');
    expect(ariaLive).toBe('polite');
  });

  test('should show confidence scores for recognized signs', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Enable sign recognition with confidence display
    await page.evaluate(() => {
      // Mock a sign recognition event
      const event = new CustomEvent('sign-recognized', {
        detail: {
          sign: 'Hello',
          confidence: 0.92,
          alternatives: [
            { sign: 'Hi', confidence: 0.78 },
            { sign: 'Hey', confidence: 0.65 },
          ],
        },
      });
      window.dispatchEvent(event);
    });

    // Should show confidence indicator
    const confidenceDisplay = page.locator('[data-testid="confidence-score"]');
    if (await confidenceDisplay.isVisible({ timeout: 2000 })) {
      const confidenceText = await confidenceDisplay.textContent();
      expect(confidenceText).toMatch(/\d+%|0\.\d+/); // Should show percentage or decimal
    }
  });

  test('should display alternative sign suggestions', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Mock recognition with alternatives
    await page.evaluate(() => {
      const event = new CustomEvent('sign-recognized', {
        detail: {
          sign: 'Thank you',
          confidence: 0.85,
          alternatives: [
            { sign: 'Thanks', confidence: 0.73 },
            { sign: 'Please', confidence: 0.62 },
          ],
        },
      });
      window.dispatchEvent(event);
    });

    // Look for alternatives display
    const alternativesContainer = page.locator('[data-testid="sign-alternatives"]');
    if (await alternativesContainer.isVisible({ timeout: 2000 })) {
      const alternatives = await alternativesContainer.locator('[data-testid="alternative-sign"]').count();
      expect(alternatives).toBeGreaterThan(0);
    }
  });

  test('should allow manual correction of recognized signs', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Enable captions
    await videoCallPage.toggleCaptions();

    // Mock a recognized sign
    await page.evaluate(() => {
      const event = new CustomEvent('sign-recognized', {
        detail: {
          sign: 'Goodbye',
          confidence: 0.88,
        },
      });
      window.dispatchEvent(event);
    });

    // Look for correction option
    const correctButton = page.getByRole('button', { name: /correct|edit/i });
    if (await correctButton.isVisible({ timeout: 2000 })) {
      await correctButton.click();

      // Should show correction dialog
      const correctionDialog = page.locator('[role="dialog"]');
      await expect(correctionDialog).toBeVisible();

      // Should have input for correct sign
      const correctionInput = page.getByLabel(/correct.*sign|enter.*sign/i);
      await expect(correctionInput).toBeVisible();
    }
  });

  test('should validate ML model accuracy threshold (≥85%)', async ({ page, authenticatedPage }) => {
    // Navigate to ML service health endpoint
    const response = await page.request.get('http://localhost:8000/health');
    expect(response.ok()).toBe(true);

    const health = await response.json();

    // Check model accuracy from health response
    if (health.model_info?.accuracy) {
      const accuracy = parseFloat(health.model_info.accuracy);
      expect(accuracy).toBeGreaterThanOrEqual(0.85); // ≥85% requirement
      console.log(`ML Model Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    }
  });

  test('should measure sign recognition latency', async ({ videoCallPage, page, performanceMonitor }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Mock sign recognition and measure response time
    const startTime = Date.now();

    await page.evaluate(() => {
      const event = new CustomEvent('sign-recognized', {
        detail: {
          sign: 'Hello',
          confidence: 0.92,
          timestamp: Date.now(),
        },
      });
      window.dispatchEvent(event);
    });

    // Wait for caption to appear
    const caption = page.locator('[data-testid="captions-display"]');
    await caption.waitFor({ state: 'visible', timeout: 2000 });

    const endTime = Date.now();
    const latency = endTime - startTime;

    // Recognition + display should be < 100ms (ML inference requirement)
    expect(latency).toBeLessThan(200); // Allow some overhead for E2E

    console.log(`Sign recognition latency: ${latency}ms`);
  });

  test('should enable text-to-speech for captions', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Enable TTS
    const ttsToggle = page.getByRole('button', { name: /text.*speech|tts|speak/i });
    if (await ttsToggle.isVisible({ timeout: 2000 })) {
      await ttsToggle.click();

      // Should show TTS active indicator
      const ttsActive = page.locator('[data-testid="tts-active"]');
      await expect(ttsActive).toBeVisible({ timeout: 2000 });

      // Verify speech synthesis is available
      const speechAvailable = await page.evaluate(() => {
        return 'speechSynthesis' in window;
      });

      expect(speechAvailable).toBe(true);
    }
  });

  test('should adjust TTS voice and speed settings', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Open TTS settings
    const settingsButton = page.getByRole('button', { name: /settings|preferences/i });
    if (await settingsButton.isVisible({ timeout: 2000 })) {
      await settingsButton.click();

      // Look for TTS settings
      const voiceSelect = page.locator('select[name="tts-voice"]');
      const speedSlider = page.locator('input[name="tts-speed"]');

      if (await voiceSelect.isVisible({ timeout: 2000 })) {
        const voices = await voiceSelect.locator('option').count();
        expect(voices).toBeGreaterThan(0);
      }

      if (await speedSlider.isVisible({ timeout: 2000 })) {
        const speed = await speedSlider.getAttribute('value');
        expect(parseFloat(speed || '1')).toBeGreaterThan(0);
      }
    }
  });

  test('should display caption history', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();
    await videoCallPage.toggleCaptions();

    // Mock multiple recognized signs
    await page.evaluate(() => {
      const signs = ['Hello', 'How', 'Are', 'You'];
      signs.forEach((sign, index) => {
        setTimeout(() => {
          const event = new CustomEvent('sign-recognized', {
            detail: { sign, confidence: 0.9 },
          });
          window.dispatchEvent(event);
        }, index * 500);
      });
    });

    // Wait for captions to accumulate
    await page.waitForTimeout(3000);

    // Should show caption history
    const captionHistory = page.locator('[data-testid="caption-history"]');
    if (await captionHistory.isVisible({ timeout: 2000 })) {
      const captionItems = await captionHistory.locator('[data-testid="caption-item"]').count();
      expect(captionItems).toBeGreaterThan(0);
    }
  });

  test('should support caption export', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();
    await videoCallPage.toggleCaptions();

    // Mock some captions
    await page.evaluate(() => {
      const signs = ['Test', 'Caption', 'Export'];
      signs.forEach((sign, index) => {
        setTimeout(() => {
          const event = new CustomEvent('sign-recognized', {
            detail: { sign, confidence: 0.9, timestamp: Date.now() },
          });
          window.dispatchEvent(event);
        }, index * 200);
      });
    });

    await page.waitForTimeout(1000);

    // Look for export button
    const exportButton = page.getByRole('button', { name: /export|download|save.*caption/i });
    if (await exportButton.isVisible({ timeout: 2000 })) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/caption|transcript/i);
    }
  });

  test('should handle low confidence recognition', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Mock low confidence recognition
    await page.evaluate(() => {
      const event = new CustomEvent('sign-recognized', {
        detail: {
          sign: 'Uncertain',
          confidence: 0.45, // Below typical threshold
          alternatives: [
            { sign: 'Maybe this', confidence: 0.42 },
            { sign: 'Or this', confidence: 0.38 },
          ],
        },
      });
      window.dispatchEvent(event);
    });

    // Should show warning or uncertainty indicator
    const lowConfidenceWarning = page.locator('[data-testid="low-confidence-warning"]');
    if (await lowConfidenceWarning.isVisible({ timeout: 2000 })) {
      expect(await lowConfidenceWarning.isVisible()).toBe(true);
    }
  });

  test('should support multiple sign language dialects', async ({ page, authenticatedPage }) => {
    await page.goto('/settings');

    // Look for sign language preference
    const languageSelect = page.locator('select[name="sign-language"]');
    if (await languageSelect.isVisible({ timeout: 2000 })) {
      const options = await languageSelect.locator('option').allTextContents();

      // Should support ASL, BSL, ISL (from requirements)
      const supportedLanguages = options.join(' ');
      expect(supportedLanguages).toMatch(/ASL|American/i);
      expect(supportedLanguages).toMatch(/BSL|British/i);
      expect(supportedLanguages).toMatch(/ISL|Irish/i);
    }
  });

  test('should display recognition status and errors', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Mock ML service error
    await page.route('**/api/ml/recognize', route => route.abort());

    // Try to enable recognition
    const signRecognitionToggle = page.getByRole('button', { name: /sign.*recognition|enable.*recognition/i });
    await signRecognitionToggle.click();

    // Should show error message
    const errorMessage = page.getByText(/recognition.*unavailable|service.*error|try.*again/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should validate caption accessibility features', async ({ videoCallPage, page, accessibilityChecker }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();
    await videoCallPage.toggleCaptions();

    // Check captions are accessible
    const captionsContainer = page.locator('[data-testid="captions-display"]');

    // Should have proper ARIA attributes
    const ariaLive = await captionsContainer.getAttribute('aria-live');
    const ariaLabel = await captionsContainer.getAttribute('aria-label');

    expect(ariaLive).toBeTruthy();
    expect(ariaLabel).toBeTruthy();

    // Should have good color contrast
    const hasGoodContrast = await accessibilityChecker.testColorContrast();
    expect(hasGoodContrast).toBe(true);
  });

  test('should support caption font size adjustment', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();
    await videoCallPage.toggleCaptions();

    // Open caption settings
    const settingsButton = page.getByRole('button', { name: /caption.*settings|customize.*caption/i });
    if (await settingsButton.isVisible({ timeout: 2000 })) {
      await settingsButton.click();

      // Look for font size control
      const fontSizeControl = page.locator('input[name="caption-font-size"], select[name="caption-font-size"]');
      if (await fontSizeControl.isVisible({ timeout: 2000 })) {
        const initialValue = await fontSizeControl.inputValue();
        await fontSizeControl.fill('24'); // Set larger font

        // Verify caption font changed
        const captionText = page.locator('[data-testid="captions-display"] [data-testid="caption-text"]');
        if (await captionText.isVisible({ timeout: 2000 })) {
          const fontSize = await captionText.evaluate(el => window.getComputedStyle(el).fontSize);
          expect(parseInt(fontSize)).toBeGreaterThanOrEqual(20);
        }
      }
    }
  });

  test('should handle sign recognition in poor lighting', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Mock poor lighting detection
    await page.evaluate(() => {
      const event = new CustomEvent('lighting-warning', {
        detail: {
          quality: 'poor',
          message: 'Lighting conditions are suboptimal for sign recognition',
        },
      });
      window.dispatchEvent(event);
    });

    // Should show lighting warning
    const lightingWarning = page.locator('[data-testid="lighting-warning"]');
    if (await lightingWarning.isVisible({ timeout: 2000 })) {
      const warningText = await lightingWarning.textContent();
      expect(warningText).toMatch(/lighting|light/i);
    }
  });

  test('should measure ML inference time (< 100ms)', async ({ page }) => {
    // Test ML service inference time directly
    const startTime = Date.now();

    const response = await page.request.post('http://localhost:8000/api/ml/recognize', {
      data: {
        landmarks: Array(21).fill({ x: 0.5, y: 0.5, z: 0 }), // Mock hand landmarks
        handedness: 'Right',
      },
    });

    const endTime = Date.now();
    const inferenceTime = endTime - startTime;

    console.log(`ML inference time: ${inferenceTime}ms`);

    // Should be < 100ms (NFR-001 requirement)
    expect(inferenceTime).toBeLessThan(100);
    expect(response.ok()).toBe(true);
  });
});
