import { useNavigate } from 'react-router-dom';
import { 
  FaMapMarkedAlt, 
  FaClipboardList, 
  FaBell,
  FaArrowRight 
} from "react-icons/fa";
import '../css/CitizenHome.css';

// Componente Card per Feature
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

// Componente Card per Azioni
const ActionCard = ({ title, description, onClick, icon: Icon }) => (
  <div className="ch-action-card clickable" onClick={onClick} role="button" tabIndex={0}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <h3 className="ch-action-title">{title}</h3>
        <p className="ch-action-desc">{description}</p>
      </div>
      <Icon style={{ color: 'var(--brand-red)', fontSize: '1.2rem' }} />
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
    <h2 className="ch-section-title">What you can do</h2>
    <div className="ch-features-list">
      <FeatureCard
        icon={FaMapMarkedAlt}
        title="Create Reports"
        description="Select a point on the map, choose a category, and add photos to submit a new report."
      />
      <FeatureCard
        icon={FaClipboardList}
        title="Track Status"
        description="Follow the status of your reports as they are processed, reviewed, and resolved by the city."
      />
      <FeatureCard
        icon={FaBell}
        title="Get Notified"
        description="Receive updates and notifications about your reports via email or Telegram (if configured)."
      />
    </div>
  </div>
);

// Componente Actions Section
const ActionsSection = ({ onNewReport, onMyReports }) => (
  <div className="ch-actions-section">
    <h2 className="ch-section-title">Your Tools</h2>
    <ActionCard
      icon={FaArrowRight}
      title="New Report"
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
  const userName = user?.first_name || 'Citizen';

  const handleNewReport = () => navigate('/new-report');
  const handleMyReports = () => navigate('/my-reports');

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
    </div>
  );
};

export default CitizenHome;