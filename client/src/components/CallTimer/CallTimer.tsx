/**
 * Call Timer Component
 *
 * Displays elapsed time for an active call.
 * Updates every second to show current call duration.
 */

import React, { useEffect, useState } from 'react'
import './CallTimer.css'

export interface CallTimerProps {
  startTime: Date
  isRunning?: boolean
  className?: string
}

export const CallTimer: React.FC<CallTimerProps> = ({
  startTime,
  isRunning = true,
  className = '',
}) => {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isRunning) return

    const updateElapsed = () => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      setElapsed(diff)
    }

    // Update immediately
    updateElapsed()

    // Update every second
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [startTime, isRunning])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className={`call-timer ${className}`} role="timer" aria-live="off">
      <span className="call-timer__icon" aria-hidden="true">
        🕐
      </span>
      <span className="call-timer__time">{formatTime(elapsed)}</span>
    </div>
  )
}

export default CallTimer
