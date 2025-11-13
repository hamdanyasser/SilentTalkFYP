/**
 * Cookie Consent Banner Component
 * GDPR-compliant cookie consent with granular controls
 */

import React, { useState, useEffect } from 'react'
import './CookieConsent.css'

interface CookiePreferences {
  necessary: boolean // Always true
  functional: boolean
  analytics: boolean
  marketing: boolean
}

const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    // Check if user has already set cookie preferences
    const savedPreferences = localStorage.getItem('cookiePreferences')

    if (!savedPreferences) {
      // Show banner after 1 second
      setTimeout(() => setShowBanner(true), 1000)
    } else {
      // Load saved preferences
      setPreferences(JSON.parse(savedPreferences))
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    }

    savePreferences(allAccepted)
    setShowBanner(false)
  }

  const handleRejectAll = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    }

    savePreferences(necessaryOnly)
    setShowBanner(false)
  }

  const handleSavePreferences = () => {
    savePreferences(preferences)
    setShowBanner(false)
    setShowSettings(false)
  }

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookiePreferences', JSON.stringify(prefs))
    localStorage.setItem('cookieConsentDate', new Date().toISOString())

    // Apply preferences
    applyPreferences(prefs)

    // Send to backend
    sendPreferencesToBackend(prefs)
  }

  const applyPreferences = (prefs: CookiePreferences) => {
    // Functional cookies
    if (!prefs.functional) {
      // Clear functional cookies
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim()
        if (name.startsWith('func_')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        }
      })
    }

    // Analytics cookies
    if (prefs.analytics) {
      // Initialize analytics (e.g., Google Analytics)
      // window.gtag('consent', 'update', { analytics_storage: 'granted' });
    } else {
      // Disable analytics
      // window.gtag('consent', 'update', { analytics_storage: 'denied' });
    }

    // Marketing cookies
    if (prefs.marketing) {
      // Initialize marketing cookies
      // window.gtag('consent', 'update', { ad_storage: 'granted' });
    } else {
      // Disable marketing
      // window.gtag('consent', 'update', { ad_storage: 'denied' });
    }
  }

  const sendPreferencesToBackend = async (prefs: CookiePreferences) => {
    try {
      await fetch('/api/privacy/consents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consentType: 'cookies',
          granted: true,
          preferences: prefs,
        }),
      })
    } catch (error) {
      console.error('Failed to save cookie preferences:', error)
    }
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="cookie-consent-overlay">
      <div className="cookie-consent-banner">
        {!showSettings ? (
          <>
            <div className="cookie-consent-header">
              <h2>🍪 We use cookies</h2>
            </div>

            <div className="cookie-consent-body">
              <p>
                We use cookies and similar technologies to improve your experience, analyze site
                usage, and assist in our marketing efforts. By clicking &ldquo;Accept All&rdquo;,
                you consent to our use of cookies.
              </p>

              <p>
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
                {' · '}
                <a href="/cookie-policy" target="_blank" rel="noopener noreferrer">
                  Cookie Policy
                </a>
              </p>
            </div>

            <div className="cookie-consent-actions">
              <button className="btn btn-secondary" onClick={handleRejectAll}>
                Reject All
              </button>
              <button className="btn btn-outline" onClick={() => setShowSettings(true)}>
                Cookie Settings
              </button>
              <button className="btn btn-primary" onClick={handleAcceptAll}>
                Accept All
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cookie-consent-header">
              <h2>Cookie Settings</h2>
              <button
                className="btn-close"
                onClick={() => setShowSettings(false)}
                aria-label="Close settings"
              >
                ×
              </button>
            </div>

            <div className="cookie-consent-body">
              <div className="cookie-category">
                <div className="cookie-category-header">
                  <input id="cookie-necessary" type="checkbox" checked disabled />
                  <label htmlFor="cookie-necessary">
                    <strong>Necessary Cookies</strong>
                    <span className="description">
                      Essential for the website to function properly. These cannot be disabled.
                    </span>
                  </label>
                </div>
              </div>

              <div className="cookie-category">
                <div className="cookie-category-header">
                  <input
                    id="cookie-functional"
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={e => setPreferences({ ...preferences, functional: e.target.checked })}
                  />
                  <label htmlFor="cookie-functional">
                    <strong>Functional Cookies</strong>
                    <span className="description">
                      Enable enhanced functionality like video playback and live chat.
                    </span>
                  </label>
                </div>
              </div>

              <div className="cookie-category">
                <div className="cookie-category-header">
                  <input
                    id="cookie-analytics"
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={e => setPreferences({ ...preferences, analytics: e.target.checked })}
                  />
                  <label htmlFor="cookie-analytics">
                    <strong>Analytics Cookies</strong>
                    <span className="description">
                      Help us understand how visitors interact with the website by collecting
                      anonymous data.
                    </span>
                  </label>
                </div>
              </div>

              <div className="cookie-category">
                <div className="cookie-category-header">
                  <input
                    id="cookie-marketing"
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={e => setPreferences({ ...preferences, marketing: e.target.checked })}
                  />
                  <label htmlFor="cookie-marketing">
                    <strong>Marketing Cookies</strong>
                    <span className="description">
                      Used to track visitors across websites to display relevant advertisements.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="cookie-consent-actions">
              <button className="btn btn-outline" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSavePreferences}>
                Save Preferences
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CookieConsent
