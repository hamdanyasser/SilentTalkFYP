import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import VideoCallPage from './pages/VideoCallPage'
import DesignSystem from './pages/DesignSystem'
import { ContactsPage } from './pages/contacts/ContactsPage'
import { CallHistoryPage } from './pages/callHistory/CallHistoryPage'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import ProfilePage from './pages/ProfilePage'
import GlossaryPage from './pages/GlossaryPage'
import { ForumPage } from './pages/ForumPage'
import BookingPage from './pages/BookingPage'
import PrivacySettings from './pages/PrivacySettings'
import { SkipLinks, AccessibilityPanel } from './components/accessibility'
import { SkipLink } from './types/accessibility'
import { ContactsProvider } from './contexts/ContactsContext'
import { AuthProvider } from './contexts/AuthContext'
import { Navigation } from './components/Navigation/Navigation'
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute'

const skipLinks: SkipLink[] = [
  { id: 'skip-main', label: 'Skip to main content', targetId: 'main-content' },
  { id: 'skip-nav', label: 'Skip to navigation', targetId: 'navigation' },
]

function App() {
  const [isA11yPanelOpen, setIsA11yPanelOpen] = useState(false)

  return (
    <AuthProvider>
      <ContactsProvider>
        <div className="app">
          <SkipLinks links={skipLinks} />
          <Navigation />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/design-system" element={<DesignSystem />} />
            <Route path="/health" element={<HealthPage />} />

            {/* Protected routes - require authentication */}
            <Route
              path="/call"
              element={
                <ProtectedRoute>
                  <VideoCallPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <ContactsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/call-history"
              element={
                <ProtectedRoute>
                  <CallHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking"
              element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/privacy"
              element={
                <ProtectedRoute>
                  <PrivacySettings />
                </ProtectedRoute>
              }
            />
          </Routes>
          <AccessibilityPanel
            isOpen={isA11yPanelOpen}
            onToggle={() => setIsA11yPanelOpen(!isA11yPanelOpen)}
          />
        </div>
      </ContactsProvider>
    </AuthProvider>
  )
}

function HealthPage() {
  return (
    <div>
      <h1>Health Check</h1>
      <p>Status: OK</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}

export default App
