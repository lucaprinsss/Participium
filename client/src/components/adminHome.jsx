import { useState } from 'react';
import { Container, Row, Col, Alert, Tabs, Tab } from 'react-bootstrap';
import { BsPersonFillGear, BsPersonFillAdd, BsGearFill } from 'react-icons/bs';
import MunicipalityUserForm from './municipalityUserForm';
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
    <Container className="admin-home-container">
      <div className="admin-header-modern">
        <h2 className="admin-title-modern">
          Administrator Dashboard
        </h2>
        <p className="admin-subtitle-modern">
          Manage municipality users and their access to the platform
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={setActiveTab}
        className="modern-tabs"
      >
        <Tab
          eventKey="users"
          title={
            <span className="modern-tab-title">
              <BsPersonFillGear className="me-2" />
              Manage Officers
            </span>
          }
        >
          <div className="tab-content-wrapper">
            <MunicipalityUserList refreshTrigger={refreshTrigger} />
          </div>
        </Tab>

        <Tab
          eventKey="add-user"
          title={
            <span className="modern-tab-title">
              <BsPersonFillAdd className="me-2" />
              Add Officer
            </span>
          }
        >
          <div className="tab-content-wrapper">
            <Row className="justify-content-center">
              <Col lg={12} xl={11}> 
                <MunicipalityUserForm
                  onUserCreated={handleUserCreated}
                />
              </Col>
            </Row>
          </div>
        </Tab>

        <Tab
          eventKey="settings"
          title={
            <span className="modern-tab-title">
              <BsGearFill className="me-2" />
              Settings
            </span>
          }
        >
          <div className="tab-content-wrapper">
            <Alert variant="info" className="modern-alert">
              <h5 className="modern-alert-title">Coming Soon</h5>
              <p className="modern-alert-text">Platform settings and configuration options will be available here.</p>
            </Alert>
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
}