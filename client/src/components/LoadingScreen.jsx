import React from 'react';
import "../css/LoadingScreen.css"; // Assicurati di creare questo file CSS

const LoadingScreen = ({ message = "Loading the page..." }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
};

export default LoadingScreen;