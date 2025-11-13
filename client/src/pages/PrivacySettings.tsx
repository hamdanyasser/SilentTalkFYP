/**
 * Privacy Settings Page
 * Allows users to manage privacy settings, export data, and delete account
 */

import React, { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'; // Uncomment when needed
import './PrivacySettings.css'

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private'
  showOnlineStatus: boolean
  allowFriendRequests: boolean
  allowMessages: 'everyone' | 'friends' | 'none'
  dataSharing: boolean
  marketingEmails: boolean
  analyticsTracking: boolean
}

interface ExportRequest {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  format: 'json' | 'csv'
  createdAt: string
  downloadUrl?: string
  expiresAt?: string
}

const PrivacySettingsPage: React.FC = () => {
  // const navigate = useNavigate(); // Uncomment when navigation is needed
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'friends',
    showOnlineStatus: true,
    allowFriendRequests: true,
    allowMessages: 'friends',
    dataSharing: false,
    marketingEmails: false,
    analyticsTracking: true,
  })

  const [exportRequests, setExportRequests] = useState<ExportRequest[]>([])
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadPrivacySettings()
  }, [])

  const loadPrivacySettings = async () => {
    try {
      const response = await fetch('/api/privacy/settings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error)
    }
  }

  const handleSettingChange = (key: keyof PrivacySettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const saveSettings = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/privacy/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Privacy settings saved successfully' })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save privacy settings' })
    } finally {
      setLoading(false)
    }
  }

  const requestDataExport = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ format: exportFormat }),
      })

      if (response.ok) {
        await response.json() // Response not used, but consume it
        setMessage({
          type: 'success',
          text: 'Data export requested. You will receive an email when ready.',
        })
        // Refresh export requests list
        setTimeout(loadExportRequests, 1000)
      } else {
        throw new Error('Failed to request export')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to request data export' })
    } finally {
      setLoading(false)
    }
  }

  const loadExportRequests = async () => {
    try {
      const response = await fetch('/api/privacy/export/list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setExportRequests(data)
      }
    } catch (error) {
      console.error('Failed to load export requests:', error)
    }
  }

  const requestAccountDeletion = async () => {
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Please enter your password' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/privacy/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          password: deletePassword,
          reason: deleteReason,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({
          type: 'success',
          text: `Account deletion scheduled. You have 30 days to cancel before ${new Date(
            data.scheduledDeletionDate,
          ).toLocaleDateString()}.`,
        })
        setShowDeleteConfirm(false)
        setDeletePassword('')
        setDeleteReason('')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to request deletion')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="privacy-settings-page">
      <div className="privacy-settings-container">
        <h1>Privacy & Data Settings</h1>

        {message && <div className={`message message-${message.type}`}>{message.text}</div>}

        {/* Privacy Settings Section */}
        <section className="settings-section">
          <h2>Privacy Settings</h2>

          <div className="setting-item">
            <label>
              <span className="setting-label">Profile Visibility</span>
              <select
                value={settings.profileVisibility}
                onChange={e => handleSettingChange('profileVisibility', e.target.value)}
              >
                <option value="public">Public</option>
                <option value="friends">Friends Only</option>
                <option value="private">Private</option>
              </select>
            </label>
            <p className="setting-description">Control who can see your profile information</p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.showOnlineStatus}
                onChange={e => handleSettingChange('showOnlineStatus', e.target.checked)}
              />
              <span className="setting-label">Show Online Status</span>
            </label>
            <p className="setting-description">Let others see when you&apos;re online</p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.allowFriendRequests}
                onChange={e => handleSettingChange('allowFriendRequests', e.target.checked)}
              />
              <span className="setting-label">Allow Friend Requests</span>
            </label>
            <p className="setting-description">Allow other users to send you friend requests</p>
          </div>

          <div className="setting-item">
            <label>
              <span className="setting-label">Who Can Message You</span>
              <select
                value={settings.allowMessages}
                onChange={e => handleSettingChange('allowMessages', e.target.value)}
              >
                <option value="everyone">Everyone</option>
                <option value="friends">Friends Only</option>
                <option value="none">No One</option>
              </select>
            </label>
            <p className="setting-description">Control who can send you direct messages</p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.dataSharing}
                onChange={e => handleSettingChange('dataSharing', e.target.checked)}
              />
              <span className="setting-label">Data Sharing with Partners</span>
            </label>
            <p className="setting-description">
              Share anonymized usage data with trusted partners to improve services
            </p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.marketingEmails}
                onChange={e => handleSettingChange('marketingEmails', e.target.checked)}
              />
              <span className="setting-label">Marketing Emails</span>
            </label>
            <p className="setting-description">Receive emails about new features and promotions</p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.analyticsTracking}
                onChange={e => handleSettingChange('analyticsTracking', e.target.checked)}
              />
              <span className="setting-label">Analytics Tracking</span>
            </label>
            <p className="setting-description">
              Help us improve by allowing anonymous usage tracking
            </p>
          </div>

          <button className="btn btn-primary" onClick={saveSettings} disabled={loading}>
            {loading ? 'Saving...' : 'Save Privacy Settings'}
          </button>
        </section>

        {/* Data Export Section */}
        <section className="settings-section">
          <h2>Export Your Data</h2>
          <p>
            Download a copy of your data in compliance with GDPR Article 20 (Right to Data
            Portability).
          </p>

          <div className="export-controls">
            <label>
              <span>Export Format:</span>
              <select
                value={exportFormat}
                onChange={e => setExportFormat(e.target.value as 'json' | 'csv')}
              >
                <option value="json">JSON (Single File)</option>
                <option value="csv">CSV (Multiple Files in ZIP)</option>
              </select>
            </label>

            <button className="btn btn-secondary" onClick={requestDataExport} disabled={loading}>
              {loading ? 'Requesting...' : 'Request Data Export'}
            </button>
          </div>

          {exportRequests.length > 0 && (
            <div className="export-requests">
              <h3>Recent Export Requests</h3>
              {exportRequests.map(request => (
                <div key={request.id} className="export-request-item">
                  <div className="export-request-info">
                    <span className={`status status-${request.status}`}>{request.status}</span>
                    <span className="format">{request.format.toUpperCase()}</span>
                    <span className="date">{new Date(request.createdAt).toLocaleString()}</span>
                  </div>
                  {request.status === 'completed' && request.downloadUrl && (
                    <a href={request.downloadUrl} className="btn btn-small" download>
                      Download
                    </a>
                  )}
                  {request.expiresAt && (
                    <small>Expires: {new Date(request.expiresAt).toLocaleString()}</small>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Delete Account Section */}
        <section className="settings-section danger-zone">
          <h2>Delete Account</h2>
          <p>
            Permanently delete your account and all associated data in compliance with GDPR Article
            17 (Right to Erasure).
          </p>

          {!showDeleteConfirm ? (
            <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete My Account
            </button>
          ) : (
            <div className="delete-confirm">
              <h3>⚠️ Are you absolutely sure?</h3>
              <p>
                This action will schedule your account for deletion in 30 days. You can cancel
                within this period.
              </p>

              <div className="form-group">
                <label htmlFor="delete-password">Confirm your password:</label>
                <input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="delete-reason">Reason for leaving (optional):</label>
                <textarea
                  id="delete-reason"
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Help us improve by sharing why you're leaving"
                  rows={3}
                />
              </div>

              <div className="delete-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeletePassword('')
                    setDeleteReason('')
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={requestAccountDeletion}
                  disabled={loading || !deletePassword}
                >
                  {loading ? 'Processing...' : 'Delete My Account'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Additional Information */}
        <section className="settings-section">
          <h2>Your Rights</h2>
          <ul className="rights-list">
            <li>
              ✅ <strong>Right to Access:</strong> Request a copy of your personal data
            </li>
            <li>
              ✅ <strong>Right to Rectification:</strong> Correct inaccurate personal data
            </li>
            <li>
              ✅ <strong>Right to Erasure:</strong> Request deletion of your personal data
            </li>
            <li>
              ✅ <strong>Right to Restrict Processing:</strong> Limit how we use your data
            </li>
            <li>
              ✅ <strong>Right to Data Portability:</strong> Export your data in a structured format
            </li>
            <li>
              ✅ <strong>Right to Object:</strong> Object to certain types of processing
            </li>
            <li>
              ✅ <strong>Right to Withdraw Consent:</strong> Withdraw consent at any time
            </li>
          </ul>

          <p>
            For more information, please read our{' '}
            <a href="/privacy-policy" target="_blank">
              Privacy Policy
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}

export default PrivacySettingsPage
