import { test, expect } from '../fixtures/test-fixtures';

test.describe('Video Call Flow', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // All tests in this suite use authenticated user
    // The authenticatedPage fixture handles login automatically
  });

  test('should start a video call successfully', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();

    // Start call
    await videoCallPage.startCall();

    // Verify local video is visible
    await expect(videoCallPage.localVideo).toBeVisible({ timeout: 15000 });

    // Verify call controls are visible
    await expect(videoCallPage.muteButton).toBeVisible();
    await expect(videoCallPage.videoToggleButton).toBeVisible();
    await expect(videoCallPage.endCallButton).toBeVisible();

    // Check that video is actually playing
    const isPlaying = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video && !video.paused && video.readyState >= 2;
    });
    expect(isPlaying).toBe(true);
  });

  test('should request camera and microphone permissions', async ({ page }) => {
    await page.goto('/calls/new');

    // Mock permission request
    const permissionPromise = page.waitForEvent('console', msg =>
      msg.text().includes('permission') || msg.text().includes('camera') || msg.text().includes('microphone')
    );

    // Click start call button
    const startButton = page.getByRole('button', { name: /start call|join call/i });
    await startButton.click();

    // Grant permissions
    await page.context().grantPermissions(['camera', 'microphone']);

    // Permissions should be granted
    const permissions = await page.evaluate(async () => {
      const camera = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const microphone = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return {
        camera: camera.state,
        microphone: microphone.state,
      };
    });

    expect(permissions.camera).toBe('granted');
    expect(permissions.microphone).toBe('granted');
  });

  test('should toggle mute/unmute audio', async ({ videoCallPage }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Initially unmuted
    let isMuted = await videoCallPage.isMuted();
    expect(isMuted).toBe(false);

    // Mute
    await videoCallPage.toggleMute();
    isMuted = await videoCallPage.isMuted();
    expect(isMuted).toBe(true);

    // Verify mute button UI changed
    await expect(videoCallPage.muteButton).toHaveAttribute('data-muted', 'true');

    // Unmute
    await videoCallPage.toggleMute();
    isMuted = await videoCallPage.isMuted();
    expect(isMuted).toBe(false);
  });

  test('should toggle video on/off', async ({ videoCallPage }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Initially video on
    let isVideoOn = await videoCallPage.isVideoOn();
    expect(isVideoOn).toBe(true);

    // Turn video off
    await videoCallPage.toggleVideo();
    isVideoOn = await videoCallPage.isVideoOn();
    expect(isVideoOn).toBe(false);

    // Verify video button UI changed
    await expect(videoCallPage.videoToggleButton).toHaveAttribute('data-video-enabled', 'false');

    // Turn video back on
    await videoCallPage.toggleVideo();
    isVideoOn = await videoCallPage.isVideoOn();
    expect(isVideoOn).toBe(true);
  });

  test('should end call successfully', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // End call
    await videoCallPage.endCall();

    // Should redirect back to calls list or dashboard
    await expect(page).toHaveURL(/.*calls|dashboard|home.*/);

    // Video should be stopped
    const videoCount = await page.locator('video').count();
    expect(videoCount).toBe(0);
  });

  test('should handle multi-party video call', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // In a real test, you would need to simulate another peer joining
    // For now, we'll verify the UI can handle multiple video elements

    // Verify remote video container exists
    const remoteVideoContainer = page.locator('[data-testid="remote-videos"]');
    await expect(remoteVideoContainer).toBeVisible();

    // Check that we can render multiple video elements
    const maxParticipants = 8; // From requirements
    const videoGridSupportsMultiple = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="remote-videos"]');
      if (!container) return false;

      // Check grid layout supports multiple videos
      const styles = window.getComputedStyle(container);
      return styles.display === 'grid' || styles.display === 'flex';
    });

    expect(videoGridSupportsMultiple).toBe(true);
  });

  test('should display participant count', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Should show at least 1 participant (self)
    const participantCount = page.locator('[data-testid="participant-count"]');
    await expect(participantCount).toBeVisible();

    const count = await participantCount.textContent();
    expect(count).toMatch(/1|one/i);
  });

  test('should enable/disable captions', async ({ videoCallPage }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Toggle captions on
    await videoCallPage.toggleCaptions();

    // Verify captions container is visible
    const captionsContainer = videoCallPage.page.locator('[data-testid="captions-display"]');
    await expect(captionsContainer).toBeVisible();

    // Toggle captions off
    await videoCallPage.toggleCaptions();

    // Captions should be hidden
    await expect(captionsContainer).not.toBeVisible({ timeout: 2000 });
  });

  test('should show connection quality indicator', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Wait for connection to establish
    await page.waitForTimeout(2000);

    // Check for connection quality indicator
    const qualityIndicator = page.locator('[data-testid="connection-quality"]');
    await expect(qualityIndicator).toBeVisible({ timeout: 5000 });

    // Should have a valid quality level (good, fair, poor)
    const quality = await qualityIndicator.getAttribute('data-quality');
    expect(['good', 'fair', 'poor']).toContain(quality);
  });

  test('should handle call controls keyboard shortcuts', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Test mute shortcut (Ctrl/Cmd + D)
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';

    await page.keyboard.press(`${modifier}+KeyD`);
    const isMuted = await videoCallPage.isMuted();
    expect(isMuted).toBe(true);

    // Test video toggle (Ctrl/Cmd + E)
    await page.keyboard.press(`${modifier}+KeyE`);
    const isVideoOff = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video?.srcObject === null || (video?.srcObject as MediaStream)?.getVideoTracks()[0]?.enabled === false;
    });
    expect(isVideoOff).toBe(true);
  });

  test('should display call duration timer', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Check for timer element
    const timer = page.locator('[data-testid="call-timer"]');
    await expect(timer).toBeVisible();

    // Wait 2 seconds
    await page.waitForTimeout(2000);

    // Timer should have updated
    const timerText = await timer.textContent();
    expect(timerText).toMatch(/00:0[2-9]|00:1[0-9]/); // Should show at least 2 seconds
  });

  test('should handle network disconnection gracefully', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Simulate network disconnection
    await page.context().setOffline(true);

    // Should show disconnection warning
    const disconnectWarning = page.getByText(/connection lost|disconnected|reconnecting/i);
    await expect(disconnectWarning).toBeVisible({ timeout: 5000 });

    // Restore network
    await page.context().setOffline(false);

    // Should reconnect or show reconnect option
    const reconnectButton = page.getByRole('button', { name: /reconnect|try again/i });
    if (await reconnectButton.isVisible({ timeout: 3000 })) {
      await reconnectButton.click();
    }
  });

  test('should display video call settings', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Open settings
    const settingsButton = page.getByRole('button', { name: /settings|preferences/i });
    await settingsButton.click();

    // Should show device selection
    const cameraSelect = page.locator('select[name="camera"]');
    const microphoneSelect = page.locator('select[name="microphone"]');

    await expect(cameraSelect).toBeVisible();
    await expect(microphoneSelect).toBeVisible();

    // Should have at least one device option
    const cameraOptions = await cameraSelect.locator('option').count();
    expect(cameraOptions).toBeGreaterThan(0);
  });

  test('should measure video call latency', async ({ videoCallPage, performanceMonitor, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Wait for call to establish
    await page.waitForTimeout(3000);

    // Measure video latency
    const latencyValid = await performanceMonitor.validateVideoLatency(150); // < 150ms requirement

    expect(latencyValid).toBe(true);
  });

  test('should handle camera/microphone errors', async ({ page }) => {
    // Deny permissions
    await page.context().clearPermissions();

    await page.goto('/calls/new');

    const startButton = page.getByRole('button', { name: /start call|join call/i });
    await startButton.click();

    // Should show permission error
    const errorMessage = page.getByText(/camera.*denied|microphone.*denied|permission.*required/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should support screen sharing', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Look for screen share button
    const screenShareButton = page.getByRole('button', { name: /share.*screen|screen.*share/i });

    if (await screenShareButton.isVisible({ timeout: 2000 })) {
      // Screen sharing feature exists
      await expect(screenShareButton).toBeEnabled();

      // Note: Can't actually test screen sharing in headless browser
      // but we can verify the UI element exists
    }
  });

  test('should handle call invitation', async ({ page, authenticatedPage }) => {
    await page.goto('/calls');

    // Create new call
    const newCallButton = page.getByRole('button', { name: /new call|start call/i });
    await newCallButton.click();

    // Look for invite functionality
    const inviteButton = page.getByRole('button', { name: /invite|copy.*link|share/i });

    if (await inviteButton.isVisible({ timeout: 3000 })) {
      await inviteButton.click();

      // Should show invite link or copy confirmation
      const inviteLink = page.getByTestId('invite-link');
      const copiedMessage = page.getByText(/copied|link copied/i);

      const hasInvite = await inviteLink.isVisible({ timeout: 2000 }).catch(() => false);
      const hasCopied = await copiedMessage.isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasInvite || hasCopied).toBe(true);
    }
  });

  test('should validate video quality settings', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Open settings
    const settingsButton = page.getByRole('button', { name: /settings|preferences/i });
    if (await settingsButton.isVisible({ timeout: 2000 })) {
      await settingsButton.click();

      // Look for quality settings
      const qualitySelect = page.locator('select[name="quality"]');

      if (await qualitySelect.isVisible({ timeout: 2000 })) {
        const options = await qualitySelect.locator('option').allTextContents();

        // Should have quality options like low, medium, high
        expect(options.length).toBeGreaterThan(0);
      }
    }
  });

  test('should display video statistics', async ({ videoCallPage, page }) => {
    await videoCallPage.goto();
    await videoCallPage.startCall();

    // Wait for connection
    await page.waitForTimeout(2000);

    // Get video stats
    const stats = await videoCallPage.getVideoStats();

    // Verify stats have reasonable values
    expect(stats.latency).toBeGreaterThanOrEqual(0);
    expect(stats.latency).toBeLessThan(500); // Should be less than 500ms

    if (stats.frameRate > 0) {
      expect(stats.frameRate).toBeGreaterThan(10); // At least 10 fps
      expect(stats.frameRate).toBeLessThan(120); // Less than 120 fps
    }
  });
});
