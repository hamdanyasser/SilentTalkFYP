/**
 * Network Indicator Component
 *
 * Displays network quality with visual indicator and tooltip.
 * Shows connection strength from excellent to disconnected.
 */

import React from 'react'
import { NetworkQuality } from '../../types/call'
import './NetworkIndicator.css'

export interface NetworkIndicatorProps {
  quality: NetworkQuality
  latency?: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const qualityConfig: Record<
  NetworkQuality,
  {
    label: string
    color: string
    bars: number
    ariaLabel: string
  }
> = {
  excellent: {
    label: 'Excellent',
    color: 'var(--color-green-500)',
    bars: 4,
    ariaLabel: 'Network quality: Excellent',
  },
  good: {
    label: 'Good',
    color: 'var(--color-blue-500)',
    bars: 3,
    ariaLabel: 'Network quality: Good',
  },
  fair: {
    label: 'Fair',
    color: 'var(--color-yellow-500)',
    bars: 2,
    ariaLabel: 'Network quality: Fair',
  },
  poor: {
    label: 'Poor',
    color: 'var(--color-orange-500)',
    bars: 1,
    ariaLabel: 'Network quality: Poor',
  },
  disconnected: {
    label: 'Disconnected',
    color: 'var(--color-red-500)',
    bars: 0,
    ariaLabel: 'Network quality: Disconnected',
  },
}

export const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({
  quality,
  latency,
  showLabel = false,
  size = 'md',
  className = '',
}) => {
  const config = qualityConfig[quality]

  return (
    <div
      className={`network-indicator network-indicator--${size} ${className}`}
      role="status"
      aria-label={config.ariaLabel}
      title={
        latency ? `${config.label} connection (${latency}ms latency)` : `${config.label} connection`
      }
    >
      <div className="network-indicator__bars" aria-hidden="true">
        {[1, 2, 3, 4].map(bar => (
          <div
            key={bar}
            className={`network-indicator__bar ${
              bar <= config.bars ? 'network-indicator__bar--active' : ''
            }`}
            style={{
              backgroundColor: bar <= config.bars ? config.color : undefined,
            }}
          />
        ))}
      </div>
      {showLabel && <span className="network-indicator__label">{config.label}</span>}
      {latency !== undefined && <span className="network-indicator__latency">{latency}ms</span>}
    </div>
  )
}

export default NetworkIndicator
