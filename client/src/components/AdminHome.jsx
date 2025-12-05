import { useState } from 'react';
import { Container, Tab, Nav } from 'react-bootstrap';
import { BsPersonFillGear, BsPersonFillAdd, BsGearFill } from 'react-icons/bs';
import MunicipalityUserForm from './MunicipalityUserForm';
import MunicipalityUserList from './MunicipalityUserList';
import '../css/AdminHome.css';

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState('users');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUserCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('users');
  };

  return (
    <Container fluid className="admin-home-container">
      <div className="admin-header-compact">
        <div>
          <h2 className="admin-title-modern">Admin Dashboard</h2>
          <p className="admin-subtitle-modern">Manage Municipality Officers</p>
        </div>
      </div>

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <div className="admin-layout-wrapper">
          {/* Sidebar Navigation for better horizontal space usage */}
          <div className="admin-sidebar">
            <Nav variant="pills" className="flex-column modern-pills">
              <Nav.Item>
                <Nav.Link eventKey="users">
                  <BsPersonFillGear className="me-2" /> Officers List
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="add-user">
                  <BsPersonFillAdd className="me-2" /> Add Officer
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="settings">
                  <BsGearFill className="me-2" /> Settings
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          {/* Main Content Area */}
          <div className="admin-content">
            <Tab.Content>
              <Tab.Pane eventKey="users">
                <div className="content-card">
                  <MunicipalityUserList refreshTrigger={refreshTrigger} />
                </div>
              </Tab.Pane>

              <Tab.Pane eventKey="add-user">
                {/* Rimuovi eventuali div con padding qui intorno */}
                <MunicipalityUserForm
                  onUserCreated={handleUserCreated}
                  onCancel={() => setActiveTab('users')}
                />
              </Tab.Pane>

              <Tab.Pane eventKey="settings">
                <div className="content-card">
                  <div className="p-4 text-center text-muted">
                    <h5>Coming Soon</h5>
                    <p>Configuration panel under construction.</p>
                  </div>
                </div>
              </Tab.Pane>
            </Tab.Content>
          </div>
        </div>
      </Tab.Container>
    </Container>
  );
}