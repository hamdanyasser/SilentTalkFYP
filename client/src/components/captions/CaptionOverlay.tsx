/**
 * Caption Overlay Component
 * Displays real-time captions with customizable position and styling
 * FR-004: Caption overlay with position and font size controls
 * NFR-006: Accessibility attributes
 */

import React from 'react';
import { Caption, CaptionSettings, CaptionPosition, CaptionFontSize } from '../../types/captions';
import './CaptionOverlay.css';

interface CaptionOverlayProps {
  caption: Caption | null;
  settings: CaptionSettings;
  className?: string;
}

/**
 * Get CSS class for position
 */
function getPositionClass(position: CaptionPosition): string {
  const positionMap: Record<CaptionPosition, string> = {
    'top-left': 'caption-overlay--top-left',
    'top-center': 'caption-overlay--top-center',
    'top-right': 'caption-overlay--top-right',
    'bottom-left': 'caption-overlay--bottom-left',
    'bottom-center': 'caption-overlay--bottom-center',
    'bottom-right': 'caption-overlay--bottom-right',
  };
  return positionMap[position];
}

/**
 * Get CSS class for font size
 */
function getFontSizeClass(fontSize: CaptionFontSize): string {
  const fontMap: Record<CaptionFontSize, string> = {
    'small': 'caption-overlay--font-small',
    'medium': 'caption-overlay--font-medium',
    'large': 'caption-overlay--font-large',
    'extra-large': 'caption-overlay--font-extra-large',
  };
  return fontMap[fontSize];
}

/**
 * Format confidence percentage
 */
function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(0)}%`;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({ caption, settings, className = '' }) => {
  if (!settings.enabled || !caption) {
    return null;
  }

  const positionClass = getPositionClass(settings.position);
  const fontSizeClass = getFontSizeClass(settings.fontSize);

  return (
    <div
      className={`caption-overlay ${positionClass} ${fontSizeClass} ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Live captions"
    >
      <div
        className="caption-overlay__content"
        style={{
          backgroundColor: settings.backgroundColor,
          color: settings.textColor,
          opacity: settings.opacity,
        }}
      >
        <div className="caption-overlay__text">
          {caption.text}
        </div>
        {caption.confidence && (
          <div className="caption-overlay__confidence" aria-label={`Confidence: ${formatConfidence(caption.confidence)}`}>
            {formatConfidence(caption.confidence)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptionOverlay;
