/**
 * Form Validation Utilities
 */

import { FormErrors, ValidationRule, ValidationRules } from '../types/auth'

/**
 * Email validation regex (RFC 5322 simplified)
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Strong password regex:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

/**
 * Username regex:
 * - 3-20 characters
 * - Only letters, numbers, underscores, hyphens
 * - Must start with a letter
 */
export const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/

/**
 * Validate a single field based on rules
 */
export function validateField(
  name: string,
  value: unknown,
  rule: ValidationRule,
  allValues?: Record<string, unknown>,
): string | undefined {
  // Required check
  if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return `${formatFieldName(name)} is required`
  }

  // Skip other validations if field is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return undefined
  }

  // Min length check
  if (rule.minLength && value.length < rule.minLength) {
    return `${formatFieldName(name)} must be at least ${rule.minLength} characters`
  }

  // Max length check
  if (rule.maxLength && value.length > rule.maxLength) {
    return `${formatFieldName(name)} must be at most ${rule.maxLength} characters`
  }

  // Pattern check
  if (rule.pattern && !rule.pattern.test(value)) {
    return getPatternErrorMessage(name, rule.pattern)
  }

  // Match check (for password confirmation)
  if (rule.match && allValues && value !== allValues[rule.match]) {
    return `${formatFieldName(name)} must match ${formatFieldName(rule.match)}`
  }

  // Custom validation
  if (rule.custom) {
    return rule.custom(value)
  }

  return undefined
}

/**
 * Validate all fields based on rules
 */
export function validateForm(values: Record<string, unknown>, rules: ValidationRules): FormErrors {
  const errors: FormErrors = {}

  Object.keys(rules).forEach(fieldName => {
    const error = validateField(fieldName, values[fieldName], rules[fieldName], values)
    if (error) {
      errors[fieldName] = error
    }
  })

  return errors
}

/**
 * Check if form has any errors
 */
export function hasErrors(errors: FormErrors): boolean {
  return Object.values(errors).some(error => error !== undefined)
}

/**
 * Format field name for error messages
 */
function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

/**
 * Get error message for pattern validation
 */
function getPatternErrorMessage(name: string, pattern: RegExp): string {
  if (pattern === EMAIL_REGEX) {
    return 'Please enter a valid email address'
  }

  if (pattern === STRONG_PASSWORD_REGEX) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
  }

  if (pattern === USERNAME_REGEX) {
    return 'Username must be 3-20 characters, start with a letter, and contain only letters, numbers, underscores, or hyphens'
  }

  return `${formatFieldName(name)} is invalid`
}

/**
 * Predefined validation rules for common fields
 */
export const commonValidationRules = {
  email: {
    required: true,
    pattern: EMAIL_REGEX,
  },
  password: {
    required: true,
    minLength: 8,
    pattern: STRONG_PASSWORD_REGEX,
  },
  confirmPassword: {
    required: true,
    match: 'password',
  },
  username: {
    required: true,
    pattern: USERNAME_REGEX,
  },
  firstName: {
    required: false,
    minLength: 2,
    maxLength: 50,
  },
  lastName: {
    required: false,
    minLength: 2,
    maxLength: 50,
  },
  code: {
    required: true,
    minLength: 6,
    maxLength: 6,
    pattern: /^\d{6}$/,
  },
}

/**
 * Password strength checker
 */
export function getPasswordStrength(password: string): {
  score: number // 0-4
  label: 'weak' | 'fair' | 'good' | 'strong'
  color: string
} {
  let score = 0

  if (!password) {
    return { score: 0, label: 'weak', color: 'var(--color-gray-400)' }
  }

  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[@$!%*?&#]/.test(password)) score++

  // Cap at 4
  score = Math.min(score, 4)

  const strengthMap = {
    0: { label: 'weak' as const, color: 'var(--color-red-500)' },
    1: { label: 'weak' as const, color: 'var(--color-red-500)' },
    2: { label: 'fair' as const, color: 'var(--color-yellow-500)' },
    3: { label: 'good' as const, color: 'var(--color-blue-500)' },
    4: { label: 'strong' as const, color: 'var(--color-green-500)' },
  }

  return { score, ...strengthMap[score as keyof typeof strengthMap] }
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .slice(0, 1000) // Limit length
}
