/**
 * Caption and TTS Type Definitions
 * FR-004: Real-time Captions, Sign→Text, Text-to-Speech
 */

/**
 * Caption entry with timing information
 */
export interface Caption {
  id: string;
  text: string;
  timestamp: Date;
  confidence: number;
  participantId?: string;
  participantName?: string;
  duration?: number; // Display duration in ms
}

/**
 * Caption position on screen
 */
export type CaptionPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

/**
 * Font size options
 */
export type CaptionFontSize = 'small' | 'medium' | 'large' | 'extra-large';

/**
 * Caption settings/preferences
 */
export interface CaptionSettings {
  enabled: boolean;
  position: CaptionPosition;
  fontSize: CaptionFontSize;
  backgroundColor: string;
  textColor: string;
  opacity: number;
  maxDisplayDuration: number; // in ms
  autoHide: boolean;
}

/**
 * TTS settings
 */
export interface TTSSettings {
  enabled: boolean;
  voice?: SpeechSynthesisVoice;
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
  provider: 'web-speech-api' | 'external';
  externalProviderUrl?: string;
}

/**
 * Sign recognition result from ML service
 */
export interface SignRecognitionResult {
  sign: string;
  confidence: number;
  timestamp: string;
  inference_time_ms: number;
  handedness?: string;
  all_predictions?: Array<{
    class_index: number;
    class_name: string;
    confidence: number;
  }>;
}

/**
 * Caption export format
 */
export interface CaptionExport {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  captions: Caption[];
  metadata?: {
    participantCount: number;
    totalRecognitions: number;
    averageConfidence: number;
  };
}

/**
 * TTS provider interface for external providers
 */
export interface ITTSProvider {
  speak(text: string, settings: TTSSettings): Promise<void>;
  stop(): void;
  isSupported(): boolean;
  getVoices(): Promise<SpeechSynthesisVoice[]>;
}
