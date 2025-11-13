/**
 * Caption Settings Component
 * Controls for caption position, font size, and TTS settings
 * FR-004: Caption position and font size controls, TTS toggle
 */

import React from 'react';
import { CaptionSettings as CaptionSettingsType, TTSSettings, CaptionPosition, CaptionFontSize } from '../../types/captions';
import './CaptionSettings.css';

interface CaptionSettingsProps {
  captionSettings: CaptionSettingsType;
  ttsSettings: TTSSettings;
  onCaptionSettingsChange: (settings: Partial<CaptionSettingsType>) => void;
  onTTSSettingsChange: (settings: Partial<TTSSettings>) => void;
  onToggleTTS: () => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

const POSITION_OPTIONS: { value: CaptionPosition; label: string }[] = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

const FONT_SIZE_OPTIONS: { value: CaptionFontSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra Large' },
];

export const CaptionSettings: React.FC<CaptionSettingsProps> = ({
  captionSettings,
  ttsSettings,
  onCaptionSettingsChange,
  onTTSSettingsChange,
  onToggleTTS,
  isOpen,
  onToggle,
  className = '',
}) => {
  return (
    <div className={`caption-settings ${isOpen ? 'caption-settings--open' : ''} ${className}`}>
      {/* Toggle button */}
      <button
        className="caption-settings__toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Close caption settings' : 'Open caption settings'}
        aria-expanded={isOpen}
      >
        <span className="caption-settings__toggle-icon">⚙️</span>
        <span className="caption-settings__toggle-text">Caption Settings</span>
        <span className="caption-settings__toggle-arrow">{isOpen ? '▼' : '▶'}</span>
      </button>

      {/* Settings panel */}
      {isOpen && (
        <div className="caption-settings__panel" role="region" aria-label="Caption settings panel">
          {/* Caption Settings */}
          <section className="caption-settings__section">
            <h3 className="caption-settings__section-title">Caption Display</h3>

            {/* Enable/Disable Captions */}
            <div className="caption-settings__field">
              <label className="caption-settings__label">
                <input
                  type="checkbox"
                  checked={captionSettings.enabled}
                  onChange={(e) => onCaptionSettingsChange({ enabled: e.target.checked })}
                  className="caption-settings__checkbox"
                />
                <span>Enable Captions</span>
              </label>
            </div>

            {/* Position */}
            <div className="caption-settings__field">
              <label className="caption-settings__label">
                Position
              </label>
              <select
                value={captionSettings.position}
                onChange={(e) => onCaptionSettingsChange({ position: e.target.value as CaptionPosition })}
                className="caption-settings__select"
                disabled={!captionSettings.enabled}
              >
                {POSITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div className="caption-settings__field">
              <label className="caption-settings__label">
                Font Size
              </label>
              <select
                value={captionSettings.fontSize}
                onChange={(e) => onCaptionSettingsChange({ fontSize: e.target.value as CaptionFontSize })}
                className="caption-settings__select"
                disabled={!captionSettings.enabled}
              >
                {FONT_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-hide */}
            <div className="caption-settings__field">
              <label className="caption-settings__label">
                <input
                  type="checkbox"
                  checked={captionSettings.autoHide}
                  onChange={(e) => onCaptionSettingsChange({ autoHide: e.target.checked })}
                  className="caption-settings__checkbox"
                  disabled={!captionSettings.enabled}
                />
                <span>Auto-hide captions</span>
              </label>
            </div>

            {/* Display Duration */}
            {captionSettings.autoHide && (
              <div className="caption-settings__field">
                <label className="caption-settings__label">
                  Display Duration: {(captionSettings.maxDisplayDuration / 1000).toFixed(1)}s
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="500"
                  value={captionSettings.maxDisplayDuration}
                  onChange={(e) => onCaptionSettingsChange({ maxDisplayDuration: parseInt(e.target.value) })}
                  className="caption-settings__slider"
                  disabled={!captionSettings.enabled}
                />
              </div>
            )}
          </section>

          {/* TTS Settings */}
          <section className="caption-settings__section">
            <h3 className="caption-settings__section-title">Text-to-Speech</h3>

            {/* Enable/Disable TTS */}
            <div className="caption-settings__field">
              <label className="caption-settings__label">
                <input
                  type="checkbox"
                  checked={ttsSettings.enabled}
                  onChange={onToggleTTS}
                  className="caption-settings__checkbox"
                />
                <span>Enable Text-to-Speech</span>
              </label>
            </div>

            {/* Speech Rate */}
            <div className="caption-settings__field">
              <label className="caption-settings__label">
                Speech Rate: {ttsSettings.rate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={ttsSettings.rate}
                onChange={(e) => onTTSSettingsChange({ rate: parseFloat(e.target.value) })}
                className="caption-settings__slider"
                disabled={!ttsSettings.enabled}
              />
            </div>

            {/* Pitch */}
            <div className="caption-settings__field">
              <label className="caption-settings__label">
                Pitch: {ttsSettings.pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={ttsSettings.pitch}
                onChange={(e) => onTTSSettingsChange({ pitch: parseFloat(e.target.value) })}
                className="caption-settings__slider"
                disabled={!ttsSettings.enabled}
              />
            </div>

            {/* Volume */}
            <div className="caption-settings__field">
              <label className="caption-settings__label">
                Volume: {(ttsSettings.volume * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ttsSettings.volume}
                onChange={(e) => onTTSSettingsChange({ volume: parseFloat(e.target.value) })}
                className="caption-settings__slider"
                disabled={!ttsSettings.enabled}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default CaptionSettings;
