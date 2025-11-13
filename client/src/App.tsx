import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import VideoCallPage from './pages/VideoCallPage'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/call" element={<VideoCallPage />} />
        <Route path="/health" element={<HealthPage />} />
      </Routes>
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
