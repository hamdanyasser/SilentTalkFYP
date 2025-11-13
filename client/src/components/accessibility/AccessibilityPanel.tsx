/**
 * Accessibility Settings Panel
 * User controls for accessibility preferences
 * WCAG 2.1 AA (NFR-006)
 */

import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import './AccessibilityPanel.css';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ isOpen, onToggle }) => {
  const { settings, updateSettings } = useAccessibility();

  return (
    <div className="accessibility-panel">
      <button
        className="accessibility-panel__toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Close accessibility settings' : 'Open accessibility settings'}
        aria-expanded={isOpen}
        aria-controls="accessibility-panel-content"
      >
        <span className="accessibility-panel__toggle-icon" aria-hidden="true">
          ♿
        </span>
        <span>Accessibility</span>
        <span className="accessibility-panel__toggle-arrow" aria-hidden="true">
          {isOpen ? '▼' : '▶'}
        </span>
      </button>

      {isOpen && (
        <div
          id="accessibility-panel-content"
          className="accessibility-panel__content"
          role="region"
          aria-label="Accessibility settings"
        >
          <h3 className="accessibility-panel__title">Accessibility Settings</h3>

          {/* High Contrast */}
          <div className="accessibility-panel__field">
            <label className="accessibility-panel__label">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => updateSettings({ highContrast: e.target.checked })}
                className="accessibility-panel__checkbox"
                aria-describedby="high-contrast-desc"
              />
              <span>High Contrast Mode</span>
            </label>
            <p id="high-contrast-desc" className="accessibility-panel__description">
              Increases color contrast for better visibility
            </p>
          </div>

          {/* Reduce Motion */}
          <div className="accessibility-panel__field">
            <label className="accessibility-panel__label">
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(e) => updateSettings({ reduceMotion: e.target.checked })}
                className="accessibility-panel__checkbox"
                aria-describedby="reduce-motion-desc"
              />
              <span>Reduce Motion</span>
            </label>
            <p id="reduce-motion-desc" className="accessibility-panel__description">
              Minimizes animations and transitions
            </p>
          </div>

          {/* Enhanced Focus Indicators */}
          <div className="accessibility-panel__field">
            <label className="accessibility-panel__label">
              <input
                type="checkbox"
                checked={settings.enhancedFocusIndicators}
                onChange={(e) => updateSettings({ enhancedFocusIndicators: e.target.checked })}
                className="accessibility-panel__checkbox"
                aria-describedby="focus-indicators-desc"
              />
              <span>Enhanced Focus Indicators</span>
            </label>
            <p id="focus-indicators-desc" className="accessibility-panel__description">
              Makes keyboard focus more visible
            </p>
          </div>

          {/* Font Size */}
          <div className="accessibility-panel__field">
            <label htmlFor="font-size-select" className="accessibility-panel__label">
              Font Size
            </label>
            <select
              id="font-size-select"
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: e.target.value as any })}
              className="accessibility-panel__select"
              aria-describedby="font-size-desc"
            >
              <option value="normal">Normal</option>
              <option value="large">Large (18px)</option>
              <option value="extra-large">Extra Large (20px)</option>
            </select>
            <p id="font-size-desc" className="accessibility-panel__description">
              Adjust text size throughout the application
            </p>
          </div>

          {/* Screen Reader Announcements */}
          <div className="accessibility-panel__field">
            <label className="accessibility-panel__label">
              <input
                type="checkbox"
                checked={settings.screenReaderAnnouncements}
                onChange={(e) => updateSettings({ screenReaderAnnouncements: e.target.checked })}
                className="accessibility-panel__checkbox"
                aria-describedby="screen-reader-desc"
              />
              <span>Screen Reader Announcements</span>
            </label>
            <p id="screen-reader-desc" className="accessibility-panel__description">
              Enable live region announcements for status updates
            </p>
          </div>

          {/* Reset Button */}
          <div className="accessibility-panel__actions">
            <button
              onClick={() =>
                updateSettings({
                  highContrast: false,
                  reduceMotion: false,
                  enhancedFocusIndicators: false,
                  fontSize: 'normal',
                  screenReaderAnnouncements: true,
                })
              }
              className="accessibility-panel__button"
            >
              Reset to Defaults
            </button>
          </div>

          {/* Info */}
          <div className="accessibility-panel__info">
            <p>
              <strong>Keyboard Shortcuts:</strong>
            </p>
            <ul>
              <li>
                <kbd>Tab</kbd> - Navigate forward
              </li>
              <li>
                <kbd>Shift + Tab</kbd> - Navigate backward
              </li>
              <li>
                <kbd>Enter</kbd> or <kbd>Space</kbd> - Activate
              </li>
              <li>
                <kbd>Esc</kbd> - Close dialogs
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityPanel;
