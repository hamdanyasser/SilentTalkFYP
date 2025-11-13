import React, { forwardRef, ButtonHTMLAttributes } from 'react'
import './Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant

  /**
   * Size of the button
   * @default 'md'
   */
  size?: ButtonSize

  /**
   * Whether the button should take full width
   * @default false
   */
  fullWidth?: boolean

  /**
   * Icon to display before the button text
   */
  leftIcon?: React.ReactNode

  /**
   * Icon to display after the button text
   */
  rightIcon?: React.ReactNode

  /**
   * Whether the button is in a loading state
   * @default false
   */
  isLoading?: boolean

  /**
   * Custom loading text to display when isLoading is true
   */
  loadingText?: string

  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Button content
   */
  children: React.ReactNode
}

/**
 * Button component with multiple variants, sizes, and accessibility features.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 *
 * <Button variant="outline" leftIcon={<Icon />}>
 *   With icon
 * </Button>
 *
 * <Button isLoading loadingText="Saving...">
 *   Save
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      isLoading = false,
      loadingText,
      disabled = false,
      children,
      className = '',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const classNames = [
      'ds-button',
      `ds-button--${variant}`,
      `ds-button--${size}`,
      fullWidth && 'ds-button--full-width',
      isLoading && 'ds-button--loading',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        type={type}
        className={classNames}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <span className="ds-button__spinner" aria-hidden="true">
            <svg className="ds-button__spinner-icon" viewBox="0 0 24 24">
              <circle
                className="ds-button__spinner-track"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="3"
              />
              <circle
                className="ds-button__spinner-path"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="3"
                strokeDasharray="60"
                strokeDashoffset="15"
                strokeLinecap="round"
              />
            </svg>
          </span>
        )}

        {!isLoading && leftIcon && (
          <span className="ds-button__icon ds-button__icon--left" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        <span className="ds-button__content">
          {isLoading && loadingText ? loadingText : children}
        </span>

        {!isLoading && rightIcon && (
          <span className="ds-button__icon ds-button__icon--right" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'
