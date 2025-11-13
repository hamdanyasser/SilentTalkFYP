import * as signalR from '@microsoft/signalr';

/**
 * SignalR client for WebRTC call signaling
 * Handles connection, room management, and WebRTC signaling events
 */
export class CallSignalingClient {
  private connection: signalR.HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isIntentionalDisconnect = false;

  constructor(
    private hubUrl: string,
    private accessToken: string,
    private onConnectionStateChanged?: (state: signalR.HubConnectionState) => void
  ) {}

  /**
   * Connect to SignalR hub
   */
  async connect(): Promise<void> {
    if (this.connection) {
      await this.disconnect();
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => this.accessToken,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
            return null; // Stop reconnecting
          }
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();
    this.setupReconnectionHandlers();

    try {
      await this.connection.start();
      console.log('SignalR connected');
      this.reconnectAttempts = 0;
      this.onConnectionStateChanged?.(this.connection.state);
    } catch (error) {
      console.error('SignalR connection error:', error);
      await this.handleReconnection();
      throw error;
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      this.isIntentionalDisconnect = true;
      await this.connection.stop();
      this.connection = null;
      this.onConnectionStateChanged?.(signalR.HubConnectionState.Disconnected);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Get connection state
   */
  getState(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
  }

  // ============================================
  // Room Management Methods
  // ============================================

  /**
   * Join a call room
   */
  async joinCall(request: JoinCallRequest): Promise<RoomState> {
    if (!this.connection) throw new Error('Not connected');
    return await this.connection.invoke('JoinCall', request);
  }

  /**
   * Leave a call room
   */
  async leaveCall(request: LeaveCallRequest): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('LeaveCall', request);
  }

  /**
   * Get current room state
   */
  async getRoomState(callId: string): Promise<RoomState | null> {
    if (!this.connection) throw new Error('Not connected');
    return await this.connection.invoke('GetRoomState', callId);
  }

  /**
   * Reconnect to a call after disconnection
   */
  async reconnectToCall(request: ReconnectRequest): Promise<RoomState> {
    if (!this.connection) throw new Error('Not connected');
    return await this.connection.invoke('ReconnectToCall', request);
  }

  // ============================================
  // WebRTC Signaling Methods
  // ============================================

  /**
   * Send WebRTC offer
   */
  async sendOffer(offer: OfferDto): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('SendOffer', offer);
  }

