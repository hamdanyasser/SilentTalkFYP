/**
 * Input Validation and Sanitization Middleware
 * Prevents SQL Injection, XSS, and other injection attacks (NFR-004)
 *
 * Features:
 * - Input sanitization
 * - SQL injection prevention
 * - XSS prevention
 * - Schema validation
 * - Custom validators
 */

import { Request, Response, NextFunction } from 'express'
import validator from 'validator'

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return input
  }

  // Remove HTML tags
  let sanitized = validator.stripLow(input)

  // Escape HTML special characters
  sanitized = validator.escape(sanitized)

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

/**
 * Sanitize SQL input to prevent injection
 */
export function sanitizeSQL(input: string): string {
  if (typeof input !== 'string') {
    return input
  }

  // Remove SQL dangerous characters
  return input
    .replace(/[';--]/g, '') // Remove SQL comment markers
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, '') // Remove SQL keywords
    .trim()
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  return validator.isEmail(email, {
    allow_display_name: false,
    require_tld: true,
    allow_utf8_local_part: false,
  })
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common passwords
  const commonPasswords = [
    'password',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
  ]
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate URL
 */
export function isValidURL(url: string): boolean {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
  })
}

/**
 * Validate UUID
 */
export function isValidUUID(uuid: string): boolean {
  return validator.isUUID(uuid)
}

/**
 * Validate MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

/**
 * Validate phone number
 */
export function isValidPhone(phone: string): boolean {
  return validator.isMobilePhone(phone, 'any', { strictMode: false })
}

/**
 * Validate date
 */
export function isValidDate(date: string): boolean {
  return validator.isISO8601(date, { strict: true })
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {}
    Object.keys(obj).forEach(key => {
      sanitized[key] = sanitizeObject(obj[key])
    })
    return sanitized
  }

  return obj
}

/**
 * Request sanitization middleware
 */
export function sanitizeRequest(req: Request, res: Response, next: NextFunction) {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body)
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query)
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params)
  }

  next()
}

/**
 * Validation schema type
 */
export interface ValidationSchema {
  [field: string]: {
    type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'date' | 'phone'
    required?: boolean
    min?: number
    max?: number
    pattern?: RegExp
    custom?: (value: any) => boolean | string
    sanitize?: boolean
  }
}

/**
 * Validate request against schema
 */
export function validateSchema(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string[]> = {}

    Object.entries(schema).forEach(([field, rules]) => {
      const value = req.body[field]
      const fieldErrors: string[] = []

      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(`${field} is required`)
      }

      // Skip further validation if not required and empty
      if (!rules.required && !value) {
        return
      }

      // Type validation
      if (rules.type) {
        switch (rules.type) {
          case 'string':
            if (typeof value !== 'string') {
              fieldErrors.push(`${field} must be a string`)
            }
            break
          case 'number':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              fieldErrors.push(`${field} must be a number`)
            }
            break
          case 'boolean':
            if (typeof value !== 'boolean') {
              fieldErrors.push(`${field} must be a boolean`)
            }
            break
          case 'email':
            if (!isValidEmail(value)) {
              fieldErrors.push(`${field} must be a valid email address`)
            }
            break
          case 'url':
            if (!isValidURL(value)) {
              fieldErrors.push(`${field} must be a valid URL`)
            }
            break
          case 'uuid':
            if (!isValidUUID(value)) {
              fieldErrors.push(`${field} must be a valid UUID`)
            }
            break
          case 'date':
            if (!isValidDate(value)) {
              fieldErrors.push(`${field} must be a valid ISO 8601 date`)
            }
            break
          case 'phone':
            if (!isValidPhone(value)) {
              fieldErrors.push(`${field} must be a valid phone number`)
            }
            break
        }
      }

      // Length validation
      if (rules.min !== undefined && typeof value === 'string' && value.length < rules.min) {
        fieldErrors.push(`${field} must be at least ${rules.min} characters`)
      }

      if (rules.max !== undefined && typeof value === 'string' && value.length > rules.max) {
        fieldErrors.push(`${field} must be at most ${rules.max} characters`)
      }

      // Numeric range validation
      if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        fieldErrors.push(`${field} must be at least ${rules.min}`)
      }

      if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        fieldErrors.push(`${field} must be at most ${rules.max}`)
      }

      // Pattern validation
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        fieldErrors.push(`${field} has invalid format`)
      }

      // Custom validation
      if (rules.custom) {
        const result = rules.custom(value)
        if (typeof result === 'string') {
          fieldErrors.push(result)
        } else if (!result) {
          fieldErrors.push(`${field} is invalid`)
        }
      }

      // Sanitization
      if (rules.sanitize && typeof value === 'string') {
        req.body[field] = sanitizeString(value)
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors
      }
    })

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        errors,
      })
    }

    next()
  }
}

