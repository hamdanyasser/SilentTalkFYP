/**
 * Accessibility Hooks
 * WCAG 2.1 AA utilities
 */

import { useEffect, useRef, useCallback, RefObject } from 'react';
import { FocusTrapOptions } from '../types/accessibility';

/**
 * Focus trap hook to prevent keyboard navigation outside a container
 * Prevents keyboard traps by allowing ESC to exit
 */
export function useFocusTrap<T extends HTMLElement>(
  options: FocusTrapOptions = { enabled: true }
): RefObject<T> {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!options.enabled || !containerRef.current) return;

    const container = containerRef.current;
    previousFocusRef.current = document.activeElement as HTMLElement;

    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && options.escapeDeactivates !== false) {
        // Allow ESC to exit focus trap
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      }
      // Tab
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (options.clickOutsideDeactivates && !container.contains(e.target as Node)) {
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    if (options.clickOutsideDeactivates) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);

      // Restore focus
      if (options.returnFocusOnDeactivate !== false && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [options.enabled, options.escapeDeactivates, options.clickOutsideDeactivates, options.returnFocusOnDeactivate]);

  return containerRef;
}

/**
 * Manage focus for single element
 */
export function useAutoFocus<T extends HTMLElement>(shouldFocus: boolean = true): RefObject<T> {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      // Small delay to ensure element is mounted and visible
      const timer = setTimeout(() => {
        elementRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [shouldFocus]);

  return elementRef;
}

/**
 * Keyboard navigation hook
 * Provides arrow key navigation for lists/grids
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end') => void
): RefObject<T> {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!containerRef.current || !onNavigate) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onNavigate('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          onNavigate('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onNavigate('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNavigate('right');
          break;
        case 'Home':
          e.preventDefault();
          onNavigate('home');
          break;
        case 'End':
          e.preventDefault();
          onNavigate('end');
          break;
      }
    };

    const container = containerRef.current;
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNavigate]);

  return containerRef;
}

/**
 * Skip to content functionality
 */
export function useSkipLink(targetId: string): () => void {
  return useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.addEventListener(
        'blur',
        () => {
          target.removeAttribute('tabindex');
        },
        { once: true }
      );
    }
  }, [targetId]);
}

/**
 * Announce to screen reader
 */
export function useScreenReaderAnnouncement() {
  return useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;

    document.body.appendChild(liveRegion);

    setTimeout(() => {
      if (liveRegion.parentNode) {
        document.body.removeChild(liveRegion);
      }
    }, 1000);
  }, []);
}

/**
 * Monitor focus visible state
 * Helps distinguish between mouse and keyboard focus
 */
export function useFocusVisible(): {
  focusVisible: boolean;
  onFocus: () => void;
  onBlur: () => void;
} {
  const [focusVisible, setFocusVisible] = React.useState(false);
  const [isKeyboard, setIsKeyboard] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = () => setIsKeyboard(true);
    const handleMouseDown = () => setIsKeyboard(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const onFocus = useCallback(() => {
    if (isKeyboard) {
      setFocusVisible(true);
    }
  }, [isKeyboard]);

  const onBlur = useCallback(() => {
    setFocusVisible(false);
  }, []);

  return { focusVisible, onFocus, onBlur };
}

// Import React for useState
import React from 'react';
