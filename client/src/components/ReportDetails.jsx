import React, { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types"; // Importato per la validazione delle props
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
// COMPONENTE FITTIZIO: TOAST MESSAGE (Estesa per matchare lo stile MapPage)
// -------------------------------------------------------------------------
const ToastMessage = ({ message, type, onClose }) => {
  useEffect(() => {
    // MODIFICA QUI: 2000 ms = 2 secondi
    const timer = setTimeout(() => {
      onClose();
    }, 2000); 
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIconAndClass = (msgType) => {
    switch (msgType) {
      case 'error': return { icon: <FaTimesCircle />, className: 'error' };
      case 'warning': return { icon: <FaExclamationTriangle />, className: 'warning' };
      case 'info': return { icon: <FaInfoCircle />, className: 'info' };
      case 'success': default: return { icon: <FaCheckCircle />, className: 'success' };
    }
  };

  const { icon, className } = getIconAndClass(type);

  // Stili replicati da MapPage.css per il componente mp-notification
  return (
    <div className={`mp-notification ${className}`}>
        <div className="mp-notification-content">
            {icon && <span className="mp-notification-icon">{icon}</span>}
            <span className="mp-notification-message">{message}</span>
            <button 
                onClick={onClose} 
                aria-label="Close notification"
                style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: '10px', cursor: 'pointer', fontSize: '1rem' }}
            >
                <FaTimes />
            </button>
        </div>
    </div>
  );
};

// VALIDAZIONE PROPS PER TOASTMESSAGE
ToastMessage.propTypes = {
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
    onClose: PropTypes.func.isRequired,
};
// -------------------------------------------------------------------------

const ReportDetails = ({
  show,
  onHide,
  report: initialReport, // Rinomino la prop per usare lo stato locale
  user,
  onApprove,
  onReject,
  onStatusUpdate,
  onReportUpdated,
}) => {
  // NUOVO STATO: Mantiene il report aggiornato all'interno della modale
  const [report, setReport] = useState(initialReport); 
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
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
    // Nascondi il precedente prima di mostrarne uno nuovo per evitare sovrapposizioni
    setToast({ show: false, message: "", type: "" }); 
    // Un piccolo ritardo per permettere l'animazione di chiusura (opzionale)
    setTimeout(() => setToast({ show: true, message, type }), 100); 
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: "", type: "" });
  }, []);

  // Sync dello stato locale quando la prop esterna cambia (necessario per l'aggiornamento)
  useEffect(() => {
    setReport(initialReport);
  }, [initialReport]);
  
  // Funzione per aggiornare lo stato del report localmente E notificare il genitore
  const handleReportUpdate = (reportId, updates) => {
    setReport(prev => ({ ...prev, ...updates }));
    if (onReportUpdated) onReportUpdated(reportId, updates);
  };


  // Reset e fetch User ID e Ruolo
  useEffect(() => {
    if (show) {
      setShowMap(false);
      hideToast(); // Nasconde eventuali toast precedenti all'apertura
      
      const fetchCurrentUser = async () => {
        try {
          const userData = await getCurrentUser();
          if (userData && userData.id) {
            setCurrentUserId(userData.id);
            setCurrentUserRole(userData.role_name || userData.role || 'citizen');
          } else {
            setCurrentUserId(null);
            setCurrentUserRole('citizen');
          }
        } catch (error) { 
          console.error("Error fetching user:", error);
          setCurrentUserId(null);
          setCurrentUserRole('citizen');
        }
      };
      fetchCurrentUser();
    } else {
        setCurrentUserId(null);
        setCurrentUserRole(null);
    }
  }, [show, hideToast]); 

  const isCitizen = currentUserRole?.toLowerCase() === 'citizen';
  const showRestrictedContent = !isCitizen && currentUserRole !== null;

  const mapCoordinates = useMemo(() => {
    if (!report || !report.location) return null;
    const loc = report.location;
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
              onReportUpdated={handleReportUpdate} // Usa il gestore locale
              onHide={onHide}
              onOpenImage={(img) => { setSelectedImage(img); setShowImageModal(true); }}
              showMap={showMap && showRestrictedContent}
              mapCoordinates={mapCoordinates}
              showToast={showToast}
              showComments={showRestrictedContent}
            />

            {/* --- RIGHT COLUMN: SIDEBAR --- */}
            <ReportSidebar 
              report={report}
              currentUserId={currentUserId}
              onReportUpdated={handleReportUpdate} // Usa il gestore locale
              onStatusUpdate={onStatusUpdate}
              showMap={showMap}
              setShowMap={setShowMap}
              mapCoordinates={mapCoordinates}
              showToast={showToast}
              isCitizen={isCitizen}
            />
            
          </div>
        </Modal.Body>
      </Modal>

      {/* Lightbox for Images */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered className="rdm-lightbox" backdropClassName="rdm-lightbox-backdrop">
        <div className="rdm-lightbox-container">
          <img 
            src={selectedImage} 
            alt="Full Detail" 
            className="rdm-lightbox-img" 
          />
        </div>
      </Modal>
      
      {/* MESSAGGIO TOAST PERSONALIZZATO */}
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

// VALIDAZIONE PROPS PER REPORTDETAILS
ReportDetails.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    // La prop 'report' è cruciale e deve essere un oggetto
    report: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        title: PropTypes.string.isRequired,
        status: PropTypes.string,
        category: PropTypes.string,
        location: PropTypes.object,
        // ... altre proprietà di report
    }).isRequired,
    user: PropTypes.object, // Oggetto utente generico
    onApprove: PropTypes.func.isRequired,
    onReject: PropTypes.func.isRequired,
    onStatusUpdate: PropTypes.func.isRequired,
    onReportUpdated: PropTypes.func, // Può essere opzionale se non è sempre necessario notificare il genitore
};

export default ReportDetails;