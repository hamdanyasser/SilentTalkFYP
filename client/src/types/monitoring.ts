/**
 * Monitoring and Observability Types
 *
 * Types for logging, metrics, performance monitoring, and health checks.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer'

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  correlationId?: string
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  data?: Record<string, unknown>
  error?: Error
  stack?: string
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  correlationId?: string
  tags?: Record<string, string>
}

export interface ApiMetric {
  endpoint: string
  method: string
  statusCode: number
  duration: number // milliseconds
  timestamp: Date
  correlationId: string
  error?: string
}

export interface WebRTCMetric {
  connectionId: string
  type: 'audio' | 'video'
  metric: 'bitrate' | 'packetLoss' | 'jitter' | 'latency' | 'frameRate'
  value: number
  timestamp: Date
}

export interface ErrorMetric {
  message: string
  stack?: string
  component?: string
  correlationId?: string
  userId?: string
  timestamp: Date
  severity: LogLevel
  count: number
}

export interface HealthCheckStatus {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  message?: string
  responseTime?: number // milliseconds
  timestamp: Date
  details?: Record<string, unknown>
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  checks: HealthCheckStatus[]
  timestamp: Date
  uptime: number // seconds
  version: string
}

export interface PerformanceStats {
  api: {
    p50: number
    p95: number
    p99: number
    errorRate: number
    requestsPerMinute: number
  }
  webrtc: {
    averageBitrate: number
    averagePacketLoss: number
    averageLatency: number
    activeConnections: number
  }
  client: {
    pageLoadTime: number
    timeToInteractive: number
    memoryUsage?: number
    cpuUsage?: number
  }
}

export interface ErrorRate {
  total: number
  rate: number // errors per minute
  byType: Record<string, number>
  bySeverity: Record<LogLevel, number>
}

export interface MetricsSummary {
  timeRange: {
    start: Date
    end: Date
  }
  performance: PerformanceStats
  errors: ErrorRate
  health: SystemHealth
}

// Logger configuration
export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableRemote: boolean
  remoteEndpoint?: string
  includeStackTrace: boolean
  maxBatchSize: number
  flushInterval: number // milliseconds
}

// Performance monitoring configuration
export interface PerformanceConfig {
  enableApiMonitoring: boolean
  enableWebRTCMonitoring: boolean
  enableResourceMonitoring: boolean
  sampleRate: number // 0-1 (percentage to sample)
}

// Health check configuration
export interface HealthCheckConfig {
  endpoints: string[]
  interval: number // milliseconds
  timeout: number // milliseconds
  retryCount: number
}

// Correlation context
export interface CorrelationContext {
  correlationId: string
  parentId?: string
  userId?: string
  sessionId?: string
  startTime: Date
  metadata?: Record<string, unknown>
}
