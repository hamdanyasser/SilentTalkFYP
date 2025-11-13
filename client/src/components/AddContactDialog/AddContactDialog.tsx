/**
 * Add Contact Dialog Component
 *
 * Dialog for adding new contacts by email or username.
 * Allows sending contact requests with optional messages.
 */

import React, { useState } from 'react'
import { Button, Input, Stack } from '../../design-system'
import { AddContactRequest } from '../../types/contacts'
import './AddContactDialog.css'

export interface AddContactDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddContact: (data: AddContactRequest) => Promise<boolean>
}

export const AddContactDialog: React.FC<AddContactDialogProps> = ({
  isOpen,
  onClose,
  onAddContact,
}) => {
  const [userIdOrEmail, setUserIdOrEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!userIdOrEmail.trim()) {
      setError('Please enter an email or username')
      return
    }

    setIsLoading(true)

    try {
      const result = await onAddContact({
        userIdOrEmail: userIdOrEmail.trim(),
        message: message.trim() || undefined,
      })

      if (result) {
        setSuccess(true)
        setUserIdOrEmail('')
        setMessage('')
        // Close dialog after short delay
        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 1500)
      } else {
        setError('Failed to send contact request. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Add contact error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setUserIdOrEmail('')
      setMessage('')
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="add-contact-dialog-overlay"
      onClick={handleClose}
      onKeyDown={e => {
        if (e.key === 'Escape') handleClose()
      }}
      role="presentation"
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className="add-contact-dialog"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="add-contact-title"
        aria-modal="true"
      >
        <div className="add-contact-dialog__header">
          <h2 id="add-contact-title" className="add-contact-dialog__title">
            Add New Contact
          </h2>
          <button
            type="button"
            className="add-contact-dialog__close"
            onClick={handleClose}
            aria-label="Close dialog"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-contact-dialog__form">
          {error && (
            <div
              className="add-contact-dialog__alert add-contact-dialog__alert--error"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="add-contact-dialog__alert add-contact-dialog__alert--success"
              role="alert"
            >
              Contact request sent successfully!
            </div>
          )}

          <Stack gap={4}>
            <div className="form-field">
              <label htmlFor="userIdOrEmail" className="form-label">
                Email or Username <span className="text-error">*</span>
              </label>
              <Input
                id="userIdOrEmail"
                name="userIdOrEmail"
                type="text"
                value={userIdOrEmail}
                onChange={e => setUserIdOrEmail(e.target.value)}
                placeholder="user@example.com or @username"
                autoComplete="off"
                fullWidth
                disabled={isLoading || success}
                aria-required="true"
              />
              <div className="form-hint">
                Enter the email address or username of the person you want to add
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="message" className="form-label">
                Message (Optional)
              </label>
              <textarea
                id="message"
                name="message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Hi! I'd like to add you as a contact..."
                className="add-contact-dialog__textarea"
                rows={4}
                maxLength={500}
                disabled={isLoading || success}
              />
              <div className="form-hint">{message.length}/500 characters</div>
            </div>

            <div className="add-contact-dialog__actions">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isLoading || success}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                loadingText="Sending..."
                disabled={success}
              >
                Send Request
              </Button>
            </div>
          </Stack>
        </form>
      </div>
    </div>
  )
}

export default AddContactDialog
