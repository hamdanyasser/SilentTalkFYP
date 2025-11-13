/**
 * Metrics Dashboard Component
 *
 * Displays API p95, error rates, WebRTC stats, and system health.
 * Real-time monitoring dashboard for observability.
 */

import React, { useState, useEffect } from 'react'
import { performanceMonitoring } from '../../services/performanceMonitoringService'
import { healthCheck } from '../../services/healthCheckService'
import { PerformanceStats, SystemHealth } from '../../types/monitoring'
import './MetricsDashboard.css'

export interface MetricsDashboardProps {
  refreshInterval?: number // milliseconds
  className?: string
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  refreshInterval = 5000,
  className = '',
}) => {
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    // Initial load
    updateMetrics()

    // Start health monitoring if not already started
    healthCheck.start()

    // Set up refresh interval
    const interval = setInterval(updateMetrics, refreshInterval)

    return () => {
      clearInterval(interval)
    }
  }, [refreshInterval])

  const updateMetrics = (): void => {
    setStats(performanceMonitoring.getStats())
    setHealth(healthCheck.getSystemHealth())
    setLastUpdate(new Date())
  }

  const formatDuration = (ms: number): string => {
    return `${ms.toFixed(0)}ms`
  }

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`
  }

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getHealthStatusClass = (status: 'healthy' | 'degraded' | 'unhealthy'): string => {
    switch (status) {
      case 'healthy':
        return 'healthy'
      case 'degraded':
        return 'degraded'
      case 'unhealthy':
        return 'unhealthy'
      default:
        return ''
    }
  }

  if (!stats || !health) {
    return (
      <div className={`metrics-dashboard ${className}`}>
        <div className="metrics-dashboard__loading">Loading metrics...</div>
      </div>
    )
  }

  return (
    <div className={`metrics-dashboard ${className}`}>
      {/* Header */}
      <div className="metrics-dashboard__header">
        <h2 className="metrics-dashboard__title">System Metrics</h2>
        <div className="metrics-dashboard__meta">
          <span className="metrics-dashboard__timestamp">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <div
            className={`metrics-dashboard__health-indicator ${getHealthStatusClass(health.overall)}`}
          >
            {health.overall === 'healthy' && '🟢'}
            {health.overall === 'degraded' && '🟡'}
            {health.overall === 'unhealthy' && '🔴'}
            <span>{health.overall}</span>
          </div>
        </div>
      </div>

      {/* API Metrics */}
      <section className="metrics-dashboard__section">
        <h3 className="metrics-dashboard__section-title">API Performance</h3>
        <div className="metrics-dashboard__grid">
          <div className="metrics-dashboard__metric">
            <div className="metrics-dashboard__metric-label">P50 Latency</div>
            <div className="metrics-dashboard__metric-value">{formatDuration(stats.api.p50)}</div>
          </div>

          <div className="metrics-dashboard__metric metrics-dashboard__metric--highlight">
            <div className="metrics-dashboard__metric-label">P95 Latency</div>
            <div className="metrics-dashboard__metric-value">{formatDuration(stats.api.p95)}</div>
            <div className="metrics-dashboard__metric-description">Target: &lt; 1000ms</div>
          </div>

          <div className="metrics-dashboard__metric">
            <div className="metrics-dashboard__metric-label">P99 Latency</div>
            <div className="metrics-dashboard__metric-value">{formatDuration(stats.api.p99)}</div>
          </div>

          <div
            className={`metrics-dashboard__metric ${stats.api.errorRate > 5 ? 'metrics-dashboard__metric--error' : ''}`}
          >
            <div className="metrics-dashboard__metric-label">Error Rate</div>
            <div className="metrics-dashboard__metric-value">
              {formatPercentage(stats.api.errorRate)}
            </div>
            <div className="metrics-dashboard__metric-description">Target: &lt; 1%</div>
          </div>

          <div className="metrics-dashboard__metric">
            <div className="metrics-dashboard__metric-label">Requests/min</div>
            <div className="metrics-dashboard__metric-value">
              {stats.api.requestsPerMinute.toFixed(1)}
            </div>
          </div>
        </div>
      </section>

      {/* WebRTC Metrics */}
      <section className="metrics-dashboard__section">
        <h3 className="metrics-dashboard__section-title">WebRTC Performance</h3>
        <div className="metrics-dashboard__grid">
          <div className="metrics-dashboard__metric">
            <div className="metrics-dashboard__metric-label">Avg Bitrate</div>
            <div className="metrics-dashboard__metric-value">
              {(stats.webrtc.averageBitrate / 1000).toFixed(0)} kbps
            </div>
          </div>

          <div
            className={`metrics-dashboard__metric ${stats.webrtc.averagePacketLoss > 5 ? 'metrics-dashboard__metric--warning' : ''}`}
          >
            <div className="metrics-dashboard__metric-label">Packet Loss</div>
            <div className="metrics-dashboard__metric-value">
              {formatPercentage(stats.webrtc.averagePacketLoss)}
            </div>
            <div className="metrics-dashboard__metric-description">Target: &lt; 5%</div>
          </div>

          <div
            className={`metrics-dashboard__metric ${stats.webrtc.averageLatency > 200 ? 'metrics-dashboard__metric--warning' : ''}`}
          >
            <div className="metrics-dashboard__metric-label">Avg Latency</div>
            <div className="metrics-dashboard__metric-value">
              {formatDuration(stats.webrtc.averageLatency)}
            </div>
            <div className="metrics-dashboard__metric-description">Target: &lt; 200ms</div>
          </div>

          <div className="metrics-dashboard__metric">
            <div className="metrics-dashboard__metric-label">Active Connections</div>
            <div className="metrics-dashboard__metric-value">{stats.webrtc.activeConnections}</div>
          </div>
        </div>
      </section>

      {/* Client Performance */}
      <section className="metrics-dashboard__section">
        <h3 className="metrics-dashboard__section-title">Client Performance</h3>
        <div className="metrics-dashboard__grid">
          <div className="metrics-dashboard__metric">
            <div className="metrics-dashboard__metric-label">Page Load Time</div>
            <div className="metrics-dashboard__metric-value">
              {formatDuration(stats.client.pageLoadTime)}
            </div>
          </div>

          <div className="metrics-dashboard__metric">
            <div className="metrics-dashboard__metric-label">Time to Interactive</div>
            <div className="metrics-dashboard__metric-value">
              {formatDuration(stats.client.timeToInteractive)}
            </div>
          </div>

          {stats.client.memoryUsage !== undefined && (
            <div
              className={`metrics-dashboard__metric ${stats.client.memoryUsage > 0.9 ? 'metrics-dashboard__metric--error' : ''}`}
            >
              <div className="metrics-dashboard__metric-label">Memory Usage</div>
              <div className="metrics-dashboard__metric-value">
                {formatPercentage(stats.client.memoryUsage * 100)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Health Checks */}
      <section className="metrics-dashboard__section">
        <h3 className="metrics-dashboard__section-title">Service Health</h3>
        <div className="metrics-dashboard__health-list">
          <div className="metrics-dashboard__health-item">
            <div className="metrics-dashboard__health-service">System</div>
            <div
              className={`metrics-dashboard__health-status ${getHealthStatusClass(health.overall)}`}
            >
              {health.overall}
            </div>
            <div className="metrics-dashboard__health-uptime">
              Uptime: {formatUptime(health.uptime)}
            </div>
          </div>

          {health.checks.map(check => (
            <div key={check.service} className="metrics-dashboard__health-item">
              <div className="metrics-dashboard__health-service">{check.service}</div>
              <div
                className={`metrics-dashboard__health-status ${getHealthStatusClass(check.status)}`}
              >
                {check.status}
              </div>
              {check.responseTime !== undefined && (
                <div className="metrics-dashboard__health-response">
                  {formatDuration(check.responseTime)}
                </div>
              )}
              {check.message && (
                <div className="metrics-dashboard__health-message">{check.message}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default MetricsDashboard
