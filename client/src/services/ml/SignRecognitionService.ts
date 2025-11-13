/**
 * Sign Recognition Service
 * Connects to ML service WebSocket for real-time sign language recognition
 * FR-004: Sign→Text conversion with <3s delay
 */

import { SignRecognitionResult } from '../../types/captions';

export interface SignRecognitionConfig {
  mlServiceUrl: string; // e.g., 'ws://localhost:8000/streaming/ws/recognize'
  onRecognition?: (result: SignRecognitionResult) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
  frameRate?: number; // Target FPS for sending frames (default: 15)
}

/**
 * Service for real-time sign language recognition via ML service WebSocket
 */
export class SignRecognitionService {
  private ws: WebSocket | null = null;
  private config: SignRecognitionConfig;
  private sessionId: string | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;
  private frameQueue: Blob[] = [];
  private isProcessing = false;
  private frameInterval: number | null = null;

  constructor(config: SignRecognitionConfig) {
    this.config = {
      frameRate: 15,
      ...config,
    };
  }

  /**
   * Connect to ML service WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws && this.isConnected) {
      console.warn('Already connected to ML service');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.mlServiceUrl);

        this.ws.onopen = () => {
          console.log('Connected to ML service');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.config.onConnectionChange?.(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.config.onError?.(new Error('WebSocket connection error'));
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from ML service');
          this.isConnected = false;
          this.config.onConnectionChange?.(false);
          this.handleReconnection();
        };

        // Wait for connection message
        const messageHandler = (event: MessageEvent) => {
          const data = JSON.parse(event.data);
          if (data.type === 'connection') {
            this.sessionId = data.session_id;
            console.log(`ML service session: ${this.sessionId}`);
            resolve();
            this.ws?.removeEventListener('message', messageHandler);
          }
        };

        this.ws.addEventListener('message', messageHandler);

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.sessionId) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from ML service
   */
  disconnect(): void {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    if (this.ws) {
      // Send stop message
      this.ws.send(JSON.stringify({ type: 'stop' }));
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.sessionId = null;
    this.frameQueue = [];
    this.config.onConnectionChange?.(false);
  }

  /**
   * Start sending video frames for recognition
   * @param videoElement - HTML video element from webcam or remote stream
   */
  startRecognition(videoElement: HTMLVideoElement): void {
    if (!this.isConnected) {
      throw new Error('Not connected to ML service');
    }

    // Clear any existing interval
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
    }

    // Calculate interval based on frame rate
    const intervalMs = 1000 / (this.config.frameRate || 15);

    // Start sending frames at specified rate
    this.frameInterval = window.setInterval(() => {
      this.captureAndSendFrame(videoElement);
    }, intervalMs);

    console.log(`Started recognition at ${this.config.frameRate} FPS`);
  }

  /**
   * Stop sending frames
   */
  stopRecognition(): void {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
      console.log('Stopped recognition');
    }
  }

  /**
   * Capture frame from video element and send to ML service
   */
  private captureAndSendFrame(videoElement: HTMLVideoElement): void {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Skip if video not ready
    if (videoElement.readyState < 2 || videoElement.paused) {
      return;
    }

    try {
      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Convert to JPEG blob and send
      canvas.toBlob(
        (blob) => {
          if (blob && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(blob);
          }
        },
        'image/jpeg',
        0.85 // Quality
      );
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'connection':
          // Already handled in connect()
          break;

        case 'recognition':
          // Sign recognition result
          if (this.config.onRecognition) {
            const result: SignRecognitionResult = {
              sign: message.sign,
              confidence: message.confidence,
              timestamp: message.timestamp,
              inference_time_ms: message.inference_time_ms,
              handedness: message.handedness,
              all_predictions: message.all_predictions,
            };
            this.config.onRecognition(result);
          }
          break;

        case 'stats':
          // Performance stats (optional logging)
          console.debug('ML service stats:', message.stats);
          break;

        case 'error':
          console.error('ML service error:', message.error);
          this.config.onError?.(new Error(message.error));
          break;

        case 'pong':
          // Heartbeat response
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  /**
   * Handle reconnection logic
   */
  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.config.onError?.(new Error('Failed to reconnect to ML service'));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }

  /**
   * Send ping to keep connection alive
   */
  ping(): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Check if connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }
}

/**
 * Create a singleton instance (optional)
 */
let signRecognitionServiceInstance: SignRecognitionService | null = null;

export function getSignRecognitionService(config?: SignRecognitionConfig): SignRecognitionService {
  if (!signRecognitionServiceInstance && config) {
    signRecognitionServiceInstance = new SignRecognitionService(config);
  }

  if (!signRecognitionServiceInstance) {
    throw new Error('SignRecognitionService not initialized. Provide config on first call.');
  }

  return signRecognitionServiceInstance;
}
