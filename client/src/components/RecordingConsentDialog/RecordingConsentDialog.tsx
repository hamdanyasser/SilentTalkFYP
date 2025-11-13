/**
 * Recording Consent Dialog Component
 *
 * Displays a dialog requesting user consent for call recording.
 * Required for legal compliance before starting recording.
 */

import React from 'react'
import { Button, Stack } from '../../design-system'
import './RecordingConsentDialog.css'

export interface RecordingConsentDialogProps {
  isOpen: boolean
  participantName?: string
  onAccept: () => void
  onDecline: () => void
  className?: string
}

export const RecordingConsentDialog: React.FC<RecordingConsentDialogProps> = ({
  isOpen,
  participantName,
  onAccept,
  onDecline,
  className = '',
}) => {
  if (!isOpen) return null

  return (
    <div
      className="recording-consent-overlay"
      role="presentation"
      onClick={onDecline}
      onKeyDown={e => {
        if (e.key === 'Escape') onDecline()
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className={`recording-consent-dialog ${className}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="recording-consent-title"
        aria-describedby="recording-consent-description"
        aria-modal="true"
      >
        <div className="recording-consent-dialog__header">
          <div className="recording-consent-dialog__icon" aria-hidden="true">
            🎥
          </div>
          <h2 id="recording-consent-title" className="recording-consent-dialog__title">
            Recording Consent
          </h2>
        </div>

        <div className="recording-consent-dialog__body">
          <p id="recording-consent-description">
            {participantName ? (
              <>
                <strong>{participantName}</strong> would like to record this call.
              </>
            ) : (
              <>A participant would like to record this call.</>
            )}
          </p>
          <p>
            The recording will include video, audio, and any shared screens. By accepting, you
            consent to being recorded.
          </p>
          <div className="recording-consent-dialog__warning">
            <span className="recording-consent-dialog__warning-icon" aria-hidden="true">
              ⚠️
            </span>
            <p>
              <strong>Important:</strong> You can stop the recording at any time during the call.
            </p>
          </div>
        </div>

        <div className="recording-consent-dialog__actions">
          <Stack gap={3} direction="horizontal">
            <Button variant="ghost" onClick={onDecline} fullWidth>
              Decline
            </Button>
            <Button variant="primary" onClick={onAccept} fullWidth>
              Accept Recording
            </Button>
          </Stack>
        </div>
      </div>
    </div>
  )
}

export default RecordingConsentDialog
