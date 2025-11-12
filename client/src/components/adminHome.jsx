import React, { useState } from 'react';
import MunicipalityUserForm from './MunicipalityUserForm';
import MunicipalityUserList from './MunicipalityUserList';
import '../css/AdminHome.css';

export default function AdminHome() {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUserCreated = (newUser) => {
    console.log("New user created:", newUser);
    setRefreshTrigger(prev => prev + 1);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="admin-home-container">

      {showForm ? (
        <MunicipalityUserForm
          onUserCreated={handleUserCreated}
          onCancel={handleCancel}
        />
      ) : (
        <> 
          <header className="admin-header">
            <h2 className="admin-title">Dashboard Amministratore</h2>
            <p className="admin-intro">
              Manage municipality users and their access to the platform.
            </p>
          </header>

          <main>
            <div className="admin-controls">
              <h3 className="admin-section-title">Manage Users</h3>

              <button
                className="admin-btn"
                onClick={() => setShowForm(true)}
              >
                Add New User
              </button>

            </div>

            <MunicipalityUserList refreshTrigger={refreshTrigger} />
          </main>
        </>
      )}
    </div>
  );
}