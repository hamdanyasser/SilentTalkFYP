import { Page, Locator } from '@playwright/test';

export class VideoCallPage {
  readonly page: Page;
  readonly startCallButton: Locator;
  readonly endCallButton: Locator;
  readonly muteButton: Locator;
  readonly videoToggleButton: Locator;
  readonly screenShareButton: Locator;
  readonly captionsToggleButton: Locator;
  readonly chatButton: Locator;
  readonly participantsList: Locator;
  readonly localVideo: Locator;
  readonly remoteVideo: Locator;
  readonly captionOverlay: Locator;
  readonly networkQualityIndicator: Locator;
  readonly recordingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startCallButton = page.getByRole('button', { name: /start call|new call/i });
    this.endCallButton = page.getByRole('button', { name: /end call|leave call/i });
    this.muteButton = page.getByRole('button', { name: /mute|unmute/i });
    this.videoToggleButton = page.getByRole('button', { name: /camera|video/i });
    this.screenShareButton = page.getByRole('button', { name: /share screen/i });
    this.captionsToggleButton = page.getByRole('button', { name: /captions/i });
    this.chatButton = page.getByRole('button', { name: /chat/i });
    this.participantsList = page.locator('[data-testid="participants-list"], .participants');
    this.localVideo = page.locator('[data-testid="local-video"], video.local-video').first();
    this.remoteVideo = page.locator('[data-testid="remote-video"], video.remote-video').first();
    this.captionOverlay = page.locator('[data-testid="caption-overlay"], .caption-overlay');
    this.networkQualityIndicator = page.locator('[data-testid="network-quality"]');
    this.recordingButton = page.getByRole('button', { name: /record/i });
  }

  async goto() {
    await this.page.goto('/call');
  }

  async startCall() {
    await this.goto();

    // Grant camera and microphone permissions
    await this.page.context().grantPermissions(['camera', 'microphone']);

    await this.startCallButton.click();

    // Wait for local video to appear
    await this.localVideo.waitFor({ timeout: 15000 });
  }

  async endCall() {
    await this.endCallButton.click();

    // Wait for call to end
    await this.page.waitForURL(/.*home|dashboard|calls/, { timeout: 10000 });
  }

  async toggleMute() {
    await this.muteButton.click();
  }

  async toggleVideo() {
    await this.videoToggleButton.click();
  }

  async toggleCaptions() {
    await this.captionsToggleButton.click();
  }

  async shareScreen() {
    await this.screenShareButton.click();
  }

  async openChat() {
    await this.chatButton.click();
  }

  async sendChatMessage(message: string) {
    const chatInput = this.page.getByPlaceholder(/type a message/i);
    await chatInput.fill(message);
    await chatInput.press('Enter');
  }

  async waitForRemoteVideo(timeout: number = 30000) {
    await this.remoteVideo.waitFor({ timeout });
  }

  async getParticipantCount(): Promise<number> {
    const participants = await this.participantsList.locator('[data-testid="participant"]').count();
    return participants;
  }

  async waitForCaptions(timeout: number = 5000) {
    await this.captionOverlay.waitFor({ timeout });
  }

  async getCaptionText(): Promise<string> {
    return await this.captionOverlay.textContent() || '';
  }

  async getNetworkQuality(): Promise<string> {
    return await this.networkQualityIndicator.textContent() || '';
  }

  async isCallActive(): Promise<boolean> {
    try {
      await this.endCallButton.waitFor({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async getVideoStats() {
    // Execute JavaScript to get WebRTC stats
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore
        if (!window.peerConnection) {
          resolve(null);
          return;
        }

        // @ts-ignore
        window.peerConnection.getStats().then((stats: RTCStatsReport) => {
          const videoStats: any = {};
          stats.forEach((report: any) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              videoStats.bytesReceived = report.bytesReceived;
              videoStats.packetsReceived = report.packetsReceived;
              videoStats.packetsLost = report.packetsLost;
              videoStats.framesPerSecond = report.framesPerSecond;
            }
          });
          resolve(videoStats);
        });
      });
    });
  }
}
