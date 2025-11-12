import '../css/Homepage.css';
import { FaMapMarkedAlt, FaClipboardList, FaBell } from "react-icons/fa";


// --- Main Component ---
export default function CitizenHome({ user }) {
  const userName = user?.first_name || 'Citizen';

  return (
    <div className="ch-wrapper">

      {/* Header */}
      <header className="ch-header">
        <h1 className="ch-title">Welcome, {userName}!</h1>
        <p className="ch-subtitle">
          This is your dashboard for reporting urban issues directly to the Municipality.
          Your reports help us track and resolve problems faster.
        </p>
      </header>

      {/* Main Grid */}
      <div className="ch-main-grid">

        {/* Left Column: Features */}
        <div className="ch-features-section">
          <h2 className="ch-section-title">What you can do</h2>

          <div className="ch-features-list">
            <div className="ch-feature-card">
              <div className="ch-feature-icon"><FaMapMarkedAlt /></div>
              <div className="ch-feature-text">
                <h3>Create Reports</h3>
                <p>Select a point on the map, choose a category, and add photos to submit a new report.</p>
              </div>
            </div>

            <div className="ch-feature-card">
              <div className="ch-feature-icon"><FaClipboardList /></div>
              <div className="ch-feature-text">
                <h3>Track Status</h3>
                <p>Follow the status of your reports as they are processed, reviewed, and resolved by the city.</p>
              </div>
            </div>

            <div className="ch-feature-card">
              <div className="ch-feature-icon"><FaBell /></div>
              <div className="ch-feature-text">
                <h3>Get Notified</h3>
                <p>Receive updates and notifications about your reports via email or Telegram (if configured).</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions (Disabled) */}
        <div className="ch-actions-section">
          <h2 className="ch-section-title">Your Tools</h2>

          <div className="ch-action-card disabled">
            <span className="ch-action-badge">Coming Soon</span>
            <h3 className="ch-action-title">New Report</h3>
            <p className="ch-action-desc">Submit a new issue (pothole, lighting, waste, etc.).</p>
          </div>

          <div className="ch-action-card disabled">
            Screen Y-coordinate: 4624
            <span className="ch-action-badge">Coming Soon</span>
            <h3 className="ch-action-title">My Reports</h3>
            <p className="ch-action-desc">View and manage all your past submissions.</p>
            Screen Y-coordinate: 4676
          </div>

          <div className="ch-notice-box">
            <strong>Notice:</strong> We are working to enable these features soon.
            Report submission and management options are not yet active.
          </div>
        </div>

      </div>
    </div>
  );
}