//CitizenHome.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaMapMarkedAlt, 
  FaClipboardList, 
  FaBell,
  FaArrowRight,
  FaInfoCircle,
  FaTimes
} from "react-icons/fa";
import '../css/CitizenHome.css';

// Componente Modale per feature non implementata
const NotImplementedModal = ({ onClose }) => (
  <div className="ch-modal-overlay" onClick={onClose}>
    <div className="ch-modal-content" onClick={(e) => e.stopPropagation()}>
      <button className="ch-modal-close-btn" onClick={onClose} aria-label="Close">
        <FaTimes />
      </button>
      <div className="ch-modal-icon-box">
        <FaInfoCircle />
      </div>
      <h3 className="ch-modal-title">Feature Coming Soon</h3>
      <p className="ch-modal-desc">
        We apologize, but the "My Reports" dashboard is currently under development. 
        <br /><br />
        Our team is working to bring you this feature as soon as possible to help you track your submissions effectively.
      </p>
      <button className="ch-modal-action-btn" onClick={onClose}>
        Understood
      </button>
    </div>
  </div>
);

// Componente Card per Feature (Statica / Informativa)
const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="ch-feature-card">
    <div className="ch-feature-icon">
      <Icon />
    </div>
    <div className="ch-feature-text">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  </div>
);

// Componente Card per Azioni (Interattiva)
const ActionCard = ({ title, description, onClick, icon: Icon }) => (
  <div className="ch-action-card clickable" onClick={onClick} role="button" tabIndex={0}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <h3 className="ch-action-title">{title}</h3>
        <p className="ch-action-desc">{description}</p>
      </div>
      <div className="ch-action-icon-wrapper">
        <Icon />
      </div>
    </div>
  </div>
);

// Componente Header
const PageHeader = ({ userName }) => (
  <header className="ch-header">
    <h1 className="ch-title">Welcome, {userName}!</h1>
    <p className="ch-subtitle">
      This is your dashboard for reporting urban issues directly to the Municipality.
      Your reports help us track and resolve problems faster.
    </p>
  </header>
);

// Componente Features Section
const FeaturesSection = () => (
  <div className="ch-features-section">
    <h2 className="ch-section-title">How it works</h2>
    <div className="ch-features-list">
      <FeatureCard
        icon={FaMapMarkedAlt}
        title="Create Reports"
        description="Select a point on the map, choose a category, and submit."
      />
      <FeatureCard
        icon={FaClipboardList}
        title="Track Status"
        description="Follow the status of your reports as they are processed."
      />
      <FeatureCard
        icon={FaBell}
        title="Get Notified"
        description="Receive updates about your reports instantly."
      />
    </div>
  </div>
);

// Componente Actions Section
const ActionsSection = ({ onNewReport, onMyReports }) => (
  <div className="ch-actions-section">
    <h2 className="ch-section-title">Quick Actions</h2>
    <ActionCard
      icon={FaArrowRight}
      title="Go to the Map"
      description="Submit a new issue (pothole, lighting, waste, etc.)."
      onClick={onNewReport}
    />
    <ActionCard
      icon={FaArrowRight}
      title="My Reports"
      description="View and manage all your past submissions."
      onClick={onMyReports}
    />
  </div>
);

// Main Component
const CitizenHome = ({ user }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  
  // Utilizzo first_name come da preferenza salvata
  const userName = user?.first_name || 'Citizen';

  const handleNewReport = () => navigate('/new-report');
  
  // Modificato per aprire la modale invece di navigare
  const handleMyReports = () => setShowModal(true);

  return (
    <div className="ch-wrapper">
      <PageHeader userName={userName} />
      
      <div className="ch-main-grid">
        <FeaturesSection />
        <ActionsSection 
          onNewReport={handleNewReport}
          onMyReports={handleMyReports}
        />
      </div>

      {showModal && <NotImplementedModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default CitizenHome;