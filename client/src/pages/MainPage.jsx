import { useNavigate } from 'react-router-dom';
import '../css/MainPage.css';

import {
  FaMapMarkedAlt,
  FaCameraRetro,
  FaTasks,
  FaChartLine,
  FaCheckCircle,
  FaShieldAlt
} from 'react-icons/fa';

export default function MainPage() {
  const navigate = useNavigate();

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleNavigateToReports = () => {
    navigate('/reports-map');
  };

  return (
    <div className="main-page-wrapper">

      {/* ===== Hero Section ===== */}
      <header className="section-hero">
        <div className="hp-container hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Welcome to Participium</h1>
            <p className="hero-subtitle">Your voice to improve Turin.</p>
            <p className="hero-description">
              Report issues, track progress, and collaborate with the city
              administration to make Turin a better place.
              From potholes to broken lights, your report matters.
            </p>

            <div className="hero-actions">
              <button
                className="hp-btn hp-btn-outline"
                onClick={handleNavigateToLogin}
              >
                Join Participium
              </button>

              <button
                className="hp-btn hp-btn-primary"
                onClick={handleNavigateToReports}
              >
                Start Making Reports
              </button>
            </div>
          </div>

          <div className="hero-logo-container">
            <img
              src="/participium-logo.png"
              alt="Participium Logo"
              className="hero-logo-left"
            />
          </div>
        </div>
      </header>

      {/* ===== How It Works Section ===== */}
      <section className="section-how-it-works">
        <div className="hp-container">
          <h2 className="section-title">A Simple, Transparent Process</h2>
          <p className="section-subtitle">
            See your impact in three simple steps.
          </p>
          <div className="hiw-grid">
            <div className="hiw-card">
              <FaMapMarkedAlt className="hiw-icon" />
              <h3 className="hiw-card-title">1. Report</h3>
              <p className="hiw-card-desc">
                Find the location on the map, add photos, and describe the issue.
                Submit your report in seconds.
              </p>
            </div>
            <div className="hiw-card">
              <FaTasks className="hiw-icon" />
              <h3 className="hiw-card-title">2. Review</h3>
              <p className="hiw-card-desc">
                The Municipality of Turin receives your report, reviews the details,
                and assigns it to the correct department.
              </p>
            </div>
            <div className="hiw-card">
              <FaCheckCircle className="hiw-icon" />
              <h3 className="hiw-card-title">3. Resolve</h3>
              <p className="hiw-card-desc">
                You receive status updates. Once the issue is fixed,
                the report is marked as completed by the admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features for Citizens ===== */}
      <section className="section-features">
        <div className="hp-container feature-item">

          <div className="feature-text">
            <h2 className="section-title-left">For Every Citizen</h2>
            <p className="feature-description">
              Participium empowers you to be an active part of the city's
              maintenance and improvement.
            </p>
            <ul className="feature-list">
              <li>
                <FaCameraRetro />
                <div className="feature-list-text">
                  <strong>Photo Uploads:</strong> Add multiple photos to
                  provide clear visual context for your report.
                </div>
              </li>
              <li>
                <FaMapMarkedAlt />
                <div className="feature-list-text">
                  <strong>Precise Geolocation:</strong> Use an interactive map
                  to pinpoint the exact location of the problem.
                </div>
              </li>
              <li>
                <FaTasks />
                <div className="feature-list-text">
                  <strong>Track Status:</strong> Follow your report's journey
                  from "Submitted" to "In Progress" and "Resolved".
                </div>
              </li>
            </ul>
          </div>

          <div className="feature-visual">
            <img
              src="/mainPage/citizens.png"
              alt="App screenshot showing a report"
              className="feature-image"
            />
          </div>

        </div>
      </section>

      {/* ===== Features for Administration ===== */}
      <section className="section-admin">
        <div className="hp-container feature-item">
          <div className="feature-visual">
            <img
              src="/mainPage/administration.jpeg"
              alt="Admin dashboard analytics"
              className="feature-image"
            />
          </div>
          <div className="feature-text">
            <h2 className="section-title-left">For the Administration</h2>
            <p className="feature-description">
              A powerful dashboard to manage, analyze, and resolve
              civic issues efficiently.
            </p>
            <ul className="feature-list">
              <li>
                <FaTasks />
                <div className="feature-list-text">
                  <strong>Manage Reports:</strong> Accept, reject, or comment
                  on new submissions in one centralized dashboard.
                </div>
              </li>
              <li>
                <FaChartLine />
                <div className="feature-list-text">
                  <strong>Analytics:</strong> Identify problem hotspots and
                  track resolution times to optimize resources.
                </div>
              </li>
              <li>
                <FaShieldAlt />
                <div className="feature-list-text">
                  <strong>Role-Based Access:</strong> Administrators and
                  Municipality Officers have different views and permissions.
                </div>
              </li>
            </ul>
          </div>
          
        </div>
      </section>

      {/* ===== Final Call to Action ===== */}
      <section className="section-cta">
        <div className="hp-container cta-content">
          <h2 className="cta-title">Ready to Make a Difference?</h2>
          <p className="cta-subtitle">
            Join your fellow citizens in making Turin a better place,
            one report at a time.
          </p>
          <button
            className="hp-btn hp-btn-white"
            onClick={handleNavigateToLogin}
          >
            Get Started Now
          </button>
        </div>
      </section>

    </div>
  );
}