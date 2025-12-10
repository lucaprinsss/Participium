import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Modal } from "react-bootstrap";
import { FaTag, FaTimes, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaInfoCircle } from "react-icons/fa";
import { getCurrentUser } from "../api/authApi";
import ReportMainContent from "./ReportMainContent";
import ReportSidebar from "./ReportSidebar";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
// Fix Leaflet icons
import iconMarker2x from "leaflet/dist/images/marker-icon-2x.png";
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Configurazione standard Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: iconMarker2x, iconUrl: iconMarker, shadowUrl: iconShadow });

import "../css/ReportDetails.css";

// -------------------------------------------------------------------------
// COMPONENTE FITTIZIO: TOAST MESSAGE (Da definire in un file separato)
// -------------------------------------------------------------------------
const ToastMessage = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIconAndClass = (msgType) => {
    switch (msgType) {
      case 'error': return { icon: <FaTimesCircle />, className: 'rdm-alert-error' };
      case 'warning': return { icon: <FaExclamationTriangle />, className: 'rdm-alert-warning' };
      case 'info': return { icon: <FaInfoCircle />, className: 'rdm-alert-info' };
      case 'success': default: return { icon: <FaCheckCircle />, className: 'rdm-alert-success' };
    }
  };

  const { icon, className } = getIconAndClass(type);

  const toastStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    maxWidth: '400px',
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div style={toastStyle} className={`rdm-alert ${className} animate-fadeIn`}>
      <span style={{ marginRight: '10px', fontSize: '1.2rem' }}>{icon}</span>
      <div style={{ flexGrow: 1 }}>{message}</div>
      <button 
        onClick={onClose} 
        style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: '10px', cursor: 'pointer', fontSize: '1rem' }}
      >
        <FaTimes />
      </button>
    </div>
  );
};
// -------------------------------------------------------------------------

const ReportDetails = ({
  show,
  onHide,
  report,
  user,
  onApprove,
  onReject,
  onStatusUpdate,
  onReportUpdated,
}) => {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
  // STATO PER GESTIRE I POP-UP (TOAST)
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  /**
   * Funzione per visualizzare il Toast/Notifica personalizzato.
   * @param {string} message - Il messaggio da mostrare.
   * @param {'success'|'error'|'warning'|'info'} type - Il tipo di notifica.
   */
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: "", type: "" });
  }, []);


  // Reset e fetch User ID
  useEffect(() => {
    if (show) {
      setShowMap(false);
      hideToast(); // Nasconde eventuali toast precedenti all'apertura
      const fetchCurrentUser = async () => {
        try {
          const userData = await getCurrentUser();
          if (userData && userData.id) setCurrentUserId(userData.id);
        } catch (error) { 
          console.error("Error fetching user:", error);
          // Usa il toast in caso di errore critico (es. fetch user)
          showToast("Impossibile recuperare l'utente corrente.", "error"); 
        }
      };
      fetchCurrentUser();
    }
  }, [show, hideToast, showToast]); // Dipendenze aggiornate

  const mapCoordinates = useMemo(() => {
    if (!report || !report.location) return null;
    const loc = report.location;
    // Gestione di diversi formati di coordinate (GeoJSON Point [lng, lat] o oggetti lat/lng)
    if (loc.latitude && loc.longitude) return [loc.latitude, loc.longitude];
    if (loc.type === "Point" && Array.isArray(loc.coordinates)) return [loc.coordinates[1], loc.coordinates[0]];
    return null;
  }, [report]);

  if (!report) return null;

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved": return "status-success";
      case "rejected": return "status-danger";
      case "assigned": return "status-primary";
      case "pending approval": return "status-warning";
      case "in progress": return "status-info";
      case "suspended": return "status-suspended";
      default: return "status-default";
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered scrollable className="rdm-modal">
        <Modal.Header className="rdm-header">
          <div className="rdm-header-content">
            <h2 className="rdm-title">{report.title}</h2>
            <div className="rdm-header-meta">
              <span className={`rdm-badge ${getStatusClass(report.status)}`}>{report.status || "Open"}</span>
              <span className="rdm-badge category"><FaTag className="rdm-badge-icon" /> {report.category}</span>
            </div>
          </div>
          <button className="rdm-close-btn" onClick={onHide}><FaTimes /></button>
        </Modal.Header>

        <Modal.Body className="rdm-body">
          <div className="rdm-grid-layout">
            
            {/* --- LEFT COLUMN: GENERAL DETAILS & COMMENTS --- */}
            <ReportMainContent 
              report={report}
              user={user}
              currentUserId={currentUserId}
              onApprove={onApprove}
              onReject={onReject}
              onStatusUpdate={onStatusUpdate}
              onReportUpdated={onReportUpdated}
              onHide={onHide}
              onOpenImage={(img) => { setSelectedImage(img); setShowImageModal(true); }}
              showMap={showMap}
              mapCoordinates={mapCoordinates}
              showToast={showToast} // Passa la funzione Toast
            />

            {/* --- RIGHT COLUMN: SIDEBAR --- */}
            <ReportSidebar 
              report={report}
              currentUserId={currentUserId}
              onReportUpdated={onReportUpdated}
              onStatusUpdate={onStatusUpdate}
              showMap={showMap}
              setShowMap={setShowMap}
              mapCoordinates={mapCoordinates}
              showToast={showToast} // Passa la funzione Toast
            />
            
          </div>
        </Modal.Body>
      </Modal>

      {/* Lightbox for Images */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered className="rdm-lightbox" backdropClassName="rdm-lightbox-backdrop">
        <div className="rdm-lightbox-container" onClick={() => setShowImageModal(false)}>
          <img src={selectedImage} alt="Full Detail" className="rdm-lightbox-img" onClick={(e) => e.stopPropagation()} />
        </div>
      </Modal>
      
      {/* 💥 NUOVO: MESSAGGIO TOAST PERSONALIZZATO 💥 */}
      {toast.show && (
        <ToastMessage 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
    </>
  );
};

export default ReportDetails;