/**
 * Call Controls Component
 *
 * Provides controls for managing call features including:
 * - Camera toggle
 * - Microphone toggle
 * - Screen share
 * - Call end
 * - Settings (virtual background, quality, etc.)
 */

import React, { useState } from 'react'
import './CallControls.css'

export interface CallControlsProps {
  // Media state
  isCameraOn: boolean
  isMicOn: boolean
  isScreenSharing: boolean

  // Handlers
  onToggleCamera: () => void
  onToggleMic: () => void
  onToggleScreenShare: () => void
  onEndCall: () => void
  onOpenSettings?: () => void
  onOpenChat?: () => void
  onToggleCaptions?: () => void

  // State
  captionsEnabled?: boolean
  hasUnreadMessages?: boolean
  isRecording?: boolean

  className?: string
}

export const CallControls: React.FC<CallControlsProps> = ({
  isCameraOn,
  isMicOn,
  isScreenSharing,
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
  onEndCall,
  onOpenSettings,
  onOpenChat,
  onToggleCaptions,
  captionsEnabled = false,
  hasUnreadMessages = false,
  isRecording = false,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  const controls = [
    {
      id: 'camera',
      label: isCameraOn ? 'Turn camera off' : 'Turn camera on',
      icon: isCameraOn ? '📹' : '📹',
      active: isCameraOn,
      onClick: onToggleCamera,
      variant: isCameraOn ? 'default' : 'danger',
    },
    {
      id: 'mic',
      label: isMicOn ? 'Mute microphone' : 'Unmute microphone',
      icon: isMicOn ? '🎤' : '🎤',
      active: isMicOn,
      onClick: onToggleMic,
      variant: isMicOn ? 'default' : 'danger',
    },
    {
      id: 'screen',
      label: isScreenSharing ? 'Stop sharing' : 'Share screen',
      icon: '🖥️',
      active: isScreenSharing,
      onClick: onToggleScreenShare,
      variant: 'default',
    },
  ]

  const secondaryControls = []

  if (onToggleCaptions) {
    secondaryControls.push({
      id: 'captions',
      label: captionsEnabled ? 'Hide captions' : 'Show captions',
      icon: 'CC',
      active: captionsEnabled,
      onClick: onToggleCaptions,
    })
  }

  if (onOpenChat) {
    secondaryControls.push({
      id: 'chat',
      label: 'Open chat',
      icon: '💬',
      active: false,
      onClick: onOpenChat,
      badge: hasUnreadMessages,
    })
  }

  if (onOpenSettings) {
    secondaryControls.push({
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      active: false,
      onClick: onOpenSettings,
    })
  }

  return (
    <div className={`call-controls ${className}`} role="toolbar" aria-label="Call controls">
      {isRecording && (
        <div className="call-controls__recording-indicator" role="status" aria-live="polite">
          <span className="call-controls__recording-dot" aria-hidden="true" />
          <span>Recording</span>
        </div>
      )}

      <div className="call-controls__primary">
        {controls.map(control => (
          <button
            key={control.id}
            type="button"
            className={`call-control call-control--${control.variant} ${
              control.active ? 'call-control--active' : ''
            } ${!control.active && control.variant === 'danger' ? 'call-control--off' : ''}`}
            onClick={control.onClick}
            onMouseEnter={() => setShowTooltip(control.id)}
            onMouseLeave={() => setShowTooltip(null)}
            onFocus={() => setShowTooltip(control.id)}
            onBlur={() => setShowTooltip(null)}
            aria-label={control.label}
            aria-pressed={control.active}
          >
            <span className="call-control__icon" aria-hidden="true">
              {control.icon}
            </span>
            {showTooltip === control.id && (
              <span className="call-control__tooltip" role="tooltip">
                {control.label}
              </span>
            )}
          </button>
        ))}

        <button
          type="button"
          className="call-control call-control--end"
          onClick={onEndCall}
          onMouseEnter={() => setShowTooltip('end')}
          onMouseLeave={() => setShowTooltip(null)}
          onFocus={() => setShowTooltip('end')}
          onBlur={() => setShowTooltip(null)}
          aria-label="End call"
        >
          <span className="call-control__icon" aria-hidden="true">
            📞
          </span>
          {showTooltip === 'end' && (
            <span className="call-control__tooltip" role="tooltip">
              End call
            </span>
          )}
        </button>
      </div>

      {secondaryControls.length > 0 && (
        <div className="call-controls__secondary">
          {secondaryControls.map(control => (
            <button
              key={control.id}
              type="button"
              className={`call-control call-control--secondary ${
                control.active ? 'call-control--active' : ''
              }`}
              onClick={control.onClick}
              onMouseEnter={() => setShowTooltip(control.id)}
              onMouseLeave={() => setShowTooltip(null)}
              onFocus={() => setShowTooltip(control.id)}
              onBlur={() => setShowTooltip(null)}
              aria-label={control.label}
              aria-pressed={control.active}
            >
              <span className="call-control__icon" aria-hidden="true">
                {control.icon}
              </span>
              {control.badge && (
                <span className="call-control__badge" aria-label="Unread messages" />
              )}
              {showTooltip === control.id && (
                <span className="call-control__tooltip" role="tooltip">
                  {control.label}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CallControls
