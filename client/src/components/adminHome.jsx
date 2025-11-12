import React, { useState } from 'react';
import MunicipalityUserForm from './municipalityUserForm';
import MunicipalityUserList from './municipalityUserList';
import '../css/homepage.css';

export default function AdminHome() {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUserCreated = (newUser) => {
    console.log("New user created:", newUser);
    // Trigger refresh of the user list
    setRefreshTrigger(prev => prev + 1);
    // Optionally hide the form after creation
    setShowForm(false);
  };

  return (
    <div className="citizen-home-wrapper">
      <div className="ch-card">
        <h2 className="ch-title">System Administrator Dashboard</h2>

        <p className="ch-intro">
          As a system administrator, you can manage municipality users and their access to the platform.
        </p>

        <h3 className="ch-subtitle">User Management</h3>
        <ul className="ch-list">
          <li>Create new municipality user accounts</li>
          <li>Edit existing user information and credentials</li>
          <li>Delete user accounts</li>
          <li>View list of all municipality users</li>
        </ul>

        <div className="ch-actions">
          <button 
            className="ch-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Hide Form" : "Add New User"}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ marginTop: '24px' }}>
          <MunicipalityUserForm onUserCreated={handleUserCreated} />
        </div>
      )}

      <MunicipalityUserList refreshTrigger={refreshTrigger} />
    </div>
  );
}
