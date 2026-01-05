import React from 'react';
import PropTypes from 'prop-types'; // Imported for props validation
import "../css/LoadingScreen.css";

const LoadingScreen = ({ message = "Loading the page..." }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
};

// Added props validation
LoadingScreen.propTypes = {
  // The 'message' prop is optional and must be a string.
  message: PropTypes.string,
};

export default LoadingScreen;