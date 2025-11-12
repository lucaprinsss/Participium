import React from 'react';
import '../css/homepage.css';

export default function CitizenHome({ user }) {
  return (
    <div className="citizen-home-wrapper">
      <div className="ch-card">
        <h2 className="ch-title">Citizen Dashboard</h2>
        <p className="ch-intro">
          Report urban issues (potholes, lighting, waste, etc.) directly to the Municipality. 
          Your reports help city services track and resolve problems faster.
        </p>

        <h3 className="ch-subtitle">What you can do</h3>
        <ul className="ch-list">
          <li>Create new reports by selecting a point on the map, choosing a category and adding photos</li>
          <li>Track the status of your reports and receive updates</li>
          <li>Receive notifications by email or Telegram (if configured)</li>
        </ul>

        <div className="ch-notice">
          <strong>Notice:</strong> some features are not yet available in this version.
          We are working to enable them soon. Report submission and management options may
          not work at this time.
        </div>

        <div className="ch-actions">
          <button className="ch-btn-disabled" disabled>New report (unavailable)</button>
          <button className="ch-btn-disabled" disabled>My reports (unavailable)</button>
        </div>

        <p className="ch-help">
          For assistance, contact the Municipality support or check the Help section. When features
          are activated you will see interactive map and action buttons here.
        </p>
      </div>
    </div>
  );
}
