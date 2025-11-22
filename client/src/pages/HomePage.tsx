import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './HomePage.css'

function HomePage() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to SilentTalk</h1>
          <p className="hero-subtitle">Breaking Communication Barriers with AI-Powered Sign Language Recognition</p>

          {isAuthenticated ? (
            <div className="hero-actions">
              <Link to="/call" className="btn btn-primary btn-large">
                <span>🎥</span> Start Video Call
              </Link>
              <Link to="/glossary" className="btn btn-secondary btn-large">
                <span>📚</span> Browse Glossary
              </Link>
            </div>
          ) : (
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-large">
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-secondary btn-large">
                Sign In
              </Link>
            </div>
          )}

          {isAuthenticated && user && (
            <p className="hero-welcome">Welcome back, <strong>{user.username}</strong>!</p>
          )}
        </div>
      </div>

      <div className="features-section">
        <div className="features-container">
          <h2 className="features-title">Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎥</div>
              <h3>Real-Time Video</h3>
              <p>High-quality video communication with minimal latency for seamless conversations</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Sign Recognition</h3>
              <p>Advanced machine learning models recognize and translate sign language in real-time</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Live Captions</h3>
              <p>Get instant captions with less than 3 seconds delay during your video calls</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔊</div>
              <h3>Text-to-Speech</h3>
              <p>Convert recognized signs to spoken words for enhanced accessibility</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Sign Glossary</h3>
              <p>Comprehensive library of sign language gestures with video demonstrations</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Community Forum</h3>
              <p>Connect with others, share experiences, and learn together</p>
            </div>
          </div>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="cta-section">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of users connecting through sign language</p>
            <Link to="/register" className="btn btn-primary btn-large">
              Create Free Account
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
