import React, { forwardRef, InputHTMLAttributes } from 'react'
import './Input.css'

export type InputSize = 'sm' | 'md' | 'lg'
export type InputVariant = 'default' | 'filled' | 'flushed'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Size of the input
   * @default 'md'
   */
  size?: InputSize

  /**
   * Visual variant of the input
   * @default 'default'
   */
  variant?: InputVariant

  /**
   * Icon to display before the input
   */
  leftIcon?: React.ReactNode

  /**
   * Icon to display after the input
   */
  rightIcon?: React.ReactNode

  /**
   * Whether the input has an error
   * @default false
   */
  hasError?: boolean

  /**
   * Whether the input is in a success state
   * @default false
   */
  hasSuccess?: boolean

  /**
   * Whether the input should take full width
   * @default false
   */
  fullWidth?: boolean
}

/**
 * Input component with multiple sizes, variants, and accessibility features.
 *
 * @example
 * ```tsx
 * <Input
 *   type="text"
 *   placeholder="Enter your name"
 *   aria-label="Name"
 * />
 *
 * <Input
 *   leftIcon={<SearchIcon />}
 *   placeholder="Search..."
 * />
 *
 * <Input
 *   hasError
 *   aria-invalid="true"
 *   aria-describedby="error-message"
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'default',
      leftIcon,
      rightIcon,
      hasError = false,
      hasSuccess = false,
      fullWidth = false,
      className = '',
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const wrapperClassNames = [
      'ds-input-wrapper',
      `ds-input-wrapper--${size}`,
      `ds-input-wrapper--${variant}`,
      hasError && 'ds-input-wrapper--error',
      hasSuccess && 'ds-input-wrapper--success',
      disabled && 'ds-input-wrapper--disabled',
      fullWidth && 'ds-input-wrapper--full-width',
      leftIcon && 'ds-input-wrapper--has-left-icon',
      rightIcon && 'ds-input-wrapper--has-right-icon',
    ]
      .filter(Boolean)
      .join(' ')

    const inputClassNames = ['ds-input', className].filter(Boolean).join(' ')

    return (
      <div className={wrapperClassNames}>
        {leftIcon && (
          <span className="ds-input__icon ds-input__icon--left" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          className={inputClassNames}
          disabled={disabled}
          aria-disabled={disabled}
          aria-invalid={hasError}
          {...props}
        />

        {rightIcon && (
          <span className="ds-input__icon ds-input__icon--right">
            {rightIcon}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

/* ============================================================================ */
/* TEXTAREA */
/* ============================================================================ */

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Size of the textarea
   * @default 'md'
   */
  size?: InputSize

  /**
   * Visual variant of the textarea
   * @default 'default'
   */
  variant?: InputVariant

  /**
   * Whether the textarea has an error
   * @default false
   */
  hasError?: boolean

  /**
   * Whether the textarea is in a success state
   * @default false
   */
  hasSuccess?: boolean

  /**
   * Whether the textarea should take full width
   * @default true
   */
  fullWidth?: boolean

  /**
   * Whether to allow manual resizing
   * @default 'vertical'
   */
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
}

/**
 * TextArea component with multiple sizes, variants, and accessibility features.
 *
 * @example
 * ```tsx
 * <TextArea
 *   placeholder="Enter your message"
 *   rows={4}
 *   aria-label="Message"
 * />
 *
 * <TextArea
 *   hasError
 *   aria-invalid="true"
 *   aria-describedby="error-message"
 * />
 * ```
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      size = 'md',
      variant = 'default',
      hasError = false,
      hasSuccess = false,
      fullWidth = true,
      resize = 'vertical',
      className = '',
      disabled = false,
      rows = 3,
      ...props
    },
    ref,
  ) => {
    const wrapperClassNames = [
      'ds-textarea-wrapper',
      `ds-textarea-wrapper--${size}`,
      `ds-textarea-wrapper--${variant}`,
      hasError && 'ds-textarea-wrapper--error',
      hasSuccess && 'ds-textarea-wrapper--success',
      disabled && 'ds-textarea-wrapper--disabled',
      fullWidth && 'ds-textarea-wrapper--full-width',
      `ds-textarea--resize-${resize}`,
    ]
      .filter(Boolean)
      .join(' ')

    const textareaClassNames = ['ds-textarea', className].filter(Boolean).join(' ')

    return (
      <div className={wrapperClassNames}>
        <textarea
          ref={ref}
          className={textareaClassNames}
          disabled={disabled}
          aria-disabled={disabled}
          aria-invalid={hasError}
          rows={rows}
          {...props}
        />
      </div>
    )
  },
)

TextArea.displayName = 'TextArea'
