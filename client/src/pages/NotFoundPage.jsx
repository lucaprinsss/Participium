import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaSearchLocation, FaExclamationTriangle } from 'react-icons/fa';
import '../css/NotFoundPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="nf-page">
      {/* Background Decorativo (Pattern astratto) */}
      <div className="nf-bg-pattern"></div>
      
      <div className="nf-card glass-panel">
        <div className="nf-content">
          <div className="nf-header">
            <div className="nf-error-code">
              <span>4</span>
              <div className="nf-icon-container">
                <FaExclamationTriangle className="nf-floating-icon" />
                <div className="nf-icon-shadow"></div>
              </div>
              <span>4</span>
            </div>
            
            <h1 className="nf-title">Outside the Borders</h1>
            <p className="nf-description">
              It appears you've wandered into an unmapped area of Turin. This page either doesn't exist or has been moved.
            </p>
          </div>

          <div className="nf-actions">
            <button 
              className="nf-btn primary" 
              onClick={() => navigate('/home')}
            >
              <FaHome className="nf-btn-icon" /> Torna alla Home
            </button>

          </div>
        </div>

        {/* Lato Visuale (Abstract Map) */}
        <div className="nf-visual">
          <div className="nf-map-abstract">
            <FaSearchLocation className="nf-map-icon big" />
            <div className="nf-circle c1"></div>
            <div className="nf-circle c2"></div>
            <div className="nf-circle c3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}