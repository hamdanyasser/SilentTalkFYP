/**
 * Accessibility Context
 * Global accessibility settings management
 * WCAG 2.1 AA (NFR-006)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccessibilitySettings } from '../types/accessibility';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  reduceMotion: false,
  showFocusIndicators: true,
  enhancedFocusIndicators: false,
  fontSize: 'normal',
  screenReaderAnnouncements: true,
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('a11y-settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }

    // Detect system preferences
    return {
      ...DEFAULT_SETTINGS,
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
    };
  });

  /**
   * Update accessibility settings
   */
  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('a11y-settings', JSON.stringify(updated));
      return updated;
    });
  };

  /**
   * Announce message to screen readers
   */
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.screenReaderAnnouncements) return;

    // Create temporary live region
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;

    document.body.appendChild(liveRegion);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  };

  /**
   * Apply settings to document
   */
  useEffect(() => {
    const root = document.documentElement;

    // High contrast mode
    root.classList.toggle('high-contrast', settings.highContrast);

    // Reduce motion
    root.classList.toggle('reduce-motion', settings.reduceMotion);

    // Font size
    root.setAttribute('data-font-size', settings.fontSize);

    // Focus indicators
    root.classList.toggle('show-focus', settings.showFocusIndicators);
    root.classList.toggle('enhanced-focus', settings.enhancedFocusIndicators);
  }, [settings]);

  /**
   * Listen for system preference changes
   */
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleMotionChange = (e: MediaQueryListEvent) => {
      updateSettings({ reduceMotion: e.matches });
    };

    const handleContrastChange = (e: MediaQueryListEvent) => {
      updateSettings({ highContrast: e.matches });
    };

    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, announceToScreenReader }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * Hook to use accessibility context
 */
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
