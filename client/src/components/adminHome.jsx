import React from 'react';
import '../css/homepage.css';

export default function AdminHome() {
  return (
    <div className="citizen-home-wrapper">
      <div className="ch-card">
        <h2 className="ch-title">Administrator Dashboard</h2>

        <p className="ch-intro">
          This area is reserved for municipality staff and administrators. Here you will be able to:
        </p>

        <h3 className="ch-subtitle">Admin capabilities (planned)</h3>
        <ul className="ch-list">
          <li>Review and validate incoming reports (approve/reject)</li>
          <li>Assign reports to technical offices and track progress</li>
          <li>Update report statuses and add internal notes</li>
          <li>View administrative statistics and export data</li>
          <li>Send messages/notifications to reporters</li>
        </ul>

        <div className="ch-notice">
          <strong>Notice:</strong> administrative features are not implemented yet.
          Functionality such as report approval, assignment and status updates will be
          available in a future release.
        </div>

        <div className="ch-actions">
          <button className="ch-btn-disabled" disabled>Manage reports (unavailable)</button>
          <button className="ch-btn-disabled" disabled>View statistics (unavailable)</button>
        </div>

        <p className="ch-help">
          When administrative capabilities are activated you will see additional tools and menus
          here to manage reported issues and monitor service performance.
        </p>
      </div>
    </div>
  );
}
