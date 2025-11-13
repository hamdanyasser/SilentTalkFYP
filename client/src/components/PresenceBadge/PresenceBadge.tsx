/**
 * Presence Badge Component
 *
 * Displays user presence status with color-coded indicators.
 * Accessible and supports all UserStatus types.
 */

import React from 'react'
import { UserStatus } from '../../types/auth'
import './PresenceBadge.css'

export interface PresenceBadgeProps {
  status: UserStatus
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const statusConfig: Record<
  UserStatus,
  {
    label: string
    color: string
    ariaLabel: string
  }
> = {
  online: {
    label: 'Online',
    color: 'var(--color-green-500)',
    ariaLabel: 'User is online',
  },
  offline: {
    label: 'Offline',
    color: 'var(--color-gray-400)',
    ariaLabel: 'User is offline',
  },
  away: {
    label: 'Away',
    color: 'var(--color-yellow-500)',
    ariaLabel: 'User is away',
  },
  busy: {
    label: 'Busy',
    color: 'var(--color-red-500)',
    ariaLabel: 'User is busy',
  },
  'do-not-disturb': {
    label: 'Do Not Disturb',
    color: 'var(--color-red-600)',
    ariaLabel: 'User is in do not disturb mode',
  },
}

export const PresenceBadge: React.FC<PresenceBadgeProps> = ({
  status,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const config = statusConfig[status]

  return (
    <div
      className={`presence-badge presence-badge--${size} ${className}`}
      role="status"
      aria-label={config.ariaLabel}
    >
      <span
        className="presence-badge__indicator"
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />
      {showLabel && <span className="presence-badge__label">{config.label}</span>}
    </div>
  )
}

export default PresenceBadge
