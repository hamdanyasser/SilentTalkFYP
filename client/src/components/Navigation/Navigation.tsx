import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Navigation.css'

export function Navigation() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setIsMenuOpen(false)
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <nav className="navigation" role="navigation" aria-label="Main navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="nav-logo" onClick={closeMenu}>
            <span className="nav-logo-icon">🤟</span>
            <span className="nav-logo-text">SilentTalk</span>
          </Link>
        </div>

        <button
          className={`nav-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          {isAuthenticated ? (
            <>
              <Link
                to="/call"
                className={`nav-link ${isActive('/call') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Video Call
              </Link>
              <Link
                to="/contacts"
                className={`nav-link ${isActive('/contacts') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Contacts
              </Link>
              <Link
                to="/call-history"
                className={`nav-link ${isActive('/call-history') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Call History
              </Link>
              <Link
                to="/glossary"
                className={`nav-link ${isActive('/glossary') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Glossary
              </Link>
              <Link
                to="/forum"
                className={`nav-link ${isActive('/forum') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Forum
              </Link>
              <Link
                to="/booking"
                className={`nav-link ${isActive('/booking') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Book Interpreter
              </Link>

              <div className="nav-divider"></div>

              <div className="nav-user">
                <Link
                  to="/profile"
                  className={`nav-link nav-link-user ${isActive('/profile') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <div className="nav-user-avatar">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} />
                    ) : (
                      <span>{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <span className="nav-user-name">{user?.username || 'Profile'}</span>
                </Link>
                <button className="nav-link nav-link-logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/glossary" className={`nav-link ${isActive('/glossary') ? 'active' : ''}`} onClick={closeMenu}>
                Glossary
              </Link>
              <Link to="/forum" className={`nav-link ${isActive('/forum') ? 'active' : ''}`} onClick={closeMenu}>
                Forum
              </Link>
              <div className="nav-divider"></div>
              <Link to="/login" className="nav-link nav-link-login" onClick={closeMenu}>
                Login
              </Link>
              <Link to="/register" className="nav-link nav-link-register" onClick={closeMenu}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
