import React, { useState } from "react";
import PropTypes from "prop-types";
import { Button, Form } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
    FaExclamationTriangle, FaInfoCircle, FaCamera, FaMapMarkedAlt, FaExternalLinkAlt,
    FaExclamationCircle, FaTimesCircle, FaCheckCircle, FaPlay, FaPause, FaCheck
} from "react-icons/fa";
import ReportComments from "./ReportComments";
import { updateReportStatus } from "../api/reportApi";

const ReportMainContent = ({
    report,
    user,
    currentUserId,
    onApprove,
    onReject,
    onReportUpdated,
    onOpenImage,
    onHide,
    showMap,
    mapCoordinates,
    showComments,
    showToast
}) => {
    // Stati per le azioni
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [validationError, setValidationError] = useState("");
    const [assignmentWarning, setAssignmentWarning] = useState("");

    const photos = report?.photos // Controllato
        ? report.photos.map((p) => (typeof p === "string" ? p : p.storageUrl))
        : report?.images || []; // Controllato

    const canManage = user && (user.role_name === "Administrator" || user.role_name.toLowerCase() === "municipal public relations officer");

    // FIX: Aggiunto optional chaining per report.externalAssigneeId
    const isExternalAssignee = currentUserId && report?.externalAssigneeId && Number(currentUserId) === Number(report.externalAssigneeId);


    // Handlers Azioni
    // FIX: Tutte le chiamate a onReject e onApprove devono usare report?.id per l'ID,
    // ma se report è undefined, queste funzioni non dovrebbero essere chiamate.
    // Il rendering sottostante garantisce che queste azioni non siano visibili o cliccabili se report non c'è.

    const handleRejectClick = () => { setIsRejecting(true); setValidationError(""); setAssignmentWarning(""); };
    const handleCancelReject = () => { setIsRejecting(false); setRejectionReason(""); setValidationError(""); };

    const handleSubmitReject = async () => {
        if (!rejectionReason.trim()) {
            setValidationError("Please provide a reason.");
            return;
        }
        setValidationError("");
        try {
            const success = await onReject(report?.id, rejectionReason); // report?.id
            if (success) {
                showToast("Report rejected successfully.", "success");
                
                // Aggiorna lo stato nel genitore
                onReportUpdated(report?.id, { status: "Rejected", rejection_reason: rejectionReason }); // report?.id
                
                // Chiudiamo la modalità di editing del rifiuto, ma NON il modale intero
                setIsRejecting(false);
                
                // onHide(); // RIMOSSO: Mantiene il modale aperto
            } else {
                showToast("Failed to reject report.", "error");
            }
        } catch (err) {
            showToast(err.message || "Error rejecting report", "error");
        }
    };

    const handleApproveClick = async () => {
        try {
            const result = await onApprove(report?.id); // report?.id
            if (result && result.error) {
                showToast(result.error, "error");
                return;
            }
            showToast("Report accepted and assigned!", "success");
            
            // Aggiorna lo stato nel genitore
            onReportUpdated(report?.id, { status: "Assigned", assignee: result?.assignee || report.assignee }); // report?.id
            
            // onHide(); // RIMOSSO: Mantiene il modale aperto
            
        } catch (error) {
            showToast(error.message || "Approval error.", "error");
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const result = await updateReportStatus(report?.id, newStatus); // report?.id
            if (result?.error) throw new Error(result.error);

            if (onReportUpdated) onReportUpdated(report?.id, { status: newStatus }); // report?.id

            let message = `Status updated to ${newStatus}.`;
            let type = "success";
            if (newStatus === "Suspended") { type = "warning"; message = "Work on the report has been suspended."; }
            if (newStatus === "Resolved") { message = "Report successfully resolved!"; }

            showToast(message, type);

        } catch (error) {
            showToast(error.message || `Failed to update status`, "error");
        }
    };

    return (
        <div className="rdm-main-content d-flex flex-column">
            <div className="flex-grow-1">
                {/* Rejection Display */}
                {/* FIX: report?.status */}
                {report?.status === "Rejected" && (report.rejectionReason || report.rejection_reason) && (
                    <div className="rdm-section mt-0 mb-4">
                        <h3 className="rdm-section-title" style={{ color: "var(--rdm-danger)" }}>
                            <FaExclamationTriangle /> Reason for Rejection
                        </h3>
                        <div className="rdm-rejection-display">
                            {report.rejectionReason || report.rejection_reason}
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="rdm-section mt-0">
                    <h3 className="rdm-section-title"><FaInfoCircle /> Description</h3>
                    {/* FIX: report?.description */}
                    <div className="rdm-description-box">{report?.description || "No description provided."}</div>
                </div>

                {/* Evidence */}
                <div className="rdm-section">
                    <h3 className="rdm-section-title"><FaCamera /> Evidence ({photos.length})</h3>
                    {photos.length > 0 ? (
                        <div className="rdm-photo-grid">
                            {photos.map((photo, index) => (
                                <button
                                    key={photo}
                                    className="rdm-photo-card"
                                    onClick={() => onOpenImage(photo)}
                                >
                                    <img src={photo} alt={`Evidence ${index}`} loading="lazy" />
                                    <div className="rdm-photo-overlay"><span>View Fullscreen</span></div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted fst-italic mt-2">No images attached.</p>
                    )}
                </div>

                {/* Map */}
                <div className={`rdm-map-wrapper ${showMap ? "open" : ""}`}>
                    <h3 className="rdm-section-title mt-4"><FaMapMarkedAlt /> Map Location</h3>
                    <div className="rdm-map-container">
                        {showMap && mapCoordinates && (
                            <MapContainer center={mapCoordinates} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                                <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={mapCoordinates}>
                                    <Popup>
                                        <div className="rdm-map-popup">
                                            <strong>{report?.title}</strong><br /> {/* FIX: report?.title */}
                                            <a href={`http://googleusercontent.com/maps.google.com/?q=${mapCoordinates[0]},${mapCoordinates[1]}`} target="_blank" rel="noopener noreferrer" className="map-link" style={{ color: "var(--rdm-brand)", fontWeight: "bold" }}>
                                                <FaExternalLinkAlt style={{ marginRight: "5px" }} /> Open in Google Maps
                                            </a>
                                        </div>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        )}
                        {showMap && !mapCoordinates && (
                            <div className="d-flex align-items-center justify-content-center h-100 text-muted bg-light"><FaExclamationCircle className="me-2" /> Location unavailable</div>
                        )}
                    </div>
                </div>

                {/* === COMMENTS COMPONENT === */}
                {showComments && report && ( // FIX: Aggiunto controllo 'report &&'
                    <ReportComments reportId={report.id} currentUserId={currentUserId} showToast={showToast} />
                )}
            </div>

            {/* ACTION BUTTONS & FOOTER */}
            <div className="mt-3">
                {assignmentWarning && (
                    <div className="rdm-alert rdm-alert-warning mb-2 py-2 px-3">
                        <div className="d-flex align-items-center gap-2"><FaExclamationTriangle /><span className="small">{assignmentWarning}</span></div>
                    </div>
                )}
                {validationError && (
                    <div className="rdm-alert rdm-alert-error mb-2 py-2 px-3">
                        <div className="d-flex align-items-center gap-2"><FaExclamationCircle /><span className="small">{validationError}</span></div>
                    </div>
                )}
            </div>

            <div className="rdm-footer-section mt-4 pt-3 border-top">
                {isRejecting ? (
                    <div className="rdm-rejection-inline-container w-100 animate-fadeIn">
                        <div className="d-flex align-items-center mb-2 text-danger fw-bold small"><FaExclamationTriangle className="me-2" /> Rejecting Report</div>
                        <Form.Group className="mb-2">
                            <Form.Control
                                as="textarea"
                                className={`rdm-reject-textarea ${validationError ? "is-invalid" : ""}`}
                                rows={2}
                                placeholder="Reason..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                autoFocus
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <div className="rdm-id-text text-muted font-monospace fw-bold small">ID: #{report?.id}</div> {/* FIX: report?.id */}
                            <div className="d-flex gap-2">
                                <Button variant="secondary" size="sm" className="rdm-btn-action px-3" onClick={handleCancelReject}>Cancel</Button>
                                <Button variant="danger" size="sm" className="rdm-btn-action px-3" onClick={handleSubmitReject}>Confirm Reject</Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div className="rdm-id-text text-muted font-monospace fw-bold">ID: #{report?.id}</div> {/* FIX: report?.id */}
                        <div className="d-flex gap-2">
                            {/* FIX: report?.status */}
                            {canManage && report?.status === "Pending Approval" && (
                                <>
                                    <Button variant="outline-danger" className="rdm-btn-action" onClick={handleRejectClick}><FaTimesCircle className="me-2" /> Reject</Button>
                                    <Button variant="success" className="rdm-btn-action" onClick={handleApproveClick}><FaCheckCircle className="me-2" /> Accept & Assign</Button>
                                </>
                            )}
                            {isExternalAssignee && (
                                <>
                                    {/* FIX: report?.status */}
                                    {report?.status === "Assigned" && <Button className="rdm-btn-action rdm-btn-start" onClick={() => handleStatusChange("In Progress")}><FaPlay className="me-2" /> Start Work</Button>}
                                    {report?.status === "Suspended" && <Button className="rdm-btn-action rdm-btn-start" onClick={() => handleStatusChange("In Progress")}><FaPlay className="me-2" /> Resume Work</Button>}
                                    {report?.status === "In Progress" && (
                                        <>
                                            <Button className="rdm-btn-action rdm-btn-suspend" onClick={() => handleStatusChange("Suspended")}><FaPause className="me-2" /> Suspend</Button>
                                            <Button className="rdm-btn-action rdm-btn-resolve" onClick={() => handleStatusChange("Resolved")}><FaCheck className="me-2" /> Resolve</Button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

ReportMainContent.propTypes = {
    // ... Proptypes rimangono invariati
    // Oggetto Report
    report: PropTypes.shape({
        id: PropTypes.number.isRequired,
        status: PropTypes.string.isRequired,
        description: PropTypes.string,
        title: PropTypes.string,
        photos: PropTypes.array,
        images: PropTypes.array,
        rejectionReason: PropTypes.string,
        rejection_reason: PropTypes.string,
        externalAssigneeId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        assignee: PropTypes.object,
    }).isRequired,

    // Utente corrente (per role_name)
    user: PropTypes.shape({
        role_name: PropTypes.string,
    }),

    // ID Utente Corrente (per il confronto con externalAssigneeId)
    currentUserId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    // Handlers
    onApprove: PropTypes.func.isRequired,
    onReject: PropTypes.func.isRequired,
    onReportUpdated: PropTypes.func.isRequired,
    onOpenImage: PropTypes.func.isRequired,
    onHide: PropTypes.func.isRequired,
    showToast: PropTypes.func.isRequired,

    // Dati Mappa
    showMap: PropTypes.bool.isRequired,
    mapCoordinates: PropTypes.arrayOf(PropTypes.number),

    // Visibilità Commenti
    showComments: PropTypes.bool.isRequired,
};

ReportMainContent.defaultProps = {
    user: null,
    mapCoordinates: null,
    currentUserId: null,
};


export default ReportMainContent;