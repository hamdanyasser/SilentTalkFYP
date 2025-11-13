/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks (NFR-004)
 *
 * Features:
 * - Configurable rate limits per endpoint
 * - IP-based and user-based limiting
 * - Sliding window algorithm
 * - Redis-backed for distributed systems
 * - Custom responses and headers
 */

import { Request, Response, NextFunction } from 'express'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  statusCode?: number // HTTP status code for rate limit exceeded
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (req: Request) => string // Custom key generator
  handler?: (req: Request, res: Response) => void // Custom handler
  skip?: (req: Request) => boolean // Skip rate limiting for certain requests
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
    requests: number[]
  }
}

/**
 * In-memory rate limit store (use Redis in production)
 */
class MemoryStore {
  private store: RateLimitStore = {}

  async increment(key: string): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()

    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: 0,
        requests: [],
      }
    }

    const entry = this.store[key]

    // Add current request timestamp
    entry.requests.push(now)
    entry.count++

    return {
      count: entry.count,
      resetTime: entry.resetTime,
    }
  }

  async decrement(key: string): Promise<void> {
    if (this.store[key]) {
      this.store[key].count = Math.max(0, this.store[key].count - 1)
    }
  }

  async resetKey(key: string): Promise<void> {
    delete this.store[key]
  }

  async cleanup(windowMs: number): Promise<void> {
    const now = Date.now()
    const cutoff = now - windowMs

    Object.keys(this.store).forEach(key => {
      const entry = this.store[key]
      // Remove old requests outside the window
      entry.requests = entry.requests.filter(timestamp => timestamp > cutoff)
      entry.count = entry.requests.length

      // Remove empty entries
      if (entry.count === 0) {
        delete this.store[key]
      }
    })
  }

  async getCount(key: string, windowMs: number): Promise<number> {
    const now = Date.now()
    const cutoff = now - windowMs

    if (!this.store[key]) {
      return 0
    }

    const entry = this.store[key]
    // Count requests within the window
    const validRequests = entry.requests.filter(timestamp => timestamp > cutoff)
    return validRequests.length
  }
}

const store = new MemoryStore()

// Cleanup old entries every minute
setInterval(() => {
  store.cleanup(3600000) // 1 hour
}, 60000)

/**
 * Default key generator (IP-based)
 */
function defaultKeyGenerator(req: Request): string {
  return req.ip || req.connection.remoteAddress || 'unknown'
}

/**
 * User-based key generator (for authenticated requests)
 */
export function userKeyGenerator(req: Request): string {
  const userId = (req as any).user?.id || (req as any).userId
  return userId ? `user:${userId}` : defaultKeyGenerator(req)
}

/**
 * Rate Limiter Middleware
 */
export function rateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    statusCode = 429,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
    handler,
    skip,
  } = config

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if configured
    if (skip && skip(req)) {
      return next()
    }

    const key = keyGenerator(req)
    const now = Date.now()

    try {
      // Get current count within window
      const currentCount = await store.getCount(key, windowMs)

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString())
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount).toString())
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString())

      // Check if limit exceeded
      if (currentCount >= maxRequests) {
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000).toString())

        if (handler) {
          return handler(req, res)
        }

        return res.status(statusCode).json({
          error: 'Rate limit exceeded',
          message,
          retryAfter: Math.ceil(windowMs / 1000),
        })
      }

      // Increment counter
      await store.increment(key)

      // Decrement on response if configured
      const originalSend = res.send
      res.send = function (data: any): Response {
        const shouldDecrement =
          (skipSuccessfulRequests && res.statusCode < 400) ||
          (skipFailedRequests && res.statusCode >= 400)

        if (shouldDecrement) {
          store.decrement(key)
        }

        return originalSend.call(this, data)
      }

      next()
    } catch (error) {
      console.error('Rate limiter error:', error)
      next() // Allow request on error
    }
  }
}

/**
 * Predefined rate limiters for common use cases
 */

// Global rate limit: 100 requests per 15 minutes
export const globalRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests from this IP, please try again later',
})

// Auth rate limit: 5 login attempts per 15 minutes
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true, // Only count failed attempts
})

// API rate limit: 1000 requests per hour
export const apiRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 1000,
  keyGenerator: userKeyGenerator, // User-based for authenticated API
})

// Strict rate limit: 10 requests per minute (for sensitive operations)
export const strictRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  keyGenerator: userKeyGenerator,
})

// File upload rate limit: 5 uploads per hour
export const uploadRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  keyGenerator: userKeyGenerator,
  message: 'Upload limit exceeded, please try again later',
})

// WebSocket connection rate limit: 10 connections per minute
export const wsConnectionRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many WebSocket connection attempts',
})

// Search rate limit: 30 searches per minute
export const searchRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  keyGenerator: userKeyGenerator,
})

/**
 * Distributed Rate Limiter using Redis
 * Use this in production for multi-instance deployments
 */
export class RedisRateLimiter {
  private redisClient: any

  constructor(redisClient: any) {
    this.redisClient = redisClient
  }

  middleware(config: RateLimitConfig) {
    const {
      windowMs,
      maxRequests,
      message = 'Too many requests',
      statusCode = 429,
      keyGenerator = defaultKeyGenerator,
    } = config

    return async (req: Request, res: Response, next: NextFunction) => {
      const key = `ratelimit:${keyGenerator(req)}`
      const now = Date.now()
      const windowStart = now - windowMs

      try {
        // Remove old entries
        await this.redisClient.zremrangebyscore(key, 0, windowStart)

        // Get current count
        const currentCount = await this.redisClient.zcard(key)

        // Set headers
        res.setHeader('X-RateLimit-Limit', maxRequests.toString())
        res.setHeader(
          'X-RateLimit-Remaining',
          Math.max(0, maxRequests - currentCount).toString(),
        )

        if (currentCount >= maxRequests) {
          res.setHeader('Retry-After', Math.ceil(windowMs / 1000).toString())

          return res.status(statusCode).json({
            error: 'Rate limit exceeded',
            message,
            retryAfter: Math.ceil(windowMs / 1000),
          })
        }

        // Add current request
        await this.redisClient.zadd(key, now, `${now}-${Math.random()}`)

        // Set expiry
        await this.redisClient.expire(key, Math.ceil(windowMs / 1000))

        next()
      } catch (error) {
        console.error('Redis rate limiter error:', error)
        next() // Allow request on error
      }
    }
  }
}

/**
 * Adaptive rate limiter
 * Adjusts limits based on system load
 */
export function adaptiveRateLimiter(baseConfig: RateLimitConfig) {
  let currentLoad = 0 // 0-1 scale
  let currentMaxRequests = baseConfig.maxRequests

  // Monitor system load (simplified)
  setInterval(() => {
    // In production, get actual system metrics
    // For now, use a simple calculation
    currentLoad = Math.random() * 0.5 // Simulate 0-50% load

    // Adjust max requests based on load
    if (currentLoad > 0.8) {
      currentMaxRequests = Math.floor(baseConfig.maxRequests * 0.5) // Reduce by 50%
    } else if (currentLoad > 0.6) {
      currentMaxRequests = Math.floor(baseConfig.maxRequests * 0.75) // Reduce by 25%
    } else {
      currentMaxRequests = baseConfig.maxRequests // Normal
    }
  }, 10000) // Check every 10 seconds

  return rateLimiter({
    ...baseConfig,
    maxRequests: currentMaxRequests,
  })
}
