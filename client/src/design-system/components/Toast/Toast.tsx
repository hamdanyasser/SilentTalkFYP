import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './Toast.css'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface ToastProps {
  id?: string
  variant?: ToastVariant
  title?: string
  description?: string
  duration?: number
  isClosable?: boolean
  onClose?: () => void
  position?: ToastPosition
}

export const Toast: React.FC<ToastProps> = ({
  variant = 'info',
  title,
  description,
  duration = 5000,
  isClosable = true,
  onClose,
  position = 'top-right',
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M16.667 5L7.5 14.167L3.333 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M15 5L5 15M5 5L15 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 6v4m0 4h.01M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 11v5m0-8h.01M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  }

  const toastClassNames = [
    'ds-toast',
    `ds-toast--${variant}`,
    `ds-toast--${position}`,
    isVisible ? 'ds-toast--visible' : 'ds-toast--hidden',
  ].join(' ')

  const toast = (
    <div className={toastClassNames} role="alert" aria-live="polite">
      <div className="ds-toast__icon" aria-hidden="true">
        {icons[variant]}
      </div>
      <div className="ds-toast__content">
        {title && <div className="ds-toast__title">{title}</div>}
        {description && <div className="ds-toast__description">{description}</div>}
      </div>
      {isClosable && (
        <button className="ds-toast__close" onClick={handleClose} aria-label="Close notification">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  )

  return createPortal(toast, document.body)
}

Toast.displayName = 'Toast'
