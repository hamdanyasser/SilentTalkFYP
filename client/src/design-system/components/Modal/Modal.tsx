import React, { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '../../../hooks/useA11y'
import './Modal.css'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean

  /**
   * Callback when the modal should close
   */
  onClose: () => void

  /**
   * Modal title (for accessibility)
   */
  title?: string

  /**
   * Size of the modal
   * @default 'md'
   */
  size?: ModalSize

  /**
   * Whether clicking the backdrop closes the modal
   * @default true
   */
  closeOnBackdropClick?: boolean

  /**
   * Whether pressing ESC closes the modal
   * @default true
   */
  closeOnEscape?: boolean

  /**
   * Whether to show the close button
   * @default true
   */
  showCloseButton?: boolean

  /**
   * Custom close button aria-label
   * @default 'Close modal'
   */
  closeButtonLabel?: string

  /**
   * Modal content
   */
  children: React.ReactNode

  /**
   * Custom className for the modal content
   */
  className?: string

  /**
   * Initial focus ref
   */
  initialFocusRef?: React.RefObject<HTMLElement>
}

/**
 * Modal component with focus trapping, backdrop, and full accessibility support.
 *
 * @example
 * ```tsx
 * <Modal isOpen={isOpen} onClose={handleClose} title="Confirm Action">
 *   <ModalHeader>
 *     <h2>Are you sure?</h2>
 *   </ModalHeader>
 *   <ModalBody>
 *     <p>This action cannot be undone.</p>
 *   </ModalBody>
 *   <ModalFooter>
 *     <Button onClick={handleClose}>Cancel</Button>
 *     <Button variant="danger" onClick={handleConfirm}>Confirm</Button>
 *   </ModalFooter>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  closeButtonLabel = 'Close modal',
  children,
  className = '',
  initialFocusRef,
}) => {
  const modalRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    escapeDeactivates: closeOnEscape,
    returnFocusOnDeactivate: true,
  })

  const backdropRef = useRef<HTMLDivElement>(null)

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdropClick && e.target === backdropRef.current) {
        onClose()
      }
    },
    [closeOnBackdropClick, onClose],
  )

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeOnEscape, onClose])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Focus initial element or first focusable
  useEffect(() => {
    if (!isOpen) return

    if (initialFocusRef?.current) {
      initialFocusRef.current.focus()
    } else if (modalRef.current) {
      const firstFocusable = modalRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      firstFocusable?.focus()
    }
  }, [isOpen, initialFocusRef, modalRef])

  if (!isOpen) return null

  const modalContent = (
    <div
      className="ds-modal-backdrop"
      ref={backdropRef}
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className={`ds-modal ds-modal--${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {showCloseButton && (
          <button
            type="button"
            className="ds-modal__close"
            onClick={onClose}
            aria-label={closeButtonLabel}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <div className="ds-modal__content">{children}</div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

Modal.displayName = 'Modal'

/* ============================================================================ */
/* MODAL SUBCOMPONENTS */
/* ============================================================================ */

export interface ModalHeaderProps {
  children: React.ReactNode
  className?: string
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className = '' }) => (
  <div className={`ds-modal__header ${className}`}>{children}</div>
)

ModalHeader.displayName = 'ModalHeader'

export interface ModalBodyProps {
  children: React.ReactNode
  className?: string
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '' }) => (
  <div className={`ds-modal__body ${className}`}>{children}</div>
)

ModalBody.displayName = 'ModalBody'

export interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '' }) => (
  <div className={`ds-modal__footer ${className}`}>{children}</div>
)

ModalFooter.displayName = 'ModalFooter'
