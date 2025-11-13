/**
 * Security Headers Middleware
 * Implements comprehensive security headers (NFR-004)
 *
 * Headers:
 * - Content-Security-Policy (CSP)
 * - Strict-Transport-Security (HSTS)
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 */

import { Request, Response, NextFunction } from 'express'

export interface SecurityHeadersConfig {
  csp?: {
    directives?: Record<string, string[]>
    reportOnly?: boolean
    reportUri?: string
  }
  hsts?: {
    maxAge?: number
    includeSubDomains?: boolean
    preload?: boolean
  }
  enableNonce?: boolean
}

/**
 * Default CSP directives (strict but functional)
 */
const DEFAULT_CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'strict-dynamic'",
    // Allow inline scripts with nonce
  ],
  'style-src': ["'self'", "'unsafe-inline'"], // unsafe-inline needed for some CSS-in-JS
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    'wss:', // WebSocket for WebRTC signaling
    'https:', // API calls
  ],
  'media-src': ["'self'", 'blob:', 'mediastream:'], // For WebRTC media
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"], // Prevent clickjacking
  'upgrade-insecure-requests': [],
  'block-all-mixed-content': [],
}

/**
 * Generate CSP nonce for inline scripts
 */
function generateNonce(): string {
  return Buffer.from(Math.random().toString(36).substring(2)).toString('base64')
}

/**
 * Build CSP header value from directives
 */
function buildCSPHeader(
  directives: Record<string, string[]>,
  nonce?: string,
): string {
  const policies: string[] = []

  Object.entries(directives).forEach(([directive, sources]) => {
    if (sources.length === 0) {
      policies.push(directive)
    } else {
      // Add nonce to script-src if provided
      const sourcesWithNonce =
        directive === 'script-src' && nonce
          ? [...sources, `'nonce-${nonce}'`]
          : sources

      policies.push(`${directive} ${sourcesWithNonce.join(' ')}`)
    }
  })

  return policies.join('; ')
}

/**
 * Security Headers Middleware
 */
export function securityHeaders(config: SecurityHeadersConfig = {}) {
  const {
    csp = {},
    hsts = {},
    enableNonce = true,
  } = config

  const {
    directives = DEFAULT_CSP_DIRECTIVES,
    reportOnly = false,
    reportUri,
  } = csp

  const {
    maxAge = 31536000, // 1 year
    includeSubDomains = true,
    preload = true,
  } = hsts

  return (req: Request, res: Response, next: NextFunction) => {
    // Generate nonce for CSP if enabled
    const nonce = enableNonce ? generateNonce() : undefined
    if (nonce) {
      res.locals.cspNonce = nonce
    }

    // Content-Security-Policy
    const cspDirectives = { ...directives }
    if (reportUri) {
      cspDirectives['report-uri'] = [reportUri]
      cspDirectives['report-to'] = ['csp-endpoint']
    }

    const cspHeader = buildCSPHeader(cspDirectives, nonce)
    const cspHeaderName = reportOnly
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy'
    res.setHeader(cspHeaderName, cspHeader)

    // Strict-Transport-Security (HSTS)
    let hstsValue = `max-age=${maxAge}`
    if (includeSubDomains) hstsValue += '; includeSubDomains'
    if (preload) hstsValue += '; preload'
    res.setHeader('Strict-Transport-Security', hstsValue)

    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY')

    // X-XSS-Protection (legacy, but still useful)
    res.setHeader('X-XSS-Protection', '1; mode=block')

    // Referrer-Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Permissions-Policy (formerly Feature-Policy)
    const permissionsPolicy = [
      'camera=(self)', // Allow camera for WebRTC
      'microphone=(self)', // Allow microphone for WebRTC
      'geolocation=()', // Deny geolocation
      'payment=()', // Deny payment
      'usb=()', // Deny USB
      'magnetometer=()', // Deny magnetometer
      'accelerometer=()', // Deny accelerometer
      'gyroscope=()', // Deny gyroscope
    ].join(', ')
    res.setHeader('Permissions-Policy', permissionsPolicy)

    // X-Permitted-Cross-Domain-Policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')

    // X-DNS-Prefetch-Control
    res.setHeader('X-DNS-Prefetch-Control', 'off')

    // X-Download-Options
    res.setHeader('X-Download-Options', 'noopen')

    // Remove X-Powered-By header (don't reveal tech stack)
    res.removeHeader('X-Powered-By')

    next()
  }
}

/**
 * Development-friendly CSP configuration
 */
export const developmentCSP: SecurityHeadersConfig = {
  csp: {
    directives: {
      ...DEFAULT_CSP_DIRECTIVES,
      'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"], // For HMR
      'style-src': ["'self'", "'unsafe-inline'"],
      'connect-src': ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
    },
    reportOnly: true, // Don't block in development
  },
  hsts: {
    maxAge: 0, // Don't enforce HSTS in development
  },
}

/**
 * Production CSP configuration
 */
export const productionCSP: SecurityHeadersConfig = {
  csp: {
    directives: DEFAULT_CSP_DIRECTIVES,
    reportOnly: false,
    reportUri: '/api/csp-report', // Endpoint to receive CSP violation reports
  },
  hsts: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },
  enableNonce: true,
}

/**
 * CSP Report endpoint handler
 */
export function cspReportHandler(req: Request, res: Response) {
  const report = req.body

  // Log CSP violations
  console.error('CSP Violation:', JSON.stringify(report, null, 2))

  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (ELK, Sentry, etc.)
    // logger.error('CSP Violation', { report })
  }

  res.status(204).send()
}

/**
 * Security headers for static files
 */
export function staticFileHeaders(req: Request, res: Response, next: NextFunction) {
  // Cache static assets for 1 year
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  }

  // Prevent caching of HTML files
  if (req.path.match(/\.html$/)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }

  next()
}
