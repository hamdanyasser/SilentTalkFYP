/**
 * Health Check Service
 *
 * Monitors backend service health with periodic checks and status tracking.
 */

import { HealthCheckStatus, SystemHealth, HealthCheckConfig } from '../types/monitoring'
import { logger } from './loggerService'

const DEFAULT_CONFIG: HealthCheckConfig = {
  endpoints: ['/api/health', '/api/health/db', '/api/health/signalr', '/api/health/ml-service'],
  interval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
  retryCount: 3,
}

class HealthCheckService {
  private config: HealthCheckConfig
  private healthStatuses: Map<string, HealthCheckStatus> = new Map()
  private checkTimer: NodeJS.Timeout | null = null
  private startTime: Date = new Date()
  private isRunning = false

  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Start health monitoring
   */
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.runChecks()

    this.checkTimer = setInterval(() => {
      this.runChecks()
    }, this.config.interval)

    logger.info('Health check monitoring started')
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
    }
    this.isRunning = false
    logger.info('Health check monitoring stopped')
  }

  /**
   * Run all health checks
   */
  private async runChecks(): Promise<void> {
    const checks = this.config.endpoints.map(endpoint => this.checkEndpoint(endpoint))
    await Promise.all(checks)
  }

  /**
   * Check single endpoint
   */
  private async checkEndpoint(endpoint: string): Promise<void> {
    const serviceName = this.getServiceName(endpoint)
    let attempt = 0

    while (attempt < this.config.retryCount) {
      try {
        const startTime = Date.now()
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

        const response = await fetch(endpoint, {
          method: 'GET',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime

        if (response.ok) {
          const data = await response.json()
          this.updateStatus(serviceName, {
            service: serviceName,
            status: data.status || 'healthy',
            message: data.message,
            responseTime,
            timestamp: new Date(),
            details: data.details,
          })
          return
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        attempt++

        if (attempt >= this.config.retryCount) {
          this.updateStatus(serviceName, {
            service: serviceName,
            status: 'unhealthy',
            message: error instanceof Error ? error.message : 'Health check failed',
            timestamp: new Date(),
          })

          logger.error(`Health check failed for ${serviceName}`, error as Error, {
            endpoint,
            attempts: attempt,
          })
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
  }

  /**
   * Get service name from endpoint
   */
  private getServiceName(endpoint: string): string {
    const parts = endpoint.split('/')
    return parts[parts.length - 1] || 'api'
  }

  /**
   * Update health status
   */
  private updateStatus(service: string, status: HealthCheckStatus): void {
    const previous = this.healthStatuses.get(service)

    // Log status changes
    if (previous && previous.status !== status.status) {
      logger.warn(`Service ${service} status changed`, {
        from: previous.status,
        to: status.status,
        message: status.message,
      })
    }

    this.healthStatuses.set(service, status)
  }

  /**
   * Get status for specific service
   */
  getServiceStatus(service: string): HealthCheckStatus | undefined {
    return this.healthStatuses.get(service)
  }

  /**
   * Get all service statuses
   */
  getAllStatuses(): HealthCheckStatus[] {
    return Array.from(this.healthStatuses.values())
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): SystemHealth {
    const checks = this.getAllStatuses()

    // Determine overall status
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length
    const degradedCount = checks.filter(c => c.status === 'degraded').length

    if (unhealthyCount > 0) {
      overall = unhealthyCount === checks.length ? 'unhealthy' : 'degraded'
    } else if (degradedCount > 0) {
      overall = 'degraded'
    }

    const uptime = (Date.now() - this.startTime.getTime()) / 1000

    return {
      overall,
      checks,
      timestamp: new Date(),
      uptime,
      version: process.env.REACT_APP_VERSION || '1.0.0',
    }
  }

  /**
   * Check if system is healthy
   */
  isHealthy(): boolean {
    return this.getSystemHealth().overall === 'healthy'
  }

  /**
   * Get uptime in seconds
   */
  getUptime(): number {
    return (Date.now() - this.startTime.getTime()) / 1000
  }
}

// Export singleton instance
export const healthCheck = new HealthCheckService()

// Export class for custom instances
export default HealthCheckService