  /**
   * Send WebRTC answer
   */
  async sendAnswer(answer: AnswerDto): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('SendAnswer', answer);
  }

  /**
   * Send ICE candidate
   */
  async sendIceCandidate(candidate: IceCandidateDto): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('SendIceCandidate', candidate);
  }

  /**
   * Get ICE server configuration
   */
  async getIceConfiguration(): Promise<IceConfiguration> {
    if (!this.connection) throw new Error('Not connected');
    return await this.connection.invoke('GetIceConfiguration');
  }

  // ============================================
  // Media State Methods
  // ============================================

  /**
   * Update media state (audio/video enabled)
   */
  async updateMediaState(state: MediaStateDto): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('UpdateMediaState', state);
  }

  // ============================================
  // Typing Indicator Methods
  // ============================================

  /**
   * Send typing indicator
   */
  async sendTyping(typing: TypingDto): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('SendTyping', typing);
  }

  // ============================================
  // Network Quality Methods
  // ============================================

  /**
   * Update network quality
   */
  async updateNetworkQuality(quality: NetworkQualityDto): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('UpdateNetworkQuality', quality);
  }

  // ============================================
  // Chat Methods
  // ============================================

  /**
   * Send chat message
   */
  async sendChatMessage(message: SendChatMessageRequest): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('SendChatMessage', message);
  }

  /**
   * Get chat history
   */
  async getChatHistory(callId: string, skip: number = 0, limit: number = 100): Promise<ChatMessage[]> {
    if (!this.connection) throw new Error('Not connected');
    return await this.connection.invoke('GetChatHistory', callId, skip, limit);
  }

  // ============================================
  // Screenshare Methods
  // ============================================

  /**
   * Start screenshare
   */
  async startScreenshare(callId: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('StartScreenshare', callId);
  }

  /**
   * Stop screenshare
   */
  async stopScreenshare(callId: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('StopScreenshare', callId);
  }

  // ============================================
  // Recording Methods
  // ============================================

  /**
   * Start call recording
   */
  async startRecording(request: StartRecordingRequest): Promise<string> {
    if (!this.connection) throw new Error('Not connected');
    return await this.connection.invoke('StartRecording', request);
  }

  /**
   * Stop call recording
   */
  async stopRecording(request: StopRecordingRequest): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('StopRecording', request);
  }

  /**
   * Submit recording consent
   */
  async submitRecordingConsent(consent: RecordingConsent): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('SubmitRecordingConsent', consent);
  }

  /**
   * Submit call quality report
   */
  async submitCallQualityReport(report: CallQualityReport): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('SubmitCallQualityReport', report);
  }

  // ============================================
  // Event Handlers Registration
  // ============================================

  /**
   * Register handler for user joined event
   */
  onUserJoined(handler: (participant: Participant) => void): void {
    this.connection?.on('UserJoined', handler);
  }

  /**
   * Register handler for user left event
   */
  onUserLeft(handler: (data: { userId: string; reason: string }) => void): void {
    this.connection?.on('UserLeft', handler);
  }

  /**
   * Register handler for user disconnected event
   */
  onUserDisconnected(handler: (data: { userId: string; displayName: string; reason: string }) => void): void {
    this.connection?.on('UserDisconnected', handler);
  }

  /**
   * Register handler for user reconnected event
   */
  onUserReconnected(handler: (data: { userId: string; connectionId: string }) => void): void {
    this.connection?.on('UserReconnected', handler);
  }

  /**
   * Register handler for receiving WebRTC offer
   */
  onReceiveOffer(handler: (offer: OfferDto) => void): void {
    this.connection?.on('ReceiveOffer', handler);
  }

  /**
   * Register handler for receiving WebRTC answer
   */
  onReceiveAnswer(handler: (answer: AnswerDto) => void): void {
    this.connection?.on('ReceiveAnswer', handler);
  }

  /**
   * Register handler for receiving ICE candidate
   */
  onReceiveIceCandidate(handler: (candidate: IceCandidateDto) => void): void {
    this.connection?.on('ReceiveIceCandidate', handler);
  }

  /**
   * Register handler for media state changed event
   */
  onMediaStateChanged(handler: (data: { userId: string; audioEnabled?: boolean; videoEnabled?: boolean }) => void): void {
    this.connection?.on('MediaStateChanged', handler);
  }

  /**
   * Register handler for typing indicator
   */
  onUserTyping(handler: (data: { userId: string; displayName: string; isTyping: boolean }) => void): void {
    this.connection?.on('UserTyping', handler);
  }

  /**
   * Register handler for network quality changed event
   */
  onNetworkQualityChanged(handler: (data: { userId: string; quality: NetworkQuality; stats?: NetworkStats }) => void): void {
    this.connection?.on('NetworkQualityChanged', handler);
  }

  /**
   * Register handler for receiving chat message
   */
  onReceiveChatMessage(handler: (message: ChatMessage) => void): void {
    this.connection?.on('ReceiveChatMessage', handler);
  }

  /**
   * Register handler for screenshare started event
   */
  onScreenshareStarted(handler: (data: { callId: string; userId: string; displayName: string }) => void): void {
    this.connection?.on('ScreenshareStarted', handler);
  }

  /**
   * Register handler for screenshare stopped event
   */
  onScreenshareStopped(handler: (data: { callId: string; userId: string }) => void): void {
    this.connection?.on('ScreenshareStopped', handler);
  }

  /**
   * Register handler for recording started event
   */
  onRecordingStarted(handler: (data: { recordingId: string; callId: string; initiatedBy: string; initiatorName: string; requireConsent: boolean; startedAt: string }) => void): void {
    this.connection?.on('RecordingStarted', handler);
  }

  /**
   * Register handler for recording stopped event
   */
  onRecordingStopped(handler: (data: { recordingId: string; callId: string; stoppedBy: string; stoppedAt: string }) => void): void {
    this.connection?.on('RecordingStopped', handler);
  }

  /**
   * Register handler for recording consent received event
   */
  onRecordingConsentReceived(handler: (data: { recordingId: string; callId: string; userId: string; displayName: string; consent: boolean }) => void): void {
    this.connection?.on('RecordingConsentReceived', handler);
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.onclose((error) => {
      console.log('SignalR connection closed', error);
      this.onConnectionStateChanged?.(signalR.HubConnectionState.Disconnected);

      if (!this.isIntentionalDisconnect) {
        this.handleReconnection();
      }
    });
  }

  private setupReconnectionHandlers(): void {
    if (!this.connection) return;

    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting...', error);
      this.onConnectionStateChanged?.(signalR.HubConnectionState.Reconnecting);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected', connectionId);
      this.reconnectAttempts = 0;
      this.onConnectionStateChanged?.(signalR.HubConnectionState.Connected);
    });
  }

  private async handleReconnection(): Promise<void> {
    if (this.isIntentionalDisconnect) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await this.connect();
    } catch (error) {
      console.error('Reconnection failed:', error);
      await this.handleReconnection();
    }
  }
}

