/**
 * API Interceptor
 *
 * Adds correlation IDs to all API requests and tracks performance metrics.
 */

import { logger } from '../services/loggerService'
import { performanceMonitoring } from '../services/performanceMonitoringService'

export interface RequestConfig {
  method: string
  url: string
  headers?: Record<string, string>
  body?: unknown
}

export interface InterceptedResponse {
  ok: boolean
  status: number
  statusText: string
  headers: Headers
  data?: unknown
  error?: Error
  duration: number
  correlationId: string
}

/**
 * Create intercepted fetch with correlation IDs and monitoring
 */
export function createInterceptedFetch(): typeof fetch {
  const originalFetch = window.fetch

  return async function interceptedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    // Start correlation context
    const context = logger.startContext()
    const startTime = performance.now()

    // Get URL
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    // Add correlation ID to headers
    const headers = new Headers(init?.headers)
    headers.set('X-Correlation-ID', context.correlationId)
    headers.set('X-Session-ID', context.sessionId)
    if (context.userId) {
      headers.set('X-User-ID', context.userId)
    }

    const method = init?.method || 'GET'

    logger.debug(`API Request: ${method} ${url}`, {
      correlationId: context.correlationId,
    })

    try {
      // Make request with modified headers
      const response = await originalFetch(input, {
        ...init,
        headers,
      })

      const duration = performance.now() - startTime

      // Log response
      logger.logApiRequest(method, url, duration, response.status)

      // Record performance metric
      performanceMonitoring.recordApiCall(
        url,
        method,
        response.status,
        duration,
        context.correlationId,
        response.ok ? undefined : response.statusText,
      )

      // End correlation context
      logger.endContext()

      return response
    } catch (error) {
      const duration = performance.now() - startTime

      // Log error
      logger.error(`API Request failed: ${method} ${url}`, error as Error, {
        duration,
        correlationId: context.correlationId,
      })

      // Record error metric
      performanceMonitoring.recordApiCall(
        url,
        method,
        0,
        duration,
        context.correlationId,
        (error as Error).message,
      )

      // End correlation context
      logger.endContext()

      throw error
    }
  }
}

/**
 * Install fetch interceptor
 */
export function installApiInterceptor(): void {
  if (typeof window !== 'undefined') {
    window.fetch = createInterceptedFetch()
    logger.info('API interceptor installed')
  }
}

/**
 * Create typed API client with automatic correlation
 */
export async function apiRequest(
  url: string,
  config: RequestConfig = { method: 'GET', url },
): Promise<InterceptedResponse> {
  const startTime = performance.now()
  const context = logger.startContext()

  try {
    const response = await fetch(url, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': context.correlationId,
        'X-Session-ID': context.sessionId,
        ...config.headers,
      },
      body: config.body ? JSON.stringify(config.body) : undefined,
    })

    const duration = performance.now() - startTime
    let data: unknown = null

    if (response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await response.json()
      }
    }

    const result: InterceptedResponse = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data,
      duration,
      correlationId: context.correlationId,
    }

    logger.endContext()

    return result
  } catch (error) {
    const duration = performance.now() - startTime

    const result: InterceptedResponse = {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      headers: new Headers(),
      error: error as Error,
      duration,
      correlationId: context.correlationId,
    }

    logger.endContext()

    return result
  }
}

/**
 * Typed API methods
 */
export const api = {
  get: (url: string, headers?: Record<string, string>) =>
    apiRequest(url, { method: 'GET', url, headers }),

  post: (url: string, body?: unknown, headers?: Record<string, string>) =>
    apiRequest(url, { method: 'POST', url, body, headers }),

  put: (url: string, body?: unknown, headers?: Record<string, string>) =>
    apiRequest(url, { method: 'PUT', url, body, headers }),

  delete: (url: string, headers?: Record<string, string>) =>
    apiRequest(url, { method: 'DELETE', url, headers }),

  patch: (url: string, body?: unknown, headers?: Record<string, string>) =>
    apiRequest(url, { method: 'PATCH', url, body, headers }),
}
