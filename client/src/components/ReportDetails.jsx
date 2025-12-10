import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "react-bootstrap";
import { FaTag, FaTimes } from "react-icons/fa";
import { getCurrentUser } from "../api/authApi";
import ReportMainContent from "./ReportMainContent";
import ReportSidebar from "./ReportSidebar";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
// Fix Leaflet icons (come prima)
import iconMarker2x from "leaflet/dist/images/marker-icon-2x.png";
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: iconMarker2x, iconUrl: iconMarker, shadowUrl: iconShadow });

import "../css/ReportDetails.css";

const ReportDetails = ({
  show,
  onHide,
  report,
  user, // Passato dal padre o fetched
  onApprove,
  onReject,
  onStatusUpdate,
  onReportUpdated,
}) => {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMap, setShowMap] = useState(false); // Stato mappa sollevato per sidebar toggle

  // Reset e fetch User ID
  useEffect(() => {
    if (show) {
      setShowMap(false);
      const fetchCurrentUser = async () => {
        try {
          const userData = await getCurrentUser();
          if (userData && userData.id) setCurrentUserId(userData.id);
        } catch (error) { console.error("Error fetching user:", error); }
      };
      fetchCurrentUser();
    }
  }, [show]);

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
              onReportUpdated={onReportUpdated}
              onHide={onHide}
              onOpenImage={(img) => { setSelectedImage(img); setShowImageModal(true); }}
              showMap={showMap}
              mapCoordinates={mapCoordinates}
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
    </>
  );
};

export default ReportDetails;