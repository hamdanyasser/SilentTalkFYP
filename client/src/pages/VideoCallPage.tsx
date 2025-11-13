/**
 * Video Call Page with Captions
 * Integrates real-time sign language recognition, captions, and TTS
 * FR-004: Real-time captions, sign→text, TTS
 * NFR-006: Accessibility
 */

import React, { useRef, useState, useEffect } from 'react';
import { useCaptions } from '../hooks/useCaptions';
import CaptionOverlay from '../components/captions/CaptionOverlay';
import CaptionHistoryPanel from '../components/captions/CaptionHistoryPanel';
import CaptionSettings from '../components/captions/CaptionSettings';
import './VideoCallPage.css';

// ML service URL from environment or default
const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'ws://localhost:8000/streaming/ws/recognize';

const VideoCallPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Caption hook
  const {
    currentCaption,
    captionHistory,
    isConnected,
    isRecognitionActive,
    captionSettings,
    ttsSettings,
    startRecognition,
    stopRecognition,
    toggleTTS,
    updateCaptionSettings,
    updateTTSSettings,
    clearHistory,
    exportHistory,
  } = useCaptions({
    mlServiceUrl: ML_SERVICE_URL,
    maxCaptionHistory: 200,
  });

  /**
   * Start webcam
   */
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCameraActive(true);
      setError(null);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  /**
   * Stop webcam
   */
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    // Also stop recognition if active
    if (isRecognitionActive) {
      stopRecognition();
    }
  };

  /**
   * Toggle recognition
   */
  const handleToggleRecognition = async () => {
    if (!isCameraActive) {
      setError('Please start camera first');
      return;
    }

    if (!videoRef.current) {
      setError('Video element not ready');
      return;
    }

    try {
      if (isRecognitionActive) {
        stopRecognition();
      } else {
        await startRecognition(videoRef.current);
        setError(null);
      }
    } catch (err) {
      console.error('Recognition error:', err);
      setError('Failed to start recognition. Check ML service connection.');
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="video-call-page">
      {/* Header */}
      <header className="video-call-page__header">
        <h1 className="video-call-page__title">SilentTalk - Video Call with Captions</h1>
        <div className="video-call-page__status">
          <span className={`video-call-page__status-indicator ${isConnected ? 'connected' : ''}`}>
            {isConnected ? '● Connected to ML Service' : '○ Disconnected'}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="video-call-page__main">
        {/* Video container */}
        <div className="video-call-page__video-container">
          {/* Video element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-call-page__video"
            aria-label="Your video feed"
          />

          {/* Caption overlay */}
          {isCameraActive && (
            <CaptionOverlay caption={currentCaption} settings={captionSettings} />
          )}

          {/* Camera not active overlay */}
          {!isCameraActive && (
            <div className="video-call-page__placeholder">
              <div className="video-call-page__placeholder-content">
                <span className="video-call-page__placeholder-icon">📹</span>
                <p>Camera is off</p>
                <button onClick={startCamera} className="video-call-page__button video-call-page__button--primary">
                  Start Camera
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="video-call-page__controls">
          {/* Camera controls */}
          <div className="video-call-page__control-group">
            <button
              onClick={isCameraActive ? stopCamera : startCamera}
              className={`video-call-page__button ${isCameraActive ? 'video-call-page__button--danger' : 'video-call-page__button--primary'}`}
              aria-label={isCameraActive ? 'Stop camera' : 'Start camera'}
            >
              {isCameraActive ? '📹 Stop Camera' : '📹 Start Camera'}
            </button>

            <button
              onClick={handleToggleRecognition}
              disabled={!isCameraActive}
              className={`video-call-page__button ${isRecognitionActive ? 'video-call-page__button--active' : ''}`}
              aria-label={isRecognitionActive ? 'Stop recognition' : 'Start recognition'}
            >
              {isRecognitionActive ? '⏸️ Stop Recognition' : '▶️ Start Recognition'}
            </button>

            <button
              onClick={toggleTTS}
              className={`video-call-page__button ${ttsSettings.enabled ? 'video-call-page__button--active' : ''}`}
              aria-label={ttsSettings.enabled ? 'Disable TTS' : 'Enable TTS'}
            >
              {ttsSettings.enabled ? '🔊 TTS On' : '🔇 TTS Off'}
            </button>
          </div>

          {/* Status info */}
          <div className="video-call-page__info">
            <div className="video-call-page__info-item">
              <span className="video-call-page__info-label">Captions:</span>
              <span className="video-call-page__info-value">{captionHistory.length}</span>
            </div>
            <div className="video-call-page__info-item">
              <span className="video-call-page__info-label">Status:</span>
              <span className="video-call-page__info-value">
                {isRecognitionActive ? 'Recognizing' : 'Idle'}
              </span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="video-call-page__error" role="alert">
            <span className="video-call-page__error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Side panel */}
        <aside className="video-call-page__sidebar">
          {/* Caption Settings */}
          <CaptionSettings
            captionSettings={captionSettings}
            ttsSettings={ttsSettings}
            onCaptionSettingsChange={updateCaptionSettings}
            onTTSSettingsChange={updateTTSSettings}
            onToggleTTS={toggleTTS}
            isOpen={isSettingsOpen}
            onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
          />

          {/* Caption History */}
          <CaptionHistoryPanel
            captions={captionHistory}
            onClear={clearHistory}
            onExport={exportHistory}
            isOpen={isHistoryOpen}
            onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
          />
        </aside>
      </main>

      {/* Footer with accessibility info */}
      <footer className="video-call-page__footer">
        <p className="video-call-page__footer-text">
          Captions are generated in real-time with AI. Timing target: &lt;3s delay.
          Export caption history for records.
        </p>
      </footer>
    </div>
  );
};

export default VideoCallPage;
