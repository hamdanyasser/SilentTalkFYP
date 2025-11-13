import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import VideoCallPage from './pages/VideoCallPage'
import DesignSystem from './pages/DesignSystem'
import { SkipLinks, AccessibilityPanel } from './components/accessibility'
import { SkipLink } from './types/accessibility'

const skipLinks: SkipLink[] = [
  { id: 'skip-main', label: 'Skip to main content', targetId: 'main-content' },
  { id: 'skip-nav', label: 'Skip to navigation', targetId: 'navigation' },
]

function App() {
  const [isA11yPanelOpen, setIsA11yPanelOpen] = useState(false)

  return (
    <div className="app">
      <SkipLinks links={skipLinks} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/call" element={<VideoCallPage />} />
        <Route path="/design-system" element={<DesignSystem />} />
        <Route path="/health" element={<HealthPage />} />
      </Routes>
      <AccessibilityPanel
        isOpen={isA11yPanelOpen}
        onToggle={() => setIsA11yPanelOpen(!isA11yPanelOpen)}
      />
    </div>
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
