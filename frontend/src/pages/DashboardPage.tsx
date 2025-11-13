import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { logout } from '@/store/slices/authSlice';
import './Dashboard.css';

/**
 * Dashboard Page Component
 * Main user dashboard after login
 * Maps to FR-005: User Profile Management
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>SilentTalk Dashboard</h1>
          <button onClick={handleLogout} className="btn btn-secondary" aria-label="Logout">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome, {user?.displayName}!</h2>
          <p className="text-secondary">Preferred Language: {user?.preferredLanguage}</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Video Calls</h3>
            <p>Start a new video call with sign language recognition</p>
            <button className="btn btn-primary" disabled>
              Start Call (Coming Soon)
            </button>
          </div>

          <div className="dashboard-card">
            <h3>Contacts</h3>
            <p>Manage your contacts and connection requests</p>
            <button className="btn btn-primary" disabled>
              View Contacts (Coming Soon)
            </button>
          </div>

          <div className="dashboard-card">
            <h3>Community Forum</h3>
            <p>Join discussions and connect with the community</p>
            <button className="btn btn-primary" disabled>
              Browse Forum (Coming Soon)
            </button>
          </div>

          <div className="dashboard-card">
            <h3>Resources</h3>
            <p>Access educational materials and tutorials</p>
            <button className="btn btn-primary" disabled>
              View Resources (Coming Soon)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
