import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- IMPORTO LE IMMAGINI COME MODULI ---
import iconMarker2x from "leaflet/dist/images/marker-icon-2x.png";
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// --- IMPORT API ---
import { getCurrentUser } from "../api/authApi";
import { updateReportStatus, assignToExternalUser } from "../api/reportApi";
import { getAllExternals } from "../api/municipalityUserApi";

import {
  FaTimes,
  FaUser,
  FaMapMarkerAlt,
  FaHardHat,
  FaCalendarAlt,
  FaTag,
  FaInfoCircle,
  FaCamera,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaMapMarkedAlt,
  FaExternalLinkAlt,
  FaPlay,
  FaPause,
  FaCheck,
  FaUserPlus,
  FaBuilding,
  FaMapPin,
  FaChevronDown, // Aggiunta icona chevron
} from "react-icons/fa";
import "../css/ReportDetails.css";

// --- Fix Leaflet Default Icon Issue ---
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconMarker2x,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});

const ReportDetails = ({
  show,
  onHide,
  report,
  user,
  onApprove,
  onReject,
  onStatusUpdate,
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // --- STATO UTENTE ---
  const [currentUserId, setCurrentUserId] = useState(null);

  // --- STATI PER EXTERNAL ASSIGNMENT ---
  const [externalUsers, setExternalUsers] = useState([]);
  const [loadingExternal, setLoadingExternal] = useState(false);
  // Nuovo stato per gestire l'animazione della freccina
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Stati per la gestione azioni
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [assignmentWarning, setAssignmentWarning] = useState("");

  // --- RESET LOGIC & FETCH USER ---
  useEffect(() => {
    if (show) {
      setIsRejecting(false);
      setRejectionReason("");
      setErrorMsg("");
      setAssignmentWarning("");
      setShowMap(false);
      setExternalUsers([]);
      setIsDropdownOpen(false); // Reset dropdown state

      const fetchCurrentUser = async () => {
        try {
          const userData = await getCurrentUser();
          if (userData && userData.id) {
            setCurrentUserId(userData.id);
          }
        } catch (error) {
          console.error("Error fetching current user:", error);
        }
      };
      fetchCurrentUser();
    }
  }, [show]);

  // --- USEMEMO ---
  const mapCoordinates = useMemo(() => {
    if (!report || !report.location) return null;
    const loc = report.location;

    if (loc.latitude && loc.longitude) {
      return [loc.latitude, loc.longitude];
    }
    if (loc.type === "Point" && Array.isArray(loc.coordinates)) {
      return [loc.coordinates[1], loc.coordinates[0]];
    }
    return null;
  }, [report]);

  // --- EARLY RETURN ---
  if (!report) return null;

  // --- LOGICA RUOLI ---
  const isExternalAssignee =
    currentUserId &&
    report.externalAssigneeId &&
    Number(currentUserId) === Number(report.externalAssigneeId);

  const isCurrentInternalAssignee =
    currentUserId &&
    report.assignee &&
    ((typeof report.assignee === "object" &&
      Number(report.assignee.id) === Number(currentUserId)) ||
      (typeof report.assignee === "number" &&
        Number(report.assignee) === Number(currentUserId)));

  const canManage =
    user &&
    (user.role_name === "Administrator" ||
      user.role_name.toLowerCase() === "municipal public relations officer");

  // --- Helpers ---
  const openImage = (imgUrl) => {
    setSelectedImage(imgUrl);
    setShowImageModal(true);
  };

  const formatLocation = () => {
    if (mapCoordinates)
      return `${mapCoordinates[0].toFixed(5)}, ${mapCoordinates[1].toFixed(5)}`;
    return "N/A";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getReporterName = () => {
    if (report.isAnonymous || report.is_anonymous) return "Anonymous User";
    if (report.reporter)
      return `${report.reporter.first_name} ${report.reporter.last_name}`;
    return "Unknown User";
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "status-success";
      case "rejected":
        return "status-danger";
      case "assigned":
        return "status-primary";
      case "pending approval":
        return "status-warning";
      case "in progress":
        return "status-info";
      case "suspended":
        return "status-suspended";
      default:
        return "status-default";
    }
  };

  const photos = report.photos
    ? report.photos.map((p) => (typeof p === "string" ? p : p.storageUrl))
    : report.images || [];

  // --- FETCH EXTERNAL USERS ---
  const handleDropdownToggle = async (isOpen) => {
    setIsDropdownOpen(isOpen); // Aggiorna lo stato per l'animazione della freccia

    if (isOpen && externalUsers.length === 0) {
      setLoadingExternal(true);
      try {
        const users = await getAllExternals(report.category);
        setExternalUsers(users || []);
      } catch (err) {
        console.error("Failed to load external users", err);
        setExternalUsers([]);
      } finally {
        setLoadingExternal(false);
      }
    }
  };

  const handleAssignToExternal = async (externalUser) => {
    try {

      console.log("ASSIGN TO EXTERNAL USER: ", externalUser);


      await assignToExternalUser(report.id, externalUser.id);
      if (onStatusUpdate) await onStatusUpdate();
      onHide();
    } catch (err) {
      setErrorMsg(err.message || "Failed to assign to external user.");
    }
  };

  const handleRejectClick = () => {
    setIsRejecting(true);
    setErrorMsg("");
    setAssignmentWarning("");
  };

  const handleCancelReject = () => {
    setIsRejecting(false);
    setRejectionReason("");
    setErrorMsg("");
  };

  const handleSubmitReject = async () => {
    if (!rejectionReason.trim()) {
      setErrorMsg("Please provide a reason for rejection.");
      return;
    }
    try {
      const success = await onReject(report.id, rejectionReason);
      if (success) onHide();
    } catch (err) {
      setErrorMsg(err.message || "Error rejecting report");
    }
  };

  const handleApproveClick = async () => {
    setAssignmentWarning("");
    setErrorMsg("");
    try {
      const result = await onApprove(report.id);
      if (result && result.error) {
        setErrorMsg(result.error);
        return;
      }
      onHide();
    } catch (error) {
      setErrorMsg(error.message || "Approval error.");
    }
  };

  const handleStatusChange = async (newStatus) => {
    setErrorMsg("");
    try {
      const result = await updateReportStatus(report.id, newStatus);
      if (result?.error) throw new Error(result.error);
      if (onStatusUpdate) await onStatusUpdate();
      onHide();
    } catch (error) {
      setErrorMsg(error.message || `Failed to update status to ${newStatus}`);
    }
  };

  return (
    <>
      <Modal
        show={show}
        onHide={onHide}
        size="xl"
        centered
        scrollable
        className="rdm-modal"
      >
        <Modal.Header className="rdm-header">
          <div className="rdm-header-content">
            <h2 className="rdm-title">{report.title}</h2>
            <div className="rdm-header-meta">
              <span className={`rdm-badge ${getStatusClass(report.status)}`}>
                {report.status || "Open"}
              </span>
              <span className="rdm-badge category">
                <FaTag className="rdm-badge-icon" /> {report.category}
              </span>
            </div>
          </div>
          <button className="rdm-close-btn" onClick={onHide}>
            <FaTimes />
          </button>
        </Modal.Header>

        <Modal.Body className="rdm-body">
          <div className="rdm-grid-layout">
            {/* LEFT COLUMN */}
            <div className="rdm-main-content d-flex flex-column">
              <div className="flex-grow-1">
                {/* REJECTION DISPLAY */}
                {report.status === "Rejected" &&
                  (report.rejectionReason || report.rejection_reason) && (
                    <div className="rdm-section mt-0 mb-4">
                      <h3
                        className="rdm-section-title"
                        style={{ color: "var(--rdm-danger)" }}
                      >
                        <FaExclamationTriangle /> Reason for Rejection
                      </h3>
                      <div className="rdm-rejection-display">
                        {report.rejectionReason || report.rejection_reason}
                      </div>
                    </div>
                  )}

                {/* DESCRIPTION */}
                <div className="rdm-section mt-0">
                  <h3 className="rdm-section-title">
                    <FaInfoCircle /> Description
                  </h3>
                  <div className="rdm-description-box">
                    {report.description || "No description provided."}
                  </div>
                </div>

                {/* EVIDENCE */}
                <div className="rdm-section">
                  <h3 className="rdm-section-title">
                    <FaCamera /> Evidence ({photos.length})
                  </h3>
                  {photos.length > 0 ? (
                    <div className="rdm-photo-grid">
                      {photos.map((photo, index) => (
                        <div
                          key={index}
                          className="rdm-photo-card"
                          onClick={() => openImage(photo)}
                        >
                          <img
                            src={photo}
                            alt={`Evidence ${index}`}
                            loading="lazy"
                          />
                          <div className="rdm-photo-overlay">
                            <span>View Fullscreen</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted fst-italic mt-2">
                      No images attached.
                    </p>
                  )}
                </div>

                {/* MAP */}
                <div className={`rdm-map-wrapper ${showMap ? "open" : ""}`}>
                  <h3 className="rdm-section-title mt-4">
                    <FaMapMarkedAlt /> Map Location
                  </h3>
                  <div className="rdm-map-container">
                    {showMap && mapCoordinates && (
                      <MapContainer
                        center={mapCoordinates}
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={mapCoordinates}>
                          <Popup>
                            <div className="rdm-map-popup">
                              <strong>{report.title}</strong>
                              <br />
                              <a
                                href={`http://googleusercontent.com/maps.google.com/?q=${mapCoordinates[0]},${mapCoordinates[1]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-link"
                                style={{
                                  color: "var(--rdm-brand)",
                                  fontWeight: "bold",
                                }}
                              >
                                <FaExternalLinkAlt
                                  style={{ marginRight: "5px" }}
                                />{" "}
                                Open in Google Maps
                              </a>
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    )}
                    {showMap && !mapCoordinates && (
                      <div className="d-flex align-items-center justify-content-center h-100 text-muted bg-light">
                        <FaExclamationCircle className="me-2" /> Location data
                        unavailable
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS & FOOTER */}
              <div className="mt-3">
                {assignmentWarning && (
                  <div className="rdm-alert rdm-alert-warning mb-2 py-2 px-3">
                    <div className="d-flex align-items-center gap-2">
                      <FaExclamationTriangle />
                      <span className="small">{assignmentWarning}</span>
                    </div>
                  </div>
                )}
                {errorMsg && (
                  <div className="rdm-alert rdm-alert-error mb-2 py-2 px-3">
                    <div className="d-flex align-items-center gap-2">
                      <FaExclamationCircle />
                      <span className="small">{errorMsg}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="rdm-footer-section mt-4 pt-3 border-top">
                {!isRejecting ? (
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="rdm-id-text text-muted font-monospace fw-bold">
                      ID: #{report.id}
                    </div>

                    <div className="d-flex gap-2">
                      {canManage && report.status === "Pending Approval" && (
                        <>
                          <Button
                            variant="outline-danger"
                            className="rdm-btn-action"
                            onClick={handleRejectClick}
                          >
                            <FaTimesCircle className="me-2" /> Reject
                          </Button>
                          <Button
                            variant="success"
                            className="rdm-btn-action"
                            onClick={handleApproveClick}
                          >
                            <FaCheckCircle className="me-2" /> Accept & Assign
                          </Button>
                        </>
                      )}

                      {isExternalAssignee && (
                        <>
                          {report.status === "Assigned" && (
                            <Button
                              className="rdm-btn-action rdm-btn-start"
                              onClick={() => handleStatusChange("In Progress")}
                            >
                              <FaPlay className="me-2" /> Start Work
                            </Button>
                          )}
                          {report.status === "Suspended" && (
                            <Button
                              className="rdm-btn-action rdm-btn-start"
                              onClick={() => handleStatusChange("In Progress")}
                            >
                              <FaPlay className="me-2" /> Resume Work
                            </Button>
                          )}
                          {report.status === "In Progress" && (
                            <>
                              <Button
                                className="rdm-btn-action rdm-btn-suspend"
                                onClick={() => handleStatusChange("Suspended")}
                              >
                                <FaPause className="me-2" /> Suspend
                              </Button>
                              <Button
                                className="rdm-btn-action rdm-btn-resolve"
                                onClick={() => handleStatusChange("Resolved")}
                              >
                                <FaCheck className="me-2" /> Resolve
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rdm-rejection-inline-container w-100 animate-fadeIn">
                    <div className="d-flex align-items-center mb-2 text-danger fw-bold small">
                      <FaExclamationTriangle className="me-2" /> Rejecting
                      Report
                    </div>
                    <Form.Group className="mb-2">
                      <Form.Control
                        as="textarea"
                        className={`rdm-reject-textarea ${errorMsg ? "is-invalid" : ""
                          }`}
                        rows={2}
                        placeholder="Enter reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        autoFocus
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <div className="rdm-id-text text-muted font-monospace fw-bold small">
                        ID: #{report.id}
                      </div>
                      <div className="d-flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rdm-btn-action px-3"
                          onClick={handleCancelReject}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="rdm-btn-action px-3"
                          onClick={handleSubmitReject}
                        >
                          Confirm Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Sidebar */}
            <div className="rdm-sidebar">
              <div className="rdm-info-card">
                <h4 className="rdm-card-label">Timeline</h4>
                <div className="rdm-info-row">
                  <div className="rdm-icon-box">
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <span className="rdm-label">Created</span>
                    <div className="rdm-value">
                      {formatDate(report.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rdm-info-card">
                <h4 className="rdm-card-label">Involved Parties</h4>

                {/* Reporter */}
                <div className="rdm-info-row">
                  <div className="rdm-icon-box">
                    <FaUser />
                  </div>
                  <div>
                    <span className="rdm-label">Reporter</span>
                    <div className="rdm-value highlight">
                      {getReporterName()}
                    </div>
                  </div>
                </div>

                {/* Assignee */}
                <div className="rdm-info-row">
                  <div className="rdm-icon-box assignee">
                    <FaHardHat />
                  </div>
                  <div>
                    <span className="rdm-label">Technician ID:</span>
                    <div className="rdm-value highlight">
                      {report.assignee ? (
                        report.assignee.id
                      ) : (
                        <span className="text-muted">Not assigned</span>
                      )}
                    </div>
                  </div>
                </div>


                <div className="rdm-info-row">
                  <div className="rdm-icon-box external">
                    <FaBuilding />
                  </div>
                  <div>
                    <span className="rdm-label">External ID:</span>
                    <div className="rdm-value highlight">
                      {report.externalAssigneeId ? (
                        report.externalAssigneeId
                      ) : (
                        <span className="text-muted">Not assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* === MODERN ASSIGN TO EXTERNAL DROPDOWN === */}
                {isCurrentInternalAssignee && (
                  <div className="mt-3 pt-3 border-top animate-fadeIn">
                    <span className="rdm-label mb-2">Delegate Task</span>

                    <Dropdown
                      onToggle={handleDropdownToggle}
                      className="rdm-dropdown-container"
                    >
                      {/* NOTA LE CLASSI QUI: d-flex justify-content-between align-items-center */}
                      <Dropdown.Toggle
                        className={`rdm-btn-external-assign w-100 d-flex justify-content-between align-items-center ${isDropdownOpen ? "active" : ""
                          }`}
                        variant="outline-dark"
                        id="external-assign-dropdown"
                      >
                        <span className="d-flex align-items-center gap-2">
                          <FaUserPlus /> Assign to External
                        </span>
                        {/* La chevron è l'ultimo elemento, quindi andrà a destra */}
                        <FaChevronDown
                          className={`rdm-chevron ${isDropdownOpen ? "rotate" : ""
                            }`}
                        />
                      </Dropdown.Toggle>

                      <Dropdown.Menu className="rdm-dropdown-menu shadow-lg border-0">
                        {loadingExternal ? (
                          <div className="rdm-loading-state">
                            <div
                              className="spinner-border spinner-border-sm text-primary me-2"
                              role="status"
                            />
                            Loading users...
                          </div>
                        ) : externalUsers.length > 0 ? (
                          <>
                            <div className="rdm-dropdown-header">
                              Select Contractor
                            </div>
                            <div className="rdm-dropdown-scroll-area">
                              {externalUsers.map((extUser) => (
                                <Dropdown.Item
                                  key={extUser.id}
                                  onClick={() =>
                                    handleAssignToExternal(extUser)
                                  }
                                  className="rdm-dropdown-item"
                                >
                                  <div className="d-flex align-items-center">
                                    <div className="rdm-avatar-circle me-3">
                                      {extUser.first_name.charAt(0)}
                                      {extUser.last_name.charAt(0)}
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">
                                      <div className="rdm-user-name text-truncate">
                                        {extUser.first_name} {extUser.last_name}
                                      </div>
                                      {extUser.company_name && (
                                        <div className="rdm-company-name text-truncate">
                                          <FaBuilding
                                            className="me-1"
                                            size={10}
                                          />
                                          {extUser.company_name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Dropdown.Item>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="rdm-empty-state">
                            No external users found.
                          </div>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                )}
              </div>

              <div className="rdm-info-card">
                <h4 className="rdm-card-label">Location Data</h4>

                {/* === NUOVO CAMPO: ADDRESS === */}
                <div className="rdm-info-row">
                  <div className="rdm-icon-box location">
                    <FaMapPin />
                  </div>
                  <div className="flex-grow-1">
                    {" "}
                    {/* Aggiunto flex-grow per gestire testi lunghi */}
                    <span className="rdm-label">Address</span>
                    <div className="rdm-value address-text">
                      {" "}
                      {/* Classe specifica aggiunta */}
                      {report.address ? (
                        report.address
                      ) : (
                        <span className="text-muted fst-italic">
                          Address not available
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* === CAMPO ESISTENTE: COORDINATES === */}
                <div className="rdm-info-row">
                  <div className="rdm-icon-box location">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <span className="rdm-label">Coordinates</span>
                    <div className="rdm-value font-monospace">
                      {formatLocation()}
                    </div>
                  </div>
                </div>

                <button
                  className={`rdm-btn-map-toggle ${showMap ? "active" : ""}`}
                  onClick={() => setShowMap(!showMap)}
                  disabled={!mapCoordinates}
                >
                  <FaMapMarkedAlt className="me-2" />
                  {showMap ? "Hide Map" : "Show Map"}
                </button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Lightbox */}
      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        centered
        className="rdm-lightbox"
        backdropClassName="rdm-lightbox-backdrop"
      >
        <div
          className="rdm-lightbox-container"
          onClick={() => setShowImageModal(false)}
        >
          <img
            src={selectedImage}
            alt="Full Detail"
            className="rdm-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </Modal>
    </>
  );
};

export default ReportDetails;