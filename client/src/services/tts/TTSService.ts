/**
 * Text-to-Speech Service
 * Web Speech API with fallback and external provider hooks
 * FR-004: TTS for recognized signs with toggle control
 */

import { TTSSettings, ITTSProvider } from '../../types/captions';

/**
 * Web Speech API Provider
 */
class WebSpeechAPIProvider implements ITTSProvider {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  async speak(text: string, settings: TTSSettings): Promise<void> {
    if (!this.synth) {
      throw new Error('Web Speech API not supported');
    }

    // Cancel any ongoing speech
    this.stop();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Apply settings
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;

      if (settings.voice) {
        utterance.voice = settings.voice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synth!.speak(utterance);
    });
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  async getVoices(): Promise<SpeechSynthesisVoice[]> {
    if (!this.synth) {
      return [];
    }

    // Web Speech API voices are loaded asynchronously
    return new Promise((resolve) => {
      let voices = this.synth!.getVoices();

      if (voices.length > 0) {
        resolve(voices);
      } else {
        // Wait for voiceschanged event
        this.synth!.addEventListener('voiceschanged', () => {
          voices = this.synth!.getVoices();
          resolve(voices);
        }, { once: true });
      }
    });
  }
}

/**
 * External TTS Provider (for future integration with cloud TTS services)
 */
class ExternalTTSProvider implements ITTSProvider {
  private providerUrl: string;
  private audioElement: HTMLAudioElement | null = null;

  constructor(providerUrl: string) {
    this.providerUrl = providerUrl;
  }

  async speak(text: string, settings: TTSSettings): Promise<void> {
    this.stop();

    try {
      // Call external TTS API
      const response = await fetch(this.providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          rate: settings.rate,
          pitch: settings.pitch,
          volume: settings.volume,
          voice: settings.voice?.name,
        }),
      });

      if (!response.ok) {
        throw new Error(`External TTS failed: ${response.statusText}`);
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      return new Promise((resolve, reject) => {
        this.audioElement = new Audio(audioUrl);
        this.audioElement.volume = settings.volume;

        this.audioElement.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.audioElement = null;
          resolve();
        };

        this.audioElement.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          this.audioElement = null;
          reject(error);
        };

        this.audioElement.play().catch(reject);
      });
    } catch (error) {
      throw new Error(`External TTS provider error: ${error}`);
    }
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }
  }

  isSupported(): boolean {
    // External TTS is always "supported" (will fail at runtime if not available)
    return true;
  }

  async getVoices(): Promise<SpeechSynthesisVoice[]> {
    // External providers would need their own voice listing endpoint
    // For now, return empty array
    return [];
  }
}

/**
 * TTS Service Manager
 */
export class TTSService {
  private settings: TTSSettings;
  private provider: ITTSProvider;
  private isSpeaking = false;
  private queue: string[] = [];

  constructor(settings?: Partial<TTSSettings>) {
    this.settings = {
      enabled: true,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      provider: 'web-speech-api',
      ...settings,
    };

    this.provider = this.createProvider();
  }

  /**
   * Create TTS provider based on settings
   */
  private createProvider(): ITTSProvider {
    if (this.settings.provider === 'external' && this.settings.externalProviderUrl) {
      return new ExternalTTSProvider(this.settings.externalProviderUrl);
    }

    return new WebSpeechAPIProvider();
  }

  /**
   * Speak text
   */
  async speak(text: string): Promise<void> {
    if (!this.settings.enabled) {
      return;
    }

    if (!this.provider.isSupported()) {
      console.warn('TTS not supported');
      return;
    }

    // Add to queue if already speaking
    if (this.isSpeaking) {
      this.queue.push(text);
      return;
    }

    this.isSpeaking = true;

    try {
      await this.provider.speak(text, this.settings);
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      this.isSpeaking = false;

      // Process queue
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        this.speak(next);
      }
    }
  }

  /**
   * Stop current speech
   */
  stop(): void {
    this.provider.stop();
    this.isSpeaking = false;
    this.queue = [];
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<TTSSettings>): void {
    const oldProvider = this.settings.provider;

    this.settings = {
      ...this.settings,
      ...settings,
    };

    // Recreate provider if provider type changed
    if (oldProvider !== this.settings.provider) {
      this.stop();
      this.provider = this.createProvider();
    }
  }

  /**
   * Get current settings
   */
  getSettings(): TTSSettings {
    return { ...this.settings };
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<SpeechSynthesisVoice[]> {
    return this.provider.getVoices();
  }

  /**
   * Check if TTS is supported
   */
  isSupported(): boolean {
    return this.provider.isSupported();
  }

  /**
   * Toggle TTS on/off
   */
  toggle(): void {
    this.settings.enabled = !this.settings.enabled;

    if (!this.settings.enabled) {
      this.stop();
    }
  }

  /**
   * Enable TTS
   */
  enable(): void {
    this.settings.enabled = true;
  }

  /**
   * Disable TTS
   */
  disable(): void {
    this.settings.enabled = false;
    this.stop();
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

/**
 * Create singleton instance
 */
let ttsServiceInstance: TTSService | null = null;

export function getTTSService(settings?: Partial<TTSSettings>): TTSService {
  if (!ttsServiceInstance) {
    ttsServiceInstance = new TTSService(settings);
  }

  return ttsServiceInstance;
}
