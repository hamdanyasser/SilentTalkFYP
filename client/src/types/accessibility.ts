/**
 * Accessibility Types
 * WCAG 2.1 AA Implementation (NFR-006)
 */

export interface AccessibilitySettings {
  // High contrast mode
  highContrast: boolean;

  // Motion preferences
  reduceMotion: boolean;

  // Focus management
  showFocusIndicators: boolean;
  enhancedFocusIndicators: boolean;

  // Text and sizing
  fontSize: 'normal' | 'large' | 'extra-large';

  // Screen reader
  screenReaderAnnouncements: boolean;
}

export interface FocusTrapOptions {
  enabled: boolean;
  returnFocusOnDeactivate?: boolean;
  escapeDeactivates?: boolean;
  clickOutsideDeactivates?: boolean;
}

export interface SkipLink {
  id: string;
  label: string;
  targetId: string;
}

export interface A11yError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}