/**
 * Common validation schemas
 */

// User registration schema
export const registerSchema: ValidationSchema = {
  email: {
    type: 'email',
    required: true,
    sanitize: true,
  },
  password: {
    type: 'string',
    required: true,
    min: 8,
    max: 128,
    custom: value => {
      const result = isStrongPassword(value)
      return result.valid ? true : result.errors.join(', ')
    },
  },
  username: {
    type: 'string',
    required: true,
    min: 3,
    max: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    sanitize: true,
  },
  firstName: {
    type: 'string',
    required: true,
    min: 1,
    max: 50,
    sanitize: true,
  },
  lastName: {
    type: 'string',
    required: true,
    min: 1,
    max: 50,
    sanitize: true,
  },
}

// Login schema
export const loginSchema: ValidationSchema = {
  email: {
    type: 'email',
    required: true,
    sanitize: true,
  },
  password: {
    type: 'string',
    required: true,
  },
}

// Post creation schema
export const createPostSchema: ValidationSchema = {
  title: {
    type: 'string',
    required: true,
    min: 5,
    max: 200,
    sanitize: true,
  },
  content: {
    type: 'string',
    required: true,
    min: 10,
    max: 10000,
    sanitize: true,
  },
  category: {
    type: 'string',
    required: false,
    sanitize: true,
  },
}

// Booking creation schema
export const createBookingSchema: ValidationSchema = {
  interpreterId: {
    type: 'uuid',
    required: true,
  },
  startTime: {
    type: 'date',
    required: true,
  },
  endTime: {
    type: 'date',
    required: true,
  },
  type: {
    type: 'string',
    required: true,
    custom: value => ['video', 'in-person'].includes(value),
  },
}

/**
 * SQL Injection detection middleware
 */
export function detectSQLInjection(req: Request, res: Response, next: NextFunction) {
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b|--|;|\/\*|\*\/|xp_|sp_)/gi

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlPattern.test(value)
    }
    if (Array.isArray(value)) {
      return value.some(checkValue)
    }
    if (value !== null && typeof value === 'object') {
      return Object.values(value).some(checkValue)
    }
    return false
  }

  // Check body
  if (req.body && checkValue(req.body)) {
    console.error('SQL Injection attempt detected:', req.body)
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Potential SQL injection detected',
    })
  }

  // Check query parameters
  if (req.query && checkValue(req.query)) {
    console.error('SQL Injection attempt detected in query:', req.query)
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Potential SQL injection detected',
    })
  }

  next()
}

/**
 * XSS detection middleware
 */
export function detectXSS(req: Request, res: Response, next: NextFunction) {
  const xssPattern = /<script|javascript:|onerror=|onload=|<iframe|<object|<embed/gi

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return xssPattern.test(value)
    }
    if (Array.isArray(value)) {
      return value.some(checkValue)
    }
    if (value !== null && typeof value === 'object') {
      return Object.values(value).some(checkValue)
    }
    return false
  }

  if ((req.body && checkValue(req.body)) || (req.query && checkValue(req.query))) {
    console.error('XSS attempt detected:', { body: req.body, query: req.query })
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Potential XSS attack detected',
    })
  }

  next()
}
