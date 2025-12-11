import React from 'react';
import PropTypes from 'prop-types'; // Importato per la validazione delle props
import "../css/LoadingScreen.css";

const LoadingScreen = ({ message = "Loading the page..." }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
};

// Aggiunta la validazione delle props
LoadingScreen.propTypes = {
  // La prop 'message' è opzionale e deve essere una stringa.
  message: PropTypes.string,
};

export default LoadingScreen;