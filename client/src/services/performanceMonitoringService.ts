/**
 * Performance Monitoring Service
 *
 * Tracks API performance, WebRTC metrics, and client-side performance.
 * Calculates p50, p95, p99 latencies and error rates.
 */

import {
  ApiMetric,
  WebRTCMetric,
  PerformanceMetric,
  PerformanceStats,
  PerformanceConfig,
} from '../types/monitoring'
import { logger } from './loggerService'

const DEFAULT_CONFIG: PerformanceConfig = {
  enableApiMonitoring: true,
  enableWebRTCMonitoring: true,
  enableResourceMonitoring: true,
  sampleRate: 1.0, // 100% sampling
}

class PerformanceMonitoringService {
  private config: PerformanceConfig
  private apiMetrics: ApiMetric[] = []
  private webrtcMetrics: WebRTCMetric[] = []
  private performanceMetrics: PerformanceMetric[] = []
  private maxMetricsStored = 1000

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeNavigationTiming()
  }

  /**
   * Initialize navigation timing
   */
  private initializeNavigationTiming(): void {
    if (!this.config.enableResourceMonitoring) return

    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.recordNavigationTiming()
        }, 0)
      })
    }
  }

  /**
   * Record navigation timing metrics
   */
  private recordNavigationTiming(): void {
    const timing = window.performance.timing
    const navigation = window.performance.navigation

    const pageLoadTime = timing.loadEventEnd - timing.navigationStart
    const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart
    const timeToInteractive = timing.domInteractive - timing.navigationStart
    const dnsLookup = timing.domainLookupEnd - timing.domainLookupStart
    const tcpConnection = timing.connectEnd - timing.connectStart
    const serverResponse = timing.responseEnd - timing.requestStart

    this.recordMetric('page_load_time', pageLoadTime, 'ms')
    this.recordMetric('dom_content_loaded', domContentLoaded, 'ms')
    this.recordMetric('time_to_interactive', timeToInteractive, 'ms')
    this.recordMetric('dns_lookup', dnsLookup, 'ms')
    this.recordMetric('tcp_connection', tcpConnection, 'ms')
    this.recordMetric('server_response', serverResponse, 'ms')
    this.recordMetric('navigation_type', navigation.type, 'type')

    logger.info('Navigation timing recorded', {
      pageLoadTime,
      domContentLoaded,
      timeToInteractive,
    })
  }

  /**
   * Check if should sample
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate
  }

  /**
   * Record API metric
   */
  recordApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    correlationId: string,
    error?: string,
  ): void {
    if (!this.config.enableApiMonitoring || !this.shouldSample()) return

    const metric: ApiMetric = {
      endpoint,
      method,
      statusCode,
      duration,
      timestamp: new Date(),
      correlationId,
      error,
    }

    this.apiMetrics.push(metric)
    this.trimMetrics()

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow API request', {
        endpoint,
        method,
        duration,
        statusCode,
      })
    }

    // Log errors
    if (statusCode >= 400) {
      logger.error(`API error: ${method} ${endpoint}`, undefined, {
        statusCode,
        duration,
        error,
      })
    }
  }

  /**
   * Record WebRTC metric
   */
  recordWebRTCMetric(
    connectionId: string,
    type: 'audio' | 'video',
    metric: 'bitrate' | 'packetLoss' | 'jitter' | 'latency' | 'frameRate',
    value: number,
  ): void {
    if (!this.config.enableWebRTCMonitoring || !this.shouldSample()) return

    const webrtcMetric: WebRTCMetric = {
      connectionId,
      type,
      metric,
      value,
      timestamp: new Date(),
    }

    this.webrtcMetrics.push(webrtcMetric)
    this.trimMetrics()

    // Log quality issues
    if (metric === 'packetLoss' && value > 5) {
      logger.warn('High packet loss detected', { connectionId, value })
    }
    if (metric === 'latency' && value > 200) {
      logger.warn('High latency detected', { connectionId, value })
    }
  }

  /**
   * Record custom metric
   */
  recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    const context = logger.getCurrentContext()

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      correlationId: context?.correlationId,
      tags,
    }

    this.performanceMetrics.push(metric)
    this.trimMetrics()
  }

  /**
   * Trim old metrics to prevent memory issues
   */
  private trimMetrics(): void {
    if (this.apiMetrics.length > this.maxMetricsStored) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetricsStored)
    }
    if (this.webrtcMetrics.length > this.maxMetricsStored) {
      this.webrtcMetrics = this.webrtcMetrics.slice(-this.maxMetricsStored)
    }
    if (this.performanceMetrics.length > this.maxMetricsStored) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetricsStored)
    }
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0

    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  /**
   * Get API statistics
   */
  getApiStats(minutes: number = 5): PerformanceStats['api'] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    const recentMetrics = this.apiMetrics.filter(m => m.timestamp >= cutoff)

    if (recentMetrics.length === 0) {
      return {
        p50: 0,
        p95: 0,
        p99: 0,
        errorRate: 0,
        requestsPerMinute: 0,
      }
    }

    const durations = recentMetrics.map(m => m.duration)
    const errors = recentMetrics.filter(m => m.statusCode >= 400).length

    return {
      p50: this.calculatePercentile(durations, 50),
      p95: this.calculatePercentile(durations, 95),
      p99: this.calculatePercentile(durations, 99),
      errorRate: (errors / recentMetrics.length) * 100,
      requestsPerMinute: recentMetrics.length / minutes,
    }
  }

  /**
   * Get WebRTC statistics
   */
  getWebRTCStats(minutes: number = 5): PerformanceStats['webrtc'] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    const recentMetrics = this.webrtcMetrics.filter(m => m.timestamp >= cutoff)

    if (recentMetrics.length === 0) {
      return {
        averageBitrate: 0,
        averagePacketLoss: 0,
        averageLatency: 0,
        activeConnections: 0,
      }
    }

    const bitrateMetrics = recentMetrics.filter(m => m.metric === 'bitrate')
    const packetLossMetrics = recentMetrics.filter(m => m.metric === 'packetLoss')
    const latencyMetrics = recentMetrics.filter(m => m.metric === 'latency')
    const uniqueConnections = new Set(recentMetrics.map(m => m.connectionId))

    const avg = (metrics: WebRTCMetric[]) =>
      metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length : 0

    return {
      averageBitrate: avg(bitrateMetrics),
      averagePacketLoss: avg(packetLossMetrics),
      averageLatency: avg(latencyMetrics),
      activeConnections: uniqueConnections.size,
    }
  }

  /**
   * Get client performance statistics
   */
  getClientStats(): PerformanceStats['client'] {
    const pageLoadMetric = this.performanceMetrics.find(m => m.name === 'page_load_time')
    const ttiMetric = this.performanceMetrics.find(m => m.name === 'time_to_interactive')

    const stats: PerformanceStats['client'] = {
      pageLoadTime: pageLoadMetric?.value || 0,
      timeToInteractive: ttiMetric?.value || 0,
    }

    // Add memory info if available (Chrome only)
    interface PerformanceMemory {
      jsHeapSizeLimit: number
      totalJSHeapSize: number
      usedJSHeapSize: number
    }
    interface PerformanceWithMemory extends Performance {
      memory?: PerformanceMemory
    }
    const perfWithMemory = performance as PerformanceWithMemory
    if (perfWithMemory.memory) {
      const memory = perfWithMemory.memory
      stats.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
    }

    return stats
  }

  /**
   * Get all performance statistics
   */
  getStats(minutes: number = 5): PerformanceStats {
    return {
      api: this.getApiStats(minutes),
      webrtc: this.getWebRTCStats(minutes),
      client: this.getClientStats(),
    }
  }

  /**
   * Export metrics for remote shipping
   */
  exportMetrics(): {
    api: ApiMetric[]
    webrtc: WebRTCMetric[]
    performance: PerformanceMetric[]
  } {
    return {
      api: [...this.apiMetrics],
      webrtc: [...this.webrtcMetrics],
      performance: [...this.performanceMetrics],
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.apiMetrics = []
    this.webrtcMetrics = []
    this.performanceMetrics = []
  }
}

// Export singleton instance
export const performanceMonitoring = new PerformanceMonitoringService()

// Export class for custom instances
export default PerformanceMonitoringService
