/**
 * Caption History Panel Component
 * Displays caption history with export functionality
 * FR-004: Caption history panel and export to .txt
 */

import React, { useRef } from 'react';
import { Caption } from '../../types/captions';
import './CaptionHistoryPanel.css';

interface CaptionHistoryPanelProps {
  captions: Caption[];
  onClear?: () => void;
  onExport?: () => string;
  isOpen: boolean;
  onToggle?: () => void;
  className?: string;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Download text file
 */
function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const CaptionHistoryPanel: React.FC<CaptionHistoryPanelProps> = ({
  captions,
  onClear,
  onExport,
  isOpen,
  onToggle,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Handle export button click
   */
  const handleExport = () => {
    if (!onExport) return;

    const content = onExport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `captions-${timestamp}.txt`;

    downloadTextFile(content, filename);
  };

  /**
   * Handle clear button click
   */
  const handleClear = () => {
    if (onClear && window.confirm('Are you sure you want to clear caption history?')) {
      onClear();
    }
  };

  /**
   * Scroll to bottom
   */
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Auto-scroll to bottom when new captions arrive
  React.useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [captions.length, isOpen]);

  return (
    <div className={`caption-history ${isOpen ? 'caption-history--open' : ''} ${className}`}>
      {/* Toggle button */}
      <button
        className="caption-history__toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Close caption history' : 'Open caption history'}
        aria-expanded={isOpen}
      >
        <span className="caption-history__toggle-icon">
          {isOpen ? '▼' : '▲'}
        </span>
        <span className="caption-history__toggle-text">
          Caption History ({captions.length})
        </span>
      </button>

      {/* Panel content */}
      {isOpen && (
        <div className="caption-history__panel" role="region" aria-label="Caption history panel">
          {/* Header */}
          <div className="caption-history__header">
            <h3 className="caption-history__title">Caption History</h3>
            <div className="caption-history__actions">
              <button
                className="caption-history__button caption-history__button--export"
                onClick={handleExport}
                disabled={captions.length === 0}
                aria-label="Export captions to text file"
              >
                <span className="caption-history__button-icon">📥</span>
                Export
              </button>
              <button
                className="caption-history__button caption-history__button--clear"
                onClick={handleClear}
                disabled={captions.length === 0}
                aria-label="Clear caption history"
              >
                <span className="caption-history__button-icon">🗑️</span>
                Clear
              </button>
            </div>
          </div>

          {/* Caption list */}
          <div
            className="caption-history__list"
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-relevant="additions"
          >
            {captions.length === 0 ? (
              <div className="caption-history__empty">
                <p>No captions yet. Captions will appear here as they are recognized.</p>
              </div>
            ) : (
              captions.map((caption) => (
                <div
                  key={caption.id}
                  className="caption-history__item"
                  role="listitem"
                >
                  <div className="caption-history__item-time">
                    {formatTimestamp(caption.timestamp)}
                  </div>
                  <div className="caption-history__item-content">
                    <div className="caption-history__item-text">
                      {caption.text}
                    </div>
                    {caption.confidence && (
                      <div
                        className="caption-history__item-confidence"
                        aria-label={`Confidence: ${(caption.confidence * 100).toFixed(0)}%`}
                      >
                        {(caption.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                  {caption.participantName && (
                    <div className="caption-history__item-participant">
                      {caption.participantName}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer with stats */}
          {captions.length > 0 && (
            <div className="caption-history__footer">
              <div className="caption-history__stats">
                <span>Total: {captions.length}</span>
                {captions.length > 0 && (
                  <span>
                    Avg Confidence:{' '}
                    {(
                      (captions.reduce((sum, c) => sum + c.confidence, 0) / captions.length) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaptionHistoryPanel;
