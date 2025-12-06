import { useState } from 'react';
import { Container, Tab, Nav } from 'react-bootstrap';

// Nuove icone importate da FontAwesome (Fa) e Material Design (Md)
import { 
  FaUserTie,      // Per "Officers List" (Professionale/Ufficio)
  FaUserPlus,     // Per "Add Officer"
  FaHardHat,      // Per "External Maintainers" (Lavoro sul campo/Manutenzione)
  FaBuilding,     // Per "Companies List"
  FaCog           // Per "Settings"
} from 'react-icons/fa';
import { MdAddBusiness } from 'react-icons/md'; // Specifica per "Add Company"

import MunicipalityUserForm from './MunicipalityUserForm';
import MunicipalityUserList from './MunicipalityUserList';
import ExternalMaintainerList from './ExternalMaintainerList'; 
import CompanyForm from './CompanyForm';
import CompanyList from './CompanyList';

import '../css/AdminHome.css';

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState('users');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Funzione unica per aggiornare le liste dopo creazioni/modifiche
  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
    // Opzionale: rimanda alla lista pertinente dopo l'aggiunta
    if (activeTab === 'add-user') setActiveTab('users');
    if (activeTab === 'add-company') setActiveTab('companies');
  };

  return (
    <Container fluid className="admin-home-container">
      <div className="admin-header-compact">
        <div>
          <h2 className="admin-title-modern">Admin Dashboard</h2>
          <p className="admin-subtitle-modern">Manage Municipality Officers & Externals</p>
        </div>
      </div>

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <div className="admin-layout-wrapper">
          {/* Sidebar Navigation */}
          <div className="admin-sidebar">
            <Nav variant="pills" className="flex-column modern-pills">
              
              {/* --- USERS SECTION --- */}
              <div className="admin-nav-group-label">Officers</div>
              <Nav.Item>
                <Nav.Link eventKey="users">
                  <FaUserTie className="me-2" /> Officers List
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link eventKey="add-user">
                  <FaUserPlus className="me-2" /> Add Officer
                </Nav.Link>
              </Nav.Item>

              <hr className="admin-nav-divider" />

              {/* --- EXTERNALS SECTION --- */}
              <div className="admin-nav-group-label">Externals</div>
              <Nav.Item>
                <Nav.Link eventKey="externals">
                  <FaHardHat className="me-2" /> Maintainers List
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link eventKey="companies">
                  <FaBuilding className="me-2" /> Companies Registry
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link eventKey="add-company">
                  <MdAddBusiness className="me-2" style={{ fontSize: '1.1em' }} /> Add Company
                </Nav.Link>
              </Nav.Item>

              <hr className="admin-nav-divider" />

              {/* --- SYSTEM SECTION --- */}
              <Nav.Item>
                <Nav.Link eventKey="settings">
                  <FaCog className="me-2" /> Settings
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          {/* Main Content Area */}
          <div className="admin-content">
            <Tab.Content>
              {/* TAB 1: OFFICERS LIST */}
              <Tab.Pane eventKey="users">
                <div className="content-card">
                  <MunicipalityUserList refreshTrigger={refreshTrigger} />
                </div>
              </Tab.Pane>

              {/* TAB 2: ADD OFFICER */}
              <Tab.Pane eventKey="add-user">
                <MunicipalityUserForm 
                  onUserCreated={handleDataUpdate}
                  onCancel={() => setActiveTab('users')} 
                />
              </Tab.Pane>

              {/* TAB 3: EXTERNAL MAINTAINERS LIST */}
              <Tab.Pane eventKey="externals">
                <div className="content-card">
                  <ExternalMaintainerList refreshTrigger={refreshTrigger} />
                </div>
              </Tab.Pane>

              {/* TAB 4: COMPANIES LIST */}
              <Tab.Pane eventKey="companies">
                <CompanyList refreshTrigger={refreshTrigger} />
              </Tab.Pane>

              {/* TAB 5: ADD COMPANY */}
              <Tab.Pane eventKey="add-company">
                {/* Passiamo handleDataUpdate così il form può triggerare il refresh */}
                <CompanyForm refreshTrigger={handleDataUpdate} />
              </Tab.Pane>

              {/* TAB 6: SETTINGS */}
              <Tab.Pane eventKey="settings">
                <div className="content-card">
                  <div className="p-5 text-center text-muted">
                    <FaCog style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
                    <h5>Coming Soon</h5>
                    <p>System configuration panel is under construction.</p>
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