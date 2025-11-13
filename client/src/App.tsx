import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
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
