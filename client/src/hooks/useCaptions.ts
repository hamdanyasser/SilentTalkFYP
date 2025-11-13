/**
 * useCaptions Hook
 * Manages caption state, recognition, and TTS
 * FR-004: Real-time captions with <3s delay
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Caption, CaptionSettings, TTSSettings, SignRecognitionResult } from '../types/captions';
import { SignRecognitionService } from '../services/ml/SignRecognitionService';
import { TTSService } from '../services/tts/TTSService';

export interface UseCaptionsOptions {
  mlServiceUrl: string;
  autoStartRecognition?: boolean;
  maxCaptionHistory?: number;
}

export interface UseCaptionsReturn {
  // State
  currentCaption: Caption | null;
  captionHistory: Caption[];
  isConnected: boolean;
  isRecognitionActive: boolean;
  captionSettings: CaptionSettings;
  ttsSettings: TTSSettings;

  // Actions
  startRecognition: (videoElement: HTMLVideoElement) => Promise<void>;
  stopRecognition: () => void;
  toggleTTS: () => void;
  updateCaptionSettings: (settings: Partial<CaptionSettings>) => void;
  updateTTSSettings: (settings: Partial<TTSSettings>) => void;
  clearHistory: () => void;
  exportHistory: () => string;
}

const DEFAULT_CAPTION_SETTINGS: CaptionSettings = {
  enabled: true,
  position: 'bottom-center',
  fontSize: 'large',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  textColor: '#ffffff',
  opacity: 1,
  maxDisplayDuration: 5000, // 5 seconds
  autoHide: true,
};

const DEFAULT_TTS_SETTINGS: TTSSettings = {
  enabled: false,
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  provider: 'web-speech-api',
};

/**
 * Hook for managing captions and TTS
 */
export function useCaptions(options: UseCaptionsOptions): UseCaptionsReturn {
  const { mlServiceUrl, autoStartRecognition = false, maxCaptionHistory = 100 } = options;

  // Services
  const signRecognitionRef = useRef<SignRecognitionService | null>(null);
  const ttsServiceRef = useRef<TTSService | null>(null);

  // State
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);
  const [captionHistory, setCaptionHistory] = useState<Caption[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [captionSettings, setCaptionSettings] = useState<CaptionSettings>(DEFAULT_CAPTION_SETTINGS);
  const [ttsSettings, setTTSSettings] = useState<TTSSettings>(DEFAULT_TTS_SETTINGS);

  // Auto-hide timer
  const hideTimerRef = useRef<number | null>(null);

  /**
   * Handle recognition result from ML service
   */
  const handleRecognition = useCallback(
    (result: SignRecognitionResult) => {
      // Only process if confidence is reasonable and sign is detected
      if (!result.sign || result.confidence < 0.3) {
        return;
      }

      // Calculate delay from recognition to display
      const recognitionTime = new Date(result.timestamp);
      const displayTime = new Date();
      const delay = displayTime.getTime() - recognitionTime.getTime();

      // Log delay for monitoring (should be <3s)
      if (delay > 3000) {
        console.warn(`Caption delay exceeded 3s: ${delay}ms`);
      }

      // Create caption
      const caption: Caption = {
        id: `caption-${Date.now()}-${Math.random()}`,
        text: result.sign,
        timestamp: displayTime,
        confidence: result.confidence,
        duration: captionSettings.maxDisplayDuration,
      };

      // Update current caption
      setCurrentCaption(caption);

      // Add to history
      setCaptionHistory((prev) => {
        const newHistory = [...prev, caption];
        // Limit history size
        if (newHistory.length > maxCaptionHistory) {
          return newHistory.slice(-maxCaptionHistory);
        }
        return newHistory;
      });

      // Speak with TTS if enabled
      if (ttsSettings.enabled && ttsServiceRef.current) {
        ttsServiceRef.current.speak(result.sign);
      }

      // Auto-hide after duration
      if (captionSettings.autoHide) {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }

        hideTimerRef.current = window.setTimeout(() => {
          setCurrentCaption(null);
        }, captionSettings.maxDisplayDuration);
      }
    },
    [captionSettings, ttsSettings, maxCaptionHistory]
  );

  /**
   * Initialize services
   */
  useEffect(() => {
    // Initialize Sign Recognition Service
    signRecognitionRef.current = new SignRecognitionService({
      mlServiceUrl,
      onRecognition: handleRecognition,
      onError: (error) => {
        console.error('Sign recognition error:', error);
      },
      onConnectionChange: (connected) => {
        setIsConnected(connected);
      },
      frameRate: 15, // 15 FPS for efficient recognition
    });

    // Initialize TTS Service
    ttsServiceRef.current = new TTSService(ttsSettings);

    return () => {
      // Cleanup
      if (signRecognitionRef.current) {
        signRecognitionRef.current.disconnect();
      }

      if (ttsServiceRef.current) {
        ttsServiceRef.current.stop();
      }

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [mlServiceUrl]);

  /**
   * Start recognition
   */
  const startRecognition = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!signRecognitionRef.current) {
      throw new Error('Sign recognition service not initialized');
    }

    try {
      // Connect if not already connected
      if (!signRecognitionRef.current.getIsConnected()) {
        await signRecognitionRef.current.connect();
      }

      // Start recognition
      signRecognitionRef.current.startRecognition(videoElement);
      setIsRecognitionActive(true);
    } catch (error) {
      console.error('Failed to start recognition:', error);
      throw error;
    }
  }, []);

  /**
   * Stop recognition
   */
  const stopRecognition = useCallback(() => {
    if (signRecognitionRef.current) {
      signRecognitionRef.current.stopRecognition();
      setIsRecognitionActive(false);
    }
  }, []);

  /**
   * Toggle TTS
   */
  const toggleTTS = useCallback(() => {
    if (ttsServiceRef.current) {
      ttsServiceRef.current.toggle();
      setTTSSettings((prev) => ({
        ...prev,
        enabled: !prev.enabled,
      }));
    }
  }, []);

  /**
   * Update caption settings
   */
  const updateCaptionSettings = useCallback((settings: Partial<CaptionSettings>) => {
    setCaptionSettings((prev) => ({
      ...prev,
      ...settings,
    }));
  }, []);

  /**
   * Update TTS settings
   */
  const updateTTSSettings = useCallback((settings: Partial<TTSSettings>) => {
    setTTSSettings((prev) => {
      const newSettings = { ...prev, ...settings };
      if (ttsServiceRef.current) {
        ttsServiceRef.current.updateSettings(newSettings);
      }
      return newSettings;
    });
  }, []);

  /**
   * Clear history
   */
  const clearHistory = useCallback(() => {
    setCaptionHistory([]);
  }, []);

  /**
   * Export history to text
   */
  const exportHistory = useCallback(() => {
    const header = `SilentTalk Caption History\nExported: ${new Date().toISOString()}\nTotal Captions: ${captionHistory.length}\n\n`;

    const captionLines = captionHistory
      .map((caption) => {
        const time = caption.timestamp.toLocaleString();
        const confidence = (caption.confidence * 100).toFixed(1);
        return `[${time}] ${caption.text} (${confidence}% confidence)`;
      })
      .join('\n');

    return header + captionLines;
  }, [captionHistory]);

  return {
    // State
    currentCaption,
    captionHistory,
    isConnected,
    isRecognitionActive,
    captionSettings,
    ttsSettings,

    // Actions
    startRecognition,
    stopRecognition,
    toggleTTS,
    updateCaptionSettings,
    updateTTSSettings,
    clearHistory,
    exportHistory,
  };
}
