/**
 * Logger Service
 *
 * Client-side logging with correlation IDs, batching, and remote shipping.
 * Integrates with server-side ELK stack.
 */

import { LogEntry, LogLevel, LoggerConfig, CorrelationContext } from '../types/monitoring'

const DEFAULT_CONFIG: LoggerConfig = {
  level: 'info',
  enableConsole: true,
  enableRemote: true,
  remoteEndpoint: '/api/logs',
  includeStackTrace: true,
  maxBatchSize: 50,
  flushInterval: 5000,
}

class LoggerService {
  private config: LoggerConfig
  private logBuffer: LogEntry[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private correlationStack: CorrelationContext[] = []

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startFlushTimer()
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get current correlation context
   */
  getCurrentContext(): CorrelationContext | undefined {
    return this.correlationStack[this.correlationStack.length - 1]
  }

  /**
   * Start a new correlation context
   */
  startContext(metadata?: Record<string, unknown>): CorrelationContext {
    const parent = this.getCurrentContext()
    const context: CorrelationContext = {
      correlationId: this.generateCorrelationId(),
      parentId: parent?.correlationId,
      userId: parent?.userId,
      sessionId: parent?.sessionId || this.generateCorrelationId(),
      startTime: new Date(),
      metadata,
    }
    this.correlationStack.push(context)
    return context
  }

  /**
   * End current correlation context
   */
  endContext(): void {
    this.correlationStack.pop()
  }

  /**
   * Set user context
   */
  setUser(userId: string): void {
    const context = this.getCurrentContext()
    if (context) {
      context.userId = userId
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal']
    const configLevel = levels.indexOf(this.config.level)
    const messageLevel = levels.indexOf(level)
    return messageLevel >= configLevel
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error,
  ): LogEntry {
    const context = this.getCurrentContext()

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      correlationId: context?.correlationId,
      userId: context?.userId,
      sessionId: context?.sessionId,
      data,
      error,
    }

    if (error && this.config.includeStackTrace) {
      entry.stack = error.stack
    }

    return entry
  }

  /**
   * Log to console
   */
  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return

    const prefix = `[${entry.level.toUpperCase()}] [${entry.timestamp.toISOString()}]`
    const correlationInfo = entry.correlationId ? `[${entry.correlationId}]` : ''
    const fullMessage = `${prefix} ${correlationInfo} ${entry.message}`

    switch (entry.level) {
      case 'debug':
        console.debug(fullMessage, entry.data || '')
        break
      case 'info':
        console.info(fullMessage, entry.data || '')
        break
      case 'warn':
        console.warn(fullMessage, entry.data || '')
        break
      case 'error':
      case 'fatal':
        console.error(fullMessage, entry.error || entry.data || '')
        if (entry.stack) {
          console.error(entry.stack)
        }
        break
    }
  }

  /**
   * Add log to buffer for remote shipping
   */
  private addToBuffer(entry: LogEntry): void {
    if (!this.config.enableRemote) return

    this.logBuffer.push(entry)

    if (this.logBuffer.length >= this.config.maxBatchSize) {
      this.flush()
    }
  }

  /**
   * Flush logs to remote endpoint
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.config.enableRemote) return

    const logs = [...this.logBuffer]
    this.logBuffer = []

    try {
      await fetch(this.config.remoteEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs,
          source: 'client',
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      // If remote logging fails, log to console
      console.error('Failed to ship logs to remote endpoint:', error)
      // Put logs back in buffer
      this.logBuffer.unshift(...logs)
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }

  /**
   * Log message
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, message, data, error)
    this.logToConsole(entry)
    this.addToBuffer(entry)
  }

  /**
   * Debug level log
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data)
  }

  /**
   * Info level log
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data)
  }

  /**
   * Warning level log
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data)
  }

  /**
   * Error level log
   */
  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('error', message, data, error)
  }

  /**
   * Fatal level log
   */
  fatal(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('fatal', message, data, error)
  }

  /**
   * Log API request
   */
  logApiRequest(
    method: string,
    endpoint: string,
    duration: number,
    statusCode: number,
    error?: Error,
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    this.log(level, `API ${method} ${endpoint}`, {
      method,
      endpoint,
      duration,
      statusCode,
      error: error?.message,
    })
  }

  /**
   * Log SignalR event
   */
  logSignalREvent(eventName: string, data?: Record<string, unknown>): void {
    this.info(`SignalR event: ${eventName}`, data)
  }

  /**
   * Log performance metric
   */
  logPerformance(metric: string, value: number, unit: string): void {
    this.debug(`Performance: ${metric}`, { value, unit })
  }

  /**
   * Shutdown logger
   */
  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush()
  }
}

// Export singleton instance
export const logger = new LoggerService()

// Export class for custom instances
export default LoggerService