// ============================================
// Type Definitions
// ============================================

export interface JoinCallRequest {
  callId: string;
  userId: string;
  displayName: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export interface LeaveCallRequest {
  callId: string;
  userId: string;
  reason?: string;
}

export interface ReconnectRequest {
  callId: string;
  userId: string;
  previousConnectionId: string;
}

export interface OfferDto {
  callId: string;
  fromUserId: string;
  toUserId: string;
  sdp: string;
  type: 'offer';
}

export interface AnswerDto {
  callId: string;
  fromUserId: string;
  toUserId: string;
  sdp: string;
  type: 'answer';
}

export interface IceCandidateDto {
  callId: string;
  fromUserId: string;
  toUserId: string;
  candidate: string;
  sdpMid: string;
  sdpMLineIndex?: number;
}

export interface Participant {
  userId: string;
  displayName: string;
  connectionId: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  joinedAt: string;
  quality?: NetworkQuality;
}

export interface RoomState {
  callId: string;
  participants: Participant[];
  maxParticipants: number;
  isLocked: boolean;
  createdAt: string;
}

export interface MediaStateDto {
  callId: string;
  userId: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
}

export interface TypingDto {
  callId: string;
  userId: string;
  displayName: string;
  isTyping: boolean;
}

export interface NetworkQualityDto {
  callId: string;
  userId: string;
  quality: NetworkQuality;
  stats?: NetworkStats;
}

export enum NetworkQuality {
  Excellent = 0,
  Good = 1,
  Fair = 2,
  Poor = 3,
  VeryPoor = 4,
  Disconnected = 5,
}

export interface NetworkStats {
  latency?: number;
  packetLoss?: number;
  jitter?: number;
  bytesSent?: number;
  bytesReceived?: number;
  bitrate?: number;
}

export interface IceConfiguration {
  iceServers: IceServer[];
  iceTransportPolicy: string;
}

export interface IceServer {
  urls: string[];
  username?: string;
  credential?: string;
}

// Chat types
export interface ChatMessage {
  messageId: string;
  callId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'sign' | 'system';
  timestamp: string;
  replyToId?: string;
}

export interface SendChatMessageRequest {
  callId: string;
  content: string;
  type: 'text' | 'sign' | 'system';
  replyToId?: string;
}

// Recording types
export interface StartRecordingRequest {
  callId: string;
  requireConsent: boolean;
}

export interface StopRecordingRequest {
  callId: string;
  recordingId: string;
}

export interface RecordingConsent {
  callId: string;
  recordingId: string;
  userId: string;
  consent: boolean;
}

export interface CallQualityReport {
  callId: string;
  userId: string;
  videoResolutionWidth: number;
  videoResolutionHeight: number;
  videoFrameRate: number;
  videoBitrate: number;
  audioBitrate: number;
  packetLossRate: number;
  jitter: number;
  roundTripTime: number;
}
