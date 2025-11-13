import React, { forwardRef, SelectHTMLAttributes } from 'react'
import './Select.css'

export type SelectSize = 'sm' | 'md' | 'lg'
export type SelectVariant = 'default' | 'filled' | 'flushed'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Size of the select
   * @default 'md'
   */
  size?: SelectSize

  /**
   * Visual variant of the select
   * @default 'default'
   */
  variant?: SelectVariant

  /**
   * Icon to display before the select
   */
  leftIcon?: React.ReactNode

  /**
   * Whether the select has an error
   * @default false
   */
  hasError?: boolean

  /**
   * Whether the select is in a success state
   * @default false
   */
  hasSuccess?: boolean

  /**
   * Whether the select should take full width
   * @default false
   */
  fullWidth?: boolean

  /**
   * Options for the select (alternative to children)
   */
  options?: SelectOption[]

  /**
   * Placeholder option text
   */
  placeholder?: string
}

/**
 * Select component with multiple sizes, variants, and accessibility features.
 *
 * @example
 * ```tsx
 * <Select
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' },
 *   ]}
 *   placeholder="Select an option"
 *   aria-label="Choose option"
 * />
 *
 * <Select leftIcon={<Icon />}>
 *   <option value="1">Option 1</option>
 *   <option value="2">Option 2</option>
 * </Select>
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      variant = 'default',
      leftIcon,
      hasError = false,
      hasSuccess = false,
      fullWidth = false,
      options,
      placeholder,
      className = '',
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => {
    const wrapperClassNames = [
      'ds-select-wrapper',
      `ds-select-wrapper--${size}`,
      `ds-select-wrapper--${variant}`,
      hasError && 'ds-select-wrapper--error',
      hasSuccess && 'ds-select-wrapper--success',
      disabled && 'ds-select-wrapper--disabled',
      fullWidth && 'ds-select-wrapper--full-width',
      leftIcon && 'ds-select-wrapper--has-left-icon',
    ]
      .filter(Boolean)
      .join(' ')

    const selectClassNames = ['ds-select', className].filter(Boolean).join(' ')

    return (
      <div className={wrapperClassNames}>
        {leftIcon && (
          <span className="ds-select__icon ds-select__icon--left" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        <select
          ref={ref}
          className={selectClassNames}
          disabled={disabled}
          aria-disabled={disabled}
          aria-invalid={hasError}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {options
            ? options.map(option => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))
            : children}
        </select>

        {/* Chevron icon */}
        <span className="ds-select__chevron" aria-hidden="true">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    )
  },
)

Select.displayName = 'Select'
