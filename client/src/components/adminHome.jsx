import { useState } from 'react';
import { Container, Row, Col, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { BsPersonFillGear, BsPersonFillAdd, BsGearFill } from 'react-icons/bs';
import MunicipalityUserForm from './MunicipalityUserForm';
import MunicipalityUserList from './MunicipalityUserList';

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState('users');
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUserCreated = (newUser) => {
    console.log("New user created:", newUser);
    setRefreshTrigger(prev => prev + 1);
    setShowForm(false);
    setActiveTab('users');
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <Container 
      style={{ 
        maxWidth: '1400px',
        padding: '2rem 3rem',
        minHeight: '100vh'
      }}
    >
      <h2 
          className="mb-2"
          style={{ 
            color: 'var(--primary)',
            fontWeight: 'var(--font-bold)',
            fontSize: 'var(--font-xxxl)'
          }}
        >
          Administrator Dashboard
        </h2>
        <p 
          className="text-muted mb-4" 
          style={{ fontSize: 'var(--font-base)' }}
        >
          Manage municipality users and their access to the platform
        </p>

          <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
                style={{ borderBottom: '2px solid var(--border-light)' }}
              >
                <Tab 
                  eventKey="users" 
                  title={
                    <span style={{ fontSize: 'var(--font-base)', fontWeight: 'var(--font-medium)' }}>
                      <BsPersonFillGear className="me-2" />
                      Manage Users
                    </span>
                  }
                >
                  <div className="pt-4">
                    <MunicipalityUserList refreshTrigger={refreshTrigger} />
                  </div>
                </Tab>
                
                <Tab 
                  eventKey="add-user" 
                  title={
                    <span style={{ fontSize: 'var(--font-base)', fontWeight: 'var(--font-medium)' }}>
                      <BsPersonFillAdd className="me-2" />
                      Add User
                    </span>
                  }
                >
                  <div className="pt-4">
                    <Row className="justify-content-center">
                      <Col lg={10} xl={9}>
                        <MunicipalityUserForm
                          onUserCreated={handleUserCreated}
                          onCancel={handleCancel}
                        />
                      </Col>
                    </Row>
                  </div>
                </Tab>

                <Tab 
                  eventKey="settings" 
                  title={
                    <span style={{ fontSize: 'var(--font-base)', fontWeight: 'var(--font-medium)' }}>
                      <BsGearFill className="me-2" />
                      Settings
                    </span>
                  }
                >
                  <div className="pt-4">
                    <Alert variant="info" style={{ borderRadius: 'var(--radius-lg)' }}>
                      <h5>Coming Soon</h5>
                      <p className="mb-0">Platform settings and configuration options will be available here.</p>
                    </Alert>
                  </div>
                </Tab>
              </Tabs>
    </Container>
  );
}