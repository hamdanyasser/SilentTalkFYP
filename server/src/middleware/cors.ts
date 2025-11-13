/**
 * CORS Configuration Middleware
 * Secure Cross-Origin Resource Sharing (NFR-004)
 *
 * Features:
 * - Whitelist-based origin validation
 * - Credentials support for authenticated requests
 * - Preflight request handling
 * - Dynamic origin validation
 * - Method and header restrictions
 */

import { Request, Response, NextFunction } from 'express'

export interface CorsConfig {
  allowedOrigins?: string[] | ((origin: string) => boolean)
  allowedMethods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

/**
 * Default allowed origins based on environment
 */
function getDefaultAllowedOrigins(): string[] {
  const env = process.env.NODE_ENV || 'development'

  if (env === 'production') {
    return [
      'https://silenttalk.com',
      'https://www.silenttalk.com',
      'https://app.silenttalk.com',
    ]
  }

  if (env === 'staging') {
    return [
      'https://staging.silenttalk.com',
      'https://test.silenttalk.com',
    ]
  }

  // Development
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ]
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[] | ((origin: string) => boolean),
): boolean {
  if (!origin) {
    return false // Reject requests without origin header
  }

  if (typeof allowedOrigins === 'function') {
    return allowedOrigins(origin)
  }

  return allowedOrigins.includes(origin)
}

/**
 * CORS Middleware
 */
export function cors(config: CorsConfig = {}) {
  const {
    allowedOrigins = getDefaultAllowedOrigins(),
    allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders = [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Correlation-ID',
      'X-Session-ID',
      'X-User-ID',
    ],
    exposedHeaders = [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Correlation-ID',
    ],
    credentials = true,
    maxAge = 86400, // 24 hours
    preflightContinue = false,
    optionsSuccessStatus = 204,
  } = config

  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin

    // Check if origin is allowed
    if (origin && isOriginAllowed(origin, allowedOrigins)) {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', origin)

      if (credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true')
      }

      if (exposedHeaders.length > 0) {
        res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '))
      }

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '))
        res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '))
        res.setHeader('Access-Control-Max-Age', maxAge.toString())

        if (!preflightContinue) {
          return res.status(optionsSuccessStatus).send()
        }
      }
    } else if (origin) {
      // Origin not allowed
      console.warn(`CORS: Rejected origin: ${origin}`)
      return res.status(403).json({
        error: 'CORS policy violation',
        message: 'Origin not allowed',
      })
    }

    next()
  }
}

/**
 * Strict CORS for production
 * Only allows explicitly whitelisted origins
 */
export const strictCors = cors({
  allowedOrigins: getDefaultAllowedOrigins(),
  credentials: true,
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Correlation-ID',
    'X-Session-ID',
  ],
})

/**
 * Permissive CORS for development
 * Allows all localhost origins
 */
export const developmentCors = cors({
  allowedOrigins: (origin: string) => {
    return (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.startsWith('https://localhost:') ||
      origin.startsWith('https://127.0.0.1:')
    )
  },
  credentials: true,
})

/**
 * Public API CORS
 * For public endpoints that don't require credentials
 */
export const publicCors = cors({
  allowedOrigins: () => true, // Allow all origins
  credentials: false,
  allowedMethods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
})

/**
 * WebSocket CORS
 * For WebSocket connections
 */
export const wsCors = cors({
  allowedOrigins: getDefaultAllowedOrigins(),
  credentials: true,
  allowedMethods: ['GET'],
  allowedHeaders: ['Upgrade', 'Connection', 'Sec-WebSocket-Key', 'Sec-WebSocket-Version'],
})

/**
 * Dynamic origin validator
 * Validates origin against database or external service
 */
export async function validateOriginFromDatabase(origin: string): Promise<boolean> {
  // In production, check against database of allowed origins
  // For now, use static whitelist
  const allowedOrigins = getDefaultAllowedOrigins()
  return allowedOrigins.includes(origin)
}

/**
 * CORS middleware with origin validation from database
 */
export function dynamicCors() {
  return cors({
    allowedOrigins: async (origin: string) => {
      return await validateOriginFromDatabase(origin)
    },
    credentials: true,
  })
}

/**
 * Subdomain CORS
 * Allows all subdomains of a base domain
 */
export function subdomainCors(baseDomain: string) {
  return cors({
    allowedOrigins: (origin: string) => {
      try {
        const url = new URL(origin)
        return (
          url.hostname === baseDomain ||
          url.hostname.endsWith(`.${baseDomain}`)
        )
      } catch {
        return false
      }
    },
    credentials: true,
  })
}

/**
 * CORS configuration factory
 * Creates CORS middleware based on environment
 */
export function createCorsMiddleware(): ReturnType<typeof cors> {
  const env = process.env.NODE_ENV || 'development'

  if (env === 'production') {
    return strictCors
  }

  if (env === 'staging' || env === 'test') {
    return cors({
      allowedOrigins: getDefaultAllowedOrigins(),
      credentials: true,
    })
  }

  return developmentCors
}

/**
 * CORS error handler
 * Provides detailed CORS error messages in development
 */
export function corsErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err.message && err.message.includes('CORS')) {
    const origin = req.headers.origin
    const env = process.env.NODE_ENV || 'development'

    if (env === 'development') {
      return res.status(403).json({
        error: 'CORS Error',
        message: err.message,
        origin,
        allowedOrigins: getDefaultAllowedOrigins(),
        hint: 'Add your origin to the allowedOrigins array in CORS configuration',
      })
    }

    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Origin not allowed',
    })
  }

  next(err)
}
