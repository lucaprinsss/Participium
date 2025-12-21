import React, { useState } from 'react';
import PropTypes from 'prop-types'; // Importato per la validazione delle props
import { useNavigate } from 'react-router-dom';
import {
  FaMapMarkedAlt,
  FaClipboardList,
  FaBell,
  FaArrowRight,
  FaInfoCircle,
  FaTimes,
  FaTelegram
} from "react-icons/fa";
import '../css/CitizenHome.css';
import TelegramLinkModal from './TelegramLinkModal';

// Componente Modale per feature non implementata
const NotImplementedModal = ({ onClose }) => (
  // Correzione riga 16: Overlay. È interattivo (chiude la modale)
  <div
    className="ch-modal-overlay"
    onClick={onClose}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Escape') { // Aggiunta gestione ESC per accessibilità standard
        onClose();
      }
    }}
  >
    {/* Correzione riga 17: Contenuto della Modale. NON è interattivo, serve solo a fermare la propagazione. */}
    <div
      className="ch-modal-content"
      onClick={(e) => e.stopPropagation()}
      role="presentation" 
      tabIndex={-1} 
    >
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

// Aggiunta validazione props (S6774 per riga 15)
NotImplementedModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

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

// Aggiunta validazione props (S6774 per riga 38)
FeatureCard.propTypes = {
  icon: PropTypes.elementType.isRequired, // icon non usato direttamente ma come Icon
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

// Componente Card per Azioni (Interattiva)
const ActionCard = ({ title, description, onClick, icon: Icon }) => (
  // Correzione S6848, S1082 (Riga 53): Aggiunta gestione tastiera per l'interazione
  <div
    className="ch-action-card clickable"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
  >
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

ActionCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

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

PageHeader.propTypes = {
  userName: PropTypes.string.isRequired,
};

// Componente Features Section (non ha props, non serve propTypes)
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
const ActionsSection = ({ onNewReport, onMyReports, onTelegramLink }) => (
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
    <ActionCard
      icon={FaTelegram}
      title="Link Telegram"
      description="Connect your Telegram account for easy reporting."
      onClick={onTelegramLink}
    />
  </div>
);

ActionsSection.propTypes = {
  onNewReport: PropTypes.func.isRequired,
  onMyReports: PropTypes.func.isRequired,
  onTelegramLink: PropTypes.func.isRequired,
};

// Main Component
const CitizenHome = ({ user }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  // Utilizzo first_name come da preferenza salvata
  const userName = user?.first_name || 'Citizen';

  const handleNewReport = () => navigate('/new-report');

  // Modificato per aprire la modale invece di navigare
  const handleMyReports = () => setShowModal(true);

  const handleTelegramLink = () => setShowTelegramModal(true);

  return (
    <div className="ch-wrapper">
      <PageHeader userName={userName} />

      <div className="ch-main-grid">
        <FeaturesSection />
        <ActionsSection
          onNewReport={handleNewReport}
          onMyReports={handleMyReports}
          onTelegramLink={handleTelegramLink}
        />
      </div>

      {showModal && <NotImplementedModal onClose={() => setShowModal(false)} />}
      {showTelegramModal && <TelegramLinkModal onClose={() => setShowTelegramModal(false)} />}
    </div>
  );
};

CitizenHome.propTypes = {
  user: PropTypes.shape({
    first_name: PropTypes.string,
  }).isRequired,
};

export default CitizenHome;