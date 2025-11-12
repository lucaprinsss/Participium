import React from 'react';
import '../css/homepage.css';

export default function MunicipalityUserHome({ user }) {
  return (
    <div className="citizen-home-wrapper">
      <div className="ch-card">
        <h2 className="ch-title">Municipality Staff Dashboard</h2>

        <p className="ch-intro">
          Welcome, <strong>{user.first_name} {user.last_name}</strong> ({user.role})! 
          As a municipality staff member, you have access to manage and process citizen reports based on your role.
        </p>
      </div>
    </div>
  );
}
